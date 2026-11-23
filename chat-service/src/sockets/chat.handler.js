const roomService = require("../services/room.service");
const messageService = require("../services/message.service");
const presence = require("../services/presence.service");
const { serializeRoom } = require("../utils/serialize");

const TYPING_TTL_MS = 3_000;
const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX = 10;

function ok(data = {}) {
  return { ok: true, ...data };
}

function fail(code, message) {
  return { ok: false, error: { code, message } };
}

function respond(ack, payload) {
  if (typeof ack === "function") {
    ack(payload);
  }
}

function readRoomId(payload) {
  return typeof payload?.roomId === "string" ? payload.roomId.trim() : "";
}

function createRateLimiter() {
  const timestamps = [];

  return function allow() {
    const now = Date.now();

    while (
      timestamps.length > 0 &&
      now - timestamps[0] > RATE_LIMIT_WINDOW_MS
    ) {
      timestamps.shift();
    }

    if (timestamps.length >= RATE_LIMIT_MAX) {
      return false;
    }

    timestamps.push(now);
    return true;
  };
}

module.exports = function registerChatHandlers(io, socket) {
  const user = {
    id: socket.user.id,
    username: socket.user.username,
  };

  const joinedRooms = new Set();
  const typingTimers = new Map();
  const allowMessage = createRateLimiter();

  function presencePayload(roomId) {
    const users = presence.list(roomId);
    return { roomId, users, count: users.length };
  }

  function broadcastPresence(roomId) {
    io.to(roomId).emit("presence:update", presencePayload(roomId));
  }

  function emitTyping(roomId, isTyping, toEveryone = false) {
    const payload = {
      roomId,
      user: { id: user.id, username: user.username },
      isTyping,
    };

    if (toEveryone) {
      io.to(roomId).emit("typing:update", payload);
    } else {
      socket.to(roomId).emit("typing:update", payload);
    }
  }

  function clearTypingTimer(roomId) {
    const timer = typingTimers.get(roomId);

    if (timer) {
      clearTimeout(timer);
    }

    typingTimers.delete(roomId);
  }

  function stopTyping(roomId, toEveryone = false) {
    clearTypingTimer(roomId);
    emitTyping(roomId, false, toEveryone);
  }

  socket.on("room:join", async (payload = {}, ack) => {
    try {
      const roomId = readRoomId(payload);

      if (!roomId) {
        return respond(ack, fail("VALIDATION_ERROR", "roomId is required."));
      }

      const room = await roomService.getRoom(roomId);

      if (!room) {
        return respond(ack, fail("ROOM_NOT_FOUND", "Room not found."));
      }

      if (!joinedRooms.has(roomId)) {
        await socket.join(roomId);
        joinedRooms.add(roomId);
        presence.join(roomId, user, socket.id);
        broadcastPresence(roomId);
      }

      return respond(
        ack,
        ok({
          room: serializeRoom(room),
          users: presence.list(roomId),
        }),
      );
    } catch (error) {
      console.error("room:join failed", error);
      return respond(ack, fail("JOIN_FAILED", "Unable to join the room."));
    }
  });

  socket.on("room:leave", (payload = {}, ack) => {
    const roomId = readRoomId(payload);

    if (!roomId) {
      return respond(ack, fail("VALIDATION_ERROR", "roomId is required."));
    }

    if (joinedRooms.has(roomId)) {
      stopTyping(roomId, true);
      socket.leave(roomId);
      joinedRooms.delete(roomId);
      presence.leave(roomId, user.id, socket.id);
      broadcastPresence(roomId);
    }

    return respond(ack, ok());
  });

  socket.on("message:send", async (payload = {}, ack) => {
    try {
      const roomId = readRoomId(payload);

      if (!roomId) {
        return respond(ack, fail("VALIDATION_ERROR", "roomId is required."));
      }

      if (!joinedRooms.has(roomId)) {
        return respond(
          ack,
          fail("NOT_JOINED", "Join the room before sending messages."),
        );
      }

      if (!allowMessage()) {
        return respond(
          ack,
          fail("RATE_LIMITED", "Too many messages, please slow down."),
        );
      }

      stopTyping(roomId, true);

      const message = await messageService.createMessage(
        { roomId, text: payload.text },
        user,
      );

      io.to(roomId).emit("message:new", { message });

      return respond(ack, ok({ message }));
    } catch (error) {
      const status = error.status || 500;

      if (status >= 500) {
        console.error("message:send failed", error);
      }

      return respond(
        ack,
        fail(
          error.code || "MESSAGE_FAILED",
          status >= 500 ? "Unable to send the message." : error.message,
        ),
      );
    }
  });

  socket.on("typing:start", (payload = {}) => {
    const roomId = readRoomId(payload);

    if (!roomId || !joinedRooms.has(roomId)) {
      return;
    }

    emitTyping(roomId, true);
    clearTypingTimer(roomId);

    typingTimers.set(
      roomId,
      setTimeout(() => {
        typingTimers.delete(roomId);
        emitTyping(roomId, false);
      }, TYPING_TTL_MS),
    );
  });

  socket.on("typing:stop", (payload = {}) => {
    const roomId = readRoomId(payload);

    if (!roomId || !joinedRooms.has(roomId)) {
      return;
    }

    stopTyping(roomId);
  });

  // `disconnecting` est le dernier moment où socket.to(room) fonctionne
  // encore : on en profite pour retirer la présence et couper le typing.
  socket.on("disconnecting", () => {
    for (const roomId of joinedRooms) {
      stopTyping(roomId, true);
      presence.leave(roomId, user.id, socket.id);
    }
  });

  socket.on("disconnect", () => {
    for (const roomId of joinedRooms) {
      broadcastPresence(roomId);
    }

    joinedRooms.clear();

    for (const timer of typingTimers.values()) {
      clearTimeout(timer);
    }

    typingTimers.clear();
  });
};
