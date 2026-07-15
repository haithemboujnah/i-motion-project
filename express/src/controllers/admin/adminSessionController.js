const { pool } = require('../../config/database');

class AdminSessionController {
  // ✅ Récupérer toutes les séances avec filtres
  static async getAllSessions(req, res) {
    try {
      const { status, startDate, endDate, search, type } = req.query;
      
      let query = `
        SELECT 
          s.*,
          u.first_name as adherent_first_name,
          u.last_name as adherent_last_name,
          u.email as adherent_email,
          c.first_name as coach_first_name,
          c.last_name as coach_last_name
        FROM sessions s
        LEFT JOIN users u ON s.adherent_id = u.id
        LEFT JOIN users c ON s.coach_id = c.id
        WHERE 1=1
      `;
      const values = [];
      let index = 1;

      if (status) {
        query += ` AND s.status = $${index}`;
        values.push(status);
        index++;
      }

      if (startDate) {
        query += ` AND s.date >= $${index}`;
        values.push(startDate);
        index++;
      }

      if (endDate) {
        query += ` AND s.date <= $${index}`;
        values.push(endDate);
        index++;
      }

      if (type) {
        query += ` AND s.type = $${index}`;
        values.push(type);
        index++;
      }

      if (search) {
        query += ` AND (u.first_name ILIKE $${index} OR u.last_name ILIKE $${index} OR u.email ILIKE $${index})`;
        values.push(`%${search}%`);
        index++;
      }

      query += ' ORDER BY s.date DESC, s.time DESC';
      
      const result = await pool.query(query, values);
      
      res.json({
        success: true,
        data: { sessions: result.rows }
      });
    } catch (error) {
      console.error('Error getting all sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des séances'
      });
    }
  }

  // ✅ Récupérer les statistiques des séances
  static async getSessionStats(req, res) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
          COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved_sessions,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_sessions,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_sessions,
          COUNT(DISTINCT adherent_id) as unique_adherents,
          COUNT(DISTINCT coach_id) as unique_coaches,
          ROUND(AVG(duration)::numeric, 0) as avg_duration
        FROM sessions
      `;
      const result = await pool.query(query);
      
      res.json({
        success: true,
        data: { stats: result.rows[0] }
      });
    } catch (error) {
      console.error('Error getting session stats:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques'
      });
    }
  }

  // ✅ Récupérer une séance par ID
  static async getSessionById(req, res) {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          s.*,
          u.first_name as adherent_first_name,
          u.last_name as adherent_last_name,
          u.email as adherent_email,
          c.first_name as coach_first_name,
          c.last_name as coach_last_name
        FROM sessions s
        LEFT JOIN users u ON s.adherent_id = u.id
        LEFT JOIN users c ON s.coach_id = c.id
        WHERE s.id = $1
      `;
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Séance non trouvée'
        });
      }
      
      res.json({
        success: true,
        data: { session: result.rows[0] }
      });
    } catch (error) {
      console.error('Error getting session by id:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de la séance'
      });
    }
  }

  // ✅ Créer une séance (Admin)
  static async createSession(req, res) {
    try {
      const { adherent_id, coach_id, date, time, duration, type } = req.body;
      
      // Vérifier que l'adhérent existe
      const userQuery = 'SELECT id, role FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [adherent_id]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Adhérent non trouvé'
        });
      }
      
      if (userResult.rows[0].role !== 'adherent') {
        return res.status(400).json({
          success: false,
          error: 'L\'utilisateur n\'est pas un adhérent'
        });
      }
      
      const query = `
        INSERT INTO sessions (
          adherent_id, coach_id, date, time, duration, type, status, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'reserved', CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const result = await pool.query(query, [adherent_id, coach_id, date, time, duration || 60, type || 'EMS']);
      
      res.status(201).json({
        success: true,
        message: 'Séance créée avec succès',
        data: { session: result.rows[0] }
      });
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de la séance'
      });
    }
  }

  // ✅ Mettre à jour une séance (Admin)
  static async updateSession(req, res) {
    try {
      const { id } = req.params;
      const { adherent_id, coach_id, date, time, duration, type, status } = req.body;
      
      const query = `
        UPDATE sessions 
        SET 
          adherent_id = COALESCE($1, adherent_id),
          coach_id = COALESCE($2, coach_id),
          date = COALESCE($3, date),
          time = COALESCE($4, time),
          duration = COALESCE($5, duration),
          type = COALESCE($6, type),
          status = COALESCE($7, status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      `;
      
      const result = await pool.query(query, [adherent_id, coach_id, date, time, duration, type, status, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Séance non trouvée'
        });
      }
      
      res.json({
        success: true,
        message: 'Séance mise à jour avec succès',
        data: { session: result.rows[0] }
      });
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour de la séance'
      });
    }
  }

  // ✅ Supprimer une séance (Admin)
  static async deleteSession(req, res) {
    try {
      const { id } = req.params;
      
      const query = 'DELETE FROM sessions WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Séance non trouvée'
        });
      }
      
      res.json({
        success: true,
        message: 'Séance supprimée avec succès'
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression de la séance'
      });
    }
  }
}

module.exports = AdminSessionController;