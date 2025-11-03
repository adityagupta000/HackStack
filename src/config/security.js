import logger from '../utils/logger';

export const CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": ["'self'"],
  "style-src": ["'self'", "'unsafe-inline'"], // Temporarily allow inline styles
  "img-src": ["'self'", "data:", "blob:", "https:"],
  "font-src": ["'self'", "data:"],
  "connect-src": [
    "'self'",
    process.env.REACT_APP_API_URL || "http://localhost:5000",
  ],
  "frame-ancestors": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "object-src": ["'none'"],
  "media-src": ["'self'"],
};

/**
 * Security headers to check
 */
export const REQUIRED_SECURITY_HEADERS = [
  "x-content-type-options",
  "x-frame-options",
  "strict-transport-security",
  "x-xss-protection",
  "referrer-policy",
];

/**
 * Check if security headers are present in response
 * @param {Object} response - Axios response object
 * @returns {Object} Missing headers
 */
export const checkSecurityHeaders = (response) => {
  const missingHeaders = [];
  const presentHeaders = {};

  REQUIRED_SECURITY_HEADERS.forEach((header) => {
    const headerValue = response.headers[header];
    if (!headerValue) {
      missingHeaders.push(header);
    } else {
      presentHeaders[header] = headerValue;
    }
  });

  return {
    allPresent: missingHeaders.length === 0,
    missingHeaders,
    presentHeaders,
  };
};

/**
 * Sanitize user input before storing in localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {boolean} Success
 */
export const secureLocalStorage = {
  set: (key, value) => {
    try {
      if (typeof value === "object") {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, String(value));
      }
      return true;
    } catch (error) {
      console.error("Failed to set localStorage:", error);
      return false;
    }
  },

  get: (key, defaultValue = null) => {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;

      // Try to parse as JSON
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error("Failed to get localStorage:", error);
      return defaultValue;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Failed to remove localStorage:", error);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
      return false;
    }
  },
};

/**
 * Secure session storage wrapper
 */
export const secureSessionStorage = {
  set: (key, value) => {
    try {
      if (typeof value === "object") {
        sessionStorage.setItem(key, JSON.stringify(value));
      } else {
        sessionStorage.setItem(key, String(value));
      }
      return true;
    } catch (error) {
      console.error("Failed to set sessionStorage:", error);
      return false;
    }
  },

  get: (key, defaultValue = null) => {
    try {
      const value = sessionStorage.getItem(key);
      if (value === null) return defaultValue;

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error("Failed to get sessionStorage:", error);
      return defaultValue;
    }
  },

  remove: (key) => {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Failed to remove sessionStorage:", error);
      return false;
    }
  },

  clear: () => {
    try {
      sessionStorage.clear();
      return true;
    } catch (error) {
      console.error("Failed to clear sessionStorage:", error);
      return false;
    }
  },
};

/**
 * Generate random string for CSRF-like tokens
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
export const generateRandomString = (length = 32) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const cryptoObj = window.crypto || window.msCrypto;

  if (cryptoObj && cryptoObj.getRandomValues) {
    const values = new Uint32Array(length);
    cryptoObj.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += chars[values[i] % chars.length];
    }
  } else {
    // Fallback for older browsers
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  return result;
};

/**
 * Check if HTTPS is being used in production
 * @returns {boolean} Is secure
 */
export const isSecureConnection = () => {
  if (process.env.NODE_ENV === "development") {
    return true; // Allow HTTP in development
  }
  return window.location.protocol === "https:";
};

/**
 * Validate token format (JWT-like structure)
 * @param {string} token - Token to validate
 * @returns {boolean} Is valid format
 */
export const isValidTokenFormat = (token) => {
  if (typeof token !== "string") return false;

  // JWT has 3 parts separated by dots
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  // Each part should be base64url encoded (alphanumeric, -, _)
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
  return parts.every((part) => base64UrlRegex.test(part));
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  // Clear localStorage
  sessionStorage.removeItem("userRole");
  sessionStorage.removeItem("userId");
  sessionStorage.removeItem("userName");
  sessionStorage.removeItem("csrfToken");

  // Clear sessionStorage
  sessionStorage.clear();

  // Clear cookies (client-side only)
  document.cookie.split(";").forEach((c) => {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
  });
  
  logger.info("Client-side auth data cleared");
};

/**
 * Check if user is authenticated
 * @returns {boolean} Is authenticated
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem("accessToken");
  return token !== null && isValidTokenFormat(token);
};

/**
 * Get user role from storage
 * @returns {string|null} User role
 */
export const getUserRole = () => {
  return localStorage.getItem("role");
};

/**
 * Check if user has specific role
 * @param {string} requiredRole - Required role
 * @returns {boolean} Has role
 */
export const hasRole = (requiredRole) => {
  const userRole = getUserRole();
  return userRole === requiredRole;
};

/**
 * Prevent clickjacking by checking if app is in iframe
 * @returns {boolean} Is in iframe
 */
export const detectClickjacking = () => {
  if (window.self !== window.top) {
    console.error("Clickjacking attempt detected!");
    return true;
  }
  return false;
};

/**
 * Rate limiting tracker (client-side)
 */
export class ClientRateLimiter {
  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }

  /**
   * Check if action is allowed
   * @param {string} key - Unique identifier for the action
   * @returns {boolean} Is allowed
   */
  isAllowed(key) {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return true;
    }

    const timePassed = now - record.firstAttempt;

    if (timePassed > this.windowMs) {
      // Reset window
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return true;
    }

    if (record.count >= this.maxAttempts) {
      return false;
    }

    record.count += 1;
    return true;
  }

  /**
   * Get remaining attempts
   * @param {string} key - Unique identifier
   * @returns {number} Remaining attempts
   */
  getRemainingAttempts(key) {
    const record = this.attempts.get(key);
    if (!record) return this.maxAttempts;

    const now = Date.now();
    const timePassed = now - record.firstAttempt;

    if (timePassed > this.windowMs) {
      return this.maxAttempts;
    }

    return Math.max(0, this.maxAttempts - record.count);
  }

  /**
   * Get time until reset
   * @param {string} key - Unique identifier
   * @returns {number} Milliseconds until reset
   */
  getTimeUntilReset(key) {
    const record = this.attempts.get(key);
    if (!record) return 0;

    const now = Date.now();
    const timePassed = now - record.firstAttempt;
    return Math.max(0, this.windowMs - timePassed);
  }

  /**
   * Reset attempts for a key
   * @param {string} key - Unique identifier
   */
  reset(key) {
    this.attempts.delete(key);
  }

  /**
   * Clear all attempts
   */
  clearAll() {
    this.attempts.clear();
  }
}

/**
 * Password strength checker
 * @param {string} password - Password to check
 * @returns {Object} Strength assessment
 */
export const checkPasswordStrength = (password) => {
  const checks = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[@$!%*#?&]/.test(password),
    noCommonPatterns: !/^(password|12345678|qwerty)/i.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  let strength = "weak";
  let color = "red";

  if (score >= 6 && password.length >= 12) {
    strength = "strong";
    color = "green";
  } else if (score >= 5) {
    strength = "medium";
    color = "orange";
  }

  return {
    strength,
    score,
    maxScore: 6,
    percentage: (score / 6) * 100,
    color,
    checks,
    suggestions: getSuggestions(checks),
  };
};

/**
 * Get password improvement suggestions
 * @param {Object} checks - Password checks
 * @returns {Array} Suggestions
 */
const getSuggestions = (checks) => {
  const suggestions = [];

  if (!checks.minLength) {
    suggestions.push("Use at least 8 characters");
  }
  if (!checks.hasUpperCase) {
    suggestions.push("Add uppercase letters (A-Z)");
  }
  if (!checks.hasLowerCase) {
    suggestions.push("Add lowercase letters (a-z)");
  }
  if (!checks.hasNumber) {
    suggestions.push("Add numbers (0-9)");
  }
  if (!checks.hasSpecialChar) {
    suggestions.push("Add special characters (@$!%*#?&)");
  }
  if (!checks.noCommonPatterns) {
    suggestions.push("Avoid common passwords");
  }

  return suggestions;
};

/**
 * Detect suspicious activity patterns
 * @param {Array} actions - Array of user actions with timestamps
 * @returns {Object} Suspicion assessment
 */
export const detectSuspiciousActivity = (actions) => {
  if (!Array.isArray(actions) || actions.length === 0) {
    return { isSuspicious: false, reasons: [] };
  }

  const reasons = [];
  const now = Date.now();

  // Check for rapid requests (> 10 per second)
  const recentActions = actions.filter(
    (action) => now - action.timestamp < 1000
  );
  if (recentActions.length > 10) {
    reasons.push("Too many rapid requests");
  }

  // Check for unusual time patterns (e.g., activity at 3 AM)
  const hour = new Date().getHours();
  const lateNightActions = actions.filter((action) => {
    const actionHour = new Date(action.timestamp).getHours();
    return actionHour >= 2 && actionHour <= 5;
  });
  if (lateNightActions.length > actions.length * 0.8) {
    reasons.push("Unusual activity time pattern");
  }

  // Check for repeated failed attempts
  const failedActions = actions.filter((action) => action.success === false);
  if (failedActions.length > actions.length * 0.5) {
    reasons.push("High failure rate");
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
    riskLevel:
      reasons.length >= 2 ? "high" : reasons.length === 1 ? "medium" : "low",
  };
};

export default {
  CSP_DIRECTIVES,
  REQUIRED_SECURITY_HEADERS,
  checkSecurityHeaders,
  secureLocalStorage,
  secureSessionStorage,
  generateRandomString,
  isSecureConnection,
  isValidTokenFormat,
  clearAuthData,
  isAuthenticated,
  getUserRole,
  hasRole,
  detectClickjacking,
  ClientRateLimiter,
  checkPasswordStrength,
  detectSuspiciousActivity,
};
