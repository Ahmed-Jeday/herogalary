const UNIVERSES = Object.freeze([
  "Vault Comics",
  "Nova Press",
  "Starlight",
  "Marble Studios",
  "Zenith",
  "Neon House",
  "Autre",
]);

const LIMITS = Object.freeze({
  ROOM_NAME_MIN: 2,
  ROOM_NAME_MAX: 30,
  ROOM_DESCRIPTION_MAX: 140,
  MESSAGE_MAX: 500,
  HISTORY_MAX: 200,
});

module.exports = { UNIVERSES, LIMITS };
