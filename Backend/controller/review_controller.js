const { Review } = require("../models/alldatabase");

// Get all reviews
const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find().populate('user_id', 'F_name L_name');
        res.status(200).json({ success: true, reviews });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get reviews by user ID
const getUserReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ user_id: req.params.userId })
            .populate('user_id', 'F_name L_name');
        res.status(200).json({ success: true, reviews });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get a single review
const getReviewById = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate('user_id', 'F_name L_name');
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }
        res.status(200).json({ success: true, review });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Create a new review
const createReview = async (req, res) => {
    try {
        const { review_text, rating } = req.body;
        const user_id = req.user.id; // From auth middleware

        const newReview = await Review.create({
            user_id,
            review_text,
            rating
        });

        res.status(201).json({ 
            success: true, 
            message: "Review submitted successfully", 
            review: newReview 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Update a review
const updateReview = async (req, res) => {
    try {
        const { review_text, rating } = req.body;
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        // Check if the user is the owner of the review
        if (review.user_id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not authorized to update this review" });
        }

        const updatedReview = await Review.findByIdAndUpdate(
            req.params.id,
            { review_text, rating },
            { new: true, runValidators: true }
        );

        res.status(200).json({ 
            success: true, 
            message: "Review updated successfully", 
            review: updatedReview 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Delete a review
const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        // Check if the user is the owner of the review
        if (review.user_id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not authorized to delete this review" });
        }

        await Review.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Review deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = {
    getAllReviews,
    getUserReviews,
    getReviewById,
    createReview,
    updateReview,
    deleteReview
};