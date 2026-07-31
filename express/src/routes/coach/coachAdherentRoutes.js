const express = require('express');
const CoachAdherentController = require('../../controllers/coach/coachAdherentController');
const { authenticate, authorize } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize('coach', 'admin'));

router.get('/', CoachAdherentController.getAdherents);
router.get('/at-risk', CoachAdherentController.getAtRiskAdherents);
router.get('/:adherentId', CoachAdherentController.getAdherentDetail);
router.get('/:adherentId/recommendations', CoachAdherentController.getRecommendations);

router.get('/:adherentId/alerts', CoachAdherentController.getAlertHistory);
router.put('/alerts/:alertId/read', CoachAdherentController.markAlertAsRead);

module.exports = router;