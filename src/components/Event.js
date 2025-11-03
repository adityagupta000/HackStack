// src/components/Event.js - FIXED VERSION
import React, { useEffect, useState, useCallback } from "react";
import EventCard from "./CardFunction";
import axiosInstance from "../utils/axiosInstance";
import { sanitizeInput, sanitizeSearchQuery } from "../utils/sanitize";
import { validateSearchQuery } from "../utils/validation";
import { handleAPIError } from "../utils/errorHandler";
import logger from "../utils/logger";
import toast from "react-hot-toast";

const categories = [
  "ALL",
  "SOFTWARE DOMAIN EVENTS",
  "HARDWARE DOMAIN EVENTS",
  "ROBOTICS DOMAIN EVENTS",
  "IoT DOMAIN EVENTS",
  "AI/ML DOMAIN EVENTS",
  "CYBERSECURITY DOMAIN EVENTS",
];

// FIXED: Helper function to get correct image URL
const getImageURL = (imagePath) => {
  if (!imagePath) return "/placeholder-image.jpg";

  // If it's already a full URL, return it
  if (imagePath.startsWith("http")) return imagePath;

  // Remove any duplicate slashes and ensure correct path
  const cleanPath = imagePath.replace(/\/\//g, "/");

  // If path doesn't start with /uploads, add it
  if (!cleanPath.startsWith("/uploads")) {
    return `http://localhost:5000/uploads/images/${cleanPath}`;
  }

  return `http://localhost:5000${cleanPath}`;
};

// FIXED: Helper function to get correct rulebook URL
const getRulebookURL = (rulebookPath) => {
  if (!rulebookPath) return null;

  // If it's already a full URL, return it
  if (rulebookPath.startsWith("http")) return rulebookPath;

  // Remove any duplicate slashes and ensure correct path
  const cleanPath = rulebookPath.replace(/\/\//g, "/");

  // If path doesn't start with /uploads, add it
  if (!cleanPath.startsWith("/uploads")) {
    return `http://localhost:5000/uploads/rulebooks/${cleanPath}`;
  }

  return `http://localhost:5000${cleanPath}`;
};

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleEvents, setVisibleEvents] = useState(4);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get(
        selectedCategory === "ALL"
          ? "/events"
          : `/events?category=${encodeURIComponent(selectedCategory)}`,
        {
          timeout: 10000,
        }
      );

      setEvents(response.data);
      setRetryCount(0);

      logger.info("Events fetched successfully", {
        category: selectedCategory,
        count: response.data.length,
      });
    } catch (error) {
      setError("Failed to load events. Please try again.");

      logger.error("Failed to fetch events", error, {
        category: selectedCategory,
        retryCount,
        status: error.response?.status,
      });

      handleAPIError(error, {
        fallbackMessage: "Failed to load events",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, retryCount]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCategoryChange = (category) => {
    const sanitized = sanitizeInput(category);
    setSelectedCategory(sanitized);
    setVisibleEvents(4);

    logger.action("category_filter_changed", {
      from: selectedCategory,
      to: sanitized,
    });
  };

  const handleLoadMore = () => {
    setVisibleEvents((prev) => prev + 4);
    logger.action("load_more_events", {
      currentVisible: visibleEvents,
      newVisible: visibleEvents + 4,
    });
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    fetchEvents();
    logger.action("retry_fetch_events", { retryCount: retryCount + 1 });
  };

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
              onClick={() => handleCategoryChange(cat)}
              aria-label={`Filter by ${cat}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Section */}
      <div className="events-section">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="status-message">Loading events...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <p className="status-message">{error}</p>
            <button onClick={handleRetry} className="retry-btn">
              <i className="fas fa-redo mr-2"></i>
              Try Again
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fas fa-calendar-times"></i>
            </div>
            <p className="status-message">
              No events available in this category.
            </p>
            <button
              onClick={() => handleCategoryChange("ALL")}
              className="category-btn category-btn-active"
            >
              View All Events
            </button>
          </div>
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
                  image={getImageURL(event.image)}
                  link={event.link}
                  ruleBook={getRulebookURL(event.ruleBook)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More Button */}
      {!loading && !error && visibleEvents < events.length && (
        <div className="load-more">
          <button onClick={handleLoadMore} className="load-more-btn">
            <i className="fas fa-plus-circle mr-2"></i>
            Load More Events
          </button>
          <p className="load-more-text">
            Showing {visibleEvents} of {events.length} events
          </p>
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
          scrollbar-width: none;
        }

        .category-container::-webkit-scrollbar {
          display: none;
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
          cursor: pointer;
          font-size: 0.9rem;
        }

        .category-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .category-btn-active {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }

        .events-section {
          margin: 2rem 0;
          min-height: 400px;
        }

        .events-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: repeat(4, minmax(300px, 1fr));
        }

        .event-item {
          height: 100%;
        }

        .loading-container,
        .error-container,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
        }

        .spinner {
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-left-color: #0d6efd;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-icon,
        .empty-icon {
          font-size: 4rem;
          color: #dc3545;
          margin-bottom: 1rem;
        }

        .empty-icon {
          color: #6c757d;
        }

        .status-message {
          text-align: center;
          color: #6c757d;
          font-size: 1.1rem;
          margin: 1rem 0;
        }

        .retry-btn {
          padding: 0.75rem 2rem;
          border: 1px solid white;
          background: #dc3545;
          color: white;
          border-radius: 4px;
          transition: all 0.3s ease;
          cursor: pointer;
          margin-top: 1rem;
        }

        .retry-btn:hover {
          background: #bb2d3b;
          transform: translateY(-2px);
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
          cursor: pointer;
          font-size: 1rem;
        }

        .load-more-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .load-more-text {
          margin-top: 0.5rem;
          color: #6c757d;
          font-size: 0.9rem;
        }

        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .events-grid {
            grid-template-columns: repeat(3, minmax(250px, 1fr));
          }
        }

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

          .category-btn {
            font-size: 0.85rem;
            padding: 0.4rem 0.8rem;
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
