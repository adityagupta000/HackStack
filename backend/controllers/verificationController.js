const Registration = require("../models/Registration");

exports.verifyToken = async (req, res) => {
  const { token } = req.params;

  try {
    const registration = await Registration.findOne({
      verificationToken: token,
      tokenExpiresAt: { $gt: new Date() }, // Not expired
    }).populate("user event");

    if (!registration) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    res.status(200).json({
      name: registration.user.name,
      email: registration.user.email,
      eventTitle: registration.event.title,
      eventDate: registration.event.date,
      eventTime: registration.event.time,
      registeredAt: registration.registeredAt,
    });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
