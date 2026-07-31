const express = require('express');
const AdminProgramController = require('../../controllers/admin/adminProgramController');
const { authenticate, authorize } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

// ✅ Toutes les routes admin nécessitent authentification et rôle admin
router.use(authenticate);
router.use(authorize('admin'));

// ✅ Routes CRUD
router.get('/', AdminProgramController.getAllPrograms);
router.post('/', AdminProgramController.createProgram);
router.put('/:id', AdminProgramController.updateProgram);
router.delete('/:id', AdminProgramController.deleteProgram);

// ✅ Routes spécifiques
router.post('/generate-exercises', AdminProgramController.generateExercises);
router.put('/:programId/assign/:adherentId', AdminProgramController.assignProgram);

module.exports = router;