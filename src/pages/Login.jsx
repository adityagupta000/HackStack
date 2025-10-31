import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();

  const savedEmail = localStorage.getItem("savedEmail") || "";

  const [formData, setFormData] = useState({
    email: savedEmail,
    password: "", // Never pre-fill password
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
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await axiosInstance.post("/auth/login", formData, {
        withCredentials: true,
      });

      saveAuth(response.data.accessToken, response.data.role);

      // FIXED: Only save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem("savedEmail", formData.email);
      } else {
        localStorage.removeItem("savedEmail");
      }

      setMessage("Login successful");
      setAttempts(0);
      setMessageType("success");
      setFormData({ email: formData.email, password: "" });

      setTimeout(() => {
        setLoading(false);
        navigate(response.data.role === "admin" ? "/admin" : "/home");
      }, 1500);
    } catch (error) {
      setAttempts((prevAttempts) => prevAttempts + 1);

      if (error.response?.status === 429) {
        const retryAfter = error.response.headers["retry-after"] || 300;
        setLockoutTime(retryAfter);
        setMessage(`Too many attempts. Try again in ${retryAfter} seconds.`);
      } else if (attempts + 1 >= 3) {
        setMessage(
          "Too many failed attempts. Please register or reset password."
        );
      } else {
        setMessage(
          error.response?.data?.message ||
            "Invalid credentials. Please try again."
        );
      }

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container-fluid d-flex flex-column justify-content-center align-items-center"
      style={{ minHeight: "100vh", backgroundColor: "black", padding: "20px" }}
    >
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
        style={{ maxWidth: "400px", width: "100%", backgroundColor: "white" }}
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
          background: #fff;
          transition: 0.2s ease all;
          color: #3D85D8;
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
