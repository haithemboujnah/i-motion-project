const { pool } = require('../config/database');

class Subscription {
  // ✅ Créer un abonnement
  static async create(subscriptionData) {
    const { 
      user_id, stripe_subscription_id, stripe_customer_id,
      plan_type, plan_name, amount, currency, status, 
      start_date, end_date, sessions_total, sessions_used, sessions_remaining
    } = subscriptionData;
    
    const query = `
      INSERT INTO subscriptions (
        user_id, stripe_subscription_id, stripe_customer_id,
        plan_type, plan_name, amount, currency, status, 
        start_date, end_date, sessions_total, sessions_used, sessions_remaining,
        renewal_count, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [
      user_id, stripe_subscription_id || null, stripe_customer_id || null,
      plan_type, plan_name || plan_type, amount, currency || 'eur', status || 'active',
      start_date, end_date, sessions_total || null, sessions_used || 0, sessions_remaining || sessions_total || null,
      0
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ✅ Récupérer un abonnement par ID
  static async findById(id) {
    const query = `
      SELECT * FROM subscriptions 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // ✅ Récupérer l'abonnement d'un utilisateur
  static async findByUserId(userId) {
    console.log(`🔍 Recherche d'abonnement pour l'utilisateur ${userId}`);
    
    const query = `
      SELECT * FROM subscriptions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    const result = await pool.query(query, [userId]);
    console.log('📊 Résultat de la recherche:', result.rows[0] || 'Aucun abonnement');
    
    return result.rows[0];
  }

  // ✅ Mettre à jour le statut d'un abonnement
  static async updateStatus(subscriptionId, status) {
    console.log(`🔄 Mise à jour du statut: subscriptionId=${subscriptionId}, status=${status}`);
    
    const query = `
      UPDATE subscriptions 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, subscriptionId]);
    console.log('📊 Résultat de la mise à jour:', result.rows[0]);
    
    if (result.rows.length === 0) {
      console.log('⚠️ Aucun abonnement mis à jour');
      return null;
    }
    
    return result.rows[0];
  }

  // ✅ Récupérer tous les abonnements actifs
  static async getActiveSubscriptions() {
    const query = `
      SELECT s.*, u.first_name, u.last_name, u.email
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'active' 
        AND s.end_date > CURRENT_DATE
      ORDER BY s.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // ✅ Renouveler un abonnement
  static async renewSubscription(subscriptionId, newEndDate) {
    const query = `
      UPDATE subscriptions 
      SET end_date = $1, 
          status = 'active',
          renewal_count = renewal_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [newEndDate, subscriptionId]);
    return result.rows[0];
  }

  // ✅ Annuler un abonnement (changement de statut)
  static async cancelSubscription(subscriptionId) {
    const query = `
      UPDATE subscriptions 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [subscriptionId]);
    return result.rows[0];
  }

  // ✅ Récupérer les abonnements expirant bientôt (SANS DATE_PART)
  static async getExpiringSubscriptions(daysBeforeExpiry = 7) {
    const query = `
      SELECT 
        s.*,
        u.first_name,
        u.last_name,
        u.email,
        s.end_date
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'active' 
        AND s.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${daysBeforeExpiry} days'
      ORDER BY s.end_date ASC
    `;
    const result = await pool.query(query);
    
    // Calcul des jours restants en JavaScript
    const now = new Date();
    return result.rows.map(row => {
      const endDate = new Date(row.end_date);
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      return {
        ...row,
        days_remaining: daysRemaining
      };
    });
  }

  // ✅ Récupérer les abonnements expirés (SANS DATE_PART)
  static async getExpiredSubscriptions() {
    const query = `
      SELECT 
        s.*,
        u.first_name,
        u.last_name,
        u.email,
        s.end_date
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'active' 
        AND s.end_date < CURRENT_DATE
      ORDER BY s.end_date ASC
    `;
    const result = await pool.query(query);
    
    const now = new Date();
    return result.rows.map(row => {
      const endDate = new Date(row.end_date);
      const daysExpired = Math.ceil((now - endDate) / (1000 * 60 * 60 * 24));
      return {
        ...row,
        days_expired: daysExpired
      };
    });
  }

  // ✅ Demander un renouvellement
  static async requestRenewal(subscriptionId) {
    const query = `
      UPDATE subscriptions 
      SET status = 'pending_renewal', 
          renewal_requested_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [subscriptionId]);
    return result.rows[0];
  }

  // ✅ Approuver un renouvellement
  static async approveRenewal(subscriptionId, newEndDate) {
    const query = `
      UPDATE subscriptions 
      SET status = 'active', 
          end_date = $1,
          renewal_approved_at = CURRENT_TIMESTAMP,
          renewal_count = renewal_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [newEndDate, subscriptionId]);
    return result.rows[0];
  }

  // ✅ Rejeter un renouvellement
  static async rejectRenewal(subscriptionId) {
    const query = `
      UPDATE subscriptions 
      SET status = 'renewal_rejected',
          renewal_rejected_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [subscriptionId]);
    return result.rows[0];
  }

  // ✅ Récupérer les demandes de renouvellement en attente (VERSION CORRIGÉE)
  static async getPendingRenewals() {
    try {
      // Version 1: Requête simple sans calcul de jours
      const query = `
        SELECT 
          s.*,
          u.first_name,
          u.last_name,
          u.email
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        WHERE s.status = 'pending_renewal'
        ORDER BY s.renewal_requested_at ASC
      `;
      const result = await pool.query(query);
      
      // Calcul des jours restants en JavaScript
      const now = new Date();
      return result.rows.map(row => {
        const endDate = new Date(row.end_date);
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        return {
          ...row,
          days_remaining: daysRemaining
        };
      });
    } catch (error) {
      console.error('❌ Erreur dans getPendingRenewals:', error);
      // En cas d'erreur, retourner un tableau vide
      return [];
    }
  }

  // ✅ Mettre à jour les séances utilisées (pour les forfaits)
  static async updateSessionsUsed(subscriptionId, sessionsUsed) {
    const query = `
      UPDATE subscriptions 
      SET sessions_used = $1,
          sessions_remaining = sessions_total - $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [sessionsUsed, subscriptionId]);
    return result.rows[0];
  }
}

module.exports = Subscription;