import React, { useState, useEffect } from "react";
import { Carousel } from "react-bootstrap";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap/dist/css/bootstrap.min.css";

const TypingEffect = ({ text, speed = 100, style = {} }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, index + 1));
      setIndex((prevIndex) => prevIndex + 1);
    }, speed);

    if (index >= text.length) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [index, text, speed]);

  return (
    <span style={{ whiteSpace: "nowrap", ...style }}>{displayedText}</span>
  );
};

const Home = () => (
  <div className="container-fluid px-0 py-3 bg-black text-white d-flex flex-column justify-content-center align-items-center min-vh-100">
    <Carousel
      controls={false}
      indicators={false}
      interval={1000}
      className="w-100 h-100"
    >
      <Carousel.Item className="d-flex justify-content-center align-items-center h-100">
        <div className="text-center">
          <h3 className="display-text fw-bold">
            <TypingEffect
              text="Welcome To HackStack"
              style={{ color: "#FFEFD5" }}
              speed={150}
            />
            <span
              className="blinking-dot"
              style={{ color: "#AB274F", marginLeft: "2px" }}
            >
              .
            </span>
          </h3>
          <i
            className="fas fa-chevron-down text-pink mt-4 bounce"
            style={{ color: "#FF91A4" }}
          ></i>
        </div>
      </Carousel.Item>
    </Carousel>

    <style>{`
      .blinking-dot {
        animation: blink 0.9s step-start 0s infinite;
      }

      @keyframes blink {
        50% {
          opacity: 0;
        }
      }

      .bounce {
        animation: bounce 2s infinite;
      }

      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-20px);
        }
        60% {
          transform: translateY(-10px);
        }
      }

      .full-page-carousel {
        height: 100vh;
        width: 100%;
        overflow: hidden;
      }

      .full-page-carousel .carousel-item {
        height: 100vh;
        background-color: black;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .display-text {
        font-size: 75px; /* Default size for laptops and larger screens */
      }

      .fas.fa-chevron-down {
        font-size: 2rem; /* Default size for larger screens */
      }

      @media (max-width: 576px) {
        .display-text {
          font-size: 31px; /* Font size for mobile view */
        }
        .fas.fa-chevron-down {
          font-size: 1.5rem;
        }
      }

      @media (min-width: 576px) and (max-width: 768px) {
        .display-text {
          font-size: 50px; /* Adjusted size for tablets and medium screens */
        }
        .fas.fa-chevron-down {
          font-size: 1.75rem;
        }
      }
    `}</style>
  </div>
);

export default Home;
