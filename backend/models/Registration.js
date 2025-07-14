const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
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
      sparse: true,
    },
    tokenExpiresAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "cancelled"],
      default: "pending",
    },
    customResponses: {
      type: Map,
      of: String,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "failed"],
      default: "unpaid",
    },
    receiptUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

registrationSchema.index({ user: 1, event: 1 }, { unique: true });
registrationSchema.index({ registeredAt: -1 });

module.exports = mongoose.model("Registration", registrationSchema);
