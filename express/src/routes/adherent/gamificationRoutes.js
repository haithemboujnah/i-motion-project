const express = require('express');
const GamificationController = require('../../controllers/adherent/gamificationController');
const { authenticate } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

router.get('/points', authenticate, GamificationController.getPoints);
router.get('/badges', authenticate, GamificationController.getBadges);
router.get('/challenges', authenticate, GamificationController.getChallenges);
router.get('/ranking', authenticate, GamificationController.getRanking);

module.exports = router;