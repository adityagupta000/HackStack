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
    missing.forEach((v) => console.error(` - ${v}`));
    process.exit(1);
  }

  // Validate JWT secrets are different
  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    console.error("JWT_SECRET and JWT_REFRESH_SECRET must be different");
    process.exit(1);
  }

  // Validate secret lengths (increased to 64 for production)
  const minSecretLength = process.env.NODE_ENV === "production" ? 64 : 32;

  if (process.env.JWT_SECRET.length < minSecretLength) {
    console.error(`JWT_SECRET must be at least ${minSecretLength} characters`);
    process.exit(1);
  }

  if (process.env.JWT_REFRESH_SECRET.length < minSecretLength) {
    console.error(
      `JWT_REFRESH_SECRET must be at least ${minSecretLength} characters`
    );
    process.exit(1);
  }

  if (process.env.COOKIE_SECRET.length < minSecretLength) {
    console.error(
      `COOKIE_SECRET must be at least ${minSecretLength} characters`
    );
    process.exit(1);
  }

  // Validate FRONTEND_URL format
  if (process.env.FRONTEND_URL) {
    try {
      const url = new URL(process.env.FRONTEND_URL);
      if (!["http:", "https:"].includes(url.protocol)) {
        console.error("FRONTEND_URL must use http: or https: protocol");
        process.exit(1);
      }
    } catch (err) {
      console.error("FRONTEND_URL is not a valid URL");
      process.exit(1);
    }
  }

  if (
    !process.env.MONGODB_URI.startsWith("mongodb://") &&
    !process.env.MONGODB_URI.startsWith("mongodb+srv://")
  ) {
    console.error("MONGODB_URI must start with mongodb:// or mongodb+srv://");
    process.exit(1);
  }

  // Validate email configuration
  if (!process.env.EMAIL_USER.includes("@")) {
    console.error("EMAIL_USER must be a valid email address");
    process.exit(1);
  }

  // Validate bcrypt salt rounds
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);
  if (isNaN(saltRounds) || saltRounds < 10 || saltRounds > 20) {
    console.error("BCRYPT_SALT_ROUNDS must be between 10 and 20");
    process.exit(1);
  }

  // Warn about production settings
  if (process.env.NODE_ENV === "production") {
    console.log("✓ Environment variables validated for PRODUCTION");

    // Additional production checks
    if (process.env.FRONTEND_URL.includes("localhost")) {
      console.warn("WARNING: FRONTEND_URL contains 'localhost' in production");
    }

    if (saltRounds < 12) {
      console.warn(
        "WARNING: Consider using BCRYPT_SALT_ROUNDS >= 12 for production"
      );
    }
  } else {
    console.log("✓ Environment variables validated for DEVELOPMENT");
  }
};

module.exports = validateEnv;
