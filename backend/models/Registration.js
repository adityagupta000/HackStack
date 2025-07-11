const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
  verificationToken: {
    type: String,
    unique: true,
  },
  tokenExpiresAt: {
    type: Date,
  },
});

module.exports = mongoose.model("Registration", registrationSchema);
