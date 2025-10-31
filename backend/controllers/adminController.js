const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const Feedback = require("../models/Feedback");
const logger = require("../config/logger");
const mongoose = require("mongoose");
const { sanitizeInput, escapeRegex } = require("../utils/sanitize");
const { parseRegistrationFields } = require("../utils/jsonParser");

const getPaginationParams = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

// ================== 📊 Admin Dashboard ==================
exports.getAdminStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const eventCount = await Event.countDocuments();
    const registrationCount = await Registration.countDocuments();
    const feedbackCount = await Feedback.countDocuments();

    res.json({ userCount, eventCount, registrationCount, feedbackCount });
  } catch (err) {
    logger.error("Failed to fetch admin stats", {
      error: err.message,
      stack: err.stack,
      requestId: req.id,
    });
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

exports.getDashboardSummary = async (req, res) => {
  try {
    // Run all queries in parallel
    const [
      userCount,
      eventCount,
      registrationCount,
      feedbackCount,
      latestUsers,
      latestRegistrations,
      latestFeedback,
      domainBreakdownArray,
      eventRegistrationStats,
    ] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Registration.countDocuments(),
      Feedback.countDocuments(),
      User.find({ role: "user" })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email createdAt")
        .lean(),
      Registration.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "name email")
        .populate("event", "title")
        .lean(),
      Feedback.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "name")
        .populate("event", "title")
        .lean(),
      Event.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ]),
      Registration.aggregate([
        {
          $group: {
            _id: "$event",
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "events",
            localField: "_id",
            foreignField: "_id",
            as: "event",
          },
        },
        { $unwind: "$event" },
        {
          $project: {
            title: "$event.title",
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    // n Domain-wise Event Count (for Pie Chart)
    const domainBreakdown = {};
    domainBreakdownArray.forEach((item) => {
      domainBreakdown[item._id] = item.count;
    });

    res.json({
      userCount,
      eventCount,
      registrationCount,
      feedbackCount,
      domainBreakdown,
      eventRegistrationStats,
      latestUsers,
      latestRegistrations,
      latestFeedback,
    });
  } catch (err) {
    logger.error("Failed to fetch dashboard summary", {
      error: err.message,
      stack: err.stack,
      requestId: req.id,
    });
    res.status(500).json({
      message: "Failed to fetch dashboard summary",
    });
  }
};

// ================== 👥 User Management ==================
exports.getAllUsers = async (req, res) => {
  try {
    let search = req.query.search || "";

    // Stricter length limit
    if (search.length > 50) {
      return res
        .status(400)
        .json({ message: "Search query too long (max 50 characters)" });
    }

    // More comprehensive dangerous pattern detection
    const dangerousPatterns =
      /(\.\*){2,}|(\+\*)|(\*\+)|(\{\d{3,}\})|(\[.*\].*\[.*\])|(\(.*\|.*\|.*\))/;
    if (dangerousPatterns.test(search)) {
      logger.warn("Dangerous regex pattern detected", {
        pattern: search,
        requestId: req.id,
      });
      return res.status(400).json({ message: "Invalid search pattern" });
    }

    search = escapeRegex(sanitizeInput(search));

    if (search.split("\\").length > 10) {
      return res.status(400).json({ message: "Search pattern too complex" });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    })
      .select("-password -refreshToken")
      .limit(100)
      .maxTimeMS(3000)
      .lean();

    res.json(users);
  } catch (err) {
    if (err.name === "ExceededTimeLimit") {
      logger.warn("Query timeout", {
        search: req.query.search,
        requestId: req.id,
      });
      return res.status(400).json({
        message: "Search query too complex or taking too long",
      });
    }

    logger.error("Failed to fetch users", {
      error: err.message,
      stack: err.stack,
      requestId: req.id,
    });
    res.status(500).json({ message: "Server error" });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    logger.error("Failed to change user role", {
      error: err.message,
      stack: err.stack,
      userId: req.params.id,
      requestId: req.id,
    });
    res.status(500).json({ message: "Failed to change role" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted" });
  } catch (err) {
    logger.error("Failed to delete user", {
      error: err.message,
      stack: err.stack,
      userId: req.params.id,
      requestId: req.id,
    });
    res.status(500).json({ message: "Deletion failed" });
  }
};

// ================== 🎯 Event Management ==================
exports.getAllEvents = async (req, res) => {
  try {
    let query = req.query.search || "";

    // Stricter length limit
    if (query.length > 50) {
      return res
        .status(400)
        .json({ message: "Search query too long (max 50 characters)" });
    }

    // More comprehensive dangerous pattern detection
    const dangerousPatterns =
      /(\.\*){2,}|(\+\*)|(\*\+)|(\{\d{3,}\})|(\[.*\].*\[.*\])|(\(.*\|.*\|.*\))/;
    if (dangerousPatterns.test(query)) {
      logger.warn("Dangerous regex pattern detected", {
        pattern: query,
        requestId: req.id,
      });
      return res.status(400).json({ message: "Invalid search pattern" });
    }

    query = escapeRegex(sanitizeInput(query));

    // Additional check: limit regex complexity
    if (query.split("\\").length > 10) {
      return res.status(400).json({ message: "Search pattern too complex" });
    }

    const events = await Event.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .maxTimeMS(3000)
      .lean();

    res.json(events);
  } catch (err) {
    if (err.name === "ExceededTimeLimit") {
      logger.warn("Query timeout", {
        search: req.query.search,
        requestId: req.id,
      });
      return res.status(400).json({
        message: "Search query too complex or taking too long",
      });
    }

    logger.error("Failed to fetch events", {
      error: err.message,
      stack: err.stack,
      requestId: req.id,
    });
    res.status(500).json({ message: "Failed to fetch events" });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      date,
      time,
      description,
      category,
      price,
      registrationFields,
    } = req.body;

    const event = new Event({
      title,
      date,
      time,
      description,
      category,
      price: parseFloat(price),
      registrationFields: JSON.parse(registrationFields || "[]"),
      image: req.files?.image?.[0]
        ? `/uploads/${req.files.image[0].filename}`
        : null,
      ruleBook: req.files?.ruleBook?.[0]
        ? `/uploads/${req.files.ruleBook[0].filename}`
        : null,
    });

    await event.save();
    res.status(201).json(event);
  } catch (err) {
    logger.error("Event creation failed", {
      error: err.message,
      stack: err.stack,
      requestId: req.id,
    });
    res.status(400).json({ message: "Event creation failed" });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const {
      title,
      date,
      time,
      description,
      category,
      price,
      registrationFields,
      existingImage,
      existingRuleBook,
    } = req.body;

    const parsedFields = parseRegistrationFields(registrationFields || "[]");

    if (parsedFields === null) {
      return res.status(400).json({
        message: "Invalid registration fields format",
      });
    }

    // Validate price
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0 || parsedPrice > 1000000) {
      return res.status(400).json({
        message: "Invalid price value",
      });
    }

    const updateData = {
      title: sanitizeInput(title),
      date: sanitizeInput(date),
      time: sanitizeInput(time),
      description: sanitizeInput(description),
      category: sanitizeInput(category),
      price: parsedPrice,
      registrationFields: parsedFields,
    };

    // Handle image
    if (req.files?.image?.[0]) {
      updateData.image = `/uploads/${req.files.image[0].filename}`;
      if (existingImage) {
        const oldPath = path.join("uploads", path.basename(existingImage));
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (err) {
            logger.warn("Failed to delete old image", { error: err.message });
          }
        }
      }
    } else if (existingImage) {
      updateData.image = existingImage;
    }

    // Handle RuleBook
    if (req.files?.ruleBook?.[0]) {
      updateData.ruleBook = `/uploads/${req.files.ruleBook[0].filename}`;
      if (existingRuleBook) {
        const oldPath = path.join("uploads", path.basename(existingRuleBook));
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (err) {
            logger.warn("Failed to delete old rulebook", {
              error: err.message,
            });
          }
        }
      }
    } else if (existingRuleBook) {
      updateData.ruleBook = existingRuleBook;
    }

    const updatedEvent = await Event.findByIdAndUpdate(eventId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res
      .status(200)
      .json({ message: "Event updated successfully", event: updatedEvent });
  } catch (err) {
    logger.error("Event update failed", {
      error: err.message,
      stack: err.stack,
      eventId: req.params.id,
      requestId: req.id,
    });
    res.status(500).json({ message: "Server error during event update" });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Event not found" });

    res.json({ message: "Event deleted" });
  } catch (err) {
    logger.error("Failed to delete event", {
      error: err.message,
      stack: err.stack,
      eventId: req.params.id,
      requestId: req.id,
    });
    res.status(500).json({ message: "Deletion failed" });
  }
};

// ================== 📝 Registrations & Feedback ==================
exports.getAllRegistrations = async (req, res) => {
  try {
    const search = req.query.search || "";
    const { page, limit, skip } = getPaginationParams(req);

    // Build query
    let query = {};

    if (search) {
      // Search by registration ID if it looks like an ObjectId
      if (mongoose.Types.ObjectId.isValid(search)) {
        query._id = search;
      }
    }

    // Get total count
    const total = await Registration.countDocuments(query);

    // Find registrations with pagination
    const registrations = await Registration.find(query)
      .populate("user", "name email")
      .populate("event", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // If search is present, filter manually on populated fields
    let filtered = registrations;
    if (search && !mongoose.Types.ObjectId.isValid(search)) {
      filtered = registrations.filter((r) => {
        const userMatch =
          r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          r.user?.email?.toLowerCase().includes(search.toLowerCase());
        const eventMatch = r.event?.title
          ?.toLowerCase()
          .includes(search.toLowerCase());
        return userMatch || eventMatch;
      });
    }

    res.json({
      data: filtered,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error("Failed to fetch registrations", {
      error: err.message,
      stack: err.stack,
      requestId: req.id,
    });
    res.status(500).json({ message: "Failed to fetch registrations" });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    let query = req.query.search || "";

    if (query.length > 100) {
      return res.status(400).json({ message: "Search query too long" });
    }

    query = escapeRegex(sanitizeInput(query));

    const feedback = await Feedback.find({
      $or: [{ text: { $regex: query, $options: "i" } }],
    })
      .populate("user", "name email")
      .populate("event", "title")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(feedback);
  } catch (err) {
    logger.error("Failed to fetch feedback", {
      error: err.message,
      stack: err.stack,
      requestId: req.id,
    });
    res.status(500).json({ message: "Failed to fetch feedback" });
  }
};
