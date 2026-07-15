const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');

class AuthService {
  static generateToken(userId, email, role) {
    return jwt.sign(
      { userId, email, role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
  }

  static async register(userData) {
    const existingUser = await User.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    const newUser = await User.create(userData);
    const token = this.generateToken(newUser.id, newUser.email, newUser.role);
    
    // Ne pas renvoyer le mot de passe hash
    const { password_hash, ...userWithoutPassword } = newUser;
    
    return { user: userWithoutPassword, token };
  }

  static async login(email, password) {
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    if (!user.is_active) {
      throw new Error('Ce compte est désactivé');
    }

    // Vérifier que le mot de passe hash existe
    if (!user.password_hash) {
      console.error('❌ User has no password hash:', { email: user.email });
      throw new Error('Ce compte n\'a pas de mot de passe configuré. Veuillez contacter l\'administrateur.');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Email ou mot de passe incorrect');
    }

    await User.updateLastLogin(user.id);

    const token = this.generateToken(user.id, user.email, user.role);
    const { password_hash, ...userWithoutPassword } = user;
    
    return { user: userWithoutPassword, token };
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      throw new Error('Token invalide ou expiré');
    }
  }
}

module.exports = AuthService;