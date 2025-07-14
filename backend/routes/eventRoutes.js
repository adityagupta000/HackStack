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
const upload = require("../middleware/uploadMiddleware");

// Get all events (Public Route with Category Filtering)
router.get("/", getEvents);

// Add a new event (Admin Protected Route)
router.post(
  "/",
  verifyToken,
  isAdmin,
  upload.single("image"), // Image Upload for Event Poster
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("date").notEmpty().withMessage("Date is required"),
    body("time").notEmpty().withMessage("Time is required"),
    body("description").notEmpty().withMessage("Description is required"),
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
      .withMessage("Price must be a number"),
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
  upload.single("ruleBook"), // PDF Upload
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