// routes/adminRoutes.js
const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// 🔒 Protect all admin routes
router.use(verifyToken, isAdmin);

// === 📊 Admin Dashboard ===
router.get("/stats", adminController.getAdminStats);
// router.get("/dashboard-summary", adminController.getDashboardSummary); // ❓ Only if implemented

// === 👥 User Management ===
router.get("/users", adminController.getAllUsers);
router.put("/users/:id/role", adminController.changeUserRole);
router.delete("/users/:id", adminController.deleteUser);

// === 🎯 Event Management ===
router.get("/events", adminController.getAllEvents);
router.post("/events", adminController.createEvent);
router.put("/events/:id", adminController.updateEvent);
router.delete("/events/:id", adminController.deleteEvent);

// === 📝 Registrations & Feedback Moderation ===
router.get("/registrations", adminController.getAllRegistrations);
router.get("/feedbacks", adminController.getAllFeedback);

module.exports = router;
