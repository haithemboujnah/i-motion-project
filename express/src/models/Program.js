const { pool } = require('../config/database');
const { mapExerciseName } = require('../config/exerciseMapping');

class Program {
  // ✅ Chercher un exercice dans la base de données
  static async findExerciseInDB(exerciseName, defaultDuration = 30) {
    try {
      // Nettoyer le nom
      const cleanName = exerciseName.split(' - ')[0].trim();
      
      const query = `
        SELECT 
          id, name, description, category, difficulty, 
          muscle_group, image_url, video_url, instructions,
          duration, calories_per_minute
        FROM exercises 
        WHERE 
          name ILIKE $1 
          OR name ILIKE $2
          OR $3 ILIKE CONCAT('%', name, '%')
        LIMIT 1
      `;
      
      const result = await pool.query(query, [
        `%${cleanName}%`,
        `${cleanName}%`,
        cleanName
      ]);
      
      if (result.rows.length > 0) {
        const exercise = result.rows[0];
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
      
      // ✅ Si l'exercice n'existe pas, retourner un exercice par défaut avec image
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
    
    const exercisesJson = JSON.stringify(exercises);
    const scheduleJson = JSON.stringify(schedule);
    
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
          description: 'Programme adapté pour commencer votre perte de poids avec l\'EMS',
          exercises: [
            { day: 'Lundi', exercises: ['Squat EMS - 20 min', 'Gainage EMS - 15 min'] },
            { day: 'Jeudi', exercises: ['Demi-squat EMS - 20 min', 'Bird Dog EMS - 15 min'] }
          ],
          schedule: { frequency: '2 fois par semaine', duration: '45 minutes' }
        },
        'intermediaire': {
          name: 'Programme Perte de Poids - Intermédiaire',
          description: 'Programme intensifié pour accélérer votre perte de poids avec l\'EMS',
          exercises: [
            { day: 'Lundi', exercises: ['Squat EMS - 25 min', 'Gainage EMS - 20 min', 'Mountain Climber EMS - 15 min'] },
            { day: 'Jeudi', exercises: ['Fente EMS - 25 min', 'Crunch EMS - 20 min', 'Jump Squat EMS - 15 min'] }
          ],
          schedule: { frequency: '2 fois par semaine', duration: '60 minutes' }
        },
        'avance': {
          name: 'Programme Perte de Poids - Avancé',
          description: 'Programme intense pour une perte de poids maximale avec l\'EMS',
          exercises: [
            { day: 'Lundi', exercises: ['Jump Squat EMS - 25 min', 'Mountain Climber EMS - 20 min', 'Gainage EMS - 20 min'] },
            { day: 'Jeudi', exercises: ['Squat EMS - 25 min', 'Russian Twist EMS - 20 min', 'Planche latérale EMS - 15 min'] }
          ],
          schedule: { frequency: '2 fois par semaine', duration: '75 minutes' }
        }
      },
      'prise_de_masse': {
        'debutant': {
          name: 'Programme Prise de Masse - Débutant',
          description: 'Commencez votre prise de masse musculaire avec l\'EMS',
          exercises: [
            { day: 'Lundi', exercises: ['Squat EMS - 20 min', 'Gainage EMS - 15 min'] },
            { day: 'Jeudi', exercises: ['Demi-squat EMS - 20 min', 'Pont fessier EMS - 15 min'] }
          ],
          schedule: { frequency: '2 fois par semaine', duration: '50 minutes' }
        },
        'intermediaire': {
          name: 'Programme Prise de Masse - Intermédiaire',
          description: 'Programme structuré pour une prise de masse efficace avec l\'EMS',
          exercises: [
            { day: 'Lundi', exercises: ['Squat EMS - 25 min', 'Pont fessier EMS - 20 min', 'Gainage EMS - 15 min'] },
            { day: 'Jeudi', exercises: ['Fente EMS - 25 min', 'Crunch EMS - 20 min', 'Superman EMS - 15 min'] }
          ],
          schedule: { frequency: '2 fois par semaine', duration: '60 minutes' }
        },
        'avance': {
          name: 'Programme Prise de Masse - Avancé',
          description: 'Programme intensif pour une prise de masse maximale avec l\'EMS',
          exercises: [
            { day: 'Lundi', exercises: ['Jump Squat EMS - 25 min', 'Squat EMS - 20 min', 'Gainage EMS - 20 min'] },
            { day: 'Jeudi', exercises: ['Fente EMS - 25 min', 'Planche latérale EMS - 20 min', 'Russian Twist EMS - 15 min'] }
          ],
          schedule: { frequency: '2 fois par semaine', duration: '70 minutes' }
        }
      },
      'remise_en_forme': {
        'debutant': {
          name: 'Programme Remise en Forme - Débutant',
          description: 'Améliorez votre condition physique avec l\'EMS',
          exercises: [
            { day: 'Lundi', exercises: ['Squat EMS - 20 min', 'Gainage EMS - 15 min'] },
            { day: 'Jeudi', exercises: ['Demi-squat EMS - 20 min', 'Bird Dog EMS - 15 min'] }
          ],
          schedule: { frequency: '2 fois par semaine', duration: '40 minutes' }
        },
        'intermediaire': {
          name: 'Programme Remise en Forme - Intermédiaire',
          description: 'Améliorez votre condition physique globale avec l\'EMS',
          exercises: [
            { day: 'Lundi', exercises: ['Squat EMS - 25 min', 'Gainage EMS - 20 min', 'Mountain Climber EMS - 15 min'] },
            { day: 'Jeudi', exercises: ['Fente EMS - 25 min', 'Crunch EMS - 20 min', 'Planche latérale EMS - 15 min'] }
          ],
          schedule: { frequency: '2 fois par semaine', duration: '50 minutes' }
        },
        'avance': {
          name: 'Programme Remise en Forme - Avancé',
          description: 'Programme complet pour une forme optimale avec l\'EMS',
          exercises: [
            { day: 'Lundi', exercises: ['Jump Squat EMS - 25 min', 'Mountain Climber EMS - 20 min', 'Gainage EMS - 15 min'] },
            { day: 'Jeudi', exercises: ['Squat EMS - 25 min', 'Russian Twist EMS - 20 min', 'Planche latérale EMS - 15 min'] }
          ],
          schedule: { frequency: '2 fois par semaine', duration: '60 minutes' }
        }
      },
      'modelage_raffermissement': {
        'debutant': {
          name: 'Programme Modelage & Raffermissement - Débutant',
          description: 'Sculptez votre silhouette avec l\'EMS et I-Shape',
          exercises: [
            { day: 'Lundi', exercises: ['Drainage lymphatique - 25 min', 'Raffermissement des cuisses - 20 min'] },
            { day: 'Jeudi', exercises: ['Raffermissement des fessiers - 25 min', 'Réduction de la cellulite - 20 min'] }
          ],
          schedule: { frequency: '2 fois par semaine', duration: '50 minutes' }
        },
        'intermediaire': {
          name: 'Programme Modelage & Raffermissement - Intermédiaire',
          description: 'Programme complet pour sculpter votre silhouette',
          exercises: [
            { day: 'Lundi', exercises: ['Drainage lymphatique - 30 min', 'Raffermissement des cuisses - 25 min', 'Réduction de la cellulite - 20 min'] },
            { day: 'Jeudi', exercises: ['Raffermissement des fessiers - 30 min', 'Raffermissement des bras - 25 min', 'Drainage lymphatique - 20 min'] }
          ],
          schedule: { frequency: '2 fois par semaine', duration: '60 minutes' }
        },
        'avance': {
          name: 'Programme Modelage & Raffermissement - Avancé',
          description: 'Programme intensif pour une silhouette sculptée',
          exercises: [
            { day: 'Lundi', exercises: ['Drainage lymphatique - 35 min', 'Raffermissement des cuisses - 30 min', 'Réduction de la cellulite - 25 min'] },
            { day: 'Jeudi', exercises: ['Raffermissement des fessiers - 35 min', 'Raffermissement des bras - 30 min', 'Drainage lymphatique - 25 min'] }
          ],
          schedule: { frequency: '2 fois par semaine', duration: '70 minutes' }
        }
      },
      'recuperation_bien_etre': {
        'debutant': {
          name: 'Programme Récupération & Bien-être - Débutant',
          description: 'Retrouvez votre tonicité et soulagez les douleurs avec l\'EMS',
          exercises: [
            { day: 'Lundi', exercises: ['Renforcement abdominal - 25 min', 'Renforcement lombaire - 20 min'] },
            { day: 'Jeudi', exercises: ['Renforcement fessiers - 25 min', 'Renforcement abdominal - 20 min'] }
          ],
          schedule: { frequency: '2 fois par semaine', duration: '45 minutes' }
        },
        'intermediaire': {
          name: 'Programme Récupération & Bien-être - Intermédiaire',
          description: 'Programme complet pour votre bien-être avec I-Model',
          exercises: [
            { day: 'Lundi', exercises: ['Renforcement abdominal - 30 min', 'Renforcement lombaire - 25 min', 'Renforcement fessiers - 20 min'] },
            { day: 'Jeudi', exercises: ['Renforcement fessiers - 30 min', 'Renforcement quadriceps - 25 min', 'Renforcement abdominal - 20 min'] }
          ],
          schedule: { frequency: '2 fois par semaine', duration: '60 minutes' }
        },
        'avance': {
          name: 'Programme Récupération & Bien-être - Avancé',
          description: 'Programme intensif pour une récupération optimale',
          exercises: [
            { day: 'Lundi', exercises: ['Renforcement abdominal - 35 min', 'Renforcement lombaire - 30 min', 'Renforcement fessiers - 25 min'] },
            { day: 'Jeudi', exercises: ['Renforcement quadriceps - 35 min', 'Renforcement abdominal - 30 min', 'Renforcement lombaire - 25 min'] }
          ],
          schedule: { frequency: '2 fois par semaine', duration: '70 minutes' }
        }
      },
      'lifting_naturel': {
        'debutant': {
          name: 'Programme Lifting Naturel & Anti-âge - Débutant',
          description: 'Raffermissez votre visage avec I-Face',
          exercises: [
            { day: 'Lundi', exercises: ['Raffermissement du front - 25 min', 'Tonification des joues - 20 min'] },
            { day: 'Jeudi', exercises: ['Raffermissement du cou - 25 min', 'Stimulation du collagène - 20 min'] }
          ],
          schedule: { frequency: '2 fois par semaine', duration: '45 minutes' }
        },
        'intermediaire': {
          name: 'Programme Lifting Naturel & Anti-âge - Intermédiaire',
          description: 'Programme complet pour rajeunir votre peau',
          exercises: [
            { day: 'Lundi', exercises: ['Raffermissement du front - 30 min', 'Tonification des joues - 25 min', 'Stimulation du collagène - 20 min'] },
            { day: 'Jeudi', exercises: ['Raffermissement du cou - 30 min', 'Stimulation du collagène - 25 min', 'Tonification des joues - 20 min'] }
          ],
          schedule: { frequency: '2 fois par semaine', duration: '60 minutes' }
        },
        'avance': {
          name: 'Programme Lifting Naturel & Anti-âge - Avancé',
          description: 'Programme intensif pour un lifting naturel',
          exercises: [
            { day: 'Lundi', exercises: ['Stimulation du collagène - 35 min', 'Raffermissement du front - 30 min', 'Tonification des joues - 25 min'] },
            { day: 'Jeudi', exercises: ['Raffermissement du cou - 35 min', 'Stimulation du collagène - 30 min', 'Raffermissement du front - 25 min'] }
          ],
          schedule: { frequency: '2 fois par semaine', duration: '70 minutes' }
        }
      }
    };

    // ✅ Return the matching program or default to remise_en_forme / debutant
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