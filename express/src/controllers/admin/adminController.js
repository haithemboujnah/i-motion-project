const Admin = require('../../models/Admin');

class AdminController {
  // ✅ Dashboard Admin
  static async getDashboard(req, res) {
    try {
      const stats = await Admin.getGlobalStats();
      
      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error('Error getting admin dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du tableau de bord'
      });
    }
  }

  // ✅ Statistiques globales
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
}

module.exports = AdminController;