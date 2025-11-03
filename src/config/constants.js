/**
 * Application-wide constants
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Event Categories
export const EVENT_CATEGORIES = [
  { value: "SOFTWARE DOMAIN EVENTS", label: "SOFTWARE" },
  { value: "HARDWARE DOMAIN EVENTS", label: "HARDWARE" },
  { value: "ROBOTICS DOMAIN EVENTS", label: "ROBOTICS" },
  { value: "IoT DOMAIN EVENTS", label: "IoT" },
  { value: "AI/ML DOMAIN EVENTS", label: "AI/ML" },
  { value: "CYBERSECURITY DOMAIN EVENTS", label: "CYBERSECURITY" },
];

// User Roles
export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
};

// HTTP Status Codes
export const HTTP_STATUS = {
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

// Validation Limits
export const VALIDATION_LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 100,
  EMAIL_MAX: 255,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  TITLE_MIN: 3,
  TITLE_MAX: 200,
  DESCRIPTION_MIN: 10,
  DESCRIPTION_MAX: 5000,
  FEEDBACK_MIN: 5,
  FEEDBACK_MAX: 2000,
  SEARCH_QUERY_MAX: 100,
  REGISTRATION_FIELDS_MAX: 20,
};

// File Upload Limits
export const FILE_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  PDF_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 5,
};

// Allowed File Types
export const ALLOWED_FILE_TYPES = {
  IMAGES: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
  DOCUMENTS: ["application/pdf"],
};

// Time Constants
export const TIME_CONSTANTS = {
  ONE_SECOND: 1000,
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  TEN_MINUTES: 10 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
};

// Toast/Notification Durations
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 4000,
  LONG: 6000,
  ERROR: 5000,
  SUCCESS: 3000,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER_ROLE: "role",
  USER_ID: "userId",
  SAVED_EMAIL: "savedEmail",
  TARGET_TIME: "targetTime",
  THEME: "theme",
  LANGUAGE: "language",
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  SERVER_ERROR: "Server error. Please try again later.",
  UNAUTHORIZED: "Session expired. Please login again.",
  FORBIDDEN: "Access denied. You do not have permission.",
  NOT_FOUND: "Resource not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  RATE_LIMIT: "Too many requests. Please slow down.",
  FILE_TOO_LARGE: "File is too large. Please choose a smaller file.",
  INVALID_FILE_TYPE: "Invalid file type. Please choose a valid file.",
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: "Login successful!",
  LOGOUT: "Logged out successfully",
  REGISTER: "Registration successful!",
  UPDATE: "Updated successfully!",
  DELETE: "Deleted successfully!",
  SAVE: "Saved successfully!",
  UPLOAD: "Uploaded successfully!",
};

// Routes
export const ROUTES = {
  HOME: "/home",
  LOGIN: "/login",
  REGISTER: "/register",
  ABOUT: "/about",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password/:token",
  VERIFY: "/verify/:token",
  ADMIN: "/admin",
  USER_DASHBOARD: "/my-events",
};

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
  PHONE: /^\+?\d{10,15}$/,
  URL: /^https?:\/\/.+/,
  TIME_24H: /^([01]\d|2[0-3]):([0-5]\d)$/,
  TIME_12H: /^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM|am|pm)$/,
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
};

// Loading States
export const LOADING_STATES = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
};

// Registration Status
export const REGISTRATION_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  CANCELLED: "cancelled",
};

// Payment Status
export const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PAID: "paid",
  FAILED: "failed",
};

// Feedback Status
export const FEEDBACK_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// Account Status
export const ACCOUNT_STATUS = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  DELETED: "deleted",
};

// Theme Options
export const THEME_OPTIONS = {
  LIGHT: "light",
  DARK: "dark",
  AUTO: "auto",
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: "DD MMM, YYYY",
  API: "YYYY-MM-DD",
  FULL: "DD MMMM, YYYY HH:mm:ss",
};

// Animation Durations (ms)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

export default {
  API_CONFIG,
  EVENT_CATEGORIES,
  USER_ROLES,
  HTTP_STATUS,
  VALIDATION_LIMITS,
  FILE_LIMITS,
  ALLOWED_FILE_TYPES,
  TIME_CONSTANTS,
  TOAST_DURATION,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROUTES,
  REGEX_PATTERNS,
  PAGINATION,
  LOADING_STATES,
  REGISTRATION_STATUS,
  PAYMENT_STATUS,
  FEEDBACK_STATUS,
  ACCOUNT_STATUS,
  THEME_OPTIONS,
  DATE_FORMATS,
  ANIMATION_DURATION,
};
