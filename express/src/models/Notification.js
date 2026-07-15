const { pool } = require('../config/database');

class Notification {
  // ✅ Créer une notification (avec vérification du rôle)
  static async create(notificationData) {
    const { user_id, title, message, type, link } = notificationData;
    
    const query = `
      INSERT INTO notifications (user_id, title, message, type, link, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [user_id, title, message, type, link];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ✅ Récupérer les notifications d'un utilisateur
  static async findByUserId(userId, limit = 20) {
    const query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  // ✅ Récupérer les notifications par type
  static async findByType(userId, type) {
    const query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 AND type = $2
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId, type]);
    return result.rows;
  }

  // ✅ Récupérer les notifications non lues pour tous les utilisateurs (Admin)
  static async getAllUnread() {
    const query = `
      SELECT n.*, u.first_name, u.last_name, u.email, u.role
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE n.is_read = false
      ORDER BY n.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // ✅ Marquer une notification comme lue
  static async markAsRead(id) {
    const query = `
      UPDATE notifications 
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // ✅ Marquer toutes les notifications comme lues
  static async markAllAsRead(userId) {
    const query = `
      UPDATE notifications 
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_read = false
      RETURNING *
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // ✅ Marquer toutes les notifications comme lues (Admin)
  static async markAllAsReadGlobal() {
    const query = `
      UPDATE notifications 
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE is_read = false
      RETURNING *
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // ✅ Compter les notifications non lues
  static async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = $1 AND is_read = false
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  // ✅ Compter toutes les notifications non lues (Admin)
  static async getTotalUnreadCount() {
    const query = `
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE is_read = false
    `;
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }

  // ✅ Supprimer une notification
  static async delete(id) {
    const query = 'DELETE FROM notifications WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getUnreadByType(userId, type) {
    const query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 AND type = $2 AND is_read = false
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId, type]);
    return result.rows;
  }

  // ✅ Créer une notification de rappel de séance
  static async createSessionReminder(userId, session) {
    const reminder = {
      user_id: userId,
      title: '⏰ Rappel de séance',
      message: `Vous avez une séance ${session.type} demain à ${session.time}`,
      type: 'session_reminder',
      link: `/sessions/${session.id}`
    };
    return this.create(reminder);
  }

  // ✅ Créer une notification de badge débloqué
  static async createBadgeNotification(userId, badge) {
    const notification = {
      user_id: userId,
      title: '🏆 Nouveau badge débloqué !',
      message: `Félicitations ! Vous avez débloqué le badge "${badge.name}"`,
      type: 'achievement',
      link: '/gamification'
    };
    return this.create(notification);
  }

  // ✅ Créer une notification pour le Coach (nouvel adhérent)
  static async createNewAdherentNotification(coachId, adherent) {
    const notification = {
      user_id: coachId,
      title: '👤 Nouvel adhérent assigné',
      message: `${adherent.first_name} ${adherent.last_name} vous a été assigné`,
      type: 'new_adherent',
      link: `/coach/adherents/${adherent.id}`
    };
    return this.create(notification);
  }

  // ✅ Créer une notification pour le Coach (alerte churn)
  static async createChurnAlertNotification(coachId, adherent, riskLevel) {
    const notification = {
      user_id: coachId,
      title: '🚨 Alerte churn',
      message: `${adherent.first_name} ${adherent.last_name} est à risque ${riskLevel}`,
      type: 'adherent_risk',
      link: `/coach/adherents/${adherent.id}`
    };
    return this.create(notification);
  }
}

module.exports = Notification;