const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "No token provided. Authorization denied." });
    }

    const token = authHeader.split(" ")[1]; 

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id);

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found. Please log in again." });
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
module.exports = authMiddleware;