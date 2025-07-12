import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import axiosInstance from "./utils/axiosInstance";

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
// PrivateRoute Component
// ==============================
const PrivateRoute = ({ element, allowedRole }) => {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      const role = localStorage.getItem("role");

      if (!accessToken && refreshToken) {
        // Try to refresh token
        try {
          const res = await axiosInstance.post("/auth/refreshToken", {
            refreshToken,
          });
          localStorage.setItem("accessToken", res.data.accessToken);
        } catch (err) {
          console.error("Refresh token invalid. Logging out.");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("role");
          setIsAllowed(false);
          setLoading(false);
          return;
        }
      }

      // After possible refresh, validate again
      const newAccessToken = localStorage.getItem("accessToken");
      const newRole = localStorage.getItem("role");

      if (newAccessToken && newRole === allowedRole) {
        setIsAllowed(true);
      } else {
        setIsAllowed(false);
      }

      setLoading(false);
    };

    checkAuth();
  }, [allowedRole]);

  if (loading) return <div>Loading...</div>;

  return isAllowed ? element : <Navigate to="/login" replace />;
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
    const refreshToken = localStorage.getItem("refreshToken");
    const accessToken = localStorage.getItem("accessToken");

    // Optional pre-emptive refresh on load
    const tryRefresh = async () => {
      if (!accessToken && refreshToken) {
        try {
          const res = await axiosInstance.post("/auth/refreshToken", {
            refreshToken,
          });
          localStorage.setItem("accessToken", res.data.accessToken);
        } catch (err) {
          console.warn("Token refresh on load failed.");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("role");
        }
      }
    };
    tryRefresh();
  }, []);

  return (
    <Router>
      <div className="App d-flex flex-column min-vh-100">
        <div className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Login />} /> {/* Default page */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/reset-password/:accessToken"
              element={<ResetPassword />}
            />
            <Route path="/verify/:token" element={<VerifyPage />} />
            <Route
              path="/admin"
              element={
                <PrivateRoute element={<AdminPanel />} allowedRole="admin" />
              }
            />
            <Route path="/my-events" element={<UserDashboard />} />
            <Route path="/home" element={<Home />} /> {/* Optional */}
          </Routes>
        </div>
        <ConditionalFooter />
      </div>
    </Router>
  );
}

export default App;
