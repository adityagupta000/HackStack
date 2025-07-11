import React, { useEffect, useState, useCallback } from "react";
import EventCard from "./CardFunction";
import axiosInstance from "../utils/axiosInstance";

const categories = [
  "ALL",
  "SOFTWARE DOMAIN EVENTS",
  "HARDWARE DOMAIN EVENTS",
  "ROBOTICS DOMAIN EVENTS",
  "IoT DOMAIN EVENTS",
  "AI/ML DOMAIN EVENTS",
  "CYBERSECURITY DOMAIN EVENTS",
];

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleEvents, setVisibleEvents] = useState(4);
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        selectedCategory === "ALL"
          ? "/events"
          : `/events?category=${encodeURIComponent(selectedCategory)}`
      );
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="event-list-container">
      <h1 className="event-title">
        Few Listed Events
        <i className="fas fa-chevron-down bounce-icon"></i>
      </h1>

      {/* Category Filter */}
      <div className="category-container">
        <div className="category-scroll">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-btn ${
                selectedCategory === cat ? "category-btn-active" : ""
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {/* Events Grid */}
      <div className="events-section">
        {loading ? (
          <p className="status-message">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="status-message">No events available.</p>
        ) : (
          <div className="events-grid">
            {events.slice(0, visibleEvents).map((event) => (
              <div className="event-item" key={event._id}>
                <EventCard
                  eventId={event._id}
                  title={event.title}
                  date={event.date}
                  time={event.time}
                  description={event.description}
                  image={
                    event.image.startsWith("/uploads")
                      ? `http://localhost:5000${event.image.replace("//", "/")}`
                      : event.image
                  }
                  link={event.link}
                  ruleBook={
                    event.ruleBook
                      ? `http://localhost:5000${event.ruleBook.replace("//", "/")}`
                      : event.ruleBook
                  } 
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More Button */}
      {visibleEvents < events.length && (
        <div className="load-more">
          <button
            onClick={() => setVisibleEvents(visibleEvents + 4)}
            className="load-more-btn"
          >
            More Events
          </button>
        </div>
      )}

      <style>
        {`
          .event-list-container {
            padding: 1.5rem;
            background-color: black;
            color: white;
            min-height: 100vh;
          }

          .event-title {
            text-align: center;
            color: #dc3545;
            margin-bottom: 2rem;
            font-size: 2.5rem;
            font-weight: bold;
          }

          .bounce-icon {
            color: #28a745;
            margin-left: 1rem;
            animation: bounce 1s infinite;
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }

          .category-container {
            margin-bottom: 2rem;
            overflow-x: auto;
            padding: 1rem 0;
          }

          .category-scroll {
            display: flex;
            gap: 0.5rem;
            flex-wrap: nowrap;
            min-width: min-content;
            justify-content: center;
            padding: 0 1rem;
          }

          .category-btn {
            white-space: nowrap;
            padding: 0.5rem 1rem;
            border: 1px solid white;
            background: transparent;
            color: white;
            border-radius: 4px;
            transition: all 0.3s ease;
          }

          .category-btn:hover {
            background-color: rgba(255, 255, 255, 0.1);
          }

          .category-btn-active {
            background-color: #0d6efd;
            border-color: #0d6efd;
          }

          .events-section {
            margin: 2rem 0;
          }

.events-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(4, minmax(300px, 1fr));
}

          .event-item {
            height: 100%;
          }

          .status-message {
            text-align: center;
            color: #6c757d;
            font-size: 1.1rem;
            margin: 2rem 0;
          }

          .load-more {
            text-align: center;
            margin-top: 2rem;
          }

          .load-more-btn {
            padding: 0.75rem 2rem;
            border: 1px solid white;
            background: transparent;
            color: white;
            border-radius: 4px;
            transition: all 0.3s ease;
          }

          .load-more-btn:hover {
            background-color: rgba(255, 255, 255, 0.1);
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .event-title {
              font-size: 2rem;
            }

            .category-scroll {
              justify-content: flex-start;
            }

            .events-grid {
              grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            }
          }

          @media (max-width: 576px) {
            .event-list-container {
              padding: 1rem;
            }

            .event-title {
              font-size: 1.75rem;
            }

            .events-grid {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
};

export default EventList;
