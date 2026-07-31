const { pool } = require('../config/database');

class Transaction {
  static async create(transactionData) {
    const { 
      user_id, subscription_id, amount, status, 
      payment_method, transaction_id, metadata 
    } = transactionData;
    
    const query = `
      INSERT INTO transactions (
        user_id, subscription_id, amount, status,
        payment_method, transaction_id, metadata, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [
      user_id, subscription_id, amount, status,
      payment_method, transaction_id, metadata
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByUserId(userId, limit = 20) {
    const query = `
      SELECT * FROM transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  static async findByTransactionId(transactionId) {
    const query = 'SELECT * FROM transactions WHERE transaction_id = $1';
    const result = await pool.query(query, [transactionId]);
    return result.rows;
  }

  static async updateStatus(transactionId, status) {
    const query = `
      UPDATE transactions 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, transactionId]);
    return result.rows[0];
  }
}

module.exports = Transaction;