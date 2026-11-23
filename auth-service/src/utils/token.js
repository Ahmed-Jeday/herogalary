const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const issuer = process.env.JWT_ISSUER || "heroverse-auth";
const audience = process.env.JWT_AUDIENCE || "heroverse-services";
const accessTokenTtl = Number(process.env.ACCESS_TOKEN_TTL_SECONDS || 900);
const refreshTokenTtl = Number(process.env.REFRESH_TOKEN_TTL_SECONDS || 604800);

function resolveKeyPath(environmentPath, fileName) {
  return path.resolve(process.cwd(), environmentPath || path.join("keys", fileName));
}

function ensureDevelopmentKeyPair() {
  const privateKeyPath = resolveKeyPath(process.env.JWT_PRIVATE_KEY_PATH, "private.pem");
  const publicKeyPath = resolveKeyPath(process.env.JWT_PUBLIC_KEY_PATH, "public.pem");

  if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
    return { privateKeyPath, publicKeyPath };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("RSA JWT key pair is missing");
  }

  fs.mkdirSync(path.dirname(privateKeyPath), { recursive: true });
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  fs.writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });
  fs.writeFileSync(publicKeyPath, publicKey);

  return { privateKeyPath, publicKeyPath };
}

function getPrivateKey() {
  const { privateKeyPath } = ensureDevelopmentKeyPair();
  return fs.readFileSync(privateKeyPath, "utf8");
}

function getPublicKey() {
  const { publicKeyPath } = ensureDevelopmentKeyPair();
  return fs.readFileSync(publicKeyPath, "utf8");
}

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    getPrivateKey(),
    {
      algorithm: "RS256",
      expiresIn: accessTokenTtl,
      issuer,
      audience,
    },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, getPublicKey(), {
    algorithms: ["RS256"],
    issuer,
    audience,
  });
}

function createRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = {
  accessTokenTtl,
  refreshTokenTtl,
  signAccessToken,
  verifyAccessToken,
  createRefreshToken,
  hashRefreshToken,
};