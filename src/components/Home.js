import React from 'react';
import './App.css'; 
import '@fortawesome/fontawesome-free/css/all.min.css';
import CarouselComponent from './Carousel.jsx';
import Time from './Time.js';
import Sponsor from './partner.jsx';
import Card from './Event.js'

const Home = () => (
  <div className="container-fluid justify-content-around px-3 py-3 bg-black text-light">
    <CarouselComponent />
    <Time />
    <Card/>
    <Sponsor/>
  </div>
);

export default Home;
