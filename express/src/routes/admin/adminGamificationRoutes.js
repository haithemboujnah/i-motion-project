const express = require('express');
const AdminGamificationController = require('../../controllers/admin/adminGamificationController');
const { authenticate, authorize } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

// Badges
router.get('/badges', AdminGamificationController.getAllBadges);
router.post('/badges', AdminGamificationController.createBadge);
router.put('/badges/:id', AdminGamificationController.updateBadge);
router.delete('/badges/:id', AdminGamificationController.deleteBadge);

// Challenges
router.get('/challenges', AdminGamificationController.getAllChallenges);
router.post('/challenges', AdminGamificationController.createChallenge);
router.put('/challenges/:id', AdminGamificationController.updateChallenge);
router.delete('/challenges/:id', AdminGamificationController.deleteChallenge);

module.exports = router;