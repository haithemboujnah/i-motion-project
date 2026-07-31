const { pool } = require('../config/database');

class Profile {
  static async create(userId, profileData) {
    const { age, weight, height, goal, level, medical_conditions } = profileData;
    
    const query = `
      INSERT INTO profiles (
        user_id, age, weight, height, goal, level, medical_conditions
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [userId, age, weight, height, goal, level, medical_conditions];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM profiles WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  static async update(userId, profileData) {
    const { age, weight, height, goal, level, medical_conditions } = profileData;
    
    const query = `
      UPDATE profiles 
      SET age = $1, weight = $2, height = $3, goal = $4, 
          level = $5, medical_conditions = $6, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $7
      RETURNING *
    `;
    
    const values = [age, weight, height, goal, level, medical_conditions, userId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ✅ Calcul de l'IMC (CORRIGÉ)
  static async calculateBMI(weight, height) {
    if (!weight || !height || height <= 0) {
      return { bmi: null, category: 'Données insuffisantes' };
    }
    
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    let category = '';
    if (bmi < 16.5) category = 'Dénutrition';
    else if (bmi >= 16.5 && bmi < 18.5) category = 'Insuffisance pondérale';
    else if (bmi >= 18.5 && bmi < 25) category = 'Poids normal';
    else if (bmi >= 25 && bmi < 30) category = 'Surpoids';
    else if (bmi >= 30 && bmi < 35) category = 'Obésité modérée';
    else if (bmi >= 35 && bmi < 40) category = 'Obésité sévère';
    else category = 'Obésité morbide';
    
    return { 
      bmi: parseFloat(bmi.toFixed(2)), 
      category 
    };
  }
}

module.exports = Profile;