// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

// --- MODIFIED: Renamed to authenticateToken and adjusted function name for consistency ---
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        console.log('Access denied: No token provided'); // Keep server-side logging
        return res.status(401).json({ message: "Unauthorized: No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach the decoded user payload (id, email, role) to req.user
        next(); // Proceed to the next middleware/route handler
    } catch (error) {
        console.error('Token verification failed:', error.message); // Log for debugging
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Unauthorized: Token expired. Please log in again." });
        }
        return res.status(403).json({ message: "Unauthorized: Invalid token." }); // Changed 401 to 403 for invalid token as per JWT standards
    }
};

// --- NEW: Authorization Middleware for Admin Role ---
const authorizeAdmin = (req, res, next) => {
    // This middleware assumes authenticateToken has already run and populated req.user
    if (!req.user || req.user.role !== 'admin') {
        console.log(`Access denied: User ${req.user ? req.user.email : 'unknown'} is not an admin.`);
        return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    }
    next();
};

// --- MODIFIED: Export both middleware functions ---
module.exports = {
    authenticateToken,
    authorizeAdmin
};