const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(401).json({ success: false, message: "No authorization header provided" });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication token required" });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error("Token verification error:", err.message);
                return res.status(403).json({ success: false, message: "Invalid or expired token" });
            }

            req.user = {
                id: decoded.id || decoded._id,
                role: decoded.role,
                email: decoded.email || decoded.G_mail
            };

            next();
        });
    } catch (error) {
        console.error("Authentication middleware error:", error);
        return res.status(500).json({ success: false, message: "Authentication error" });
    }
};

const checkRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ 
                success: false, 
                message: `Access denied. Only ${role}s can access this route.` 
            });
        }
        next();
    };
};

module.exports = { authenticateToken, checkRole };
