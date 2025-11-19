import React, { useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { sanitizeInput } from "../utils/sanitize";
import { validateEmail } from "../utils/validation";
import { handleAPIError, isRateLimitError } from "../utils/errorHandler";
import logger from "../utils/logger";
import { ClientRateLimiter } from "../config/security";
import toast from "react-hot-toast";

// Client-side rate limiter - 3 attempts per hour
const forgotPasswordLimiter = new ClientRateLimiter(3, 60 * 60 * 1000);

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());

    if (!validateEmail(sanitizedEmail)) {
      setError("Please enter a valid email address");
      logger.warn("Invalid email in forgot password", {
        email: sanitizedEmail,
      });
      return;
    }

    const rateLimitKey = `forgot_password_${sanitizedEmail}`;
    if (!forgotPasswordLimiter.isAllowed(rateLimitKey)) {
      const timeUntilReset = Math.ceil(
        forgotPasswordLimiter.getTimeUntilReset(rateLimitKey) / 1000 / 60
      );
      setError(
        `Too many attempts. Please try again in ${timeUntilReset} minutes.`
      );
      logger.warn("Forgot password rate limit hit (client-side)", {
        email: sanitizedEmail,
      });
      return;
    }

    setLoading(true);

    try {
      await axiosInstance.post("/auth/forgot-password", {
        email: sanitizedEmail,
      });

      setSubmitted(true);
      logger.info("Password reset email sent", { email: sanitizedEmail });
      logger.action("password_reset_requested", { email: sanitizedEmail });

      toast.success(
        "If your email is registered, you will receive a password reset link."
      );
    } catch (error) {
      if (isRateLimitError(error)) {
        const retryAfter = error.response?.headers["retry-after"];
        setError(
          `Too many requests. Please try again in ${
            retryAfter ? Math.ceil(retryAfter / 60) : 60
          } minutes.`
        );
        logger.warn("Forgot password rate limit hit (server-side)", {
          email: sanitizedEmail,
          retryAfter,
        });
      } else {
        setSubmitted(true);
        logger.error("Forgot password error", error, { email: sanitizedEmail });
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
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

        <div
          className="success-container d-flex flex-column p-4 p-md-5 border rounded"
          style={{
            maxWidth: "450px",
            width: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            zIndex: 10,
            position: "relative",
            boxShadow: "none",
          }}
        >
          <div className="text-center">
            <div
              style={{
                margin: "0 auto 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "60px",
                width: "60px",
                borderRadius: "50%",
                backgroundColor: "#d4edda",
              }}
            >
              <i
                className="fa fa-envelope"
                style={{ fontSize: "28px", color: "#28a745" }}
              ></i>
            </div>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "black",
                marginBottom: "16px",
              }}
            >
              Check Your Email
            </h2>
            <p
              style={{
                color: "#6c757d",
                marginBottom: "24px",
                fontSize: "14px",
              }}
            >
              If your email is registered with us, you will receive a password
              reset link shortly. Please check your inbox and spam folder.
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "#6c757d",
                marginBottom: "24px",
              }}
            >
              The link will expire in 10 minutes for security reasons.
            </p>
            <a
              href="/login"
              className="btn btn-outline-dark d-inline-block"
              style={{ padding: "10px 24px", textDecoration: "none" }}
            >
              Back to Login
            </a>
          </div>
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
        `}</style>
      </div>
    );
  }

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

      <div
        className="forgot-password-container d-flex flex-column p-4 p-md-5 border rounded"
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
            <span style={{ color: "red", marginRight: "5px" }}>Forgot</span>
            <span style={{ color: "#3D85D8" }}>Password?</span>
          </p>
          <p style={{ color: "#6c757d", fontSize: "13px", marginTop: "8px" }}>
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="floating-label-content mb-3">
            <input
              className="floating-input form-control"
              type="email"
              id="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              maxLength={255}
            />
            <label className="floating-label" htmlFor="email">
              Email address
            </label>
          </div>

          {error && (
            <div
              className="alert alert-danger py-2 px-3"
              style={{ fontSize: "12px", marginBottom: "16px" }}
            >
              <i className="fa fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          <div className="d-flex justify-content-center">
            <button
              type="submit"
              className="btn btn-outline-dark mb-3 mt-3 d-flex align-items-center"
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
          <a href="/login" style={{ fontSize: "14px" }}>
            Back to Login
          </a>
        </div>

        <div
          className="text-center mt-3 pt-3"
          style={{ borderTop: "1px solid #dee2e6" }}
        >
          <p style={{ fontSize: "14px", color: "black", margin: 0 }}>
            Don't have an account? <a href="/register">Register</a>
          </p>
        </div>
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

export default ForgotPassword;
