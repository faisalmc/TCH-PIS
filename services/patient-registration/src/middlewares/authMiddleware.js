const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = verified; // Attach user data to request
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};

exports.checkClerkRole = (req, res, next) => {
  if (req.user.role !== 'clerk') {
    return res.status(403).json({ message: 'Access Denied: Clerks only' });
  }
  next();
};
