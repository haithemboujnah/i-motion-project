const Coach = require('../../models/Coach');
const { pool } = require('../../config/database');

class CoachController {
  static async getDashboard(req, res) {
    try {
      const coachId = req.user.userId;
      const stats = await Coach.getStats(coachId);
      
      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error('Error getting coach dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du tableau de bord'
      });
    }
  }

  // ✅ Statistiques du coach
  static async getStats(req, res) {
    try {
      const coachId = req.user.userId;
      const stats = await Coach.getStats(coachId);
      
      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error('Error getting coach stats:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques'
      });
    }
  }

  // ✅ Statistiques de groupe (NOUVEAU)
  static async getGroupStats(req, res) {
    try {
      const coachId = req.user.userId;
      
      const query = `
        WITH adherent_stats AS (
          SELECT 
            s.adherent_id,
            COUNT(*) as total_sessions,
            COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_sessions,
            MAX(s.date) as last_session_date,
            CASE 
              WHEN MAX(s.date) < CURRENT_DATE - INTERVAL '30 days' THEN 'Critique'
              WHEN MAX(s.date) < CURRENT_DATE - INTERVAL '15 days' THEN 'Moyen'
              WHEN COUNT(CASE WHEN s.status = 'completed' THEN 1 END)::float / NULLIF(COUNT(*), 0) < 0.3 THEN 'Critique'
              WHEN COUNT(CASE WHEN s.status = 'completed' THEN 1 END)::float / NULLIF(COUNT(*), 0) < 0.5 THEN 'Moyen'
              ELSE 'Faible'
            END as risk_level
          FROM sessions s
          WHERE s.coach_id = $1 AND s.adherent_id IS NOT NULL
          GROUP BY s.adherent_id
        )
        SELECT 
          COUNT(DISTINCT adherent_id) as total_adherents,
          COUNT(CASE WHEN risk_level = 'Critique' THEN 1 END) as critical_count,
          COUNT(CASE WHEN risk_level = 'Moyen' THEN 1 END) as medium_count,
          COUNT(CASE WHEN risk_level = 'Faible' THEN 1 END) as low_count,
          COALESCE(ROUND(AVG(total_sessions)::numeric, 1), 0) as avg_sessions,
          COALESCE(ROUND(AVG(CASE WHEN total_sessions > 0 THEN completed_sessions::float / total_sessions * 100 ELSE 0 END)::numeric, 1), 0) as avg_attendance
        FROM adherent_stats
      `;
      const result = await pool.query(query, [coachId]);
      
      res.json({
        success: true,
        data: { stats: result.rows[0] || {} }
      });
    } catch (error) {
      console.error('Error getting group stats:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques de groupe'
      });
    }
  }
}

module.exports = CoachController;