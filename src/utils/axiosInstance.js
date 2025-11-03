import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import logger from "./logger";
import { clearAuthData } from "../config/security"; 
import { handleAPIError, isRateLimitError } from "./errorHandler";

// FIXED: Use environment variable for API URL
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue = [];

// CSRF token storage
let csrfToken = null;

/**
 * Set CSRF token for all requests
 */
export const setCSRFToken = (token) => {
  csrfToken = token;
  // CRITICAL FIX: Set the token in axios defaults immediately
  if (token) {
    axiosInstance.defaults.headers.common["x-csrf-token"] = token;
  }
  logger.info("CSRF token set");
};

/**
 * Get current CSRF token
 */
export const getCSRFToken = () => {
  return csrfToken || sessionStorage.getItem("csrfToken");
};

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// REQUEST INTERCEPTOR: Attach token, CSRF token, and request ID
axiosInstance.interceptors.request.use(
  (config) => {
    const startTime = Date.now();
    config.metadata = { startTime };

    const currentCsrfToken = csrfToken || sessionStorage.getItem("csrfToken");

    if (
      currentCsrfToken &&
      config.method !== "get" &&
      config.method !== "head" &&
      config.method !== "options"
    ) {
      // Set it on this specific request
      config.headers["x-csrf-token"] = currentCsrfToken;
    }

    // Add unique request ID
    const requestId = uuidv4();
    config.headers["x-Request-Id"] = requestId;
    config.metadata.requestId = requestId;

    config.withCredentials = true;

    // Log request in development
    if (process.env.NODE_ENV === "development") {
      logger.debug("API Request", {
        method: config.method?.toUpperCase(),
        url: config.url,
        requestId,
        csrfToken: currentCsrfToken ? "present" : "missing",
      });
    }

    return config;
  },
  (error) => {
    logger.error("Request interceptor error", error);
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: Handle errors, rate limiting, and refresh tokens
axiosInstance.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = Date.now() - response.config.metadata.startTime;
    const requestId = response.config.metadata.requestId;

    // Log slow requests (>3 seconds)
    if (duration > 3000) {
      logger.warn("Slow API request", {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        duration,
        status: response.status,
        requestId,
      });
    }

    // Log API call
    logger.api(
      response.config.method?.toUpperCase(),
      response.config.url,
      response.status,
      duration,
      { requestId }
    );

    // Check for security headers in development
    if (process.env.NODE_ENV === "development") {
      const securityHeaders = [
        "x-content-type-options",
        "x-frame-options",
        "strict-transport-security",
      ];

      const missingHeaders = securityHeaders.filter(
        (header) => !response.headers[header]
      );

      if (missingHeaders.length > 0) {
        logger.warn("Missing security headers", {
          missingHeaders,
          url: response.config.url,
        });
      }
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // CRITICAL FIX: Handle CSRF token errors specifically
    if (
      error.response?.status === 403 &&
      error.response?.data?.message === "invalid csrf token"
    ) {
      logger.warn("Invalid CSRF token detected, attempting to refresh");

      try {
        // Fetch a new CSRF token
        const csrfResponse = await axios.get(`${API_URL}/csrf-token`, {
          withCredentials: true,
        });

        if (csrfResponse.data?.csrfToken) {
          const newToken = csrfResponse.data.csrfToken;
          setCSRFToken(newToken);
          sessionStorage.setItem("csrfToken", newToken);

          // Retry the original request with the new token
          originalRequest.headers["x-csrf-token"] = newToken;
          return axiosInstance(originalRequest);
        }
      } catch (csrfError) {
        logger.error("Failed to refresh CSRF token", csrfError);
        return Promise.reject(error);
      }
    }

    // Log error
    if (error.response) {
      const duration = Date.now() - (originalRequest?.metadata?.startTime || 0);
      logger.error("API Error", error, {
        method: originalRequest?.method?.toUpperCase(),
        url: originalRequest?.url,
        status: error.response.status,
        duration,
        requestId: originalRequest?.metadata?.requestId,
      });
    } else if (error.request) {
      logger.error("Network Error - No response received", error);
    } else {
      logger.error("Request configuration error", error);
    }

    // Handle rate limiting (429)
    if (isRateLimitError(error)) {
      const retryAfter = error.response?.headers["retry-after"];
      logger.warn("Rate limit hit", {
        retryAfter,
        url: originalRequest?.url,
      });

      // Don't retry, just reject
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/register") &&
      !originalRequest.url.includes("/auth/refreshToken")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(axiosInstance(originalRequest)), // No token needed
            reject: (err) => reject(err),
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshURL = process.env.REACT_APP_API_URL
          ? `${process.env.REACT_APP_API_URL}/auth/refreshToken`
          : "http://localhost:5000/api/auth/refreshToken";

        // No need to handle response data - cookies are set automatically
        await axios.post(refreshURL, null, {
          withCredentials: true,
          timeout: 5000,
        });

        logger.info("Token refreshed successfully");

        processQueue(null); // No token to pass
        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err);
        logger.error("Token refresh failed", err);

        // Clear any client-side data
        clearAuthData();

        // Redirect to login
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Initialize CSRF token from sessionStorage on load
const storedToken = sessionStorage.getItem("csrfToken");
if (storedToken) {
  setCSRFToken(storedToken);
}

export default axiosInstance;
