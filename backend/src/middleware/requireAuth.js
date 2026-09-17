const { verifyToken } = require('../services/authService');

//  Strict auth guard: rejects the request outright with 401 if there's no
//  valid Bearer token. Used only on routes that are actually mounted behind
//  REQUIRE_AUTH (see routes/runs.js) — most of the app runs without this at
//  all, by design (Phase 0: auth was explicitly a "Could Have", off by
//  default so it never becomes a precondition for the Must-Have features).
 
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    req.username = payload.username;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = requireAuth;