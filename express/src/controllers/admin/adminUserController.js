const Admin = require('../../models/Admin');
const bcrypt = require('bcryptjs');

class AdminUserController {
  // ✅ Récupérer tous les utilisateurs
  static async getAllUsers(req, res) {
    try {
      const { role, is_active, search } = req.query;
      const users = await Admin.getAllUsers({ role, is_active, search });
      
      res.json({
        success: true,
        data: { users }
      });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des utilisateurs'
      });
    }
  }

  // ✅ Récupérer un utilisateur par ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await Admin.getUserById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }
      
      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'utilisateur'
      });
    }
  }

  static async createUser(req, res) {
    try {
      const { first_name, last_name, email, password, role, is_active } = req.body;
      
      // Vérifier si l'email existe déjà
      const existingUser = await Admin.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Un utilisateur avec cet email existe déjà'
        });
      }
      
      // Hasher le mot de passe
      const passwordHash = await bcrypt.hash(password, 10);
      
      const user = await Admin.createUser({
        first_name,
        last_name,
        email,
        password_hash: passwordHash,
        role: role || 'adherent',
        is_active: is_active !== undefined ? is_active : true
      });
      
      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: { user }
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de l\'utilisateur'
      });
    }
  }

  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;
      
      // Si un nouveau mot de passe est fourni, le hasher
      if (userData.password) {
        userData.password_hash = await bcrypt.hash(userData.password, 10);
        delete userData.password;
      }
      
      const user = await Admin.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Utilisateur mis à jour avec succès',
        data: { user }
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour de l\'utilisateur'
      });
    }
  }

  // ✅ Supprimer un utilisateur
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      const user = await Admin.deleteUser(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Utilisateur supprimé avec succès'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression de l\'utilisateur'
      });
    }
  }

  // ✅ Activer/Désactiver un utilisateur
  static async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      
      const user = await Admin.toggleUserStatus(id, is_active);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: `Utilisateur ${is_active ? 'activé' : 'désactivé'} avec succès`,
        data: { user }
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du changement de statut de l\'utilisateur'
      });
    }
  }
}

module.exports = AdminUserController;