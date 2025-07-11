const errorMiddleware = (err, req, res, next) => {
  console.error('Server Error:', err.stack);

  const statusCode = err.status || 500; // Use the provided status code or default to 500
  const response = {
    message: err.message || 'Something went wrong!',
  };

  // Include stack trace in development mode only
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
