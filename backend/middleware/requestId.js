const { v4: uuidv4 } = require("uuid");
const logger = require("../config/logger");

const requestIdMiddleware = (req, res, next) => {
  req.id = req.headers["x-request-id"] || uuidv4();
  res.setHeader("X-Request-Id", req.id);

  req.startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - req.startTime;

    if (process.env.NODE_ENV === "production") {
      logger.info("Request completed", {
        requestId: req.id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get("user-agent")?.substring(0, 100),
      });
    }

    if (duration > 5000) {
      logger.warn("Slow request detected", {
        requestId: req.id,
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
      });
    }
  });

  next();
};

module.exports = requestIdMiddleware;
