const { Server } = require("socket.io");
const env = require("../config/env");
const { verifyAccessToken } = require("../config/jwt");
const registerChatHandlers = require("./chat.handler");

function extractBearerToken(header) {
  if (typeof header !== "string" || !header.startsWith("Bearer ")) {
    return "";
  }

  return header.slice("Bearer ".length).trim();
}

/**
 * Crée le serveur Socket.IO et authentifie chaque connexion avec le même
 * access token RS256 que l'API REST.
 */
function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const authToken =
      typeof socket.handshake.auth?.token === "string"
        ? socket.handshake.auth.token.trim()
        : "";
    const token =
      authToken || extractBearerToken(socket.handshake.headers?.authorization);

    if (!token) {
      const error = new Error("Authentication required");
      error.data = { code: "MISSING_TOKEN" };
      return next(error);
    }

    try {
      const payload = verifyAccessToken(token);
      socket.user = {
        id: payload.sub,
        username: payload.username,
        role: payload.role,
      };
      return next();
    } catch (error) {
      const authError = new Error("Invalid or expired token");
      authError.data = {
        code:
          error.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
      };
      return next(authError);
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.user.username} (${socket.id})`);
    registerChatHandlers(io, socket);
  });

  return io;
}

module.exports = { createSocketServer };
