const express = require('express');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
require("dotenv").config();
const { Signup, Contract } = require("../models/alldatabase");
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

const router = express.Router();

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "2c9980ccc3611f",
        pass: "92e40b0f4fdd8e"
    }
});


// Add this validation middleware for image uploads
const imageUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/');
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    }),
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
}).single('profileImage');

// Register Route
const register = async (req, res) => {
    try {
        // Handle file upload with custom error handling
        await new Promise((resolve, reject) => {
            imageUpload(req, res, (err) => {
                if (err instanceof multer.MulterError) {
                    reject(new Error(`Image upload error: ${err.message}`));
                } else if (err) {
                    reject(new Error(err.message));
                }
                resolve();
            });
        });

        const { 
            F_name, L_name, G_mail, Phonenumber, password, role,
            location, bio, skills, experience, portfolio, socialLinks 
        } = req.body;

        // Validate required fields based on role
        const requiredFields = ['F_name', 'L_name', 'G_mail', 'Phonenumber', 'password', 'role'];
        
        if (role === 'engineer') {
            requiredFields.push('skills', 'experience');
        }

        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                message: "Missing required fields", 
                fields: missingFields 
            });
        }

        if (!req.file) {
            return res.status(400).json({ message: "Profile image is required" });
        }

        // Create image URL with proper path handling
        const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;

        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(G_mail)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const existingUser = await Signup.findOne({ G_mail });
        if (existingUser) return res.status(400).json({ 
            message: "User already exists",
            details: "This email is already registered"
        });

        const hashedPassword = await bcrypt.hash(password, 10);
        const randomToken = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationToken = jwt.sign({ email: G_mail, randomToken }, process.env.JWT_SECRET, { expiresIn: "1d" });

        // Create new user with role-specific fields
        const userData = {
            F_name,
            L_name,
            G_mail,
            Phonenumber,
            password: hashedPassword,
            role,
            location: location || "",
            verificationToken,
            isVerified: false,
            emailVerificationCode: randomToken,
            profileImage: {
                url: imageUrl,
                publicId: req.file.filename,
                uploadDate: new Date()
            }
        };

        // Add engineer-specific fields if role is engineer
        if (role === 'engineer') {
            userData.bio = bio || "";
            userData.skills = skills || [];
            userData.experience = experience || [];
            userData.portfolio = portfolio || [];
            userData.socialLinks = socialLinks || {
                linkedin: "",
                github: "",
                website: ""
            };
        }

        const newUser = new Signup(userData);
        await newUser.save();

        // Send verification email
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: G_mail,
            subject: "Your Verification Code",
            text: `Welcome! Your verification code is: ${randomToken}\n\nPlease use this code to verify your account.\n\nThis code will expire in 24 hours.`
        });

        res.status(201).json({ 
            message: "User registered successfully. Please verify your email.",
            verificationToken: verificationToken
        });
    } catch (error) {
        if (req.file) {
            const filePath = path.join(__dirname, '../uploads', req.file.filename);
            await fs.unlink(filePath).catch(err => 
                console.error('Error deleting file:', err)
            );
        }
        console.error("Registration error:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message,
            details: error.code === 'LIMIT_FILE_SIZE' ? 
                'File size should be less than 5MB' : 
                'Error processing registration'
        });
    }
};

// Verify Email Route
const verifyEmail = async (req, res) => {
    try {
        const { inputCode } = req.body;
        const verificationToken = req.headers.authorization?.split(' ')[1];

        if (!verificationToken) {
            return res.status(400).json({ message: "Verification token is required" });
        }

        const decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
        // Changed from G_mail to email to match the token we created during registration
        const user = await Signup.findOne({ G_mail: decoded.email });

        if (!user) return res.status(400).json({ message: "Invalid or expired token" });

        // Check if the input code matches the stored verification code
        if (user.emailVerificationCode !== inputCode) {
            return res.status(400).json({ message: "Invalid verification code" });
        }

        // Set the user as verified and remove the verification code
        user.isVerified = true;
        user.verificationToken = null;
        user.emailVerificationCode = null;
        await user.save();

        res.status(200).json({ message: "Email verified successfully. You can now log in." });
    } catch (error) {
        console.error("Verification error:", error); // Added for debugging
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Login Route
const login = async (req, res) => {
    try {
        const { G_mail, password, role } = req.body;
        console.log(G_mail,password,role);
        // Clean up email (remove any extra .com if present)
        const cleanEmail = G_mail.replace(/\.com\.com$/, '.com');
        
        const user = await Signup.findOne({ G_mail: cleanEmail });
        if (!user) {
            return res.status(401).json({ 
                message: "Invalid credentials",
                details: "Email not found"
            });
        }
        // Check if the role matches
        if (user.role !== role) {
            return res.status(401).json({
                message: "Invalid credentials",
                details: "Incorrect role for this account"
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ 
                message: "Invalid credentials",
                details: "Invalid password"
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: "Please verify your email before logging in." });
        }

        // In the login function, update the response:
        const token = jwt.sign(
            { 
                id: user._id, 
                role: user.role, 
                email: user.G_mail 
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );
        
        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                F_name: user.F_name,
                L_name: user.L_name,
                email: user.G_mail,
                role: user.role,
                Phonenumber: user.Phonenumber
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
// Forgot Password Route
const forgotPassword = async (req, res) => {
    try {
        const { G_mail } = req.body;
        const user = await Signup.findOne({ G_mail });

        if (!user) return res.status(404).json({ message: "User not found" });

        const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: G_mail,
            subject: "Password Reset Request",
            text: `Click the link to reset your password: ${resetLink}`
        });

        res.status(200).json({ message: "Password reset email sent." });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Change Password Route
const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await Signup.findById(req.user.id);

        if (!user || !await bcrypt.compare(oldPassword, user.password)) {
            return res.status(401).json({ message: "Incorrect current password" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Delete Account Route
const deleteAccount = async (req, res) => {
    try {
        // Check for any existing contracts
        const contracts = await Contract.find({ 
            $or: [
                { userId: req.user.id },
                { engineerId: req.user.id }
            ]
        });

        // If contracts exist, check their status
        if (contracts.length > 0) {
            const hasIncompleteContracts = contracts.some(contract => contract.status !== "done");
            
            if (hasIncompleteContracts) {
                return res.status(403).json({ 
                    success: false,
                    message: "Cannot delete account: You have ongoing contracts. Please complete or cancel them first." 
                });
            }
        }

        // If no contracts or all contracts are done, proceed with deletion
        await Signup.findByIdAndDelete(req.user.id);
        res.status(200).json({ 
            success: true,
            message: "Account deleted successfully" 
        });
    } catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};
// add here view profile route using auth middleware
const viewProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Get user ID from auth middleware
        const user = await Signup.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                F_name: user.F_name,
                L_name: user.L_name,
                G_mail: user.G_mail,
                Phonenumber: user.Phonenumber,
                role: user.role,
                location: user.location,
                bio: user.bio,
                skills: user.skills,
                experience: user.experience,
                portfolio: user.portfolio,
                socialLinks: user.socialLinks,
                profileImage: user.profileImage  // Add this line to include profile image
            }
        });
    } catch (error) {
        console.error("View profile error:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};
// Edit Profile Route
const editProfile = async (req, res) => {
    try {
        const {
            F_name, L_name, Phonenumber, location, bio,
            skills, experience, portfolio, socialLinks,
            profileImage
        } = req.body;
        
        const userId = req.user.id;
        const user = await Signup.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update basic info
        if (F_name) user.F_name = F_name;
        if (L_name) user.L_name = L_name;
        if (Phonenumber) user.Phonenumber = Phonenumber;
        
        // Update profile details
        if (profileImage) user.profileImage = profileImage;
        if (location) user.location = location;
        if (bio) user.bio = bio;
        
        // Update engineer-specific fields
        if (skills) user.skills = skills;
        if (experience) user.experience = experience;
        if (portfolio) user.portfolio = portfolio;
        
        // Update social links
        if (socialLinks) {
            user.socialLinks = {
                ...user.socialLinks,
                ...socialLinks
            };
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                F_name: user.F_name,
                L_name: user.L_name,
                G_mail: user.G_mail,
                Phonenumber: user.Phonenumber,
                role: user.role,
                location: user.location,
                bio: user.bio,
                skills: user.skills,
                experience: user.experience,
                portfolio: user.portfolio,
                socialLinks: user.socialLinks,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error("Edit profile error:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

// Upload profile image
const uploadProfileImage = async (req, res) => {
    try {
        // Handle file upload
        await new Promise((resolve, reject) => {
            imageUpload(req, res, (err) => {
                if (err) reject(err);
                resolve();
            });
        });

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const user = await Signup.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete old image if exists
        if (user.profileImage?.url) {
            const oldFilename = user.profileImage.url.split('/').pop();
            await fs.unlink(path.join(__dirname, '../uploads', oldFilename)).catch(() => {});
        }

        // Update user profile with new image
        user.profileImage = {
            url: `http://localhost:5000/uploads/${req.file.filename}`,
            publicId: req.file.filename,
            uploadDate: new Date()
        };
        await user.save();

        res.json({ success: true, profileImage: user.profileImage });
    } catch (error) {
        if (req.file) {
            await fs.unlink(path.join(__dirname, '../uploads', req.file.filename)).catch(() => {});
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// Delete profile image
const deleteProfileImage = async (req, res) => {
    try {
        const defaultImageUrl = "https://zultimate.com/wp-content/uploads/2019/12/default-profile.png";
        const user = await Signup.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check if user has a custom profile image (not the default one)
        if (!user.profileImage?.url || user.profileImage.url === defaultImageUrl) {
            return res.status(400).json({ 
                success: false, 
                message: 'No custom profile image to delete' 
            });
        }

        // Extract filename from URL and create file path
        const filename = user.profileImage.url.split('/').pop();
        const filepath = path.join(__dirname, '../uploads', filename);
        
        // Delete file from filesystem
        try {
            await fs.unlink(filepath);
        } catch (err) {
            console.log('File deletion error:', err);
        }
        
        // Set default profile image
        user.profileImage = {
            url: defaultImageUrl,
            publicId: 'default',
            uploadDate: new Date()
        };
        
        await user.save();

        res.json({ 
            success: true, 
            message: 'Profile image deleted and set to default',
            user: {
                id: user._id,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        console.error('Delete profile image error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting profile image',
            error: error.message 
        });
    }
};

// Update the exports
module.exports = {
    register,
    login,
    verifyEmail,
    changePassword,
    forgotPassword,
    editProfile,
    
    deleteAccount,
    uploadProfileImage,
    deleteProfileImage,
    viewProfile
};