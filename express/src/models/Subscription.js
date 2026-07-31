const { pool } = require('../config/database');

class Subscription {
  // ✅ Créer un abonnement
  static async create(subscriptionData) {
    const { 
      user_id, stripe_subscription_id, stripe_customer_id,
      plan_type, amount, status, start_date, end_date 
    } = subscriptionData;
    
    const query = `
      INSERT INTO subscriptions (
        user_id, stripe_subscription_id, stripe_customer_id,
        plan_type, amount, status, start_date, end_date, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [
      user_id, stripe_subscription_id, stripe_customer_id,
      plan_type, amount, status, start_date, end_date
    ];
    
    const result = await pool.query(query, values);
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
      SET end_date = $1, updated_at = CURRENT_TIMESTAMP
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
}

module.exports = Subscription;