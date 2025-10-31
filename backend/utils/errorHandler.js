const { HTTP_STATUS } = require("../config/constants");

// Custom Error Classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, HTTP_STATUS.BAD_REQUEST);
  }
}

class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

class AuthorizationError extends AppError {
  constructor(message = "Access denied") {
    super(message, HTTP_STATUS.FORBIDDEN);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, HTTP_STATUS.NOT_FOUND);
  }
}

class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, HTTP_STATUS.CONFLICT);
  }
}

// Async handler wrapper to catch errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Format error response
const formatErrorResponse = (err, req) => {
  const response = {
    success: false,
    message: err.message || "Something went wrong",
    statusCode: err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
  };

  // Add validation errors if present
  if (err.errors) {
    response.errors = err.errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
    response.path = req.path;
    response.method = req.method;
  }

  return response;
};

// Handle specific error types
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new ValidationError(message);
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const message = `${field} already exists. Please use another value.`;
  return new ConflictError(message);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new ValidationError(message);
};

const handleJWTError = () => {
  return new AuthenticationError("Invalid token. Please log in again.");
};

const handleJWTExpiredError = () => {
  return new AuthenticationError(
    "Your token has expired. Please log in again."
  );
};

// Global error handler middleware
const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // Log error for debugging
  console.error("ERROR:", {
    message: err.message,
    stack: err.stack,
    statusCode: error.statusCode,
  });

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    error = handleCastError(err);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    error = handleDuplicateFieldsDB(err);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    error = handleValidationErrorDB(err);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = handleJWTError();
  }

  if (err.name === "TokenExpiredError") {
    error = handleJWTExpiredError();
  }

  // Multer errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      error = new ValidationError("File size too large");
    } else {
      error = new ValidationError(err.message);
    }
  }

  const response = formatErrorResponse(error, req);

  res.status(error.statusCode).json(response);
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  asyncHandler,
  globalErrorHandler,
};
