const Coach = require('../../models/Coach');

class CoachAdherentController {
  // ✅ Récupérer les adhérents
  static async getAdherents(req, res) {
    try {
      const coachId = req.user.userId;
      const adherents = await Coach.getAdherents(coachId);
      
      res.json({
        success: true,
        data: { adherents }
      });
    } catch (error) {
      console.error('Error getting adherents:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des adhérents'
      });
    }
  }

  // ✅ Récupérer les détails d'un adhérent
  static async getAdherentDetail(req, res) {
    try {
      const coachId = req.user.userId;
      const { adherentId } = req.params;
      
      const adherent = await Coach.getAdherentDetail(coachId, adherentId);
      
      if (!adherent) {
        return res.status(404).json({
          success: false,
          error: 'Adhérent non trouvé'
        });
      }
      
      res.json({
        success: true,
        data: { adherent }
      });
    } catch (error) {
      console.error('Error getting adherent detail:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des détails'
      });
    }
  }

  // ✅ Récupérer les adhérents à risque
  static async getAtRiskAdherents(req, res) {
    try {
      const coachId = req.user.userId;
      const adherents = await Coach.getAtRiskAdherents(coachId);
      
      res.json({
        success: true,
        data: { adherents }
      });
    } catch (error) {
      console.error('Error getting at-risk adherents:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des adhérents à risque'
      });
    }
  }

  // ✅ Générer des recommandations pour un adhérent
  static async getRecommendations(req, res) {
    try {
      const { adherentId } = req.params;
      const recommendations = await Coach.getRecommendations(adherentId);
      
      res.json({
        success: true,
        data: { recommendations }
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la génération des recommandations'
      });
    }
  }

  static async getAlertHistory(req, res) {
    try {
      const { adherentId } = req.params;
      const { limit = 20 } = req.query;
      
      const alerts = await Coach.getAlertHistory(adherentId, parseInt(limit));
      
      res.json({
        success: true,
        data: { alerts }
      });
    } catch (error) {
      console.error('Error getting alert history:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'historique des alertes'
      });
    }
  }

  // ✅ Marquer une alerte comme lue
  static async markAlertAsRead(req, res) {
    try {
      const { alertId } = req.params;
      
      const alert = await Coach.markAlertAsRead(alertId);
      
      if (!alert) {
        return res.status(404).json({
          success: false,
          error: 'Alerte non trouvée'
        });
      }
      
      res.json({
        success: true,
        message: 'Alerte marquée comme lue',
        data: { alert }
      });
    } catch (error) {
      console.error('Error marking alert as read:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du marquage de l\'alerte'
      });
    }
  }
}

module.exports = CoachAdherentController;