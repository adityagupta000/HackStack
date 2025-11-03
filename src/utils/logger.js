/**
 * Frontend logging utility
 * Sends logs to backend and console
 */

class Logger {
  constructor() {
    this.userId = null;
    this.sessionId = this.generateSessionId();
    this.logQueue = [];
    this.maxQueueSize = 50;
    this.flushInterval = 30000; // 30 seconds
    this.isDevelopment = process.env.NODE_ENV === "development";

    // Start auto-flush interval
    if (!this.isDevelopment) {
      this.startAutoFlush();
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Set user ID for logging context
   */
  setUserId(userId) {
    this.userId = userId;
  }

  /**
   * Clear user ID (on logout)
   */
  clearUserId() {
    this.userId = null;
  }

  /**
   * Create log entry
   */
  createLogEntry(level, message, metadata = {}) {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      pathname: window.location.pathname,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      ...metadata,
    };
  }

  /**
   * Add log to queue
   */
  addToQueue(logEntry) {
    this.logQueue.push(logEntry);

    // Auto-flush if queue is full
    if (this.logQueue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Send logs to backend
   */
  async sendLogs(logs) {
    if (this.isDevelopment) {
      return; // Don't send logs in development
    }

    try {
      // Use sendBeacon for reliability (works even when page is closing)
      const blob = new Blob([JSON.stringify({ logs })], {
        type: "application/json",
      });

      if (navigator.sendBeacon) {
        const apiUrl =
          process.env.REACT_APP_API_URL || "http://localhost:5000/api";
        navigator.sendBeacon(`${apiUrl}/logs`, blob);
      } else {
        // Fallback to fetch for older browsers
        await fetch(
          `${
            process.env.REACT_APP_API_URL || "http://localhost:5000/api"
          }/logs`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ logs }),
            keepalive: true,
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
    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];
    this.sendLogs(logsToSend);
  }

  /**
   * Start auto-flush interval
   */
  startAutoFlush() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Flush on page unload
    window.addEventListener("beforeunload", () => {
      this.flush();
    });

    // Flush on visibility change (tab switching)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.flush();
      }
    });
  }

  /**
   * Log info message
   */
  info(message, metadata = {}) {
    const logEntry = this.createLogEntry("info", message, metadata);

    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, metadata);
    }

    this.addToQueue(logEntry);
  }

  /**
   * Log warning message
   */
  warn(message, metadata = {}) {
    const logEntry = this.createLogEntry("warn", message, metadata);

    console.warn(`[WARN] ${message}`, metadata);
    this.addToQueue(logEntry);
  }

  /**
   * Log error message
   */
  error(message, error = null, metadata = {}) {
    const errorData = error
      ? {
          errorMessage: error.message,
          errorName: error.name,
          errorStack: error.stack,
          errorStatus: error.response?.status,
        }
      : {};

    const logEntry = this.createLogEntry("error", message, {
      ...errorData,
      ...metadata,
    });

    console.error(`[ERROR] ${message}`, error, metadata);
    this.addToQueue(logEntry);

    // Immediately flush errors
    if (!this.isDevelopment) {
      this.flush();
    }
  }

  /**
   * Log debug message (only in development)
   */
  debug(message, metadata = {}) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, metadata);
    }
  }

  /**
   * Log user action
   */
  action(actionName, metadata = {}) {
    const logEntry = this.createLogEntry("action", actionName, {
      actionType: "user_action",
      ...metadata,
    });

    if (this.isDevelopment) {
      console.log(`[ACTION] ${actionName}`, metadata);
    }

    this.addToQueue(logEntry);
  }

  /**
   * Log performance metric
   */
  performance(metricName, value, metadata = {}) {
    const logEntry = this.createLogEntry("performance", metricName, {
      metricValue: value,
      ...metadata,
    });

    if (this.isDevelopment) {
      console.log(`[PERFORMANCE] ${metricName}: ${value}`, metadata);
    }

    this.addToQueue(logEntry);
  }

  /**
   * Log API call
   */
  api(method, url, status, duration, metadata = {}) {
    const logEntry = this.createLogEntry("api", `${method} ${url}`, {
      method,
      url,
      status,
      duration,
      ...metadata,
    });

    if (this.isDevelopment) {
      console.log(
        `[API] ${method} ${url} - ${status} (${duration}ms)`,
        metadata
      );
    }

    // Only log failed requests or slow requests (>3s)
    if (status >= 400 || duration > 3000) {
      this.addToQueue(logEntry);
    }
  }

  /**
   * Log navigation
   */
  navigation(from, to, metadata = {}) {
    const logEntry = this.createLogEntry("navigation", `${from} -> ${to}`, {
      from,
      to,
      ...metadata,
    });

    if (this.isDevelopment) {
      console.log(`[NAVIGATION] ${from} -> ${to}`, metadata);
    }

    this.addToQueue(logEntry);
  }
}

// Create singleton instance
const logger = new Logger();

// Export singleton
export default logger;

// Also export class for testing
export { Logger };
