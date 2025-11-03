const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const {
  getEvents,
  addEvent,
  uploadRuleBook,
  getRuleBook,
} = require("../controllers/eventController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const {
  imageUpload,
  pdfUpload,
  handleUploadError,
  magicNumberValidator, // FIXED: Import magic number validator
} = require("../middleware/uploadMiddleware");
const { fileUploadLimiter } = require("../middleware/rateLimit");


// Get all events (Public Route with Category Filtering)
router.get("/", getEvents);

// Add a new event (Admin Protected Route)
router.post(
  "/",
  verifyToken,
  isAdmin,
  fileUploadLimiter,
  imageUpload.single("image"),
  magicNumberValidator, // FIXED: Add magic number validation
  handleUploadError,
  [
    body("title")
      .notEmpty()
      .withMessage("Title is required")
      .isLength({ min: 3, max: 200 })
      .withMessage("Title must be between 3 and 200 characters"),
    body("date").notEmpty().withMessage("Date is required"),
    body("time").notEmpty().withMessage("Time is required"),
    body("description")
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ min: 10, max: 5000 })
      .withMessage("Description must be between 10 and 5000 characters"),
    body("category")
      .isIn([
        "SOFTWARE DOMAIN EVENTS",
        "HARDWARE DOMAIN EVENTS",
        "ROBOTICS DOMAIN EVENTS",
        "IoT DOMAIN EVENTS",
        "AI/ML DOMAIN EVENTS",
        "CYBERSECURITY DOMAIN EVENTS",
      ])
      .withMessage("Invalid category"),
    body("price")
      .notEmpty()
      .withMessage("Price is required")
      .isNumeric()
      .withMessage("Price must be a number")
      .isFloat({ min: 0, max: 1000000 })
      .withMessage("Price must be between 0 and 1,000,000"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    addEvent(req, res);
  }
);

// Upload Rule Book (Admin Protected Route)
router.post(
  "/:id/upload-rulebook",
  verifyToken,
  isAdmin,
  pdfUpload.single("ruleBook"),
  magicNumberValidator, // FIXED: Add magic number validation
  handleUploadError,
  async (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Rule book PDF file is required" });
    }
    uploadRuleBook(req, res);
  }
);

// Get Rule Book (Public Route)
router.get("/:id/rulebook", getRuleBook);

module.exports = router;
