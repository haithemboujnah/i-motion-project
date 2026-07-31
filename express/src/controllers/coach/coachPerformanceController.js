const Coach = require('../../models/Coach');

class CoachPerformanceController {
  static async getAdherentPerformances(req, res) {
    try {
      const coachId = req.user.userId;
      const { period = '30 days' } = req.query;
      
      // Valider la période
      const validPeriods = ['7 days', '14 days', '30 days', '60 days', '90 days'];
      const validPeriod = validPeriods.includes(period) ? period : '30 days';
      
      const performances = await Coach.getAdherentPerformances(coachId, validPeriod);
      
      // Récupérer aussi les statistiques
      const stats = await Coach.getAdherentPerformanceStats(coachId);
      
      res.json({
        success: true,
        data: { 
          performances,
          stats
        }
      });
    } catch (error) {
      console.error('Error getting adherent performances:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des performances'
      });
    }
  }

  // ✅ Récupérer les statistiques des performances
  static async getPerformanceStats(req, res) {
    try {
      const coachId = req.user.userId;
      const stats = await Coach.getAdherentPerformanceStats(coachId);
      
      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error('Error getting performance stats:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques'
      });
    }
  }
}

module.exports = CoachPerformanceController;