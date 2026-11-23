const AUTH_API_URL = (
  import.meta.env.VITE_AUTH_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

let accessToken =
  sessionStorage.getItem("heroverse.accessToken") ||
  localStorage.getItem("heroverse.accessToken") ||
  "";

async function request(path, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${AUTH_API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 204) {
    return null;
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      "Impossible de contacter le service d’authentification.";
    throw new Error(message);
  }

  return payload;
}

export async function register({ username, email, password }) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export async function login({ email, password, remember }) {
  const payload = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  accessToken = payload.accessToken;

  if (remember) {
    localStorage.setItem("heroverse.accessToken", payload.accessToken);
    sessionStorage.removeItem("heroverse.accessToken");
  } else {
    sessionStorage.setItem("heroverse.accessToken", payload.accessToken);
    localStorage.removeItem("heroverse.accessToken");
  }

  // Session "projet académique" : simple drapeau + pseudo pour l'affichage.
  localStorage.setItem("heroverse.isLoggedIn", "true");
  localStorage.setItem("heroverse.username", payload.user.username);

  return payload;
}

export async function logout() {
  await request("/api/auth/logout", { method: "POST" });
  accessToken = "";
  sessionStorage.removeItem("heroverse.accessToken");
  localStorage.removeItem("heroverse.accessToken");
  localStorage.removeItem("heroverse.isLoggedIn");
  localStorage.removeItem("heroverse.username");
}
