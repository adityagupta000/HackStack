import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const VerifyPage = () => {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/verify/${token}`
        );
        setInfo(res.data);
      } catch (err) {
        setError(
          err.response?.data?.error || "Verification failed. Try again."
        );
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      {error ? (
        <div className="text-red-600 text-lg font-semibold">{error}</div>
      ) : info ? (
        <div className="bg-white shadow-lg rounded p-6 w-full max-w-md">
          <h2 className="text-xl font-bold text-center text-green-700 mb-4">
            Registration Verified
          </h2>
          <p><strong>Name:</strong> {info.name}</p>
          <p><strong>Email:</strong> {info.email}</p>
          <p><strong>Event:</strong> {info.eventTitle}</p>
          <p><strong>Date:</strong> {info.eventDate}</p>
          <p><strong>Time:</strong> {info.eventTime}</p>
          <p className="text-sm text-gray-500 mt-2">
            Registered on: {new Date(info.registeredAt).toLocaleString()}
          </p>
        </div>
      ) : (
        <div className="text-gray-600">Verifying...</div>
      )}
    </div>
  );
};

export default VerifyPage;
