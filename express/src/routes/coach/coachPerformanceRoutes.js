const express = require('express');
const CoachPerformanceController = require('../../controllers/coach/coachPerformanceController');
const { authenticate, authorize } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize('coach', 'admin'));

router.get('/', CoachPerformanceController.getAdherentPerformances);
router.get('/stats', CoachPerformanceController.getPerformanceStats);

module.exports = router;