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
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [showMessage, setShowMessage] = useState(false);
  const [errors, setErrors] = useState({});
  const [validity, setValidity] = useState({});
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    const newValidity = {};
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    newValidity.name = formData.name.trim() !== "";
    newValidity.email = emailRegex.test(formData.email);
    newValidity.password = passwordRegex.test(formData.password);
    newValidity.confirmPassword =
      formData.password === formData.confirmPassword;

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
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 bg-black">
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

      <div className="row justify-content-center w-100">
        <div className="col-lg-8 col-md-10 col-sm-12">
          <div className="p-5 border border-primary rounded shadow-lg bg-light">
            <h3 className="text-center mb-4">
              <span style={{ color: "blue" }}>Hackathon</span>{" "}
              <span style={{ color: "green" }}>Registration</span>
            </h3>

            <form onSubmit={handleSubmit}>
              {["name", "email", "password", "confirmPassword"].map((field) => (
                <div className="floating-label-content mb-4" key={field}>
                  <div
                    className={`input-wrapper ${
                      validity[field] ? "input-valid" : ""
                    }`}
                  >
                    <input
                      className={`floating-input ${
                        errors[field]
                          ? "border-danger"
                          : validity[field]
                          ? "border-success"
                          : "border-primary"
                      }`}
                      type={field.includes("password") ? "password" : "text"}
                      id={field}
                      placeholder=" "
                      value={formData[field]}
                      onChange={handleChange}
                    />
                    <label className="floating-label" htmlFor={field}>
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    {validity[field] && (
                      <i className="fa fa-check text-success"></i>
                    )}
                  </div>
                  {errors[field] && (
                    <div className="text-danger">{errors[field]}</div>
                  )}
                </div>
              ))}
              <div className="text-center justify-content-end">
                <button
                  type="submit"
                  className="btn btn-outline-primary btn-md"
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
          </div>
        </div>
      </div>

      <style>{`
        .floating-label-content { position: relative; margin-bottom: 20px; }
        .floating-label { color: #1e4c82; font-size: 13px; position: absolute; left: 15px; top: 50%; transform: translateY(-50%); padding: 0 3px; background: #fff; transition: 0.2s ease all; }
        .floating-input { font-size: 14px; display: block; width: 100%; height: 40px; padding: 0 20px; background: #fff; color: #323840; border: 1px solid #3D85D8; border-radius: 4px; box-sizing: border-box; }
        .floating-input:focus, .floating-input:not(:placeholder-shown) { outline: none; }
        .floating-input:focus ~ .floating-label, .floating-input:not(:placeholder-shown) ~ .floating-label { top: 0px; font-size: 15px; }
        .floating-input:focus { border-color: #007bff; }
        .floating-input:valid { border-color: #28a745; }
        .input-wrapper { position: relative; }
        .input-wrapper i { position: absolute; top: 50%; right: 10px; transform: translateY(-50%); opacity: 0; transition: opacity 0.2s ease; }
        .input-valid i { opacity: 1; }
      `}</style>
    </div>
  );
}

export default HackathonRegister;
