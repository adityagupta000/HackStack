// controllers/adminController.js
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
    const latestUsers = await User.find({ role: "user" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("-password -refreshToken");
    const latestRegistrations = await Registration.find()
      .populate("user event")
      .sort({ createdAt: -1 })
      .limit(5);
    const latestFeedback = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ latestUsers, latestRegistrations, latestFeedback });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch summary", error: err.message });
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
    if (!["admin", "user"].includes(role))
      return res.status(400).json({ message: "Invalid role" });

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
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Event creation failed", error: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Event not found" });

    res.json(updated);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Event update failed", error: err.message });
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

// ================== 📝 Registration & Feedback ==================
exports.getAllRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate("user", "name email")
      .populate("event", "title");

    res.json(registrations);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch registrations", error: err.message });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch feedback", error: err.message });
  }
};
