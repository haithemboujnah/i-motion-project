const { pool } = require('../config/database');

class Coach {
  // ✅ Récupérer les adhérents d'un coach
  static async getAdherents(coachId) {
    const query = `
      SELECT DISTINCT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.created_at,
        p.age,
        p.weight,
        p.height,
        p.goal,
        p.level,
        (SELECT COUNT(*) FROM sessions s WHERE s.adherent_id = u.id) as total_sessions,
        (SELECT COUNT(*) FROM sessions s WHERE s.adherent_id = u.id AND s.status = 'completed') as completed_sessions,
        (SELECT COALESCE(SUM(up.points), 0) FROM user_points up WHERE up.user_id = u.id) as total_points,
        (SELECT COUNT(*) FROM user_badges ub WHERE ub.user_id = u.id) as badges_count
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN sessions s ON u.id = s.adherent_id
      LEFT JOIN user_points up ON u.id = up.user_id
      WHERE u.role = 'adherent' 
        AND u.is_active = true
        AND (s.coach_id = $1 OR s.coach_id IS NULL)
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.created_at, 
               p.age, p.weight, p.height, p.goal, p.level
      ORDER BY u.first_name ASC
    `;
    const result = await pool.query(query, [coachId]);
    return result.rows;
  }

  // ✅ Récupérer les détails d'un adhérent
  static async getAdherentDetail(coachId, adherentId) {
    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.created_at,
        p.age,
        p.weight,
        p.height,
        p.goal,
        p.level,
        p.medical_conditions,
        (SELECT COUNT(*) FROM sessions s WHERE s.adherent_id = u.id) as total_sessions,
        (SELECT COUNT(*) FROM sessions s WHERE s.adherent_id = u.id AND s.status = 'completed') as completed_sessions,
        (SELECT COALESCE(SUM(up.points), 0) FROM user_points up WHERE up.user_id = u.id) as total_points,
        (SELECT COUNT(*) FROM user_badges ub WHERE ub.user_id = u.id) as badges_count
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1 AND u.role = 'adherent'
    `;
    const result = await pool.query(query, [adherentId]);
    return result.rows[0];
  }

  // ✅ Récupérer les séances d'un coach
  static async getSessions(coachId, filters = {}) {
    let query = `
      SELECT 
        s.*,
        u.first_name as adherent_first_name,
        u.last_name as adherent_last_name,
        u.email as adherent_email
      FROM sessions s
      LEFT JOIN users u ON s.adherent_id = u.id
      WHERE s.coach_id = $1
    `;
    const values = [coachId];
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

    if (filters.date) {
      query += ` AND s.date = $${index}`;
      values.push(filters.date);
      index++;
    }

    query += ' ORDER BY s.date ASC, s.time ASC';
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  // ✅ Mettre à jour le statut d'une séance (pointage)
  static async updateSessionStatus(sessionId, status) {
    const query = `
      UPDATE sessions 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, sessionId]);
    return result.rows[0];
  }

  // ✅ Créer une séance
  static async createSession(sessionData) {
    const { coach_id, adherent_id, date, time, duration, type } = sessionData;
    
    const query = `
      INSERT INTO sessions (
        coach_id, adherent_id, date, time, duration, type, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'reserved', CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [coach_id, adherent_id, date, time, duration, type];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ✅ Statistiques du coach
  static async getStats(coachId) {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM sessions WHERE coach_id = $1) as total_sessions,
        (SELECT COUNT(*) FROM sessions WHERE coach_id = $1 AND status = 'completed') as completed_sessions,
        (SELECT COUNT(DISTINCT adherent_id) FROM sessions WHERE coach_id = $1 AND adherent_id IS NOT NULL) as total_adherents,
        (SELECT COUNT(*) FROM sessions WHERE coach_id = $1 AND date >= CURRENT_DATE AND status != 'cancelled') as upcoming_sessions,
        (SELECT ROUND(AVG(duration)::numeric, 0) FROM sessions WHERE coach_id = $1 AND status = 'completed') as avg_duration,
        (SELECT COUNT(*) FROM sessions WHERE coach_id = $1 AND date = CURRENT_DATE) as today_sessions
    `;
    const result = await pool.query(query, [coachId]);
    return result.rows[0];
  }

  // ✅ Récupérer les adhérents à risque (Churn)
  static async getAtRiskAdherents(coachId) {
    const query = `
      WITH session_stats AS (
        SELECT 
          s.adherent_id,
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_sessions,
          MAX(s.date) as last_session_date,
          AVG(CASE WHEN s.status = 'completed' THEN EXTRACT(EPOCH FROM (s.updated_at - s.created_at)) ELSE NULL END) as avg_attendance
        FROM sessions s
        WHERE s.coach_id = $1 AND s.adherent_id IS NOT NULL
        GROUP BY s.adherent_id
      )
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        ss.total_sessions,
        ss.completed_sessions,
        ss.last_session_date,
        CASE 
          WHEN ss.last_session_date < CURRENT_DATE - INTERVAL '30 days' THEN 'Critique'
          WHEN ss.last_session_date < CURRENT_DATE - INTERVAL '15 days' THEN 'Moyen'
          WHEN ss.completed_sessions::float / NULLIF(ss.total_sessions, 0) < 0.3 THEN 'Critique'
          WHEN ss.completed_sessions::float / NULLIF(ss.total_sessions, 0) < 0.5 THEN 'Moyen'
          ELSE 'Faible'
        END as risk_level,
        CASE 
          WHEN ss.last_session_date < CURRENT_DATE - INTERVAL '30 days' THEN 90
          WHEN ss.last_session_date < CURRENT_DATE - INTERVAL '15 days' THEN 70
          WHEN ss.completed_sessions::float / NULLIF(ss.total_sessions, 0) < 0.3 THEN 85
          WHEN ss.completed_sessions::float / NULLIF(ss.total_sessions, 0) < 0.5 THEN 60
          ELSE 20
        END as risk_score
      FROM users u
      JOIN session_stats ss ON u.id = ss.adherent_id
      WHERE u.role = 'adherent' 
        AND u.is_active = true
        AND (ss.last_session_date < CURRENT_DATE - INTERVAL '7 days' 
          OR ss.completed_sessions::float / NULLIF(ss.total_sessions, 0) < 0.5)
      ORDER BY risk_score DESC
    `;
    const result = await pool.query(query, [coachId]);
    return result.rows;
  }

  // ✅ Générer des recommandations pour un adhérent
  static async getRecommendations(adherentId) {
    const query = `
      WITH stats AS (
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
          MAX(date) as last_session_date,
          AVG(CASE WHEN status = 'completed' THEN EXTRACT(EPOCH FROM (updated_at - created_at)) ELSE NULL END) as avg_duration
        FROM sessions
        WHERE adherent_id = $1
      ),
      performance AS (
        SELECT 
          weight,
          body_fat,
          muscle_mass,
          measured_at
        FROM performances
        WHERE adherent_id = $1
        ORDER BY measured_at DESC
        LIMIT 2
      )
      SELECT 
        s.total_sessions,
        s.completed_sessions,
        s.last_session_date,
        s.avg_duration,
        p.weight as current_weight,
        p.body_fat as current_body_fat,
        p.muscle_mass as current_muscle_mass
      FROM stats s
      CROSS JOIN performance p
      LIMIT 1
    `;
    const result = await pool.query(query, [adherentId]);
    const data = result.rows[0];
    
    const recommendations = [];
    
    if (data) {
      const attendanceRate = data.total_sessions > 0 
        ? (data.completed_sessions / data.total_sessions) * 100 
        : 0;
      
      if (attendanceRate < 50) {
        recommendations.push({
          type: 'assiduité',
          message: `L'adhérent a un taux d'assiduité de ${Math.round(attendanceRate)}%. Proposer des rappels plus fréquents.`,
          priority: 'high'
        });
      }
      
      if (data.last_session_date && new Date(data.last_session_date) < new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)) {
        recommendations.push({
          type: 'fidélisation',
          message: "L'adhérent n'a pas participé depuis plus de 15 jours. Contacter pour un suivi personnalisé.",
          priority: 'high'
        });
      }
      
      if (data.current_weight && data.current_body_fat) {
        recommendations.push({
          type: 'performance',
          message: `Poids actuel: ${data.current_weight}kg, Masse grasse: ${data.current_body_fat}%. Proposer un ajustement du programme.`,
          priority: 'medium'
        });
      }
    }
    
    return recommendations;
  }

  // ✅ Récupérer l'historique des alertes
  static async getAlertHistory(adherentId, limit = 20) {
    const query = `
      SELECT 
        id,
        adherent_id,
        risk_level,
        risk_score,
        message,
        created_at,
        is_read
      FROM alert_history
      WHERE adherent_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [adherentId, limit]);
    return result.rows;
  }

  // ✅ Créer une alerte
  static async createAlert(alertData) {
    const { adherent_id, risk_level, risk_score, message } = alertData;
    
    const query = `
      INSERT INTO alert_history (adherent_id, risk_level, risk_score, message, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const result = await pool.query(query, [adherent_id, risk_level, risk_score, message]);
    return result.rows[0];
  }

  static async getAdherentPerformances(coachId, period = '30 days') {
    try {
      const query = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          p.weight,
          p.body_fat,
          p.muscle_mass,
          p.measured_at,
          ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY p.measured_at DESC) as rn
        FROM users u
        INNER JOIN performances p ON u.id = p.adherent_id
        INNER JOIN sessions s ON u.id = s.adherent_id
        WHERE s.coach_id = $1 
          AND p.measured_at >= CURRENT_DATE - INTERVAL '${period}'
          AND u.role = 'adherent'
          AND u.is_active = true
        ORDER BY u.id, p.measured_at DESC
      `;
      const result = await pool.query(query, [coachId]);
      return result.rows;
    } catch (error) {
      console.error('Error in getAdherentPerformances:', error);
      return [];
    }
  }

  static async getAdherentPerformanceStats(coachId) {
    try {
      const query = `
        WITH adherent_stats AS (
          SELECT 
            u.id,
            u.first_name,
            u.last_name,
            COUNT(s.id) as total_sessions,
            COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_sessions,
            MAX(s.date) as last_session_date,
            (
              SELECT weight 
              FROM performances p 
              WHERE p.adherent_id = u.id 
              ORDER BY p.measured_at DESC 
              LIMIT 1
            ) as current_weight,
            (
              SELECT body_fat 
              FROM performances p 
              WHERE p.adherent_id = u.id 
              ORDER BY p.measured_at DESC 
              LIMIT 1
            ) as current_body_fat
          FROM users u
          LEFT JOIN sessions s ON u.id = s.adherent_id AND s.coach_id = $1
          WHERE u.role = 'adherent' AND u.is_active = true
          GROUP BY u.id, u.first_name, u.last_name
        )
        SELECT 
          COUNT(*) as total_adherents,
          COUNT(CASE WHEN total_sessions > 0 THEN 1 END) as active_adherents,
          COUNT(CASE WHEN total_sessions = 0 THEN 1 END) as inactive_adherents,
          ROUND(AVG(total_sessions)::numeric, 1) as avg_sessions,
          ROUND(AVG(CASE WHEN total_sessions > 0 THEN completed_sessions::float / total_sessions * 100 ELSE 0 END)::numeric, 1) as avg_attendance,
          ROUND(AVG(current_weight)::numeric, 1) as avg_weight,
          ROUND(AVG(current_body_fat)::numeric, 1) as avg_body_fat
        FROM adherent_stats
      `;
      const result = await pool.query(query, [coachId]);
      return result.rows[0] || {};
    } catch (error) {
      console.error('Error in getAdherentPerformanceStats:', error);
      return {};
    }
  }
}

module.exports = Coach;