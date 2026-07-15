const express = require('express');
const CoachChurnController = require('../../controllers/coach/coachChurnController');
const { authenticate, authorize } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

// ✅ Routes Coach Churn - Authentification + rôle coach
router.use(authenticate);
router.use(authorize('coach', 'admin'));

router.get('/analysis', CoachChurnController.getChurnAnalysis);

module.exports = router;