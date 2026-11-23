const Room = require("../models/Room");
const Message = require("../models/Message");
const { UNIVERSES, LIMITS } = require("../utils/constants");
const { createHttpError } = require("../utils/errors");
const { slugify } = require("../utils/slug");
const { serializeMessage, serializeRoom } = require("../utils/serialize");

/**
 * Liste les rooms avec leur dernier message et leur nombre de messages.
 */
async function listRooms() {
  const rooms = await Room.find().sort({ createdAt: 1 }).lean();

  const stats = await Message.aggregate([
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $group: {
        _id: "$roomId",
        messageCount: { $sum: 1 },
        lastMessage: { $first: "$$ROOT" },
      },
    },
  ]);

  const statsByRoom = new Map(stats.map((stat) => [stat._id, stat]));

  const list = rooms.map((room) => {
    const stat = statsByRoom.get(room._id);

    return {
      ...serializeRoom(room),
      messageCount: stat?.messageCount ?? 0,
      lastMessage: stat?.lastMessage ? serializeMessage(stat.lastMessage) : null,
    };
  });

  // Les rooms les plus actives d'abord.
  return list.sort((a, b) => {
    const aTime = new Date(a.lastMessage?.createdAt ?? a.createdAt).getTime();
    const bTime = new Date(b.lastMessage?.createdAt ?? b.createdAt).getTime();
    return bTime - aTime;
  });
}

async function getRoom(roomId) {
  if (typeof roomId !== "string" || !roomId.trim()) {
    return null;
  }

  return Room.findById(roomId.trim()).lean();
}

async function createRoom({ name, universe, description } = {}, user) {
  if (typeof name !== "string") {
    throw createHttpError(400, "VALIDATION_ERROR", "Room name is required.");
  }

  const cleanName = name.trim();

  if (
    cleanName.length < LIMITS.ROOM_NAME_MIN ||
    cleanName.length > LIMITS.ROOM_NAME_MAX
  ) {
    throw createHttpError(
      400,
      "VALIDATION_ERROR",
      `Room name must contain between ${LIMITS.ROOM_NAME_MIN} and ${LIMITS.ROOM_NAME_MAX} characters.`,
    );
  }

  const roomId = slugify(cleanName);

  if (!roomId) {
    throw createHttpError(
      400,
      "VALIDATION_ERROR",
      "Room name must contain letters or digits.",
    );
  }

  if (description != null && typeof description !== "string") {
    throw createHttpError(
      400,
      "VALIDATION_ERROR",
      "Room description must be a string.",
    );
  }

  const cleanDescription = typeof description === "string" ? description.trim() : "";

  if (cleanDescription.length > LIMITS.ROOM_DESCRIPTION_MAX) {
    throw createHttpError(
      400,
      "VALIDATION_ERROR",
      `Room description cannot exceed ${LIMITS.ROOM_DESCRIPTION_MAX} characters.`,
    );
  }

  const existingRoom = await Room.exists({ _id: roomId });

  if (existingRoom) {
    throw createHttpError(409, "ROOM_EXISTS", "A room with this name already exists.");
  }

  try {
    const room = await Room.create({
      _id: roomId,
      name: cleanName,
      universe: UNIVERSES.includes(universe) ? universe : "Autre",
      description: cleanDescription,
      createdBy: {
        id: user.id,
        username: user.username,
      },
    });

    return serializeRoom(room);
  } catch (error) {
    if (error.code === 11000) {
      throw createHttpError(409, "ROOM_EXISTS", "A room with this name already exists.");
    }

    throw error;
  }
}

module.exports = { listRooms, getRoom, createRoom };
