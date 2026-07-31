const { pool } = require('../config/database');

class Feedback {
  // ✅ Créer un feedback
  static async create(feedbackData) {
    const { 
      adherent_id, type, category, subject, message,
      rating, priority
    } = feedbackData;

    const query = `
      INSERT INTO feedbacks (
        adherent_id, type, category, subject, message,
        rating, priority, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [adherent_id, type, category, subject, message, rating, priority];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ✅ Récupérer tous les feedbacks
  static async getAll(filters = {}) {
    let query = `
      SELECT 
        f.*,
        u.first_name,
        u.last_name,
        u.email
      FROM feedbacks f
      JOIN users u ON f.adherent_id = u.id
      WHERE 1=1
    `;
    const values = [];
    let index = 1;

    if (filters.status) {
      query += ` AND f.status = $${index}`;
      values.push(filters.status);
      index++;
    }

    if (filters.type) {
      query += ` AND f.type = $${index}`;
      values.push(filters.type);
      index++;
    }

    if (filters.category) {
      query += ` AND f.category = $${index}`;
      values.push(filters.category);
      index++;
    }

    if (filters.priority) {
      query += ` AND f.priority = $${index}`;
      values.push(filters.priority);
      index++;
    }

    query += ' ORDER BY f.created_at DESC';
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  // ✅ Récupérer un feedback par ID
  static async getById(id) {
    const query = `
      SELECT 
        f.*,
        u.first_name,
        u.last_name,
        u.email
      FROM feedbacks f
      JOIN users u ON f.adherent_id = u.id
      WHERE f.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // ✅ Mettre à jour le statut (CORRIGÉ avec CAST explicite)
  static async updateStatus(id, status, admin_response = null) {
    const query = `
      UPDATE feedbacks 
      SET status = $1::varchar, 
          admin_response = $2,
          resolved_at = CASE WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP ELSE NULL END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [status, admin_response, id]);
    return result.rows[0];
  }

  // ✅ Récupérer les statistiques
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN type = 'complaint' THEN 1 END) as complaints,
        COUNT(CASE WHEN type = 'suggestion' THEN 1 END) as suggestions,
        COUNT(CASE WHEN type = 'compliment' THEN 1 END) as compliments,
        ROUND(AVG(rating)::numeric, 2) as avg_rating,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority
      FROM feedbacks
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }

  // ✅ Récupérer les feedbacks d'un adhérent
  static async getByAdherent(adherentId) {
    const query = `
      SELECT * FROM feedbacks 
      WHERE adherent_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [adherentId]);
    return result.rows;
  }

  // ✅ Supprimer un feedback
  static async delete(id) {
    const query = 'DELETE FROM feedbacks WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Feedback;