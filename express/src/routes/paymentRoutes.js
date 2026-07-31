const express = require('express');
const PaymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../auth/middleware/authMiddleware');

const router = express.Router();

// ✅ Routes publiques
router.get('/plans', PaymentController.getPlans);

// ✅ Routes adhérent
router.post('/create-payment-intent', authenticate, PaymentController.createPaymentIntent);
router.post('/confirm-payment', authenticate, PaymentController.confirmPayment);
router.get('/payment-status/:paymentIntentId', authenticate, PaymentController.checkPaymentStatus);
router.get('/subscription', authenticate, PaymentController.getSubscription);
router.post('/cancel-subscription', authenticate, PaymentController.cancelSubscription);
router.get('/transactions', authenticate, PaymentController.getTransactions);

// ✅ Routes adhérent - Renouvellement
router.post('/request-renewal', authenticate, PaymentController.requestRenewal);

// ✅ Routes admin - Renouvellement
router.get('/admin/pending-renewals', authenticate, authorize('admin'), PaymentController.getPendingRenewals);
router.get('/admin/expiring-subscriptions', authenticate, authorize('admin'), PaymentController.getExpiringSubscriptions);
router.put('/admin/renewals/:subscriptionId/approve', authenticate, authorize('admin'), PaymentController.approveRenewal);
router.put('/admin/renewals/:subscriptionId/reject', authenticate, authorize('admin'), PaymentController.rejectRenewal);

// ✅ Webhook
router.post('/webhook', express.raw({ type: 'application/json' }), PaymentController.handleWebhook);

module.exports = router;