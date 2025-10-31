require("dotenv").config();
const csrf = require("csurf");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const connectDB = require("./config/db");
const { createUploadDirectories } = require("./middleware/uploadMiddleware");
const { HTTP_STATUS } = require("./config/constants");
const logger = require("./config/logger");
// Import routes
const authRoutes = require("./routes/authRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const verifyRoutes = require("./routes/verifyRoutes");
const eventRoutes = require("./routes/eventRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");
const { loginLimiter, globalLimiter } = require("./middleware/rateLimit");
const validateEnv = require("./config/validateEnv");

const app = express();
const port = process.env.PORT || 5000;

// Create upload directories on startup
createUploadDirectories();
logger.info("Upload directories created");

// Connect to MongoDB
connectDB();

validateEnv();

// FIXED: Trust proxy for rate limiting behind reverse proxy
app.set("trust proxy", 1);

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // FIXED: Only allow requests from whitelisted origins in production
    if (process.env.NODE_ENV === "production") {
      if (!origin) {
        return callback(new Error("Not allowed by CORS - No origin header"));
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn("CORS rejection", { origin, path: req?.path });
        callback(new Error("Not allowed by CORS"));
      }
    } else {
      // Development: allow requests with no origin
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn("CORS rejection", { origin, path: req?.path });
        callback(new Error("Not allowed by CORS"));
      }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Disposition"],
  maxAge: 600, // Cache preflight for 10 minutes
};

app.use(cors(corsOptions));
if (!process.env.COOKIE_SECRET) {
  console.error("FATAL: COOKIE_SECRET environment variable is not set");
  process.exit(1);
}

app.use(cookieParser(process.env.COOKIE_SECRET));

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  },
});

app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use((req, res, next) => {
  if (
    req.method === "GET" ||
    req.method === "HEAD" ||
    req.method === "OPTIONS" ||
    req.path === "/health" ||
    req.path.startsWith("/uploads/")
  ) {
    return next();
  }
  csrfProtection(req, res, next);
});

// FIXED: Enhanced Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: "deny" },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
  })
);

// Add Permissions-Policy header
app.use((req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=()"
  );
  next();
});

const requestIdMiddleware = require("./middleware/requestId");
app.use(requestIdMiddleware);

// FIXED: Force HTTPS in production
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}

app.use(
  mongoSanitize({
    replaceWith: "_",
    onSanitize: ({ req, key }) => {
      logger.warn("Sanitized input detected", {
        key,
        path: req.path,
        requestId: req.id,
      });
    },
  })
);

// Body Parser Middleware with size limits
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Request Logging Middleware (development only)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    logger.info("Incoming request", {
      method: req.method,
      path: req.path,
      ip: req.ip,
      requestId: req.id,
    });
    next();
  });
}

// FIXED: Security headers for static files
const uploadsPath = path.join(__dirname, "uploads");
app.use(
  "/uploads",
  express.static(uploadsPath, {
    maxAge: "1d",
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

      // Set appropriate content type
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".pdf") {
        res.setHeader("Content-Type", "application/pdf");
      }
    },
  })
);

// Health check endpoint (before rate limiting)
app.get("/health", async (req, res) => {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  };

  try {
    const dbState = mongoose.connection.readyState;
    health.database = dbState === 1 ? "connected" : "disconnected";

    if (dbState !== 1) {
      health.status = "ERROR";
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(health);
    }

    res.status(HTTP_STATUS.OK).json(health);
  } catch (error) {
    health.status = "ERROR";
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(health);
  }
});

// API Routes
app.use("/", verifyRoutes);
app.use(globalLimiter); // Apply global rate limiting
app.use("/api/auth", authRoutes);
app.use("/api/admin/auth", adminAuthRoutes); // FIXED: Protected admin routes
app.use("/api/events", eventRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/admin", adminRoutes);

// Handle 404 errors
app.use("*", (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

const server = app.listen(port, () => {
  logger.info("Server started successfully", {
    port,
    environment: process.env.NODE_ENV || "development",
    frontendUrl:
      process.env.NODE_ENV !== "production"
        ? process.env.FRONTEND_URL || "http://localhost:3000"
        : undefined,
  });
});

logger.info(`Server started on port ${port} in ${process.env.NODE_ENV} mode`);
if (process.env.NODE_ENV !== "production") {
  logger.info(`Frontend allowed: ${process.env.FRONTEND_URL}`);
}

// Graceful shutdown
let shuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received. Shutting down gracefully...`);

  try {
    await new Promise((resolve) => server.close(resolve));
    logger.info("HTTP server closed");

    await mongoose.connection.close();
    logger.info("MongoDB connection closed");

    process.exit(0);
  } catch (err) {
    logger.error("Error during shutdown", {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT (Ctrl+C)"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection", {
    error: err.message,
    stack: err.stack,
  });
  gracefulShutdown("UNHANDLED_REJECTION");
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception - Application terminating", {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

module.exports = app;
