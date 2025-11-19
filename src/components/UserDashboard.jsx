import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import toast, { Toaster } from "react-hot-toast";
import { Card, Button, Modal, Form } from "react-bootstrap";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { sanitizeInput } from "../utils/sanitize";
import { validateFeedback, validateSearchQuery } from "../utils/validation";
import { handleAPIError } from "../utils/errorHandler";
import logger from "../utils/logger";

const UserDashboard = () => {
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(null);

  const formatDate = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  const handleLogout = async () => {
    try {
      logger.info("Logout initiated");

      await axiosInstance.post("/auth/logout", null, {
        withCredentials: true,
      });

      logger.info("Logged out successfully");
      logger.action("user_logout");
    } catch (err) {
      logger.error("Logout failed", err);
    } finally {
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      logger.clearUserId();

      window.location.href = "/login";
    }
  };

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true);

        const res = await axiosInstance.get("/registrations/my-registrations");

        // CRITICAL FIX: Filter out registrations with null events
        const validRegistrations = res.data.filter(
          (entry) => entry.event !== null
        );

        // Log if any registrations were filtered out
        if (res.data.length !== validRegistrations.length) {
          logger.warn("Some registrations have deleted events", {
            total: res.data.length,
            valid: validRegistrations.length,
            filtered: res.data.length - validRegistrations.length,
          });

          toast.info(
            `${
              res.data.length - validRegistrations.length
            } registration(s) for deleted events hidden`,
            { duration: 3000 }
          );
        }

        setRegisteredEvents(validRegistrations);

        logger.info("User registrations fetched", {
          count: validRegistrations.length,
        });
      } catch (err) {
        logger.error("Failed to fetch registrations", err, {
          status: err.response?.status,
        });

        handleAPIError(err, {
          fallbackMessage: "Failed to load your events",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
    logger.action("dashboard_view");
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;

    const validation = validateSearchQuery(value);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    const sanitized = sanitizeInput(value);
    setSearchQuery(sanitized);
  };

  // CRITICAL FIX: Add null checks for event object
  const filteredEvents = registeredEvents.filter((entry) => {
    // Safety check: ensure event exists
    if (!entry.event) return false;

    const event = entry.event;
    const query = searchQuery.toLowerCase();

    return (
      event.title?.toLowerCase().includes(query) ||
      event.description?.toLowerCase().includes(query) ||
      event.category?.toLowerCase().includes(query)
    );
  });

  const today = new Date().toDateString();

  // CRITICAL FIX: Add null checks in all filter operations
  const upcomingEvents = registeredEvents.filter((entry) => {
    if (!entry.event || !entry.event.date) return false;
    const eventDate = new Date(entry.event.date);
    return eventDate >= new Date();
  });

  const todayEvents = registeredEvents.filter((entry) => {
    if (!entry.event || !entry.event.date) return false;
    const eventDate = new Date(entry.event.date);
    return eventDate.toDateString() === today;
  });

  const eventsOnSelectedDate = registeredEvents.filter((entry) => {
    if (!entry.event || !entry.event.date) return false;
    const eventDate = formatDate(entry.event.date);
    const selectedDate = formatDate(calendarDate);
    return eventDate && selectedDate && eventDate === selectedDate;
  });

  const tileClassName = ({ date }) => {
    const current = formatDate(date);
    return registeredEvents.some((entry) => {
      if (!entry.event || !entry.event.date) return false;
      const eventDate = formatDate(entry.event.date);
      return eventDate && eventDate === current;
    })
      ? "event-day-highlight"
      : null;
  };

  const handleOpenFeedback = (eventId) => {
    setSelectedEventId(eventId);
    setFeedbackText("");
    setShowFeedbackModal(true);

    logger.action("feedback_modal_opened", { eventId });
  };

  const handleSubmitFeedback = async () => {
    const validation = validateFeedback(feedbackText);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    const sanitizedFeedback = sanitizeInput(feedbackText.trim());

    setSubmittingFeedback(true);

    try {
      await axiosInstance.post("/feedback", {
        eventId: selectedEventId,
        text: sanitizedFeedback,
      });

      toast.success("Feedback submitted successfully!");
      setShowFeedbackModal(false);
      setFeedbackText("");

      logger.info("Feedback submitted", {
        eventId: selectedEventId,
        feedbackLength: sanitizedFeedback.length,
      });

      logger.action("feedback_submitted", { eventId: selectedEventId });
    } catch (err) {
      logger.error("Feedback submission failed", err, {
        eventId: selectedEventId,
      });

      handleAPIError(err, {
        fallbackMessage: "Error submitting feedback",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleDownloadReceipt = async (registrationId, eventTitle) => {
    setDownloadingReceipt(registrationId);

    try {
      const response = await axiosInstance.get(
        `/registrations/${registrationId}/pdf`,
        {
          responseType: "blob",
          timeout: 30000,
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt_${eventTitle.replace(
        /\s+/g,
        "_"
      )}_${registrationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Receipt downloaded successfully!");

      logger.info("Receipt downloaded", {
        registrationId,
        eventTitle,
      });

      logger.action("receipt_downloaded", { registrationId });
    } catch (error) {
      logger.error("Receipt download failed", error, {
        registrationId,
        status: error.response?.status,
      });

      handleAPIError(error, {
        fallbackMessage: "Could not download receipt",
      });
    } finally {
      setDownloadingReceipt(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "green",
              secondary: "white",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "red",
              secondary: "white",
            },
          },
        }}
      />

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => {
            logger.action("navigate_to_home");
            window.location.href = "/home";
          }}
          className="text-lg text-blue-600 hover:underline flex items-center"
        >
          <i className="fas fa-arrow-left mr-2"></i>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setShowCalendar(true);
              logger.action("calendar_opened");
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            View Calendar
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded h-28 flex flex-col justify-center">
          <p className="text-sm">Total Events Registered</p>
          <h3 className="text-lg font-semibold">{registeredEvents.length}</h3>
        </div>

        <div className="bg-blue-100 border-l-4 border-green-500 text-green-700 p-4 rounded h-28 flex flex-col justify-center">
          <p className="text-sm">Upcoming Events</p>
          <h3 className="text-lg font-semibold">{upcomingEvents.length}</h3>
        </div>

        <div className="bg-blue-100 border-l-4 border-red-500 text-red-700 p-4 rounded h-28 flex flex-col justify-center">
          <p className="text-sm">Today's Events</p>
          <h3 className="text-lg font-semibold">{todayEvents.length}</h3>
        </div>
      </div>

      <h2 className="text-center mb-4">My Registered Events</h2>

      {registeredEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">
            You have not registered for any events yet.
          </p>
          <a
            href="/home"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Events
          </a>
        </div>
      ) : (
        <>
          {registeredEvents.length >= 4 && (
            <div className="row mb-4">
              <div className="col-12">
                <input
                  type="text"
                  placeholder="Search by title, description, or category..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full border-2 border-black rounded-md px-3 py-2 text-sm"
                  maxLength={100}
                />
              </div>
            </div>
          )}

          {/* Event Cards */}
          <div className="row">
            {filteredEvents.length === 0 ? (
              <div className="col-12 text-center py-8">
                <p className="text-gray-600">No events match your search.</p>
              </div>
            ) : (
              filteredEvents.map((entry) => {
                const event = entry.event;

                // Extra safety check (should not be needed after filtering, but adds robustness)
                if (!event) return null;

                return (
                  <div className="col-md-4 mb-4" key={event._id}>
                    <Card className="h-100 shadow-sm p-3">
                      <Card.Body>
                        <Card.Title className="text-lg font-semibold mb-3">
                          {sanitizeInput(event.title || "Untitled Event")}
                        </Card.Title>
                        <Card.Text>
                          <strong>Date:</strong>{" "}
                          {sanitizeInput(event.date || "N/A")}
                          <br />
                          <strong>Time:</strong>{" "}
                          {sanitizeInput(event.time || "N/A")}
                          <br />
                          <strong>Category:</strong>{" "}
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {sanitizeInput(event.category || "N/A")}
                          </span>
                        </Card.Text>
                        <Card.Text
                          className="text-muted"
                          style={{ fontSize: "0.9em", textAlign: "justify" }}
                        >
                          {sanitizeInput(
                            event.description?.slice(0, 120) || ""
                          )}
                          ...
                        </Card.Text>
                        <div className="d-flex flex-column gap-2 mt-3">
                          {event.ruleBook && (
                            <Button
                              variant="outline-primary"
                              href={
                                event.ruleBook.startsWith("http")
                                  ? event.ruleBook
                                  : event.ruleBook.startsWith("/uploads")
                                  ? `http://localhost:5000${event.ruleBook}`
                                  : `http://localhost:5000/uploads/rulebooks/${event.ruleBook}`
                              }
                              target="_blank"
                              size="sm"
                              onClick={() => {
                                logger.action("rulebook_viewed", {
                                  eventId: event._id,
                                });
                              }}
                            >
                              <i className="fas fa-book mr-2"></i>
                              Rulebook
                            </Button>
                          )}
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() =>
                              handleDownloadReceipt(
                                entry._id,
                                event.title || "receipt"
                              )
                            }
                            disabled={downloadingReceipt === entry._id}
                          >
                            {downloadingReceipt === entry._id ? (
                              <>
                                <span className="spinner-border spinner-border-sm mr-2"></span>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-download mr-2"></i>
                                Download Receipt
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleOpenFeedback(event._id)}
                          >
                            <i className="fas fa-comment mr-2"></i>
                            Give Feedback
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Calendar Modal */}
      <Modal
        show={showCalendar}
        onHide={() => {
          setShowCalendar(false);
          logger.action("calendar_closed");
        }}
        centered
        size="md"
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fs-md-5">Calendar View</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-2 p-md-3">
          <div className="calendar-container" style={{ overflow: "auto" }}>
            <Calendar
              onChange={setCalendarDate}
              value={calendarDate}
              tileClassName={tileClassName}
              className="w-100"
            />
          </div>
          <div className="mt-3">
            <h6 className="text-center fs-6 fs-md-5">
              Events on {calendarDate.toDateString()}
            </h6>
            {eventsOnSelectedDate.length > 0 ? (
              <ul className="list-unstyled px-2">
                {eventsOnSelectedDate.map((entry) => (
                  <li key={entry._id} className="mb-1 text-break">
                    • {sanitizeInput(entry.event?.title || "Unknown Event")}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted small">
                No events on this day.
              </p>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="p-2 p-md-3">
          <Button
            variant="danger"
            onClick={() => setShowCalendar(false)}
            className="w-100 w-md-auto"
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        show={showFeedbackModal}
        onHide={() => {
          setShowFeedbackModal(false);
          logger.action("feedback_modal_closed");
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Submit Feedback</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Your Feedback</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Share your experience with this event..."
              maxLength={2000}
            />
            <Form.Text className="text-muted">
              {feedbackText.length}/2000 characters
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowFeedbackModal(false)}
            disabled={submittingFeedback}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitFeedback}
            disabled={submittingFeedback || !feedbackText.trim()}
          >
            {submittingFeedback ? (
              <>
                <span className="spinner-border spinner-border-sm mr-2"></span>
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .event-day-highlight {
          background-color: #3b82f6 !important;
          color: white !important;
          border-radius: 50%;
        }
        .event-day-highlight:hover {
          background-color: #2563eb !important;
        }
      `}</style>
    </div>
  );
};

export default UserDashboard;
