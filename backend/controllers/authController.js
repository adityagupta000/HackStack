const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const {
  forgotPasswordLimiter,
  invalidEmailLimiter,
} = require("../middleware/rateLimit");
require("dotenv").config();

// Generate Access Token
const generateAccessToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || "1h",
  });

// Generate Refresh Token
const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
  });

// ==================== Register User ====================
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, password } = req.body;

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if user already exists
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ==================== Login User ====================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token in database
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken, role: user.role });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== Refresh Token ====================
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(401).json({ message: "Refresh token required" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res
        .status(403)
        .json({ message: "Invalid or expired refresh token" });
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

// ==================== Forgot Password ====================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return invalidEmailLimiter(req, res, () => {
        res.status(400).json({ message: "User not found" });
      });
    }

    return forgotPasswordLimiter(req, res, async () => {
      // Generate a secure reset token
      const resetToken = crypto.randomBytes(32).toString("hex");

      // Hash the token and store it
      user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      await user.save();

      // Reset URL
      const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

      // Configure Email Transporter
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Email Content
      const mailOptions = {
        to: user.email,
        from: process.env.EMAIL_USER,
        subject: "Password Reset Request",
        html: ` 
          <!DOCTYPE html> 
          <html> 
            <head> 
              <meta charset="utf-8"> 
              <meta name="viewport" content="width=device-width, initial-scale=1.0"> 
            </head> 
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6;"> 
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f6f6; min
  height: 400px;"> 
                <tr> 
                  <td align="center" style="padding: 40px 10px;"> 
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; 
  border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"> 
                      <tr> 
                        <td style="padding: 40px;"> 
                          <h1 style="color: #333333; font-size: 24px; margin: 0 0 20px;">Password Reset 
  Request</h1> 
                          <p style="color: #666666; font-size: 16px; margin: 0 0 20px;">You have requested to 
  reset your password. Please click the button below to set a new password. This link is valid for 3 
  minutes.</p> 
                          <table width="100%" cellpadding="0" cellspacing="0"> 
                            <tr> 
                              <td align="center" style="padding: 30px 0;"> 
                                <a href="${resetURL}"  
                                   target="_blank" 
                                   style="background-color: #007bff; 
                                          color: #ffffff; 
                                          text-decoration: none; 
                                          padding: 12px 30px; 
                                          border-radius: 4px; 
                                          font-weight: bold; 
                                          display: inline-block;"> 
                                  Reset Password 
                                </a> 
                              </td> 
                            </tr> 
                          </table> 
                          <p style="color: #666666; font-size: 16px; margin: 0 0 20px;">If you didn't request this 
  password reset, please ignore this email. Your password will remain unchanged.</p> 
                          <p style="color: #999999; font-size: 14px; margin: 40px 0 0; text-align: center;">This is 
  an automated message, please do not reply to this email.</p> 
                        </td> 
                      </tr> 
                    </table> 
                  </td> 
                </tr> 
              </table> 
            </body> 
          </html> 
        `,
      };

      await transporter.sendMail(mailOptions);

      res.json({ message: "Password reset link sent to your email" });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== Reset Password ====================
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the received token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    user.password = await bcrypt.hash(password, 12);

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== Logout ====================
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;

  const user = await User.findOneAndUpdate(
    { refreshToken },
    { refreshToken: null }
  );

  if (!user) return res.status(400).json({ message: "Invalid request" });

  res.status(200).json({ message: "Logged out successfully" });
};

// ==================== Create Admin ====================
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Admin already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = new User({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();
    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ==================== Verify Admin ====================
exports.verifyAdmin = async (req, res) => {
  res.json({ message: "Admin verified", user: req.user });
};
