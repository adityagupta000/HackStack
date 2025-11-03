import { useEffect, useState } from "react";
import axios from "axios";
import logger from "../utils/logger";

/**
 * Custom hook to fetch and manage CSRF token
 * @returns {Object} CSRF state
 */
export const useCSRF = () => {
  const [csrfToken, setCsrfToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchCSRFToken = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl =
          process.env.REACT_APP_API_URL || "http://localhost:5000/api";

        const response = await axios.get(`${apiUrl}/csrf-token`, {
          withCredentials: true,
          timeout: 5000,
        });

        if (mounted && response.data?.csrfToken) {
          setCsrfToken(response.data.csrfToken);

          // Store in sessionStorage for persistence
          sessionStorage.setItem("csrfToken", response.data.csrfToken);

          logger.info("CSRF token fetched successfully");
        }
      } catch (err) {
        if (mounted) {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to fetch CSRF token";
          setError(errorMessage);

          logger.error("CSRF token fetch failed", err, {
            status: err.response?.status,
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Check if token exists in sessionStorage
    const storedToken = sessionStorage.getItem("csrfToken");
    if (storedToken) {
      setCsrfToken(storedToken);
      setLoading(false);
    } else {
      fetchCSRFToken();
    }

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Refresh CSRF token
   */
  const refreshToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl =
        process.env.REACT_APP_API_URL || "http://localhost:5000/api";

      const response = await axios.get(`${apiUrl}/csrf-token`, {
        withCredentials: true,
        timeout: 5000,
      });

      if (response.data?.csrfToken) {
        setCsrfToken(response.data.csrfToken);
        sessionStorage.setItem("csrfToken", response.data.csrfToken);
        logger.info("CSRF token refreshed successfully");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to refresh CSRF token";
      setError(errorMessage);
      logger.error("CSRF token refresh failed", err);
    } finally {
      setLoading(false);
    }
  };

  const clearToken = () => {
    setCsrfToken(null);
    sessionStorage.removeItem("csrfToken");
    logger.info("CSRF token cleared");
  };

  return {
    csrfToken,
    loading,
    error,
    refreshToken,
    clearToken,
  };
};

export default useCSRF;
