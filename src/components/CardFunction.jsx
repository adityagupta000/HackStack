import React, { useState } from "react";
import { Modal, Button, Card } from "react-bootstrap";
import axiosInstance from "../utils/axiosInstance"; // USE THIS instead of axios
import toast from "react-hot-toast";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { sanitizeInput, sanitizeHTML } from "../utils/sanitize";
import { sanitizeURL } from "../utils/sanitize";
import logger from "../utils/logger";
import { handleAPIError } from "../utils/errorHandler";
import DOMPurify from "dompurify";

const EventCard = ({
  eventId,
  title,
  date,
  time,
  description,
  image,
  ruleBook,
  isRegistered = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [registered, setRegistered] = useState(isRegistered);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Sanitize all inputs
  const sanitizedTitle = DOMPurify.sanitize(title || "Event Title");
  const sanitizedDate = sanitizeInput(date || "Date not available");
  const sanitizedTime = sanitizeInput(time || "Time not available");
  const sanitizedDescription = DOMPurify.sanitize(
    description || "No description provided."
  );

  // Validate and sanitize image URL
  const sanitizedImageURL = sanitizeURL(image) || "/placeholder-image.jpg";
  const sanitizedRuleBookURL = ruleBook ? sanitizeURL(ruleBook) : null;

  const handleShow = () => {
    setShowModal(true);
    logger.action("event_card_opened", { eventId, title: sanitizedTitle });
  };

  const handleClose = () => {
    setShowModal(false);
    logger.action("event_card_closed", { eventId });
  };

  const handleRegister = async () => {
    if (registered) {
      toast.info("You are already registered for this event");
      return;
    }

    setRegistering(true);

    try {
      const userRole = localStorage.getItem("userRole");

      if (!userRole) {
        toast.error("Please login to register for events");
        logger.warn("Registration attempted without authentication");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }

      const res = await axiosInstance.post(
        `/registrations/${eventId}/register`,
        {},
        {
          withCredentials: true,
        }
      );

      toast.success(res.data.message || "Successfully registered!");
      setRegistered(true);

      logger.info("Event registration successful", {
        eventId,
        title: sanitizedTitle,
      });

      logger.action("event_registered", { eventId });
    } catch (err) {
      logger.error("Event registration failed", err, {
        eventId,
        status: err.response?.status,
      });

      handleAPIError(err, {
        fallbackMessage: "Error registering for event",
      });
    } finally {
      setRegistering(false);
    }
  };

  return (
    <>
      {/* Event Card */}
      <div className="card-container">
        <Card
          className="event-card mt-3 mb-3 card-glow bg-black text-white"
          style={{ height: "590px" }}
          onMouseMove={(e) => {
            const card = e.currentTarget;
            if (window.innerWidth >= 768) {
              const { left, top, width, height } = card.getBoundingClientRect();
              const x = e.clientX - left;
              const y = e.clientY - top;
              const xPercent = (x / width) * 2 - 1;
              const yPercent = (y / height) * 2 - 1;
              card.style.transform = `perspective(1000px) rotateX(${
                yPercent * -5
              }deg) rotateY(${xPercent * 5}deg)`;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform =
              "perspective(1000px) rotateX(0deg) rotateY(0deg)";
          }}
          onClick={handleShow}
        >
          <Card.Img
            variant="top"
            src={sanitizedImageURL}
            className="card-img"
            alt={sanitizedTitle}
            loading="lazy"
            onError={(e) => {
              e.target.src = "/placeholder-image.jpg";
              logger.warn("Image load failed", { eventId, image });
            }}
          />
          <Card.Body>
            <Card.Title className="card-title">{sanitizedTitle}</Card.Title>
            <Card.Text>
              <i className="fas fa-calendar-day me-2"></i>
              {sanitizedDate}
            </Card.Text>
            <Card.Text>
              <i className="fas fa-clock me-2" style={{ color: "red" }}></i>
              {sanitizedTime}
            </Card.Text>

            {/* Description with Read More toggle */}
            <Card.Text className="description-text">
              {showFullDescription
                ? sanitizedDescription
                : sanitizedDescription.slice(0, 300) +
                  (sanitizedDescription.length > 300 ? "..." : "")}

              {sanitizedDescription.length > 100 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullDescription(!showFullDescription);
                    logger.action("description_toggled", {
                      eventId,
                      expanded: !showFullDescription,
                    });
                  }}
                  style={{
                    color: "#0dcaf0",
                    cursor: "pointer",
                    marginLeft: "5px",
                  }}
                >
                  {showFullDescription ? "Show less" : "Read more"}
                </span>
              )}
            </Card.Text>
          </Card.Body>
        </Card>
      </div>

      {/* Event Modal */}
      <Modal
        show={showModal}
        onHide={handleClose}
        size="lg"
        centered
        className="modal-custom"
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ color: "brown" }}>{sanitizedTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="border-top-black">
          <div className="d-flex flex-column flex-lg-row align-items-center">
            <img
              src={sanitizedImageURL}
              alt={sanitizedTitle}
              className="modal-img"
              loading="lazy"
              onError={(e) => {
                e.target.src = "/placeholder-image.jpg";
              }}
            />
            <div className="ms-lg-3 mt-3 mt-lg-0">
              <p>
                <i
                  className="fas fa-calendar-day me-2"
                  style={{ color: "blue" }}
                ></i>
                {sanitizedDate}
              </p>
              <p>
                <i className="fas fa-clock me-2" style={{ color: "red" }}></i>
                {sanitizedTime}
              </p>
              <p
                className="description-text modal-description"
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-end">
          {sanitizedRuleBookURL && (
            <Button
              variant="outline-info"
              href={sanitizedRuleBookURL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ borderRadius: "10px" }}
              onClick={() => {
                logger.action("rulebook_viewed", { eventId });
              }}
            >
              Download Rule Book
            </Button>
          )}
          <Button
            variant="outline-danger"
            onClick={handleClose}
            style={{ borderRadius: "10px" }}
          >
            Close
          </Button>
          {!registered && (
            <Button
              variant="outline-success"
              onClick={handleRegister}
              style={{ borderRadius: "10px" }}
              disabled={registering}
            >
              {registering ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </Button>
          )}
          {registered && (
            <Button
              variant="outline-secondary"
              disabled
              style={{ borderRadius: "10px" }}
            >
              Registered
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Inline Styles */}
      <style>{`
        .card-container {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          margin: 10px;
        }

        .event-card {
          cursor: pointer;
          border: 1px solid black;
          box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
          transition: transform 0.3s ease, box-shadow 0.3s ease-in-out;
          position: relative;
          perspective: 1000px;
          will-change: transform;
        }

        .event-card:hover {
          box-shadow: 0 0px white;
          transform: scale(1.05);
        }

        .description-text {
          text-align: justify;
          text-justify: inter-word;
          word-wrap: break-word;
          hyphens: auto;
          line-height: 1.5;
          letter-spacing: 0.02em;
          word-spacing: 0.05em;
          margin-top: 10px;
        }

        .modal-description {
          padding-right: 10px;
          max-width: 100%;
        }

        .card-img {
          padding: 10px;
          width: 100%;
          height: 200px;
          object-fit: cover;
        }

        .card-title {
          border-top: 2px solid white;
          padding-top: 10px;
          color: red;
        }

        .modal-custom .modal-dialog {
          transition: transform 0.3s ease-in-out;
        }

        .modal-custom .modal-content {
          background-color: #28282B;
          color: white;
          border: 2px solid black;
        }

        .modal-img {
          width: 100%;
          height: auto;
          border-radius: 5px;
        }

        @media (min-width: 992px) {
          .modal-img {
            width: 50%;
          }
        }

        @media (max-width: 991px) {
          .modal-img {
            width: 100%;
          }
        }

        @media (max-width: 767px) {
          .event-card {
            max-width: none;
          }
          .description-text {
            padding: 0 5px;
          }
        }

        .border-top-black {
          border-top: 1px solid black;
        }
      `}</style>
    </>
  );
};

export default EventCard;
