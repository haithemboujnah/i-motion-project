import api from './api';

export const performanceService = {
  addMeasurement: async (data) => {
    const response = await api.post('/performance/measurements', data);
    return response.data;
  },

  getMeasurements: async (limit = 30) => {
    const response = await api.get(`/performance/measurements?limit=${limit}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/performance/stats');
    return response.data;
  },

  getEvolution: async (period = '30 days') => {
    const response = await api.get(`/performance/evolution?period=${period}`);
    return response.data;
  },

  generateReport: async () => {
    const response = await api.get('/performance/report');
    return response.data;
  },

  downloadPDF: async () => {
    const response = await api.get('/performance/report/pdf', {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });
    return response;
  }
};