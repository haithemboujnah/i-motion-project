const express = require('express');
const ReminderController = require('../controllers/reminderController');
const { authenticate, authorize } = require('../auth/middleware/authMiddleware');

const router = express.Router();

// ✅ Routes pour les adhérents - Utiliser ReminderController
router.post('/send/:sessionId', authenticate, ReminderController.sendReminder);

// ✅ Routes pour les coachs
router.post('/send-bulk', authenticate, authorize('coach', 'admin'), ReminderController.sendBulkReminders);

module.exports = router;