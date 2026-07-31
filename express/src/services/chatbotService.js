const axios = require('axios');

class ChatbotService {
  constructor() {
    this.baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000/api';
    this.timeout = 15000;
    this.isAvailable = false;
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseUrl.replace('/api', '')}/health`, {
        timeout: 3000
      });
      this.isAvailable = response.data.status === 'healthy';
      return this.isAvailable;
    } catch (error) {
      this.isAvailable = false;
      return false;
    }
  }

  async sendMessage(userId, message, context = {}) {
    try {
      if (!this.isAvailable) {
        await this.checkHealth();
      }

      const response = await axios.post(
        `${this.baseUrl}/chatbot/chat`,
        {
          user_id: userId,
          message: message,
          context: context
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('❌ Error calling chatbot ML service:', error.message);
      
      return {
        success: true,
        data: {
          message: this.getLocalFallbackResponse(message),
          intent: 'fallback',
          confidence: 0,
          timestamp: new Date().toISOString(),
          suggestions: ['Réessayer', 'Contacter le support', 'Voir l\'aide']
        }
      };
    }
  }

  getLocalFallbackResponse(message) {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('bonjour') || lowerMsg.includes('salut')) {
      return 'Bonjour ! Comment puis-je vous aider ? 😊';
    }
    if (lowerMsg.includes('programme') || lowerMsg.includes('entraînement')) {
      return 'Votre programme est disponible dans l\'onglet "Programmes". 💪';
    }
    if (lowerMsg.includes('séance') || lowerMsg.includes('réserver')) {
      return 'Vous pouvez réserver une séance dans l\'onglet "Séances". 📅';
    }
    if (lowerMsg.includes('merci')) {
      return 'Avec plaisir ! À bientôt sur I-Motion ! 👋';
    }
    return 'Je suis désolé, je n\'ai pas compris. Pouvez-vous reformuler ? 🤔';
  }

  async getSuggestions() {
    try {
      const response = await axios.get(`${this.baseUrl}/chatbot/suggestions`);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting suggestions:', error.message);
      return {
        success: true,
        data: {
          suggestions: [
            'Voir mon programme personnalisé',
            'Comment réserver une séance ?',
            'Mes statistiques de progression',
            'Gagner des points et badges',
            'Contacter mon coach'
          ]
        }
      };
    }
  }
}

module.exports = new ChatbotService();