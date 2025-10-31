const Event = require("../models/Event");
const { validationResult, body } = require("express-validator");
const fs = require("fs");
const path = require("path");
const logger = require("../config/logger");
const mongoSanitize = require("express-mongo-sanitize");
const { sanitizeInput, validateLength } = require("../utils/sanitize");

// FIXED: Secure path validation
const validateFilePath = (filePath) => {
  try {
    const uploadsDir = path.resolve(__dirname, "..", "uploads");
    const absolutePath = path.resolve(__dirname, "..", filePath);

    // Ensure path is within uploads directory
    if (!absolutePath.startsWith(uploadsDir)) {
      logger.warn("Path traversal attempt detected", { filePath });
      return null;
    }

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      return null;
    }

    return absolutePath;
  } catch (error) {
    logger.error("Path validation error", {
      error: error.message,
      stack: error.stack,
      filePath,
    });
    return null;
  }
};

// Get all events with optional category filtering
exports.getEvents = async (req, res) => {
  try {
    const category = sanitizeInput(req.query.category);
    const filter = category ? { category } : {};
    const events = await Event.find(filter).sort({ createdAt: -1 }).lean();
    res.status(200).json(events);
  } catch (err) {
    logger.error("Failed to fetch events", {
      error: err.message,
      stack: err.stack,
      requestId: req.id,
    });
    res.status(500).json({ message: "Failed to fetch events" });
  }
};

exports.addEvent = async (req, res) => {
  // Run validations
  await Promise.all([
    body("title")
      .notEmpty()
      .withMessage("Title is required")
      .isLength({ min: 3, max: 200 })
      .withMessage("Title must be between 3 and 200 characters")
      .run(req),
    body("date").notEmpty().withMessage("Date is required").run(req),
    body("time").notEmpty().withMessage("Time is required").run(req),
    body("description")
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ min: 10, max: 5000 })
      .withMessage("Description must be between 10 and 5000 characters")
      .run(req),
    body("category")
      .notEmpty()
      .withMessage("Category is required")
      .isIn([
        "SOFTWARE DOMAIN EVENTS",
        "HARDWARE DOMAIN EVENTS",
        "ROBOTICS DOMAIN EVENTS",
        "IoT DOMAIN EVENTS",
        "AI/ML DOMAIN EVENTS",
        "CYBERSECURITY DOMAIN EVENTS",
      ])
      .withMessage("Invalid category")
      .run(req),
    body("price")
      .notEmpty()
      .withMessage("Price is required")
      .isNumeric()
      .withMessage("Price must be a number")
      .isFloat({ min: 0, max: 1000000 })
      .withMessage("Price must be between 0 and 1,000,000")
      .run(req),
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Event validation failed", {
      errors: errors.array(),
      requestId: req.id,
    });
    return res.status(400).json({ errors: errors.array() });
  }

  // Ensure image file is present
  if (!req.file) {
    logger.warn("Event creation failed - no image provided", {
      requestId: req.id,
    });
    return res.status(400).json({ message: "Event image is required" });
  }

  try {
    let { title, date, time, description, category, price } = req.body;

    // Sanitize inputs
    title = sanitizeInput(title);
    date = sanitizeInput(date);
    time = sanitizeInput(time);
    description = sanitizeInput(description);
    category = sanitizeInput(category);

    // FIXED: Validate and parse registration fields
    let registrationFields = [];
    try {
      registrationFields = JSON.parse(req.body.registrationFields || "[]");
      if (!Array.isArray(registrationFields)) {
        throw new Error("Registration fields must be an array");
      }
      // Sanitize each field
      registrationFields = registrationFields
        .map((field) => sanitizeInput(field))
        .filter((field) => field && field.length > 0)
        .slice(0, 20); // Limit to 20 fields max
    } catch (err) {
      return res.status(400).json({
        message: "Invalid registration fields format",
      });
    }

    const newEvent = new Event({
      title,
      date,
      time,
      description,
      image: `/uploads/${req.file.filename}`,
      category,
      price: parseFloat(price),
      registrationFields,
      ruleBook: null,
      createdBy: req.user._id, // Track who created the event
    });

    await newEvent.save();
    res
      .status(201)
      .json({ message: "Event added successfully", event: newEvent });
  } catch (err) {
    logger.error("Failed to add event", {
      error: err.message,
      stack: err.stack,
      requestId: req.id,
    });
    res.status(500).json({ message: "Failed to add event" });
  }
};

// Upload Rule Book (PDF)
exports.uploadRuleBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Rule book PDF file is required" });
    }

    const event = await Event.findById(id);
    if (!event) {
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: "Event not found" });
    }

    // FIXED: Delete old rule book with secure path validation
    if (event.ruleBook) {
      const oldPath = validateFilePath(event.ruleBook);
      if (oldPath && fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    event.ruleBook = `/uploads/${req.file.filename}`;
    await event.save();

    res.status(200).json({
      message: "Rule book uploaded successfully",
      ruleBook: event.ruleBook,
    });
  } catch (error) {
    logger.error("Failed to upload rule book", {
      error: error.message,
      stack: error.stack,
      eventId: req.params.id,
      requestId: req.id,
    });
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Failed to upload rule book" });
  }
};

// FIXED: Get Rule Book for Download with secure path validation
exports.getRuleBook = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id).lean();
    if (!event || !event.ruleBook) {
      return res
        .status(404)
        .json({ message: "Rule book not found for this event" });
    }

    // FIXED: Validate file path to prevent path traversal
    const filePath = validateFilePath(event.ruleBook);

    if (!filePath) {
      return res.status(404).json({ message: "Rule book file not found" });
    }

    // Set secure headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="rulebook_${id}.pdf"`
    );
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Stream file instead of using res.download for better control
    const fileStream = fs.createReadStream(filePath);
    fileStream.on("error", (err) => {
      logger.error("File stream error", {
        error: err.message,
        stack: err.stack,
        eventId: req.params.id,
        requestId: req.id,
      });
      if (!res.headersSent) {
        res.status(500).json({ message: "Error reading file" });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    logger.error("Failed to retrieve rule book", {
      error: error.message,
      stack: error.stack,
      eventId: req.params.id,
      requestId: req.id,
    });
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to retrieve rule book" });
    }
  }
};

module.exports = {
  getEvents: exports.getEvents,
  addEvent: exports.addEvent,
  uploadRuleBook: exports.uploadRuleBook,
  getRuleBook: exports.getRuleBook,
};
