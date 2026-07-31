const { pool } = require('../config/database');

class Session {
  // ✅ Créer une séance (pour Admin)
  static async create(sessionData) {
    const { coach_id, date, time, duration, type, status = 'available' } = sessionData;
    
    const query = `
      INSERT INTO sessions (
        coach_id, date, time, duration, type, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [coach_id, date, time, duration, type, status];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ✅ Récupérer les séances disponibles par date
  static async getAvailableSessions(date) {
    try {
      const query = `
        SELECT 
          s.id,
          s.coach_id,
          s.date,
          s.time,
          s.duration,
          s.type,
          s.status,
          u.first_name as coach_name,
          u.last_name as coach_lastname
        FROM sessions s
        JOIN users u ON s.coach_id = u.id
        WHERE s.date = $1 
          AND s.status = 'available'
          AND u.role = 'coach'
        ORDER BY s.time ASC
      `;
      const result = await pool.query(query, [date]);
      return result.rows;
    } catch (error) {
      console.error('Error getting available sessions:', error);
      return [];
    }
  }

  // ✅ Récupérer les séances d'un adhérent
  static async findByAdherentId(adherentId, filters = {}) {
    let query = `
      SELECT 
        s.*,
        u.first_name as coach_name,
        u.last_name as coach_lastname
      FROM sessions s
      LEFT JOIN users u ON s.coach_id = u.id
      WHERE s.adherent_id = $1
    `;
    const values = [adherentId];
    let index = 2;

    if (filters.status) {
      query += ` AND s.status = $${index}`;
      values.push(filters.status);
      index++;
    }

    if (filters.startDate) {
      query += ` AND s.date >= $${index}`;
      values.push(filters.startDate);
      index++;
    }

    if (filters.endDate) {
      query += ` AND s.date <= $${index}`;
      values.push(filters.endDate);
      index++;
    }

    query += ' ORDER BY s.date DESC, s.time DESC';
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  // ✅ Récupérer une séance par ID (CORRIGÉ)
  static async findById(id) {
    try {
      console.log(`🔍 Recherche de la session ${id}...`);
      
      if (!id || isNaN(parseInt(id))) {
        console.log(`❌ ID invalide: ${id}`);
        return null;
      }
      
      const query = `
        SELECT 
          s.id,
          s.adherent_id,
          s.coach_id,
          s.date,
          s.time,
          s.duration,
          s.type,
          s.status,
          s.created_at,
          s.updated_at,
          u.first_name as coach_name,
          u.last_name as coach_lastname,
          u2.id as adherent_user_id,
          u2.first_name as adherent_first_name,
          u2.last_name as adherent_last_name,
          u2.email as adherent_email
        FROM sessions s
        LEFT JOIN users u ON s.coach_id = u.id
        LEFT JOIN users u2 ON s.adherent_id = u2.id
        WHERE s.id = $1
      `;
      
      const result = await pool.query(query, [parseInt(id)]);
      
      if (result.rows.length === 0) {
        console.log(`❌ Session ${id} non trouvée`);
        return null;
      }
      
      const session = result.rows[0];
      console.log(`✅ Session ${id} trouvée:`, {
        id: session.id,
        adherent_id: session.adherent_id,
        coach_id: session.coach_id,
        status: session.status
      });
      
      return session;
    } catch (error) {
      console.error('Error finding session by ID:', error);
      return null;
    }
  }

  // ✅ Créer une séance (pour Admin) - CORRIGÉ
  static async create(sessionData) {
    const { adherent_id, coach_id, date, time, duration, type, status = 'available' } = sessionData;
    
    // Si adherent_id est fourni, la session est réservée directement
    const finalStatus = adherent_id ? 'reserved' : status;
    
    const query = `
      INSERT INTO sessions (
        adherent_id, coach_id, date, time, duration, type, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [adherent_id || null, coach_id, date, time, duration, type, finalStatus];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ✅ Vérifier si un adhérent a déjà réservé une session
  static async findByAdherentAndSession(adherentId, sessionId) {
    const query = `
      SELECT * FROM sessions 
      WHERE id = $1 AND adherent_id = $2
    `;
    const result = await pool.query(query, [sessionId, adherentId]);
    return result.rows[0];
  }

  // ✅ Mettre à jour le statut d'une session (CORRIGÉ)
  static async updateStatus(id, status, adherentId = null) {
    try {
      console.log(`🔄 Mise à jour de la session ${id} en ${status}...`);
      
      // Vérifier d'abord que la session existe
      const session = await this.findById(id);
      if (!session) {
        console.log(`❌ Session ${id} non trouvée`);
        return null;
      }
      
      let query = `
        UPDATE sessions 
        SET status = $1, 
            updated_at = CURRENT_TIMESTAMP
      `;
      const values = [status];
      let paramIndex = 2;
      
      // Si on assigne un adhérent
      if (adherentId !== null && adherentId !== undefined) {
        query += `, adherent_id = $${paramIndex}`;
        values.push(adherentId);
        paramIndex++;
      }
      
      query += ` WHERE id = $${paramIndex} RETURNING *`;
      values.push(parseInt(id));
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        console.log(`❌ Session ${id} non trouvée pour mise à jour`);
        return null;
      }
      
      console.log(`✅ Session ${id} mise à jour:`, {
        id: result.rows[0].id,
        status: result.rows[0].status,
        adherent_id: result.rows[0].adherent_id
      });
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating session status:', error);
      return null;
    }
  }

  // ✅ Annuler une session
  static async cancel(id) {
    const query = `
      UPDATE sessions 
      SET status = 'cancelled', 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // ✅ Récupérer les séances à venir d'un adhérent
  static async getUpcomingSessions(adherentId, limit = 5) {
    const query = `
      SELECT 
        s.*,
        u.first_name as coach_name,
        u.last_name as coach_lastname
      FROM sessions s
      JOIN users u ON s.coach_id = u.id
      WHERE s.adherent_id = $1 
        AND s.status IN ('reserved', 'confirmed')
        AND s.date >= CURRENT_DATE
      ORDER BY s.date ASC, s.time ASC
      LIMIT $2
    `;
    const result = await pool.query(query, [adherentId, limit]);
    return result.rows;
  }

  // ✅ Créer des séances pour une semaine (pour Admin)
  static async createWeeklySessions(coachId, startDate, type = 'EMS') {
    const sessions = [];
    const days = ['Monday', 'Wednesday', 'Friday'];
    const times = ['09:00:00', '10:00:00', '11:00:00', '14:00:00', '15:00:00', '16:00:00'];
    
    for (const day of days) {
      for (const time of times) {
        const date = new Date(startDate);
        const dayMap = { 'Monday': 1, 'Wednesday': 3, 'Friday': 5 };
        const currentDay = date.getDay();
        const targetDay = dayMap[day];
        const diff = targetDay - currentDay;
        date.setDate(date.getDate() + diff);
        
        const session = await this.create({
          coach_id: coachId,
          date: date.toISOString().split('T')[0],
          time: time,
          duration: 60,
          type: type,
          status: 'available'
        });
        sessions.push(session);
      }
    }
    
    return sessions;
  }

  // ✅ Vérifier si une session existe et est disponible (NOUVEAU)
  static async isAvailable(sessionId) {
    try {
      const query = `
        SELECT * FROM sessions 
        WHERE id = $1 AND status = 'available'
      `;
      const result = await pool.query(query, [sessionId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error checking session availability:', error);
      return null;
    }
  }

  static async markReminderSent(sessionId) {
    const query = `
      UPDATE sessions 
      SET reminder_sent_manual = true,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [sessionId]);
    return result.rows[0];
  }
}

module.exports = Session;