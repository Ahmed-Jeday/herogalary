const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const {
  refreshTokenTtl,
  signAccessToken,
  createRefreshToken,
  hashRefreshToken,
} = require("../utils/token");

function serviceError(status, message, code = "AUTH_ERROR") {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

async function register({ username, email, password }) {
  if (
    typeof username !== "string" ||
    username.trim().length < 2 ||
    typeof email !== "string" ||
    !validateEmail(email) ||
    !validatePassword(password)
  ) {
    throw serviceError(
      400,
      "Username must contain at least 2 characters. Email must be valid. Password must contain at least 8 characters, one uppercase letter and one digit.",
      "VALIDATION_ERROR",
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw serviceError(409, "Email already in use", "EMAIL_IN_USE");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: normalizedEmail,
        password: passwordHash,
      },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  } catch (error) {
    if (error.code === "P2002") {
      throw serviceError(409, "Email already in use", "EMAIL_IN_USE");
    }
    throw error;
  }
}

async function createSession(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = createRefreshToken();
  const expiresAt = new Date(Date.now() + refreshTokenTtl * 1000);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashRefreshToken(refreshToken),
      userId: user.id,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

async function login({ email, password }) {
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !validateEmail(email)
  ) {
    throw serviceError(400, "A valid email and password are required", "VALIDATION_ERROR");
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw serviceError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const session = await createSession(user);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    ...session,
  };
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

async function getProfile(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw serviceError(404, "User not found", "USER_NOT_FOUND");
  }

  return publicUser(user);
}

async function updateProfile(userId, { username }) {
  if (typeof username !== "string" || username.trim().length < 2) {
    throw serviceError(
      400,
      "Username must contain at least 2 characters",
      "VALIDATION_ERROR",
    );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { username: username.trim() },
  });

  return publicUser(user);
}

async function changePassword(userId, { currentPassword, newPassword }) {
  if (!validatePassword(newPassword)) {
    throw serviceError(
      400,
      "New password must contain at least 8 characters, one uppercase letter and one digit",
      "VALIDATION_ERROR",
    );
  }

  if (typeof currentPassword !== "string") {
    throw serviceError(400, "Current password is required", "VALIDATION_ERROR");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw serviceError(404, "User not found", "USER_NOT_FOUND");
  }

  if (!(await bcrypt.compare(currentPassword, user.password))) {
    throw serviceError(401, "Current password is incorrect", "INVALID_PASSWORD");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: passwordHash },
  });
}

async function refreshSession(refreshToken) {
  if (typeof refreshToken !== "string" || refreshToken.length === 0) {
    throw serviceError(401, "Refresh token is required", "REFRESH_TOKEN_REQUIRED");
  }

  const tokenRecord = await prisma.refreshToken.findFirst({
    where: { tokenHash: hashRefreshToken(refreshToken) },
    include: { user: true },
  });

  if (
    !tokenRecord ||
    tokenRecord.revokedAt ||
    tokenRecord.expiresAt <= new Date()
  ) {
    throw serviceError(401, "Refresh token is invalid or expired", "INVALID_REFRESH_TOKEN");
  }

  const newRefreshToken = createRefreshToken();
  const expiresAt = new Date(Date.now() + refreshTokenTtl * 1000);
  const revokedAt = new Date();

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt },
    }),
    prisma.refreshToken.create({
      data: {
        tokenHash: hashRefreshToken(newRefreshToken),
        userId: tokenRecord.userId,
        expiresAt,
      },
    }),
  ]);

  return {
    user: publicUser(tokenRecord.user),
    accessToken: signAccessToken(tokenRecord.user),
    refreshToken: newRefreshToken,
  };
}

async function logout(refreshToken) {
  if (typeof refreshToken !== "string" || refreshToken.length === 0) {
    return;
  }

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashRefreshToken(refreshToken),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshSession,
  logout,
};