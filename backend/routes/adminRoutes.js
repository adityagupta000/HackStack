const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const {
  generalUpload,
  handleUploadError,
  magicNumberValidator, // FIXED: Import magic number validator
} = require("../middleware/uploadMiddleware");
const { apiLimiter } = require("../middleware/rateLimit");

// Protect all admin routes
router.use(verifyToken, isAdmin);

// FIXED: Add rate limiting to admin routes
router.use(apiLimiter);

// === Admin Dashboard ===
router.get("/stats", adminController.getAdminStats);
router.get("/dashboard-summary", adminController.getDashboardSummary);

// === User Management ===
router.get("/users", adminController.getAllUsers);
router.put("/users/:id/role", adminController.changeUserRole);
router.delete("/users/:id", adminController.deleteUser);

// === Event Management ===
router.get("/events", adminController.getAllEvents);

// FIXED: Add magic number validation to file uploads
router.post(
  "/events",
  generalUpload.fields([
    { name: "image", maxCount: 1 },
    { name: "ruleBook", maxCount: 1 },
  ]),
  magicNumberValidator, // FIXED: Validate file content
  handleUploadError,
  adminController.createEvent
);

router.put(
  "/events/:id",
  generalUpload.fields([
    { name: "image", maxCount: 1 },
    { name: "ruleBook", maxCount: 1 },
  ]),
  magicNumberValidator, // FIXED: Validate file content
  handleUploadError,
  adminController.updateEvent
);

router.delete("/events/:id", adminController.deleteEvent);

// === Registrations & Feedback Moderation ===
router.get("/registrations", adminController.getAllRegistrations);
router.get("/feedbacks", adminController.getAllFeedback);

module.exports = router;
