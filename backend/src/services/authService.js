const jwt = require('jsonwebtoken');
const User = require('../models/User');

const TOKEN_TTL = '12h';

class AuthError extends Error {}

function getSecret() {
  // Read lazily, not at module load, so tests can set JWT_SECRET per file
  // (see auth.test.js) without needing to restart the process.
  return process.env.JWT_SECRET || 'dev-secret-change-me';
}

async function register(username, password) {
  if (!username || username.trim().length < 3) throw new AuthError('Username must be at least 3 characters');
  if (!password || password.length < 8) throw new AuthError('Password must be at least 8 characters');

  const existing = await User.findOne({ username });
  if (existing) throw new AuthError('Username already taken');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ username, passwordHash });
  return issueToken(user);
}

async function login(username, password) {
  const user = await User.findOne({ username });
  if (!user) throw new AuthError('Invalid username or password'); // deliberately vague — don't reveal which field was wrong
  const valid = await user.verifyPassword(password);
  if (!valid) throw new AuthError('Invalid username or password');
  return issueToken(user);
}

function issueToken(user) {
  const token = jwt.sign({ sub: user._id.toString(), username: user.username }, getSecret(), { expiresIn: TOKEN_TTL });
  return { token, username: user.username };
}

function verifyToken(token) {
  return jwt.verify(token, getSecret()); // throws on invalid/expired — caller handles
}

module.exports = { register, login, verifyToken, issueToken, AuthError };