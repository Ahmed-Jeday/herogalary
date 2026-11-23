const roomService = require("../services/room.service");
const messageService = require("../services/message.service");
const presence = require("../services/presence.service");

async function listRooms(_req, res, next) {
  try {
    const rooms = await roomService.listRooms();

    return res.status(200).json({
      rooms: rooms.map((room) => ({
        ...room,
        onlineCount: presence.count(room.id),
      })),
    });
  } catch (error) {
    return next(error);
  }
}

async function createRoom(req, res, next) {
  try {
    const room = await roomService.createRoom(req.body, req.user);
    const payload = {
      ...room,
      messageCount: 0,
      lastMessage: null,
      onlineCount: 0,
    };

    // Prévient tous les clients connectés qu'une nouvelle room existe.
    const io = req.app.get("io");
    if (io) {
      io.emit("room:created", { room: payload });
    }

    return res.status(201).json({ room: payload });
  } catch (error) {
    return next(error);
  }
}

async function listMessages(req, res, next) {
  try {
    const messages = await messageService.listMessages(
      req.params.id,
      req.query.limit,
    );

    return res.status(200).json({ messages });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listRooms, createRoom, listMessages };
