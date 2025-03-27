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
    editProfile,
    viewProfile,
    uploadProfileImage,
    deleteProfileImage,
    getAllUsers,        // Updated name
    getAllEngineers,
    getAllClient,    // Updated name
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
router.get('/profile', authenticateToken, viewProfile);
router.post('/profile/upload-image', authenticateToken, uploadProfileImage);
router.delete('/profile/delete-image', authenticateToken, deleteProfileImage);

// Admin Routes
router.get('/users', authenticateToken, getAllUsers);
router.get('/engineers', getAllEngineers);
router.get('/client', getAllClient);

module.exports = router;
