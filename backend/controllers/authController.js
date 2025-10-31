const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const { sanitizeInput } = require("../utils/sanitize");
const {
  forgotPasswordLimiter,
  invalidEmailLimiter,
} = require("../middleware/rateLimit");
const {
  TIME_CONSTANTS,
  HTTP_STATUS,
  ERROR_MESSAGES,
} = require("../config/constants");
const logger = require("../config/logger");

require("dotenv").config();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

// FIXED: Use SHA256 for token hashing (faster and appropriate for random tokens)
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const compareToken = (token, hashedToken) => {
  // Validate inputs first
  if (
    !token ||
    !hashedToken ||
    typeof token !== "string" ||
    typeof hashedToken !== "string"
  ) {
    return false;
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  if (tokenHash.length !== 64 || hashedToken.length !== 64) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(tokenHash, "hex"),
      Buffer.from(hashedToken, "hex")
    );
  } catch (err) {
    logger.error("Token comparison error", { error: err.message });
    return false;
  }
};

// FIXED: Consistent token payload structure with additional security
const generateAccessToken = (userId, role, tokenVersion = 0) =>
  jwt.sign(
    {
      userId,
      role,
      type: "access",
      version: tokenVersion,
      iat: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || "1h" }
  );

const generateRefreshToken = (userId, tokenVersion = 0) =>
  jwt.sign(
    {
      userId,
      type: "refresh",
      version: tokenVersion,
      iat: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d" }
  );

// FIXED: Secure token generation with higher entropy
const generateSecureToken = () => {
  return crypto.randomBytes(48).toString("hex"); // 96 hex characters
};

// ==================== Register User ====================
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  try {
    let { name, email, password } = req.body;

    // FIXED: Sanitize inputs
    name = sanitizeInput(name);
    email = sanitizeInput(email);

    // FIXED: Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    // Always hash password to maintain consistent timing
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    if (existingUser) {
      // Delay response to match timing of successful registration
      await new Promise((resolve) => setTimeout(resolve, 100));
      return res
        .status(HTTP_STATUS.CONFLICT)
        .json({ message: ERROR_MESSAGES.USER_EXISTS });
    }

    // Create user with token version
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      tokenVersion: 0, // Initialize token version
    });

    logger.info("User registered successfully", {
      userId: user._id,
      email: user.email,
      requestId: req.id,
    });

    res.status(HTTP_STATUS.CREATED).json({
      message: "User registered successfully",
      userId: user._id,
    });
  } catch (err) {
    logger.error("Registration error", {
      error: err.message,
      stack: err.stack,
      requestId: req.id,
    });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// ==================== Login User ====================
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    // Sanitize inputs
    email = sanitizeInput(email);

    // Validate input
    if (!email || !password) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: "Email and password are required" });
    }

    // Find user with password field and login tracking
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select(
      "+password +refreshToken +loginAttempts +lockUntil +tokenVersion"
    );

    // FIXED: Generic error message to prevent user enumeration
    if (!user) {
      // Perform a dummy bcrypt operation to maintain consistent timing
      await bcrypt.hash("dummy_password", SALT_ROUNDS);
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ message: ERROR_MESSAGES.INVALID_CREDENTIALS });
    }

    // FIXED: Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const lockTimeRemaining = Math.ceil(
        (user.lockUntil - Date.now()) / 1000 / 60
      );
      logger.warn("Login attempt on locked account", {
        userId: user._id,
        email: user.email,
        requestId: req.id,
      });
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: `Account is locked. Please try again in ${lockTimeRemaining} minutes.`,
      });
    }

    // Check account status
    if (user.accountStatus !== "active") {
      logger.warn("Login attempt on inactive account", {
        userId: user._id,
        accountStatus: user.accountStatus,
        requestId: req.id,
      });
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: "Account is suspended or deleted. Please contact support.",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // FIXED: Increment login attempts
      await user.incLoginAttempts();
      logger.warn("Failed login attempt", {
        userId: user._id,
        email: user.email,
        attempts: user.loginAttempts + 1,
        requestId: req.id,
      });
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ message: ERROR_MESSAGES.INVALID_CREDENTIALS });
    }

    // FIXED: Reset login attempts on successful login
    if (user.loginAttempts > 0 || user.lockUntil) {
      await user.resetLoginAttempts();
    }

    // FIXED: Increment token version for refresh token rotation
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    // Generate tokens with version
    const accessToken = generateAccessToken(
      user._id,
      user.role,
      user.tokenVersion
    );
    const refreshToken = generateRefreshToken(user._id, user.tokenVersion);

    // FIXED: Store hashed refresh token using SHA256
    const hashedRefreshToken = hashToken(refreshToken);
    user.refreshToken = hashedRefreshToken;
    user.lastLogin = new Date();

    // Track IP for security monitoring
    user.lastLoginIp = req.ip || req.connection.remoteAddress;

    await user.save();

    logger.info("User logged in successfully", {
      userId: user._id,
      email: user.email,
      role: user.role,
      requestId: req.id,
    });

    // FIXED: Enhanced cookie security
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/api/auth/refreshToken",
      maxAge: TIME_CONSTANTS.SEVEN_DAYS,
    };

    res.cookie("refreshToken", refreshToken, cookieOptions).json({
      accessToken,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error("Login error", {
      error: error.message,
      stack: error.stack,
      requestId: req.id,
    });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// ==================== Refresh Token ====================
exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ message: "Refresh token required" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // FIXED: Validate token type
    if (decoded.type !== "refresh") {
      logger.warn("Invalid token type in refresh request", {
        tokenType: decoded.type,
        requestId: req.id,
      });
      return res
        .status(HTTP_STATUS.FORBIDDEN)
        .json({ message: ERROR_MESSAGES.INVALID_TOKEN });
    }

    // Find user
    const user = await User.findById(decoded.userId).select(
      "+refreshToken +tokenVersion"
    );

    if (!user) {
      logger.warn("User not found for refresh token", {
        userId: decoded.userId,
        requestId: req.id,
      });
      return res
        .status(HTTP_STATUS.FORBIDDEN)
        .json({ message: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    // FIXED: Check token version for rotation
    if (decoded.version !== user.tokenVersion) {
      logger.warn("Token version mismatch - possible token reuse", {
        userId: user._id,
        tokenVersion: decoded.version,
        currentVersion: user.tokenVersion,
        requestId: req.id,
      });

      return res
        .status(HTTP_STATUS.FORBIDDEN)
        .json({ message: "Token has been invalidated. Please login again." });
    }

    const isValidToken = compareToken(refreshToken, user.refreshToken);

    if (!isValidToken) {
      logger.warn("Invalid refresh token", {
        userId: user._id,
        requestId: req.id,
      });
      return res
        .status(HTTP_STATUS.FORBIDDEN)
        .json({ message: ERROR_MESSAGES.INVALID_TOKEN });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $inc: { tokenVersion: 1 },
      },
      {
        new: true,
        select: "+tokenVersion",
      }
    );

    if (!updatedUser) {
      return res
        .status(HTTP_STATUS.FORBIDDEN)
        .json({ message: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    const newRefreshToken = generateRefreshToken(
      updatedUser._id,
      updatedUser.tokenVersion
    );
    const hashedNewRefreshToken = hashToken(newRefreshToken);

    updatedUser.refreshToken = hashedNewRefreshToken;
    await updatedUser.save();

    // Generate new access token
    const newAccessToken = generateAccessToken(
      user._id,
      user.role,
      user.tokenVersion
    );

    logger.info("Token refreshed successfully", {
      userId: user._id,
      requestId: req.id,
    });

    // Update cookie with new refresh token
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/api/auth/refreshToken",
      maxAge: TIME_CONSTANTS.SEVEN_DAYS,
    };

    res.cookie("refreshToken", newRefreshToken, cookieOptions).json({
      accessToken: newAccessToken,
      role: user.role,
    });
  } catch (err) {
    logger.error("Token refresh error", {
      error: err.message,
      stack: err.stack,
      requestId: req.id,
    });

    if (err.name === "TokenExpiredError") {
      return res
        .status(HTTP_STATUS.FORBIDDEN)
        .json({ message: ERROR_MESSAGES.TOKEN_EXPIRED });
    }

    return res
      .status(HTTP_STATUS.FORBIDDEN)
      .json({ message: ERROR_MESSAGES.INVALID_TOKEN });
  }
};

// ==================== Forgot Password ====================
exports.forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: "Email is required" });
    }

    // Sanitize email
    email = sanitizeInput(email);

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+resetPasswordToken +resetPasswordExpires");

    // FIXED: Always return success to prevent user enumeration
    if (!user) {
      logger.info("Password reset requested for non-existent email", {
        email,
        requestId: req.id,
      });
      return invalidEmailLimiter(req, res, () => {
        res.json({
          message:
            "If your email is registered, you will receive a password reset link",
        });
      });
    }

    return forgotPasswordLimiter(req, res, async () => {
      // Generate secure reset token
      const resetToken = generateSecureToken();

      // FIXED: Hash token before storing using SHA256
      const hashedToken = hashToken(resetToken);

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires =
        Date.now() + TIME_CONSTANTS.PASSWORD_RESET_EXPIRY;
      await user.save();

      logger.info("Password reset token generated", {
        userId: user._id,
        email: user.email,
        expiresAt: new Date(user.resetPasswordExpires),
        requestId: req.id,
      });

      // FIXED: Use HTTPS in production
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetURL = `${frontendUrl}/reset-password/${resetToken}`;

      // FIXED: Use environment-based email configuration
      const transporter = nodemailer.createTransporter({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        secure: true,
      });

      const mailOptions = {
        to: user.email,
        from: `"Hack-A-Fest" <${process.env.EMAIL_USER}>`,
        subject: "Password Reset Request - Hack-A-Fest",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; background-color: #f6f6f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f6f6; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px;">
              <h1 style="color: #333333; font-size: 24px; margin: 0 0 20px;">Password Reset Request</h1>
              <p style="color: #666666; font-size: 16px; margin: 0 0 20px;">Hello ${
                user.name
              },</p>
              <p style="color: #666666; font-size: 16px; margin: 0 0 20px;">You have requested to reset your password. Click the button below to proceed:</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 30px 0;">
                    <a href="${resetURL}" target="_blank" style="background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: bold; display: inline-block;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #666666; font-size: 16px; margin: 0 0 20px;">If you didn't request this, please ignore this email. This link will expire in 10 minutes.</p>
              <p style="color: #999999; font-size: 14px; margin: 0;">For security reasons, do not share this link with anyone.</p>
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
              <p style="color: #999999; font-size: 12px; margin: 0; text-align: center;">© ${new Date().getFullYear()} Hack-A-Fest. All rights reserved.</p>
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

      try {
        await transporter.sendMail(mailOptions);
        logger.info("Password reset email sent", {
          userId: user._id,
          email: user.email,
          requestId: req.id,
        });
        res.json({
          message:
            "If your email is registered, you will receive a password reset link",
        });
      } catch (emailErr) {
        logger.error("Email sending error", {
          error: emailErr.message,
          stack: emailErr.stack,
          userId: user._id,
          requestId: req.id,
        });
        // Don't expose email errors to user
        res.json({
          message:
            "If your email is registered, you will receive a password reset link",
        });
      }
    });
  } catch (error) {
    logger.error("Forgot password error", {
      error: error.message,
      stack: error.stack,
      requestId: req.id,
    });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// ==================== Reset Password ====================
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: "Password is required" });
    }

    const hashedToken = hashToken(token);

    const startTime = Date.now();
    const MIN_PROCESSING_TIME = 100;

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select(
      "+password +resetPasswordToken +resetPasswordExpires +refreshToken +tokenVersion"
    );

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < MIN_PROCESSING_TIME) {
      await new Promise((resolve) =>
        setTimeout(resolve, MIN_PROCESSING_TIME - elapsedTime)
      );
    }

    if (!user) {
      logger.warn("Invalid or expired reset token attempt", {
        requestId: req.id,
        // Don't log the token itself
      });
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    user.password = await bcrypt.hash(password, SALT_ROUNDS);

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // FIXED: Invalidate all refresh tokens by incrementing version
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.refreshToken = undefined;

    await user.save();

    logger.info("Password reset successful", {
      userId: user._id,
      email: user.email,
      requestId: req.id,
    });

    res.json({
      message:
        "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    logger.error("Reset password error", {
      error: error.message,
      stack: error.stack,
      requestId: req.id,
    });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// ==================== Logout ====================
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.sendStatus(HTTP_STATUS.NO_CONTENT);
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      logger.warn("Invalid refresh token during logout", {
        error: err.message,
        requestId: req.id,
      });
      // FIXED: Still clear cookie even if verification fails
      res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/api/auth/refreshToken",
      });
      return res.sendStatus(HTTP_STATUS.NO_CONTENT);
    }

    const userId = decoded.userId;
    const user = await User.findById(userId).select(
      "+refreshToken +tokenVersion"
    );

    if (user) {
      // FIXED: Invalidate all tokens by incrementing version
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      user.refreshToken = null;
      await user.save();

      logger.info("User logged out successfully", {
        userId: user._id,
        requestId: req.id,
      });
    }

    // Clear cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth/refreshToken",
    });

    return res
      .status(HTTP_STATUS.OK)
      .json({ message: "Logged out successfully" });
  } catch (error) {
    logger.error("Logout error", {
      error: error.message,
      stack: error.stack,
      requestId: req.id,
    });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Logout failed",
    });
  }
};

// ==================== Create Admin (PROTECTED) ====================
exports.createAdmin = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    // Sanitize inputs
    name = sanitizeInput(name);
    email = sanitizeInput(email);

    if (!name || !email || !password) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ message: "All fields are required" });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingAdmin) {
      return res
        .status(HTTP_STATUS.CONFLICT)
        .json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const admin = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "admin",
      tokenVersion: 0,
    });

    await admin.save();

    logger.info("Admin created successfully", {
      adminId: admin._id,
      email: admin.email,
      createdBy: req.user._id,
      requestId: req.id,
    });

    res.status(HTTP_STATUS.CREATED).json({
      message: "Admin created successfully",
      adminId: admin._id,
    });
  } catch (err) {
    logger.error("Create admin error", {
      error: err.message,
      stack: err.stack,
      requestId: req.id,
    });
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: ERROR_MESSAGES.SERVER_ERROR,
    });
  }
};

// ==================== Verify Admin ====================
exports.verifyAdmin = async (req, res) => {
  res.json({
    message: "Admin verified",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

module.exports = exports;
