const stripe = require('../config/stripe');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

class PaymentController {
  // ✅ Plans d'abonnement
  static async getPlans(req, res) {
    try {
      const plans = [
        {
          id: 'monthly',
          name: 'Abonnement Mensuel',
          price: 29.99,
          currency: 'eur',
          interval: 'month',
          features: [
            'Accès illimité aux séances EMS',
            'Suivi des performances',
            'Programmes personnalisés',
            'Gamification',
            'Support prioritaire'
          ],
          stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID
        },
        {
          id: 'quarterly',
          name: 'Abonnement Trimestriel',
          price: 79.99,
          currency: 'eur',
          interval: 'quarter',
          features: [
            'Accès illimité aux séances EMS',
            'Suivi des performances',
            'Programmes personnalisés',
            'Gamification',
            'Support prioritaire',
            'Économie de 10%'
          ],
          stripePriceId: process.env.STRIPE_QUARTERLY_PRICE_ID
        },
        {
          id: 'yearly',
          name: 'Abonnement Annuel',
          price: 299.99,
          currency: 'eur',
          interval: 'year',
          features: [
            'Accès illimité aux séances EMS',
            'Suivi des performances',
            'Programmes personnalisés',
            'Gamification',
            'Support prioritaire',
            'Économie de 15%',
            '1 mois offert'
          ],
          stripePriceId: process.env.STRIPE_YEARLY_PRICE_ID
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

  static async createPaymentIntent(req, res) {
    try {
      const { planId } = req.body;
      const userId = req.user.userId;
      
      // Plans avec prix en centimes
      const planPrices = {
        'monthly': { amount: 2999, interval: 'month', name: 'Mensuel' },
        'quarterly': { amount: 7999, interval: 'quarter', name: 'Trimestriel' },
        'yearly': { amount: 29999, interval: 'year', name: 'Annuel' }
      };
      
      const plan = planPrices[planId];
      if (!plan) {
        return res.status(400).json({
          success: false,
          error: 'Plan invalide'
        });
      }
      
      // Créer un PaymentIntent
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
      
      res.json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: plan.amount / 100,
          currency: 'eur'
        }
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la création du paiement'
      });
    }
  }

  static async confirmPayment(req, res) {
    try {
      const { paymentIntentId } = req.body;
      const userId = req.user.userId;
      
      // Récupérer le PaymentIntent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({
          success: false,
          error: 'Le paiement n\'a pas été confirmé'
        });
      }
      
      const planId = paymentIntent.metadata.plan_id;
      const amount = paymentIntent.amount / 100;
      
      // Créer l'abonnement en base
      const startDate = new Date();
      const endDate = new Date();
      
      switch(planId) {
        case 'monthly': endDate.setMonth(endDate.getMonth() + 1); break;
        case 'quarterly': endDate.setMonth(endDate.getMonth() + 3); break;
        case 'yearly': endDate.setFullYear(endDate.getFullYear() + 1); break;
        default: endDate.setMonth(endDate.getMonth() + 1);
      }
      
      // Créer l'abonnement
      const subscription = await Subscription.create({
        user_id: userId,
        stripe_subscription_id: paymentIntentId,
        stripe_customer_id: paymentIntent.customer || null,
        plan_type: planId,
        amount: amount,
        status: 'active',
        start_date: startDate,
        end_date: endDate
      });
      
      // Créer la transaction
      await Transaction.create({
        user_id: userId,
        subscription_id: subscription.id,
        amount: amount,
        status: 'completed',
        payment_method: 'stripe',
        transaction_id: paymentIntentId,
        metadata: {
          plan_id: planId,
          payment_intent: paymentIntent
        }
      });
      
      res.json({
        success: true,
        message: 'Paiement confirmé et abonnement activé',
        data: { subscription }
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la confirmation du paiement'
      });
    }
  }

  static async checkPaymentStatus(req, res) {
    try {
      const { paymentIntentId } = req.params;
      
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
      console.error('Error checking payment status:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification du paiement'
      });
    }
  }

  // ✅ Créer une session de paiement
  static async createCheckoutSession(req, res) {
    try {
      const { planId, successUrl, cancelUrl } = req.body;
      const userId = req.user.userId;
      
      console.log('📝 Creating checkout session for user:', userId, 'plan:', planId);
      
      // Récupérer l'utilisateur
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }
      
      // ✅ Créer un prix Stripe dynamiquement si non configuré
      let finalPriceId;
      
      // Vérifier si les price IDs sont configurés
      const priceIdMap = {
        'monthly': process.env.STRIPE_MONTHLY_PRICE_ID,
        'quarterly': process.env.STRIPE_QUARTERLY_PRICE_ID,
        'yearly': process.env.STRIPE_YEARLY_PRICE_ID
      };
      
      const configuredPriceId = priceIdMap[planId];
      
      if (configuredPriceId && configuredPriceId.startsWith('price_')) {
        // Utiliser le price ID configuré
        finalPriceId = configuredPriceId;
        console.log(`✅ Using configured price: ${finalPriceId}`);
      } else {
        // ✅ Fallback: Créer un prix temporaire
        console.log(`⚠️ No valid price ID for ${planId}, creating temporary price...`);
        
        const priceAmounts = {
          'monthly': 2999,
          'quarterly': 7999,
          'yearly': 29999
        };
        
        const intervals = {
          'monthly': 'month',
          'quarterly': 'month',
          'yearly': 'year'
        };
        
        const intervalCounts = {
          'monthly': 1,
          'quarterly': 3,
          'yearly': 1
        };
        
        try {
          // Créer un produit
          const product = await stripe.products.create({
            name: `I-Motion ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
            description: `Plan d'abonnement ${planId}`,
          });
          
          // Créer un prix
          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: priceAmounts[planId] || 2999,
            currency: 'eur',
            recurring: {
              interval: intervals[planId] || 'month',
              interval_count: intervalCounts[planId] || 1,
            },
          });
          
          finalPriceId = price.id;
          console.log(`✅ Created temporary price: ${finalPriceId}`);
        } catch (stripeError) {
          console.error('❌ Error creating temporary price:', stripeError);
          return res.status(500).json({
            success: false,
            error: 'Erreur de configuration Stripe. Veuillez contacter l\'administrateur.'
          });
        }
      }
      
      // ✅ Créer la session de paiement
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: finalPriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel`,
        customer_email: user.email,
        client_reference_id: userId.toString(),
        metadata: {
          user_id: userId.toString(),
          plan_id: planId
        },
        subscription_data: {
          metadata: {
            user_id: userId.toString(),
            plan_id: planId
          }
        }
      });
      
      // Créer une transaction en attente
      await Transaction.create({
        user_id: userId,
        amount: 0,
        status: 'pending',
        payment_method: 'stripe',
        transaction_id: session.id,
        metadata: { plan_id: planId }
      });
      
      console.log('✅ Checkout session created:', session.id);
      
      res.json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url
        }
      });
    } catch (error) {
      console.error('❌ Error creating checkout session:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de la session de paiement: ' + error.message
      });
    }
  }

  // ✅ Webhook Stripe
  static async handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
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
      // Gérer les événements
      switch (event.type) {
        case 'checkout.session.completed':
          await PaymentController.handleCheckoutCompleted(event.data.object);
          break;
          
        case 'customer.subscription.created':
          await PaymentController.handleSubscriptionCreated(event.data.object);
          break;
          
        case 'customer.subscription.updated':
          await PaymentController.handleSubscriptionUpdated(event.data.object);
          break;
          
        case 'customer.subscription.deleted':
          await PaymentController.handleSubscriptionDeleted(event.data.object);
          break;
          
        case 'invoice.payment_succeeded':
          await PaymentController.handleInvoicePaid(event.data.object);
          break;
          
        case 'invoice.payment_failed':
          await PaymentController.handleInvoiceFailed(event.data.object);
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

  // ✅ Handlers des événements
  static async handleCheckoutCompleted(session) {
    const userId = parseInt(session.client_reference_id);
    const planId = session.metadata?.plan_id;
    
    try {
      // Récupérer l'abonnement Stripe
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      
      // Créer l'abonnement en base
      await Subscription.create({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: session.customer,
        plan_type: planId,
        amount: subscription.items.data[0]?.price?.unit_amount / 100 || 0,
        status: 'active',
        start_date: new Date(subscription.current_period_start * 1000),
        end_date: new Date(subscription.current_period_end * 1000)
      });
      
      // Mettre à jour la transaction
      const transactions = await Transaction.findByTransactionId(session.id);
      if (transactions && transactions.length > 0) {
        await Transaction.updateStatus(transactions[0].id, 'completed');
      }
    } catch (error) {
      console.error('Error handling checkout completed:', error);
    }
  }

  static async handleSubscriptionCreated(subscription) {
    console.log(`✅ Subscription created: ${subscription.id}`);
  }

  static async handleSubscriptionUpdated(subscription) {
    try {
      const status = subscription.status === 'active' ? 'active' : 
                     subscription.status === 'past_due' ? 'past_due' :
                     subscription.status === 'canceled' ? 'cancelled' : 'inactive';
      
      await Subscription.updateStatus(subscription.id, status);
    } catch (error) {
      console.error('Error handling subscription updated:', error);
    }
  }

  static async handleSubscriptionDeleted(subscription) {
    try {
      await Subscription.updateStatus(subscription.id, 'cancelled');
    } catch (error) {
      console.error('Error handling subscription deleted:', error);
    }
  }

  static async handleInvoicePaid(invoice) {
    try {
      const subscriptionId = invoice.subscription;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      const userId = parseInt(subscription.metadata?.user_id);
      
      if (userId) {
        await Transaction.create({
          user_id: userId,
          amount: invoice.total / 100,
          status: 'completed',
          payment_method: 'stripe',
          transaction_id: invoice.id,
          metadata: { invoice_id: invoice.id }
        });
      }
    } catch (error) {
      console.error('Error handling invoice paid:', error);
    }
  }

  static async handleInvoiceFailed(invoice) {
    console.log(`⚠️ Invoice failed: ${invoice.id}`);
  }

  // ✅ Récupérer l'abonnement de l'utilisateur
  static async getSubscription(req, res) {
    try {
      const userId = req.user.userId;
      console.log(`🔍 Récupération de l'abonnement pour l'utilisateur ${userId}`);
      
      const subscription = await Subscription.findByUserId(userId);
      console.log('📋 Abonnement trouvé:', subscription);
      
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
      
      // Récupérer l'abonnement actif
      const subscription = await Subscription.findByUserId(userId);
      console.log('📋 Abonnement trouvé:', subscription);
      
      if (!subscription) {
        console.log('❌ Aucun abonnement trouvé');
        return res.status(404).json({
          success: false,
          error: 'Aucun abonnement trouvé'
        });
      }
      
      // Vérifier si l'abonnement est actif
      if (subscription.status !== 'active') {
        console.log(`❌ Abonnement non actif (statut: ${subscription.status})`);
        return res.status(400).json({
          success: false,
          error: 'Cet abonnement n\'est pas actif'
        });
      }
      
      // Mettre à jour le statut en base
      const updatedSubscription = await Subscription.updateStatus(
        subscription.id, 
        'cancelling'
      );
      console.log('✅ Abonnement mis à jour en base:', updatedSubscription);
      
      // Si l'abonnement a un stripe_subscription_id, essayer d'annuler sur Stripe
      if (subscription.stripe_subscription_id) {
        try {
          console.log(`🔄 Tentative d'annulation Stripe: ${subscription.stripe_subscription_id}`);
          await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: true
          });
          console.log('✅ Abonnement Stripe annulé avec succès');
        } catch (stripeError) {
          console.error('❌ Erreur Stripe (non bloquante):', stripeError.message);
          // Continuer même si Stripe échoue
        }
      }
      
      // Créer une notification (optionnelle, ne pas bloquer)
      try {
        const Notification = require('../models/Notification');
        await Notification.create({
          user_id: userId,
          title: '📅 Annulation d\'abonnement',
          message: 'Votre abonnement sera annulé à la fin de la période en cours.',
          type: 'subscription_cancelled',
          link: '/subscription'
        });
        console.log('✅ Notification créée');
      } catch (notifError) {
        console.warn('⚠️ Erreur notification (non bloquante):', notifError.message);
      }
      
      res.json({
        success: true,
        message: 'L\'abonnement sera annulé à la fin de la période en cours',
        data: { subscription: updatedSubscription }
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'annulation de l\'abonnement: ' + error.message
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
}

module.exports = PaymentController;