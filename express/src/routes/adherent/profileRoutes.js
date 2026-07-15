const express = require('express');
const ProfileController = require('../../controllers/adherent/profileController');
const { authenticate } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

// Routes protégées
router.get('/me', authenticate, ProfileController.getProfile);
router.put('/me', authenticate, ProfileController.updateProfile);
router.get('/bmi', authenticate, ProfileController.calculateBMI);
router.get('/stats', authenticate, ProfileController.getProfileStats);

module.exports = router;