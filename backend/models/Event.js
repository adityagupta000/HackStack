const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    date: {
      type: String, 
      required: [true, "Date is required"],
    },
    time: {
      type: String,
      required: [true, "Time is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "SOFTWARE DOMAIN EVENTS",
        "HARDWARE DOMAIN EVENTS",
        "ROBOTICS DOMAIN EVENTS",
        "IoT DOMAIN EVENTS",
        "AI/ML DOMAIN EVENTS",
        "CYBERSECURITY DOMAIN EVENTS",
      ],
    },
    ruleBook: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    registrationFields: {
      type: [String],
      required: true,
      validate: [(val) => val.length > 0, "At least one field required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ date: 1 });

module.exports = mongoose.model("Event", eventSchema);
