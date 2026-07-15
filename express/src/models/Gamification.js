const { pool } = require('../config/database');

class Gamification {
  // ✅ Récupérer les points d'un utilisateur
  static async getPoints(userId) {
    const query = `
      SELECT 
        COALESCE(SUM(points), 0) as total_points,
        COUNT(DISTINCT badge_id) as badges_count
      FROM user_points up
      LEFT JOIN user_badges ub ON up.user_id = ub.user_id
      WHERE up.user_id = $1
      GROUP BY up.user_id
    `;
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return { total_points: 0, badges_count: 0 };
    }
    
    return result.rows[0];
  }

  // ✅ Ajouter des points à un utilisateur
  static async addPoints(userId, points, reason) {
    const query = `
      INSERT INTO user_points (user_id, points, reason, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, points, reason]);
    return result.rows[0];
  }

  // ✅ Récupérer les badges d'un utilisateur
  static async getBadges(userId) {
    const query = `
      SELECT 
        b.*,
        ub.awarded_at
      FROM badges b
      JOIN user_badges ub ON b.id = ub.badge_id
      WHERE ub.user_id = $1
      ORDER BY ub.awarded_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // ✅ Attribuer un badge à un utilisateur
  static async awardBadge(userId, badgeId) {
    // Vérifier si le badge existe déjà
    const checkQuery = 'SELECT * FROM user_badges WHERE user_id = $1 AND badge_id = $2';
    const checkResult = await pool.query(checkQuery, [userId, badgeId]);
    
    if (checkResult.rows.length > 0) {
      return checkResult.rows[0];
    }
    
    const query = `
      INSERT INTO user_badges (user_id, badge_id, awarded_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, badgeId]);
    return result.rows[0];
  }

  // ✅ Vérifier et attribuer automatiquement les badges
  static async checkAndAwardBadges(userId) {
    // Récupérer le total des points
    const pointsResult = await this.getPoints(userId);
    const totalPoints = parseInt(pointsResult.total_points) || 0;
    
    // Récupérer tous les badges disponibles
    const badgesQuery = 'SELECT * FROM badges ORDER BY points_required ASC';
    const badgesResult = await pool.query(badgesQuery);
    
    const awardedBadges = [];
    
    for (const badge of badgesResult.rows) {
      if (totalPoints >= badge.points_required) {
        const awarded = await this.awardBadge(userId, badge.id);
        if (awarded) {
          awardedBadges.push(badge);
        }
      }
    }
    
    return awardedBadges;
  }

  // ✅ Récupérer les défis d'un utilisateur
  static async getChallenges(userId) {
    const query = `
      SELECT 
        c.*,
        CASE 
          WHEN uc.completed_at IS NOT NULL THEN 'completed'
          WHEN uc.started_at IS NOT NULL AND uc.started_at <= CURRENT_TIMESTAMP THEN 'in_progress'
          ELSE 'not_started'
        END as status,
        COALESCE(uc.progress, 0) as progress
      FROM challenges c
      LEFT JOIN user_challenges uc ON c.id = uc.challenge_id AND uc.user_id = $1
      WHERE c.start_date <= CURRENT_DATE AND c.end_date >= CURRENT_DATE
      ORDER BY c.difficulty ASC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // ✅ Démarrer un défi
  static async startChallenge(userId, challengeId) {
    const query = `
      INSERT INTO user_challenges (user_id, challenge_id, started_at, progress)
      VALUES ($1, $2, CURRENT_TIMESTAMP, 0)
      ON CONFLICT (user_id, challenge_id) DO UPDATE 
      SET started_at = CURRENT_TIMESTAMP, progress = 0
      RETURNING *
    `;
    const result = await pool.query(query, [userId, challengeId]);
    return result.rows[0];
  }

  // ✅ Mettre à jour la progression d'un défi
  static async updateChallengeProgress(userId, challengeId, progress) {
    const query = `
      UPDATE user_challenges 
      SET progress = $1, 
          completed_at = CASE WHEN $1 >= 100 THEN CURRENT_TIMESTAMP ELSE NULL END
      WHERE user_id = $2 AND challenge_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [progress, userId, challengeId]);
    return result.rows[0];
  }

  // ✅ Récupérer le classement
  static async getRanking(limit = 10) {
    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        COALESCE(SUM(up.points), 0) as total_points,
        RANK() OVER (ORDER BY COALESCE(SUM(up.points), 0) DESC) as rank
      FROM users u
      LEFT JOIN user_points up ON u.id = up.user_id
      WHERE u.role = 'adherent' AND u.is_active = true
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY total_points DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  // ✅ Récupérer le classement par club
  static async getClubRanking(clubId, limit = 10) {
    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        COALESCE(SUM(up.points), 0) as total_points,
        RANK() OVER (ORDER BY COALESCE(SUM(up.points), 0) DESC) as rank
      FROM users u
      LEFT JOIN user_points up ON u.id = up.user_id
      WHERE u.role = 'adherent' AND u.club_id = $1 AND u.is_active = true
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY total_points DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [clubId, limit]);
    return result.rows;
  }
}

module.exports = Gamification;