import api from './api';

export const programService = {
  generateProgram: async (data) => {
    const response = await api.post('/programs/generate', data);
    return response.data;
  },

  getMyPrograms: async () => {
    const response = await api.get('/programs/my');
    return response.data;
  },

  getActiveProgram: async () => {
    try {
      const response = await api.get('/programs/active');
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: true, data: { program: null } };
      }
      throw error;
    }
  },

  getProgramById: async (id) => {
    const response = await api.get(`/programs/${id}`);
    return response.data;
  },

  updateProgramStatus: async (id, status) => {
    const response = await api.put(`/programs/${id}/status`, { status });
    return response.data;
  }
};