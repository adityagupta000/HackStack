const logger = require("../config/logger");

/**
 * Safely parse JSON with depth and size limits
 * @param {string} jsonString - JSON string to parse
 * @param {Object} options - Parsing options
 * @returns {any} Parsed JSON or null on error
 */
const safeJsonParse = (jsonString, options = {}) => {
  const {
    maxDepth = 5,
    maxKeys = 100,
    maxStringLength = 10000,
  } = options;

  try {
    // Basic validation
    if (typeof jsonString !== 'string') {
      return null;
    }

    if (jsonString.length > maxStringLength) {
      logger.warn("JSON string too long", { length: jsonString.length });
      return null;
    }

    // Parse JSON
    const parsed = JSON.parse(jsonString);

    // Validate depth and structure
    const checkDepth = (obj, depth = 0) => {
      if (depth > maxDepth) {
        throw new Error("JSON depth exceeds maximum");
      }

      if (obj && typeof obj === 'object') {
        const keys = Object.keys(obj);
        
        if (keys.length > maxKeys) {
          throw new Error("JSON has too many keys");
        }

        for (const key of keys) {
          // Check for prototype pollution attempts
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            throw new Error("Potential prototype pollution detected");
          }
          
          checkDepth(obj[key], depth + 1);
        }
      }
    };

    checkDepth(parsed);
    return parsed;

  } catch (err) {
    logger.error("JSON parsing error", {
      error: err.message,
      jsonLength: jsonString?.length,
    });
    return null;
  }
};

/**
 * Safely parse registration fields
 * @param {string} fieldsString - JSON string of registration fields
 * @returns {Array} Array of sanitized fields
 */
const parseRegistrationFields = (fieldsString) => {
  const parsed = safeJsonParse(fieldsString, {
    maxDepth: 2,
    maxKeys: 20,
    maxStringLength: 2000,
  });

  if (!parsed || !Array.isArray(parsed)) {
    return [];
  }

  // Sanitize and validate each field
  return parsed
    .filter(field => field != null && typeof field === 'string')
    .map(field => field.trim().slice(0, 200))
    .filter(field => field.length > 0)
    .slice(0, 20); // Max 20 fields
};

module.exports = {
  safeJsonParse,
  parseRegistrationFields,
};