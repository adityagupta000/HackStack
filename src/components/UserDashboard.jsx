import React, { useEffect, useState } from "react";
import axios from "axios";

const UserDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5000/users/dashboard", { withCredentials: true })
      .then((response) => {
        setEvents(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching dashboard events:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading your registered events...</p>;

  return (
    <div className="dashboard-container">
      <h2>My Registered Events</h2>
      {events.length === 0 ? (
        <p>No active events.</p>
      ) : (
        <div className="event-grid">
          {events.map((event) => (
            <div key={event.eventId._id} className="event-card">
              <img
                src={event.eventId.image}
                alt={event.eventId.title}
                className="event-img"
              />
              <h3>{event.eventId.title}</h3>
              <p>
                {event.eventId.date} | {event.eventId.time}
              </p>
              <a
                href={event.eventId.ruleBook}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="btn btn-outline-info">
                  Download Rule Book
                </button>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
