const Room = require("../models/Room");
const Message = require("../models/Message");
const env = require("../config/env");
const { LIMITS } = require("../utils/constants");
const { createHttpError } = require("../utils/errors");
const { serializeMessage } = require("../utils/serialize");

function normalizeLimit(value) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return env.messageHistoryLimit;
  }

  return Math.min(parsed, LIMITS.HISTORY_MAX);
}

async function assertRoomExists(roomId) {
  const room = await Room.exists({ _id: roomId });

  if (!room) {
    throw createHttpError(404, "ROOM_NOT_FOUND", "Room not found.");
  }
}

async function listMessages(roomId, limit) {
  if (typeof roomId !== "string" || !roomId.trim()) {
    throw createHttpError(400, "VALIDATION_ERROR", "roomId is required.");
  }

  const cleanRoomId = roomId.trim();
  await assertRoomExists(cleanRoomId);

  const messages = await Message.find({ roomId: cleanRoomId })
    .sort({ createdAt: -1, _id: -1 })
    .limit(normalizeLimit(limit))
    .lean();

  // La requête est descendante pour prendre les N derniers ; on remet dans
  // l'ordre chronologique pour l'affichage.
  return messages.reverse().map(serializeMessage);
}

async function createMessage({ roomId, text } = {}, user) {
  if (typeof roomId !== "string" || !roomId.trim()) {
    throw createHttpError(400, "VALIDATION_ERROR", "roomId is required.");
  }

  if (typeof text !== "string" || !text.trim()) {
    throw createHttpError(400, "VALIDATION_ERROR", "Message text is required.");
  }

  const cleanRoomId = roomId.trim();
  const cleanText = text.trim();

  if (cleanText.length > LIMITS.MESSAGE_MAX) {
    throw createHttpError(
      400,
      "VALIDATION_ERROR",
      `Message cannot exceed ${LIMITS.MESSAGE_MAX} characters.`,
    );
  }

  await assertRoomExists(cleanRoomId);

  const message = await Message.create({
    roomId: cleanRoomId,
    authorId: user.id,
    author: user.username,
    text: cleanText,
  });

  return serializeMessage(message);
}

module.exports = { listMessages, createMessage };
