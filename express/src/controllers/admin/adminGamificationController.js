const Admin = require('../../models/Admin');

class AdminGamificationController {
  static async getAllBadges(req, res) {
    try {
      const badges = await Admin.getAllBadges();
      
      res.json({
        success: true,
        data: { badges }
      });
    } catch (error) {
      console.error('Error getting badges:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des badges'
      });
    }
  }

  static async createBadge(req, res) {
    try {
      const badgeData = req.body;
      const badge = await Admin.createBadge(badgeData);
      
      res.status(201).json({
        success: true,
        message: 'Badge créé avec succès',
        data: { badge }
      });
    } catch (error) {
      console.error('Error creating badge:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la création du badge'
      });
    }
  }

  static async updateBadge(req, res) {
    try {
      const { id } = req.params;
      const badgeData = req.body;
      
      const badge = await Admin.updateBadge(id, badgeData);
      
      if (!badge) {
        return res.status(404).json({
          success: false,
          error: 'Badge non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Badge mis à jour avec succès',
        data: { badge }
      });
    } catch (error) {
      console.error('Error updating badge:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour du badge'
      });
    }
  }

  static async deleteBadge(req, res) {
    try {
      const { id } = req.params;
      
      const badge = await Admin.deleteBadge(id);
      
      if (!badge) {
        return res.status(404).json({
          success: false,
          error: 'Badge non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Badge supprimé avec succès'
      });
    } catch (error) {
      console.error('Error deleting badge:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression du badge'
      });
    }
  }

  static async getAllChallenges(req, res) {
    try {
      const challenges = await Admin.getAllChallenges();
      
      res.json({
        success: true,
        data: { challenges }
      });
    } catch (error) {
      console.error('Error getting challenges:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des challenges'
      });
    }
  }

  static async createChallenge(req, res) {
    try {
      const challengeData = req.body;
      const challenge = await Admin.createChallenge(challengeData);
      
      res.status(201).json({
        success: true,
        message: 'Challenge créé avec succès',
        data: { challenge }
      });
    } catch (error) {
      console.error('Error creating challenge:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la création du challenge'
      });
    }
  }

  static async updateChallenge(req, res) {
    try {
      const { id } = req.params;
      const challengeData = req.body;
      
      const challenge = await Admin.updateChallenge(id, challengeData);
      
      if (!challenge) {
        return res.status(404).json({
          success: false,
          error: 'Challenge non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Challenge mis à jour avec succès',
        data: { challenge }
      });
    } catch (error) {
      console.error('Error updating challenge:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour du challenge'
      });
    }
  }

  static async deleteChallenge(req, res) {
    try {
      const { id } = req.params;
      
      const challenge = await Admin.deleteChallenge(id);
      
      if (!challenge) {
        return res.status(404).json({
          success: false,
          error: 'Challenge non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Challenge supprimé avec succès'
      });
    } catch (error) {
      console.error('Error deleting challenge:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression du challenge'
      });
    }
  }
}

module.exports = AdminGamificationController;