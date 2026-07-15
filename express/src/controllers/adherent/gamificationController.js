const Gamification = require('../../models/Gamification');

class GamificationController {
  // ✅ Récupérer les points
  static async getPoints(req, res) {
    try {
      const userId = req.user.userId;
      const points = await Gamification.getPoints(userId);
      
      res.json({
        success: true,
        data: { points }
      });
    } catch (error) {
      console.error('Error getting points:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des points'
      });
    }
  }

  // ✅ Récupérer les badges
  static async getBadges(req, res) {
    try {
      const userId = req.user.userId;
      const badges = await Gamification.getBadges(userId);
      
      res.json({
        success: true,
        data: { badges }
      });
    } catch (error) {
      console.error('Error getting badges:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des badges'
      });
    }
  }

  // ✅ Récupérer les défis
  static async getChallenges(req, res) {
    try {
      const userId = req.user.userId;
      const challenges = await Gamification.getChallenges(userId);
      
      res.json({
        success: true,
        data: { challenges }
      });
    } catch (error) {
      console.error('Error getting challenges:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des défis'
      });
    }
  }

  // ✅ Récupérer le classement
  static async getRanking(req, res) {
    try {
      const { limit = 10 } = req.query;
      const ranking = await Gamification.getRanking(parseInt(limit));
      
      res.json({
        success: true,
        data: { ranking }
      });
    } catch (error) {
      console.error('Error getting ranking:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du classement'
      });
    }
  }
}

module.exports = GamificationController;