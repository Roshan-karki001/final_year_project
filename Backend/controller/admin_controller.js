const { Signup, Project, Contract, Review, Message } = require("../models/alldatabase");

// Middleware to check admin privileges
const checkAdminPrivilege = (privilege) => async (req, res, next) => {
    try {
        const admin = await Signup.findById(req.user.id);
        if (!admin || !admin.isAdmin || !admin.adminPrivileges[privilege]) {
            return res.status(403).json({
                success: false,
                message: "Insufficient admin privileges"
            });
        }
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// User Management
const manageUsers = async (req, res) => {
    try {
        const { action, userId } = req.body;
        const user = await Signup.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        switch (action) {
            case 'deactivate':
                user.isActive = false;
                break;
            case 'activate':
                user.isActive = true;
                break;
            case 'changeRole':
                const { newRole } = req.body;
                if (!['client', 'engineer'].includes(newRole)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid role specified"
                    });
                }
                user.role = newRole;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: "Invalid action specified"
                });
        }

        // Log admin action
        await Signup.findByIdAndUpdate(req.user.id, {
            $push: {
                adminActions: {
                    action: `${action}_user`,
                    targetId: userId,
                    timestamp: new Date()
                }
            }
        });

        await user.save();
        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Project Management
const manageProjects = async (req, res) => {
    try {
        const { action, projectId } = req.body;
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        switch (action) {
            case 'cancel':
                project.status = 'cancelled';
                break;
            case 'activate':
                project.status = 'active';
                break;
            case 'complete':
                project.status = 'completed';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: "Invalid action specified"
                });
        }

        // Log admin action
        await Signup.findByIdAndUpdate(req.user.id, {
            $push: {
                adminActions: {
                    action: `${action}_project`,
                    targetId: projectId,
                    timestamp: new Date()
                }
            }
        });

        await project.save();
        res.status(200).json({
            success: true,
            message: "Project updated successfully",
            project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Contract Management
const manageContracts = async (req, res) => {
    try {
        const { action, contractId } = req.body;
        const contract = await Contract.findById(contractId);

        if (!contract) {
            return res.status(404).json({
                success: false,
                message: "Contract not found"
            });
        }

        switch (action) {
            case 'cancel':
                contract.status = 'cancelled';
                break;
            case 'approve':
                contract.status = 'active';
                break;
            case 'complete':
                contract.status = 'completed';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: "Invalid action specified"
                });
        }

        // Log admin action
        await Signup.findByIdAndUpdate(req.user.id, {
            $push: {
                adminActions: {
                    action: `${action}_contract`,
                    targetId: contractId,
                    timestamp: new Date()
                }
            }
        });

        await contract.save();
        res.status(200).json({
            success: true,
            message: "Contract updated successfully",
            contract
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Review Moderation
const moderateReviews = async (req, res) => {
    try {
        const { action, reviewId } = req.body;
        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        switch (action) {
            case 'delete':
                await review.deleteOne();
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: "Invalid action specified"
                });
        }

        // Log admin action
        await Signup.findByIdAndUpdate(req.user.id, {
            $push: {
                adminActions: {
                    action: `${action}_review`,
                    targetId: reviewId,
                    timestamp: new Date()
                }
            }
        });

        res.status(200).json({
            success: true,
            message: "Review moderated successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Analytics
const getSystemAnalytics = async (req, res) => {
    try {
        const analytics = {
            users: {
                total: await Signup.countDocuments(),
                clients: await Signup.countDocuments({ role: 'client' }),
                engineers: await Signup.countDocuments({ role: 'engineer' }),
                active: await Signup.countDocuments({ isActive: true })
            },
            projects: {
                total: await Project.countDocuments(),
                pending: await Project.countDocuments({ status: 'pending' }),
                active: await Project.countDocuments({ status: 'active' }),
                completed: await Project.countDocuments({ status: 'completed' }),
                cancelled: await Project.countDocuments({ status: 'cancelled' })
            },
            contracts: {
                total: await Contract.countDocuments(),
                pending: await Contract.countDocuments({ status: 'pending' }),
                active: await Contract.countDocuments({ status: 'active' }),
                completed: await Contract.countDocuments({ status: 'completed' }),
                cancelled: await Contract.countDocuments({ status: 'cancelled' })
            },
            reviews: {
                total: await Review.countDocuments(),
                averageRating: await Review.aggregate([
                    { $group: { _id: null, avg: { $avg: "$rating" } } }
                ])
            }
        };

        res.status(200).json({
            success: true,
            analytics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    checkAdminPrivilege,
    manageUsers,
    manageProjects,
    manageContracts,
    moderateReviews,
    getSystemAnalytics
};