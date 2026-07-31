const { pool } = require('../config/database');

class ChatMessage {
  // ✅ Ajouter un message
  static async create(conversationId, sender, message, intent = null, confidence = null) {
    const query = `
      INSERT INTO chat_messages (conversation_id, sender, message, intent, confidence, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const result = await pool.query(query, [conversationId, sender, message, intent, confidence]);
    return result.rows[0];
  }

  // ✅ Récupérer tous les messages d'une conversation
  static async findByConversationId(conversationId, limit = 100) {
    const query = `
      SELECT * FROM chat_messages 
      WHERE conversation_id = $1 
      ORDER BY created_at ASC 
      LIMIT $2
    `;
    const result = await pool.query(query, [conversationId, limit]);
    return result.rows;
  }

  // ✅ Récupérer les derniers messages
  static async getLastMessages(conversationId, limit = 10) {
    const query = `
      SELECT * FROM chat_messages 
      WHERE conversation_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const result = await pool.query(query, [conversationId, limit]);
    return result.rows.reverse();
  }

  // ✅ Supprimer les messages d'une conversation
  static async deleteByConversationId(conversationId) {
    const query = 'DELETE FROM chat_messages WHERE conversation_id = $1 RETURNING *';
    const result = await pool.query(query, [conversationId]);
    return result.rows;
  }

  // ✅ Compter les messages d'une conversation
  static async count(conversationId) {
    const query = 'SELECT COUNT(*) as count FROM chat_messages WHERE conversation_id = $1';
    const result = await pool.query(query, [conversationId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = ChatMessage;