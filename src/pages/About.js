import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { sanitizeHTML } from "../utils/sanitize";
import logger from "../utils/logger";

// Import images using require
const partnerLogo1 = require("../images/19.png");
const partnerLogo2 = require("../images/20.png");
const partnerLogo3 = require("../images/21.png");

const AboutUs = () => {
  // Log page view
  React.useEffect(() => {
    logger.info("About page viewed");
    logger.action("page_view", { page: "about" });
  }, []);

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{ backgroundColor: "black" }}
    >
      <div className="container d-flex flex-column justify-content-center flex-grow-1 py-5">
        <div className="container bg-white p-4 p-md-5 rounded shadow-sm">
          <h1
            className="text-center mb-4"
            style={{ color: "black", fontWeight: "bold" }}
          >
            About Us
          </h1>

          <div className="row mb-4">
            <div className="col-md-6">
              <h2 style={{ color: "green" }}>Our Mission</h2>
              <p>
                At Hack-a-Fest, our mission is to bring together innovators and
                problem-solvers to create impactful solutions through
                technology.
              </p>
            </div>
            <div className="col-md-6">
              <h2 style={{ color: "red" }}>Our Team</h2>
              <p>
                Our team is composed of passionate individuals with diverse
                backgrounds in technology, design, and entrepreneurship.
              </p>
            </div>
          </div>

          <div className="text-center mb-4">
            <h2 style={{ color: "red" }}>Our Story</h2>
            <p>
              Founded in 2020, Hack-a-Fest started as a small local hackathon
              and has grown into a renowned platform for innovation and
              collaboration.
            </p>
          </div>

          <div className="text-center mb-4">
            <h2 style={{ color: "red" }}>Our Achievements</h2>
            <ul className="list-unstyled">
              <li>
                <i
                  className="fas fa-trophy"
                  style={{
                    color: "blue",
                    fontSize: "20px",
                    marginBottom: "10px",
                  }}
                ></i>{" "}
                Over 50 successful events organized
              </li>
              <li>
                <i
                  className="fas fa-users"
                  style={{
                    color: "blue",
                    fontSize: "20px",
                    marginBottom: "10px",
                  }}
                ></i>{" "}
                10,000+ participants from around the world
              </li>
              <li>
                <i
                  className="fas fa-rocket"
                  style={{
                    color: "blue",
                    fontSize: "20px",
                    marginBottom: "10px",
                  }}
                ></i>{" "}
                100+ innovative projects launched
              </li>
            </ul>
          </div>

          <div className="text-center mb-4">
            <h2 style={{ color: "red" }}>Partners</h2>
            <div className="d-flex justify-content-center flex-wrap">
              <img
                src={partnerLogo1}
                alt="Partner 1"
                className="img-fluid mx-2"
                style={{ maxWidth: "150px" }}
                loading="lazy"
              />
              <img
                src={partnerLogo2}
                alt="Partner 2"
                className="img-fluid mx-2"
                style={{ maxWidth: "150px" }}
                loading="lazy"
              />
              <img
                src={partnerLogo3}
                alt="Partner 3"
                className="img-fluid mx-2"
                style={{ maxWidth: "150px" }}
                loading="lazy"
              />
            </div>
          </div>

          <div className="text-center mb-4">
            <h2 style={{ color: "red" }}>Testimonials</h2>
            <div className="d-flex flex-column align-items-center">
              <blockquote className="blockquote text-center">
                <p className="mb-0">
                  "Hack-a-Fest was an incredible experience! The opportunity to
                  collaborate with talented individuals was invaluable."
                </p>
                <footer className="blockquote-footer mt-2">
                  Aditya Gupta, Participant
                </footer>
              </blockquote>
              <blockquote className="blockquote text-center mt-4">
                <p className="mb-0">
                  "The organization and support provided by the Hack-a-Fest team
                  were outstanding. Highly recommended!"
                </p>
                <footer className="blockquote-footer mt-2">Ajay, Mentor</footer>
              </blockquote>
            </div>
          </div>

          <div className="text-center">
            <h2 style={{ color: "red" }}>Contact Us</h2>
            <p>
              If you have any questions or would like to get in touch with us,
              please don't hesitate to{" "}
              <a href="mailto:contact@hackafest.com">contact us</a>.
            </p>
            <div className="d-flex justify-content-center mt-4">
              <a
                href="https://facebook.com/hackafest"
                className="btn btn-primary mx-2"
                style={{ backgroundColor: "#3b5998", borderColor: "#3b5998" }}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
              <a
                href="https://twitter.com/hackafest"
                className="btn btn-info mx-2"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <i className="fab fa-twitter"></i>
              </a>
              <a
                href="https://linkedin.com/company/hackafest"
                className="btn btn-secondary mx-2"
                style={{ backgroundColor: "#0077b5", borderColor: "#0077b5" }}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
      <footer className="bg-black white text-white text-center py-3 mt-auto border-top border-light">
        <p className="mb-0">© 2024 Hack-A-Fest. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AboutUs;
