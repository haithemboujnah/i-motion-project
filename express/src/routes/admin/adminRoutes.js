const express = require('express');
const AdminController = require('../../controllers/admin/adminController');
const { authenticate, authorize } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

// Toutes les routes admin nécessitent authentification et rôle admin
router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard', AdminController.getDashboard);
router.get('/global-stats', AdminController.getGlobalStats);

module.exports = router;