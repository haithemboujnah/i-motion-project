const express = require('express');
const BIController = require('../controllers/biController');
const { authenticate, authorize } = require('../auth/middleware/authMiddleware');

const router = express.Router();

// Routes protégées (Admin uniquement)
router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard', BIController.getDashboard);
router.get('/kpis', BIController.getKPIs);
router.get('/revenue', BIController.getRevenue);
router.get('/retention', BIController.getRetention);
router.get('/peak-hours', BIController.getPeakHours);

module.exports = router;