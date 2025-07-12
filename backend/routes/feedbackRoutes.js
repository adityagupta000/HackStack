const express = require("express");
const router = express.Router();
const { submitFeedback } = require("../controllers/feedbackController");
const authenticateToken = require("../middleware/authMiddleware");

router.post("/", authenticateToken, submitFeedback);

module.exports = router;
