import DOMPurify from "dompurify";

/**
 * Sanitize input to prevent XSS attacks
 * @param {any} input - Input to sanitize
 * @returns {any} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input === "string") {
    // Remove any potential XSS vectors
    return DOMPurify.sanitize(input.trim(), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (typeof input === "object" && input !== null) {
    const sanitized = {};
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }

  return input;
};

/**
 * Sanitize HTML content but allow safe tags
 * @param {string} html - HTML content to sanitize
 * @returns {string} Sanitized HTML
 */
export const sanitizeHTML = (html) => {
  if (typeof html !== "string") return "";

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export const escapeHTML = (str) => {
  if (typeof str !== "string") return "";

  const htmlEscapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return str.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
};

/**
 * Escape regex special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export const escapeRegex = (str) => {
  if (typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Sanitize filename to prevent path traversal
 * @param {string} filename - Filename to sanitize
 * @returns {string} Safe filename
 */
export const sanitizeFilename = (filename) => {
  if (typeof filename !== "string") return "";

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace unsafe chars
    .replace(/\.+/g, ".") // Remove multiple dots
    .replace(/^\.+/, "") // Remove leading dots
    .substring(0, 255); // Limit length
};

/**
 * Sanitize URL to prevent XSS and open redirects
 * @param {string} url - URL to sanitize
 * @returns {string|null} Safe URL or null if invalid
 */
export const sanitizeURL = (url) => {
  if (typeof url !== "string") return null;

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.href;
  } catch (error) {
    // If URL parsing fails, check if it's a relative URL
    if (url.startsWith("/") && !url.startsWith("//")) {
      return url;
    }
    return null;
  }
};

/**
 * Deep sanitize an object recursively
 * @param {Object} obj - Object to sanitize
 * @param {number} depth - Maximum recursion depth
 * @returns {Object} Sanitized object
 */
export const deepSanitize = (obj, depth = 5) => {
  if (depth === 0) return obj;

  if (typeof obj === "string") {
    return sanitizeInput(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepSanitize(item, depth - 1));
  }

  if (typeof obj === "object" && obj !== null) {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const sanitizedKey = sanitizeInput(key);
        sanitized[sanitizedKey] = deepSanitize(obj[key], depth - 1);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Remove potential NoSQL injection operators
 * @param {Object} obj - Object to clean
 * @returns {Object} Cleaned object
 */
export const removeMongoOperators = (obj) => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeMongoOperators);
  }

  const cleaned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Remove keys starting with $ or containing .
      if (!key.startsWith("$") && !key.includes(".")) {
        cleaned[key] = removeMongoOperators(obj[key]);
      }
    }
  }

  return cleaned;
};

/**
 * Sanitize search query
 * @param {string} query - Search query
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized query
 */
export const sanitizeSearchQuery = (query, maxLength = 100) => {
  if (typeof query !== "string") return "";

  let sanitized = sanitizeInput(query);

  // Remove potentially dangerous regex patterns
  const dangerousPatterns = /(\.\*){2,}|(\+\*)|(\*\+)|(\{\d{4,}\})/g;
  sanitized = sanitized.replace(dangerousPatterns, "");

  // Limit length
  return sanitized.substring(0, maxLength);
};

export default {
  sanitizeInput,
  sanitizeHTML,
  escapeHTML,
  escapeRegex,
  sanitizeFilename,
  sanitizeURL,
  deepSanitize,
  removeMongoOperators,
  sanitizeSearchQuery,
};
