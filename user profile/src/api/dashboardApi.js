const API_BASE_URL = "http://localhost:3001";

function getAccessToken() {
  return (
    sessionStorage.getItem("heroverse.accessToken") ||
    localStorage.getItem("heroverse.accessToken") ||
    ""
  );
}

let demoUser = {
  name: "Ahmed",
  handle: "@ahmed_j",
  bio: "Fan de comics et de films de super-héros depuis toujours.",
  memberSince: "Mars 2025",
  online: false,
};

const demoStats = [
  { key: "favorites", label: "Favorites", value: 24 },
  { key: "comicsRead", label: "Comics read", value: 12 },
  { key: "gamesPlayed", label: "Games played", value: 8 },
  { key: "xp", label: "XP Points", value: 1450 },
];

const demoContinueReading = {
  id: "amazing-spiderman",
  title: "The Amazing Spider-Man",
  chapter: 5,
  progress: 65,
  sc: "#1F3FB0",
  st: "#FFFFFF",
};

let demoFavorites = [
  { id: "f1", type: "Movie", title: "Steel Sentinel", meta: "1945 · Nova Press", sc: "#1F3FB0", st: "#fff" },
  { id: "f2", type: "Comic", title: "Crimson Falcon", meta: "1941 · Vault Comics", sc: "#15110E", st: "#FFC914" },
  { id: "f3", type: "Character", title: "Captain Meteor", meta: "Marcus Hale", sc: "#D7261E", st: "#FFF3D6" },
  { id: "f4", type: "Series", title: "Shadow Legion", meta: "1967 · Marble Studios", sc: "#5B2A86", st: "#FFE9A8" },
  { id: "f5", type: "Comic", title: "The Iron Wasp", meta: "1963 · Marble Studios", sc: "#E8641B", st: "#15110E" },
  { id: "f6", type: "Character", title: "Lady Lightning", meta: "Rose Delacroix", sc: "#FFC914", st: "#15110E" },
];

let demoWatchlist = [
  { id: "w1", title: "Phantom Comet", type: "Movie", status: "to-watch", sc: "#D7261E", st: "#FFC914" },
  { id: "w2", title: "Captain Aurora", type: "Series", status: "watching", sc: "#0E7C86", st: "#FFF3D6" },
  { id: "w3", title: "Cyber Knight", type: "Movie", status: "watched", sc: "#5B2A86", st: "#7DF9FF" },
  { id: "w4", title: "Starfall", type: "Series", status: "to-watch", sc: "#1F3FB0", st: "#FFC914" },
];

let demoComics = [
  { id: "c1", title: "The Amazing Spider-Man", status: "reading", progress: 65, chapter: 5, sc: "#1F3FB0", st: "#fff" },
  { id: "c2", title: "Crimson Falcon", status: "completed", progress: 100, chapter: 12, sc: "#15110E", st: "#FFC914" },
  { id: "c3", title: "Steel Sentinel", status: "saved", progress: 0, chapter: 0, sc: "#1F3FB0", st: "#FFFFFF" },
  { id: "c4", title: "The Iron Wasp", status: "reading", progress: 30, chapter: 3, sc: "#E8641B", st: "#15110E" },
  { id: "c5", title: "Phantom Comet", status: "completed", progress: 100, chapter: 8, sc: "#D7261E", st: "#FFC914" },
];

async function request(path, options = {}) {
  const token = getAccessToken();
  if (!token) {
    throw new Error("NO_TOKEN");
  }

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    const message =
      payload?.error?.message || payload?.message || `HTTP ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

export async function getCurrentUser() {
  try {
    const data = await request("/api/dashboard/user");
    return data.user;
  } catch {
    const storedUsername = localStorage.getItem("heroverse.username");
    if (storedUsername) {
      demoUser = {
        ...demoUser,
        name: storedUsername,
        handle: `@${storedUsername.toLowerCase().replace(/\s+/g, "_")}`,
        online: localStorage.getItem("heroverse.isLoggedIn") === "true",
      };
    }
    return { ...demoUser };
  }
}

export async function updateProfile(patch) {
  try {
    const data = await request("/api/dashboard/profile", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    if (data.user?.name) {
      localStorage.setItem("heroverse.username", data.user.name);
    }
    return data.user;
  } catch (err) {
    if (err.message !== "NO_TOKEN" && err.status) {
      throw err;
    }
    const name = (patch.name ?? demoUser.name).trim();
    if (!name) throw new Error("Le nom ne peut pas être vide.");
    demoUser = {
      ...demoUser,
      ...patch,
      name,
      bio: (patch.bio ?? demoUser.bio).slice(0, 220),
    };
    return { ...demoUser };
  }
}

export async function getStats() {
  try {
    const data = await request("/api/dashboard/stats");
    return data.stats;
  } catch {
    return demoStats.map((s) => ({ ...s }));
  }
}

export async function getContinueReading() {
  try {
    const data = await request("/api/dashboard/continue-reading");
    return data.continueReading;
  } catch {
    return { ...demoContinueReading };
  }
}

export async function getFavorites() {
  try {
    const data = await request("/api/dashboard/favorites");
    return data.favorites;
  } catch {
    return demoFavorites.map((f) => ({ ...f }));
  }
}

export async function getWatchlist() {
  try {
    const data = await request("/api/dashboard/watchlist");
    return data.watchlist;
  } catch {
    return demoWatchlist.map((w) => ({ ...w }));
  }
}

export async function setWatchStatus(id, status) {
  try {
    const data = await request(`/api/dashboard/watchlist/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return data.item;
  } catch (err) {
    if (err.status && err.status !== 404 && err.message !== "NO_TOKEN") {
      throw err;
    }
    const item = demoWatchlist.find((w) => w.id === id);
    if (!item) throw new Error("Cet élément n'existe plus dans la watchlist.");
    item.status = status;
    return { ...item };
  }
}

export async function getComics() {
  try {
    const data = await request("/api/dashboard/comics");
    return data.comics;
  } catch {
    return demoComics.map((c) => ({ ...c }));
  }
}

const SHOP_API_URL = "http://localhost:3003";

const demoOrders = [
  {
    _id: "ord-8831",
    userId: "demo-user",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    total: 39.98,
    status: "success",
    payment: { status: "paid", amount: 39.98, currency: "EUR" },
    items: [
      { productId: "spiderman-tome-1", name: "The Amazing Spider-Man #1 Collector", price: 19.99, quantity: 1 },
      { productId: "batman-figurine", name: "Figurine Articulée Steel Sentinel", price: 19.99, quantity: 1 },
    ],
  },
  {
    _id: "ord-7420",
    userId: "demo-user",
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    total: 14.50,
    status: "pending",
    payment: { status: "unpaid", amount: 14.50, currency: "EUR" },
    items: [
      { productId: "falcon-poster", name: "Poster Vintage Crimson Falcon", price: 14.50, quantity: 1 },
    ],
  },
];

export async function getUserOrders(userId) {
  const token = getAccessToken();
  if (token) {
    try {
      const endpoint = userId
        ? `${SHOP_API_URL}/api/orders/user/${encodeURIComponent(userId)}`
        : `${SHOP_API_URL}/api/orders/me`;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data?.orders) && data.orders.length > 0) {
          return data.orders;
        }
      }
    } catch {
      // fallback
    }
  }

  return demoOrders.map((o) => ({
    ...o,
    userId: userId || o.userId,
  }));
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
  getUserOrders,
};
