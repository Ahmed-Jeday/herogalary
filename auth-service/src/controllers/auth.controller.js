const authService = require("../services/auth.service");
const { accessTokenTtl } = require("../utils/token");

const refreshCookieName = process.env.REFRESH_COOKIE_NAME || "heroverse_refresh";

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/api/auth",
    maxAge: Number(process.env.REFRESH_TOKEN_TTL_SECONDS || 604800) * 1000,
  };
}

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.cookie(refreshCookieName, result.refreshToken, refreshCookieOptions());

    return res.status(200).json({
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: accessTokenTtl,
    });
  } catch (error) {
    return next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const refreshToken =
      req.cookies?.[refreshCookieName] ||
      req.body?.refreshToken;
    const result = await authService.refreshSession(refreshToken);

    res.cookie(refreshCookieName, result.refreshToken, refreshCookieOptions());

    return res.status(200).json({
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: accessTokenTtl,
    });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    const refreshToken =
      req.cookies?.[refreshCookieName] ||
      req.body?.refreshToken;
    await authService.logout(refreshToken);
    res.clearCookie(refreshCookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/api/auth",
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.id);
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

async function updateMe(req, res, next) {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    await authService.changePassword(req.user.id, req.body);
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateMe,
  changePassword,
};