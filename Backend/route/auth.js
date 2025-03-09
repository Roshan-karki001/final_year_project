const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../midware/authMiddleware');
const {
    register,
    login,
    verifyEmail,
    forgotPassword,
    changePassword,
    deleteAccount
} = require('../controller/authcontroller');

// Public Routes
router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:verificationToken', verifyEmail);
router.post('/forgot-password', forgotPassword);

// Protected Routes
router.post('/change-password', authenticateToken, changePassword);
router.delete('/delete', authenticateToken, deleteAccount);

module.exports = router;
