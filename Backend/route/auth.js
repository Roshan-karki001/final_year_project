const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../midware/authMiddleware');
const {
    register,
    login,
    verifyEmail,
    forgotPassword,
    changePassword,
    deleteAccount,
    editProfile
} = require('../controller/authcontroller');

// Public Routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', authenticateToken, verifyEmail);  // Changed from GET to POST
router.post('/forgot-password', forgotPassword);

// Protected Routes
router.put('/edit-profile', authenticateToken, editProfile);
router.post('/change-password', authenticateToken, changePassword);
router.delete('/delete', authenticateToken, deleteAccount);

module.exports = router;
