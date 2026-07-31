import api from './api';

export const chatbotService = {
  // ✅ Envoyer un message
  sendMessage: async (message, conversationId = null, context = {}) => {
    const response = await api.post('/chatbot/message', { 
      message, 
      conversation_id: conversationId,
      context 
    });
    return response.data;
  },

  // ✅ Récupérer toutes les conversations
  getConversations: async () => {
    const response = await api.get('/chatbot/conversations');
    return response.data;
  },

  // ✅ Récupérer les messages d'une conversation
  getMessages: async (conversationId) => {
    const response = await api.get(`/chatbot/conversations/${conversationId}/messages`);
    return response.data;
  },

  // ✅ Créer une nouvelle conversation
  createConversation: async (title = null) => {
    const response = await api.post('/chatbot/conversations', { title });
    return response.data;
  },

  // ✅ Renommer une conversation
  renameConversation: async (conversationId, title) => {
    const response = await api.put(`/chatbot/conversations/${conversationId}/rename`, { title });
    return response.data;
  },

  // ✅ Supprimer une conversation
  deleteConversation: async (conversationId) => {
    const response = await api.delete(`/chatbot/conversations/${conversationId}`);
    return response.data;
  },

  // ✅ Obtenir les suggestions
  getSuggestions: async () => {
    const response = await api.get('/chatbot/suggestions');
    return response.data;
  }
};