const { pool } = require('../../config/database');
const Subscription = require('../../models/Subscription');

class AdminSubscriptionController {
  // ✅ Récupérer tous les abonnements avec infos coach (CORRIGÉ)
  static async getAllSubscriptions(req, res) {
    try {
      console.log('📋 Récupération de tous les abonnements...');
      
      // ✅ Version sans EXTRACT (calcul des jours en JS)
      const query = `
        SELECT 
          s.*,
          u.first_name as user_first_name,
          u.last_name as user_last_name,
          u.email as user_email,
          c.first_name as coach_first_name,
          c.last_name as coach_last_name,
          c.email as coach_email,
          s.end_date
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN users c ON s.coach_id = c.id
        ORDER BY s.created_at DESC
      `;
      
      const result = await pool.query(query);
      
      // ✅ Calcul des jours restants en JavaScript
      const now = new Date();
      const subscriptions = result.rows.map(row => {
        const endDate = new Date(row.end_date);
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        return {
          ...row,
          days_remaining: daysRemaining
        };
      });
      
      res.json({
        success: true,
        data: { 
          subscriptions: subscriptions,
          count: subscriptions.length
        }
      });
    } catch (error) {
      console.error('❌ Error getting all subscriptions:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des abonnements: ' + error.message
      });
    }
  }

  // ✅ Récupérer les statistiques des abonnements (CORRIGÉ)
  static async getSubscriptionStats(req, res) {
    try {
      console.log('📊 Récupération des statistiques des abonnements...');
      
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' AND end_date > CURRENT_DATE THEN 1 END) as active,
          COUNT(CASE WHEN status = 'pending_renewal' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'cancelled' OR status = 'expired' OR end_date < CURRENT_DATE THEN 1 END) as expired,
          COUNT(CASE WHEN coach_id IS NOT NULL THEN 1 END) as with_coach,
          COUNT(CASE WHEN coach_id IS NULL THEN 1 END) as without_coach,
          ROUND(AVG(amount)::numeric, 2) as avg_amount,
          COALESCE(SUM(amount), 0) as total_amount
        FROM subscriptions
        WHERE status != 'cancelled' OR end_date > CURRENT_DATE - INTERVAL '30 days'
      `;
      
      const result = await pool.query(query);
      
      res.json({
        success: true,
        data: { 
          stats: result.rows[0] || { 
            total: 0, 
            active: 0, 
            pending: 0, 
            expired: 0, 
            with_coach: 0, 
            without_coach: 0, 
            avg_amount: 0, 
            total_amount: 0 
          }
        }
      });
    } catch (error) {
      console.error('❌ Error getting subscription stats:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques: ' + error.message
      });
    }
  }

  // ✅ Récupérer les abonnements expirant bientôt (CORRIGÉ)
  static async getExpiringSubscriptions(req, res) {
    try {
      const { days = 7 } = req.query;
      console.log(`📋 Récupération des abonnements expirant dans ${days} jours...`);
      
      const query = `
        SELECT 
          s.*,
          u.first_name as user_first_name,
          u.last_name as user_last_name,
          u.email as user_email,
          c.first_name as coach_first_name,
          c.last_name as coach_last_name,
          s.end_date
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN users c ON s.coach_id = c.id
        WHERE s.status = 'active' 
          AND s.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
        ORDER BY s.end_date ASC
      `;
      
      const result = await pool.query(query);
      
      // ✅ Calcul des jours restants en JavaScript
      const now = new Date();
      const subscriptions = result.rows.map(row => {
        const endDate = new Date(row.end_date);
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        return {
          ...row,
          days_remaining: daysRemaining
        };
      });
      
      res.json({
        success: true,
        data: { 
          subscriptions: subscriptions,
          count: subscriptions.length
        }
      });
    } catch (error) {
      console.error('❌ Error getting expiring subscriptions:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des abonnements expirant: ' + error.message
      });
    }
  }
}

module.exports = AdminSubscriptionController;