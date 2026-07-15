const { pool } = require('../config/database');

class QRCode {
  // ✅ Générer un token QR pour un adhérent
  static async generateQRToken(adherentId) {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Valable 7 jours
    
    const query = `
      INSERT INTO qr_tokens (adherent_id, token, expires_at, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const result = await pool.query(query, [adherentId, token, expiresAt]);
    return result.rows[0];
  }

  // ✅ Vérifier un token QR
  static async verifyQRToken(token) {
    const query = `
      SELECT 
        qt.*,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email
      FROM qr_tokens qt
      JOIN users u ON qt.adherent_id = u.id
      WHERE qt.token = $1 
        AND qt.expires_at > NOW()
        AND qt.is_used = false
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }

  // ✅ Marquer un token comme utilisé
  static async markTokenAsUsed(tokenId) {
    const query = `
      UPDATE qr_tokens 
      SET is_used = true, used_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [tokenId]);
    return result.rows[0];
  }

  // ✅ Enregistrer un pointage
  static async createAttendance(sessionId, adherentId, coachId) {
    const query = `
      INSERT INTO attendances (session_id, adherent_id, coach_id, checked_at, status)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'present')
      RETURNING *
    `;
    const result = await pool.query(query, [sessionId, adherentId, coachId]);
    return result.rows[0];
  }

  // ✅ Récupérer l'historique des pointages d'un adhérent
  static async getAttendanceHistory(adherentId, limit = 20) {
    const query = `
      SELECT 
        a.*,
        s.date,
        s.time,
        s.type,
        u.first_name as coach_first_name,
        u.last_name as coach_last_name
      FROM attendances a
      JOIN sessions s ON a.session_id = s.id
      JOIN users u ON a.coach_id = u.id
      WHERE a.adherent_id = $1
      ORDER BY a.checked_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [adherentId, limit]);
    return result.rows;
  }

  // ✅ Récupérer les pointages d'une séance
  static async getSessionAttendances(sessionId) {
    const query = `
      SELECT 
        a.*,
        u.first_name,
        u.last_name,
        u.email
      FROM attendances a
      JOIN users u ON a.adherent_id = u.id
      WHERE a.session_id = $1
      ORDER BY a.checked_at ASC
    `;
    const result = await pool.query(query, [sessionId]);
    return result.rows;
  }

  static async getCoachAttendances(coachId, filters = {}) {
    let query = `
        SELECT 
        a.*,
        s.date,
        s.time,
        s.type as session_type,
        u.id as adherent_id,
        u.first_name as adherent_first_name,
        u.last_name as adherent_last_name,
        u.email as adherent_email
        FROM attendances a
        JOIN sessions s ON a.session_id = s.id
        JOIN users u ON a.adherent_id = u.id
        WHERE a.coach_id = $1
    `;
    const values = [coachId];
    let index = 2;

    if (filters.startDate) {
        query += ` AND a.checked_at >= $${index}`;
        values.push(filters.startDate);
        index++;
    }

    if (filters.endDate) {
        query += ` AND a.checked_at <= $${index}`;
        values.push(filters.endDate);
        index++;
    }

    if (filters.adherentId) {
        query += ` AND a.adherent_id = $${index}`;
        values.push(filters.adherentId);
        index++;
    }

    query += ' ORDER BY a.checked_at DESC';
    
    if (filters.limit) {
        query += ` LIMIT $${index}`;
        values.push(filters.limit);
        index++;
    }

    const result = await pool.query(query, values);
    return result.rows;
    }

    // ✅ Récupérer les statistiques de pointage d'un coach
  static async getCoachAttendanceStats(coachId) {
    const query = `
        SELECT 
        COUNT(*) as total_attendances,
        COUNT(DISTINCT adherent_id) as unique_adherents,
        COUNT(DISTINCT session_id) as sessions_with_attendance,
        DATE(checked_at) as date,
        COUNT(*) as daily_count
        FROM attendances
        WHERE coach_id = $1
        GROUP BY DATE(checked_at)
        ORDER BY DATE(checked_at) DESC
        LIMIT 30
    `;
    const result = await pool.query(query, [coachId]);
    return result.rows;
  }
}

module.exports = QRCode;