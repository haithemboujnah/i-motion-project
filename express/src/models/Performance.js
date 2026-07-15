const { pool } = require('../config/database');

class Performance {
  // ✅ Ajouter une mesure
  static async create(performanceData) {
    const { adherent_id, weight, body_fat, muscle_mass, notes, measured_at } = performanceData;
    
    const query = `
      INSERT INTO performances (
        adherent_id, weight, body_fat, muscle_mass, notes, measured_at, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [adherent_id, weight, body_fat, muscle_mass, notes, measured_at || new Date()];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ✅ Récupérer les mesures d'un adhérent
  static async findByAdherentId(adherentId, limit = 30) {
    const query = `
      SELECT * FROM performances 
      WHERE adherent_id = $1 
      ORDER BY measured_at DESC 
      LIMIT $2
    `;
    const result = await pool.query(query, [adherentId, limit]);
    return result.rows;
  }

  // ✅ Récupérer la dernière mesure
  static async getLatest(adherentId) {
    const query = `
      SELECT * FROM performances 
      WHERE adherent_id = $1 
      ORDER BY measured_at DESC 
      LIMIT 1
    `;
    const result = await pool.query(query, [adherentId]);
    return result.rows[0];
  }

  // ✅ Récupérer les statistiques
  static async getStats(adherentId) {
    const query = `
      SELECT 
        COUNT(*) as total_measurements,
        MIN(weight) as min_weight,
        MAX(weight) as max_weight,
        ROUND(AVG(weight)::numeric, 2) as avg_weight,
        MIN(body_fat) as min_body_fat,
        MAX(body_fat) as max_body_fat,
        ROUND(AVG(body_fat)::numeric, 2) as avg_body_fat,
        (SELECT weight FROM performances WHERE adherent_id = $1 ORDER BY measured_at ASC LIMIT 1) as initial_weight,
        (SELECT weight FROM performances WHERE adherent_id = $1 ORDER BY measured_at DESC LIMIT 1) as current_weight
      FROM performances 
      WHERE adherent_id = $1
    `;
    const result = await pool.query(query, [adherentId]);
    return result.rows[0];
  }

  // ✅ Récupérer l'évolution sur une période
  static async getEvolution(adherentId, period = '30 days') {
    // Valider la période pour éviter l'injection SQL
    const validPeriods = ['7 days', '14 days', '30 days', '60 days', '90 days'];
    if (!validPeriods.includes(period)) {
      period = '30 days';
    }
    
    const query = `
      SELECT 
        measured_at,
        weight,
        body_fat,
        muscle_mass,
        EXTRACT(DOW FROM measured_at) as day_of_week,
        DATE(measured_at) as date_only
      FROM performances 
      WHERE adherent_id = $1 
        AND measured_at >= CURRENT_DATE - INTERVAL '${period}'
      ORDER BY measured_at ASC
    `;
    const result = await pool.query(query, [adherentId]);
    return result.rows;
  }

  // ✅ Récupérer l'évolution par semaine
  static async getWeeklyEvolution(adherentId, weeks = 4) {
    const query = `
      SELECT 
        DATE_TRUNC('week', measured_at) as week,
        AVG(weight) as avg_weight,
        AVG(body_fat) as avg_body_fat,
        AVG(muscle_mass) as avg_muscle_mass,
        MIN(weight) as min_weight,
        MAX(weight) as max_weight,
        COUNT(*) as measurements_count
      FROM performances 
      WHERE adherent_id = $1 
        AND measured_at >= CURRENT_DATE - INTERVAL '${weeks} weeks'
      GROUP BY DATE_TRUNC('week', measured_at)
      ORDER BY week ASC
    `;
    const result = await pool.query(query, [adherentId]);
    return result.rows;
  }

  // ✅ Supprimer une mesure
  static async delete(id) {
    const query = 'DELETE FROM performances WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Performance;