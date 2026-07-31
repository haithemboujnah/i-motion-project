const stripe = require('../config/stripe');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');

class PaymentController {
  // ✅ Plans d'abonnement
  static async getPlans(req, res) {
    try {
      const plans = [
        {
          id: '1_seance',
          name: '1 Séance',
          price: 60.00,  // ✅ Updated from 25 to 60
          currency: 'eur',
          interval: 'session',
          sessions: 1,
          type: 'sessions',
          features: [
            '1 séance EMS',
            'Accès à la salle',
            'Suivi de performance',
            'Valable 7 jours'
          ]
        },
        {
          id: '12_seances',
          name: '12 Séances',
          price: 600.00,  // ✅ Updated from 240 to 600
          currency: 'eur',
          interval: 'mois',
          sessions: 12,
          type: 'sessions',
          features: [
            '12 séances EMS',
            'Accès illimité à la salle',
            'Suivi des performances',
            'Programmes personnalisés',
            'Économie de 20%',
            'Valable 3 mois'
          ],
          popular: true
        },
        {
          id: '20_seances',
          name: '20 Séances',
          price: 950.00,  // ✅ Updated from 380 to 950
          currency: 'eur',
          interval: 'mois',
          sessions: 20,
          type: 'sessions',
          features: [
            '20 séances EMS',
            'Accès illimité à la salle',
            'Suivi des performances',
            'Programmes personnalisés',
            'Gamification',
            'Économie de 25%',
            'Valable 6 mois'
          ]
        },
        {
          id: '1_an',
          name: '1 An Illimité',
          price: 2900.00,  // ✅ Updated from 1200 to 2900
          currency: 'eur',
          interval: 'an',
          sessions: null,
          type: 'unlimited',
          features: [
            'Séances illimitées',
            'Accès illimité à la salle',
            'Suivi des performances',
            'Programmes personnalisés',
            'Gamification',
            'Support prioritaire',
            'Économie de 30%',
            'Valable 1 an'
          ]
        },
        {
          id: '2_ans',
          name: '2 Ans Illimité',
          price: 5400.00,  // ✅ Updated from 2100 to 5400
          currency: 'eur',
          interval: 'an',
          sessions: null,
          type: 'unlimited',
          features: [
            'Séances illimitées',
            'Accès illimité à la salle',
            'Suivi des performances',
            'Programmes personnalisés',
            'Gamification',
            'Support prioritaire',
            'Économie de 40%',
            'Valable 2 ans',
            '2 mois offerts'
          ],
          popular: true
        }
      ];
      
      res.json({
        success: true,
        data: { plans }
      });
    } catch (error) {
      console.error('Error getting plans:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des plans'
      });
    }
  }

  // ✅ Updated createPaymentIntent with new prices
  static async createPaymentIntent(req, res) {
    try {
      const { planId } = req.body;
      const userId = req.user.userId;
      
      console.log(`📝 Création PaymentIntent: userId=${userId}, planId=${planId}`);
      
      // ✅ Updated prices in centimes EUR
      const planPrices = {
        '1_seance': { amount: 6000, name: '1 Séance' },      // 60.00 EUR
        '12_seances': { amount: 60000, name: '12 Séances' },  // 600.00 EUR
        '20_seances': { amount: 95000, name: '20 Séances' },  // 950.00 EUR
        '1_an': { amount: 290000, name: '1 An Illimité' },    // 2900.00 EUR
        '2_ans': { amount: 540000, name: '2 Ans Illimité' }   // 5400.00 EUR
      };
      
      const plan = planPrices[planId];
      if (!plan) {
        return res.status(400).json({
          success: false,
          error: 'Plan invalide'
        });
      }
      
      // ✅ Vérifier si Stripe est configuré
      const isStripeConfigured = stripe && process.env.STRIPE_SECRET_KEY && 
                                  process.env.STRIPE_SECRET_KEY.startsWith('sk_');
      
      if (!isStripeConfigured) {
        console.warn('⚠️ Stripe non configuré, utilisation du mode test');
        
        // ✅ Mode test
        const testIntentId = `pi_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const clientSecret = `${testIntentId}_secret_${Math.random().toString(36).substring(7)}`;
        
        return res.json({
          success: true,
          data: {
            clientSecret: clientSecret,
            paymentIntentId: testIntentId,
            amount: plan.amount / 100,
            currency: 'eur',
            testMode: true,
            planId: planId,
            planName: plan.name
          }
        });
      }
      
      // ✅ Mode réel Stripe avec EUR
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: plan.amount,
          currency: 'eur',
          metadata: {
            user_id: userId.toString(),
            plan_id: planId,
            plan_name: plan.name
          },
          description: `Abonnement ${plan.name} I-Motion`,
        });
        
        console.log(`✅ PaymentIntent créé: ${paymentIntent.id}`);
        
        res.json({
          success: true,
          data: {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: plan.amount / 100,
            currency: 'eur',
            testMode: false,
            planId: planId,
            planName: plan.name
          }
        });
      } catch (stripeError) {
        console.error('❌ Stripe API Error:', stripeError.message);
        
        // ✅ Fallback en mode test
        const fallbackId = `pi_fallback_${Date.now()}`;
        res.json({
          success: true,
          data: {
            paymentIntentId: fallbackId,
            clientSecret: `${fallbackId}_secret_fallback_${Math.random().toString(36).substring(7)}`,
            amount: plan.amount / 100,
            currency: 'eur',
            testMode: true,
            planId: planId,
            planName: plan.name,
            note: 'Mode test activé suite à une erreur Stripe'
          }
        });
      }
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la création du paiement: ' + error.message
      });
    }
  }

  // ✅ Updated confirmPayment with new prices
  static async confirmPayment(req, res) {
    try {
      const { paymentIntentId, testMode } = req.body;
      const userId = req.user.userId;
      
      console.log(`📝 Confirmation paiement: ${paymentIntentId}, userId=${userId}, testMode=${testMode}`);
      
      // ✅ Mode test - Paiement simulé
      if (testMode || (paymentIntentId && paymentIntentId.startsWith('pi_test_'))) {
        console.log('🧪 Mode test - paiement simulé');
        
        let planId = '12_seances';
        let amount = 600.00;  // ✅ Updated
        let planName = '12 Séances';
        let sessionsTotal = 12;
        
        // ✅ Déterminer le plan avec les nouveaux prix
        if (paymentIntentId && paymentIntentId.includes('1_seance')) { 
          planId = '1_seance'; 
          amount = 60.00;  // ✅ Updated
          planName = '1 Séance';
          sessionsTotal = 1;
        } else if (paymentIntentId && paymentIntentId.includes('12_seances')) { 
          planId = '12_seances'; 
          amount = 600.00;  // ✅ Updated
          planName = '12 Séances';
          sessionsTotal = 12;
        } else if (paymentIntentId && paymentIntentId.includes('20_seances')) { 
          planId = '20_seances'; 
          amount = 950.00;  // ✅ Updated
          planName = '20 Séances';
          sessionsTotal = 20;
        } else if (paymentIntentId && paymentIntentId.includes('1_an')) { 
          planId = '1_an'; 
          amount = 2900.00;  // ✅ Updated
          planName = '1 An Illimité';
          sessionsTotal = null;
        } else if (paymentIntentId && paymentIntentId.includes('2_ans')) { 
          planId = '2_ans'; 
          amount = 5400.00;  // ✅ Updated
          planName = '2 Ans Illimité';
          sessionsTotal = null;
        }
        
        const startDate = new Date();
        const endDate = new Date();
        
        switch(planId) {
          case '1_seance': 
            endDate.setDate(endDate.getDate() + 7);
            break;
          case '12_seances': 
            endDate.setMonth(endDate.getMonth() + 3);
            break;
          case '20_seances': 
            endDate.setMonth(endDate.getMonth() + 6);
            break;
          case '1_an': 
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
          case '2_ans': 
            endDate.setFullYear(endDate.getFullYear() + 2);
            break;
          default: 
            endDate.setMonth(endDate.getMonth() + 1);
        }
        
        // ✅ Create subscription with new prices
        const subscription = await Subscription.create({
          user_id: userId,
          stripe_subscription_id: paymentIntentId || `test_${Date.now()}`,
          stripe_customer_id: null,
          plan_type: planId,
          plan_name: planName,
          amount: amount,  // ✅ Updated price
          currency: 'eur',
          status: 'active',
          sessions_total: sessionsTotal,
          sessions_used: 0,
          sessions_remaining: sessionsTotal,
          start_date: startDate,
          end_date: endDate
        });
        
        // ✅ Create transaction with new price
        const transaction = await Transaction.create({
          user_id: userId,
          subscription_id: subscription.id,
          amount: amount,  // ✅ Updated price
          currency: 'eur',
          status: 'completed',
          payment_method: 'test',
          transaction_id: paymentIntentId || `test_${Date.now()}`,
          metadata: { 
            plan_id: planId, 
            plan_name: planName,
            sessions_total: sessionsTotal,
            price: amount,  // ✅ Store the price
            test_mode: true,
            confirmed_at: new Date().toISOString()
          }
        });
        
        return res.json({
          success: true,
          message: '✅ Paiement test confirmé et abonnement activé',
          data: { 
            subscription,
            transaction,
            testMode: true,
            sessions_remaining: sessionsTotal,
            expires_at: endDate,
            amount: amount  // ✅ Return the price
          }
        });
      }
      
      // ✅ Mode réel - Même logique avec Stripe
      if (!stripe) {
        throw new Error('Stripe non configuré');
      }
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({
          success: false,
          error: `Le paiement n'a pas été confirmé. Statut: ${paymentIntent.status}`
        });
      }
      
      const planId = paymentIntent.metadata.plan_id || '12_seances';
      const planName = paymentIntent.metadata.plan_name || '12 Séances';
      const amount = paymentIntent.amount / 100;  // ✅ Updated price from Stripe
      
      // ✅ Determine sessions based on plan
      let sessionsTotal = null;
      switch(planId) {
        case '1_seance': sessionsTotal = 1; break;
        case '12_seances': sessionsTotal = 12; break;
        case '20_seances': sessionsTotal = 20; break;
        case '1_an': 
        case '2_ans': sessionsTotal = null; break;
      }
      
      const startDate = new Date();
      const endDate = new Date();
      
      switch(planId) {
        case '1_seance': endDate.setDate(endDate.getDate() + 7); break;
        case '12_seances': endDate.setMonth(endDate.getMonth() + 3); break;
        case '20_seances': endDate.setMonth(endDate.getMonth() + 6); break;
        case '1_an': endDate.setFullYear(endDate.getFullYear() + 1); break;
        case '2_ans': endDate.setFullYear(endDate.getFullYear() + 2); break;
        default: endDate.setMonth(endDate.getMonth() + 1);
      }
      
      const subscription = await Subscription.create({
        user_id: userId,
        stripe_subscription_id: paymentIntentId,
        stripe_customer_id: paymentIntent.customer || null,
        plan_type: planId,
        plan_name: planName,
        amount: amount,
        currency: 'eur',
        status: 'active',
        sessions_total: sessionsTotal,
        sessions_used: 0,
        sessions_remaining: sessionsTotal,
        start_date: startDate,
        end_date: endDate
      });
      
      await Transaction.create({
        user_id: userId,
        subscription_id: subscription.id,
        amount: amount,
        currency: 'eur',
        status: 'completed',
        payment_method: 'stripe',
        transaction_id: paymentIntentId,
        metadata: {
          plan_id: planId,
          plan_name: planName,
          price: amount,
          payment_intent: paymentIntent
        }
      });
      
      res.json({
        success: true,
        message: '✅ Paiement confirmé et abonnement activé',
        data: { 
          subscription,
          amount: amount
        }
      });
    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la confirmation du paiement: ' + error.message
      });
    }
  }

  // ✅ Vérifier le statut du paiement (AJOUTÉ)
  static async checkPaymentStatus(req, res) {
    try {
      const { paymentIntentId } = req.params;
      
      console.log(`🔍 Vérification du statut paiement: ${paymentIntentId}`);
      
      // ✅ Mode test
      if (paymentIntentId && paymentIntentId.startsWith('pi_test_')) {
        return res.json({
          success: true,
          data: {
            status: 'succeeded',
            amount: 240.00,
            currency: 'tnd',
            testMode: true
          }
        });
      }
      
      // ✅ Mode réel
      if (!stripe) {
        throw new Error('Stripe non configuré');
      }
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      res.json({
        success: true,
        data: {
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency
        }
      });
    } catch (error) {
      console.error('❌ Error checking payment status:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification du paiement: ' + error.message
      });
    }
  }

  // ✅ Webhook Stripe (AJOUTÉ)
  static async handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
      // ✅ Vérifier si Stripe est configuré
      if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        console.warn('⚠️ Webhook non configuré (mode test)');
        return res.json({ received: true, testMode: true });
      }
      
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          console.log('✅ Checkout session completed:', event.data.object.id);
          break;
          
        case 'customer.subscription.created':
          console.log('✅ Subscription created:', event.data.object.id);
          break;
          
        case 'customer.subscription.updated':
          console.log('✅ Subscription updated:', event.data.object.id);
          break;
          
        case 'customer.subscription.deleted':
          console.log('✅ Subscription deleted:', event.data.object.id);
          break;
          
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  }

  // ✅ Récupérer l'abonnement
  static async getSubscription(req, res) {
    try {
      const userId = req.user.userId;
      console.log(`🔍 Récupération de l'abonnement pour l'utilisateur ${userId}`);
      
      const subscription = await Subscription.findByUserId(userId);
      
      res.json({
        success: true,
        data: { subscription: subscription || null }
      });
    } catch (error) {
      console.error('❌ Erreur:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'abonnement'
      });
    }
  }

  // ✅ Annuler l'abonnement
  static async cancelSubscription(req, res) {
    try {
      const userId = req.user.userId;
      console.log(`🔄 Annulation de l'abonnement pour l'utilisateur ${userId}`);
      
      const subscription = await Subscription.findByUserId(userId);
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Aucun abonnement trouvé'
        });
      }
      
      if (subscription.status !== 'active') {
        return res.status(400).json({
          success: false,
          error: 'Cet abonnement n\'est pas actif'
        });
      }
      
      const updatedSubscription = await Subscription.updateStatus(
        subscription.id, 
        'cancelled'
      );
      
      res.json({
        success: true,
        message: 'Abonnement annulé avec succès',
        data: { subscription: updatedSubscription }
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'annulation de l\'abonnement'
      });
    }
  }

  // ✅ Historique des transactions
  static async getTransactions(req, res) {
    try {
      const userId = req.user.userId;
      const { limit = 20 } = req.query;
      
      const transactions = await Transaction.findByUserId(userId, parseInt(limit));
      
      res.json({
        success: true,
        data: { transactions }
      });
    } catch (error) {
      console.error('Error getting transactions:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'historique'
      });
    }
  }

  static async requestRenewal(req, res) {
    try {
      const userId = req.user.userId;
      
      console.log(`📝 Demande de renouvellement pour l'utilisateur ${userId}`);
      
      const subscription = await Subscription.findByUserId(userId);
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Aucun abonnement trouvé'
        });
      }
      
      if (subscription.status !== 'active') {
        return res.status(400).json({
          success: false,
          error: 'Votre abonnement n\'est pas actif'
        });
      }
      
      // Vérifier si l'abonnement est expiré ou va expirer
      const endDate = new Date(subscription.end_date);
      const now = new Date();
      
      if (endDate > now) {
        // L'abonnement n'est pas encore expiré
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining > 7) {
          return res.status(400).json({
            success: false,
            error: `Vous pouvez demander un renouvellement à partir de 7 jours avant l'expiration (${daysRemaining} jours restants)`
          });
        }
      }
      
      // Vérifier si une demande est déjà en cours
      if (subscription.status === 'pending_renewal') {
        return res.status(400).json({
          success: false,
          error: 'Une demande de renouvellement est déjà en attente'
        });
      }
      
      // Créer la demande de renouvellement
      const updatedSubscription = await Subscription.requestRenewal(subscription.id);
      
      // Notifier l'admin
      await Notification.create({
        user_id: 1, // Admin
        title: '📝 Demande de renouvellement',
        message: `L'adhérent ${req.user.first_name} ${req.user.last_name} demande le renouvellement de son abonnement`,
        type: 'renewal_request',
        link: '/admin/renewals'
      });
      
      // Notifier l'adhérent
      await Notification.create({
        user_id: userId,
        title: '📝 Demande de renouvellement envoyée',
        message: 'Votre demande de renouvellement d\'abonnement a été envoyée. Vous recevrez une confirmation dès que l\'administrateur l\'aura validée.',
        type: 'renewal_requested',
        link: '/subscription'
      });
      
      res.json({
        success: true,
        message: 'Demande de renouvellement envoyée avec succès',
        data: { subscription: updatedSubscription }
      });
    } catch (error) {
      console.error('❌ Error requesting renewal:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la demande de renouvellement'
      });
    }
  }

  // ✅ Approuver le renouvellement (Admin)
  static async approveRenewal(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { duration } = req.body; // 'monthly', 'quarterly', 'yearly'
      
      console.log(`✅ Approbation du renouvellement ${subscriptionId}`);
      
      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Abonnement non trouvé'
        });
      }
      
      if (subscription.status !== 'pending_renewal') {
        return res.status(400).json({
          success: false,
          error: 'Cette demande de renouvellement n\'est pas en attente'
        });
      }
      
      // Calculer la nouvelle date de fin
      const newEndDate = new Date();
      switch(duration) {
        case 'monthly':
          newEndDate.setMonth(newEndDate.getMonth() + 1);
          break;
        case 'quarterly':
          newEndDate.setMonth(newEndDate.getMonth() + 3);
          break;
        case 'yearly':
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          break;
        default:
          newEndDate.setMonth(newEndDate.getMonth() + 1);
      }
      
      // Approuver le renouvellement
      const updatedSubscription = await Subscription.approveRenewal(subscriptionId, newEndDate);
      
      // Créer une transaction pour le renouvellement
      await Transaction.create({
        user_id: subscription.user_id,
        subscription_id: subscriptionId,
        amount: subscription.amount,
        currency: subscription.currency || 'eur',
        status: 'completed',
        payment_method: 'renewal',
        transaction_id: `renewal_${Date.now()}`,
        metadata: {
          type: 'renewal',
          previous_end_date: subscription.end_date,
          new_end_date: newEndDate,
          duration: duration,
          approved_by: req.user.userId
        }
      });
      
      // Notifier l'adhérent
      await Notification.create({
        user_id: subscription.user_id,
        title: '✅ Renouvellement approuvé',
        message: `Votre abonnement a été renouvelé jusqu'au ${newEndDate.toLocaleDateString('fr-FR')}`,
        type: 'renewal_approved',
        link: '/subscription'
      });
      
      res.json({
        success: true,
        message: 'Renouvellement approuvé avec succès',
        data: { subscription: updatedSubscription }
      });
    } catch (error) {
      console.error('❌ Error approving renewal:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'approbation du renouvellement'
      });
    }
  }

  // ✅ Rejeter le renouvellement (Admin)
  static async rejectRenewal(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { reason } = req.body;
      
      console.log(`❌ Rejet du renouvellement ${subscriptionId}`);
      
      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Abonnement non trouvé'
        });
      }
      
      if (subscription.status !== 'pending_renewal') {
        return res.status(400).json({
          success: false,
          error: 'Cette demande de renouvellement n\'est pas en attente'
        });
      }
      
      // Rejeter le renouvellement
      const updatedSubscription = await Subscription.rejectRenewal(subscriptionId);
      
      // Notifier l'adhérent
      await Notification.create({
        user_id: subscription.user_id,
        title: '❌ Renouvellement refusé',
        message: `Votre demande de renouvellement a été refusée. Motif: ${reason || 'Non spécifié'}`,
        type: 'renewal_rejected',
        link: '/subscription'
      });
      
      res.json({
        success: true,
        message: 'Renouvellement refusé',
        data: { subscription: updatedSubscription }
      });
    } catch (error) {
      console.error('❌ Error rejecting renewal:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du rejet du renouvellement'
      });
    }
  }

  // ✅ Récupérer les demandes de renouvellement (Admin)
  static async getPendingRenewals(req, res) {
    try {
      console.log('📋 Récupération des demandes de renouvellement en attente...');
      
      const renewals = await Subscription.getPendingRenewals();
      
      console.log(`✅ ${renewals.length} demandes trouvées`);
      
      res.json({
        success: true,
        data: { renewals }
      });
    } catch (error) {
      console.error('❌ Error getting pending renewals:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des demandes de renouvellement: ' + error.message
      });
    }
  }

  // ✅ Récupérer les abonnements expirant (Admin)
  static async getExpiringSubscriptions(req, res) {
    try {
      const { days = 7 } = req.query;
      const subscriptions = await Subscription.getExpiringSubscriptions(parseInt(days));
      
      res.json({
        success: true,
        data: { subscriptions }
      });
    } catch (error) {
      console.error('❌ Error getting expiring subscriptions:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des abonnements expirant'
      });
    }
  }
}

module.exports = PaymentController;