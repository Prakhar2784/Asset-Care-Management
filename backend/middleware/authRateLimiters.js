/**
 * backend/middleware/authRateLimiters.js
 *
 * Endpoint-specific rate limits for authentication routes, layered on top of
 * the coarse /api/auth limiter in server.js.
 *
 * NOTE: uses express-rate-limit's in-memory store, which is correct for a
 * single-process deployment. If this app is ever scaled to multiple
 * instances, swap in a shared store (rate-limit-redis + Redis/Upstash):
 *
 *   const { RedisStore } = require('rate-limit-redis');
 *   ... rateLimit({ store: new RedisStore({ sendCommand: ... }), ... })
 */
const { rateLimit } = require('express-rate-limit');

// Login: max 10 requests per IP per minute
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts from this device. Please wait a minute and try again.' },
});

// Password reset request: max 5 per IP per 15 minutes (each one sends an email)
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password reset requests. Please wait 15 minutes and try again.' },
});

// Company/user registration: max 5 per IP per hour (abuse control)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many registration attempts. Please try again later.' },
});

module.exports = { loginLimiter, forgotLimiter, registerLimiter };
