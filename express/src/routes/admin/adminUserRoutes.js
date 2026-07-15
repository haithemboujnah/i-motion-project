const express = require('express');
const AdminUserController = require('../../controllers/admin/adminUserController');
const { authenticate, authorize } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', AdminUserController.getAllUsers);
router.get('/:id', AdminUserController.getUserById);
router.post('/', AdminUserController.createUser);
router.put('/:id', AdminUserController.updateUser);
router.delete('/:id', AdminUserController.deleteUser);
router.put('/:id/toggle-status', AdminUserController.toggleUserStatus);

module.exports = router;