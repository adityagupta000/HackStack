import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Import images using require
const partnerLogo1 = require('../images/19.png');
const partnerLogo2 = require('../images/20.png');
const partnerLogo3 = require('../images/21.png');

const AboutUs = () => (
  <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: 'black' }}>
    <div className="container d-flex flex-column justify-content-center flex-grow-1 py-5">
      <div className="container bg-white p-4 p-md-5 rounded shadow-sm">
        <h1 className="text-center mb-4" style={{ color: 'black', fontWeight: 'bold' }}>About Us</h1>

        <div className="row mb-4">
          <div className="col-md-6">
            <h2 style={{ color: 'green' }}>Our Mission</h2>
            <p>
              At Hack-a-Fest, our mission is to bring together innovators and problem-solvers to create impactful solutions through collaborative and competitive programming events. We aim to foster creativity, teamwork, and technical excellence in a dynamic and inclusive environment.
            </p>
          </div>
          <div className="col-md-6">
            <h2 style={{ color: 'red' }}>Our Team</h2>
            <p>
              Our team is composed of passionate individuals with diverse backgrounds in technology, design, and business. Each member brings unique skills and perspectives to the table, working together to deliver exceptional hackathon experiences.
            </p>
          </div>
        </div>

        <div className="text-center mb-4">
          <h2 style={{ color: 'red' }}>Our Story</h2>
          <p>
            Founded in 2020, Hack-a-Fest started as a small local hackathon and has grown into a renowned platform for tech enthusiasts and professionals to showcase their skills and ideas. Our events have inspired numerous successful projects and fostered lasting connections among participants.
          </p>
        </div>

        <div className="text-center mb-4">
          <h2 style={{ color: 'red' }}>Our Achievements</h2>
          <ul className="list-unstyled">
            <li><i className="fas fa-trophy" style={{ color: 'blue', fontSize: '20px', marginBottom: '10px' }}></i> Organized over 50 successful hackathons</li>
            <li><i className="fas fa-users" style={{ color: 'blue', fontSize: '20px', marginBottom: '10px' }}></i> Engaged with more than 10,000 participants</li>
            <li><i className="fas fa-rocket" style={{ color: 'blue', fontSize: '20px', marginBottom: '10px' }}></i> Supported innovative startups and projects</li>
          </ul>
        </div>

        <div className="text-center mb-4">
          <h2 style={{ color: 'red' }}>Partners</h2>
          <div className="d-flex justify-content-center flex-wrap">
            <img src={partnerLogo1} alt="Partner 1" className="img-fluid mx-2" style={{ maxWidth: '150px' }} />
            <img src={partnerLogo2} alt="Partner 2" className="img-fluid mx-2" style={{ maxWidth: '150px' }} />
            <img src={partnerLogo3} alt="Partner 3" className="img-fluid mx-2" style={{ maxWidth: '150px' }} />
          </div>
        </div>

        <div className="text-center mb-4">
          <h2 style={{ color: 'red' }}>Testimonials</h2>
          <div className="d-flex flex-column align-items-center">
            <blockquote className="blockquote text-center">
              <p className="mb-0">"Hack-a-Fest was an incredible experience! The opportunity to collaborate with talented individuals and work on challenging problems was truly rewarding."</p>
              <footer className="blockquote-footer mt-2">Aditya Gupta, Participant</footer>
            </blockquote>
            <blockquote className="blockquote text-center mt-4">
              <p className="mb-0">"The organization and support provided by the Hack-a-Fest team were outstanding. It was a great platform to showcase our ideas and connect with industry leaders."</p>
              <footer className="blockquote-footer mt-2">Ajay, Mentor</footer>
            </blockquote>
          </div>
        </div>

        <div className="text-center">
          <h2 style={{ color: 'red' }}>Contact Us</h2>
          <p>
            If you have any questions or would like to get in touch with us, please don't hesitate to <a href="mailto:info@hackafest.com" style={{ color: 'red' }}>email us</a>. We're always happy to hear from you!
          </p>
          <div className="d-flex justify-content-center mt-4">
            <a href="https://facebook.com/hackafest" className="btn btn-primary mx-2" style={{ backgroundColor: '#3b5998' }}><i className="fab fa-facebook-f"></i> Facebook</a>
            <a href="https://twitter.com/hackafest" className="btn btn-info mx-2"><i className="fab fa-twitter"></i> Twitter</a>
            <a href="https://linkedin.com/company/hackafest" className="btn btn-secondary mx-2" style={{ backgroundColor: '#0077b5' }}><i className="fab fa-linkedin-in"></i> LinkedIn</a>
          </div>
        </div>
      </div>
    </div>
    <footer className="bg-black white text-white text-center py-3 mt-auto border-top border-light">
      <p className="mb-0">© 2024 Hack-A-Fest. All rights reserved.</p>
    </footer>
  </div>
);

export default AboutUs;
