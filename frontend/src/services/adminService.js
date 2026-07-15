import api from './api';

export const adminService = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getGlobalStats: async () => {
    const response = await api.get('/admin/global-stats');
    return response.data;
  },

  getRecentActivities: async (limit = 20) => {
    const response = await api.get(`/admin/supervision/recent-activities?limit=${limit}`);
    return response.data;
  },

  // Utilisateurs
  getUsers: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/admin/users?${params}`);
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  createUser: async (data) => {
    const response = await api.post('/admin/users', data);
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  toggleUserStatus: async (id, is_active) => {
    const response = await api.put(`/admin/users/${id}/toggle-status`, { is_active });
    return response.data;
  },

  // Programmes
  getPrograms: async () => {
    const response = await api.get('/admin/programs');
    return response.data;
  },

  createProgram: async (data) => {
    const response = await api.post('/admin/programs', data);
    return response.data;
  },

  updateProgram: async (id, data) => {
    const response = await api.put(`/admin/programs/${id}`, data);
    return response.data;
  },

  deleteProgram: async (id) => {
    const response = await api.delete(`/admin/programs/${id}`);
    return response.data;
  },

  assignProgram: async (programId, adherentId) => {
    const response = await api.put(`/admin/programs/${programId}/assign/${adherentId}`);
    return response.data;
  },

  // Gamification
  getBadges: async () => {
    const response = await api.get('/admin/gamification/badges');
    return response.data;
  },

  createBadge: async (data) => {
    const response = await api.post('/admin/gamification/badges', data);
    return response.data;
  },

  updateBadge: async (id, data) => {
    const response = await api.put(`/admin/gamification/badges/${id}`, data);
    return response.data;
  },

  deleteBadge: async (id) => {
    const response = await api.delete(`/admin/gamification/badges/${id}`);
    return response.data;
  },

  getChallenges: async () => {
    const response = await api.get('/admin/gamification/challenges');
    return response.data;
  },

  createChallenge: async (data) => {
    const response = await api.post('/admin/gamification/challenges', data);
    return response.data;
  },

  updateChallenge: async (id, data) => {
    const response = await api.put(`/admin/gamification/challenges/${id}`, data);
    return response.data;
  },

  deleteChallenge: async (id) => {
    const response = await api.delete(`/admin/gamification/challenges/${id}`);
    return response.data;
  },

  // Analyse prédictive
  getRiskAnalysis: async () => {
    const response = await api.get('/admin/analytics/risk-analysis');
    return response.data;
  },

  getPrediction: async () => {
    const response = await api.get('/admin/analytics/prediction');
    return response.data;
  },

  getRetentionReport: async () => {
    const response = await api.get('/admin/analytics/retention-report');
    return response.data;
  },

  // Supervision
  getClubStats: async () => {
    const response = await api.get('/admin/supervision/club-stats');
    return response.data;
  },

  exportCSV: async (type) => {
    const response = await api.get(`/admin/supervision/export-csv?type=${type}`, {
      responseType: 'blob'
    });
    return response;
  },

  generateExercises: async (data) => {
    const response = await api.post('/admin/programs/generate-exercises', data);
    return response.data;
  },

  getSessions: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/admin/sessions?${params}`);
    return response.data;
  },

  getSessionStats: async () => {
    const response = await api.get('/admin/sessions/stats');
    return response.data;
  },

  getSessionById: async (id) => {
    const response = await api.get(`/admin/sessions/${id}`);
    return response.data;
  },

  createSession: async (data) => {
    const response = await api.post('/admin/sessions', data);
    return response.data;
  },

  updateSession: async (id, data) => {
    const response = await api.put(`/admin/sessions/${id}`, data);
    return response.data;
  },

  deleteSession: async (id) => {
    const response = await api.delete(`/admin/sessions/${id}`);
    return response.data;
  },

  getChurnAnalysis: async () => {
    const response = await api.get('/admin/churn/analysis');
    return response.data;
  },

  getAtRiskAdherents: async (riskLevel = null) => {
    const params = riskLevel ? `?riskLevel=${riskLevel}` : '';
    const response = await api.get(`/admin/churn/at-risk${params}`);
    return response.data;
  }
};