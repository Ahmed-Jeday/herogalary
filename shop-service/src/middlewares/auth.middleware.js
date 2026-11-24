const jwt = require("jsonwebtoken");
const { verifyAccessToken } = require("../utils/jwt");

function authenticate(req, res, next) {
  const authorization = req.get("authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      error: { code: "MISSING_TOKEN", message: "Bearer access token is required" },
    });
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({
      error: { code: "MISSING_TOKEN", message: "Bearer access token is required" },
    });
  }

  try {
    const payload = verifyAccessToken(token);

    if (!payload.sub) {
      return res.status(401).json({
        error: { code: "INVALID_TOKEN", message: "Access token has no user id" },
      });
    }

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
