const express = require("express");
const router = express.Router();
const { verifyToken } = require("../controllers/verificationController");
const { verificationLimiter } = require("../middleware/rateLimit");

router.get("/api/verify/:token", verificationLimiter, verifyToken);

module.exports = router;