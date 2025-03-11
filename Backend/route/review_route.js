const express = require("express");
const {
    getAllReviews,
    getUserReviews,
    getReviewById,
    createReview,
    updateReview,
    deleteReview
} = require("../controller/review_controller");
const { authenticateToken } = require("../midware/authMiddleware");

const router = express.Router();

// Public routes
router.get("/", getAllReviews);
router.get("/user/:id", getUserReviews);
router.get("/:id", getReviewById);

// Protected routes - require authentication
router.post("/", authenticateToken, createReview);
router.put("/:id", authenticateToken, updateReview);
router.delete("/:id", authenticateToken, deleteReview);

module.exports = router;