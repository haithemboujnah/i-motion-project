const Session = require('../models/Session');
const Notification = require('../models/Notification');
const User = require('../models/User');
const EmailService = require('../services/emailService');

class ReminderController {
  // ✅ Envoyer un rappel immédiat pour une séance (AMÉLIORÉ)
  static async sendReminder(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.userId; // L'utilisateur connecté (adhérent ou coach)
      
      console.log(`📨 Envoi d'un rappel pour la session ${sessionId} par l'utilisateur ${userId}`);
      
      // 1. Vérifier que la session existe
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session non trouvée'
        });
      }
      
      console.log(`📋 Session trouvée: adherent_id=${session.adherent_id}, coach_id=${session.coach_id}`);
      
      // 2. Déterminer le destinataire (l'adhérent de la session)
      let targetUserId = session.adherent_id;
      let targetUser = null;
      
      // Si la session n'a pas d'adhérent assigné
      if (!targetUserId) {
        // Vérifier si c'est le coach qui demande
        if (session.coach_id === parseInt(userId)) {
          // Le coach peut assigner un adhérent
          return res.status(400).json({
            success: false,
            error: 'Cette session n\'a pas d\'adhérent assigné. Veuillez d\'abord assigner un adhérent à la session.'
          });
        }
        return res.status(400).json({
          success: false,
          error: 'Cette session n\'a pas d\'adhérent assigné'
        });
      }
      
      // 3. Récupérer l'adhérent
      targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'Adhérent non trouvé'
        });
      }
      
      console.log(`🎯 Destinataire: ${targetUser.first_name} ${targetUser.last_name} (${targetUser.email})`);
      
      // 4. Vérifier les autorisations
      const isAdherent = parseInt(userId) === targetUserId;
      const isCoach = session.coach_id === parseInt(userId);
      const isAdmin = req.user.role === 'admin';
      
      if (!isAdherent && !isCoach && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Vous n\'êtes pas autorisé à envoyer un rappel pour cette session'
        });
      }
      
      // 5. Vérifier le statut de la session
      if (session.status !== 'reserved' && session.status !== 'confirmed') {
        return res.status(400).json({
          success: false,
          error: `Impossible d'envoyer un rappel pour une session ${session.status}`
        });
      }
      
      // 6. Récupérer le coach
      let coachName = 'Coach';
      if (session.coach_id) {
        const coach = await User.findById(session.coach_id);
        if (coach) {
          coachName = `${coach.first_name} ${coach.last_name}`;
        }
      }
      
      // 7. Formater la date et l'heure
      const dateObj = new Date(session.date);
      const formattedDate = dateObj.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const formattedTime = session.time.slice(0, 5);
      
      // 8. Créer une notification push pour l'adhérent
      await Notification.create({
        user_id: targetUserId,
        title: '⏰ Rappel de séance',
        message: `Rappel : Vous avez une séance ${session.type || 'séance'} le ${formattedDate} à ${formattedTime} avec ${coachName}`,
        type: 'session_reminder',
        link: `/sessions/${sessionId}`
      });
      
      // 9. Envoyer un email à l'adhérent
      let emailSent = false;
      try {
        await EmailService.sendSessionReminder(
          {
            first_name: targetUser.first_name,
            email: targetUser.email
          },
          {
            date: formattedDate,
            time: formattedTime,
            type: session.type || 'séance',
            coach_name: coachName
          }
        );
        emailSent = true;
        console.log(`📧 Email envoyé à ${targetUser.email}`);
      } catch (emailError) {
        console.warn('⚠️ Erreur lors de l\'envoi de l\'email:', emailError.message);
      }
      
      // 10. Marquer le rappel comme envoyé
      try {
        await Session.markReminderSent(sessionId);
      } catch (markError) {
        console.warn('⚠️ Impossible de marquer le rappel comme envoyé:', markError.message);
      }
      
      // 11. Réponse
      res.json({
        success: true,
        message: `✅ Rappel envoyé à ${targetUser.first_name} ${targetUser.last_name}`,
        data: {
          session_id: sessionId,
          sent_to: {
            id: targetUser.id,
            name: `${targetUser.first_name} ${targetUser.last_name}`,
            email: targetUser.email,
            role: targetUser.role
          },
          session: {
            date: formattedDate,
            time: formattedTime,
            type: session.type || 'séance',
            coach: coachName,
            status: session.status
          },
          sent_at: new Date().toISOString(),
          email_sent: emailSent,
          notification_sent: true,
          sent_by: {
            id: userId,
            role: req.user.role
          }
        }
      });
      
    } catch (error) {
      console.error('Error sending reminder:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'envoi du rappel: ' + error.message
      });
    }
  }

  // ✅ Envoyer un rappel de groupe (pour le coach) - AMÉLIORÉ
  static async sendBulkReminders(req, res) {
    try {
      const coachId = req.user.userId;
      const { sessionIds } = req.body;
      
      if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Liste des sessions requise'
        });
      }
      
      let sentCount = 0;
      const recipients = [];
      const errors = [];
      
      for (const sessionId of sessionIds) {
        try {
          const session = await Session.findById(sessionId);
          
          if (!session || session.coach_id !== parseInt(coachId)) {
            errors.push({ sessionId, error: 'Session non trouvée ou non autorisée' });
            continue;
          }
          
          if (session.status !== 'reserved' && session.status !== 'confirmed') {
            errors.push({ sessionId, error: `Session ${session.status}` });
            continue;
          }
          
          // Récupérer l'adhérent
          const adherent = await User.findById(session.adherent_id);
          if (!adherent) {
            errors.push({ sessionId, error: 'Adhérent non trouvé' });
            continue;
          }
          
          // Récupérer le coach
          let coachName = 'Coach';
          if (session.coach_id) {
            const coach = await User.findById(session.coach_id);
            if (coach) {
              coachName = `${coach.first_name} ${coach.last_name}`;
            }
          }
          
          // Formater la date
          const dateObj = new Date(session.date);
          const formattedDate = dateObj.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
          const formattedTime = session.time.slice(0, 5);
          
          // Créer la notification
          await Notification.create({
            user_id: session.adherent_id,
            title: '⏰ Rappel de séance',
            message: `Rappel : Vous avez une séance ${session.type || 'séance'} le ${formattedDate} à ${formattedTime} avec ${coachName}`,
            type: 'session_reminder',
            link: `/sessions/${sessionId}`
          });
          
          // Envoyer un email
          try {
            await EmailService.sendSessionReminder(
              {
                first_name: adherent.first_name,
                email: adherent.email
              },
              {
                date: formattedDate,
                time: formattedTime,
                type: session.type || 'séance',
                coach_name: coachName
              }
            );
          } catch (emailError) {
            console.warn(`⚠️ Erreur email pour ${adherent.email}:`, emailError.message);
          }
          
          recipients.push({
            id: adherent.id,
            name: `${adherent.first_name} ${adherent.last_name}`,
            email: adherent.email
          });
          
          sentCount++;
        } catch (err) {
          errors.push({ sessionId, error: err.message });
        }
      }
      
      res.json({
        success: true,
        message: `${sentCount} rappels envoyés à ${sentCount} adhérent${sentCount > 1 ? 's' : ''}`,
        data: {
          sent: sentCount,
          recipients: recipients,
          errors: errors
        }
      });
      
    } catch (error) {
      console.error('Error sending bulk reminders:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'envoi des rappels: ' + error.message
      });
    }
  }
}

module.exports = ReminderController;