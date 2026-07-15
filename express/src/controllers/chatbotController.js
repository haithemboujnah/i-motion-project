const chatbotService = require('../services/chatbotService');
const Conversation = require('../models/Conversation');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

class ChatbotController {
  // ✅ Envoyer un message
  static async sendMessage(req, res) {
    try {
      const userId = req.user.userId;
      const { message, conversation_id, context = {} } = req.body;
      
      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Le message est requis'
        });
      }

      // Récupérer ou créer la conversation
      let conversation;
      if (conversation_id) {
        conversation = await Conversation.findById(conversation_id, userId);
        if (!conversation) {
          return res.status(404).json({
            success: false,
            error: 'Conversation non trouvée'
          });
        }
      } else {
        conversation = await Conversation.getOrCreateDefault(userId);
      }

      // Sauvegarder le message de l'utilisateur
      const userMessage = await ChatMessage.create(
        conversation.id,
        'user',
        message.trim()
      );

      // Récupérer les données utilisateur
      const user = await User.findById(userId);
      
      const enrichedContext = {
        first_name: user?.first_name || 'Cher adhérent',
        ...context
      };
      
      const response = await chatbotService.sendMessage(
        userId,
        message.trim(),
        enrichedContext
      );

      let botMessage = null;
      if (response.success) {
        botMessage = await ChatMessage.create(
          conversation.id,
          'bot',
          response.data.message,
          response.data.intent,
          response.data.confidence
        );

        await Conversation.updateTitle(conversation.id, conversation.title);
      }

      if (conversation.title === 'Nouvelle conversation' && userMessage) {
        const newTitle = message.length > 50 
          ? message.substring(0, 50) + '...' 
          : message;
        await Conversation.updateTitle(conversation.id, newTitle);
      }

      res.json({
        success: true,
        data: {
          conversation_id: conversation.id,
          user_message: userMessage,
          bot_message: botMessage,
          response: response.data || null
        }
      });
    } catch (error) {
      console.error('Error in chatbot:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la communication avec le chatbot'
      });
    }
  }

  // ✅ Récupérer les conversations
  static async getConversations(req, res) {
    try {
      const userId = req.user.userId;
      const conversations = await Conversation.findByUserId(userId);
      
      res.json({
        success: true,
        data: { conversations }
      });
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des conversations'
      });
    }
  }

  // ✅ Récupérer les messages d'une conversation
  static async getMessages(req, res) {
    try {
      const userId = req.user.userId;
      const { conversationId } = req.params;
      
      const conversation = await Conversation.findById(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation non trouvée'
        });
      }
      
      const messages = await ChatMessage.findByConversationId(conversationId);
      
      res.json({
        success: true,
        data: { 
          conversation,
          messages 
        }
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des messages'
      });
    }
  }

  // ✅ Créer une nouvelle conversation
  static async createConversation(req, res) {
    try {
      const userId = req.user.userId;
      const { title } = req.body;
      
      const conversation = await Conversation.create(userId, title);
      
      res.json({
        success: true,
        message: 'Conversation créée avec succès',
        data: { conversation }
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de la conversation'
      });
    }
  }

  // ✅ Supprimer une conversation
  static async deleteConversation(req, res) {
    try {
      const userId = req.user.userId;
      const { conversationId } = req.params;
      
      const conversation = await Conversation.delete(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation non trouvée'
        });
      }
      
      res.json({
        success: true,
        message: 'Conversation supprimée avec succès'
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression de la conversation'
      });
    }
  }

  // ✅ Renommer une conversation
  static async renameConversation(req, res) {
    try {
      const userId = req.user.userId;
      const { conversationId } = req.params;
      const { title } = req.body;
      
      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Le titre est requis'
        });
      }
      
      const conversation = await Conversation.updateTitle(conversationId, title.trim());
      
      res.json({
        success: true,
        message: 'Conversation renommée avec succès',
        data: { conversation }
      });
    } catch (error) {
      console.error('Error renaming conversation:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du renommage de la conversation'
      });
    }
  }

  // ✅ Obtenir les suggestions
  static async getSuggestions(req, res) {
    try {
      const response = await chatbotService.getSuggestions();
      res.json(response);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des suggestions'
      });
    }
  }
}

module.exports = ChatbotController;