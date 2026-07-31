const Session = require('../../models/Session');
const Coach = require('../../models/Coach');
const Notification = require('../../models/Notification');
const Gamification = require('../../models/Gamification');

class CoachSessionController {
  // ✅ Récupérer les séances du coach
  static async getSessions(req, res) {
    try {
      const coachId = req.user.userId;
      const { status, startDate, endDate, date } = req.query;
      
      const sessions = await Coach.getSessions(coachId, {
        status,
        startDate,
        endDate,
        date
      });
      
      res.json({
        success: true,
        data: { sessions }
      });
    } catch (error) {
      console.error('Error getting sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des séances'
      });
    }
  }

  // ✅ Créer une séance pour un adhérent (CORRIGÉ)
  static async createSession(req, res) {
    try {
      const coachId = req.user.userId;
      const { adherent_id, date, time, duration, type } = req.body;
      
      console.log('📝 Création de séance par coach:', {
        coachId,
        adherent_id,
        date,
        time,
        duration: duration || 20,
        type: type || 'EMS'
      });
      
      // Vérifier que l'adhérent existe
      const User = require('../../models/User');
      const adherent = await User.findById(adherent_id);
      
      if (!adherent) {
        console.log('❌ Adhérent non trouvé:', adherent_id);
        return res.status(404).json({
          success: false,
          error: 'Adhérent non trouvé'
        });
      }
      
      if (adherent.role !== 'adherent') {
        console.log('❌ L\'utilisateur n\'est pas un adhérent:', adherent.role);
        return res.status(400).json({
          success: false,
          error: 'L\'utilisateur n\'est pas un adhérent'
        });
      }
      
      // ✅ Créer la séance avec la méthode Session.create
      const session = await Session.create({
        coach_id: parseInt(coachId),
        adherent_id: parseInt(adherent_id),
        date: date,
        time: time,
        duration: parseInt(duration) || 20,
        type: type || 'EMS',
        status: 'reserved'
      });
      
      console.log('✅ Séance créée:', session);
      
      // Notification à l'adhérent
      await Notification.create({
        user_id: adherent_id,
        title: '📅 Nouvelle séance',
        message: `Vous avez une nouvelle séance ${type || 'EMS'} le ${date} à ${time} (${duration || 20} min)`,
        type: 'session_reservation',
        link: `/sessions/${session.id}`
      });
      
      res.status(201).json({
        success: true,
        message: 'Séance créée avec succès',
        data: { session }
      });
    } catch (error) {
      console.error('❌ Error creating session:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de la séance: ' + error.message
      });
    }
  }

  // ✅ Mettre à jour le statut d'une séance (pointage)
  static async updateSessionStatus(req, res) {
    try {
      const { sessionId } = req.params;
      const { status } = req.body;
      
      const session = await Coach.updateSessionStatus(sessionId, status);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Séance non trouvée'
        });
      }
      
      // Si la séance est complétée, ajouter des points
      if (status === 'completed' && session.adherent_id) {
        await Gamification.addPoints(session.adherent_id, 15, 'Séance complétée');
        await Gamification.checkAndAwardBadges(session.adherent_id);
        
        await Notification.create({
          user_id: session.adherent_id,
          title: '✅ Séance complétée',
          message: `Bravo ! Vous avez complété votre séance du ${session.date}`,
          type: 'achievement',
          link: `/sessions/${session.id}`
        });
      }
      
      res.json({
        success: true,
        message: 'Statut de la séance mis à jour',
        data: { session }
      });
    } catch (error) {
      console.error('Error updating session status:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour du statut'
      });
    }
  }
}

module.exports = CoachSessionController;