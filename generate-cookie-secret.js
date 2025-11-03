const crypto = require("crypto");

function generateSecret(bytes = 48) {
  return crypto.randomBytes(bytes).toString("base64");
}

console.log("\n=== GENERATED SECRETS ===\n");

const COOKIE_SECRET = generateSecret();            // cookie secret
const JWT_SECRET = generateSecret();              // access token secret
const JWT_REFRESH_SECRET = generateSecret();     // refresh token secret

console.log(`COOKIE_SECRET="${COOKIE_SECRET}"`);
console.log(`JWT_SECRET="${JWT_SECRET}"`);
console.log(`JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"`);

console.log("\nCopy these into your .env file\n");
