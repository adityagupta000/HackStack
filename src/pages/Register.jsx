import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap/dist/css/bootstrap.min.css";

function HackathonRegister() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [errors, setErrors] = useState({});
  const [validity, setValidity] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);

  // Password requirements state
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (message) {
      setShowMessage(true);
      const timer = setTimeout(() => setShowMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    setErrors((prevErrors) => ({ ...prevErrors, [id]: "" }));
  };

  // Check password requirements in real-time
  useEffect(() => {
    const password = formData.password;

    setPasswordRequirements({
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[@$!%*#?&]/.test(password),
    });
  }, [formData.password]);

  useEffect(() => {
    const newValidity = {};
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d#@$!%*?&]{8,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    newValidity.name = formData.name.trim() !== "";
    newValidity.email = emailRegex.test(formData.email);
    newValidity.password = passwordRegex.test(formData.password);
    newValidity.confirmPassword =
      formData.password === formData.confirmPassword &&
      formData.confirmPassword !== "";

    setValidity(newValidity);
  }, [formData]);

  const validateForm = () => {
    const newErrors = {};
    const password = formData.password.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!emailRegex.test(formData.email))
      newErrors.email = "Invalid email address";
    if (!password) newErrors.password = "Password is required";
    if (password !== formData.confirmPassword.trim())
      newErrors.confirmPassword = "Passwords do not match";

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/register", formData);
      setMessage("Registration successful! Redirecting to login...");
      setMessageType("success");
      setErrors({});
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (error) {
      setMessage(
        error.response && error.response.data.message === "User already exists"
          ? "User already exists. Please use a different email."
          : "Error registering user"
      );
      setMessageType("error");
      setErrors({});
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
        className="register-container d-flex flex-column p-4 p-md-5 border rounded"
        style={{ maxWidth: "400px", width: "100%", backgroundColor: "white" }}
      >
        <div className="text-center mb-4">
          <p style={{ fontSize: "18px" }}>
            <span style={{ color: "red", marginRight: "5px" }}>Register</span>
            <span style={{ color: "#3D85D8" }}>Here</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div className="floating-label-content mb-3">
            <div
              className={`input-wrapper ${validity.name ? "input-valid" : ""}`}
            >
              <input
                className="floating-input form-control"
                type="text"
                id="name"
                placeholder=" "
                value={formData.name}
                onChange={handleChange}
                required
              />
              <label className="floating-label" htmlFor="name">
                Name
              </label>
              {validity.name && (
                <i className="fa fa-check text-success validation-icon"></i>
              )}
            </div>
            {errors.name && (
              <div className="text-danger mt-1" style={{ fontSize: "12px" }}>
                {errors.name}
              </div>
            )}
          </div>

          {/* Email Field */}
          <div className="floating-label-content mb-3">
            <div
              className={`input-wrapper ${validity.email ? "input-valid" : ""}`}
            >
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
              {validity.email && (
                <i className="fa fa-check text-success validation-icon"></i>
              )}
            </div>
            {errors.email && (
              <div className="text-danger mt-1" style={{ fontSize: "12px" }}>
                {errors.email}
              </div>
            )}
          </div>

          {/* Password Field with Requirements */}
          <div className="floating-label-content mb-3">
            <div
              className={`input-wrapper ${
                validity.password ? "input-valid" : ""
              }`}
            >
              <input
                className="floating-input form-control"
                type="password"
                id="password"
                placeholder=" "
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setShowPasswordRequirements(true)}
                onBlur={() => setShowPasswordRequirements(false)}
                required
              />
              <label className="floating-label" htmlFor="password">
                Password
              </label>
              {validity.password && (
                <i className="fa fa-check text-success validation-icon"></i>
              )}
            </div>

            {/* Password Requirements Checklist */}
            {(showPasswordRequirements || formData.password) && (
              <div className="password-requirements mt-2 p-2">
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
                      One special character (@$!%*?&)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {errors.password && (
              <div className="text-danger mt-1" style={{ fontSize: "12px" }}>
                {errors.password}
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="floating-label-content mb-3">
            <div
              className={`input-wrapper ${
                validity.confirmPassword ? "input-valid" : ""
              }`}
            >
              <input
                className="floating-input form-control"
                type="password"
                id="confirmPassword"
                placeholder=" "
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <label className="floating-label" htmlFor="confirmPassword">
                Confirm Password
              </label>
              {validity.confirmPassword && (
                <i className="fa fa-check text-success validation-icon"></i>
              )}
            </div>
            {formData.confirmPassword && !validity.confirmPassword && (
              <div className="text-danger mt-1" style={{ fontSize: "12px" }}>
                <i
                  className="fa fa-exclamation-circle"
                  style={{ marginRight: "4px" }}
                ></i>
                Passwords do not match
              </div>
            )}
            {errors.confirmPassword && (
              <div className="text-danger mt-1" style={{ fontSize: "12px" }}>
                {errors.confirmPassword}
              </div>
            )}
          </div>

          <div className="d-flex justify-content-center">
            <button
              type="submit"
              className="btn btn-outline-danger mb-3 mt-3 d-flex align-items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </button>
          </div>
        </form>

        <p className="text-center mt-3" style={{ color: "black" }}>
          Already a member? <a href="/login">Login</a>
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
        .input-wrapper {
          position: relative;
        }
        .validation-icon {
          position: absolute;
          top: 50%;
          right: 10px;
          transform: translateY(-50%);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .input-valid .validation-icon {
          opacity: 1;
        }
        a {
          text-decoration: none;
          font-weight: bold;
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

export default HackathonRegister;
