import { io } from "socket.io-client";

export const UNIVERSES = [
  "Vault Comics",
  "Nova Press",
  "Starlight",
  "Marble Studios",
  "Zenith",
  "Neon House",
  "Autre",
];

const CHAT_API_URL = (
  import.meta.env.VITE_CHAT_API_URL || "http://localhost:3002"
).replace(/\/$/, "");

/** Même stockage que authApi.js : session prioritaire, puis localStorage. */
export function getAccessToken() {
  return (
    sessionStorage.getItem("heroverse.accessToken") ||
    localStorage.getItem("heroverse.accessToken") ||
    ""
  );
}

export function getCurrentUsername() {
  return localStorage.getItem("heroverse.username") || "";
}

async function request(path, options = {}) {
  const token = getAccessToken();

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${CHAT_API_URL}${path}`, {
    ...options,
    headers,
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message ||
        payload?.message ||
        "Le service de chat est indisponible.",
    );
    error.status = response.status;
    error.code = payload?.error?.code;
    throw error;
  }

  return payload;
}

// GET /api/rooms
export async function listRooms() {
  const payload = await request("/api/rooms");
  return payload?.rooms || [];
}

// POST /api/rooms
export async function createRoom({ name, universe, description }) {
  const payload = await request("/api/rooms", {
    method: "POST",
    body: JSON.stringify({ name, universe, description }),
  });

  return payload.room;
}

// GET /api/rooms/:id/messages
export async function listMessages(roomId, limit = 100) {
  const payload = await request(
    `/api/rooms/${encodeURIComponent(roomId)}/messages?limit=${limit}`,
  );

  return payload?.messages || [];
}

/** Ouvre la connexion temps réel authentifiée par l'access token. */
export function createChatSocket(token = getAccessToken()) {
  return io(CHAT_API_URL, {
    auth: { token },
    reconnectionAttempts: 5,
  });
}

export const api = { listRooms, createRoom, listMessages };
