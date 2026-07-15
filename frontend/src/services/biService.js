import api from './api';

export const biService = {
  // ✅ Tableau de bord complet
  getDashboard: async () => {
    const response = await api.get('/bi/dashboard');
    return response.data;
  },

  // ✅ KPIs uniquement
  getKPIs: async () => {
    const response = await api.get('/bi/kpis');
    return response.data;
  },

  // ✅ Chiffre d'affaires
  getRevenue: async () => {
    const response = await api.get('/bi/revenue');
    return response.data;
  },

  // ✅ Taux de renouvellement
  getRetention: async () => {
    const response = await api.get('/bi/retention');
    return response.data;
  },

  // ✅ Heures de pointe
  getPeakHours: async () => {
    const response = await api.get('/bi/peak-hours');
    return response.data;
  }
};