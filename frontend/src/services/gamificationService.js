import api from './api';

export const gamificationService = {
  getPoints: async () => {
    const response = await api.get('/gamification/points');
    return response.data;
  },

  getBadges: async () => {
    const response = await api.get('/gamification/badges');
    return response.data;
  },

  getChallenges: async () => {
    const response = await api.get('/gamification/challenges');
    return response.data;
  },

  getRanking: async (limit = 10) => {
    const response = await api.get(`/gamification/ranking?limit=${limit}`);
    return response.data;
  }
};