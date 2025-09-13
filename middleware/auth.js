// middleware/auth.js
const jwt = require('jsonwebtoken');
const logger = require('../logger');

module.exports = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    // Allow guest access for specific routes
    if (req.path === '/create-order' || req.path.startsWith('/payments')) {
      req.user = null; // No user for guest
      return next();
    }
    logger.error('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    logger.info(`Authenticated user: ${decoded.id}`);
    next();
  } catch (err) {
    logger.error(`Invalid token: ${err.message}`);
    res.status(401).json({ error: 'Invalid token' });
  }
};