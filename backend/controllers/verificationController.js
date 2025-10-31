const Registration = require("../models/Registration");
const logger = require("../config/logger");

exports.verifyToken = async (req, res) => {
  const { token } = req.params;

  try {
    const registration = await Registration.findOne({
      verificationToken: token,
      tokenExpiresAt: { $gt: new Date() }, // Not expired
    }).populate("user event");

    if (!registration) {
      logger.warn("Invalid or expired verification token", {
        requestId: req.id,
      });
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    logger.info("Verification token validated", {
      registrationId: registration._id,
      userId: registration.user._id,
      requestId: req.id,
    });

    res.status(200).json({
      name: registration.user.name,
      email: registration.user.email,
      eventTitle: registration.event.title,
      eventDate: registration.event.date,
      eventTime: registration.event.time,
      registeredAt: registration.registeredAt,
    });
  } catch (err) {
    logger.error("Verification error", {
      error: err.message,
      stack: err.stack,
      requestId: req.id,
    });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = exports;