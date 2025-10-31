const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const {
  loginLimiter,
  refreshTokenLimiter,
} = require("../middleware/rateLimit");
const {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
} = require("../controllers/authController");

// ==================== Register Route ====================
router.post(
  "/register",
  [
    check("name", "Name is required").notEmpty(),
    check("email", "Invalid email").isEmail(),
    check(
      "password",
      "Password must be at least 8 characters long and include an uppercase letter, a number, and a special character"
    )
      .isLength({ min: 8 })
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@$#!%*?&]{8,}$/),
  ],
  register
);

// ==================== Login Route ====================
router.post("/login", loginLimiter, login);

// ==================== Refresh Token Route ====================
router.post("/refreshToken", refreshTokenLimiter, refreshToken);

// ==================== Forgot Password Route ====================
router.post("/forgot-password", forgotPassword);

// ==================== Reset Password Route ====================
router.post(
  "/reset-password/:token",
  [
    check(
      "password",
      "Password must be at least 8 characters long and include an uppercase letter, a number, and a special character"
    )
      .isLength({ min: 8 })
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@$#!%*?&]{8,}$/),
  ],
  resetPassword
);

// ==================== Logout Route ====================
router.post("/logout", logout);

module.exports = router;
