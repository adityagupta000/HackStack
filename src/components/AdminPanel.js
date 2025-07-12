import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";

// Define categories exactly as they appear in the backend validation
const categoryOptions = [
  { display: "SOFTWARE", value: "SOFTWARE DOMAIN EVENTS" },
  { display: "HARDWARE", value: "HARDWARE DOMAIN EVENTS" },
  { display: "ROBOTICS", value: "ROBOTICS DOMAIN EVENTS" },
  { display: "IoT", value: "IoT DOMAIN EVENTS" },
  { display: "AI/ML", value: "AI/ML DOMAIN EVENTS" },
  { display: "CYBERSECURITY", value: "CYBERSECURITY DOMAIN EVENTS" },
];

const AdminPanel = () => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  // const [link, setLink] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const [ruleBook, setRuleBook] = useState(null);
  const [price, setPrice] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const role = localStorage.getItem("role");

      if (!accessToken || role !== "admin") {
        console.error("Access Denied: Not an admin");
        navigate("/login");
        return;
      }

      try {
        const response = await axiosInstance.get("/protected/admin");
        if (response.status === 200) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error(
          "Admin access denied:",
          error.response?.data || error.message
        );
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("role");
        navigate("/login");
      }
    };

    checkAdmin();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  // Handle PDF upload
  const handleRuleBookChange = (e) => {
    setRuleBook(e.target.files[0]);
  };

  const validateForm = () => {
    if (!title.trim()) {
      setMessage("Event title is required.");
      return false;
    }
    if (!date.trim()) {
      setMessage("Event date is required.");
      return false;
    }
    if (!time.trim()) {
      setMessage("Event time is required.");
      return false;
    }
    if (!description.trim()) {
      setMessage("Event description is required.");
      return false;
    }
    if (!category) {
      setMessage("Please select an event category.");
      return false;
    }
    // if (!link.trim()) {
    //   setMessage("Registration link is required.");
    //   return false;
    // }
    if (!image) {
      setMessage("Event image is required.");
      return false;
    }
    if (!price) {
      setMessage("Event price is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setErrorDetails("");

    // Validate form fields
    if (!validateForm()) {
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("date", date.trim());
    formData.append("time", time.trim());
    formData.append("description", description.trim());
    formData.append("image", image);
    // formData.append("link", link.trim());
    formData.append("category", category.trim());
    formData.append("price", price.toString());

    formData.append("registrationFields", JSON.stringify([]));

    // For debugging purposes, log the data being sent and the full FormData content
    console.log("Submitting category:", category);

    // Print out all form data keys and values for debugging
    for (let pair of formData.entries()) {
      console.log(pair[0] + ": " + pair[1]);
    }

    setLoading(true);

    try {
      // Try to get information about the API expectations
      console.log("About to submit to API. Axios instance:", axiosInstance);

      // Important: Do NOT set Content-Type header manually for FormData
      const response = await axiosInstance.post("/events", formData);

      if (response.status === 201) {
        setMessage("Event added successfully!");

        // Only attempt to upload rulebook if one was provided
        if (ruleBook) {
          try {
            const ruleBookForm = new FormData();
            ruleBookForm.append("ruleBook", ruleBook);

            const ruleBookResponse = await axiosInstance.post(
              `/events/${response.data.event._id}/upload-rulebook`,
              ruleBookForm
            );

            if (ruleBookResponse.status === 200) {
              setMessage("Event and rule book uploaded successfully!");
            }
          } catch (ruleBookError) {
            console.error("Rule book upload error:", ruleBookError);
            setMessage("Event created but rule book upload failed.");
            setErrorDetails(
              ruleBookError.response?.data?.message || ruleBookError.message
            );
          }
        }

        // Reset form after successful submission
        setTitle("");
        setDate("");
        setTime("");
        setDescription("");
        setImage(null);
        // setLink("");
        setCategory("");
        setRuleBook(null);
        setPrice("");

        // Reset file input fields
        const imageInput = document.getElementById("imageInput");
        const ruleBookInput = document.getElementById("ruleBookInput");
        if (imageInput) imageInput.value = "";
        if (ruleBookInput) ruleBookInput.value = "";
      }
    } catch (error) {
      console.error("Error adding event:", error);

      setMessage("Failed to add event.");

      if (error.response) {
        // The request was made and the server responded with an error status
        const errorData = error.response.data;

        // Specifically check for category validation errors
        const categoryError = errorData?.errors?.find(
          (err) => err.path === "category"
        );
        if (categoryError) {
          setMessage(
            "Invalid category selected. Please choose a valid category."
          );
        }

        setErrorDetails(
          `Server error: ${error.response.status} - ${JSON.stringify(
            error.response.data
          )}`
        );
      } else if (error.request) {
        // The request was made but no response was received
        setErrorDetails(
          "No response received from server. Please check if the server is running."
        );
      } else {
        // Something happened in setting up the request
        setErrorDetails(`Request error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return <div className="p-4">Loading...</div>;

  return (
    <div className="container mx-auto py-5 px-4" style={{ maxWidth: "800px" }}>
      <div className="flex justify-center">
        <div className="w-full">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-center">
              <h2 className="text-2xl font-semibold mb-2 sm:mb-0">
                Admin Panel
              </h2>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
              >
                Logout
              </button>
            </div>
            <div className="p-6">
              {message && (
                <div
                  className={`p-4 mb-4 rounded-md ${
                    message.includes("success")
                      ? "bg-green-100 border border-green-400 text-green-700"
                      : "bg-red-100 border border-red-400 text-red-700"
                  }`}
                >
                  {message}
                  {errorDetails && (
                    <div className="mt-2">
                      <details>
                        <summary className="cursor-pointer font-medium">
                          Error Details
                        </summary>
                        <div className="mt-2 p-2 bg-gray-100 rounded text-sm font-mono whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                          {errorDetails}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Event Title
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Event Date
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Event Time
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="4"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Event Category
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.display}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Event Image
                  </label>
                  <input
                    type="file"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    id="imageInput"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <small className="text-gray-500 text-sm">
                    Supported formats: JPG, PNG, GIF. Max size: 5MB
                  </small>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Event Rule Book (PDF)
                  </label>
                  <input
                    type="file"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    id="ruleBookInput"
                    accept="application/pdf"
                    onChange={handleRuleBookChange}
                  />
                  <small className="text-gray-500 text-sm">
                    PDF format only. Max size: 10MB
                  </small>
                </div>
                {/* <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Registration Link
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://"
                  />
                </div> */}
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Event Price
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter price or 0 for free"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={loading}
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
                      Adding...
                    </>
                  ) : (
                    "Add Event"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
