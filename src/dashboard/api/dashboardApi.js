/**
 * Simulated dashboard API.
 * Same pattern as the chat's chatApi.js: every function is async and returns
 * plain JSON. To go live, keep the signatures and replace each body with fetch(...).
 */

const LATENCY = [150, 350];
const wait = () =>
  new Promise((r) => setTimeout(r, LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0])));

/* ---------- in-memory "database" ---------- */

let user = {
  name: "Ahmed",
  handle: "@ahmed_j",
  bio: "Fan de comics et de films de super-héros depuis toujours.",
  memberSince: "Mars 2025",
  online: true,
};

const stats = [
  { key: "favorites", label: "Favorites", value: 24 },
  { key: "comicsRead", label: "Comics read", value: 12 },
  { key: "gamesPlayed", label: "Games played", value: 8 },
  { key: "xp", label: "XP Points", value: 1450 },
];

const continueReading = {
  id: "amazing-spiderman",
  title: "The Amazing Spider-Man",
  chapter: 5,
  progress: 65,
  sc: "#1F3FB0",
  st: "#FFFFFF",
};

const favorites = [
  { id: "f1", type: "Movie", title: "Steel Sentinel", meta: "1945 · Nova Press", sc: "#1F3FB0", st: "#fff" },
  { id: "f2", type: "Comic", title: "Crimson Falcon", meta: "1941 · Vault Comics", sc: "#15110E", st: "#FFC914" },
  { id: "f3", type: "Character", title: "Captain Meteor", meta: "Marcus Hale", sc: "#D7261E", st: "#FFF3D6" },
  { id: "f4", type: "Series", title: "Shadow Legion", meta: "1967 · Marble Studios", sc: "#5B2A86", st: "#FFE9A8" },
  { id: "f5", type: "Comic", title: "The Iron Wasp", meta: "1963 · Marble Studios", sc: "#E8641B", st: "#15110E" },
  { id: "f6", type: "Character", title: "Lady Lightning", meta: "Rose Delacroix", sc: "#FFC914", st: "#15110E" },
];

const watchlist = [
  { id: "w1", title: "Phantom Comet", type: "Movie", status: "to-watch", sc: "#D7261E", st: "#FFC914" },
  { id: "w2", title: "Captain Aurora", type: "Series", status: "watching", sc: "#0E7C86", st: "#FFF3D6" },
  { id: "w3", title: "Cyber Knight", type: "Movie", status: "watched", sc: "#5B2A86", st: "#7DF9FF" },
  { id: "w4", title: "Starfall", type: "Series", status: "to-watch", sc: "#1F3FB0", st: "#FFC914" },
];

const comics = [
  { id: "c1", title: "The Amazing Spider-Man", status: "reading", progress: 65, chapter: 5, sc: "#1F3FB0", st: "#fff" },
  { id: "c2", title: "Crimson Falcon", status: "completed", progress: 100, chapter: 12, sc: "#15110E", st: "#FFC914" },
  { id: "c3", title: "Steel Sentinel", status: "saved", progress: 0, chapter: 0, sc: "#1F3FB0", st: "#FFFFFF" },
  { id: "c4", title: "The Iron Wasp", status: "reading", progress: 30, chapter: 3, sc: "#E8641B", st: "#15110E" },
  { id: "c5", title: "Phantom Comet", status: "completed", progress: 100, chapter: 8, sc: "#D7261E", st: "#FFC914" },
];

/* ---------- REST-like functions ---------- */

export async function getCurrentUser() {
  await wait();
  return { ...user };
}

export async function updateProfile(patch) {
  await wait();
  const name = (patch.name ?? user.name).trim();
  if (!name) throw new Error("Le nom ne peut pas être vide.");
  user = { ...user, ...patch, name, bio: (patch.bio ?? user.bio).slice(0, 220) };
  return { ...user };
}

export async function getStats() {
  await wait();
  return stats.map((s) => ({ ...s }));
}

export async function getContinueReading() {
  await wait();
  return { ...continueReading };
}

export async function getFavorites() {
  await wait();
  return favorites.map((f) => ({ ...f }));
}

export async function getWatchlist() {
  await wait();
  return watchlist.map((w) => ({ ...w }));
}

export async function setWatchStatus(id, status) {
  await wait();
  const item = watchlist.find((w) => w.id === id);
  if (!item) throw new Error("Cet élément n'existe plus dans la watchlist.");
  item.status = status;
  return { ...item };
}

export async function getComics() {
  await wait();
  return comics.map((c) => ({ ...c }));
}

export const dashboardApi = {
  getCurrentUser,
  updateProfile,
  getStats,
  getContinueReading,
  getFavorites,
  getWatchlist,
  setWatchStatus,
  getComics,
};
