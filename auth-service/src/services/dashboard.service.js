const prisma = require("../config/prisma");

const DEFAULT_FAVORITES = [
  { type: "Movie", title: "Steel Sentinel", meta: "1945 · Nova Press", sc: "#1F3FB0", st: "#fff" },
  { type: "Comic", title: "Crimson Falcon", meta: "1941 · Vault Comics", sc: "#15110E", st: "#FFC914" },
  { type: "Character", title: "Captain Meteor", meta: "Marcus Hale", sc: "#D7261E", st: "#FFF3D6" },
  { type: "Series", title: "Shadow Legion", meta: "1967 · Marble Studios", sc: "#5B2A86", st: "#FFE9A8" },
  { type: "Comic", title: "The Iron Wasp", meta: "1963 · Marble Studios", sc: "#E8641B", st: "#15110E" },
  { type: "Character", title: "Lady Lightning", meta: "Rose Delacroix", sc: "#FFC914", st: "#15110E" },
];

const DEFAULT_WATCHLIST = [
  { title: "Phantom Comet", type: "Movie", status: "to-watch", sc: "#D7261E", st: "#FFC914" },
  { title: "Captain Aurora", type: "Series", status: "watching", sc: "#0E7C86", st: "#FFF3D6" },
  { title: "Cyber Knight", type: "Movie", status: "watched", sc: "#5B2A86", st: "#7DF9FF" },
  { title: "Starfall", type: "Series", status: "to-watch", sc: "#1F3FB0", st: "#FFC914" },
];

const DEFAULT_COMICS = [
  { title: "The Amazing Spider-Man", status: "reading", progress: 65, chapter: 5, sc: "#1F3FB0", st: "#fff" },
  { title: "Crimson Falcon", status: "completed", progress: 100, chapter: 12, sc: "#15110E", st: "#FFC914" },
  { title: "Steel Sentinel", status: "saved", progress: 0, chapter: 0, sc: "#1F3FB0", st: "#FFFFFF" },
  { title: "The Iron Wasp", status: "reading", progress: 30, chapter: 3, sc: "#E8641B", st: "#15110E" },
  { title: "Phantom Comet", status: "completed", progress: 100, chapter: 8, sc: "#D7261E", st: "#FFC914" },
];

function formatMemberSince(date) {
  if (!date) return "Mars 2025";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

async function getDashboardUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      bio: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return {
    id: user.id,
    name: user.username,
    handle: `@${user.username.toLowerCase().replace(/\s+/g, "_")}`,
    bio: user.bio || "Fan de comics et de films de super-héros depuis toujours.",
    email: user.email,
    memberSince: formatMemberSince(user.createdAt),
    online: true,
  };
}

async function updateDashboardProfile(userId, patch) {
  const data = {};
  if (typeof patch.name === "string" && patch.name.trim().length >= 2) {
    data.username = patch.name.trim();
  }
  if (typeof patch.bio === "string") {
    data.bio = patch.bio.slice(0, 220);
  }

  if (Object.keys(data).length === 0) {
    return getDashboardUser(userId);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      username: true,
      email: true,
      bio: true,
      role: true,
      createdAt: true,
    },
  });

  return {
    id: updated.id,
    name: updated.username,
    handle: `@${updated.username.toLowerCase().replace(/\s+/g, "_")}`,
    bio: updated.bio || "",
    email: updated.email,
    memberSince: formatMemberSince(updated.createdAt),
    online: true,
  };
}

async function getFavorites(userId) {
  let list = await prisma.userFavorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (list.length === 0) {
    // Seed default favorites for user
    await prisma.userFavorite.createMany({
      data: DEFAULT_FAVORITES.map((f) => ({ ...f, userId })),
    });
    list = await prisma.userFavorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  return list.map((f) => ({
    id: f.id,
    type: f.type,
    title: f.title,
    meta: f.meta,
    sc: f.sc,
    st: f.st,
  }));
}

async function getWatchlist(userId) {
  let list = await prisma.userWatchlist.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (list.length === 0) {
    await prisma.userWatchlist.createMany({
      data: DEFAULT_WATCHLIST.map((w) => ({ ...w, userId })),
    });
    list = await prisma.userWatchlist.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  }

  return list.map((w) => ({
    id: w.id,
    title: w.title,
    type: w.type,
    status: w.status,
    sc: w.sc,
    st: w.st,
  }));
}

async function setWatchStatus(userId, itemId, status) {
  const allowed = ["to-watch", "watching", "watched"];
  if (!allowed.includes(status)) {
    const error = new Error("Invalid status");
    error.status = 400;
    throw error;
  }

  const item = await prisma.userWatchlist.findFirst({
    where: { id: itemId, userId },
  });

  if (!item) {
    const error = new Error("Cet élément n'existe plus dans la watchlist.");
    error.status = 404;
    throw error;
  }

  const updated = await prisma.userWatchlist.update({
    where: { id: itemId },
    data: { status },
  });

  return {
    id: updated.id,
    title: updated.title,
    type: updated.type,
    status: updated.status,
    sc: updated.sc,
    st: updated.st,
  };
}

async function getComics(userId) {
  let list = await prisma.userComic.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (list.length === 0) {
    await prisma.userComic.createMany({
      data: DEFAULT_COMICS.map((c) => ({ ...c, userId })),
    });
    list = await prisma.userComic.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  }

  return list.map((c) => ({
    id: c.id,
    title: c.title,
    status: c.status,
    progress: c.progress,
    chapter: c.chapter,
    sc: c.sc,
    st: c.st,
  }));
}

async function getStats(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, gamesPlayed: true },
  });

  const favoritesCount = await prisma.userFavorite.count({ where: { userId } });
  const comicsReadCount = await prisma.userComic.count({
    where: {
      userId,
      OR: [{ status: "completed" }, { progress: { gt: 0 } }],
    },
  });

  return [
    { key: "favorites", label: "Favorites", value: favoritesCount || 24 },
    { key: "comicsRead", label: "Comics read", value: comicsReadCount || 12 },
    { key: "gamesPlayed", label: "Games played", value: user?.gamesPlayed ?? 8 },
    { key: "xp", label: "XP Points", value: user?.xp ?? 1450 },
  ];
}

async function getContinueReading(userId) {
  const comics = await getComics(userId);
  const reading = comics.find((c) => c.status === "reading") || comics[0];

  if (!reading) {
    return {
      id: "amazing-spiderman",
      title: "The Amazing Spider-Man",
      chapter: 5,
      progress: 65,
      sc: "#1F3FB0",
      st: "#FFFFFF",
    };
  }

  return {
    id: reading.id,
    title: reading.title,
    chapter: reading.chapter,
    progress: reading.progress,
    sc: reading.sc,
    st: reading.st,
  };
}

module.exports = {
  getDashboardUser,
  updateDashboardProfile,
  getFavorites,
  getWatchlist,
  setWatchStatus,
  getComics,
  getStats,
  getContinueReading,
};
