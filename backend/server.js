require("dotenv").config(); // Load environment variables
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs"); // To check if the uploads folder exists
const connectDB = require("./config/db"); // Connect to MongoDB
// Import routes
const authRoutes = require("./routes/authRoutes");
const verifyRoutes = require("./routes/verifyRoutes");
const eventRoutes = require("./routes/eventRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");
const { loginLimiter, globalLimiter } = require("./middleware/rateLimit");
const registrationRoutes = require("./routes/registrationRoutes");
const app = express();
const port = process.env.PORT || 5000;

//    Ensure 'uploads' directory exists
const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
  console.log('Created "uploads" folder.');
}

//    Connect to MongoDB
connectDB();

//    CORS Configuration (Fixes "NotSameOrigin" error)
const corsOptions = {
  origin: "*", // Change this to your frontend URL in production (e.g., 'http://localhost:3000')
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Disposition"], // Allow fetching images
  credentials: true, // Allow cookies & authentication if needed
};

app.use(cors(corsOptions));

//    Security Middleware
app.use(helmet());

//    Middleware for Parsing
app.use(express.json()); // JSON support
app.use(express.urlencoded({ extended: true })); // Form data support
app.use(bodyParser.json()); // Alternative JSON parsing

//    Serve static files correctly (Fixes image 404 issue)
app.use(
  "/uploads",
  express.static(uploadsPath, {
    setHeaders: (res, path) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

//    API Routes
app.use("/", verifyRoutes);
app.use(globalLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/registrations", registrationRoutes);

app.use(errorMiddleware);

//    Start Server
app.listen(port, () => console.log(`Server running on port ${port}`));
