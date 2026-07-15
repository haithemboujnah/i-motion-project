const express = require('express');

// Routes Adhérent
const authRoutes = require('./adherent/authRoutes');
const sessionRoutes = require('./adherent/sessionRoutes');
const performanceRoutes = require('./adherent/performanceRoutes');
const programRoutes = require('./adherent/programRoutes');
const gamificationRoutes = require('./adherent/gamificationRoutes');
const notificationRoutes = require('./adherent/notificationRoutes');
const exerciseRoutes = require('./adherent/exerciseRoutes');
const reminderRoutes = require('./reminderRoutes');
// Routes Coach
const coachRoutes = require('./coach/coachRoutes');
const coachAdherentRoutes = require('./coach/coachAdherentRoutes');
const coachSessionRoutes = require('./coach/coachSessionRoutes');
const coachPerformanceRoutes = require('./coach/coachPerformanceRoutes');
const coachChurnRoutes = require('./coach/coachChurnRoutes');

// Routes Admin
const adminRoutes = require('./admin/adminRoutes');
const adminUserRoutes = require('./admin/adminUserRoutes');
const adminProgramRoutes = require('./admin/adminProgramRoutes');
const adminGamificationRoutes = require('./admin/adminGamificationRoutes');
const adminAnalyticsRoutes = require('./admin/adminAnalyticsRoutes');
const adminSupervisionRoutes = require('./admin/adminSupervisionRoutes');
const adminSessionRoutes = require('./admin/adminSessionRoutes');
const adminChurnRoutes = require('./admin/adminChurnRoutes');

const paymentRoutes = require('./paymentRoutes');
const chatbotRoutes = require('./chatbotRoutes');
const qrRoutes = require('./qrRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const biRoutes = require('./biRoutes');

const router = express.Router();

console.log('📋 Registering routes...');

// Routes Adhérent
router.use('/auth', authRoutes);
router.use('/sessions', sessionRoutes);
router.use('/performance', performanceRoutes);
router.use('/programs', programRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/reminders', reminderRoutes);
console.log('✅ Adherent routes registered');

// Routes Coach
router.use('/coach', coachRoutes);
router.use('/coach/adherents', coachAdherentRoutes);
router.use('/coach/sessions', coachSessionRoutes);
router.use('/coach/performances', coachPerformanceRoutes);
router.use('/coach/churn', coachChurnRoutes);
console.log('✅ Coach routes registered');

// Routes Admin
router.use('/admin', adminRoutes);
router.use('/admin/users', adminUserRoutes);
router.use('/admin/programs', adminProgramRoutes);
router.use('/admin/gamification', adminGamificationRoutes);
router.use('/admin/analytics', adminAnalyticsRoutes);
router.use('/admin/supervision', adminSupervisionRoutes);
router.use('/admin/sessions', adminSessionRoutes);
router.use('/admin/churn', adminChurnRoutes);
console.log('✅ Admin routes registered');

// ✅ Routes Payment
router.use('/payment', paymentRoutes);
console.log('✅ Payment routes registered');

router.use('/chatbot', chatbotRoutes);
router.use('/qr', qrRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/bi', biRoutes);

console.log('📋 All routes registered successfully');

module.exports = router;