import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sanitizeInput } from "../utils/sanitize";
import { validateEmail } from "../utils/validation";
import { handleAPIError, isRateLimitError } from "../utils/errorHandler";
import logger from "../utils/logger";
import { ClientRateLimiter } from "../config/security";
import toast from "react-hot-toast";


const loginLimiter = new ClientRateLimiter(5, 5 * 60 * 1000); 
const Login = () => {
  const navigate = useNavigate();
  const savedEmail = localStorage.getItem("savedEmail") || "";

  const [formData, setFormData] = useState({
    email: savedEmail,
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(savedEmail !== "");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { saveAuth } = useAuth();

  useEffect(() => {
    if (message) {
      setShowMessage(true);
      const timer = setTimeout(() => setShowMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (lockoutTime > 0) {
      const interval = setInterval(() => {
        setLockoutTime((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTime]);

  const handleChange = (e) => {
    const { id, value } = e.target;

    const sanitizedValue = id === "email" ? sanitizeInput(value) : value;

    setFormData({ ...formData, [id]: sanitizedValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();


    const clientId = `login_${formData.email}`;
    if (!loginLimiter.isAllowed(clientId)) {
      const timeUntilReset = Math.ceil(
        loginLimiter.getTimeUntilReset(clientId) / 1000
      );
      setMessage(
        `Too many attempts. Please try again in ${timeUntilReset} seconds.`
      );
      setMessageType("error");
      setLockoutTime(timeUntilReset);
      return;
    }

    const sanitizedEmail = sanitizeInput(formData.email.trim());
    if (!validateEmail(sanitizedEmail)) {
      setMessage("Please enter a valid email address");
      setMessageType("error");
      logger.warn("Invalid email format attempted", { email: sanitizedEmail });
      return;
    }

    if (!formData.password || formData.password.length < 8) {
      setMessage("Password must be at least 8 characters");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axiosInstance.post(
        "/auth/login",
        {
          email: sanitizedEmail,
          password: formData.password,
        },
        {
          withCredentials: true,
        }
      );

    
      if (response.data.user?.id) {
        localStorage.setItem("userId", response.data.user.id);
        localStorage.setItem("userRole", response.data.role);
        localStorage.setItem("userName", response.data.user.name);
        logger.setUserId(response.data.user.id);
      }

      if (rememberMe) {
        localStorage.setItem("savedEmail", sanitizedEmail);
      } else {
        localStorage.removeItem("savedEmail");
      }

      setMessage("Login successful");
      setAttempts(0);
      setMessageType("success");
      setFormData({ email: formData.email, password: "" });

      loginLimiter.reset(clientId);

      logger.info("Login successful", {
        email: sanitizedEmail,
        role: response.data.role,
      });

      logger.action("user_login", {
        email: sanitizedEmail,
        role: response.data.role,
      });

      setTimeout(() => {
        setLoading(false);
        navigate(response.data.role === "admin" ? "/admin" : "/home");
      }, 1500);
    } catch (error) {
      setAttempts((prevAttempts) => prevAttempts + 1);

    
      if (isRateLimitError(error)) {
        const retryAfter = error.response?.headers["retry-after"] || 300;
        setLockoutTime(retryAfter);
        setMessage(`Too many attempts. Try again in ${retryAfter} seconds.`);
        setMessageType("error");

        logger.warn("Server rate limit hit", {
          email: sanitizedEmail,
          retryAfter,
        });
      } else {
      
        const errorMessage =
          error.response?.data?.message ||
          "Invalid credentials. Please try again.";

        setMessage(errorMessage);
        setMessageType("error");

        logger.warn("Login failed", {
          email: sanitizedEmail,
          attempts: attempts + 1,
          error: errorMessage,
        });

        if (attempts + 1 >= 3) {
          setMessage(
            "Too many failed attempts. Please register or reset password."
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container-fluid d-flex flex-column justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Cosmic Background Animation */}
      <div className="cosmic-background"></div>

      {showMessage && (
        <div
          className={`toast-message ${messageType}`}
          style={{
            position: "absolute",
            top: "20px",
            padding: "12px 20px",
            borderRadius: "8px",
            color: "white",
            fontWeight: "bold",
            transition: "opacity 0.5s ease-in-out",
            opacity: showMessage ? 1 : 0,
            zIndex: 1000,
            backgroundColor: messageType === "error" ? "#ff4d4d" : "#28a745",
            boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <i
            className={`fa ${
              messageType === "error" ? "fa-times-circle" : "fa-check-circle"
            }`}
            style={{ fontSize: "18px" }}
          ></i>
          {message}
        </div>
      )}

      <div
        className="login-container d-flex flex-column p-4 p-md-5 border rounded"
        style={{
          maxWidth: "400px",
          width: "100%",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          zIndex: 10,
          position: "relative",
          boxShadow: "none",
        }}
      >
        <div className="text-center mb-4">
          <p style={{ fontSize: "18px" }}>
            <span style={{ color: "red", marginRight: "5px" }}>Sign</span>
            <span style={{ color: "#3D85D8" }}>In</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="floating-label-content mb-3">
            <input
              className="floating-input form-control"
              type="email"
              id="email"
              placeholder=" "
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              maxLength={255}
            />
            <label className="floating-label" htmlFor="email">
              Email address
            </label>
          </div>

          <div className="floating-label-content mb-3">
            <input
              className="floating-input form-control"
              type="password"
              id="password"
              placeholder=" "
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              minLength={8}
              maxLength={128}
            />
            <label className="floating-label" htmlFor="password">
              Password
            </label>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3 mt-4">
            <div className="form-check">
              <input
                className="form-check-input border-primary"
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label
                className="form-check-label"
                style={{ color: "black" }}
                htmlFor="rememberMe"
              >
                Remember me
              </label>
            </div>
            <a href="/forgot-password">Forgot password?</a>
          </div>

          <div className="d-flex justify-content-center">
            <button
              type="submit"
              className="btn btn-outline-dark mb-3 mt-3 d-flex align-items-center"
              disabled={lockoutTime > 0 || loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Signing in...
                </>
              ) : lockoutTime > 0 ? (
                `Try again in ${lockoutTime}s`
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>

        <p className="text-center mt-3" style={{ color: "black" }}>
          Not a member? <a href="/register">Register</a>
        </p>
      </div>
      <style>{`
        .cosmic-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #000000;
          z-index: 1;
        }

        .cosmic-background::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 200%;
          height: 200%;
          background-image: 
            radial-gradient(2px 2px at 20px 30px, white, transparent),
            radial-gradient(2px 2px at 60px 70px, white, transparent),
            radial-gradient(1px 1px at 50px 50px, white, transparent),
            radial-gradient(1px 1px at 130px 80px, white, transparent),
            radial-gradient(2px 2px at 90px 10px, white, transparent),
            radial-gradient(1px 1px at 110px 120px, white, transparent),
            radial-gradient(1px 1px at 150px 60px, white, transparent),
            radial-gradient(2px 2px at 180px 90px, white, transparent);
          background-size: 200px 200px;
          background-repeat: repeat;
          animation: twinkle 5s ease-in-out infinite, starsMove 60s linear infinite;
          opacity: 0.9;
        }

        .cosmic-background::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 60% 70%, rgba(255, 255, 255, 0.04) 0%, transparent 50%),
            radial-gradient(circle at 80% 10%, rgba(255, 255, 255, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.04) 0%, transparent 50%);
          animation: drift 20s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes starsMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-50%, -50%); }
        }

        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }

        .floating-label-content {
          position: relative;
        }
        .floating-label {
          font-size: 13px;
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          padding: 0 4px;
          background: rgba(255, 255, 255, 0.95);
          transition: 0.2s ease all;
          color: #3D85D8;
          pointer-events: none;
        }
        .floating-input {
          font-size: 14px;
          display: block;
          width: 100%;
          height: 36px;
          padding: 0 20px;
          background: #fff;
          color: black;
          border: 1px solid #3D85D8;
          border-radius: 5px;
          box-sizing: border-box;
        }
        .floating-input:focus + .floating-label,
        .floating-input:not(:placeholder-shown) + .floating-label {
          top: -2px;
          left: 10px;
          font-size: 12px;
          color: #3D85D8;
        }
        a {
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-bottom 0.3s ease-in-out, color 0.3s ease-in-out;
        }
        a:hover {
          color: blue;
          border-bottom: 1px solid red;
        }
      `}</style>
    </div>
  );
};

export default Login;
