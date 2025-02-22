const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../../.env' });  // Load shared environment variables

// Middleware to verify JWT token
exports.verifyToken = (req, res, next) => {
    const token = req.header('Authorization');  // Get token from request headers
    if (!token) return res.status(401).json({ message: 'Access Denied: No Token Provided' });

    try {
        const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);  // Verify JWT
        req.user = verified;  // Attach user data (userId, role) to request
        next();  // Proceed to the next function
    } catch (error) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

// Middleware to allow only doctors
exports.checkDoctorRole = (req, res, next) => {
    if (req.user.role !== 'doctor') {
        return res.status(403).json({ message: 'Access Denied: Doctors only' });
    }
    next();
};

// Middleware to allow only nurses
exports.checkNurseRole = (req, res, next) => {
    if (req.user.role !== 'nurse') {
        return res.status(403).json({ message: 'Access Denied: Nurses only' });
    }
    next();
};
