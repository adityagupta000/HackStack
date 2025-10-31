const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      compressors: "zlib",
      retryWrites: true,
      retryReads: true,
    });

    logger.info("MongoDB connected successfully", {
      host: conn.connection.host,
      name: conn.connection.name,
    });

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error", {
        error: err.message,
        stack: err.stack,
      });
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected successfully");
    });

    return conn;
  } catch (error) {
    logger.error("MongoDB connection failed", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

module.exports = connectDB;
