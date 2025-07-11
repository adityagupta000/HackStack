import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (message) {
      setShowMessage(true);
      const timer = setTimeout(() => setShowMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // ✅ Client-side validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setEmailError(false);

    if (!validateEmail(email)) {
      setMessage("Invalid email format.");
      setMessageType("error");
      setEmailError(true);
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post("/auth/forgot-password", {
        email,
      });
      setMessage(response.data.message);
      setMessageType("success");
    } catch (error) {
      console.error("Reset password error:", error.response || error);
      const errorMessage =
        error.response?.data?.message || "Something went wrong";

      // ✅ Handle rate limiting errors
      if (error.response?.status === 429) {
        setMessage("You have reached the limit of 1 reset attempts per hour.");
        setMessageType("error");
      } else if (
        errorMessage.toLowerCase().includes("not found") ||
        error.response?.status === 404
      ) {
        setEmailError(true);
        setMessage("Email not found.");
        setMessageType("error");
      } else {
        setMessage(errorMessage);
        setMessageType("error");
      }
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
              messageType === "error" ? "fa-window-close" : "fa-check-circle"
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
            <span style={{ color: "red", marginRight: "5px" }}>Forgot</span>
            <span style={{ color: "#3D85D8" }}>Password?</span>
          </p>
          <p className="text-muted">Enter your email to reset your password</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="floating-label-content mb-4">
            <input
              type="email"
              className={`floating-input form-control ${
                emailError ? "border-danger" : ""
              }`}
              id="email"
              placeholder=" "
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(false);
                setMessage("");
              }}
              required
            />
            <label
              className={`floating-label ${emailError ? "text-danger" : ""}`}
              htmlFor="email"
            >
              Email Address
            </label>
          </div>

          <div className="d-flex justify-content-center">
            <button
              type="submit"
              className="btn btn-outline-dark mb-3 mt-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-3">
          <a href="/login">← Back to Login</a>
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
          .floating-input.border-danger {
            border-color: #dc3545 !important;
          }
          .floating-input.border-danger:focus + .floating-label,
          .floating-input.border-danger:not(:placeholder-shown) + .floating-label {
            color: #dc3545 !important;
          }
          a {
            text-decoration: none;
            font-weight: bold;
            border-bottom: 1px solid transparent;
            transition: border-bottom 0.3s ease-in-out, color 0.3s ease-in-out;
          }
        `}</style>
      </div>
    </div>
  );
};

export default ForgotPassword;
