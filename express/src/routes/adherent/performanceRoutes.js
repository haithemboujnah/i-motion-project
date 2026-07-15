const express = require('express');
const PerformanceController = require('../../controllers/adherent/performanceController');
const { authenticate } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

// ✅ Vérifier que toutes les méthodes existent
router.post('/measurements', authenticate, PerformanceController.addMeasurement);
router.get('/measurements', authenticate, PerformanceController.getMeasurements);
router.get('/stats', authenticate, PerformanceController.getStats);
router.get('/evolution', authenticate, PerformanceController.getEvolution);
router.get('/report', authenticate, PerformanceController.generateReport);
router.get('/report/pdf', authenticate, PerformanceController.generatePDF);

module.exports = router;