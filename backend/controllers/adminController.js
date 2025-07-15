const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const Feedback = require("../models/Feedback");

// ================== 📊 Admin Dashboard ==================
exports.getAdminStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const eventCount = await Event.countDocuments();
    const registrationCount = await Registration.countDocuments();
    const feedbackCount = await Feedback.countDocuments();

    res.json({ userCount, eventCount, registrationCount, feedbackCount });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch stats", error: err.message });
  }
};

exports.getDashboardSummary = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const eventCount = await Event.countDocuments();
    const registrationCount = await Registration.countDocuments();
    const feedbackCount = await Feedback.countDocuments();

    // 👤 Latest Users
    const latestUsers = await User.find({ role: "user" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email createdAt");

    // 📝 Latest Registrations
    const latestRegistrations = await Registration.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email")
      .populate("event", "title");

    // 💬 Latest Feedback
    const latestFeedback = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name")
      .populate("event", "title");

    // 📊 Domain-wise Event Count (for Pie Chart)
    const domainBreakdownArray = await Event.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    const domainBreakdown = {};
    domainBreakdownArray.forEach((item) => {
      domainBreakdown[item._id] = item.count;
    });

    // 📈 Event-wise Registration Count (for Bar Chart)
    const eventRegistrationStats = await Registration.aggregate([
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
    ]);

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
    res.status(500).json({
      message: "Failed to fetch dashboard summary",
      error: err.message,
    });
  }
};

// ================== 👥 User Management ==================
exports.getAllUsers = async (req, res) => {
  try {
    const search = req.query.search || "";
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("-password -refreshToken");

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
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
    res
      .status(500)
      .json({ message: "Failed to change role", error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Deletion failed", error: err.message });
  }
};

// ================== 🎯 Event Management ==================
exports.getAllEvents = async (req, res) => {
  try {
    const query = req.query.search || "";
    const events = await Event.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });

    res.json(events);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch events", error: err.message });
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
    console.error("Create Event Error:", err);
    res
      .status(400)
      .json({ message: "Event creation failed", error: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
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

    const updateData = {
      title,
      date,
      time,
      description,
      category,
      price: parseFloat(price),
      registrationFields: JSON.parse(registrationFields || "[]"),
    };

    // 🖼 Image
    if (req.files?.image?.[0]) {
      updateData.image = `/uploads/${req.files.image[0].filename}`;
      if (existingImage) {
        const oldPath = path.join("uploads", path.basename(existingImage));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    } else if (existingImage) {
      updateData.image = existingImage;
    }

    // 📘 RuleBook
    if (req.files?.ruleBook?.[0]) {
      updateData.ruleBook = `/uploads/${req.files.ruleBook[0].filename}`;
      if (existingRuleBook) {
        const oldPath = path.join("uploads", path.basename(existingRuleBook));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
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
    console.error("Update Event Error:", err);
    res.status(500).json({ message: "Server error during event update" });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Event not found" });

    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: "Deletion failed", error: err.message });
  }
};

// ================== 📝 Registrations & Feedback ==================
exports.getAllRegistrations = async (req, res) => {
  try {
    const search = req.query.search || "";

    // Find all registrations with populated user & event
    const registrations = await Registration.find()
      .populate("user", "name email")
      .populate("event", "title")
      .sort({ createdAt: -1 });

    // If search is present, filter manually on populated fields
    const filtered = registrations.filter((r) => {
      const userMatch =
        r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.user?.email?.toLowerCase().includes(search.toLowerCase());

      const eventMatch = r.event?.title
        ?.toLowerCase()
        .includes(search.toLowerCase());

      return userMatch || eventMatch;
    });

    res.json(filtered);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch registrations", error: err.message });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const query = req.query.search || "";

    const feedback = await Feedback.find({
      $or: [{ text: { $regex: query, $options: "i" } }],
    })
      .populate("user", "name email")
      .populate("event", "title")
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch feedback", error: err.message });
  }
};
