const express = require('express');
const ExerciseController = require('../../controllers/adherent/exerciseController');
const { authenticate } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, ExerciseController.getAll);
router.get('/recommendations', authenticate, ExerciseController.getRecommendations);
router.get('/:id', authenticate, ExerciseController.getById);

module.exports = router;