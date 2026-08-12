const express = require('express');
const CoachSubscriptionController = require('../../controllers/coach/coachSubscriptionController');
const { authenticate, authorize } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

// Toutes les routes nécessitent authentification et rôle coach/admin
router.use(authenticate);
router.use(authorize('coach', 'admin'));

// ✅ Routes principales
router.get('/adherents', CoachSubscriptionController.getAdherentsWithSubscriptions);
router.get('/adherents/:adherentId/detail', CoachSubscriptionController.getAdherentSubscriptionDetail);

// ✅ Actions sur les abonnements
router.put('/adherents/:adherentId/subscription', CoachSubscriptionController.updateAdherentSubscription);

module.exports = router;