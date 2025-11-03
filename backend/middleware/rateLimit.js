const rateLimit = require("express-rate-limit");

// FIXED: Typo and improved limits
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_LIMIT_WINDOW) || 5 * 60 * 1000, // 5 minutes
  max: parseInt(process.env.LOGIN_LIMIT_MAX) || 5,
  message: "Too many login attempts. Please try again later.", // FIXED: Removed typo
  skipSuccessfulRequests: true, // Don't count successful logins
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many login attempts. Please try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000 - Date.now() / 1000),
    });
  },
});

const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.GLOBAL_LIMIT_WINDOW) || 1 * 60 * 1000,
  max: parseInt(process.env.GLOBAL_LIMIT_MAX) || 100,
  message: "Too many requests. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === "/health";
  },

  keyGenerator: (req) => {
    return req.ip || req.headers["x-forwarded-for"] || "unknown";
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: "Too many password reset attempts. Try again in 1 hour.",
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true, // Only count successful requests
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many password reset attempts. Try again in 1 hour.",
      retryAfter: 3600,
    });
  },
});

const invalidEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // FIXED: Increased from 4 to 10
  message: "Too many invalid email attempts. Try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many invalid email attempts. Try again later.",
      retryAfter: 3600,
    });
  },
});

// NEW: API-specific rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: "Too many API requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // For sensitive operations
  message: "Too many requests for this operation. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: "Too many verification attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, 
});

const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 refresh attempts per 15 minutes
  message: "Too many token refresh attempts. Please login again.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const fileUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 file uploads per hour
  message: "Too many file uploads. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
});

module.exports = {
  loginLimiter,
  globalLimiter,
  forgotPasswordLimiter,
  invalidEmailLimiter,
  apiLimiter,
  strictLimiter,
  verificationLimiter,
  refreshTokenLimiter,
  fileUploadLimiter,
};
