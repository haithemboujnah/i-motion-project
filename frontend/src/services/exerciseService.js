import api from './api';

export const exerciseService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/exercises?${params}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/exercises/${id}`);
    return response.data;
  },

  getRecommendations: async (goal, level, limit = 10) => {
    const response = await api.get(`/exercises/recommendations?goal=${goal}&level=${level}&limit=${limit}`);
    return response.data;
  }
};