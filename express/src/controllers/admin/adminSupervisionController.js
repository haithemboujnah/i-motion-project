const Admin = require('../../models/Admin');

class AdminSupervisionController {
  // ✅ Activités récentes
  static async getRecentActivities(req, res) {
    try {
      const { limit = 20 } = req.query;
      const activities = await Admin.getRecentActivities(parseInt(limit));
      
      res.json({
        success: true,
        data: { activities }
      });
    } catch (error) {
      console.error('Error getting recent activities:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des activités récentes'
      });
    }
  }

  // ✅ Statistiques par club
  static async getClubStats(req, res) {
    try {
      const stats = await Admin.getClubStats();
      
      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error('Error getting club stats:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques par club'
      });
    }
  }

  // ✅ Export CSV
  static async exportCSV(req, res) {
    try {
      const { type } = req.query;
      let data = [];
      
      if (type === 'users') {
        data = await Admin.getAllUsers();
      } else if (type === 'sessions') {
        const { pool } = require('../../config/database');
        const query = `
          SELECT s.*, u.first_name, u.last_name 
          FROM sessions s
          LEFT JOIN users u ON s.adherent_id = u.id
          ORDER BY s.created_at DESC
        `;
        const result = await pool.query(query);
        data = result.rows;
      } else if (type === 'programs') {
        data = await Admin.getAllPrograms();
      }
      
      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Aucune donnée à exporter'
        });
      }
      
      // Créer le CSV
      const headers = Object.keys(data[0]);
      let csv = headers.join(',') + '\n';
      data.forEach(row => {
        csv += headers.map(h => {
          const value = row[h] || '';
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',') + '\n';
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=export_${type}_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'export CSV'
      });
    }
  }
}

module.exports = AdminSupervisionController;