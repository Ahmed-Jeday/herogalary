const jwt = require("jsonwebtoken");
const { verifyAccessToken } = require("../utils/token");

function authenticate(req, res, next) {
  const authorization = req.get("authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      error: { code: "MISSING_TOKEN", message: "Bearer access token is required" },
    });
  }

  const token = authorization.slice("Bearer ".length).trim();

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };
    return next();
  } catch (error) {
    const code = error instanceof jwt.TokenExpiredError
      ? "TOKEN_EXPIRED"
      : "INVALID_TOKEN";
    return res.status(401).json({
      error: { code, message: "Access token is invalid or expired" },
    });
  }
}

module.exports = authenticate;