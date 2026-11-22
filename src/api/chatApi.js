/**
 * Simulated chat API.
 * Every function is async and returns plain JSON, exactly like a real backend would.
 * To go live, keep the same signatures and replace each body with fetch(...),
 * and replace `subscribe` with a WebSocket / SSE listener.
 */

export const UNIVERSES = [
  "Vault Comics",
  "Nova Press",
  "Starlight",
  "Marble Studios",
  "Zenith",
  "Neon House",
  "Autre",
];

const LATENCY = [120, 350];
const wait = () =>
  new Promise((r) =>
    setTimeout(r, LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0]))
  );

let counter = 100;
const uid = (p) => `${p}-${++counter}`;
const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const ago = (min) => Date.now() - min * 60000;

/* ---------- in-memory "database" ---------- */

const db = {
  rooms: [
    { id: "captain-meteor", name: "Captain Meteor", universe: "Vault Comics",
      description: "Origines, ennemis et théories sur le premier héros de la collection.", createdAt: ago(900) },
    { id: "shadow-legion", name: "Shadow Legion", universe: "Marble Studios",
      description: "Qui a trahi l’escouade ? Discussions sans spoilers (ou presque).", createdAt: ago(700) },
    { id: "cyber-knight", name: "Cyber Knight", universe: "Neon House",
      description: "Armure, néons et mégapole : tout sur le cyberpunk de la collection.", createdAt: ago(300) },
    { id: "crossovers", name: "Crossovers rêvés", universe: "Autre",
      description: "Quels héros devraient se rencontrer ? Proposez vos duels et alliances.", createdAt: ago(120) },
  ],
  messages: {
    "captain-meteor": [
      { id: "m-1", author: "NovaFan", text: "Quelqu’un a relu le #1 ? La scène de la pluie de météorites est incroyable.", createdAt: ago(80) },
      { id: "m-2", author: "Rose", text: "Oui, et le dessin des ombres au crayon change tout.", createdAt: ago(74) },
    ],
    "shadow-legion": [
      { id: "m-3", author: "AgentZero", text: "Je mise sur le numéro 4 comme traître.", createdAt: ago(55) },
    ],
    "cyber-knight": [
      { id: "m-4", author: "Kai_fan", text: "L’armure ancienne, c’est de la magie ou de la techno ?", createdAt: ago(40) },
    ],
    crossovers: [
      { id: "m-5", author: "Mira", text: "Starfall contre Phantom Comet, qui gagne ?", createdAt: ago(20) },
    ],
  },
};

/* ---------- live events (typing + incoming messages) ---------- */

const listeners = new Map(); // roomId -> Set<fn>
const emit = (roomId, evt) => listeners.get(roomId)?.forEach((fn) => fn(evt));

export function subscribe(roomId, fn) {
  if (!listeners.has(roomId)) listeners.set(roomId, new Set());
  listeners.get(roomId).add(fn);
  return () => listeners.get(roomId)?.delete(fn);
}

const BOTS = ["NovaFan", "Rose", "AgentZero", "Kai_fan", "Mira", "ComicLover"];
const REPLIES = [
  "Carrément d’accord, je n’y avais pas pensé !",
  "Tu as lu la fin du numéro 3 ? Ça change tout.",
  "Moi je préfère les premières couvertures, tellement plus vivantes.",
  "Intéressant… tu as une source pour cette théorie ?",
  "Ha ha, exactement ce que je disais hier !",
  "Je ne suis pas sûr, le méchant avait l’air plus complexe que ça.",
  "On devrait faire un vote dans la room.",
  "Le dessinateur a clairement voulu laisser un indice là.",
];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function simulateReply(roomId, authorToAvoid) {
  const bot = pick(BOTS.filter((b) => b !== authorToAvoid));
  setTimeout(() => emit(roomId, { type: "typing", author: bot }), 500);
  setTimeout(() => {
    const msg = { id: uid("m"), author: bot, text: pick(REPLIES), createdAt: Date.now() };
    db.messages[roomId].push(msg);
    emit(roomId, { type: "message", message: msg });
  }, 1600 + Math.random() * 1400);
}

/* ---------- REST-like functions ---------- */

// GET /rooms
export async function listRooms() {
  await wait();
  return db.rooms
    .map((r) => {
      const msgs = db.messages[r.id] || [];
      const last = msgs[msgs.length - 1] || null;
      return { ...r, count: msgs.length, last: last ? { ...last } : null };
    })
    .sort((a, b) => (b.last?.createdAt ?? b.createdAt) - (a.last?.createdAt ?? a.createdAt));
}

// POST /rooms
export async function createRoom({ name, universe, description }) {
  await wait();
  const clean = (name || "").trim();
  if (!clean) throw new Error("Donne un nom à la room.");
  if (clean.length > 30) throw new Error("Le nom ne peut pas dépasser 30 caractères.");
  const id = slug(clean);
  if (!id) throw new Error("Le nom doit contenir des lettres ou des chiffres.");
  if (db.rooms.some((r) => r.id === id)) throw new Error("Une room avec ce nom existe déjà.");

  const room = {
    id,
    name: clean,
    universe: UNIVERSES.includes(universe) ? universe : "Autre",
    description: (description || "").trim().slice(0, 140),
    createdAt: Date.now(),
  };
  db.rooms.push(room);
  db.messages[id] = [];
  return { ...room };
}

// GET /rooms/:id/messages
export async function listMessages(roomId) {
  await wait();
  return (db.messages[roomId] || []).map((m) => ({ ...m }));
}

// POST /rooms/:id/messages
export async function sendMessage(roomId, { author, text }) {
  await wait();
  const body = (text || "").trim();
  if (!body) throw new Error("Le message est vide.");
  if (!db.messages[roomId]) throw new Error("Cette room n’existe pas.");
  const msg = { id: uid("m"), author, text: body.slice(0, 500), createdAt: Date.now() };
  db.messages[roomId].push(msg);
  simulateReply(roomId, author);
  return { ...msg };
}

export const api = { listRooms, createRoom, listMessages, sendMessage, subscribe };