const express = require('express');
const PaymentController = require('../controllers/paymentController');
const { authenticate } = require('../auth/middleware/authMiddleware');

const router = express.Router();

// Routes publiques
router.get('/plans', PaymentController.getPlans);

// Routes protégées
router.post('/create-payment-intent', authenticate, PaymentController.createPaymentIntent);
router.post('/confirm-payment', authenticate, PaymentController.confirmPayment);
router.get('/payment-status/:paymentIntentId', authenticate, PaymentController.checkPaymentStatus);
router.get('/subscription', authenticate, PaymentController.getSubscription);
router.post('/cancel-subscription', authenticate, PaymentController.cancelSubscription);
router.get('/transactions', authenticate, PaymentController.getTransactions);

// Webhook
router.post('/webhook', express.raw({ type: 'application/json' }), PaymentController.handleWebhook);

module.exports = router;