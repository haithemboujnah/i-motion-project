const express = require('express');
const AdminSessionController = require('../../controllers/admin/adminSessionController');
const { authenticate, authorize } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', AdminSessionController.getAllSessions);
router.get('/stats', AdminSessionController.getSessionStats);
router.get('/:id', AdminSessionController.getSessionById);
router.post('/', AdminSessionController.createSession);
router.put('/:id', AdminSessionController.updateSession);
router.delete('/:id', AdminSessionController.deleteSession);

module.exports = router;