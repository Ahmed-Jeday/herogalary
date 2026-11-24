import { getAccessToken } from "./authApi";

const SHOP_API_URL = (
  import.meta.env.VITE_SHOP_API_URL || "http://localhost:3003"
).replace(/\/$/, "");

export async function createOrder(items) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Connecte-toi pour enregistrer ta commande.");
  }

  const response = await fetch(`${SHOP_API_URL}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ items }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(
      payload?.error?.message || "Impossible d’enregistrer la commande.",
    );
  }

  return payload;
}
