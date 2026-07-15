const express = require('express');
const NotificationController = require('../../controllers/adherent/notificationController');
const { authenticate } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, NotificationController.getNotifications);
router.get('/unread-count', authenticate, NotificationController.getUnreadCount);
router.put('/:id/read', authenticate, NotificationController.markAsRead);
router.put('/read-all', authenticate, NotificationController.markAllAsRead);

module.exports = router;