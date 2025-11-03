/**
 * Validation utility functions
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const validateEmail = (email) => {
  if (typeof email !== "string") return false;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with details
 */
export const validatePassword = (password) => {
  if (typeof password !== "string") {
    return {
      isValid: false,
      errors: ["Password must be a string"],
      strength: "invalid",
    };
  }

  const errors = [];
  const checks = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[@$!%*#?&]/.test(password),
  };

  if (!checks.minLength) errors.push("At least 8 characters");
  if (!checks.hasUpperCase) errors.push("One uppercase letter");
  if (!checks.hasNumber) errors.push("One number");
  if (!checks.hasSpecialChar) errors.push("One special character (@$!%*#?&)");

  // Calculate strength
  let strength = "weak";
  const passedChecks = Object.values(checks).filter(Boolean).length;

  if (passedChecks === 5 && password.length >= 12) {
    strength = "strong";
  } else if (passedChecks >= 4) {
    strength = "medium";
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    checks,
  };
};

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {boolean} Is valid length
 */
export const validateLength = (str, min, max) => {
  if (typeof str !== "string") return false;
  const len = str.trim().length;
  return len >= min && len <= max;
};

/**
 * Validate name
 * @param {string} name - Name to validate
 * @returns {Object} Validation result
 */
export const validateName = (name) => {
  if (typeof name !== "string") {
    return { isValid: false, error: "Name must be a string" };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters" };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: "Name cannot exceed 100 characters" };
  }

  // Check for invalid characters (allow letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return { isValid: false, error: "Name contains invalid characters" };
  }

  return { isValid: true, value: trimmed };
};

/**
 * Validate event title
 * @param {string} title - Title to validate
 * @returns {Object} Validation result
 */
export const validateEventTitle = (title) => {
  if (typeof title !== "string") {
    return { isValid: false, error: "Title must be a string" };
  }

  const trimmed = title.trim();

  if (trimmed.length < 3) {
    return { isValid: false, error: "Title must be at least 3 characters" };
  }

  if (trimmed.length > 200) {
    return { isValid: false, error: "Title cannot exceed 200 characters" };
  }

  return { isValid: true, value: trimmed };
};

/**
 * Validate description
 * @param {string} description - Description to validate
 * @returns {Object} Validation result
 */
export const validateDescription = (description) => {
  if (typeof description !== "string") {
    return { isValid: false, error: "Description must be a string" };
  }

  const trimmed = description.trim();

  if (trimmed.length < 10) {
    return {
      isValid: false,
      error: "Description must be at least 10 characters",
    };
  }

  if (trimmed.length > 5000) {
    return {
      isValid: false,
      error: "Description cannot exceed 5000 characters",
    };
  }

  return { isValid: true, value: trimmed };
};

/**
 * Validate price
 * @param {any} price - Price to validate
 * @returns {Object} Validation result
 */
export const validatePrice = (price) => {
  const numPrice = parseFloat(price);

  if (isNaN(numPrice)) {
    return { isValid: false, error: "Price must be a valid number" };
  }

  if (numPrice < 0) {
    return { isValid: false, error: "Price cannot be negative" };
  }

  if (numPrice > 1000000) {
    return { isValid: false, error: "Price cannot exceed 1,000,000" };
  }

  return { isValid: true, value: numPrice };
};

/**
 * Validate event category
 * @param {string} category - Category to validate
 * @returns {Object} Validation result
 */
export const validateCategory = (category) => {
  const validCategories = [
    "SOFTWARE DOMAIN EVENTS",
    "HARDWARE DOMAIN EVENTS",
    "ROBOTICS DOMAIN EVENTS",
    "IoT DOMAIN EVENTS",
    "AI/ML DOMAIN EVENTS",
    "CYBERSECURITY DOMAIN EVENTS",
  ];

  if (!validCategories.includes(category)) {
    return {
      isValid: false,
      error: "Invalid category selected",
      validCategories,
    };
  }

  return { isValid: true, value: category };
};

/**
 * Validate date string
 * @param {string} dateString - Date to validate
 * @returns {Object} Validation result
 */
export const validateDate = (dateString) => {
  if (typeof dateString !== "string") {
    return { isValid: false, error: "Date must be a string" };
  }

  const trimmed = dateString.trim();

  if (!trimmed) {
    return { isValid: false, error: "Date is required" };
  }

  // Try to parse as Date
  const date = new Date(trimmed);

  if (isNaN(date.getTime())) {
    return { isValid: false, error: "Invalid date format" };
  }

  return { isValid: true, value: trimmed, date };
};

/**
 * Validate time string
 * @param {string} timeString - Time to validate
 * @returns {Object} Validation result
 */
export const validateTime = (timeString) => {
  if (typeof timeString !== "string") {
    return { isValid: false, error: "Time must be a string" };
  }

  const trimmed = timeString.trim();

  if (!trimmed) {
    return { isValid: false, error: "Time is required" };
  }

  // 24-hour format: HH:MM
  const time24Regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  // 12-hour format: HH:MM AM/PM
  const time12Regex = /^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM|am|pm)$/;

  if (!time24Regex.test(trimmed) && !time12Regex.test(trimmed)) {
    return {
      isValid: false,
      error: "Invalid time format. Use HH:MM or HH:MM AM/PM",
    };
  }

  return { isValid: true, value: trimmed };
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {Object} Validation result
 */
export const validateURL = (url) => {
  if (typeof url !== "string") {
    return { isValid: false, error: "URL must be a string" };
  }

  try {
    const parsed = new URL(url);

    // Only allow http and https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { isValid: false, error: "URL must use HTTP or HTTPS protocol" };
    }

    return { isValid: true, value: parsed.href };
  } catch (error) {
    // Check if it's a relative URL
    if (url.startsWith("/") && !url.startsWith("//")) {
      return { isValid: true, value: url, isRelative: true };
    }

    return { isValid: false, error: "Invalid URL format" };
  }
};

/**
 * Validate phone number (international format)
 * @param {string} phone - Phone number to validate
 * @returns {Object} Validation result
 */
export const validatePhone = (phone) => {
  if (typeof phone !== "string") {
    return { isValid: false, error: "Phone must be a string" };
  }

  // Remove spaces, hyphens, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, "");

  // Check if it contains only digits and optional + at start
  if (!/^\+?\d{10,15}$/.test(cleaned)) {
    return {
      isValid: false,
      error: "Phone must be 10-15 digits, optionally starting with +",
    };
  }

  return { isValid: true, value: cleaned };
};

/**
 * Validate feedback text
 * @param {string} text - Feedback text
 * @returns {Object} Validation result
 */
export const validateFeedback = (text) => {
  if (typeof text !== "string") {
    return { isValid: false, error: "Feedback must be a string" };
  }

  const trimmed = text.trim();

  if (trimmed.length < 5) {
    return { isValid: false, error: "Feedback must be at least 5 characters" };
  }

  if (trimmed.length > 2000) {
    return { isValid: false, error: "Feedback cannot exceed 2000 characters" };
  }

  return { isValid: true, value: trimmed };
};

/**
 * Validate search query
 * @param {string} query - Search query
 * @param {number} maxLength - Maximum length
 * @returns {Object} Validation result
 */
export const validateSearchQuery = (query, maxLength = 100) => {
  if (typeof query !== "string") {
    return { isValid: false, error: "Search query must be a string" };
  }

  if (query.length > maxLength) {
    return {
      isValid: false,
      error: `Search query cannot exceed ${maxLength} characters`,
    };
  }

  // Check for dangerous regex patterns
  const dangerousPatterns = /(\.\*){2,}|(\+\*)|(\*\+)|(\{\d{4,}\})/;
  if (dangerousPatterns.test(query)) {
    return { isValid: false, error: "Invalid search pattern" };
  }

  return { isValid: true, value: query.trim() };
};

/**
 * Validate MongoDB ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean} Is valid ObjectId
 */
export const validateObjectId = (id) => {
  if (typeof id !== "string") return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate registration fields array
 * @param {Array} fields - Registration fields
 * @returns {Object} Validation result
 */
export const validateRegistrationFields = (fields) => {
  if (!Array.isArray(fields)) {
    return { isValid: false, error: "Registration fields must be an array" };
  }

  if (fields.length === 0) {
    return {
      isValid: false,
      error: "At least one registration field required",
    };
  }

  if (fields.length > 20) {
    return { isValid: false, error: "Cannot exceed 20 registration fields" };
  }

  // Validate each field
  const invalidFields = fields.filter(
    (field) => typeof field !== "string" || field.trim().length === 0
  );

  if (invalidFields.length > 0) {
    return { isValid: false, error: "All fields must be non-empty strings" };
  }

  return { isValid: true, value: fields.map((f) => f.trim()) };
};

export default {
  validateEmail,
  validatePassword,
  validateLength,
  validateName,
  validateEventTitle,
  validateDescription,
  validatePrice,
  validateCategory,
  validateDate,
  validateTime,
  validateURL,
  validatePhone,
  validateFeedback,
  validateSearchQuery,
  validateObjectId,
  validateRegistrationFields,
};
