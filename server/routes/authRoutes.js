const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/authMiddleware');

// Login - Public
router.post('/login', authController.login);

// Register - Public
router.post('/register', authController.register);

// Logout
router.post('/logout', authController.logout);

// Get current user profile - Protected
router.get('/profile', auth, authController.getMe);

// Update password - Protected
router.put('/password', auth, authController.updatePassword);

module.exports = router;
