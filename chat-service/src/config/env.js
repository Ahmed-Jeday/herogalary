require("dotenv").config();

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseOrigins(value) {
  return String(value || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  port: toPositiveInt(process.env.PORT, 3003),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/heroverse_chat",
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
  jwtIssuer: process.env.JWT_ISSUER || "heroverse-auth",
  jwtAudience: process.env.JWT_AUDIENCE || "heroverse-services",
  jwtPublicKeyPath:
    process.env.JWT_PUBLIC_KEY_PATH || "../auth-service/keys/public.pem",
  // Clé PEM inline, prioritaire sur le chemin (utile en cloud).
  jwtPublicKey: process.env.JWT_PUBLIC_KEY || "",
  messageHistoryLimit: Math.min(
    toPositiveInt(process.env.MESSAGE_HISTORY_LIMIT, 100),
    200,
  ),
});

module.exports = env;
