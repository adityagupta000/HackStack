require("dotenv").config();

const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"];
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Error: Missing environment variable ${key}`);
    process.exit(1);
  }
});

module.exports = {
  mongoURI: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || "1h",
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
};
