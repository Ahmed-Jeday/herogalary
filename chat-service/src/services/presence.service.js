/**
 * Présence en mémoire : roomId -> Map(userId -> { id, username, sockets }).
 * Un utilisateur peut avoir plusieurs onglets ouverts : il n'est compté
 * qu'une fois et n'est retiré que lorsque son dernier socket se déconnecte.
 */
const rooms = new Map();

function getMembers(roomId) {
  return rooms.get(roomId) || null;
}

function join(roomId, user, socketId) {
  let members = rooms.get(roomId);

  if (!members) {
    members = new Map();
    rooms.set(roomId, members);
  }

  let member = members.get(user.id);

  if (!member) {
    member = { id: user.id, username: user.username, sockets: new Set() };
    members.set(user.id, member);
  }

  member.sockets.add(socketId);

  return list(roomId);
}

function leave(roomId, userId, socketId) {
  const members = rooms.get(roomId);

  if (!members) {
    return list(roomId);
  }

  const member = members.get(userId);

  if (member) {
    member.sockets.delete(socketId);

    if (member.sockets.size === 0) {
      members.delete(userId);
    }
  }

  if (members.size === 0) {
    rooms.delete(roomId);
  }

  return list(roomId);
}

function list(roomId) {
  const members = getMembers(roomId);

  if (!members) {
    return [];
  }

  return Array.from(members.values())
    .map(({ id, username }) => ({ id, username }))
    .sort((a, b) => a.username.localeCompare(b.username));
}

function count(roomId) {
  return getMembers(roomId)?.size ?? 0;
}

/**
 * Retire un socket de toutes les rooms (utilisé en secours au disconnect).
 * Retourne la liste des rooms affectées.
 */
function clearSocket(socketId) {
  const affected = new Set();

  for (const [roomId, members] of rooms) {
    for (const [userId, member] of members) {
      if (member.sockets.delete(socketId)) {
        affected.add(roomId);

        if (member.sockets.size === 0) {
          members.delete(userId);
        }
      }
    }

    if (members.size === 0) {
      rooms.delete(roomId);
    }
  }

  return Array.from(affected);
}

module.exports = { join, leave, list, count, clearSocket };
