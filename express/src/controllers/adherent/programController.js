const Program = require('../../models/Program');
const Profile = require('../../models/Profile');
const Gamification = require('../../models/Gamification');
const Notification = require('../../models/Notification');
const mlService = require('../../services/mlService');

class ProgramController {
  // ✅ Générer un programme (avec exercices de la base)
  static async generateProgram(req, res) {
    try {
      const adherentId = req.user.userId;
      const { goal, level } = req.body;
      
      const profile = await Profile.findByUserId(adherentId);
      if (!profile) {
        return res.status(400).json({
          success: false,
          error: 'Veuillez compléter votre profil d\'abord'
        });
      }
      
      const userGoal = goal || profile.goal || 'remise_en_forme';
      const userLevel = level || profile.level || 'debutant';
      
      let bmi = null;
      if (profile.height && profile.weight) {
        const heightInMeters = profile.height / 100;
        bmi = profile.weight / (heightInMeters * heightInMeters);
      }
      
      // Appeler le service ML
      let mlData = null;
      let useML = false;
      
      try {
        const mlResponse = await mlService.recommendProgram(
          adherentId,
          userGoal,
          userLevel,
          {
            age: profile.age,
            weight: profile.weight,
            height: profile.height,
            bmi: bmi,
            body_fat: null,
            muscle_mass: null
          }
        );
        
        if (mlResponse.success) {
          mlData = mlResponse.data;
          useML = true;
          console.log('✅ Programme généré par IA (FastAPI)');
        }
      } catch (mlError) {
        console.warn('⚠️ Service ML indisponible, fallback vers la génération locale');
      }
      
      // ✅ Générer le programme avec exercices ENRICHIS
      let programData;
      let confidenceScore = 0;
      let explanation = '';
      let enrichedExercises = [];
      
      if (useML && mlData) {
        // === Utiliser la recommandation du service ML ===
        const baseExercises = mlData.program.exercises || [];
        
        // ✅ Enrichir chaque exercice avec les détails de la base
        for (const day of baseExercises) {
          const enrichedDay = {
            day: day.day,
            exercises: []
          };
          
          for (const exerciseName of day.exercises) {
            // ✅ Chercher l'exercice dans la base
            const exerciseDetail = await Program.findExerciseInDB(exerciseName);
            enrichedDay.exercises.push(exerciseDetail);
          }
          
          enrichedExercises.push(enrichedDay);
        }
        
        programData = {
          name: mlData.program.name,
          description: mlData.program.description,
          exercises: enrichedExercises,
          schedule: mlData.program.schedule,
          goal: mlData.goal,
          level: mlData.level
        };
        confidenceScore = mlData.confidence_score || 0.7;
        explanation = mlData.explanation || 'Programme généré par IA';
      } else {
        // === Fallback: Génération locale avec exerciseMapping ===
        const localProgram = await Program.generateProgramWithDBExercises(profile, userGoal, userLevel);
        programData = {
          name: localProgram.name,
          description: localProgram.description,
          exercises: localProgram.exercises,
          schedule: localProgram.schedule,
          goal: userGoal,
          level: userLevel
        };
        confidenceScore = 0.7;
        explanation = 'Programme généré localement avec exerciseMapping';
        console.log('🔄 Fallback: Programme généré localement');
      }
      
      // ✅ Créer le programme dans la base avec les exercices enrichis
      const program = await Program.createWithExercises({
        adherent_id: adherentId,
        name: programData.name,
        description: programData.description,
        goal: programData.goal,
        level: programData.level,
        duration_weeks: 8,
        exercises: programData.exercises, // ✅ Maintenant ce sont des objets avec images
        schedule: programData.schedule,
        confidence_score: confidenceScore,
        explanation: explanation,
        source: useML ? 'fastapi' : 'local'
      });
      
      // Gamification
      const points = useML ? 25 : 20;
      await Gamification.addPoints(adherentId, points, `Génération de programme ${useML ? '(IA)' : '(local)'}`);
      await Gamification.checkAndAwardBadges(adherentId);
      
      // Notification
      const title = useML ? '🤖 Programme IA généré' : '💪 Programme généré';
      const message = useML 
        ? `Votre programme "${programData.name}" est prêt ! (Confiance: ${Math.round(confidenceScore * 100)}%)`
        : `Votre programme personnalisé "${programData.name}" est prêt !`;
      
      await Notification.create({
        user_id: adherentId,
        title: title,
        message: message,
        type: 'program_generated',
        link: `/programs/${program.id}`
      });
      
      res.status(201).json({
        success: true,
        message: useML ? 'Programme généré avec succès par IA' : 'Programme généré avec succès',
        data: {
          program,
          confidence_score: confidenceScore,
          explanation: explanation,
          source: useML ? 'fastapi' : 'local'
        }
      });
    } catch (error) {
      console.error('Error generating program:', error);
      
      // Fallback ultime
      try {
        const profile = await Profile.findByUserId(req.user.userId);
        if (!profile) {
          return res.status(400).json({
            success: false,
            error: 'Veuillez compléter votre profil d\'abord'
          });
        }
        
        const userGoal = req.body.goal || profile.goal || 'remise_en_forme';
        const userLevel = req.body.level || profile.level || 'debutant';
        
        const programData = await Program.generateProgramWithDBExercises(profile, userGoal, userLevel);
        const program = await Program.createWithExercises({
          adherent_id: req.user.userId,
          name: programData.name,
          description: programData.description,
          goal: userGoal,
          level: userLevel,
          duration_weeks: 8,
          exercises: programData.exercises,
          schedule: programData.schedule
        });
        
        await Gamification.addPoints(req.user.userId, 15, 'Génération de programme (fallback)');
        
        return res.status(201).json({
          success: true,
          message: 'Programme généré avec succès (mode secours)',
          data: { program, source: 'emergency_fallback' }
        });
      } catch (fallbackError) {
        res.status(500).json({
          success: false,
          error: 'Erreur lors de la génération du programme: ' + error.message
        });
      }
    }
  }

  // ✅ Récupérer le programme actif avec détails
  static async getActiveProgram(req, res) {
    try {
      const adherentId = req.user.userId;
      const program = await Program.getActiveProgram(adherentId);
      
      if (!program) {
        return res.json({
          success: true,
          data: { program: null }
        });
      }
      
      // ✅ Récupérer les détails avec les exercices de la base
      const programWithDetails = await Program.getProgramWithDetails(program.id);
      
      res.json({
        success: true,
        data: { program: programWithDetails }
      });
    } catch (error) {
      console.error('Error getting active program:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du programme actif'
      });
    }
  }

  // ✅ Récupérer mes programmes
  static async getMyPrograms(req, res) {
    try {
      const adherentId = req.user.userId;
      const programs = await Program.findByAdherentId(adherentId);
      
      res.json({
        success: true,
        data: { programs: programs || [] }
      });
    } catch (error) {
      console.error('Error getting programs:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des programmes'
      });
    }
  }

  // ✅ Récupérer un programme par ID
  static async getProgramById(req, res) {
    try {
      const { id } = req.params;
      const program = await Program.findById(id);
      
      if (!program) {
        return res.status(404).json({
          success: false,
          error: 'Programme non trouvé'
        });
      }
      
      if (program.adherent_id !== parseInt(req.user.userId)) {
        return res.status(403).json({
          success: false,
          error: 'Accès non autorisé à ce programme'
        });
      }
      
      res.json({
        success: true,
        data: { program }
      });
    } catch (error) {
      console.error('Error getting program by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du programme'
      });
    }
  }

  // ✅ Mettre à jour le statut d'un programme
  static async updateProgramStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const program = await Program.findById(id);
      if (!program) {
        return res.status(404).json({
          success: false,
          error: 'Programme non trouvé'
        });
      }
      
      if (program.adherent_id !== parseInt(req.user.userId)) {
        return res.status(403).json({
          success: false,
          error: 'Accès non autorisé'
        });
      }
      
      const updatedProgram = await Program.updateStatus(id, status);
      
      res.json({
        success: true,
        message: 'Statut du programme mis à jour',
        data: { program: updatedProgram }
      });
    } catch (error) {
      console.error('Error updating program status:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour du programme'
      });
    }
  }
}

module.exports = ProgramController;