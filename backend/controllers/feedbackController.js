const Feedback = require("../models/Feedback");
const Event = require("../models/Event");
const mongoose = require("mongoose");
const { sanitizeInput, validateLength } = require("../utils/sanitize");
const logger = require("../config/logger");

exports.submitFeedback = async (req, res) => {
  try {
    let { eventId, text } = req.body;
    const userId = req.user._id;

    // Validate inputs
    if (!eventId || !text) {
      return res.status(400).json({ message: "Event ID and text required" });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    // Validate text type and length
    if (typeof text !== "string") {
      return res.status(400).json({ message: "Text must be a string" });
    }

    text = sanitizeInput(text);

    if (!validateLength(text, 5, 2000)) {
      return res.status(400).json({
        message: "Feedback must be between 5 and 2000 characters",
      });
    }

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user already submitted feedback for this event
    const existingFeedback = await Feedback.findOne({
      user: userId,
      event: eventId,
    });

    if (existingFeedback) {
      return res.status(400).json({
        message: "You have already submitted feedback for this event",
      });
    }

    const feedback = new Feedback({
      user: userId,
      event: eventId,
      text: text.trim(),
    });

    await feedback.save();

    logger.info("Feedback submitted", {
      userId,
      eventId,
      feedbackId: feedback._id,
      requestId: req.id,
    });

    res.status(201).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    logger.error("Feedback submission error", {
      error: error.message,
      stack: error.stack,
      requestId: req.id,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = exports;
