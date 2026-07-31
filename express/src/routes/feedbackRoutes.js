const express = require('express');
const FeedbackController = require('../controllers/feedbackController');
const { authenticate, authorize } = require('../auth/middleware/authMiddleware');

const router = express.Router();

// ✅ Routes pour les adhérents
router.post('/', authenticate, FeedbackController.create);
router.get('/my', authenticate, FeedbackController.getMyFeedbacks);

// ✅ Routes pour les admins
router.get('/', authenticate, authorize('admin'), FeedbackController.getAll);
router.get('/stats', authenticate, authorize('admin'), FeedbackController.getStats);
router.get('/:id', authenticate, authorize('admin'), FeedbackController.getById);
router.put('/:id/status', authenticate, authorize('admin'), FeedbackController.updateStatus); // ✅ Cette route existe
router.delete('/:id', authenticate, authorize('admin'), FeedbackController.delete);

module.exports = router;