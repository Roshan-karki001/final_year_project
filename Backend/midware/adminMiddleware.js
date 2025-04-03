const jwt = require("jsonwebtoken");
require("dotenv").config();

const checkAdmin = (req, res, next) => {
    try {
        // First verify if user is authenticated
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            return res.status(401).json({ 
                success: false, 
                message: "No authorization header provided" 
            });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: "Authentication token required" 
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error("Token verification error:", err.message);
                return res.status(403).json({ 
                    success: false, 
                    message: "Invalid or expired token" 
                });
            }

            // Check if user is admin
            if (decoded.role !== 'admin' || !decoded.isAdmin) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Access denied. Admin privileges required." 
                });
            }

            req.user = {
                id: decoded.id || decoded._id,
                role: decoded.role,
                email: decoded.email || decoded.G_mail,
                isAdmin: decoded.isAdmin,
                adminPrivileges: decoded.adminPrivileges
            };

            next();
        });
    } catch (error) {
        console.error("Admin middleware error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Authentication error" 
        });
    }
};

const checkAdminPrivilege = (privilege) => {
    return (req, res, next) => {
        if (!req.user || !req.user.isAdmin || !req.user.adminPrivileges[privilege]) {
            return res.status(403).json({ 
                success: false, 
                message: `Access denied. Required admin privilege: ${privilege}` 
            });
        }
        next();
    };
};

module.exports = { checkAdmin, checkAdminPrivilege };