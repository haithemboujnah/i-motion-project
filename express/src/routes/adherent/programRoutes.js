const express = require('express');
const ProgramController = require('../../controllers/adherent/programController');
const { authenticate } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

router.post('/generate', authenticate, ProgramController.generateProgram);
router.get('/my', authenticate, ProgramController.getMyPrograms);
router.get('/active', authenticate, ProgramController.getActiveProgram);
router.get('/:id', authenticate, ProgramController.getProgramById);
router.put('/:id/status', authenticate, ProgramController.updateProgramStatus);

module.exports = router;