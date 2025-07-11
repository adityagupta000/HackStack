import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const { accessToken } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (message) {
      setShowMessage(true);
      const timer = setTimeout(() => {
        setShowMessage(false);
        if (messageType === "success") navigate("/login"); 
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, messageType, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setMessageType("error");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/auth/reset-password/${accessToken}`,
        { password }
      );
      setMessage(response.data.message);
      setMessageType("success");
    } catch (error) {
      setMessage(error.response?.data?.message || "Something went wrong");
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
      {/* Toast Notification */}
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

      {/* WHITE FORM CONTAINER */}
      <div
        className="login-container d-flex flex-column p-4 p-md-5 border rounded"
        style={{ maxWidth: "400px", width: "100%", backgroundColor: "white" }}
      >
        {/* Title */}
        <div className="text-center mb-4">
          <p style={{ fontSize: "18px" }}>
            <span style={{ color: "red", marginRight: "5px" }}>Reset</span>
            <span style={{ color: "#3D85D8" }}>Password</span>
          </p>
          <p className="text-muted">Enter your new password below</p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="floating-label-content mb-4">
            <input
              type="password"
              className="floating-input form-control"
              id="password"
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label className="floating-label" htmlFor="password">
              New Password
            </label>
          </div>

          <div className="floating-label-content mb-4">
            <input
              type="password"
              className="floating-input form-control"
              id="confirmPassword"
              placeholder=" "
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <label className="floating-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
          </div>

          <div className="d-flex justify-content-center">
            <button
              type="submit"
              className="btn btn-outline-danger mb-3 mt-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-3">
          <a href="/login">← Back to Login</a>
        </div>

        {/* STYLES */}
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
            font-weight: bold;
            border-bottom: 1px solid transparent;
            transition: border-bottom 0.3s ease-in-out, color 0.3s ease-in-out;
          }
        `}</style>
      </div>
    </div>
  );
};

export default ResetPassword;
