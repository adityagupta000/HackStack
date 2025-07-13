const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const { loginLimiter } = require("../middleware/rateLimit");
const { logout } = require("../controllers/authController");
const {
  forgotPasswordLimiter,
  invalidEmailLimiter,
} = require("../middleware/rateLimit");
const {
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

router.post(
  "/register",
  [
    check("name", "Name is required").notEmpty(),
    check("email", "Invalid email").isEmail(),
    check(
      "password",
      "Password must be at least 8 characters long and include an uppercase letter, a number, and a special character."
    )
      .isLength({ min: 8 })
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name, email, password } = req.body;
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: "User already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({
        name,
        email,
        password: hashedPassword,
      });
      await user.save();

      res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      console.error("Registration error:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

//    Login Route with Role in Response
router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide both email and password" });
    }

    let user = await User.findOne({ email }).select("+password +refreshToken");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    await user.save();

    // ✅ Set HTTP-only cookie
    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        path: "/api/auth/refreshToken", // Important
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ accessToken, role: user.role });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

//    Forgot Password Route (Add validation)
router.post(
  "/forgot-password",
  invalidEmailLimiter, // Apply invalid email limiter first
  forgotPasswordLimiter, // Apply successful reset limiter
  forgotPassword
);

router.post(
  "/reset-password/:token",
  [
    check(
      "password",
      "Password must be at least 8 characters long and include an uppercase letter, a number, and a special character."
    )
      .isLength({ min: 8 })
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
  ],
  resetPassword
);

// Refresh Token Route
router.post("/refreshToken", async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const userId = decoded.user?.id || decoded.id;

    const user = await User.findById(userId).select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign(
      { user: { id: user.id, role: user.role } },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ accessToken, role: user.role });
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
  }
});

router.post("/logout", logout);

module.exports = router;
