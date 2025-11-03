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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating reset link...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Invalid or Expired Link
            </h2>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired. Please request
              a new password reset link.
            </p>
            <div className="space-y-3">
              <a
                href="/forgot-password"
                className="block w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Request New Link
              </a>
              <a
                href="/login"
                className="block w-full bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors text-center"
              >
                Back to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Password
          </h2>
          <p className="text-gray-600">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Password Field */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              New Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter new password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
            />

            {/* Password Strength Indicator */}
            {passwordStrength && formData.password.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">
                    Password Strength:
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: passwordStrength.color }}
                  >
                    {passwordStrength.strength.toUpperCase()}
                  </span>
                </div>
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${passwordStrength.percentage}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Password Requirements */}
            {formData.password && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Password must contain:
                </p>
                <div className="space-y-1">
                  <div className="flex items-center text-xs">
                    <i
                      className={`fa ${
                        passwordRequirements.minLength
                          ? "fa-check-circle text-green-600"
                          : "fa-times-circle text-red-600"
                      } mr-2`}
                    ></i>
                    <span
                      className={
                        passwordRequirements.minLength
                          ? "text-green-600"
                          : "text-gray-600"
                      }
                    >
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <i
                      className={`fa ${
                        passwordRequirements.uppercase
                          ? "fa-check-circle text-green-600"
                          : "fa-times-circle text-red-600"
                      } mr-2`}
                    ></i>
                    <span
                      className={
                        passwordRequirements.uppercase
                          ? "text-green-600"
                          : "text-gray-600"
                      }
                    >
                      One uppercase letter (A-Z)
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <i
                      className={`fa ${
                        passwordRequirements.number
                          ? "fa-check-circle text-green-600"
                          : "fa-times-circle text-red-600"
                      } mr-2`}
                    ></i>
                    <span
                      className={
                        passwordRequirements.number
                          ? "text-green-600"
                          : "text-gray-600"
                      }
                    >
                      One number (0-9)
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <i
                      className={`fa ${
                        passwordRequirements.specialChar
                          ? "fa-check-circle text-green-600"
                          : "fa-times-circle text-red-600"
                      } mr-2`}
                    ></i>
                    <span
                      className={
                        passwordRequirements.specialChar
                          ? "text-green-600"
                          : "text-gray-600"
                      }
                    >
                      One special character (@$!%*#?&)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Re-enter new password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
            />
            {formData.confirmPassword &&
              formData.password !== formData.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">
                  <i className="fa fa-exclamation-circle mr-1"></i>
                  Passwords do not match
                </p>
              )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                <i className="fa fa-exclamation-circle mr-2"></i>
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || formData.password !== formData.confirmPassword}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center font-medium"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/login" className="text-sm text-blue-600 hover:underline">
            Back to Login
          </a>
        </div>

        {/* Security Notice */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-start space-x-2">
            <svg
              className="w-5 h-5 text-gray-400 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs text-gray-600">
              For your security, this link will expire in 10 minutes. After
              resetting your password, you'll need to log in again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
