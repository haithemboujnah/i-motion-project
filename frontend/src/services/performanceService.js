import api from './api';

export const performanceService = {
  addMeasurement: async (data) => {
    try {
      const payload = {
        weight: parseFloat(data.weight),
        body_fat: data.body_fat ? parseFloat(data.body_fat) : null,
        muscle_mass: data.muscle_mass ? parseFloat(data.muscle_mass) : null,
        notes: data.notes || null,
        measured_at: data.measured_at || new Date().toISOString()
      };
      
      const response = await api.post('/performance/measurements', payload);
      return response.data;
    } catch (error) {
      console.error('❌ Error adding measurement:', error);
      throw error;
    }
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
      responseType: 'blob'
    });
    return response;
  }
};