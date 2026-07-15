const express = require('express');
const AdminAnalyticsController = require('../../controllers/admin/adminAnalyticsController');
const { authenticate, authorize } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/global-stats', AdminAnalyticsController.getGlobalStats);
router.get('/risk-analysis', AdminAnalyticsController.getRiskAnalysis);
router.get('/prediction', AdminAnalyticsController.getPrediction);
router.get('/retention-report', AdminAnalyticsController.getRetentionReport);

module.exports = router;