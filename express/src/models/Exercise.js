const { pool } = require('../config/database');

class Exercise {
  // ✅ Récupérer tous les exercices
  static async getAll(filters = {}) {
    let query = 'SELECT * FROM exercises WHERE 1=1';
    const values = [];
    let index = 1;

    if (filters.category) {
      query += ` AND category = $${index}`;
      values.push(filters.category);
      index++;
    }

    if (filters.difficulty) {
      query += ` AND difficulty = $${index}`;
      values.push(filters.difficulty);
      index++;
    }

    if (filters.muscle_group) {
      query += ` AND muscle_group = $${index}`;
      values.push(filters.muscle_group);
      index++;
    }

    query += ' ORDER BY name ASC';
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  // ✅ Récupérer un exercice par ID
  static async findById(id) {
    const query = 'SELECT * FROM exercises WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // ✅ Recommander des exercices selon le programme
  static async getRecommendations(goal, level, limit = 10) {
    let query = `
      SELECT * FROM exercises 
      WHERE difficulty = $1 OR difficulty = 'debutant'
      ORDER BY 
        CASE 
          WHEN category = $2 THEN 1
          WHEN category = 'cardio' THEN 2
          ELSE 3
        END,
        difficulty ASC
      LIMIT $3
    `;
    
    // Déterminer la catégorie principale selon l'objectif
    let category = 'cardio';
    if (goal === 'prise_de_masse') category = 'musculation';
    else if (goal === 'perte_de_poids') category = 'cardio';
    else if (goal === 'remise_en_forme') category = 'cardio';

    const result = await pool.query(query, [level, category, limit]);
    return result.rows;
  }

  // ✅ Récupérer les exercices par programme
  static async getExercisesByProgram(programId) {
    const query = `
      SELECT e.* 
      FROM exercises e
      JOIN program_exercises pe ON e.id = pe.exercise_id
      WHERE pe.program_id = $1
      ORDER BY pe.day_order, pe.order
    `;
    const result = await pool.query(query, [programId]);
    return result.rows;
  }

  // ✅ Créer un nouvel exercice
  static async create(exerciseData) {
    const { name, description, category, difficulty, muscle_group, image_url, video_url, instructions, duration, calories_per_minute } = exerciseData;
    
    const query = `
      INSERT INTO exercises (
        name, description, category, difficulty, 
        muscle_group, image_url, video_url, instructions, 
        duration, calories_per_minute
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [name, description, category, difficulty, muscle_group, image_url, video_url, instructions, duration, calories_per_minute];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = Exercise;