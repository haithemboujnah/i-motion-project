const { pool } = require('../../config/database');
const Subscription = require('../../models/Subscription');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const Notification = require('../../models/Notification');

class CoachSubscriptionController {
  // ✅ Récupérer les adhérents avec leurs abonnements
  static async getAdherentsWithSubscriptions(req, res) {
    try {
      const coachId = req.user.userId;
      console.log(`📋 Récupération des adhérents avec abonnements pour le coach ${coachId}`);
      
      // Récupérer tous les adhérents du coach (via sessions)
      const adherentsQuery = `
        SELECT DISTINCT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.created_at,
          p.age,
          p.weight,
          p.height,
          p.goal,
          p.level,
          (SELECT COUNT(*) FROM sessions s WHERE s.adherent_id = u.id AND s.status = 'completed') as total_sessions,
          (SELECT COUNT(*) FROM sessions s WHERE s.adherent_id = u.id AND s.status = 'completed' AND s.date >= CURRENT_DATE - INTERVAL '30 days') as sessions_last_30_days,
          (SELECT COUNT(*) FROM sessions s WHERE s.adherent_id = u.id AND s.date >= CURRENT_DATE - INTERVAL '7 days') as sessions_last_7_days
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        LEFT JOIN sessions s ON u.id = s.adherent_id
        WHERE u.role = 'adherent' 
          AND u.is_active = true
          AND s.coach_id = $1
        GROUP BY u.id, u.first_name, u.last_name, u.email, u.created_at, 
                 p.age, p.weight, p.height, p.goal, p.level
        ORDER BY u.first_name ASC
      `;
      
      const adherentsResult = await pool.query(adherentsQuery, [coachId]);
      const adherents = adherentsResult.rows;
      
      // Pour chaque adhérent, récupérer son abonnement actif
      const adherentsWithSubscriptions = await Promise.all(
        adherents.map(async (adherent) => {
          try {
            const subscription = await Subscription.findByUserId(adherent.id);
            return {
              ...adherent,
              subscription: subscription || null,
              hasActiveSubscription: subscription && 
                subscription.status === 'active' && 
                new Date(subscription.end_date) > new Date()
            };
          } catch (err) {
            console.error(`❌ Erreur pour l'adhérent ${adherent.id}:`, err.message);
            return {
              ...adherent,
              subscription: null,
              hasActiveSubscription: false
            };
          }
        })
      );
      
      console.log(`✅ ${adherentsWithSubscriptions.length} adhérents trouvés`);
      
      res.json({
        success: true,
        data: { 
          adherents: adherentsWithSubscriptions,
          count: adherentsWithSubscriptions.length
        }
      });
    } catch (error) {
      console.error('❌ Error getting adherents with subscriptions:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des adhérents: ' + error.message
      });
    }
  }

  // ✅ Récupérer les détails de l'abonnement d'un adhérent
  static async getAdherentSubscriptionDetail(req, res) {
    try {
      const coachId = req.user.userId;
      const { adherentId } = req.params;
      
      console.log(`📋 Récupération des détails de l'abonnement pour l'adhérent ${adherentId}`);
      
      // Vérifier que l'adhérent est bien assigné au coach
      const checkQuery = `
        SELECT s.id 
        FROM sessions s
        WHERE s.adherent_id = $1 AND s.coach_id = $2
        LIMIT 1
      `;
      const checkResult = await pool.query(checkQuery, [adherentId, coachId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Vous n\'êtes pas autorisé à voir cet adhérent'
        });
      }
      
      // Récupérer l'adhérent
      const adherent = await User.findById(adherentId);
      
      // Récupérer son abonnement
      const subscription = await Subscription.findByUserId(adherentId);
      
      // Récupérer l'historique des transactions
      const transactions = await Transaction.findByUserId(adherentId, 10);
      
      // Récupérer les statistiques de séances
      const statsQuery = `
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
          COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved_sessions,
          COUNT(CASE WHEN date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as sessions_last_30_days,
          ROUND(AVG(CASE WHEN status = 'completed' THEN duration ELSE NULL END)::numeric, 0) as avg_duration,
          MAX(date) as last_session_date
        FROM sessions
        WHERE adherent_id = $1
      `;
      const statsResult = await pool.query(statsQuery, [adherentId]);
      
      res.json({
        success: true,
        data: {
          adherent,
          subscription: subscription || null,
          transactions: transactions || [],
          stats: statsResult.rows[0] || {}
        }
      });
    } catch (error) {
      console.error('❌ Error getting adherent subscription detail:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des détails: ' + error.message
      });
    }
  }

  // ✅ Mettre à jour l'abonnement d'un adhérent
  static async updateAdherentSubscription(req, res) {
    try {
      const coachId = req.user.userId;
      const { adherentId } = req.params;
      const { action, duration } = req.body;
      
      console.log(`📝 Mise à jour de l'abonnement pour l'adhérent ${adherentId}: ${action}`);
      
      // Vérifier que l'adhérent est bien assigné au coach
      const checkQuery = `
        SELECT s.id 
        FROM sessions s
        WHERE s.adherent_id = $1 AND s.coach_id = $2
        LIMIT 1
      `;
      const checkResult = await pool.query(checkQuery, [adherentId, coachId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Vous n\'êtes pas autorisé à modifier cet adhérent'
        });
      }
      
      const subscription = await Subscription.findByUserId(adherentId);
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Aucun abonnement trouvé pour cet adhérent'
        });
      }
      
      let updatedSubscription = null;
      let message = '';
      
      switch(action) {
        case 'extend':
          // Prolonger l'abonnement
          const newEndDate = new Date(subscription.end_date);
          const monthsToAdd = duration || 1;
          newEndDate.setMonth(newEndDate.getMonth() + monthsToAdd);
          
          updatedSubscription = await Subscription.approveRenewal(subscription.id, newEndDate);
          message = `Abonnement prolongé de ${monthsToAdd} mois jusqu'au ${newEndDate.toLocaleDateString('fr-FR')}`;
          break;
          
        case 'cancel':
          // Annuler l'abonnement
          updatedSubscription = await Subscription.cancelSubscription(subscription.id);
          message = 'Abonnement annulé avec succès';
          break;
          
        case 'renew':
          // Renouveler l'abonnement
          const renewEndDate = new Date();
          renewEndDate.setFullYear(renewEndDate.getFullYear() + 1);
          updatedSubscription = await Subscription.approveRenewal(subscription.id, renewEndDate);
          message = `Abonnement renouvelé jusqu'au ${renewEndDate.toLocaleDateString('fr-FR')}`;
          break;
          
        default:
          return res.status(400).json({
            success: false,
            error: 'Action non valide'
          });
      }
      
      // Notifier l'adhérent
      await Notification.create({
        user_id: adherentId,
        title: '📅 Mise à jour de votre abonnement',
        message: message,
        type: 'subscription_update',
        link: '/subscription'
      });
      
      res.json({
        success: true,
        message: message,
        data: { subscription: updatedSubscription }
      });
    } catch (error) {
      console.error('❌ Error updating adherent subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour de l\'abonnement: ' + error.message
      });
    }
  }
}

module.exports = CoachSubscriptionController;