import React from "react";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { validateEnv } from "./config/validateEnv";
import logger from "./utils/logger";
import logService from "./services/logService";
import { Toaster } from "react-hot-toast";

// Import createRoot from "react-dom/client"
import { createRoot } from "react-dom/client";

// Validate environment variables before starting the app
try {
  validateEnv();
} catch (error) {
  console.error("Environment validation failed:", error);
  // Show error to user
  document.body.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f3f4f6;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 20px;
    ">
      <div style="
        max-width: 600px;
        background: white;
        padding: 40px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      ">
        <h1 style="color: #dc2626; margin-bottom: 16px;">Configuration Error</h1>
        <p style="color: #6b7280; margin-bottom: 20px;">
          The application is not properly configured. Please check the console for details.
        </p>
        <pre style="
          background: #f9fafb;
          padding: 16px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
          color: #374151;
        ">${error.message}</pre>
      </div>
    </div>
  `;
  throw error;
}

// Initialize log service
logService.init();

// Log application start
logger.info("Application starting", {
  environment: process.env.NODE_ENV,
  version: process.env.REACT_APP_VERSION || "1.0.0",
});

// Global error handler for uncaught errors
window.addEventListener("error", (event) => {
  logger.error("Uncaught error", event.error, {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

// Global handler for unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  logger.error("Unhandled promise rejection", event.reason, {
    promise: event.promise,
  });
  event.preventDefault(); // Prevent default browser behavior
});

// Performance monitoring
if (window.performance && window.performance.timing) {
  window.addEventListener("load", () => {
    setTimeout(() => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const connectTime = perfData.responseEnd - perfData.requestStart;
      const renderTime = perfData.domComplete - perfData.domLoading;

      logger.performance("Page Load", pageLoadTime, {
        connectTime,
        renderTime,
      });
    }, 0);
  });
}

// Get root element
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

// Create root
const root = createRoot(rootElement);

// Render app with error boundary
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
        {/* Global toast container */}
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Log successful render
logger.info("Application rendered successfully");

// Service worker registration (optional)
if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        logger.info("Service Worker registered", {
          scope: registration.scope,
        });
      })
      .catch((error) => {
        logger.error("Service Worker registration failed", error);
      });
  });
}
