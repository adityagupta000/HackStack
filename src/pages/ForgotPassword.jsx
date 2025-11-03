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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Check Your Email
            </h2>
            <p className="text-gray-600 mb-6">
              If your email is registered with us, you will receive a password
              reset link shortly. Please check your inbox and spam folder.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              The link will expire in 10 minutes for security reasons.
            </p>
            <a
              href="/login"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </a>
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
            Forgot Password?
          </h2>
          <p className="text-gray-600">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              required
              maxLength={255}
              autoComplete="email"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">
                <i className="fa fa-exclamation-circle mr-1"></i>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
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
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/login" className="text-sm text-blue-600 hover:underline">
            Back to Login
          </a>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-blue-600 hover:underline font-medium"
            >
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
