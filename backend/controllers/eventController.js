const Event = require("../models/Event");
const { validationResult, body } = require("express-validator");
const fs = require("fs");
const path = require("path");

// ✅ Get all events with optional category filtering
exports.getEvents = async (req, res) => {
  try {
    const category = req.query.category;
    const filter = category ? { category } : {};
    const events = await Event.find(filter);
    res.status(200).json(events);
  } catch (err) {
    console.error("Error fetching events:", err.message);
    res
      .status(500)
      .json({ message: "Failed to fetch events", error: err.message });
  }
};

// ✅ Add a new event with validation
exports.addEvent = async (req, res) => {
  console.log("Received Data:", req.body);
  console.log("Received File:", req.file);

  // Run validations
  await Promise.all([
    body("title").notEmpty().withMessage("Title is required").run(req),
    body("date").notEmpty().withMessage("Date is required").run(req),
    body("time").notEmpty().withMessage("Time is required").run(req),
    body("description")
      .notEmpty()
      .withMessage("Description is required")
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
      .run(req),
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("Validation Errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  // Ensure image file is present
  if (!req.file) {
    console.error("File Upload Error: No image provided");
    return res.status(400).json({ message: "Event image is required" });
  }

  try {
    const { title, date, time, description, category, price } = req.body;

    const newEvent = new Event({
      title,
      date,
      time,
      description,
      image: `/uploads/${req.file.filename}`,
      category,
      price: parseFloat(price),
      registrationFields: JSON.parse(req.body.registrationFields || "[]"),
      ruleBook: null, // Will be uploaded separately
    });

    await newEvent.save();

    console.log("Event Saved Successfully:", newEvent);
    res
      .status(201)
      .json({ message: "Event added successfully", event: newEvent });
  } catch (err) {
    console.error("Error adding event:", err.message);
    res
      .status(500)
      .json({ message: "Failed to add event", error: err.message });
  }
};

// ✅ Upload Rule Book (PDF)
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
      return res.status(404).json({ message: "Event not found" });
    }

    // Delete old rule book if exists
    if (event.ruleBook) {
      const oldPath = path.join(__dirname, "..", event.ruleBook);
      if (fs.existsSync(oldPath)) {
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
    console.error("Error uploading rule book:", error.message);
    res
      .status(500)
      .json({ message: "Failed to upload rule book", error: error.message });
  }
};

// ✅ Get Rule Book for Download
exports.getRuleBook = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event || !event.ruleBook) {
      return res
        .status(404)
        .json({ message: "Rule book not found for this event" });
    }

    const filePath = path.join(__dirname, "..", event.ruleBook);
    res.download(filePath);
  } catch (error) {
    console.error("Error retrieving rule book:", error.message);
    res
      .status(500)
      .json({ message: "Failed to retrieve rule book", error: error.message });
  }
};
