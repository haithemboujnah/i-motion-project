import api from './api';

export const coachService = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/coach/dashboard');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/coach/stats');
    return response.data;
  },

  // Adhérents
  getAdherents: async () => {
    const response = await api.get('/coach/adherents');
    return response.data;
  },

  getAdherentDetail: async (adherentId) => {
    const response = await api.get(`/coach/adherents/${adherentId}`);
    return response.data;
  },

  getAtRiskAdherents: async () => {
    try {
      const response = await api.get('/coach/adherents/at-risk');
      return response.data;
    } catch (error) {
      console.error('Error fetching at-risk adherents:', error);
      return { data: { adherents: [] } };
    }
  },

  getRecommendations: async (adherentId) => {
    const response = await api.get(`/coach/adherents/${adherentId}/recommendations`);
    return response.data;
  },

  // Séances
  getSessions: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/coach/sessions?${params}`);
    return response.data;
  },

  createSession: async (data) => {
    const response = await api.post('/coach/sessions', data);
    return response.data;
  },

  updateSessionStatus: async (sessionId, status) => {
    const response = await api.put(`/coach/sessions/${sessionId}/status`, { status });
    return response.data;
  },

  // Performances
  getAdherentPerformances: async (period = '30 days') => {
    try {
      const response = await api.get(`/coach/performances?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching adherent performances:', error);
      throw error;
    }
  },

  getPerformanceStats: async () => {
    try {
      const response = await api.get('/coach/performances/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching performance stats:', error);
      throw error;
    }
  },

  // ✅ Récupérer l'historique des alertes
  getAlertHistory: async (adherentId, limit = 20) => {
    const response = await api.get(`/coach/adherents/${adherentId}/alerts?limit=${limit}`);
    return response.data;
  },

  // ✅ Marquer une alerte comme lue
  markAlertAsRead: async (alertId) => {
    const response = await api.put(`/coach/adherents/alerts/${alertId}/read`);
    return response.data;
  },

  // ✅ Récupérer les alertes non lues
  getUnreadAlerts: async () => {
    const response = await api.get('/coach/adherents/alerts/unread');
    return response.data;
  },

  getGroupStats: async () => {
    const response = await api.get('/coach/group-stats');
    return response.data;
  },

  getChurnAnalysis: async () => {
    const response = await api.get('/coach/churn/analysis');
    return response.data;
  },
};