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

    logger.info("MongoDB connected successfully");

    if (process.env.NODE_ENV === "production") {
      mongoose.set("debug", (collectionName, method, query, doc) => {
        logger.debug("MongoDB Query", {
          collection: collectionName,
          method: method,
          query: JSON.stringify(query).substring(0, 200),
        });
      });
    }

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

    mongoose.connection.on("connectionPoolCreated", () => {
      logger.info("MongoDB connection pool created");
    });

    mongoose.connection.on("connectionPoolClosed", () => {
      logger.warn("MongoDB connection pool closed");
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
