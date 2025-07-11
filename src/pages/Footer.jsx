import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Row, Col } from "react-bootstrap";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./Footer.css";

const Footer = () => (
  <footer className="footer bg-black text-white">
    <Row className=" mx-3 py-4 text-center text-md-start">
      <Col lg={4} md={6} className="mb-4 mb-lg-0">
        <h5 className="text-uppercase mb-3">About Hack-a-Fest</h5>
        <p>
          Join the Innovation Revolution! At Hack-a-Fest, we bring together the
          brightest minds to tackle real-world challenges through technology and
          creativity. Whether you're a coder, designer, or tech enthusiast, our
          hackathons provide the perfect platform to showcase your skills,
          collaborate with like-minded individuals, and drive innovation. Don’t
          miss out on our next event—register now and be part of the future!
        </p>
        <a href="/about" className="text-white shining-text">
          Learn More
        </a>
      </Col>
      <Col lg={2} md={6} className="mb-4 mb-lg-0">
        <h5 className="text-uppercase mb-3">Follow Us</h5>
        <ul className="list-unstyled d-flex justify-content-center justify-content-md-start">
          <li className="me-3">
            <a
              href="https://www.facebook.com/"
              className="text-white"
              aria-label="Facebook"
            >
              <i className="fab fa-facebook-f"></i>
            </a>
          </li>
          <li className="me-3">
            <a
              href="https://github.com/"
              className="text-white"
              aria-label="GitHub"
            >
              <i className="fab fa-github"></i>
            </a>
          </li>
          <li className="me-3">
            <a
              href="https://twitter.com/"
              className="text-white"
              aria-label="Twitter"
            >
              <i className="fab fa-twitter"></i>
            </a>
          </li>
          <li className="me-3">
            <a
              href="https://www.instagram.com/"
              className="text-white"
              aria-label="Instagram"
            >
              <i className="fab fa-instagram"></i>
            </a>
          </li>
        </ul>
        <h5 className="text-uppercase mt-5">Quick Links</h5>
        <ul className="list-unstyled">
          <li>
            <a href="#!" className="text-white">
              Privacy Policy
            </a>
          </li>
          <li>
            <a href="#!" className="text-white">
              Terms of Service
            </a>
          </li>
          <li>
            <a href="#!" className="text-white">
              Contact Us
            </a>
          </li>
        </ul>
      </Col>
      <Col lg={3} md={6} className="mb-4 mb-lg-0">
        <h5 className="text-uppercase mb-3">Location</h5>
        <p>
          123 Hackathon Street,
          <br />
          Mangaluru City, IN 575006
          <br />
          Email: contact@hackafest.com
          <br />
          Phone: 9966885544
        </p>
      </Col>
      <Col lg={3} md={6} className="mb-lg-0">
        <h5 className="text-uppercase mb-3">Find Us</h5>
        <iframe
          title="Hackathon Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3890.493800916483!2d74.92293479999999!3d12.866339399999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba358ff28ef6cf3%3A0xe93953598f53c53c!2sSahyadri%20College%20of%20Engineering%20%26%20Management%20(Autonomous)!5e0!3m2!1sen!2sin!4v1635806988908!5m2!1sen!2sin"
          width="100%"
          height="200"
          style={{ borderRadius: "5px", border: "none" }}
          allowFullScreen=""
          loading="fast"
        ></iframe>
      </Col>
    </Row>
    <div className="text-center py-3 bg-black ">
      <p className="mb-0 mt-2">
        &copy; 2024 Hackathon. Built during a hackathon.
      </p>
    </div>
  </footer>
);

export default Footer;
