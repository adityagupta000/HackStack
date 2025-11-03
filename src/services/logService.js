import axios from "axios";

/**
 * Log service for sending logs to backend
 */

class LogService {
  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
    this.queue = [];
    this.maxQueueSize = 100;
    this.flushInterval = 30000; // 30 seconds
    this.isProduction = process.env.NODE_ENV === "production";
  }

  /**
   * Initialize log service
   */
  init() {
    if (this.isProduction) {
      this.startAutoFlush();
      this.setupEventListeners();
    }
  }

  /**
   * Add log to queue
   */
  addLog(log) {
    if (!this.isProduction) return;

    this.queue.push(log);

    // Auto-flush if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Send logs to backend
   */
  async sendLogs(logs) {
    try {
      // Use sendBeacon for reliability
      const blob = new Blob([JSON.stringify({ logs })], {
        type: "application/json",
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(`${this.apiUrl}/logs`, blob);
      } else {
        // Fallback to fetch
        await axios.post(
          `${this.apiUrl}/logs`,
          { logs },
          {
            timeout: 5000,
          }
        );
      }
    } catch (error) {
      // Silently fail - don't want logging to break the app
      console.error("Failed to send logs:", error);
    }
  }

  /**
   * Flush log queue
   */
  flush() {
    if (this.queue.length === 0) return;

    const logsToSend = [...this.queue];
    this.queue = [];
    this.sendLogs(logsToSend);
  }

  /**
   * Start auto-flush interval
   */
  startAutoFlush() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Setup event listeners for flushing
   */
  setupEventListeners() {
    // Flush on page unload
    window.addEventListener("beforeunload", () => {
      this.flush();
    });

    // Flush on visibility change
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.flush();
      }
    });

    // Flush on page hide
    window.addEventListener("pagehide", () => {
      this.flush();
    });
  }
}

// Create singleton instance
const logService = new LogService();

export default logService;

// Also export class for testing
export { LogService };
