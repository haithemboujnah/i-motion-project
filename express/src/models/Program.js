const { pool } = require('../config/database');
const { mapExerciseName } = require('../config/exerciseMapping');

class Program {
  // ✅ Chercher un exercice dans la base de données
  static async findExerciseInDB(exerciseName, defaultDuration = 30) {
    try {
      // Nettoyer le nom - enlever les parenthèses et les commentaires
      let cleanName = exerciseName.split(' - ')[0].trim();
      // Enlever les parenthèses et leur contenu
      cleanName = cleanName.replace(/\([^)]*\)/g, '').trim();
      
      console.log(`🔍 Recherche de l'exercice: "${cleanName}" (original: "${exerciseName}")`);
      
      const query = `
        SELECT 
          id, name, description, category, difficulty, 
          muscle_group, image_url, video_url, instructions,
          duration, calories_per_minute
        FROM exercises 
        WHERE 
          name ILIKE $1 
          OR name ILIKE $2
          OR name ILIKE $3
          OR $4 ILIKE CONCAT('%', name, '%')
        LIMIT 1
      `;
      
      const result = await pool.query(query, [
        `%${cleanName}%`,
        `${cleanName}%`,
        `%${cleanName}`,
        cleanName
      ]);
      
      if (result.rows.length > 0) {
        const exercise = result.rows[0];
        console.log(`✅ Exercice trouvé: "${exercise.name}" (ID: ${exercise.id})`);
        return {
          id: exercise.id,
          name: exercise.name,
          description: exercise.description || 'Exercice de musculation',
          image_url: exercise.image_url || '/exercises/default.jpg',
          instructions: exercise.instructions || 'Suivre les consignes du coach',
          category: exercise.category || 'general',
          difficulty: exercise.difficulty || 'debutant',
          muscle_group: exercise.muscle_group || 'general',
          calories_per_minute: exercise.calories_per_minute || 5.0,
          duration: defaultDuration || exercise.duration || 30
        };
      }
      
      // ✅ Si l'exercice n'existe pas, essayer de mapper avec mapExerciseName
      const mappedExercise = mapExerciseName(exerciseName);
      if (mappedExercise && mappedExercise !== cleanName) {
        console.log(`🔄 Exercice mappé: "${exerciseName}" → "${mappedExercise}"`);
        return await this.findExerciseInDB(mappedExercise, defaultDuration);
      }
      
      // ✅ Si toujours pas trouvé, retourner un exercice par défaut
      console.warn(`⚠️ Exercice non trouvé dans la base: ${cleanName}`);
      return {
        id: null,
        name: cleanName,
        description: 'Exercice non trouvé dans la base',
        image_url: '/exercises/default.jpg',
        instructions: 'Demander les instructions au coach',
        category: 'general',
        difficulty: 'debutant',
        muscle_group: 'general',
        calories_per_minute: 5.0,
        duration: defaultDuration || 30
      };
    } catch (error) {
      console.error('Error finding exercise in DB:', error);
      return {
        id: null,
        name: exerciseName,
        description: 'Erreur de chargement',
        image_url: '/exercises/default.jpg',
        instructions: 'Erreur lors du chargement',
        category: 'general',
        difficulty: 'debutant',
        muscle_group: 'general',
        calories_per_minute: 5.0,
        duration: defaultDuration || 30
      };
    }
  }

  // ✅ Générer un programme avec les exercices de la base
  static async generateProgramWithDBExercises(profile, goal, level) {
    const baseProgram = this.generateProgram(profile, goal, level);
    
    const enrichedExercises = [];
    
    for (const day of baseProgram.exercises) {
      const dayExercises = [];
      
      for (const exerciseName of day.exercises) {
        // ✅ Chercher l'exercice dans la base avec mapping
        const exercise = await this.findExerciseInDB(exerciseName);
        dayExercises.push(exercise);
      }
      
      enrichedExercises.push({
        day: day.day,
        exercises: dayExercises
      });
    }
    
    return {
      ...baseProgram,
      exercises: enrichedExercises
    };
  }

  // ✅ Créer un programme avec exercices
  static async createWithExercises(programData) {
    const { 
      adherent_id, name, description, goal, level, 
      duration_weeks, exercises, schedule,
      confidence_score, explanation, source
    } = programData;
    
    const exercisesJson = JSON.stringify(exercises || []);
    const scheduleJson = JSON.stringify(schedule || {});
    
    const query = `
      INSERT INTO programs (
        adherent_id, name, description, goal, level, 
        duration_weeks, exercises, schedule, status, 
        confidence_score, explanation, source, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, 'active',
              $9, $10, $11, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [
      adherent_id, 
      name, 
      description, 
      goal, 
      level, 
      duration_weeks, 
      exercisesJson, 
      scheduleJson,
      confidence_score || null,
      explanation || null,
      source || 'local'
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ✅ Générer un programme personnalisé (structure de base)
  static generateProgram(profile, goal, level) {
    const programs = {
      'perte_de_poids': {
        'debutant': {
          name: 'Programme Perte de Poids - Débutant',
          description: 'Programme adapté pour commencer votre perte de poids en douceur',
          exercises: [
            { day: 'Lundi', exercises: ['Cardio 30 min', 'Circuit training léger'] },
            { day: 'Mercredi', exercises: ['Cardio 35 min', 'Musculation légère'] },
            { day: 'Vendredi', exercises: ['Cardio 30 min', 'Étirements'] }
          ],
          schedule: { frequency: '3 fois par semaine', duration: '45 minutes' }
        },
        'intermediaire': {
          name: 'Programme Perte de Poids - Intermédiaire',
          description: 'Programme intensifié pour accélérer votre perte de poids',
          exercises: [
            { day: 'Lundi', exercises: ['Cardio 45 min', 'HIIT 15 min', 'Musculation'] },
            { day: 'Mercredi', exercises: ['Cardio 40 min', 'Circuit training'] },
            { day: 'Vendredi', exercises: ['Cardio 45 min', 'HIIT 20 min'] },
            { day: 'Samedi', exercises: ['Cardio 30 min', 'Musculation'] }
          ],
          schedule: { frequency: '4 fois par semaine', duration: '60 minutes' }
        },
        'avance': {
          name: 'Programme Perte de Poids - Avancé',
          description: 'Programme intense pour une perte de poids maximale',
          exercises: [
            { day: 'Lundi', exercises: ['Cardio 60 min', 'HIIT 25 min', 'Musculation avancée'] },
            { day: 'Mardi', exercises: ['Cardio 50 min', 'Circuit training intensif'] },
            { day: 'Jeudi', exercises: ['Cardio 60 min', 'HIIT 30 min'] },
            { day: 'Vendredi', exercises: ['Cardio 45 min', 'Musculation avancée'] },
            { day: 'Samedi', exercises: ['Cardio 40 min', 'HIIT 20 min'] }
          ],
          schedule: { frequency: '5 fois par semaine', duration: '75 minutes' }
        }
      },
      'prise_de_masse': {
        'debutant': {
          name: 'Programme Prise de Masse - Débutant',
          description: 'Commencez votre prise de masse musculaire',
          exercises: [
            { day: 'Lundi', exercises: ['Musculation (haut du corps)', 'Cardio léger'] },
            { day: 'Mercredi', exercises: ['Musculation (bas du corps)', 'Cardio léger'] },
            { day: 'Vendredi', exercises: ['Musculation (corps entier)'] }
          ],
          schedule: { frequency: '3 fois par semaine', duration: '50 minutes' }
        },
        'intermediaire': {
          name: 'Programme Prise de Masse - Intermédiaire',
          description: 'Programme structuré pour une prise de masse efficace',
          exercises: [
            { day: 'Lundi', exercises: ['Musculation (poitrine, dos)', 'Cardio modéré'] },
            { day: 'Mardi', exercises: ['Musculation (jambes, abdos)'] },
            { day: 'Jeudi', exercises: ['Musculation (épaules, bras)'] },
            { day: 'Vendredi', exercises: ['Musculation (corps entier)', 'Cardio'] }
          ],
          schedule: { frequency: '4 fois par semaine', duration: '60 minutes' }
        },
        'avance': {
          name: 'Programme Prise de Masse - Avancé',
          description: 'Programme intensif pour une prise de masse maximale',
          exercises: [
            { day: 'Lundi', exercises: ['Musculation (pecs, triceps)', 'Cardio 15 min'] },
            { day: 'Mardi', exercises: ['Musculation (dos, biceps)', 'Cardio 15 min'] },
            { day: 'Mercredi', exercises: ['Musculation (jambes, abdos)'] },
            { day: 'Jeudi', exercises: ['Musculation (épaules, trapèzes)'] },
            { day: 'Vendredi', exercises: ['Musculation (corps entier)'] },
            { day: 'Samedi', exercises: ['Cardio 20 min', 'Étirements'] }
          ],
          schedule: { frequency: '5-6 fois par semaine', duration: '70 minutes' }
        }
      },
      'remise_en_forme': {
        'debutant': {
          name: 'Programme Remise en Forme - Débutant',
          description: 'Reprenez le sport en douceur',
          exercises: [
            { day: 'Lundi', exercises: ['Cardio 20 min', 'Renforcement musculaire léger'] },
            { day: 'Mercredi', exercises: ['Cardio 25 min', 'Étirements'] },
            { day: 'Vendredi', exercises: ['Cardio 20 min', 'Renforcement'] }
          ],
          schedule: { frequency: '3 fois par semaine', duration: '40 minutes' }
        },
        'intermediaire': {
          name: 'Programme Remise en Forme - Intermédiaire',
          description: 'Améliorez votre condition physique',
          exercises: [
            { day: 'Lundi', exercises: ['Cardio 30 min', 'Circuit training'] },
            { day: 'Mardi', exercises: ['Cardio 25 min', 'Renforcement'] },
            { day: 'Jeudi', exercises: ['Cardio 35 min', 'Circuit training'] },
            { day: 'Samedi', exercises: ['Cardio 20 min', 'Étirements'] }
          ],
          schedule: { frequency: '4 fois par semaine', duration: '50 minutes' }
        },
        'avance': {
          name: 'Programme Remise en Forme - Avancé',
          description: 'Programme complet pour une forme optimale',
          exercises: [
            { day: 'Lundi', exercises: ['Cardio 40 min', 'HIIT 15 min'] },
            { day: 'Mardi', exercises: ['Cardio 30 min', 'Musculation'] },
            { day: 'Mercredi', exercises: ['Cardio 35 min', 'Circuit training'] },
            { day: 'Jeudi', exercises: ['Cardio 30 min', 'Musculation'] },
            { day: 'Vendredi', exercises: ['Cardio 45 min', 'HIIT 20 min'] },
            { day: 'Samedi', exercises: ['Cardio 25 min', 'Étirements'] }
          ],
          schedule: { frequency: '5-6 fois par semaine', duration: '60 minutes' }
        }
      }
    };

    return programs[goal]?.[level] || programs['remise_en_forme']['debutant'];
  }

  // ✅ Récupérer les programmes d'un adhérent
  static async findByAdherentId(adherentId) {
    const query = `
      SELECT * FROM programs 
      WHERE adherent_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [adherentId]);
    return result.rows;
  }

  // ✅ Récupérer un programme par ID
  static async findById(id) {
    const query = 'SELECT * FROM programs WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // ✅ Récupérer le programme actif
  static async getActiveProgram(adherentId) {
    const query = `
      SELECT * FROM programs 
      WHERE adherent_id = $1 AND status = 'active'
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    const result = await pool.query(query, [adherentId]);
    return result.rows[0] || null;
  }

  // ✅ Mettre à jour le statut d'un programme
  static async updateStatus(id, status) {
    const query = `
      UPDATE programs 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  // ✅ Mettre à jour un programme
  static async update(id, programData) {
    const { name, description, goal, level, duration_weeks, exercises, schedule } = programData;
    
    const exercisesJson = JSON.stringify(exercises || []);
    const scheduleJson = JSON.stringify(schedule || {});
    
    const query = `
      UPDATE programs 
      SET name = $1, description = $2, goal = $3, level = $4,
          duration_weeks = $5, exercises = $6::jsonb, schedule = $7::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;
    
    const values = [name, description, goal, level, duration_weeks, exercisesJson, scheduleJson, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ✅ Supprimer un programme
  static async delete(id) {
    const query = 'DELETE FROM programs WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getProgramWithDetails(programId) {
    const program = await this.findById(programId);
    if (!program) return null;
    
    // Si les exercices sont déjà des objets (avec id, name, image_url, etc.)
    if (program.exercises && program.exercises.length > 0) {
      // Vérifier si le premier exercice est un objet ou une chaîne
      const firstDay = program.exercises[0];
      if (firstDay && firstDay.exercises && firstDay.exercises.length > 0) {
        const firstExercise = firstDay.exercises[0];
        // Si c'est déjà un objet avec un id, on retourne tel quel
        if (typeof firstExercise === 'object' && firstExercise !== null) {
          return program;
        }
      }
    }
    
    // Sinon, enrichir les exercices
    const enrichedExercises = [];
    
    for (const day of program.exercises || []) {
      const dayExercises = [];
      
      for (const exercise of day.exercises || []) {
        // Si l'exercice est une chaîne, chercher dans la base
        if (typeof exercise === 'string') {
          const exerciseDetail = await this.findExerciseInDB(exercise);
          dayExercises.push(exerciseDetail);
        } else {
          // Déjà un objet
          dayExercises.push(exercise);
        }
      }
      
      enrichedExercises.push({
        day: day.day,
        exercises: dayExercises
      });
    }
    
    return {
      ...program,
      exercises: enrichedExercises
    };
  }
}

module.exports = Program;