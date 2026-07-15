const Admin = require('../../models/Admin');

class AdminAnalyticsController {
  static async getGlobalStats(req, res) {
    try {
      const stats = await Admin.getGlobalStats();
      
      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error('Error getting global stats:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques globales'
      });
    }
  }

  static async getRiskAnalysis(req, res) {
    try {
      const analysis = await Admin.getRiskAnalysis();
      
      res.json({
        success: true,
        data: { analysis }
      });
    } catch (error) {
      console.error('Error getting risk analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'analyse des risques'
      });
    }
  }

  static async getPrediction(req, res) {
    try {
      const prediction = await Admin.getPrediction();
      
      res.json({
        success: true,
        data: { prediction }
      });
    } catch (error) {
      console.error('Error getting prediction:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des prédictions'
      });
    }
  }

  static async getRetentionReport(req, res) {
    try {
      const report = await Admin.getRetentionReport();
      
      res.json({
        success: true,
        data: { report }
      });
    } catch (error) {
      console.error('Error getting retention report:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la génération du rapport de fidélisation'
      });
    }
  }
}

module.exports = AdminAnalyticsController;