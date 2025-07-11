const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  registerForEvent,
  getUserRegistrations,
  getEventRegistrants,
  generatePdfReceipt,
} = require("../controllers/registrationController");

router.post("/:eventId/register", authMiddleware, registerForEvent);
router.get("/my-registrations", authMiddleware, getUserRegistrations);
router.get("/:eventId/registrants", authMiddleware, getEventRegistrants);
router.get("/:registrationId/pdf", authMiddleware, generatePdfReceipt);

module.exports = router;
