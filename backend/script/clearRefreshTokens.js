// scripts/clearRefreshTokens.js
const mongoose = require("mongoose");
const User = require("../models/User"); // path to your user model

mongoose.connect(
  "mongodb+srv://adityagupta802624:aditya6366207377@cluster0.pbvrr8q.mongodb.net/HackaThon",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

(async () => {
  try {
    const result = await User.updateMany({}, { $set: { refreshToken: null } });
    console.log(`Cleared refresh tokens from ${result.modifiedCount} users`);
    process.exit(0);
  } catch (err) {
    console.error("Error clearing tokens:", err);
    process.exit(1);
  }
})();
