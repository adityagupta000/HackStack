const mongoose = require("mongoose");
const crypto = require("crypto");
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    refreshToken: { type: String, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
module.exports = User;