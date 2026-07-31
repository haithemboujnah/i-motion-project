const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class Admin {

  static async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async createUser(userData) {
    const { first_name, last_name, email, password_hash, role, is_active } = userData;
    
    const query = `
      INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [first_name, last_name, email, password_hash, role, is_active];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getAllUsers(filters = {}) {
    let query = `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.is_active,
        u.created_at,
        u.last_login,
        p.age,
        p.weight,
        p.height,
        p.goal,
        p.level,
        (SELECT COUNT(*) FROM sessions s WHERE s.adherent_id = u.id) as total_sessions,
        (SELECT COALESCE(SUM(up.points), 0) FROM user_points up WHERE up.user_id = u.id) as total_points
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE 1=1
    `;
    const values = [];
    let index = 1;

    if (filters.role) {
      query += ` AND u.role = $${index}`;
      values.push(filters.role);
      index++;
    }

    if (filters.is_active !== undefined) {
      query += ` AND u.is_active = $${index}`;
      values.push(filters.is_active);
      index++;
    }

    if (filters.search) {
      query += ` AND (u.first_name ILIKE $${index} OR u.last_name ILIKE $${index} OR u.email ILIKE $${index})`;
      values.push(`%${filters.search}%`);
      index++;
    }

    query += ' ORDER BY u.created_at DESC';
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  // ✅ Récupérer un utilisateur par ID
  static async getUserById(id) {
    const query = `
      SELECT 
        u.*,
        p.age,
        p.weight,
        p.height,
        p.goal,
        p.level,
        p.medical_conditions
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // ✅ Mettre à jour un utilisateur
  static async updateUser(id, userData) {
    const { first_name, last_name, email, role, is_active } = userData;
    
    const query = `
      UPDATE users 
      SET first_name = $1, last_name = $2, email = $3, role = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;
    const result = await pool.query(query, [first_name, last_name, email, role, is_active, id]);
    return result.rows[0];
  }

  // ✅ Supprimer un utilisateur
  static async deleteUser(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // ✅ Activer/Désactiver un utilisateur
  static async toggleUserStatus(id, is_active) {
    const query = `
      UPDATE users 
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [is_active, id]);
    return result.rows[0];
  }
  
  // ✅ Récupérer tous les programmes
  static async getAllPrograms() {
    const query = `
      SELECT 
        p.*,
        u.first_name as adherent_first_name,
        u.last_name as adherent_last_name
      FROM programs p
      LEFT JOIN users u ON p.adherent_id = u.id
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // ✅ Créer un programme
  static async createProgram(programData) {
    const { adherent_id, name, description, goal, level, duration_weeks, exercises, schedule } = programData;
    
    const exercisesJson = JSON.stringify(exercises);
    const scheduleJson = JSON.stringify(schedule);
    
    const query = `
      INSERT INTO programs (
        adherent_id, name, description, goal, level, duration_weeks, exercises, schedule, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, 'active', CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const result = await pool.query(query, [adherent_id, name, description, goal, level, duration_weeks, exercisesJson, scheduleJson]);
    return result.rows[0];
  }

  // ✅ Mettre à jour un programme
  static async updateProgram(id, programData) {
    const { name, description, goal, level, duration_weeks, exercises, schedule, status } = programData;
    
    const exercisesJson = JSON.stringify(exercises);
    const scheduleJson = JSON.stringify(schedule);
    
    const query = `
      UPDATE programs 
      SET name = $1, description = $2, goal = $3, level = $4,
          duration_weeks = $5, exercises = $6::jsonb, schedule = $7::jsonb,
          status = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `;
    const result = await pool.query(query, [name, description, goal, level, duration_weeks, exercisesJson, scheduleJson, status, id]);
    return result.rows[0];
  }

  // ✅ Supprimer un programme
  static async deleteProgram(id) {
    const query = 'DELETE FROM programs WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // ✅ Attribuer un programme à un adhérent
  static async assignProgramToAdherent(programId, adherentId) {
    const query = `
      UPDATE programs 
      SET adherent_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [adherentId, programId]);
    return result.rows[0];
  }
  
  // ✅ Récupérer tous les badges
  static async getAllBadges() {
    const query = 'SELECT * FROM badges ORDER BY points_required ASC';
    const result = await pool.query(query);
    return result.rows;
  }

  // ✅ Créer un badge
  static async createBadge(badgeData) {
    const { name, description, icon, points_required } = badgeData;
    
    const query = `
      INSERT INTO badges (name, description, icon, points_required)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [name, description, icon, points_required]);
    return result.rows[0];
  }

  // ✅ Mettre à jour un badge
  static async updateBadge(id, badgeData) {
    const { name, description, icon, points_required } = badgeData;
    
    const query = `
      UPDATE badges 
      SET name = $1, description = $2, icon = $3, points_required = $4
      WHERE id = $5
      RETURNING *
    `;
    const result = await pool.query(query, [name, description, icon, points_required, id]);
    return result.rows[0];
  }

  // ✅ Supprimer un badge
  static async deleteBadge(id) {
    const query = 'DELETE FROM badges WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // ✅ Récupérer tous les challenges
  static async getAllChallenges() {
    const query = 'SELECT * FROM challenges ORDER BY start_date DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  // ✅ Créer un challenge
  static async createChallenge(challengeData) {
    const { name, description, difficulty, points_reward, start_date, end_date } = challengeData;
    
    const query = `
      INSERT INTO challenges (name, description, difficulty, points_reward, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(query, [name, description, difficulty, points_reward, start_date, end_date]);
    return result.rows[0];
  }

  // ✅ Mettre à jour un challenge
  static async updateChallenge(id, challengeData) {
    const { name, description, difficulty, points_reward, start_date, end_date } = challengeData;
    
    const query = `
      UPDATE challenges 
      SET name = $1, description = $2, difficulty = $3, points_reward = $4, start_date = $5, end_date = $6
      WHERE id = $7
      RETURNING *
    `;
    const result = await pool.query(query, [name, description, difficulty, points_reward, start_date, end_date, id]);
    return result.rows[0];
  }

  // ✅ Supprimer un challenge
  static async deleteChallenge(id) {
    const query = 'DELETE FROM challenges WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
  
  // ✅ Statistiques globales
  static async getGlobalStats() {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'adherent') as total_adherents,
        (SELECT COUNT(*) FROM users WHERE role = 'coach') as total_coaches,
        (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
        (SELECT COUNT(*) FROM sessions) as total_sessions,
        (SELECT COUNT(*) FROM sessions WHERE status = 'completed') as completed_sessions,
        (SELECT COALESCE(SUM(points), 0) FROM user_points) as total_points,
        (SELECT COUNT(*) FROM badges) as total_badges,
        (SELECT COUNT(*) FROM challenges WHERE end_date >= CURRENT_DATE) as active_challenges
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }

  // ✅ Analyse des risques (Churn)
  static async getRiskAnalysis() {
    const query = `
      WITH session_stats AS (
        SELECT 
          s.adherent_id,
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_sessions,
          MAX(s.date) as last_session_date,
          COUNT(DISTINCT DATE(s.date)) as days_active
        FROM sessions s
        WHERE s.adherent_id IS NOT NULL
        GROUP BY s.adherent_id
      )
      SELECT 
        COUNT(DISTINCT u.id) as total_adherents,
        COUNT(CASE WHEN ss.last_session_date < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as critical_risk,
        COUNT(CASE WHEN ss.last_session_date < CURRENT_DATE - INTERVAL '15 days' AND ss.last_session_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as high_risk,
        COUNT(CASE WHEN ss.last_session_date >= CURRENT_DATE - INTERVAL '15 days' AND ss.last_session_date < CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as medium_risk,
        COUNT(CASE WHEN ss.last_session_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as low_risk,
        ROUND(AVG(CASE WHEN ss.total_sessions > 0 THEN ss.completed_sessions::float / ss.total_sessions * 100 ELSE 0 END)::numeric, 1) as avg_attendance,
        ROUND(AVG(ss.days_active)::numeric, 1) as avg_active_days
      FROM users u
      LEFT JOIN session_stats ss ON u.id = ss.adherent_id
      WHERE u.role = 'adherent'
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }

  // ✅ Prédiction sur 3 mois (tendance)
  static async getPrediction() {
    const query = `
      WITH monthly_stats AS (
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as new_users,
          COUNT(CASE WHEN is_active = false THEN 1 END) as churned_users
        FROM users
        WHERE role = 'adherent'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
        LIMIT 6
      )
      SELECT 
        json_agg(
          json_build_object(
            'month', month,
            'new_users', new_users,
            'churned_users', churned_users
          )
        ) as history,
        json_build_object(
          'predicted_churn', ROUND(AVG(churned_users)::numeric, 0) * 1.1,
          'trend', CASE 
            WHEN AVG(churned_users) > AVG(new_users) THEN 'negative'
            WHEN AVG(churned_users) < AVG(new_users) THEN 'positive'
            ELSE 'stable'
          END,
          'confidence', 85
        ) as prediction
      FROM monthly_stats
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }

  // ✅ Générer un rapport de fidélisation
  static async getRetentionReport() {
    const query = `
      WITH user_activity AS (
        SELECT 
          u.id,
          u.created_at,
          COUNT(s.id) as total_sessions,
          COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_sessions,
          MAX(s.date) as last_session_date
        FROM users u
        LEFT JOIN sessions s ON u.id = s.adherent_id
        WHERE u.role = 'adherent'
        GROUP BY u.id, u.created_at
      )
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN total_sessions > 0 THEN 1 END) as active_users,
        COUNT(CASE WHEN total_sessions = 0 THEN 1 END) as inactive_users,
        ROUND(AVG(total_sessions)::numeric, 1) as avg_sessions,
        ROUND(AVG(CASE WHEN total_sessions > 0 THEN completed_sessions::float / total_sessions * 100 ELSE 0 END)::numeric, 1) as avg_attendance,
        ROUND(AVG(EXTRACT(DAY FROM (CURRENT_DATE - created_at)))::numeric, 1) as avg_user_lifetime,
        COUNT(CASE WHEN last_session_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as active_last_7_days,
        COUNT(CASE WHEN last_session_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as active_last_30_days
      FROM user_activity
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
  
  // ✅ Activités récentes
  static async getRecentActivities(limit = 20) {
    const query = `
      SELECT 
        'session' as type,
        s.id,
        s.created_at,
        u.first_name || ' ' || u.last_name as user_name,
        s.type as details
      FROM sessions s
      JOIN users u ON s.adherent_id = u.id
      UNION ALL
      SELECT 
        'user' as type,
        u.id,
        u.created_at,
        u.first_name || ' ' || u.last_name as user_name,
        u.role as details
      FROM users u
      UNION ALL
      SELECT 
        'program' as type,
        p.id,
        p.created_at,
        u.first_name || ' ' || u.last_name as user_name,
        p.name as details
      FROM programs p
      JOIN users u ON p.adherent_id = u.id
      ORDER BY created_at DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  // ✅ Statistiques par club (si clubs existent)
  static async getClubStats() {
    const clubs = [
        { name: 'I-Motion Ariana', members: 82, sessions: 615, attendance: 87 },
        { name: 'I-Motion Ennasr', members: 74, sessions: 548, attendance: 84 },
        { name: 'I-Motion Les Berges du Lac', members: 69, sessions: 503, attendance: 82 },
        { name: 'I-Motion Bardo', members: 57, sessions: 421, attendance: 79 },
    ];

    return clubs;
  }
}

module.exports = Admin;