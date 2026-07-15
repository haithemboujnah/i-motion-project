const { pool } = require('../config/database');

class Conversation {
  // ✅ Créer une nouvelle conversation
  static async create(userId, title = null) {
    const query = `
      INSERT INTO conversations (user_id, title, created_at, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, title || 'Nouvelle conversation']);
    return result.rows[0];
  }

  // ✅ Récupérer toutes les conversations d'un utilisateur
  static async findByUserId(userId) {
    const query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id) as message_count,
        (SELECT message FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM conversations c
      WHERE c.user_id = $1
      ORDER BY c.updated_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // ✅ Récupérer une conversation par ID
  static async findById(id, userId) {
    const query = `
      SELECT * FROM conversations 
      WHERE id = $1 AND user_id = $2
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  // ✅ Mettre à jour le titre d'une conversation
  static async updateTitle(id, title) {
    const query = `
      UPDATE conversations 
      SET title = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [title, id]);
    return result.rows[0];
  }

  // ✅ Supprimer une conversation
  static async delete(id, userId) {
    const query = `
      DELETE FROM conversations 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  // ✅ Récupérer ou créer une conversation par défaut
  static async getOrCreateDefault(userId) {
    const query = `
      SELECT * FROM conversations 
      WHERE user_id = $1 
      ORDER BY updated_at DESC 
      LIMIT 1
    `;
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    return await this.create(userId, 'Nouvelle conversation');
  }
}

module.exports = Conversation;