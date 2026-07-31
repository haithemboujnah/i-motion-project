const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class User {
  static async create(userData) {
    const { email, password, first_name, last_name, role = 'adherent' } = userData;
    const passwordHash = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, password_hash, first_name, last_name, role, created_at, is_active
    `;
    
    const values = [email, passwordHash, first_name, last_name, role];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, email, password_hash, first_name, last_name, role, is_active, created_at, last_login FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateLastLogin(id) {
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1';
    await pool.query(query, [id]);
  }

  static async update(id, userData) {
    const { first_name, last_name, email } = userData;
    
    const query = `
      UPDATE users 
      SET first_name = $1, last_name = $2, email = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, email, first_name, last_name, role, is_active, created_at, last_login
    `;
    
    const result = await pool.query(query, [first_name, last_name, email, id]);
    return result.rows[0];
  }

  static async updatePassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const query = 'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    await pool.query(query, [passwordHash, id]);
    return true;
  }

  static async comparePassword(plainPassword, hashedPassword) {
    if (!hashedPassword) {
      console.error('❌ No password hash provided for comparison');
      return false;
    }
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('❌ Error comparing passwords:', error);
      return false;
    }
  }

  // Vérifier si un utilisateur a un mot de passe défini
  static async hasPassword(id) {
    const query = 'SELECT password_hash FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return false;
    return result.rows[0].password_hash !== null && result.rows[0].password_hash !== '';
  }

  static async createResetToken(email) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 heure
    
    const query = `
      UPDATE users 
      SET reset_token = $1, reset_token_expires = $2 
      WHERE email = $3 
      RETURNING id, email, first_name, last_name, reset_token
    `;
    const result = await pool.query(query, [token, expiresAt, email]);
    return result.rows[0];
  }

  // ✅ Vérifier un token de réinitialisation
  static async verifyResetToken(token) {
    const query = `
      SELECT * FROM users 
      WHERE reset_token = $1 
        AND reset_token_expires > NOW()
        AND is_active = true
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }

  // ✅ Effacer le token après réinitialisation
  static async clearResetToken(userId) {
    const query = `
      UPDATE users 
      SET reset_token = NULL, reset_token_expires = NULL 
      WHERE id = $1
    `;
    await pool.query(query, [userId]);
  }
}

module.exports = User;