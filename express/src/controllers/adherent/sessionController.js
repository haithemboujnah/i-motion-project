const Session = require('../../models/Session');
const Notification = require('../../models/Notification');
const Gamification = require('../../models/Gamification');

class SessionController {
  // ✅ Récupérer les séances disponibles
  static async getAvailableSessions(req, res) {
    try {
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({
          success: false,
          error: 'La date est requise'
        });
      }
      
      const sessions = await Session.getAvailableSessions(date);
      
      res.json({
        success: true,
        data: { sessions: sessions || [] }
      });
    } catch (error) {
      console.error('Error fetching available sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des séances'
      });
    }
  }

  // ✅ Réserver une séance (CORRIGÉ)
  static async reserveSession(req, res) {
    try {
      const { session_id } = req.params;
      const adherentId = req.user.userId;
      
      console.log(`📝 Réservation de la session ${session_id} par l'adhérent ${adherentId}`);
      
      // ✅ Vérifier que l'ID est valide
      if (!session_id || isNaN(parseInt(session_id))) {
        console.log(`❌ ID de session invalide: ${session_id}`);
        return res.status(400).json({
          success: false,
          error: 'ID de session invalide'
        });
      }
      
      // ✅ Vérifier si la session existe
      const session = await Session.findById(session_id);
      
      if (!session) {
        console.log(`❌ Session ${session_id} non trouvée`);
        return res.status(404).json({
          success: false,
          error: 'Session non trouvée'
        });
      }
      
      console.log(`📋 Session trouvée:`, session);
      
      // ✅ Vérifier si la session est disponible
      if (session.status !== 'available') {
        console.log(`❌ Session ${session_id} non disponible (statut: ${session.status})`);
        return res.status(400).json({
          success: false,
          error: `Cette session n'est plus disponible (statut: ${session.status})`
        });
      }
      
      // ✅ Vérifier si l'adhérent a déjà réservé cette session
      const existingReservation = await Session.findByAdherentAndSession(adherentId, session_id);
      if (existingReservation) {
        console.log(`❌ Adhérent ${adherentId} a déjà réservé la session ${session_id}`);
        return res.status(400).json({
          success: false,
          error: 'Vous avez déjà réservé cette session'
        });
      }
      
      // ✅ Mettre à jour la session
      const updatedSession = await Session.updateStatus(session_id, 'reserved', adherentId);
      
      if (!updatedSession) {
        console.log(`❌ Erreur lors de la mise à jour de la session ${session_id}`);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la réservation'
        });
      }
      
      // ✅ Ajouter des points
      await Gamification.addPoints(adherentId, 10, 'Réservation de séance');
      
      // ✅ Notification
      await Notification.create({
        user_id: adherentId,
        title: '✅ Réservation confirmée',
        message: `Votre séance du ${session.date} à ${session.time} a été réservée`,
        type: 'session_reservation',
        link: `/sessions/${session_id}`
      });
      
      console.log(`✅ Session ${session_id} réservée avec succès par l'adhérent ${adherentId}`);
      
      res.json({
        success: true,
        message: 'Session réservée avec succès',
        data: { session: updatedSession }
      });
    } catch (error) {
      console.error('Error reserving session:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la réservation: ' + error.message
      });
    }
  }

  // ✅ Annuler une séance
  static async cancelSession(req, res) {
    try {
      const { session_id } = req.params;
      const adherentId = req.user.userId;
      
      const session = await Session.findById(session_id);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session non trouvée'
        });
      }
      
      // Vérifier que la session appartient bien à l'adhérent
      if (session.adherent_id !== parseInt(adherentId)) {
        return res.status(403).json({
          success: false,
          error: 'Vous n\'êtes pas autorisé à annuler cette session'
        });
      }
      
      // Vérifier que la session peut être annulée
      if (session.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          error: 'Cette session est déjà annulée'
        });
      }
      
      if (session.status === 'completed') {
        return res.status(400).json({
          success: false,
          error: 'Cette session est déjà terminée'
        });
      }
      
      // Mettre à jour le statut
      const cancelledSession = await Session.cancel(session_id);
      
      // Créer une notification
      await Notification.create({
        user_id: adherentId,
        title: 'Session annulée',
        message: `Votre session du ${session.date} à ${session.time} a été annulée`,
        type: 'session_cancelled',
        link: `/sessions/${session_id}`
      });
      
      res.json({
        success: true,
        message: 'Session annulée avec succès',
        data: { session: cancelledSession }
      });
    } catch (error) {
      console.error('Error cancelling session:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'annulation'
      });
    }
  }

  // ✅ Récupérer mes séances
  static async getMySessions(req, res) {
    try {
      const adherentId = req.user.userId;
      const { status, startDate, endDate } = req.query;
      
      const sessions = await Session.findByAdherentId(adherentId, {
        status,
        startDate,
        endDate
      });
      
      res.json({
        success: true,
        data: { sessions: sessions || [] }
      });
    } catch (error) {
      console.error('Error fetching my sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des séances'
      });
    }
  }

  // ✅ Récupérer les séances à venir
  static async getUpcomingSessions(req, res) {
    try {
      const adherentId = req.user.userId;
      const { limit = 5 } = req.query;
      
      const sessions = await Session.getUpcomingSessions(adherentId, parseInt(limit));
      
      res.json({
        success: true,
        data: { sessions: sessions || [] }
      });
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des séances'
      });
    }
  }

  static async assignAdherent(req, res) {
    try {
      const { sessionId } = req.params;
      const { adherentId } = req.body;
      
      // Vérifier la session
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session non trouvée'
        });
      }
      
      // Vérifier que la session est disponible
      if (session.status !== 'available' && session.status !== 'reserved') {
        return res.status(400).json({
          success: false,
          error: `Impossible d'assigner un adhérent à une session ${session.status}`
        });
      }
      
      // Vérifier que l'adhérent existe
      const adherent = await User.findById(adherentId);
      if (!adherent || adherent.role !== 'adherent') {
        return res.status(404).json({
          success: false,
          error: 'Adhérent non trouvé'
        });
      }
      
      // Mettre à jour la session
      const updatedSession = await Session.updateStatus(
        sessionId,
        'reserved',
        adherentId
      );
      
      // Notification à l'adhérent
      await Notification.create({
        user_id: adherentId,
        title: '📅 Nouvelle séance assignée',
        message: `Une séance vous a été assignée le ${session.date} à ${session.time}`,
        type: 'session_assignment',
        link: `/sessions/${sessionId}`
      });
      
      res.json({
        success: true,
        message: 'Adhérent assigné avec succès',
        data: { session: updatedSession }
      });
    } catch (error) {
      console.error('Error assigning adherent:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'assignation de l\'adhérent'
      });
    }
  }
}

module.exports = SessionController;