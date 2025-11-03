import axiosInstance from "../utils/axiosInstance";
import { sanitizeInput, deepSanitize } from "../utils/sanitize";
import logger from "../utils/logger";

/**
 * Centralized API service
 */

class APIService {
  /**
   * Generic GET request
   */
  async get(url, config = {}) {
    try {
      const startTime = Date.now();
      const response = await axiosInstance.get(url, config);
      const duration = Date.now() - startTime;

      logger.api("GET", url, response.status, duration);

      return response.data;
    } catch (error) {
      logger.error("GET request failed", error, { url });
      throw error;
    }
  }

  /**
   * Generic POST request with data sanitization
   */
  async post(url, data = {}, config = {}) {
    try {
      // Sanitize data before sending
      const sanitizedData = deepSanitize(data);

      const startTime = Date.now();
      const response = await axiosInstance.post(url, sanitizedData, config);
      const duration = Date.now() - startTime;

      logger.api("POST", url, response.status, duration);

      return response.data;
    } catch (error) {
      logger.error("POST request failed", error, { url });
      throw error;
    }
  }

  /**
   * Generic PUT request with data sanitization
   */
  async put(url, data = {}, config = {}) {
    try {
      const sanitizedData = deepSanitize(data);

      const startTime = Date.now();
      const response = await axiosInstance.put(url, sanitizedData, config);
      const duration = Date.now() - startTime;

      logger.api("PUT", url, response.status, duration);

      return response.data;
    } catch (error) {
      logger.error("PUT request failed", error, { url });
      throw error;
    }
  }

  /**
   * Generic DELETE request
   */
  async delete(url, config = {}) {
    try {
      const startTime = Date.now();
      const response = await axiosInstance.delete(url, config);
      const duration = Date.now() - startTime;

      logger.api("DELETE", url, response.status, duration);

      return response.data;
    } catch (error) {
      logger.error("DELETE request failed", error, { url });
      throw error;
    }
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile(url, file, onProgress = null, additionalData = {}) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Add additional data
      Object.keys(additionalData).forEach((key) => {
        if (additionalData[key] !== undefined && additionalData[key] !== null) {
          formData.append(key, additionalData[key]);
        }
      });

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      };

      const startTime = Date.now();
      const response = await axiosInstance.post(url, formData, config);
      const duration = Date.now() - startTime;

      logger.api("UPLOAD", url, response.status, duration, {
        fileSize: file.size,
        fileName: file.name,
      });

      return response.data;
    } catch (error) {
      logger.error("File upload failed", error, { url, fileName: file.name });
      throw error;
    }
  }

  /**
   * Download file
   */
  async downloadFile(url, filename = "download") {
    try {
      const startTime = Date.now();
      const response = await axiosInstance.get(url, {
        responseType: "blob",
      });
      const duration = Date.now() - startTime;

      logger.api("DOWNLOAD", url, response.status, duration);

      // Create blob link to download
      const blob = new Blob([response.data]);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();

      // Clean up
      window.URL.revokeObjectURL(link.href);

      return response.data;
    } catch (error) {
      logger.error("File download failed", error, { url });
      throw error;
    }
  }
}

// Create singleton instance
const apiService = new APIService();

export default apiService;

// Also export class for testing
export { APIService };
