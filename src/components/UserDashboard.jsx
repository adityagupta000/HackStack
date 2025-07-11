import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import toast from "react-hot-toast";
import { Card, Button } from "react-bootstrap";

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

    if (!response.ok) {
      throw new Error("Failed to fetch PDF");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt_${registrationId}.pdf`; // Suggested file name
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

    const matchesSearch =
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="container mt-5">
      <div className="flex justify-between items-center mb-4">
        {/* Back Button */}
        <button
          onClick={() => (window.location.href = "/home")}
          className="text-sm text-blue-600 hover:underline flex items-center"
        >
          <i className="fas fa-arrow-left mr-2"></i> Back to Home
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
                  className="w-full border-2 border-black rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-0"
                />
              </div>
            </div>
          )}

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
                        <div className="d-flex justify-content-between">
                          {event.ruleBook && (
                            <Button
                              variant="outline-primary"
                              href={`http://localhost:5000${event.ruleBook}`}
                              target="_blank"
                              size="sm"
                              className="me-2"
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
    </div>
  );
};

export default UserDashboard;
