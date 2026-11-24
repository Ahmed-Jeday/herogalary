const fs = require("fs");
const jwt = require("jsonwebtoken");

const issuer = process.env.JWT_ISSUER || "heroverse-auth";
const audience = process.env.JWT_AUDIENCE || "heroverse-services";

function getPublicKey() {
  const keyPath = process.env.JWT_PUBLIC_KEY_PATH || "../auth-service/keys/public.pem";

  try {
    return fs.readFileSync(keyPath, "utf8");
  } catch (error) {
    throw new Error(`Unable to read JWT public key at ${keyPath}: ${error.message}`);
  }
}

function verifyAccessToken(token) {
  return jwt.verify(token, getPublicKey(), {
    algorithms: ["RS256"],
    issuer,
    audience,
  });
}

module.exports = { verifyAccessToken };
