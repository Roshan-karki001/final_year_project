// controllers/review_controller.js
const {Review ,Signup} = require("../models/alldatabase");


// Get all reviews (public)
// Get all reviews
const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate("toUserId", "F_name L_name G_mail")
            .populate("fromUserId", "F_name L_name G_mail")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: reviews.length, reviews });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get reviews for a specific engineer
const getUserReviews = async (req, res) => {
    try {
        const engineer = await Signup.findById(req.params.id);
        if (!engineer || engineer.role !== "engineer") {
            return res.status(400).json({ success: false, message: "Reviews can only be viewed for engineers" });
        }
        const reviews = await Review.find({ toUserId: req.params.id })
            .populate("fromUserId", "F_name L_name G_mail")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: reviews.length, reviews });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Create a review
const createReview = async (req, res) => {
    try {
        const { reviewText, rating, engineerId } = req.body;
        const clientId = req.user.id;

        console.log('Request data:', {
            engineerId,
            clientId,
            reviewText,
            rating
        });
        
        // First verify if the engineer exists
        const engineer = await Signup.findById(engineerId);
        console.log('Found engineer:', engineer);
        
        if (!engineer) {
            return res.status(400).json({ 
                success: false, 
                message: "Engineer not found" 
            });
        }

        if (engineer.role !== "engineer") {
            return res.status(400).json({ 
                success: false, 
                message: "Selected user is not an engineer" 
            });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({
            toUserId: engineerId,
            fromUserId: clientId
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this engineer"
            });
        }

        // Create the review
        const newReview = await Review.create({
            toUserId: engineerId,
            fromUserId: clientId,
            reviewText,
            rating
        });

        res.status(201).json({ 
            success: true, 
            message: "Review submitted successfully", 
            review: newReview 
        });
    } catch (err) {
        console.error('Error details:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
};

// Update a review
const updateReview = async (req, res) => {
    try {
        const { reviewText, rating } = req.body;
        const clientId = req.user.id;

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

        // Find the review without population first
        const review = await Review.findById(req.params.id);
        
        // Check if review exists
        if (!review) {
            return res.status(404).json({ 
                success: false, 
                message: "Review not found" 
            });
        }

        console.log('Found review:', {
            reviewFromUserId: review.fromUserId.toString(),
            clientId: clientId
        });

        // Compare the IDs as strings
        if (review.fromUserId.toString() !== clientId) {
            return res.status(403).json({ 
                success: false, 
                message: "Not authorized to update this review" 
            });
        }

        // Update the review
        review.reviewText = reviewText;
        review.rating = rating;
        await review.save();

        res.status(200).json({ 
            success: true, 
            message: "Review updated successfully", 
            review 
        });
    } catch (err) {
        console.error('Update error:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
};

// Delete a review
const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        
        if (!review || review.fromUserId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not authorized to delete this review" });
        }
        
        await review.deleteOne();
        res.status(200).json({ success: true, message: "Review deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = { getAllReviews, getUserReviews, createReview, updateReview, deleteReview };
