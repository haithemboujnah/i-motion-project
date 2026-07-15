const express = require('express');
const AdminSupervisionController = require('../../controllers/admin/adminSupervisionController');
const { authenticate, authorize } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/recent-activities', AdminSupervisionController.getRecentActivities);
router.get('/club-stats', AdminSupervisionController.getClubStats);
router.get('/export-csv', AdminSupervisionController.exportCSV);

module.exports = router;