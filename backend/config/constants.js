// Time constants
const TIME_CONSTANTS = {
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  TEN_MINUTES: 10 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  SEVEN_DAYS: 7 * 24 * 60 * 60 * 1000,
  PASSWORD_RESET_EXPIRY: 10 * 60 * 1000,
  VERIFICATION_TOKEN_EXPIRY: 24 * 60 * 60 * 1000,
};

// Event categories
const EVENT_CATEGORIES = [
  "SOFTWARE DOMAIN EVENTS",
  "HARDWARE DOMAIN EVENTS",
  "ROBOTICS DOMAIN EVENTS",
  "IoT DOMAIN EVENTS",
  "AI/ML DOMAIN EVENTS",
  "CYBERSECURITY DOMAIN EVENTS",
];

// User roles
const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
};

// Registration status
const REGISTRATION_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  CANCELLED: "cancelled",
};

// Payment status
const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PAID: "paid",
  FAILED: "failed",
};

// Feedback status
const FEEDBACK_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// File upload limits
const FILE_LIMITS = {
  IMAGE_MAX_SIZE: parseInt(process.env.MAX_IMAGE_SIZE) || 5 * 1024 * 1024,
  PDF_MAX_SIZE: parseInt(process.env.MAX_PDF_SIZE) || 10 * 1024 * 1024,
};

// HTTP Status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

// Error messages
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password",
  USER_EXISTS: "User already exists",
  USER_NOT_FOUND: "User not found",
  EVENT_NOT_FOUND: "Event not found",
  REGISTRATION_EXISTS: "You already registered for this event",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Access denied",
  TOKEN_EXPIRED: "Token expired",
  INVALID_TOKEN: "Invalid token",
  SERVER_ERROR: "Internal server error",
  VALIDATION_ERROR: "Validation error",
};

module.exports = {
  TIME_CONSTANTS,
  EVENT_CATEGORIES,
  USER_ROLES,
  REGISTRATION_STATUS,
  PAYMENT_STATUS,
  FEEDBACK_STATUS,
  FILE_LIMITS,
  HTTP_STATUS,
  ERROR_MESSAGES,
};