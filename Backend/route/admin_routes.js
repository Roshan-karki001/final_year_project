const express = require('express');
const router = express.Router();
const { 
    checkAdminPrivilege,
    manageUsers,
    manageProjects,
    manageContracts,
    moderateReviews,
    getSystemAnalytics
} = require('../controller/admin_controller');
const authMiddleware = require('../middleware/auth_middleware');

// Protect all admin routes with authentication
router.use(authMiddleware);

// User management routes
router.post('/users', checkAdminPrivilege('canManageUsers'), manageUsers);

// Project management routes
router.post('/projects', checkAdminPrivilege('canManageProjects'), manageProjects);

// Contract management routes
router.post('/contracts', checkAdminPrivilege('canManageContracts'), manageContracts);

// Review moderation routes
router.post('/reviews', checkAdminPrivilege('canModerateReviews'), moderateReviews);

// Analytics routes
router.get('/analytics', checkAdminPrivilege('canAccessAnalytics'), getSystemAnalytics);

module.exports = router;