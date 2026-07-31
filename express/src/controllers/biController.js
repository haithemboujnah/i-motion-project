const BIModel = require('../models/BIModel');

class BIController {
  // ✅ Tableau de bord complet
  static async getDashboard(req, res) {
    try {
      const [
        kpis,
        revenue,
        retention,
        peakHours,
        weeklyActivity,
        sessionTypes,
        satisfaction,
        forecast,
        ageDistribution,
        goalDistribution,
        conversionRate,
        revenueByPlan
      ] = await Promise.all([
        BIModel.getKPIs(),
        BIModel.getRevenue(),
        BIModel.getRetention(),
        BIModel.getPeakHours(),
        BIModel.getWeeklyActivity(),
        BIModel.getSessionTypes(),
        BIModel.getSatisfaction(),
        BIModel.getForecast(),
        BIModel.getAgeDistribution(),
        BIModel.getGoalDistribution(),
        BIModel.getConversionRate(),
        BIModel.getRevenueByPlan()
      ]);

      res.json({
        success: true,
        data: {
          kpis,
          revenue,
          retention,
          peakHours,
          weeklyActivity,
          sessionTypes,
          satisfaction,
          forecast,
          ageDistribution,
          goalDistribution,
          conversionRate,
          revenueByPlan
        }
      });
    } catch (error) {
      console.error('Error getting BI dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des données BI'
      });
    }
  }

  // ✅ KPIs uniquement
  static async getKPIs(req, res) {
    try {
      const kpis = await BIModel.getKPIs();
      res.json({
        success: true,
        data: { kpis }
      });
    } catch (error) {
      console.error('Error getting KPIs:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des KPIs'
      });
    }
  }

  // ✅ Chiffre d'affaires
  static async getRevenue(req, res) {
    try {
      const revenue = await BIModel.getRevenue();
      res.json({
        success: true,
        data: { revenue }
      });
    } catch (error) {
      console.error('Error getting revenue:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du chiffre d\'affaires'
      });
    }
  }

  // ✅ Taux de renouvellement
  static async getRetention(req, res) {
    try {
      const retention = await BIModel.getRetention();
      res.json({
        success: true,
        data: { retention }
      });
    } catch (error) {
      console.error('Error getting retention:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du taux de renouvellement'
      });
    }
  }

  // ✅ Heures de pointe
  static async getPeakHours(req, res) {
    try {
      const peakHours = await BIModel.getPeakHours();
      res.json({
        success: true,
        data: { peakHours }
      });
    } catch (error) {
      console.error('Error getting peak hours:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des heures de pointe'
      });
    }
  }
}

module.exports = BIController;