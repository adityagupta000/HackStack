const Feedback = require("../models/Feedback");

exports.submitFeedback = async (req, res) => {
  try {
    const { eventId, text } = req.body;
    const userId = req.user._id;

    if (!eventId || !text) {
      return res.status(400).json({ message: "Event ID and text required" });
    }

    const feedback = new Feedback({
      user: userId,
      event: eventId,
      text,
    });

    await feedback.save();
    res.status(201).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("Feedback Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
