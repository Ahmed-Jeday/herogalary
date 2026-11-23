function toPlain(document) {
  return typeof document?.toObject === "function" ? document.toObject() : document;
}

function serializeMessage(message) {
  if (!message) {
    return null;
  }

  const raw = toPlain(message);

  return {
    id: String(raw._id),
    roomId: raw.roomId,
    authorId: raw.authorId,
    author: raw.author,
    text: raw.text,
    createdAt: raw.createdAt,
  };
}

function serializeRoom(room) {
  if (!room) {
    return null;
  }

  const raw = toPlain(room);

  return {
    id: String(raw._id),
    name: raw.name,
    universe: raw.universe,
    description: raw.description,
    createdBy: raw.createdBy,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

module.exports = { serializeMessage, serializeRoom };
