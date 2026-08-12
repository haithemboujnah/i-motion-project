const express = require('express');
const AdminSubscriptionController = require('../../controllers/admin/adminSubscriptionController');
const { authenticate, authorize } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', AdminSubscriptionController.getAllSubscriptions);
router.get('/stats', AdminSubscriptionController.getSubscriptionStats);
router.get('/expiring', AdminSubscriptionController.getExpiringSubscriptions);

module.exports = router;