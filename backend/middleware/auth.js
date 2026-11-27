const {
  AUTH_COOKIE,
  CSRF_COOKIE,
  verifyAuthToken,
  safeEqual,
} = require('../lib/auth');

function requireAdmin(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) {
    return res.status(401).json({ message: 'Login admin diperlukan' });
  }

  try {
    req.admin = verifyAuthToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Sesi admin tidak valid' });
  }
}

function requireCsrf(req, res, next) {
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get('x-csrf-token');
  if (!safeEqual(cookieToken, headerToken)) {
    return res.status(403).json({ message: 'CSRF token tidak valid' });
  }
  return next();
}

module.exports = { requireAdmin, requireCsrf };
