import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const sponsors = [
  {
    image: require('../images/13.png'),
    website: 'https://www.sahyadri.edu.in/',
  },
  {
    image: require('../images/14.png'),
    website: 'https://www.sosc.org.in/',
  },
  {
    image: require('../images/15.png'),
    website: 'https://students.ieee.org/student-branches/',
  },
  {
    image: require('../images/16.png'),
    website: 'https://example.com/sponsor4',
  },
  {
    image: require('../images/17.png'),
    website: 'https://example.com/sponsor5',
  },
  {
    image: require('../images/18.png'),
    website: 'https://example.com/sponsor6',
  }
];

const Sponsor = () => {
  // Split sponsors into rows
  const rows = [sponsors.slice(0, 4), sponsors.slice(4)];

  // Define inline styles
  const logoStyle = {
    maxWidth: '200px',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  };

  return (
    <div className="position-relative">

      <h2 className="text-center mb-5">
        <span className="text-danger">Sponsored</span> 
        <span className="text-info"> by</span>
      </h2>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="row justify-content-center">
          {row.map((sponsor, index) => (
            <div key={index} className="col-md-3 d-flex align-items-center mb-4">
              <a 
                href={sponsor.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="d-flex flex-column align-items-center w-100"
                style={{ textDecoration: 'none' }}
              >
                <img
                  src={sponsor.image}
                  alt="Sponsor logo"
                  className="img-fluid rounded-3 shadow-sm"
                  style={logoStyle}
                />
              </a>
            </div>
          ))}
        </div>
      ))}

      <style>
      {`
        .img-fluid:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
      `}
      </style>
    </div>
  );
};

export default Sponsor;