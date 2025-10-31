const requiredEnvVars = [
  "MONGODB_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_ACCESS_EXPIRY",
  "JWT_REFRESH_EXPIRY",
  "COOKIE_SECRET",
  "EMAIL_USER",
  "EMAIL_PASS",
  "FRONTEND_URL",
  "BCRYPT_SALT_ROUNDS",
];

const validateEnv = () => {
  const missing = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    missing.forEach((v) => console.error(`   - ${v}`));
    process.exit(1);
  }

  // Validate JWT secrets are different
  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    console.error("JWT_SECRET and JWT_REFRESH_SECRET must be different");
    process.exit(1);
  }

  // Validate secret lengths
  if (process.env.JWT_SECRET.length < 32) {
    console.error("JWT_SECRET must be at least 32 characters");
    process.exit(1);
  }

  if (process.env.COOKIE_SECRET.length < 32) {
    console.error("COOKIE_SECRET must be at least 32 characters");
    process.exit(1);
  }

  console.log("Environment variables validated");
};

module.exports = validateEnv;
