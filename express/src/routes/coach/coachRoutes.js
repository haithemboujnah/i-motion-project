const express = require('express');
const CoachController = require('../../controllers/coach/coachController');
const { authenticate, authorize } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

// Toutes les routes coach nécessitent authentification et rôle coach
router.use(authenticate);
router.use(authorize('coach', 'admin'));

router.get('/dashboard', CoachController.getDashboard);
router.get('/stats', CoachController.getStats);
router.get('/group-stats', CoachController.getGroupStats);

module.exports = router;