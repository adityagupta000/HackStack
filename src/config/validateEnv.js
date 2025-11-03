/**
 * Validate required environment variables
 */

const requiredEnvVars = ["REACT_APP_API_URL"];

const optionalEnvVars = [
  "REACT_APP_ENV",
  "REACT_APP_LOG_LEVEL",
  "REACT_APP_ENABLE_ANALYTICS",
];

/**
 * Validate environment variables
 * @throws {Error} If required variables are missing
 */
export const validateEnv = () => {
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    const errorMessage = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ FATAL ERROR: Missing Required Environment Variables
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following environment variables are required but not set:

${missing.map((v) => `  • ${v}`).join("\n")}

Please create a .env file in the root directory with:

${missing.map((v) => `${v}=your_value_here`).join("\n")}

Example .env file:
${requiredEnvVars.map((v) => `${v}=http://localhost:5000/api`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;

    console.error(errorMessage);
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  // Check optional variables and provide warnings
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  }

  // Validate API URL format
  const apiUrl = process.env.REACT_APP_API_URL;
  try {
    new URL(apiUrl);
  } catch (error) {
    throw new Error(
      `Invalid REACT_APP_API_URL format: "${apiUrl}". Must be a valid URL.`
    );
  }

  // Check for development/production consistency
  const nodeEnv = process.env.NODE_ENV;
  const appEnv = process.env.REACT_APP_ENV;

  if (appEnv && nodeEnv !== appEnv) {
    console.warn(
      `⚠️ Warning: NODE_ENV (${nodeEnv}) does not match REACT_APP_ENV (${appEnv})`
    );
  }

  // Log validation success
  if (process.env.NODE_ENV === "development") {
    console.log("Environment variables validated successfully");

    if (warnings.length > 0) {
      console.log("\nOptional environment variables not set:");
      warnings.forEach((v) => console.log(`  • ${v}`));
      console.log("");
    }

    // Display environment info
    console.log("Environment Configuration:");
    console.log(`  • NODE_ENV: ${nodeEnv}`);
    console.log(`  • API URL: ${apiUrl}`);
    console.log("");
  }
};

/**
 * Get environment value with default
 * @param {string} key - Environment variable key
 * @param {any} defaultValue - Default value if not set
 * @returns {any} Environment value or default
 */
export const getEnv = (key, defaultValue = null) => {
  return process.env[key] || defaultValue;
};

/**
 * Check if running in development mode
 * @returns {boolean} Is development
 */
export const isDevelopment = () => {
  return process.env.NODE_ENV === "development";
};

/**
 * Check if running in production mode
 * @returns {boolean} Is production
 */
export const isProduction = () => {
  return process.env.NODE_ENV === "production";
};

/**
 * Check if running in test mode
 * @returns {boolean} Is test
 */
export const isTest = () => {
  return process.env.NODE_ENV === "test";
};

export default {
  validateEnv,
  getEnv,
  isDevelopment,
  isProduction,
  isTest,
};
