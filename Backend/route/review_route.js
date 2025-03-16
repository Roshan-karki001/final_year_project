// routes/reviewRoutes.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../midware/authMiddleware");
const { Review, Signup } = require("../models/alldatabase");
const { checkRole } = require("../midware/authMiddleware");
const { 
    getAllReviews, 
    getUserReviews, 
    createReview, 
    updateReview, 
    deleteReview 
} = require("../controller/review_controller");

// Public Routes
router.get("/", getAllReviews);
router.get("/user/:id", getUserReviews);

// Protected Routes - Require Authentication
router.post("/", authenticateToken, createReview);
router.put("/:id", authenticateToken, updateReview);
router.delete("/:id", authenticateToken, deleteReview);


module.exports = router;