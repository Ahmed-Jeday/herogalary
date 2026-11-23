const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const env = require("./env");

let cachedPublicKey = "";

function resolveKeyPath() {
  if (path.isAbsolute(env.jwtPublicKeyPath)) {
    return env.jwtPublicKeyPath;
  }

  const candidates = [
    path.resolve(process.cwd(), env.jwtPublicKeyPath),
    // Fallback si le service est lancé depuis la racine du dépôt.
    path.resolve(__dirname, "../../", env.jwtPublicKeyPath),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

function getPublicKey() {
  if (cachedPublicKey) {
    return cachedPublicKey;
  }

  if (env.jwtPublicKey) {
    cachedPublicKey = env.jwtPublicKey.replace(/\\n/g, "\n");
    return cachedPublicKey;
  }

  const keyPath = resolveKeyPath();

  try {
    cachedPublicKey = fs.readFileSync(keyPath, "utf8");
  } catch (error) {
    throw new Error(
      `Unable to read the JWT public key at ${keyPath}: ${error.message}`,
    );
  }

  return cachedPublicKey;
}

/**
 * Vérifie un access token émis par l'auth-service (RS256).
 * Retourne le payload : { sub, username, role, iat, exp, iss, aud }.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, getPublicKey(), {
    algorithms: ["RS256"],
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });
}

module.exports = { verifyAccessToken };
