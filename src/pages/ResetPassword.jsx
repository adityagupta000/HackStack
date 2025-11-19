import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { validatePassword } from "../utils/validation";
import { handleAPIError } from "../utils/errorHandler";
import logger from "../utils/logger";
import { checkPasswordStrength } from "../config/security";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token || token.length < 32) {
        setTokenValid(false);
        setValidating(false);
        logger.warn("Invalid reset token format");
        return;
      }

      setValidating(false);
      logger.info("Reset password page accessed");
    };

    validateToken();
  }, [token]);

  // Check password requirements
  useEffect(() => {
    const password = formData.password;

    setPasswordRequirements({
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[@$!%*#?&]/.test(password),
    });

    if (password.length > 0) {
      const strength = checkPasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
    }
  }, [formData.password]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join(". "));
      return;
    }

    // Check password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Check password strength
    if (passwordStrength && passwordStrength.strength === "weak") {
      setError("Password is too weak. Please choose a stronger password.");
      return;
    }

    setLoading(true);

    try {
      await axiosInstance.post(`/auth/reset-password/${token}`, {
        password: formData.password,
      });

      logger.info("Password reset successful");
      logger.action("password_reset_completed");

      toast.success("Password reset successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to reset password";

      setError(errorMessage);

      logger.error("Password reset failed", error, {
        errorMessage,
      });

      handleAPIError(error, {
        showToast: false,
        fallbackMessage: "Failed to reset password",
      });

      // If token is invalid/expired
      if (error.response?.status === 400) {
        setTokenValid(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while validating token
  if (validating) {
    return (
      <div
        className="container-fluid d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}
      >
        <div className="cosmic-background"></div>
        <div className="text-center" style={{ zIndex: 10 }}>
          <div
            className="spinner-border text-light"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-4" style={{ color: "white" }}>
            Validating reset link...
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
        `}</style>
      </div>
    );
  }

  // Show error if token is invalid
  if (!tokenValid) {
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
        <div className="cosmic-background"></div>
        <div
          className="error-container d-flex flex-column p-4 p-md-5 border rounded"
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
                backgroundColor: "#f8d7da",
              }}
            >
              <i
                className="fa fa-times"
                style={{ fontSize: "28px", color: "#dc3545" }}
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
              Invalid or Expired Link
            </h2>
            <p
              style={{
                color: "#6c757d",
                marginBottom: "24px",
                fontSize: "14px",
              }}
            >
              This password reset link is invalid or has expired. Please request
              a new password reset link.
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <a
                href="/forgot-password"
                className="btn btn-outline-dark"
                style={{ padding: "10px 24px", textDecoration: "none" }}
              >
                Request New Link
              </a>
              <a
                href="/login"
                className="btn btn-outline-secondary"
                style={{ padding: "10px 24px", textDecoration: "none" }}
              >
                Back to Login
              </a>
            </div>
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
      <div className="cosmic-background"></div>

      <div
        className="reset-password-container d-flex flex-column p-4 p-md-5 border rounded"
        style={{
          maxWidth: "450px",
          width: "100%",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          zIndex: 10,
          position: "relative",
          boxShadow: "none",
        }}
      >
        <div className="text-center mb-4">
          <p style={{ fontSize: "18px" }}>
            <span style={{ color: "red", marginRight: "5px" }}>Reset</span>
            <span style={{ color: "#3D85D8" }}>Password</span>
          </p>
          <p style={{ color: "#6c757d", fontSize: "13px", marginTop: "8px" }}>
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Password Field */}
          <div className="floating-label-content mb-3">
            <input
              className="floating-input form-control"
              type="password"
              id="password"
              placeholder=" "
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
            />
            <label className="floating-label" htmlFor="password">
              New Password
            </label>
          </div>

          {/* Password Strength Indicator */}
          {passwordStrength && formData.password.length > 0 && (
            <div className="mb-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span style={{ fontSize: "11px", color: "#6b7280" }}>
                  Password Strength:
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "bold",
                    color: passwordStrength.color,
                  }}
                >
                  {passwordStrength.strength.toUpperCase()}
                </span>
              </div>
              <div
                style={{
                  height: "4px",
                  backgroundColor: "#e5e7eb",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${passwordStrength.percentage}%`,
                    backgroundColor: passwordStrength.color,
                    transition: "width 0.3s ease, background-color 0.3s ease",
                  }}
                />
              </div>
            </div>
          )}

          {/* Password Requirements */}
          {formData.password && (
            <div className="password-requirements mb-3 p-2">
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  marginBottom: "5px",
                  color: "#495057",
                }}
              >
                Password must contain:
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "11px",
                  }}
                >
                  <i
                    className={`fa ${
                      passwordRequirements.minLength
                        ? "fa-check-circle text-success"
                        : "fa-times-circle text-danger"
                    }`}
                    style={{ marginRight: "6px", fontSize: "12px" }}
                  ></i>
                  <span
                    style={{
                      color: passwordRequirements.minLength
                        ? "#28a745"
                        : "#dc3545",
                    }}
                  >
                    At least 8 characters
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "11px",
                  }}
                >
                  <i
                    className={`fa ${
                      passwordRequirements.uppercase
                        ? "fa-check-circle text-success"
                        : "fa-times-circle text-danger"
                    }`}
                    style={{ marginRight: "6px", fontSize: "12px" }}
                  ></i>
                  <span
                    style={{
                      color: passwordRequirements.uppercase
                        ? "#28a745"
                        : "#dc3545",
                    }}
                  >
                    One uppercase letter (A-Z)
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "11px",
                  }}
                >
                  <i
                    className={`fa ${
                      passwordRequirements.number
                        ? "fa-check-circle text-success"
                        : "fa-times-circle text-danger"
                    }`}
                    style={{ marginRight: "6px", fontSize: "12px" }}
                  ></i>
                  <span
                    style={{
                      color: passwordRequirements.number
                        ? "#28a745"
                        : "#dc3545",
                    }}
                  >
                    One number (0-9)
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "11px",
                  }}
                >
                  <i
                    className={`fa ${
                      passwordRequirements.specialChar
                        ? "fa-check-circle text-success"
                        : "fa-times-circle text-danger"
                    }`}
                    style={{ marginRight: "6px", fontSize: "12px" }}
                  ></i>
                  <span
                    style={{
                      color: passwordRequirements.specialChar
                        ? "#28a745"
                        : "#dc3545",
                    }}
                  >
                    One special character (@$!%*#?&)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Password Field */}
          <div className="floating-label-content mb-3">
            <input
              className="floating-input form-control"
              type="password"
              id="confirmPassword"
              placeholder=" "
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
            />
            <label className="floating-label" htmlFor="confirmPassword">
              Confirm New Password
            </label>
          </div>

          {formData.confirmPassword &&
            formData.password !== formData.confirmPassword && (
              <div className="text-danger mb-3" style={{ fontSize: "12px" }}>
                <i className="fa fa-exclamation-circle me-1"></i>
                Passwords do not match
              </div>
            )}

          {/* Error Message */}
          {error && (
            <div
              className="alert alert-danger py-2 px-3 mb-3"
              style={{ fontSize: "12px" }}
            >
              <i className="fa fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="d-flex justify-content-center">
            <button
              type="submit"
              className="btn btn-outline-dark mb-3 mt-3 d-flex align-items-center"
              disabled={
                loading || formData.password !== formData.confirmPassword
              }
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-3">
          <a href="/login" style={{ fontSize: "14px" }}>
            Back to Login
          </a>
        </div>

        {/* Security Notice */}
        <div
          className="text-center mt-3 pt-3"
          style={{ borderTop: "1px solid #dee2e6" }}
        >
          <div className="d-flex align-items-start" style={{ gap: "8px" }}>
            <i
              className="fa fa-info-circle"
              style={{ color: "#6c757d", fontSize: "16px", marginTop: "2px" }}
            ></i>
            <p
              style={{
                fontSize: "11px",
                color: "#6c757d",
                margin: 0,
                textAlign: "left",
              }}
            >
              For your security, this link will expire in 10 minutes. After
              resetting your password, you'll need to log in again.
            </p>
          </div>
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
        .password-requirements {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default ResetPassword;
