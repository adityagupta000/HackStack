const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Access denied. No valid token provided." });
    }

    const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    req.user = user; // Attach user details to request
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired. Please log in again." });
    }
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

module.exports = adminMiddleware;
