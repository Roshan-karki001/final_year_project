const express = require('express');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
require("dotenv").config();
const { Signup } = require("../models/alldatabase");

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

// Register Route
const register = async (req, res) => {
    try {
        const { F_name, L_name, G_mail, Phonenumber, password, role } = req.body;

        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(G_mail)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const existingUser = await Signup.findOne({ G_mail });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const userIdPrefix = role === 'client' ? "C-" : role === 'engineer' ? "E-" : "";
        const userId = userIdPrefix ? `${userIdPrefix}${uuidv4().slice(0, 8)}` : undefined;

        // Generate a random 6-digit token
        const randomToken = Math.floor(100000 + Math.random() * 900000).toString();

        // Create a JWT for email verification with the token
        const verificationToken = jwt.sign({ G_mail, randomToken }, process.env.JWT_SECRET, { expiresIn: "1d" });

        // Create new user with all required fields
        const newUser = new Signup({
            F_name,
            L_name,
            G_mail,
            Phonenumber,
            password: hashedPassword,
            role,
            verificationToken,
            isVerified: false,
            emailVerificationCode: randomToken // Save the verification code
        });

        // Save the user to database
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
        console.error("Registration error:", error); // Add this for debugging
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Verify Email Route
const verifyEmail = async (req, res) => {
    try {
        const { verificationToken, inputCode } = req.body; // Get the input code from the frontend
        console.log("Received verification token:", verificationToken); 

        const decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
        const user = await Signup.findOne({ G_mail: decoded.G_mail });

        if (!user) return res.status(400).json({ message: "Invalid or expired token" });

        // Check if the input code matches the stored verification code
        if (user.emailVerificationCode !== inputCode) {
            return res.status(400).json({ message: "Invalid verification code" });
        }

        // Set the user as verified and remove the verification code
        user.isVerified = true;
        user.verificationToken = null;
        user.emailVerificationCode = null; // Clear the verification code
        await user.save();  // Save changes to the database

        res.status(200).json({ message: "Email verified successfully. You can now log in." });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Login Route
const login = async (req, res) => {
    try {
        const { G_mail, password, role } = req.body;
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

        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.G_mail },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: `${user.F_name} ${user.L_name}`,
                email: user.G_mail,
                role: user.role,
                client_id: user.client_id,
                engineer_id: user.engineer_id
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
        await Signup.findByIdAndDelete(req.user.id);
        res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    register,
    login,
    verifyEmail,
    forgotPassword,
    changePassword,
    deleteAccount
};
