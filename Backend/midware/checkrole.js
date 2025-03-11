const checkRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ 
                success: false, 
                message: "Access denied. Only clients can access this route." 
            });
        }
        next();
    };
};

module.exports = { checkRole };