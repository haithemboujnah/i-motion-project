const express = require('express');
const QRController = require('../controllers/qrController');
const { authenticate, authorize } = require('../auth/middleware/authMiddleware');

const router = express.Router();

// Routes pour les adhérents
router.get('/generate', authenticate, QRController.generateQR);
router.get('/history', authenticate, QRController.getHistory);

// ✅ Routes pour les coachs (historique des pointages)
router.get('/coach/attendances', authenticate, authorize('coach', 'admin'), QRController.getCoachAttendances);
router.get('/coach/adherent/:adherentId/stats', authenticate, authorize('coach', 'admin'), QRController.getAdherentAttendanceStats);

// Routes de scan
router.post('/test-scan', authenticate, authorize('coach', 'admin'), QRController.testQRScan);
router.post('/scan-image', authenticate, authorize('coach', 'admin'), QRController.scanQRFromImage);
router.get('/session/:sessionId', authenticate, authorize('coach', 'admin'), QRController.getSessionAttendances);

module.exports = router;