const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: process.env.LOGIN_LIMIT_WINDOW || 5 * 60 * 1000,
  max: process.env.LOGIN_LIMIT_MAX || 5,
  message: "Too many login attempts. Please try again laterrrrr.",
  headers: true,
  standardHeaders: true,
  legacyHeaders: false,
});

const globalLimiter = rateLimit({
  windowMs: process.env.GLOBAL_LIMIT_WINDOW || 1 * 60 * 1000,
  max: process.env.GLOBAL_LIMIT_MAX || 100,
  message: "Too many requests. Please slow down.",
  headers: true,
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: "Too many password reset attempts. Try again in 1 hour.",
  standardHeaders: true,
  legacyHeaders: false,
});

const invalidEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 4,
  message: "Too many invalid email attempts. Try again later.",
  headers: true,
});

module.exports = {
  loginLimiter,
  globalLimiter,
  forgotPasswordLimiter,
  invalidEmailLimiter,
};
