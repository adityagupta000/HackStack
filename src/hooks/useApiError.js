import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  handleAPIError,
  isAuthError,
  isRateLimitError,
  getRetryAfter,
} from "../utils/errorHandler";
import toast from "react-hot-toast";
import logger from "../utils/logger";

/**
 * Custom hook for handling API errors consistently
 * @param {Object} options - Error handling options
 * @returns {Function} Error handler function
 */
export const useApiError = (options = {}) => {
  const navigate = useNavigate();

  const {
    redirectOnAuthError = true,
    showToast: defaultShowToast = true,
    onRateLimit = null,
    customHandlers = {},
  } = options;

  /**
   * Handle authentication error
   */
  const handleAuthError = useCallback(
    (error) => {
      logger.warn("Authentication error detected", {
        error: error.message,
        status: error.response?.status,
      });

      toast.error("Session expired. Please login again.");

      // Clear auth data
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");

      if (redirectOnAuthError) {
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1500);
      }
    },
    [navigate, redirectOnAuthError]
  );

  /**
   * Handle rate limit error
   */
  const handleRateLimitError = useCallback(
    (error) => {
      const retryAfter = getRetryAfter(error);

      logger.warn("Rate limit exceeded", {
        retryAfter,
        endpoint: error.config?.url,
      });

      if (onRateLimit) {
        onRateLimit(error, retryAfter);
      } else {
        toast.error(
          `Too many requests. Please try again in ${retryAfter} seconds.`,
          { duration: retryAfter * 1000 }
        );
      }
    },
    [onRateLimit]
  );

  /**
   * Main error handler
   */
  const handleError = useCallback(
    (error, errorOptions = {}) => {
      const {
        showToast = defaultShowToast,
        fallbackMessage = "An error occurred",
        logError = true,
      } = errorOptions;

      // Log error
      if (logError) {
        logger.error("API Error", error, {
          status: error.response?.status,
          endpoint: error.config?.url,
          method: error.config?.method,
        });
      }

      // Handle authentication errors
      if (isAuthError(error)) {
        handleAuthError(error);
        return;
      }

      // Handle rate limiting
      if (isRateLimitError(error)) {
        handleRateLimitError(error);
        return;
      }

      // Use centralized error handler
      handleAPIError(error, {
        showToast,
        fallbackMessage,
        customHandlers,
      });
    },
    [defaultShowToast, handleAuthError, handleRateLimitError, customHandlers]
  );

  return handleError;
};

export default useApiError;
