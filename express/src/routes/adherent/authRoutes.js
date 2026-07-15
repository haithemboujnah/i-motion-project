const express = require('express');
const AuthController = require('../../controllers/adherent/authController');
const { validateRegister, validateLogin } = require('../../auth/validators/authValidator');
const { authenticate } = require('../../auth/middleware/authMiddleware');

const router = express.Router();

// Routes publiques
router.post('/register', validateRegister, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);  
router.post('/reset-password', AuthController.resetPassword);    
router.get('/validate-reset-token/:token', AuthController.validateResetToken); 

// Routes protégées
router.get('/me', authenticate, AuthController.getCurrentUser);
router.put('/profile', authenticate, AuthController.updateProfile);
router.post('/change-password', authenticate, AuthController.changePassword);

module.exports = router;