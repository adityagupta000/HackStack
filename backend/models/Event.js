const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        "SOFTWARE DOMAIN EVENTS",
        "HARDWARE DOMAIN EVENTS",
        "ROBOTICS DOMAIN EVENTS",
        "IoT DOMAIN EVENTS",
        "AI/ML DOMAIN EVENTS",
        "CYBERSECURITY DOMAIN EVENTS",
      ],
    },
    ruleBook: { type: String, required: false },
    price: { type: Number, required: true }, // Razorpay Payment
    registrationFields: { type: Array, required: true }, // Dynamic Form Fields
  },
  { timestamps: true }
);

EventSchema.index({ date: 1 });

const Event = mongoose.model("Event", EventSchema);
module.exports = Event;
