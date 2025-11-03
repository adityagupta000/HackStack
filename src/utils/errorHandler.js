import toast from "react-hot-toast";

/**
 * Custom error classes
 */
export class APIError extends Error {
  constructor(message, status, code, errors = null) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

export class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = "NetworkError";
  }
}

export class AuthenticationError extends Error {
  constructor(message = "Authentication failed") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message = "Access denied") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Extract error message from various error formats
 * @param {Error|Object} error - Error object
 * @param {string} fallbackMessage - Default message if extraction fails
 * @returns {string} Error message
 */
export const getErrorMessage = (
  error,
  fallbackMessage = "An error occurred"
) => {
  // API error response
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Validation errors array
  if (
    error.response?.data?.errors &&
    Array.isArray(error.response.data.errors)
  ) {
    return error.response.data.errors
      .map((err) => err.message || err.msg)
      .filter(Boolean)
      .join(", ");
  }

  // Network errors
  if (error.code === "ECONNABORTED") {
    return "Request timeout. Please try again.";
  }

  if (error.code === "ERR_NETWORK") {
    return "Network error. Please check your connection.";
  }

  // Axios errors
  if (error.request && !error.response) {
    return "No response from server. Please check your connection.";
  }

  // Standard error message
  if (error.message) {
    return error.message;
  }

  return fallbackMessage;
};

/**
 * Get HTTP status code from error
 * @param {Error|Object} error - Error object
 * @returns {number|null} Status code
 */
export const getErrorStatus = (error) => {
  return error.response?.status || error.status || null;
};

/**
 * Check if error is authentication related
 * @param {Error|Object} error - Error object
 * @returns {boolean} Is authentication error
 */
export const isAuthError = (error) => {
  const status = getErrorStatus(error);
  return status === 401 || error instanceof AuthenticationError;
};

/**
 * Check if error is authorization related
 * @param {Error|Object} error - Error object
 * @returns {boolean} Is authorization error
 */
export const isAuthorizationError = (error) => {
  const status = getErrorStatus(error);
  return status === 403 || error instanceof AuthorizationError;
};

/**
 * Check if error is rate limiting related
 * @param {Error|Object} error - Error object
 * @returns {boolean} Is rate limit error
 */
export const isRateLimitError = (error) => {
  const status = getErrorStatus(error);
  return status === 429;
};

/**
 * Check if error is validation related
 * @param {Error|Object} error - Error object
 * @returns {boolean} Is validation error
 */
export const isValidationError = (error) => {
  const status = getErrorStatus(error);
  return status === 400 || status === 422 || error instanceof ValidationError;
};

/**
 * Check if error is network related
 * @param {Error|Object} error - Error object
 * @returns {boolean} Is network error
 */
export const isNetworkError = (error) => {
  return (
    error.code === "ERR_NETWORK" ||
    error.code === "ECONNABORTED" ||
    error instanceof NetworkError ||
    (error.request && !error.response)
  );
};

/**
 * Get retry-after time from rate limit error
 * @param {Error|Object} error - Error object
 * @returns {number} Seconds to wait before retry
 */
export const getRetryAfter = (error) => {
  if (isRateLimitError(error)) {
    const retryAfter = error.response?.headers["retry-after"];
    return retryAfter ? parseInt(retryAfter, 10) : 60;
  }
  return 0;
};

/**
 * Handle API error with appropriate user feedback
 * @param {Error|Object} error - Error object
 * @param {Object} options - Error handling options
 */
export const handleAPIError = (error, options = {}) => {
  const {
    showToast: shouldShowToast = true,
    fallbackMessage = "An error occurred",
    onAuthError = null,
    onRateLimitError = null,
    customHandlers = {},
  } = options;

  const message = getErrorMessage(error, fallbackMessage);
  const status = getErrorStatus(error);

  // Handle authentication errors
  if (isAuthError(error)) {
    if (onAuthError) {
      onAuthError(error);
    } else {
      if (shouldShowToast) {
        toast.error("Session expired. Please login again.");
      }
      // Clear tokens and redirect to login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("role");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    }
    return;
  }

  // Handle authorization errors
  if (isAuthorizationError(error)) {
    if (shouldShowToast) {
      toast.error("Access denied. You do not have permission.");
    }
    return;
  }

  // Handle rate limiting
  if (isRateLimitError(error)) {
    const retryAfter = getRetryAfter(error);
    if (onRateLimitError) {
      onRateLimitError(error, retryAfter);
    } else if (shouldShowToast) {
      toast.error(
        `Too many requests. Please try again in ${retryAfter} seconds.`,
        { duration: retryAfter * 1000 }
      );
    }
    return;
  }

  // Handle network errors
  if (isNetworkError(error)) {
    if (shouldShowToast) {
      toast.error("Network error. Please check your connection and try again.");
    }
    return;
  }

  // Handle custom status codes
  if (status && customHandlers[status]) {
    customHandlers[status](error, message);
    return;
  }

  // Default error handling
  if (shouldShowToast) {
    toast.error(message);
  }
};

/**
 * Format validation errors for display
 * @param {Array} errors - Array of validation errors
 * @returns {Object} Formatted errors by field
 */
export const formatValidationErrors = (errors) => {
  if (!Array.isArray(errors)) return {};

  return errors.reduce((acc, error) => {
    const field = error.path || error.param || error.field || "general";
    const message = error.message || error.msg || "Invalid value";

    if (acc[field]) {
      acc[field] = Array.isArray(acc[field])
        ? [...acc[field], message]
        : [acc[field], message];
    } else {
      acc[field] = message;
    }

    return acc;
  }, {});
};

/**
 * Create error report for logging
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 * @returns {Object} Error report
 */
export const createErrorReport = (error, context = {}) => {
  return {
    message: error.message,
    name: error.name,
    status: getErrorStatus(error),
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    ...context,
  };
};

/**
 * Async error wrapper for try-catch blocks
 * @param {Function} fn - Async function to wrap
 * @param {Object} errorOptions - Error handling options
 * @returns {Function} Wrapped function
 */
export const asyncErrorHandler = (fn, errorOptions = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleAPIError(error, errorOptions);
      throw error; // Re-throw for component-level handling if needed
    }
  };
};

/**
 * Error boundary fallback component props
 * @param {Error} error - Error that was caught
 * @param {Function} resetErrorBoundary - Function to reset error boundary
 */
export const getErrorBoundaryFallback = (error, resetErrorBoundary) => {
  return {
    title: "Something went wrong",
    message: error.message || "An unexpected error occurred",
    action: {
      label: "Try again",
      onClick: resetErrorBoundary,
    },
  };
};

export default {
  APIError,
  ValidationError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  getErrorMessage,
  getErrorStatus,
  isAuthError,
  isAuthorizationError,
  isRateLimitError,
  isValidationError,
  isNetworkError,
  getRetryAfter,
  handleAPIError,
  formatValidationErrors,
  createErrorReport,
  asyncErrorHandler,
  getErrorBoundaryFallback,
};
