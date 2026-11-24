// ─── useCatalog — état global persisté en localStorage ───────────────────────
// Zéro dépendance externe. Fonctionne comme un mini store React.
// Pour migrer vers Supabase/Firebase, remplacer uniquement les setters.

import { useCallback, useEffect, useState } from 'react';
import { MOVIES } from '../data/movies';

/* ─── helpers localStorage ─────────────────────────────────────────── */
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

/* ─── seed des ratings depuis MOVIES ──────────────────────────────── */
function buildSeedRatings() {
  const out = {};
  MOVIES.forEach((m) => { out[m.id] = { avg: m.ratingAvg, count: m.ratingCount }; });
  return out;
}

/* ─── état initial ─────────────────────────────────────────────────── */
function getInitialState() {
  const rawCart = load('vl.cart', []);
  // Les anciens articles boutique étaient stockés dans le panier films.
  const cart = Array.isArray(rawCart)
    ? rawCart.filter((id) => !String(id).startsWith('shop:'))
    : [];
  if (Array.isArray(rawCart) && cart.length !== rawCart.length) {
    save('vl.cart', cart);
  }

  const rawShopCart = load('vl.shopCart', []);
  const shopCart = Array.isArray(rawShopCart)
    ? rawShopCart.filter(
        (line) =>
          line &&
          Number.isInteger(line.id) &&
          Number(line.qty) > 0,
      ).map((line) => ({ id: line.id, qty: Math.floor(Number(line.qty)) }))
    : [];

  return {
    myRatings:  load('vl.ratings',  {}),          // { [movieId]: 1..5 }
    comments:   load('vl.comments', {}),           // { [movieId]: [{id,user,text,stars,date}] }
    cart,                                          // [movieId, …]
    shopCart,                                      // [{ id, qty }, …]
    owned:      load('vl.owned',    []),            // [movieId, …]
    rented:     load('vl.rented',   {}),            // { [movieId]: expiresAt (ms) }
    user:       load('vl.user',     { name: 'Invité', avatar: null }),
    seedRatings: buildSeedRatings(),               // jamais persisté, recalculé à chaud
  };
}

/* ─── hook ─────────────────────────────────────────────────────────── */
export function useCatalog() {
  const [state, setState] = useState(getInitialState);

  /* Nettoyage des locations expirées au démarrage */
  useEffect(() => {
    const now = Date.now();
    setState((prev) => {
      const rented = { ...prev.rented };
      let changed = false;
      Object.keys(rented).forEach((id) => {
        if (rented[id] < now) { delete rented[id]; changed = true; }
      });
      if (!changed) return prev;
      save('vl.rented', rented);
      return { ...prev, rented };
    });
  }, []);

  /* ── noter un film ──────────────────────────────────────────────── */
  const rate = useCallback((movieId, stars) => {
    setState((prev) => {
      const myRatings = { ...prev.myRatings, [movieId]: stars };
      save('vl.ratings', myRatings);

      // Recalcule l'avg côté client (approximation locale)
      const seed = prev.seedRatings[movieId] ?? { avg: 0, count: 0 };
      const oldMy = prev.myRatings[movieId];
      let { avg, count } = seed;
      if (!oldMy) {
        // première note de l'utilisateur → on l'intègre
        avg = (avg * count + stars) / (count + 1);
        count += 1;
      } else {
        // mise à jour : retire l'ancienne, ajoute la nouvelle
        avg = (avg * count - oldMy + stars) / count;
      }

      const seedRatings = {
        ...prev.seedRatings,
        [movieId]: { avg: Math.round(avg * 10) / 10, count },
      };

      return { ...prev, myRatings, seedRatings };
    });
  }, []);

  /* ── ajouter un commentaire ─────────────────────────────────────── */
  const addComment = useCallback((movieId, { text, stars }) => {
    if (!text.trim()) return;
    setState((prev) => {
      const existing = prev.comments[movieId] ?? [];
      const entry = {
        id:   Date.now().toString(36),
        user: prev.user.name,
        text: text.trim(),
        stars: stars ?? null,
        date: new Date().toISOString(),
      };
      const comments = { ...prev.comments, [movieId]: [entry, ...existing] };
      save('vl.comments', comments);
      return { ...prev, comments };
    });
  }, []);

  /* ── panier ─────────────────────────────────────────────────────── */
  const addToCart = useCallback((movieId) => {
    setState((prev) => {
      if (prev.cart.includes(movieId)) return prev;
      const cart = [...prev.cart, movieId];
      save('vl.cart', cart);
      return { ...prev, cart };
    });
  }, []);

  const removeFromCart = useCallback((movieId) => {
    setState((prev) => {
      const cart = prev.cart.filter((id) => id !== movieId);
      save('vl.cart', cart);
      return { ...prev, cart };
    });
  }, []);

  /* ── panier boutique ────────────────────────────────────────────── */
  const addShopToCart = useCallback((id) => {
    setState((prev) => {
      const existing = prev.shopCart.find((line) => line.id === id);
      const shopCart = existing
        ? prev.shopCart.map((line) =>
            line.id === id ? { ...line, qty: line.qty + 1 } : line,
          )
        : [...prev.shopCart, { id, qty: 1 }];
      save('vl.shopCart', shopCart);
      return { ...prev, shopCart };
    });
  }, []);

  const removeShopFromCart = useCallback((id) => {
    setState((prev) => {
      const shopCart = prev.shopCart.filter((line) => line.id !== id);
      save('vl.shopCart', shopCart);
      return { ...prev, shopCart };
    });
  }, []);

  const setShopQty = useCallback((id, qty) => {
    setState((prev) => {
      const nextQty = Math.max(0, Math.floor(Number(qty) || 0));
      const shopCart =
        nextQty === 0
          ? prev.shopCart.filter((line) => line.id !== id)
          : prev.shopCart.map((line) =>
              line.id === id ? { ...line, qty: nextQty } : line,
            );
      save('vl.shopCart', shopCart);
      return { ...prev, shopCart };
    });
  }, []);

  const clearShopCart = useCallback(() => {
    setState((prev) => {
      save('vl.shopCart', []);
      return { ...prev, shopCart: [] };
    });
  }, []);

  /* ── achat ──────────────────────────────────────────────────────── */
  const buy = useCallback((movieId) => {
    setState((prev) => {
      if (prev.owned.includes(movieId)) return prev;
      const owned = [...prev.owned, movieId];
      const cart  = prev.cart.filter((id) => id !== movieId);
      const rented = { ...prev.rented };
      delete rented[movieId]; // achat annule la location
      save('vl.owned',  owned);
      save('vl.cart',   cart);
      save('vl.rented', rented);
      return { ...prev, owned, cart, rented };
    });
  }, []);

  /* ── location 48 h ──────────────────────────────────────────────── */
  const rent = useCallback((movieId) => {
    setState((prev) => {
      if (prev.owned.includes(movieId)) return prev; // déjà acheté
      const expiresAt = Date.now() + 48 * 60 * 60 * 1000;
      const rented = { ...prev.rented, [movieId]: expiresAt };
      save('vl.rented', rented);
      return { ...prev, rented };
    });
  }, []);

  /* ── pseudo utilisateur ─────────────────────────────────────────── */
  const setUserName = useCallback((name) => {
    setState((prev) => {
      const user = { ...prev.user, name: name.trim() || 'Invité' };
      save('vl.user', user);
      return { ...prev, user };
    });
  }, []);

  /* ── helpers de lecture ─────────────────────────────────────────── */
  const isOwned  = (id) => state.owned.includes(id);
  const isRented = (id) => !!state.rented[id] && state.rented[id] > Date.now();
  const timeLeft = (id) => {
    const exp = state.rented[id];
    if (!exp || exp < Date.now()) return null;
    const h = Math.floor((exp - Date.now()) / 3_600_000);
    const m = Math.floor(((exp - Date.now()) % 3_600_000) / 60_000);
    return `${h}h${String(m).padStart(2, '0')}`;
  };
  const getRating = (id) => state.seedRatings[id] ?? { avg: 0, count: 0 };

  return {
    /* état */
    myRatings:  state.myRatings,
    comments:   state.comments,
    cart:       state.cart,
    shopCart:   state.shopCart,
    shopCount:  state.shopCart.reduce((total, line) => total + line.qty, 0),
    owned:      state.owned,
    rented:     state.rented,
    user:       state.user,
    /* actions */
    rate,
    addComment,
    addToCart,
    removeFromCart,
    addShopToCart,
    removeShopFromCart,
    setShopQty,
    clearShopCart,
    buy,
    rent,
    setUserName,
    /* helpers lecture */
    isOwned,
    isRented,
    timeLeft,
    getRating,
  };
}
