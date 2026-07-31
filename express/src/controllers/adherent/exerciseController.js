const Exercise = require('../../models/Exercise');

class ExerciseController {
  // ✅ Récupérer tous les exercices avec filtres
  static async getAll(req, res) {
    try {
      const { category, difficulty, muscle_group } = req.query;
      
      const exercises = await Exercise.getAll({
        category,
        difficulty,
        muscle_group
      });
      
      res.json({
        success: true,
        data: { exercises }
      });
    } catch (error) {
      console.error('Error getting exercises:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des exercices'
      });
    }
  }

  // ✅ Récupérer un exercice par ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const exercise = await Exercise.findById(id);
      
      if (!exercise) {
        return res.status(404).json({
          success: false,
          error: 'Exercice non trouvé'
        });
      }
      
      res.json({
        success: true,
        data: { exercise }
      });
    } catch (error) {
      console.error('Error getting exercise:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'exercice'
      });
    }
  }

  // ✅ Recommander des exercices
  static async getRecommendations(req, res) {
    try {
      const { goal, level, limit = 10 } = req.query;
      
      if (!goal) {
        return res.status(400).json({
          success: false,
          error: 'L\'objectif est requis'
        });
      }
      
      const exercises = await Exercise.getRecommendations(goal, level || 'debutant', parseInt(limit));
      
      res.json({
        success: true,
        data: { 
          exercises,
          recommendations: exercises.map(ex => ({
            ...ex,
            reason: this.getRecommendationReason(ex, goal)
          }))
        }
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la génération des recommandations'
      });
    }
  }

  // ✅ Raison de la recommandation
  static getRecommendationReason(exercise, goal) {
    const reasons = {
      'perte_de_poids': 'Excellent pour brûler des calories',
      'prise_de_masse': 'Idéal pour développer la masse musculaire',
      'remise_en_forme': 'Parfait pour améliorer votre condition physique'
    };
    return reasons[goal] || 'Exercice recommandé pour votre objectif';
  }
}

module.exports = ExerciseController;