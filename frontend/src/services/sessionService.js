import api from './api';

export const sessionService = {
  getAvailableSessions: async (date) => {
    const response = await api.get(`/sessions/available?date=${date}`);
    return response.data;
  },

  getMySessions: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/sessions/my?${params}`);
    return response.data;
  },

  getUpcomingSessions: async (limit = 5) => {
    const response = await api.get(`/sessions/upcoming?limit=${limit}`);
    return response.data;
  },

  reserveSession: async (sessionId) => {
    const response = await api.post(`/sessions/${sessionId}/reserve`);
    return response.data;
  },

  cancelSession: async (sessionId) => {
    const response = await api.put(`/sessions/${sessionId}/cancel`);
    return response.data;
  }
};