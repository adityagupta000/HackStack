import React, { useState } from "react";
import { Modal, Button, Card } from "react-bootstrap";
import axios from "axios";
import toast from "react-hot-toast";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

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

  const handleShow = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  const handleRegister = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(
        `http://localhost:5000/api/registrations/${eventId}/register`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(res.data.message);
      setRegistered(true);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Error registering for event."
      );
    }
  };

  return (
    <>
      {/* Event Card */}
      <div className="card-container">
        <Card
          className="event-card mt-3 mb-3 card-glow bg-black text-white"
          style={{ height: "590px" }} // ✅ Fixed width
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
          <Card.Img variant="top" src={image} className="card-img" />
          <Card.Body>
            <Card.Title className="card-title">
              {title || "Event Title"}
            </Card.Title>
            <Card.Text>
              <i className="fas fa-calendar-day me-2"></i>
              {date || "Date not available"}
            </Card.Text>
            <Card.Text>
              <i className="fas fa-clock me-2" style={{ color: "red" }}></i>
              {time || "Time not available"}
            </Card.Text>

            {/* Description with Read More toggle */}
            <Card.Text className="description-text">
              {description
                ? showFullDescription
                  ? description
                  : description.slice(0, 300) + (description.length > 300 ? "..." : "")
                : "No description provided."}

              {description?.length > 100 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullDescription(!showFullDescription);
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
        <Modal.Header>
          <Modal.Title style={{ color: "brown" }}>
            {title || "Event Details"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="border-top-black">
          <div className="d-flex flex-column flex-lg-row align-items-center">
            <img src={image} alt={title} className="modal-img" />
            <div className="ms-lg-3 mt-3 mt-lg-0">
              <p>
                <i
                  className="fas fa-calendar-day me-2"
                  style={{ color: "blue" }}
                ></i>
                {date || "Date not available"}
              </p>
              <p>
                <i className="fas fa-clock me-2" style={{ color: "red" }}></i>
                {time || "Time not available"}
              </p>
              <p className="description-text modal-description">
                {description || "No description provided."}
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-end">
          {ruleBook && (
            <Button
              variant="outline-info"
              href={ruleBook}
              target="_blank"
              style={{ borderRadius: "10px" }}
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
            >
              Register
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
