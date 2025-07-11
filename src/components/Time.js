import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const HomeScreen = () => {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateTimer = () => {
      const storedTargetTime = localStorage.getItem('targetTime');
      let targetTime;

      if (storedTargetTime) {
        targetTime = parseInt(storedTargetTime, 10);
        console.log("Stored target time:", targetTime);
      } else {
        targetTime = new Date().getTime() + 10 * 24 * 60 * 60 * 1000; // 10 days from now
        localStorage.setItem('targetTime', targetTime);
        console.log("New target time set:", targetTime);
      }

      const now = new Date().getTime();
      const distance = targetTime - now;
      console.log("Current time:", now);
      console.log("Time distance:", distance);

      if (distance >= 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTime({ days, hours, minutes, seconds });
      } else {
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer(); // Initial call to set the timer immediately
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="overflow-x-hidden text-white">
      <div className="container py-5">
        <h1 className="text-center mb-5">
          <span className="text-danger ">Countdown</span> To <span className="text-info">Innovation</span>
        </h1>
        <div className="row justify-content-center">
          <div className="col-6 col-md-4 col-lg-2 text-center mb-4">
            <div className="p-4 bg-warning text-black rounded">
              <div className="display-1">{time.days}</div>
              <div className="h5">Days</div>
            </div>
          </div>
          <div className="col-6 col-md-4 col-lg-2 text-center mb-4">
            <div className="p-4 bg-danger text-black rounded">
              <div className="display-1">{time.hours}</div>
              <div className="h5">Hours</div>
            </div>
          </div>
          <div className="col-6 col-md-4 col-lg-2 text-center mb-4">
            <div className="p-4 bg-light text-dark rounded">
              <div className="display-1">{time.minutes}</div>
              <div className="h5">Minutes</div>
            </div>
          </div>
          <div className="col-6 col-md-4 col-lg-2 text-center mb-4">
            <div className="p-4 bg-info text-dark rounded">
              <div className="display-1">{time.seconds}</div>
              <div className="h5">Seconds</div>
            </div>
          </div>
        </div>
        {/* <div className="text-center mt-4">
          <button className="btn btn-primary" onClick={resetTimer}>Reset Timer</button>
        </div> */}
      </div>
    </main>
  );
};

export default HomeScreen;
