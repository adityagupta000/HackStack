require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");

// Import routes
const authRoutes = require("./routes/authRoutes");
const verifyRoutes = require("./routes/verifyRoutes");
const eventRoutes = require("./routes/eventRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");
const { loginLimiter, globalLimiter } = require("./middleware/rateLimit");

const app = express();
const port = process.env.PORT || 5000;

// Ensure 'uploads' directory exists
const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
  console.log('Created "uploads" folder.');
}

// Connect to MongoDB
connectDB();

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Disposition"],
};

app.use(cors(corsOptions));
app.use(cookieParser());

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Middleware for Parsing
app.use(express.json({ limit: "10mb" })); // JSON support with size limit
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Form data support

// Serve static files correctly
app.use(
  "/uploads",
  express.static(uploadsPath, {
    setHeaders: (res, path) => {
      res.setHeader("Access-Control-Allow-Origin", corsOptions.origin);
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

// API Routes
app.use("/", verifyRoutes);
app.use(globalLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/admin", require("./routes/adminRoutes"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Handle 404 errors
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});
