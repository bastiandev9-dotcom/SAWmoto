const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const AUTH_COOKIE = 'sawmoto_admin';
const CSRF_COOKIE = 'sawmoto_csrf';
const TOKEN_TTL = '8h';

function getAuthConfig() {
  const username = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const jwtSecret = process.env.JWT_SECRET;

  if (!username || !passwordHash || !jwtSecret) {
    throw new Error('ADMIN_USERNAME, ADMIN_PASSWORD_HASH, dan JWT_SECRET wajib diatur');
  }
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET minimal 32 karakter');
  }

  return { username, passwordHash, jwtSecret };
}

function createAuthToken(username) {
  const { jwtSecret } = getAuthConfig();
  return jwt.sign({ sub: username, role: 'admin' }, jwtSecret, { expiresIn: TOKEN_TTL });
}

function verifyAuthToken(token) {
  const { jwtSecret, username } = getAuthConfig();
  const payload = jwt.verify(token, jwtSecret);
  if (payload.sub !== username || payload.role !== 'admin') {
    throw new Error('Token admin tidak valid');
  }
  return payload;
}

async function verifyPassword(password, passwordHash) {
  if (typeof password !== 'string' || !password) return false;
  return bcrypt.compare(password, passwordHash);
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

function csrfCookieOptions() {
  return {
    ...cookieOptions(),
    httpOnly: false,
  };
}

function createCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

module.exports = {
  AUTH_COOKIE,
  CSRF_COOKIE,
  getAuthConfig,
  createAuthToken,
  verifyAuthToken,
  verifyPassword,
  cookieOptions,
  csrfCookieOptions,
  createCsrfToken,
  safeEqual,
};
