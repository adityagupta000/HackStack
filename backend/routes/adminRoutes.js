// routes/adminRoutes.js
const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// 🔒 Protect all admin routes
router.use(verifyToken, isAdmin);

// === 📊 Admin Dashboard ===
router.get("/stats", adminController.getAdminStats);

// === 👥 User Management ===
router.get("/users", adminController.getAllUsers);
router.put("/users/:id/role", adminController.changeUserRole);
router.delete("/users/:id", adminController.deleteUser);

// === 🎯 Event Management ===
router.get("/events", adminController.getAllEvents);
router.post(
  "/events",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "ruleBook", maxCount: 1 },
  ]),
  adminController.createEvent
);
router.put(
  "/events/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "ruleBook", maxCount: 1 },
  ]),
  adminController.updateEvent
);
router.delete("/events/:id", adminController.deleteEvent);

// === 📝 Registrations & Feedback Moderation ===
router.get("/registrations", adminController.getAllRegistrations);
router.get("/feedbacks", adminController.getAllFeedback);
router.get("/dashboard-summary", adminController.getDashboardSummary);

module.exports = router;
