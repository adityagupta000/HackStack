const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  registerForEvent,
  getUserRegistrations,
  getEventRegistrants,
  generatePdfReceipt,
} = require("../controllers/registrationController");

router.post("/:eventId/register", verifyToken, registerForEvent);
router.get("/my-registrations", verifyToken, getUserRegistrations);
router.get("/:eventId/registrants", verifyToken, getEventRegistrants);
router.get("/:registrationId/pdf", verifyToken, generatePdfReceipt);

module.exports = router;
