const mongoSanitize = require("express-mongo-sanitize");

/**
 * Sanitize input to prevent NoSQL injection
 * @param {any} input - Input to sanitize
 * @returns {any} Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input === "string") {
    return mongoSanitize.sanitize(input.trim());
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (typeof input === "object" && input !== null) {
    const sanitized = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  return input;
};

/**
 * Escape regex special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {boolean} Is valid
 */
const validateLength = (str, min, max) => {
  if (typeof str !== "string") return false;
  const len = str.trim().length;
  return len >= min && len <= max;
};

module.exports = {
  sanitizeInput,
  escapeRegex,
  validateLength,
};