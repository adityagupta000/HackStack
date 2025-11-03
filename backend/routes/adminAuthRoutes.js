const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const { createAdmin, verifyAdmin } = require("../controllers/authController");
const { strictLimiter } = require("../middleware/rateLimit");

// ==================== Create Admin (PROTECTED - Only existing admins can create new admins) ====================
router.post(
  "/create-admin",
  strictLimiter, // Rate limit this sensitive operation
  verifyToken,
  isAdmin,
  [
    check("name", "Name is required").notEmpty(),
    check("email", "Invalid email").isEmail(),
    check(
      "password",
      "Password must be at least 16 characters long and include uppercase, lowercase, number, and special character"
    )
      .isLength({ min: 16 })
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@$#!%*?&]{16,}$/
      ),
  ],
  createAdmin
);

// ==================== Verify Admin Status ====================
router.get("/verify-admin", verifyToken, isAdmin, verifyAdmin);

module.exports = router;
