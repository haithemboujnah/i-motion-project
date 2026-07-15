const express = require('express');
const AdminChurnController = require('../../controllers/admin/adminChurnController');
const { authenticate, authorize } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

// ✅ Toutes les routes admin nécessitent authentification et rôle admin
router.use(authenticate);
router.use(authorize('admin'));

// ✅ Routes Churn - Vérifier que les méthodes existent
router.get('/analysis', AdminChurnController.getChurnAnalysis);
router.get('/at-risk', AdminChurnController.getAtRiskAdherents);

// ✅ Route de test pour vérifier que le routeur fonctionne
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Churn routes working' });
});

module.exports = router;