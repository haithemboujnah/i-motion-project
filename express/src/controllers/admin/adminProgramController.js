const Admin = require('../../models/Admin');
const Program = require('../../models/Program');
const mlService = require('../../services/mlService');

class AdminProgramController {
  // ✅ Récupérer tous les programmes
  static async getAllPrograms(req, res) {
    try {
      const programs = await Admin.getAllPrograms();
      
      res.json({
        success: true,
        data: { programs }
      });
    } catch (error) {
      console.error('Error getting programs:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des programmes'
      });
    }
  }

  // ✅ Créer un programme (CORRIGÉ - avec exercices enrichis)
  static async createProgram(req, res) {
    try {
      const programData = req.body;
      
      // ✅ Si l'admin choisit la génération automatique avec IA
      if (programData.auto_generate) {
        // Récupérer le profil de l'adhérent (si attribué)
        let profile = null;
        let profileData = { goal: programData.goal, level: programData.level };
        
        if (programData.adherent_id) {
          const Profile = require('../../models/Profile');
          profile = await Profile.findByUserId(programData.adherent_id);
          if (profile) {
            profileData = {
              age: profile.age,
              weight: profile.weight,
              height: profile.height,
              goal: profile.goal || programData.goal,
              level: profile.level || programData.level
            };
          }
        }
        
        // ✅ Essayer d'utiliser le service ML (FastAPI) d'abord
        let useML = false;
        let mlData = null;
        let generatedExercises = null;
        let schedule = null;
        let name = '';
        let description = '';
        let confidenceScore = 0;
        let explanation = '';
        
        try {
          // Calculer l'IMC pour le ML
          let bmi = null;
          if (profileData.height && profileData.weight) {
            const heightInMeters = profileData.height / 100;
            bmi = profileData.weight / (heightInMeters * heightInMeters);
          }
          
          const mlResponse = await mlService.recommendProgram(
            programData.adherent_id || 0,
            programData.goal,
            programData.level,
            {
              age: profileData.age || 30,
              weight: profileData.weight || 70,
              height: profileData.height || 175,
              bmi: bmi || 22.9,
              body_fat: null,
              muscle_mass: null
            }
          );
          
          if (mlResponse.success) {
            mlData = mlResponse.data;
            useML = true;
            name = mlData.program.name;
            description = mlData.program.description;
            generatedExercises = mlData.program.exercises;
            schedule = mlData.program.schedule;
            confidenceScore = mlData.confidence_score;
            explanation = mlData.explanation;
            console.log('✅ Programme généré par IA (FastAPI) pour l\'admin');
          }
        } catch (mlError) {
          console.warn('⚠️ Service ML indisponible pour l\'admin, fallback vers exerciseMapping');
        }
        
        // ✅ Générer les exercices de base (ML ou local)
        let baseExercises = [];
        let baseSchedule = {};
        
        if (useML && mlData) {
          baseExercises = mlData.program.exercises || [];
          baseSchedule = mlData.program.schedule || { frequency: '3 fois par semaine', duration: '45 minutes' };
        } else {
          const localProgram = Program.generateProgram(
            profile || { goal: programData.goal, level: programData.level },
            programData.goal,
            programData.level
          );
          baseExercises = localProgram.exercises || [];
          baseSchedule = localProgram.schedule || { frequency: '3 fois par semaine', duration: '45 minutes' };
          name = localProgram.name;
          description = localProgram.description;
          confidenceScore = 0.7;
          explanation = 'Programme généré localement avec exerciseMapping';
        }
        
        // ✅ ENRICHIR LES EXERCICES AVEC LES DÉTAILS DE LA BASE
        const enrichedExercises = [];
        for (const day of baseExercises) {
          const enrichedDay = {
            day: day.day,
            exercises: []
          };
          
          for (const exerciseName of day.exercises) {
            // ✅ Chercher l'exercice dans la base avec mapping
            const exerciseDetail = await Program.findExerciseInDB(exerciseName);
            enrichedDay.exercises.push(exerciseDetail);
          }
          
          enrichedExercises.push(enrichedDay);
        }
        
        // ✅ Utiliser les exercices enrichis
        programData.name = programData.name || name;
        programData.description = programData.description || description;
        programData.exercises = enrichedExercises; // ✅ Maintenant avec images et détails
        programData.schedule = schedule || baseSchedule;
        programData.confidence_score = confidenceScore;
        programData.explanation = explanation;
        programData.source = useML ? 'fastapi' : 'local';
        
        console.log(`✅ ${enrichedExercises.length} jours d'exercices enrichis pour l'admin`);
      }
      
      // Créer le programme
      const program = await Admin.createProgram(programData);
      
      res.status(201).json({
        success: true,
        message: 'Programme créé avec succès',
        data: {
          program,
          source: programData.source || 'manual',
          confidence_score: programData.confidence_score || null,
          explanation: programData.explanation || null
        }
      });
    } catch (error) {
      console.error('Error creating program:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la création du programme: ' + error.message
      });
    }
  }
  
  // ✅ Mettre à jour un programme
  static async updateProgram(req, res) {
    try {
      const { id } = req.params;
      const programData = req.body;
      
      // ✅ Vérifier que le programme existe
      const existingProgram = await Program.findById(id);
      if (!existingProgram) {
        return res.status(404).json({
          success: false,
          error: 'Programme non trouvé'
        });
      }
      
      // ✅ Préparer les données pour la mise à jour
      const updateData = {
        name: programData.name || existingProgram.name,
        description: programData.description || existingProgram.description,
        goal: programData.goal || existingProgram.goal,
        level: programData.level || existingProgram.level,
        duration_weeks: programData.duration_weeks || existingProgram.duration_weeks,
        status: programData.status || existingProgram.status,
        schedule: programData.schedule || existingProgram.schedule,
        exercises: programData.exercises || existingProgram.exercises
      };
      
      const program = await Admin.updateProgram(id, updateData);
      
      res.json({
        success: true,
        message: 'Programme mis à jour avec succès',
        data: { program }
      });
    } catch (error) {
      console.error('Error updating program:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour du programme: ' + error.message
      });
    }
  }

  // ✅ Générer des exercices (CORRIGÉ - avec enrichissement)
  static async generateExercises(req, res) {
    try {
      const { goal, level, adherent_id } = req.body;
      
      // Récupérer le profil si un adhérent est spécifié
      let profile = null;
      let profileData = { goal, level };
      
      if (adherent_id) {
        const Profile = require('../../models/Profile');
        profile = await Profile.findByUserId(adherent_id);
        if (profile) {
          profileData = {
            age: profile.age,
            weight: profile.weight,
            height: profile.height,
            goal: profile.goal || goal,
            level: profile.level || level
          };
        }
      }
      
      // ✅ Essayer d'utiliser le service ML (FastAPI)
      let useML = false;
      let mlData = null;
      let baseExercises = [];
      let schedule = {};
      let name = '';
      let description = '';
      let confidenceScore = 0;
      let explanation = '';
      
      try {
        // Calculer l'IMC
        let bmi = null;
        if (profileData.height && profileData.weight) {
          const heightInMeters = profileData.height / 100;
          bmi = profileData.weight / (heightInMeters * heightInMeters);
        }
        
        const mlResponse = await mlService.recommendProgram(
          adherent_id || 0,
          goal,
          level,
          {
            age: profileData.age || 30,
            weight: profileData.weight || 70,
            height: profileData.height || 175,
            bmi: bmi || 22.9,
            body_fat: null,
            muscle_mass: null
          }
        );
        
        if (mlResponse.success) {
          mlData = mlResponse.data;
          useML = true;
          name = mlData.program.name;
          description = mlData.program.description;
          baseExercises = mlData.program.exercises || [];
          schedule = mlData.program.schedule || { frequency: '3 fois par semaine', duration: '45 minutes' };
          confidenceScore = mlData.confidence_score;
          explanation = mlData.explanation;
          console.log('✅ Exercices générés par IA (FastAPI)');
        }
      } catch (mlError) {
        console.warn('⚠️ Service ML indisponible, fallback vers exerciseMapping');
      }
      
      // ✅ Fallback: Génération locale
      if (!useML) {
        const localProgram = Program.generateProgram(
          profile || { goal, level },
          goal,
          level
        );
        name = localProgram.name;
        description = localProgram.description;
        baseExercises = localProgram.exercises || [];
        schedule = localProgram.schedule || { frequency: '3 fois par semaine', duration: '45 minutes' };
        confidenceScore = 0.7;
        explanation = 'Programme généré localement avec exerciseMapping';
      }
      
      // ✅ ENRICHIR LES EXERCICES AVEC LES DÉTAILS DE LA BASE
      const enrichedExercises = [];
      for (const day of baseExercises) {
        const enrichedDay = {
          day: day.day,
          exercises: []
        };
        
        for (const exerciseName of day.exercises) {
          // ✅ Chercher l'exercice dans la base avec mapping
          const exerciseDetail = await Program.findExerciseInDB(exerciseName);
          enrichedDay.exercises.push(exerciseDetail);
        }
        
        enrichedExercises.push(enrichedDay);
      }
      
      res.json({
        success: true,
        data: {
          exercises: enrichedExercises, // ✅ Maintenant avec images et détails
          schedule: schedule,
          name: name,
          description: description,
          confidence_score: confidenceScore,
          explanation: explanation,
          source: useML ? 'fastapi' : 'local'
        }
      });
    } catch (error) {
      console.error('Error generating exercises:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la génération des exercices: ' + error.message
      });
    }
  }

  // ✅ Supprimer un programme
  static async deleteProgram(req, res) {
    try {
      const { id } = req.params;
      
      const existingProgram = await Program.findById(id);
      if (!existingProgram) {
        return res.status(404).json({
          success: false,
          error: 'Programme non trouvé'
        });
      }
      
      const program = await Admin.deleteProgram(id);
      
      res.json({
        success: true,
        message: 'Programme supprimé avec succès',
        data: { program }
      });
    } catch (error) {
      console.error('Error deleting program:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression du programme'
      });
    }
  }

  // ✅ Attribuer un programme à un adhérent
  static async assignProgram(req, res) {
    try {
      const { programId, adherentId } = req.params;
      
      const existingProgram = await Program.findById(programId);
      if (!existingProgram) {
        return res.status(404).json({
          success: false,
          error: 'Programme non trouvé'
        });
      }
      
      const User = require('../../models/User');
      const adherent = await User.findById(adherentId);
      if (!adherent || adherent.role !== 'adherent') {
        return res.status(404).json({
          success: false,
          error: 'Adhérent non trouvé'
        });
      }
      
      const program = await Admin.assignProgramToAdherent(programId, adherentId);
      
      res.json({
        success: true,
        message: 'Programme attribué avec succès',
        data: { program }
      });
    } catch (error) {
      console.error('Error assigning program:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'attribution du programme'
      });
    }
  }
}

module.exports = AdminProgramController;