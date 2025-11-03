const { EVENT_CATEGORIES } = require("../config/constants");

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const isValidPassword = (password) => {
  // At least 8 chars, 1 uppercase, 1 number, 1 special char
  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Validate date format (DD Month, YYYY or YYYY-MM-DD)
const isValidDate = (dateString) => {
  if (!dateString) return false;

  // Try to parse as Date
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// Validate time format (HH:MM or HH:MM AM/PM)
const isValidTime = (timeString) => {
  if (!timeString) return false;

  // 24-hour format: HH:MM
  const time24Regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  // 12-hour format: HH:MM AM/PM
  const time12Regex = /^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM|am|pm)$/;

  return time24Regex.test(timeString) || time12Regex.test(timeString);
};

// Validate price (must be non-negative number)
const isValidPrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) && numPrice >= 0;
};

// Validate event category
const isValidCategory = (category) => {
  return EVENT_CATEGORIES.includes(category);
};

// Validate ObjectId format
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Sanitize string input
const sanitizeString = (str) => {
  if (typeof str !== "string") return "";

  return str
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

// Validate and sanitize event data
const validateEventData = (data) => {
  const errors = [];

  if (!data.title || data.title.trim().length < 3) {
    errors.push({
      field: "title",
      message: "Title must be at least 3 characters",
    });
  }

  if (!isValidDate(data.date)) {
    errors.push({ field: "date", message: "Invalid date format" });
  }

  if (!isValidTime(data.time)) {
    errors.push({ field: "time", message: "Invalid time format (use HH:MM)" });
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push({
      field: "description",
      message: "Description must be at least 10 characters",
    });
  }

  if (!isValidCategory(data.category)) {
    errors.push({ field: "category", message: "Invalid event category" });
  }

  if (!isValidPrice(data.price)) {
    errors.push({
      field: "price",
      message: "Price must be a non-negative number",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: {
      title: sanitizeString(data.title),
      date: data.date,
      time: data.time,
      description: sanitizeString(data.description),
      category: data.category,
      price: parseFloat(data.price),
    },
  };
};

// Validate registration data
const validateRegistrationData = (data) => {
  const errors = [];

  if (!data.eventId || !isValidObjectId(data.eventId)) {
    errors.push({ field: "eventId", message: "Invalid event ID" });
  }

  if (!data.userId || !isValidObjectId(data.userId)) {
    errors.push({ field: "userId", message: "Invalid user ID" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validate feedback data
const validateFeedbackData = (data) => {
  const errors = [];

  if (!data.eventId || !isValidObjectId(data.eventId)) {
    errors.push({ field: "eventId", message: "Invalid event ID" });
  }

  if (!data.text || data.text.trim().length < 5) {
    errors.push({
      field: "text",
      message: "Feedback must be at least 5 characters",
    });
  }

  if (data.text && data.text.length > 1000) {
    errors.push({
      field: "text",
      message: "Feedback must be less than 1000 characters",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: {
      eventId: data.eventId,
      text: sanitizeString(data.text),
    },
  };
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidDate,
  isValidTime,
  isValidPrice,
  isValidCategory,
  isValidObjectId,
  sanitizeString,
  validateEventData,
  validateRegistrationData,
  validateFeedbackData,
};
