const express = require('express');
const SessionController = require('../../controllers/adherent/sessionController');
const { authenticate } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

router.get('/available', authenticate, SessionController.getAvailableSessions);
router.get('/my', authenticate, SessionController.getMySessions);
router.get('/upcoming', authenticate, SessionController.getUpcomingSessions);
router.post('/:session_id/reserve', authenticate, SessionController.reserveSession);
router.put('/:session_id/cancel', authenticate, SessionController.cancelSession);

module.exports = router;