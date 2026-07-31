const { pool } = require('../config/database');

class Profile {
  // ✅ Create a new profile
  static async create(userId, profileData) {
    const { 
      age, weight, height, goal, level, 
      medical_conditions, body_fat, muscle_mass 
    } = profileData;
    
    const query = `
      INSERT INTO profiles (
        user_id, age, weight, height, goal, level, 
        medical_conditions, body_fat, muscle_mass
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      userId, 
      age, 
      weight, 
      height, 
      goal || 'remise_en_forme', 
      level || 'debutant', 
      medical_conditions,
      body_fat || null,
      muscle_mass || null
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ✅ Find profile by user ID
  static async findByUserId(userId) {
    const query = `
      SELECT 
        id, user_id, age, weight, height, goal, level, 
        medical_conditions, body_fat, muscle_mass,
        created_at, updated_at
      FROM profiles 
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  // ✅ Update profile
  static async update(userId, profileData) {
    const { 
      age, weight, height, goal, level, 
      medical_conditions, body_fat, muscle_mass 
    } = profileData;
    
    const query = `
      UPDATE profiles 
      SET 
        age = COALESCE($1, age),
        weight = COALESCE($2, weight),
        height = COALESCE($3, height),
        goal = COALESCE($4, goal),
        level = COALESCE($5, level),
        medical_conditions = COALESCE($6, medical_conditions),
        body_fat = COALESCE($7, body_fat),
        muscle_mass = COALESCE($8, muscle_mass),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $9
      RETURNING *
    `;
    
    const values = [
      age, 
      weight, 
      height, 
      goal, 
      level, 
      medical_conditions,
      body_fat,
      muscle_mass,
      userId
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ✅ Update specific fields (PATCH)
  static async updatePartial(userId, updates) {
    const allowedFields = [
      'age', 'weight', 'height', 'goal', 'level', 
      'medical_conditions', 'body_fat', 'muscle_mass'
    ];
    
    const setClauses = [];
    const values = [];
    let paramIndex = 1;
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`);
        values.push(updates[field]);
        paramIndex++;
      }
    }
    
    if (setClauses.length === 0) {
      return null; // No fields to update
    }
    
    values.push(userId);
    const query = `
      UPDATE profiles 
      SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ✅ Calculate BMI
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

  // ✅ Get profile with BMI and health metrics
  static async getProfileWithMetrics(userId) {
    const profile = await this.findByUserId(userId);
    if (!profile) return null;
    
    // Calculate BMI
    const bmiData = await this.calculateBMI(profile.weight, profile.height);
    
    // Estimate body fat if not provided
    let bodyFat = profile.body_fat;
    if (bodyFat === null || bodyFat === undefined) {
      bodyFat = this.estimateBodyFat(profile.age, profile.weight);
    }
    
    // Estimate muscle mass if not provided
    let muscleMass = profile.muscle_mass;
    if (muscleMass === null || muscleMass === undefined) {
      muscleMass = this.estimateMuscleMass(profile.weight);
    }
    
    return {
      ...profile,
      bmi: bmiData.bmi,
      bmi_category: bmiData.category,
      body_fat: bodyFat,
      muscle_mass: muscleMass
    };
  }

  // ✅ Estimate body fat based on age and weight
  static estimateBodyFat(age, weight) {
    if (!age || !weight) return 20;
    
    if (age < 30) {
      return Math.max(8, Math.min(40, 15 + (weight - 60) * 0.2));
    } else if (age < 50) {
      return Math.max(10, Math.min(40, 20 + (weight - 60) * 0.15));
    } else {
      return Math.max(12, Math.min(40, 25 + (weight - 60) * 0.1));
    }
  }

  // ✅ Estimate muscle mass based on weight
  static estimateMuscleMass(weight) {
    if (!weight) return 35;
    return Math.max(25, Math.min(55, 30 + (weight - 60) * 0.2));
  }

  // ✅ Get goal label
  static getGoalLabel(goal) {
    const labels = {
      'perte_de_poids': 'Perte de poids',
      'prise_de_masse': 'Prise de masse musculaire',
      'remise_en_forme': 'Remise en forme',
      'modelage_raffermissement': 'Modelage & Raffermissement',
      'recuperation_bien_etre': 'Récupération & Bien-être',
      'lifting_naturel': 'Lifting naturel & Anti-âge'
    };
    return labels[goal] || goal;
  }

  // ✅ Get level label
  static getLevelLabel(level) {
    const labels = {
      'debutant': 'Débutant',
      'intermediaire': 'Intermédiaire',
      'avance': 'Avancé'
    };
    return labels[level] || level;
  }

  // ✅ Get all available goals
  static getGoals() {
    return [
      { value: 'perte_de_poids', label: 'Perte de poids', icon: '🔥', color: '#ef4444' },
      { value: 'prise_de_masse', label: 'Prise de masse musculaire', icon: '💪', color: '#22c55e' },
      { value: 'remise_en_forme', label: 'Remise en forme', icon: '❤️', color: '#57a1ce' },
      { value: 'modelage_raffermissement', label: 'Modelage & Raffermissement', icon: '⭐', color: '#ec4899' },
      { value: 'recuperation_bien_etre', label: 'Récupération & Bien-être', icon: '🧘', color: '#8b5cf6' },
      { value: 'lifting_naturel', label: 'Lifting naturel & Anti-âge', icon: '✨', color: '#f59e0b' }
    ];
  }

  // ✅ Get all available levels
  static getLevels() {
    return [
      { value: 'debutant', label: 'Débutant', description: 'Pour commencer en douceur' },
      { value: 'intermediaire', label: 'Intermédiaire', description: 'Pour ceux qui ont déjà de l\'expérience' },
      { value: 'avance', label: 'Avancé', description: 'Pour les sportifs confirmés' }
    ];
  }

  // ✅ Validate profile data
  static validateProfileData(data) {
    const errors = [];
    
    const validGoals = ['perte_de_poids', 'prise_de_masse', 'remise_en_forme', 
                        'modelage_raffermissement', 'recuperation_bien_etre', 'lifting_naturel'];
    const validLevels = ['debutant', 'intermediaire', 'avance'];
    
    if (data.goal && !validGoals.includes(data.goal)) {
      errors.push(`Goal must be one of: ${validGoals.join(', ')}`);
    }
    
    if (data.level && !validLevels.includes(data.level)) {
      errors.push(`Level must be one of: ${validLevels.join(', ')}`);
    }
    
    if (data.age && (data.age < 12 || data.age > 120)) {
      errors.push('Age must be between 12 and 120');
    }
    
    if (data.weight && (data.weight < 20 || data.weight > 300)) {
      errors.push('Weight must be between 20 and 300 kg');
    }
    
    if (data.height && (data.height < 100 || data.height > 250)) {
      errors.push('Height must be between 100 and 250 cm');
    }
    
    if (data.body_fat && (data.body_fat < 3 || data.body_fat > 60)) {
      errors.push('Body fat must be between 3% and 60%');
    }
    
    if (data.muscle_mass && (data.muscle_mass < 15 || data.muscle_mass > 70)) {
      errors.push('Muscle mass must be between 15 and 70 kg');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = Profile;