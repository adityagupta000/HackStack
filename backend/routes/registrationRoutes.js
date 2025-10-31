const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const { apiLimiter } = require("../middleware/rateLimit");
const {
  registerForEvent,
  getUserRegistrations,
  getEventRegistrants,
  generatePdfReceipt,
  cancelRegistration,
} = require("../controllers/registrationController");

// Register for an event
router.post("/:eventId/register", verifyToken, registerForEvent);

// Get user's registrations
router.get("/my-registrations", verifyToken, getUserRegistrations);

// Get event registrants (admin only check is in controller)
router.get("/:eventId/registrants", verifyToken, getEventRegistrants);

// Generate PDF receipt with rate limiting
router.get("/:registrationId/pdf", verifyToken, apiLimiter, generatePdfReceipt);

// FIXED: Add cancellation endpoint
router.delete("/:registrationId/cancel", verifyToken, cancelRegistration);

module.exports = router;
