import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-500 text-white";
      case "error":
        return "bg-red-500 text-white";
      case "warning":
        return "bg-yellow-500 text-white";
      case "info":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "error":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "warning":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "info":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md w-full shadow-lg rounded-lg p-4 ${getToastStyles()} transform transition-all duration-300 ease-in-out`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <span className="text-sm font-medium">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

const defaultEvent = {
  title: "",
  date: "",
  time: "",
  description: "",
  category: "",
  price: "",
  registrationFields: [],
};

const categoryOptions = [
  { display: "SOFTWARE", value: "SOFTWARE DOMAIN EVENTS" },
  { display: "HARDWARE", value: "HARDWARE DOMAIN EVENTS" },
  { display: "ROBOTICS", value: "ROBOTICS DOMAIN EVENTS" },
  { display: "IoT", value: "IoT DOMAIN EVENTS" },
  { display: "AI/ML", value: "AI/ML DOMAIN EVENTS" },
  { display: "CYBERSECURITY", value: "CYBERSECURITY DOMAIN EVENTS" },
];

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState(defaultEvent);
  const [selectedFile, setSelectedFile] = useState(null);
  const [ruleBook, setRuleBook] = useState(null);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [message, setMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  // Toast functions
  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const getErrorMessage = (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Handle validation errors
      if (status === 400 && data.errors) {
        const validationErrors = data.errors.map(
          (err) => `${err.path}: ${err.message}`
        );
        return validationErrors.join(", ");
      }

      // Handle specific error messages
      if (data.message) {
        return data.message;
      }

      // Handle different status codes
      switch (status) {
        case 401:
          return "Unauthorized. Please login again.";
        case 403:
          return "Access denied. Admin privileges required.";
        case 404:
          return "Resource not found.";
        case 409:
          return "Conflict. Event might already exist.";
        case 413:
          return "File too large. Please reduce file size.";
        case 422:
          return "Invalid data format. Please check your inputs.";
        case 500:
          return "Server error. Please try again later.";
        default:
          return `Error ${status}: ${data.error || "Unknown error"}`;
      }
    } else if (error.request) {
      return "Network error. Please check your connection.";
    } else {
      return error.message || "An unexpected error occurred.";
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await axiosInstance.get("/admin/events", {
        params: { search },
      });
      setEvents(res.data);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      showToast(getErrorMessage(err), "error");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [search]);

  const handleInput = (e) => {
    setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleRuleBookChange = (e) => {
    setRuleBook(e.target.files[0]);
  };

  const resetForm = () => {
    setNewEvent(defaultEvent);
    setSelectedFile(null);
    setRuleBook(null);
    setEditId(null);
    setMessage("");
    setErrorDetails("");

    const imageInput = document.getElementById("imageInput");
    const ruleBookInput = document.getElementById("ruleBookInput");
    if (imageInput) imageInput.value = "";
    if (ruleBookInput) ruleBookInput.value = "";
  };

  const validateForm = () => {
    if (!newEvent.title.trim()) {
      showToast("Event title is required.", "warning");
      return false;
    }
    if (!newEvent.date.trim()) {
      showToast("Event date is required.", "warning");
      return false;
    }
    if (!newEvent.time.trim()) {
      showToast("Event time is required.", "warning");
      return false;
    }
    if (!newEvent.description.trim()) {
      showToast("Event description is required.", "warning");
      return false;
    }
    if (!newEvent.category) {
      showToast("Please select an event category.", "warning");
      return false;
    }
    if (!editId && !selectedFile) {
      showToast("Event image is required.", "warning");
      return false;
    }
    if (!newEvent.price) {
      showToast("Event price is required.", "warning");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrorDetails("");

    if (!validateForm()) return;

    const formData = new FormData();
    formData.append("title", newEvent.title.trim());
    formData.append("date", newEvent.date.trim());
    formData.append("time", newEvent.time.trim());
    formData.append("description", newEvent.description.trim());
    formData.append("category", newEvent.category.trim());
    formData.append("price", newEvent.price.toString());

    // Always include registration fields with fallback
    const registrationFields =
      newEvent.registrationFields?.length > 0
        ? newEvent.registrationFields
        : ["Name", "Email"];
    formData.append("registrationFields", JSON.stringify(registrationFields));

    // Attach image (new upload)
    if (selectedFile) {
      formData.append("image", selectedFile);
    } else if (editId && newEvent.imageUrl) {
      formData.append("existingImage", newEvent.imageUrl); // for backend fallback
    }

    // Attach rule book (if not uploading new one)
    if (!ruleBook && editId && newEvent.ruleBookUrl) {
      formData.append("existingRuleBook", newEvent.ruleBookUrl); // for backend fallback
    }

    setLoading(true);

    try {
      let response;

      if (editId) {
        // PUT for edit
        response = await axiosInstance.put(
          `/admin/events/${editId}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        // POST for create
        response = await axiosInstance.post("/events", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      if (response.status === 200 || response.status === 201) {
        const eventId = response.data.event?._id || response.data._id;

        // Upload ruleBook only when:
        // - new ruleBook selected
        // - AND either creating new OR editing and uploading new one
        if (ruleBook) {
          try {
            const ruleBookForm = new FormData();
            ruleBookForm.append("ruleBook", ruleBook);

            const ruleBookResponse = await axiosInstance.post(
              `/events/${eventId}/upload-rulebook`,
              ruleBookForm,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            if (ruleBookResponse.status === 200) {
              setMessage("Event and rule book uploaded successfully!");
            }
          } catch (ruleBookError) {
            console.error("Rule book upload error:", ruleBookError);
            showToast("Event updated, but rule book upload failed.", "warning");
            setErrorDetails(
              ruleBookError.response?.data?.message || ruleBookError.message
            );
          }
        }

        showToast(
          editId ? "Event updated successfully!" : "Event added successfully!",
          "success"
        );
        setMessage(
          editId ? "Event updated successfully!" : "Event added successfully!"
        );
        resetForm();
        fetchEvents();
      }
    } catch (err) {
      console.error("Failed to submit event:", err);
      setMessage(editId ? "Failed to update event." : "Failed to add event.");
      showToast(
        editId ? "Failed to update event." : "Failed to add event.",
        "error"
      );

      if (err.response) {
        const categoryError = err.response.data?.errors?.find(
          (error) => error.path === "category"
        );
        if (categoryError) {
          setMessage(
            "Invalid category selected. Please choose a valid category."
          );
        }

        setErrorDetails(
          `Server error: ${err.response.status} - ${JSON.stringify(
            err.response.data
          )}`
        );
      } else if (err.request) {
        setErrorDetails(
          "No response received from server. Please check if the server is running."
        );
      } else {
        setErrorDetails(`Request error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event) => {
    setNewEvent({
      title: event.title || "",
      date: event.date || "",
      time: event.time || "",
      description: event.description || "",
      category: event.category || "",
      price: event.price || "",
      registrationFields: event.registrationFields || [],
      imageUrl: event.image || "", // important for edit
      ruleBookUrl: event.ruleBook || "", // important for edit
    });

    setEditId(event._id);
    setSelectedFile(null);
    setRuleBook(null);
    setMessage("");
    setErrorDetails("");
    showToast("Event loaded for editing", "info");
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    )
      return;

    try {
      await axiosInstance.delete(`/admin/events/${id}`);
      showToast("Event deleted successfully!", "success");
      fetchEvents();
    } catch (err) {
      console.error("Failed to delete:", err);
      showToast("Failed to delete event: " + getErrorMessage(err), "error");
    }
  };

  return (
    <div className="p-6 max-w-full mx-auto">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <h2 className="text-2xl font-bold mb-4">
        {editId ? "Edit Event" : "Add New Event"}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
      >
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Event Title
          </label>
          <input
            type="text"
            name="title"
            value={newEvent.title}
            onChange={handleInput}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter event title"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Event Date
          </label>
          <input
            type="text"
            name="date"
            value={newEvent.date}
            onChange={handleInput}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g. 13 July, 2025"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Event Time
          </label>
          <input
            type="text"
            name="time"
            value={newEvent.time}
            onChange={handleInput}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g. 14:00"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Event Price
          </label>
          <input
            type="number"
            name="price"
            value={newEvent.price}
            onChange={handleInput}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter price or 0 for free"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Event Category
          </label>
          <select
            name="category"
            value={newEvent.category}
            onChange={handleInput}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select Category</option>
            {categoryOptions.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.display}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Event Image
          </label>
          <input
            type="file"
            id="imageInput"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <small className="text-gray-500 text-sm">
            Supported formats: JPG, PNG, GIF. Max size: 5MB
          </small>
        </div>

        {imagePreview && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">New Image Preview:</p>
            <img
              src={imagePreview}
              alt="New Event Poster Preview"
              className="h-32 object-cover rounded border"
            />
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={newEvent.description}
            onChange={handleInput}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter event description"
            rows="4"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Registration Fields
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newEvent._newField || ""}
              onChange={(e) =>
                setNewEvent((prev) => ({ ...prev, _newField: e.target.value }))
              }
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add registration field (e.g. Name, Email)"
            />
            <button
              type="button"
              onClick={() => {
                const trimmed = (newEvent._newField || "").trim();
                if (trimmed && !newEvent.registrationFields.includes(trimmed)) {
                  setNewEvent((prev) => ({
                    ...prev,
                    registrationFields: [...prev.registrationFields, trimmed],
                    _newField: "",
                  }));
                }
              }}
              className="bg-blue-600 text-white px-4 rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {newEvent.registrationFields.map((field, i) => (
              <span
                key={i}
                className="bg-gray-200 px-3 py-1 rounded-full text-sm flex items-center gap-1"
              >
                {field}
                <button
                  type="button"
                  onClick={() =>
                    setNewEvent((prev) => ({
                      ...prev,
                      registrationFields: prev.registrationFields.filter(
                        (f) => f !== field
                      ),
                    }))
                  }
                  className="text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

        {!editId && (
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Event Rule Book (PDF) - Optional
            </label>
            <input
              type="file"
              id="ruleBookInput"
              accept="application/pdf"
              onChange={handleRuleBookChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <small className="text-gray-500 text-sm">
              PDF format only. Max size: 10MB
            </small>
          </div>
        )}

        {newEvent.ruleBookUrl && !ruleBook && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">Current Rule Book:</p>
            <a
              href={
                newEvent.ruleBookUrl.startsWith("http")
                  ? newEvent.ruleBookUrl
                  : `http://localhost:5000${newEvent.ruleBookUrl}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              View PDF
            </a>
          </div>
        )}

        <div className="md:col-span-2 flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                {editId ? "Updating..." : "Adding..."}
              </>
            ) : editId ? (
              "Update Event"
            ) : (
              "Create Event"
            )}
          </button>
          {editId && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-md transition-colors"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">All Events</h2>
        <div className="mb-4">
          <input
            className="w-full sm:w-96 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {event.title}
                  </td>
                  <td className="px-6 py-4">{event.date}</td>
                  <td className="px-6 py-4">{event.time}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {categoryOptions.find(
                        (cat) => cat.value === event.category
                      )?.display || event.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">₹{event.price}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap sm:flex-nowrap gap-2">
                      <button
                        onClick={() => handleEdit(event)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors w-full sm:w-auto"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors w-full sm:w-auto"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-gray-500 py-8">
                    No events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventManagement;
