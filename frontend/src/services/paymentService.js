import api from './api';

export const paymentService = {
  // ✅ Récupérer les plans
  getPlans: async () => {
    const response = await api.get('/payment/plans');
    return response.data;
  },

  // ✅ Créer un PaymentIntent (paiement intégré)
  createPaymentIntent: async (planId) => {
    const response = await api.post('/payment/create-payment-intent', { planId });
    return response.data;
  },

  // ✅ Confirmer le paiement
  confirmPayment: async (paymentIntentId) => {
    const response = await api.post('/payment/confirm-payment', { paymentIntentId });
    return response.data;
  },

  // ✅ Vérifier le statut du paiement
  checkPaymentStatus: async (paymentIntentId) => {
    const response = await api.get(`/payment/payment-status/${paymentIntentId}`);
    return response.data;
  },

  // ✅ Récupérer l'abonnement (CORRIGÉ)
  getSubscription: async () => {
    try {
      const response = await api.get('/payment/subscription');
      return response.data;
    } catch (error) {
      console.error('❌ Error getting subscription:', error);
      throw error;
    }
  },

  // ✅ Annuler l'abonnement (CORRIGÉ)
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
  }
};