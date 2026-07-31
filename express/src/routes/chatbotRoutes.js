const express = require('express');
const ChatbotController = require('../controllers/chatbotController');
const { authenticate } = require('../auth/middleware/authMiddleware');

const router = express.Router();

// Toutes les routes chatbot nécessitent authentification
router.use(authenticate);

// Routes principales
router.post('/message', ChatbotController.sendMessage);
router.post('/conversations', ChatbotController.createConversation);
router.get('/conversations', ChatbotController.getConversations);
router.get('/conversations/:conversationId/messages', ChatbotController.getMessages);
router.put('/conversations/:conversationId/rename', ChatbotController.renameConversation);
router.delete('/conversations/:conversationId', ChatbotController.deleteConversation);
router.get('/suggestions', ChatbotController.getSuggestions);

module.exports = router;