import api from './api';

const ML_API_URL = process.env.REACT_APP_ML_API_URL || 'http://localhost:8000/api';

export const feedbackService = {
  // ✅ Créer un feedback
  create: async (data) => {
    const response = await api.post('/feedback', data);
    return response.data;
  },

  // ✅ Récupérer mes feedbacks (Adhérent)
  getMyFeedbacks: async () => {
    const response = await api.get('/feedback/my');
    return response.data;
  },

  // ✅ Récupérer tous les feedbacks (Admin)
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/feedback?${params}`);
    return response.data;
  },

  // ✅ Récupérer un feedback par ID
  getById: async (id) => {
    const response = await api.get(`/feedback/${id}`);
    return response.data;
  },

  // ✅ Mettre à jour le statut (Admin)
  updateStatus: async (id, status, admin_response) => {
    const response = await api.put(`/feedback/${id}/status`, { status, admin_response });
    return response.data;
  },

  // ✅ Récupérer les statistiques (Admin)
  getStats: async () => {
    const response = await api.get('/feedback/stats');
    return response.data;
  },

  // ✅ Supprimer un feedback (Admin)
  delete: async (id) => {
    const response = await api.delete(`/feedback/${id}`);
    return response.data;
  },

  // ✅ Analyser un feedback (ML) - Utiliser l'API ML directe
  analyzeFeedback: async (feedback) => {
    const response = await fetch(`${ML_API_URL}/feedback/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feedback }),
    });
    return response.json();
  },

  // ✅ Analyse batch (ML) - Utiliser l'API ML directe
  analyzeBatch: async (feedbacks) => {
    const response = await fetch(`${ML_API_URL}/feedback/analyze-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feedbacks }),
    });
    return response.json();
  }
};