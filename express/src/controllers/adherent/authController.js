const AuthService = require('../../auth/services/authService');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const { pool } = require('../../config/database');
const Notification = require('../../models/Notification');
const EmailService = require('../../services/emailService');
const crypto = require('crypto');

class AuthController {
  static async register(req, res) {
    try {
      req.body.role = 'adherent';
      
      const { user, token } = await AuthService.register(req.body);
      
      // Créer le profil par défaut
      const defaultProfile = {
        age: null,
        weight: null,
        height: null,
        goal: 'remise_en_forme',
        level: 'debutant',
        medical_conditions: null
      };
      await Profile.create(user.id, defaultProfile);
      
      // ✅ Envoyer email de bienvenue (en arrière-plan)
      EmailService.sendWelcome(user).catch(error => {
        console.error('❌ Erreur envoi email de bienvenue:', error);
      });
      
      res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        data: { user, token }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const { user, token } = await AuthService.login(email, password);
      
      res.json({
        success: true,
        message: 'Connexion réussie',
        data: { user, token }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  }

  static async getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.user.userId);
      const profile = await Profile.findByUserId(req.user.userId);
      
      res.json({
        success: true,
        data: { user, profile }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la récupération du profil'
      });
    }
  }

  static async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { first_name, last_name, age, weight, height, goal, level, medical_conditions } = req.body;
      
      // ✅ 1. Mettre à jour l'utilisateur (first_name, last_name)
      const userData = {
        first_name,
        last_name,
        email: req.user.email // On garde l'email actuel
      };
      
      const updatedUser = await User.update(userId, userData);
      
      const profileData = {
        age,
        weight,
        height,
        goal,
        level,
        medical_conditions
      };
      
      // Vérifier si le profil existe
      const existingProfile = await Profile.findByUserId(userId);
      let updatedProfile;
      
      if (existingProfile) {
        updatedProfile = await Profile.update(userId, profileData);
      } else {
        updatedProfile = await Profile.create(userId, profileData);
      }
      
      res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: { 
          user: updatedUser,
          profile: updatedProfile 
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Erreur lors de la mise à jour du profil'
      });
    }
  }

  static async changePassword(req, res) {
    try {
      const userId = req.user.userId;
      const { current_password, new_password } = req.body;
      
      const user = await User.findById(userId);
      const isValid = await User.comparePassword(current_password, user.password_hash);
      
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'Mot de passe actuel incorrect'
        });
      }
      
      await User.updatePassword(userId, new_password);
      
      res.json({
        success: true,
        message: 'Mot de passe modifié avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // ✅ Mot de passe oublié - Demander la réinitialisation
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Aucun compte trouvé avec cet email'
        });
      }
      
      // Créer le token
      const userWithToken = await User.createResetToken(email);
      
      if (!userWithToken) {
        return res.status(400).json({
          success: false,
          error: 'Erreur lors de la création du token'
        });
      }
      
      // Envoyer l'email
      const emailResult = await EmailService.sendPasswordReset(user, userWithToken.reset_token);
      
      if (!emailResult.success) {
        console.error('❌ Erreur envoi email:', emailResult.error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de l\'envoi de l\'email'
        });
      }
      
      res.json({
        success: true,
        message: 'Un email de réinitialisation a été envoyé'
      });
    } catch (error) {
      console.error('Error in forgotPassword:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du traitement de la demande'
      });
    }
  }

  // ✅ Réinitialiser le mot de passe
  static async resetPassword(req, res) {
    try {
      const { token, new_password } = req.body;
      
      // Vérifier le token
      const user = await User.verifyResetToken(token);
      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Token invalide ou expiré'
        });
      }
      
      // Mettre à jour le mot de passe
      await User.updatePassword(user.id, new_password);
      
      // Effacer le token
      await User.clearResetToken(user.id);
      
      res.json({
        success: true,
        message: 'Mot de passe réinitialisé avec succès'
      });
    } catch (error) {
      console.error('Error in resetPassword:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la réinitialisation du mot de passe'
      });
    }
  }

  // ✅ Valider un token de réinitialisation
  static async validateResetToken(req, res) {
    try {
      const { token } = req.params;
      
      const query = `
        SELECT id, email, first_name, last_name 
        FROM users 
        WHERE reset_token = $1 
        AND reset_token_expires > NOW()
        AND is_active = true
      `;
      const result = await pool.query(query, [token]);
      const user = result.rows[0];
      
      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Token invalide ou expiré'
        });
      }
      
      res.json({
        success: true,
        message: 'Token valide',
        data: { email: user.email }
      });
    } catch (error) {
      console.error('Error validating token:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la validation du token'
      });
    }
  }
}

module.exports = AuthController;