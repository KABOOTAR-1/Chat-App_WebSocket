const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const generateToken = (username) => {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`Message authenticated for user: ${decoded.username}`);
    return decoded;
  } catch (error) {
    console.log('Token verification failed:', error.message);
    return null;
  }
};

module.exports = { generateToken, verifyToken };
