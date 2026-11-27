const express = require('express');
const router = express.Router();
const { authLimiter } = require('../middleware/rateLimit');
const { requireAdmin, requireCsrf } = require('../middleware/auth');
const {
  AUTH_COOKIE,
  CSRF_COOKIE,
  getAuthConfig,
  createAuthToken,
  verifyPassword,
  cookieOptions,
  csrfCookieOptions,
  createCsrfToken,
} = require('../lib/auth');

router.post('/login', authLimiter, async (req, res) => {
  try {
    const config = getAuthConfig();
    const username = req.body?.username;
    const password = req.body?.password;
    const validPassword = await verifyPassword(password, config.passwordHash);

    if (username !== config.username || !validPassword) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const token = createAuthToken(config.username);
    const csrfToken = createCsrfToken();
    res.cookie(AUTH_COOKIE, token, {
      ...cookieOptions(),
      maxAge: 8 * 60 * 60 * 1000,
    });
    res.cookie(CSRF_COOKIE, csrfToken, {
      ...csrfCookieOptions(),
      maxAge: 8 * 60 * 60 * 1000,
    });
    return res.json({ username: config.username, role: 'admin', csrfToken });
  } catch (error) {
    console.error('Login admin gagal:', error.message);
    return res.status(500).json({ message: 'Autentikasi belum dikonfigurasi' });
  }
});

router.get('/me', requireAdmin, (req, res) => {
  let csrfToken = req.cookies[CSRF_COOKIE];
  if (!csrfToken) {
    csrfToken = createCsrfToken();
    res.cookie(CSRF_COOKIE, csrfToken, {
      ...csrfCookieOptions(),
      maxAge: 8 * 60 * 60 * 1000,
    });
  }
  return res.json({ username: req.admin.sub, role: req.admin.role, csrfToken });
});

router.post('/logout', requireAdmin, requireCsrf, (req, res) => {
  res.clearCookie(AUTH_COOKIE, cookieOptions());
  res.clearCookie(CSRF_COOKIE, csrfCookieOptions());
  return res.json({ message: 'Logout berhasil' });
});

module.exports = router;
