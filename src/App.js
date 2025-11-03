import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import axiosInstance, { setCSRFToken } from "./utils/axiosInstance";
import { useCSRF } from "./hooks/useCSRF";
import logger from "./utils/logger";
import { detectClickjacking } from "./config/security";

import Footer from "./pages/Footer.jsx";
import Home from "./components/Home";
import Login from "./pages/Login";
import About from "./pages/About.js";
import Register from "./pages/Register.jsx";
import AdminPanel from "./components/AdminPanel";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserDashboard from "./components/UserDashboard";
import VerifyPage from "./pages/VerifyPage";

// ==============================
// CSRF Token Hook Component
// ==============================
const CSRFTokenInitializer = () => {
  const { csrfToken, loading, error } = useCSRF();

  useEffect(() => {
    if (csrfToken) {
      setCSRFToken(csrfToken);
      logger.debug("CSRF token initialized from hook");
    }
  }, [csrfToken]);

  useEffect(() => {
    if (error) {
      logger.error("CSRF token initialization failed", new Error(error));
    }
  }, [error]);

  return null; // This component doesn't render anything
};

// ==============================
// PrivateRoute Component
// ==============================
const PrivateRoute = ({ element, allowedRole }) => {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Check sessionStorage for role (non-sensitive data)
      let role = sessionStorage.getItem("userRole");

      // If we have role in sessionStorage, user is likely authenticated
      if (role) {
        if (role === allowedRole) {
          setIsAllowed(true);
          setLoading(false);
          logger.info("Private route access granted from sessionStorage", {
            role,
          });
          return;
        } else {
          setIsAllowed(false);
          setLoading(false);
          logger.warn("Private route access denied - wrong role", {
            expectedRole: allowedRole,
            actualRole: role,
          });
          return;
        }
      }

      try {
        logger.debug("Attempting token verification in PrivateRoute");

        // Call a verify endpoint that checks the httpOnly cookie
        const res = await axios.get(
          "http://localhost:5000/api/protected/verify-token",
          {
            withCredentials: true,
            timeout: 5000,
          }
        );

        role = res.data.role;

        sessionStorage.setItem("userRole", role);
        sessionStorage.setItem("userId", res.data.user.id);
        sessionStorage.setItem("userName", res.data.user.name);

        logger.info("Token verified successfully in PrivateRoute", { role });

        if (role === allowedRole) {
          setIsAllowed(true);
          logger.info("Private route access granted after verification", {
            role,
          });
        } else {
          setIsAllowed(false);
          logger.warn(
            "Private route access denied after verification - wrong role",
            {
              expectedRole: allowedRole,
              actualRole: role,
            }
          );
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          logger.debug("No valid authentication - user must login");
        } else {
          logger.warn("Token verification failed in PrivateRoute", {
            error: err.message,
            status: err.response?.status,
          });
        }

        sessionStorage.removeItem("userRole");
        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("userName");
        setIsAllowed(false);
      }

      setLoading(false);
    };

    checkAuth();
  }, [allowedRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: window.location.pathname }}
      />
    );
  }

  return element;
};

// ==============================
// Conditional Footer
// ==============================
function ConditionalFooter() {
  const location = useLocation();
  const noFooterPaths = [
    "/login",
    "/register",
    "/admin",
    "/about",
    "/forgot-password",
    "/my-events",
    "/verify",
  ];

  const hideFooter =
    noFooterPaths.includes(location.pathname) ||
    location.pathname.startsWith("/reset-password");

  return hideFooter ? null : <Footer />;
}

// ==============================
// App Component
// ==============================
function App() {
  useEffect(() => {
    const initializeApp = async () => {
      // Check for clickjacking
      if (detectClickjacking()) {
        logger.error("Clickjacking detected - app loaded in iframe");
        // Optionally break out of iframe
        if (window.top !== window.self) {
          window.top.location = window.self.location;
        }
      }

      // Log user info
      const userId = localStorage.getItem("userId");
      if (userId) {
        logger.setUserId(userId);
      }

      // Fetch fresh CSRF token on app start
      try {
        const response = await axios.get(
          "http://localhost:5000/api/csrf-token",
          {
            withCredentials: true,
            timeout: 5000,
          }
        );

        if (response.data?.csrfToken) {
          sessionStorage.setItem("csrfToken", response.data.csrfToken);
          setCSRFToken(response.data.csrfToken);
          logger.info("Fresh CSRF token fetched on app initialization");
        }
      } catch (err) {
        logger.debug("Failed to fetch initial CSRF token", {
          error: err.message,
        });
        // Not critical - the CSRFTokenInitializer hook will handle it
      }

      // Initial token refresh attempt - ONLY if user has a token
      const accessToken = localStorage.getItem("accessToken");

      if (accessToken) {
        try {
          const res = await axios.post(
            "http://localhost:5000/api/auth/refreshToken",
            null,
            { withCredentials: true, timeout: 5000 }
          );
          localStorage.setItem("accessToken", res.data.accessToken);
          localStorage.setItem("role", res.data.role);

          logger.info("Initial token refresh successful");
        } catch (err) {
          // 403 means no valid refresh token - user needs to login
          if (err.response?.status === 403) {
            logger.debug(
              "No valid refresh token on app start - user needs to login"
            );
          } else {
            logger.debug("Token refresh failed", { error: err.message });
          }
          // Token expired or invalid, clean up
          localStorage.removeItem("accessToken");
          localStorage.removeItem("role");
          localStorage.removeItem("userId");
        }
      }
      // If no accessToken, do nothing - user is not logged in
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      logger.info("App component unmounting");
    };
  }, []);

  return (
    <Router>
      <CSRFTokenInitializer />
      <div className="App d-flex flex-column min-vh-100">
        <div className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify/:token" element={<VerifyPage />} />
            <Route
              path="/admin"
              element={
                <PrivateRoute element={<AdminPanel />} allowedRole="admin" />
              }
            />
            <Route
              path="/my-events"
              element={
                <PrivateRoute element={<UserDashboard />} allowedRole="user" />
              }
            />
            <Route path="/home" element={<Home />} />
          </Routes>
        </div>
        <ConditionalFooter />
      </div>
    </Router>
  );
}

export default App;
