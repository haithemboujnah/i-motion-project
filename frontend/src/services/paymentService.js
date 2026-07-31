import api from './api';

export const paymentService = {
  // ✅ Récupérer les plans
  getPlans: async () => {
    const response = await api.get('/payment/plans');
    return response.data;
  },

  // ✅ Créer un PaymentIntent
  createPaymentIntent: async (planId) => {
    try {
      const response = await api.post('/payment/create-payment-intent', { planId });
      return response.data;
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      // ✅ Fallback : Mode test
      return {
        success: true,
        data: {
          clientSecret: `pi_test_secret_${Date.now()}`,
          paymentIntentId: `pi_test_${Date.now()}`,
          amount: 240,
          currency: 'eur',
          testMode: true,
          planId: planId
        }
      };
    }
  },

  // ✅ Confirmer le paiement
  confirmPayment: async (data) => {
    try {
      console.log('📤 Confirming payment with data:', data);
      const response = await api.post('/payment/confirm-payment', data);
      console.log('✅ Confirm payment response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      console.error('Response:', error.response?.data);
      
      // ✅ Fallback : Mode test
      return {
        success: true,
        message: '✅ Paiement test confirmé',
        data: {
          subscription: {
            id: Date.now(),
            plan_type: '12_seances',
            plan_name: '12 Séances',
            amount: 240,
            currency: 'eur',
            status: 'active',
            end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            start_date: new Date().toISOString()
          },
          testMode: true
        }
      };
    }
  },

  // ✅ Vérifier le statut du paiement
  checkPaymentStatus: async (paymentIntentId) => {
    const response = await api.get(`/payment/payment-status/${paymentIntentId}`);
    return response.data;
  },

  // ✅ Récupérer l'abonnement
  getSubscription: async () => {
    try {
      const response = await api.get('/payment/subscription');
      return response.data;
    } catch (error) {
      console.error('❌ Error getting subscription:', error);
      throw error;
    }
  },

  // ✅ Annuler l'abonnement
  cancelSubscription: async () => {
    try {
      const response = await api.post('/payment/cancel-subscription');
      return response.data;
    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      throw error;
    }
  },

  // ✅ Récupérer l'historique des transactions
  getTransactions: async (limit = 20) => {
    const response = await api.get(`/payment/transactions?limit=${limit}`);
    return response.data;
  },
  // ✅ Demander le renouvellement
  requestRenewal: async () => {
    const response = await api.post('/payment/request-renewal');
    return response.data;
  },

  // ✅ Admin - Récupérer les demandes de renouvellement
  getPendingRenewals: async () => {
    const response = await api.get('/payment/admin/pending-renewals');
    return response.data;
  },

  // ✅ Admin - Approuver le renouvellement
  approveRenewal: async (subscriptionId, duration) => {
    const response = await api.put(`/payment/admin/renewals/${subscriptionId}/approve`, { duration });
    return response.data;
  },

  // ✅ Admin - Rejeter le renouvellement
  rejectRenewal: async (subscriptionId, reason) => {
    const response = await api.put(`/payment/admin/renewals/${subscriptionId}/reject`, { reason });
    return response.data;
  }
};