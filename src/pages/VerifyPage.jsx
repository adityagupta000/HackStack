import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import logger from "../utils/logger";
import { handleAPIError } from "../utils/errorHandler";

const VerifyPage = () => {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      // Validate token format
      if (!token || token.length < 32) {
        setError("Invalid verification token format");
        setLoading(false);
        logger.warn("Invalid verification token format");
        return;
      }

      try {
        setLoading(true);

        const res = await axios.get(
          `http://localhost:5000/api/verify/${token}`,
          { timeout: 10000 }
        );

        setInfo(res.data);

        logger.info("Registration verified successfully", {
          registrationId: res.data.registrationId,
        });

        logger.action("registration_verified");
      } catch (err) {
        const errorMessage =
          err.response?.data?.error || "Verification failed. Try again.";

        setError(errorMessage);

        logger.error("Verification failed", err, {
          token: token.substring(0, 8) + "...", // Log partial token only
          status: err.response?.status,
        });

        handleAPIError(err, {
          showToast: false,
          fallbackMessage: "Verification failed",
        });
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">
            Verifying Registration...
          </h2>
          <p className="text-gray-500 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-600"
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

          <h2 className="text-2xl font-bold text-center text-red-700 mb-4">
            Verification Failed
          </h2>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-center">{error}</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center">
              This verification link may have expired or is invalid. Please
              contact support or try registering for the event again.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/home"
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
              >
                Back to Home
              </a>
              <a
                href="/my-events"
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-center font-medium"
              >
                My Events
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white shadow-xl rounded-lg p-8 w-full max-w-2xl">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full mb-6">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2 className="text-3xl font-bold text-center text-green-700 mb-2">
          Registration Verified!
        </h2>

        <p className="text-center text-gray-600 mb-8">
          Your event registration has been successfully verified.
        </p>

        <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
          <div className="flex items-start">
            <span className="font-semibold text-gray-700 w-32">Name:</span>
            <span className="text-gray-900">{info.name}</span>
          </div>

          <div className="flex items-start">
            <span className="font-semibold text-gray-700 w-32">Email:</span>
            <span className="text-gray-900">{info.email}</span>
          </div>

          <div className="flex items-start">
            <span className="font-semibold text-gray-700 w-32">Event:</span>
            <span className="text-gray-900 font-medium">{info.eventTitle}</span>
          </div>

          <div className="flex items-start">
            <span className="font-semibold text-gray-700 w-32">Date:</span>
            <span className="text-gray-900">{info.eventDate}</span>
          </div>

          <div className="flex items-start">
            <span className="font-semibold text-gray-700 w-32">Time:</span>
            <span className="text-gray-900">{info.eventTime}</span>
          </div>

          <div className="flex items-start pt-3 border-t border-gray-200">
            <span className="font-semibold text-gray-700 w-32">
              Registered:
            </span>
            <span className="text-sm text-gray-600">
              {new Date(info.registeredAt).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">
                Important Information
              </p>
              <p className="text-sm text-blue-700">
                Please bring this confirmation with you to the event. You can
                download your receipt from the "My Events" page.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/my-events"
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
          >
            View My Events
          </a>
          <a
            href="/home"
            className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center font-medium"
          >
            Browse More Events
          </a>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
