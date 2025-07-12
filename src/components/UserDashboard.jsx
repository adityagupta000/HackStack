import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import toast, { Toaster } from "react-hot-toast";
import { Card, Button, Modal, Form } from "react-bootstrap";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
// import "./UserDashboard.css"; // optional for styles

const handleDownloadReceipt = async (registrationId) => {
  const token = localStorage.getItem("accessToken");

  try {
    const response = await fetch(
      `http://localhost:5000/api/registrations/${registrationId}/pdf`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch PDF");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt_${registrationId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    toast.error("Could not download receipt");
    console.error(error);
  }
};

const UserDashboard = () => {
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false); // toggle modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");

  const formatDate = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0]; // 'YYYY-MM-DD'
  };

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axiosInstance.get("/registrations/my-registrations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRegisteredEvents(res.data);
      } catch (err) {
        toast.error("Failed to load your events");
      }
    };

    fetchRegistrations();
  }, []);

  const filteredEvents = registeredEvents.filter((entry) => {
    const event = entry.event;
    return (
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const today = new Date().toDateString();

  const upcomingEvents = registeredEvents.filter((entry) => {
    const eventDate = new Date(entry.event.date);
    return eventDate >= new Date(); // today or future
  });

  const todayEvents = registeredEvents.filter((entry) => {
    const eventDate = new Date(entry.event.date);
    return eventDate.toDateString() === today;
  });

  const eventsOnSelectedDate = registeredEvents.filter((entry) => {
    const eventDate = formatDate(entry.event.date);
    const selectedDate = formatDate(calendarDate);
    return eventDate && selectedDate && eventDate === selectedDate;
  });

  const tileClassName = ({ date }) => {
    const current = formatDate(date);
    return registeredEvents.some((entry) => {
      const eventDate = formatDate(entry.event.date);
      return eventDate && eventDate === current;
    })
      ? "event-day-highlight"
      : null;
  };

  const handleOpenFeedback = (eventId) => {
    setSelectedEventId(eventId);
    setFeedbackText(""); // reset
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async () => {
    try {
      await axiosInstance.post("/feedback", {
        eventId: selectedEventId,
        text: feedbackText,
      });
      toast.success("Feedback submitted!");
      setShowFeedbackModal(false);
    } catch (err) {
      toast.error("Error submitting feedback.");
    }
  };

  return (
    <div className="container mt-5">
      {/* Add Toaster component for displaying toast notifications */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Define default options
          className: "",
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          // Default options for specific types
          success: {
            duration: 3000,
            theme: {
              primary: "green",
              secondary: "black",
            },
          },
          error: {
            duration: 4000,
            theme: {
              primary: "red",
              secondary: "black",
            },
          },
        }}
      />

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mb-6">
        {/* Left-aligned: Back to Home */}
        <button
          onClick={() => (window.location.href = "/home")}
          className="text-sm text-blue-600 hover:underline flex items-center"
        >
          <i className="fas fa-arrow-left mr-2"></i> Back to Home
        </button>

        {/* Right-aligned group: Logout + Calendar */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCalendar(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            View Calendar
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
              window.location.href = "/login";
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded h-28 flex flex-col justify-between">
          <p className="text-sm">Total Events Registered</p>
          <h3 className="text-lg font-semibold">{registeredEvents.length}</h3>
        </div>

        <div className="bg-blue-100 border-l-4 border-green-500 text-green-700 p-4 rounded h-28 flex flex-col justify-between">
          <p className="text-sm">Upcoming Events</p>
          <h3 className="text-lg font-semibold">{upcomingEvents.length}</h3>
        </div>

        <div className="bg-blue-100 border-l-4 border-red-500 text-red-700 p-4 rounded h-28 flex flex-col justify-between">
          <p className="text-sm">Today’s Events</p>
          <h3 className="text-lg font-semibold">{todayEvents.length}</h3>
        </div>

        {/* Optionally include feedback count later if you track feedback */}
      </div>

      <h2 className="text-center mb-4">My Registered Events</h2>

      {registeredEvents.length === 0 ? (
        <p className="text-center text-muted">
          You have not registered for any events yet.
        </p>
      ) : (
        <>
          {registeredEvents.length >= 4 && (
            <div className="row mb-4">
              <div className="col-12">
                <input
                  type="text"
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-2 border-black rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          {/* Event Cards */}
          <div className="row">
            {filteredEvents.length === 0 ? (
              <p className="text-center text-muted">
                No events match your search.
              </p>
            ) : (
              filteredEvents.map((entry) => {
                const event = entry.event;
                return (
                  <div className="col-md-4 mb-4" key={event._id}>
                    <Card className="h-100 shadow-sm p-3">
                      <Card.Body>
                        <Card.Title>{event.title}</Card.Title>
                        <Card.Text>
                          <strong>Date:</strong> {event.date}
                          <br />
                          <strong>Time:</strong> {event.time}
                        </Card.Text>
                        <Card.Text
                          className="text-muted"
                          style={{ fontSize: "0.9em", textAlign: "justify" }}
                        >
                          {event.description?.slice(0, 120)}...
                        </Card.Text>
                        <div className="d-flex justify-content-between gap-2">
                          {event.ruleBook && (
                            <Button
                              variant="outline-primary"
                              href={`http://localhost:5000${event.ruleBook}`}
                              target="_blank"
                              size="sm"
                            >
                              Rulebook
                            </Button>
                          )}
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleDownloadReceipt(entry._id)}
                          >
                            Download Receipt
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleOpenFeedback(event._id)}
                          >
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
        onHide={() => setShowCalendar(false)}
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
                    🔸 {entry.event.title}
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
        onHide={() => setShowFeedbackModal(false)}
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
              placeholder="Enter your thoughts..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowFeedbackModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmitFeedback}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserDashboard;
