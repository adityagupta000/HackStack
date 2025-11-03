const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { HTTP_STATUS, ERROR_MESSAGES } = require("../config/constants");
require("dotenv").config();

const verifyToken = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    if (!userId) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ message: ERROR_MESSAGES.INVALID_TOKEN });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ message: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ message: ERROR_MESSAGES.TOKEN_EXPIRED });
    }

    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ message: ERROR_MESSAGES.INVALID_TOKEN });
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(HTTP_STATUS.FORBIDDEN)
      .json({ message: ERROR_MESSAGES.FORBIDDEN });
  }
  next();
};

const requireAdmin = [verifyToken, isAdmin];

module.exports = {
  verifyToken,
  isAdmin,
  requireAdmin,
};
