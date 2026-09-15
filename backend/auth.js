const jwt = require('jsonwebtoken');
require('dotenv').config();

function generateToken() {
  return jwt.sign(
    { role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const token = authHeader.split(' ')[1];

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

module.exports = { generateToken, requireAuth };