import api from './api';

export const qrService = {
  // ✅ Générer un QR Code
  generateQR: async () => {
    const response = await api.get('/qr/generate');
    return response.data;
  },

  // ✅ Tester un QR Code
  testQRScan: async (imageData) => {
    const response = await api.post('/qr/test-scan', { imageData });
    return response.data;
  },

  // ✅ Scanner un QR Code depuis une image (Coach)
  scanQRFromImage: async (imageData, sessionId) => {
    const response = await api.post('/qr/scan-image', { 
      imageData, 
      sessionId 
    });
    return response.data;
  },

  // ✅ Historique des pointages
  getHistory: async (limit = 20) => {
    const response = await api.get(`/qr/history?limit=${limit}`);
    return response.data;
  },

  // ✅ Pointages d'une séance (Coach)
  getSessionAttendances: async (sessionId) => {
    const response = await api.get(`/qr/session/${sessionId}`);
    return response.data;
  },
  // ✅ Récupérer l'historique des pointages du coach
  getCoachAttendances: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/qr/coach/attendances?${params}`);
    return response.data;
  },

  // ✅ Récupérer les statistiques de pointage d'un adhérent spécifique
  getAdherentAttendanceStats: async (adherentId) => {
    const response = await api.get(`/qr/coach/adherent/${adherentId}/stats`);
    return response.data;
  }
};