const express = require('express');
const CoachSessionController = require('../../controllers/coach/coachSessionController');
const { authenticate, authorize } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize('coach', 'admin'));

router.get('/', CoachSessionController.getSessions);
router.post('/', CoachSessionController.createSession);
router.put('/:sessionId/status', CoachSessionController.updateSessionStatus);

module.exports = router;