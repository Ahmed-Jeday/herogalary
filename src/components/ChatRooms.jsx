import { useCallback, useEffect, useRef, useState } from "react";
import {
  api,
  UNIVERSES,
  createChatSocket,
  getAccessToken,
  getCurrentUsername,
} from "../api/chatApi";
import "../ChatRooms.css";

const AVATAR_COLORS = ["#D7261E", "#1F3FB0", "#1E7A4C", "#E8641B", "#5B2A86", "#0E7C86"];
const avatarColor = (name) => {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};
const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const messageTime = (message) => new Date(message.createdAt).getTime();

/** Fusionne deux listes en dédoublonnant par id et en gardant l'ordre chronologique. */
function mergeMessages(current, incoming) {
  const byId = new Map(current.map((message) => [message.id, message]));

  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return Array.from(byId.values()).sort(
    (a, b) =>
      messageTime(a) - messageTime(b) ||
      String(a.id).localeCompare(String(b.id)),
  );
}

function Avatar({ name }) {
  return (
    <span className="vc-avatar" style={{ background: avatarColor(name) }} aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function RoomModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", universe: UNIVERSES[0], description: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const room = await api.createRoom(form);
      onCreated(room);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="vc-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="vc-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="vc-modal-title">
        <h3 id="vc-modal-title">Créer une room</h3>

        <label htmlFor="vc-name">Nom de la room</label>
        <input id="vc-name" value={form.name} onChange={set("name")} maxLength={30}
               placeholder="Ex. Théories sur Starfall" autoFocus />

        <label htmlFor="vc-universe">Univers</label>
        <select id="vc-universe" value={form.universe} onChange={set("universe")}>
          {UNIVERSES.map((u) => <option key={u}>{u}</option>)}
        </select>

        <label htmlFor="vc-desc">Description</label>
        <textarea id="vc-desc" rows={3} value={form.description} onChange={set("description")}
                  maxLength={140} placeholder="De quoi parle-t-on dans cette room ?" />

        {error && <p className="vc-error" role="alert">{error}</p>}

        <div className="vc-modal-actions">
          <button type="button" className="vc-btn vc-btn-ghost" onClick={onClose}>Annuler</button>
          <button type="submit" className="vc-btn" disabled={busy}>
            {busy ? "Création…" : "Créer la room"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ChatRooms({ currentUser }) {
  const token = getAccessToken();
  const username = currentUser || getCurrentUsername();

  const [rooms, setRooms] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(() => Boolean(token));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const activeIdRef = useRef(null);
  const typingTimerRef = useRef(0);
  const typingActiveRef = useRef(false);

  const active = rooms.find((room) => room.id === activeId) || null;

  const refreshRooms = useCallback(async () => {
    try {
      const list = await api.listRooms();
      setRooms(list);
    } catch {
      // Le prochain événement réseau réessaiera.
    }
  }, []);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  /* Chargement initial des rooms */
  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    api.listRooms()
      .then((list) => {
        if (cancelled) return;
        setRooms(list);
        setActiveId((current) => current ?? list[0]?.id ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Impossible de charger les rooms.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  /* Connexion Socket.IO (une seule fois par token) */
  useEffect(() => {
    if (!token) return undefined;

    const socket = createChatSocket(token);
    socketRef.current = socket;

    const handleConnect = () => {
      setConnected(true);
      setError("");
    };
    const handleDisconnect = () => {
      setConnected(false);
    };
    const handleConnectError = (err) => {
      setConnected(false);
      const code = err?.data?.code;
      setError(
        code === "TOKEN_EXPIRED" || code === "INVALID_TOKEN" || code === "MISSING_TOKEN"
          ? "Session expirée. Reconnecte-toi pour discuter."
          : "Connexion temps réel impossible.",
      );
    };
    const handlePresence = (payload) => {
      if (!payload?.roomId) return;

      setRooms((prev) =>
        prev.map((room) =>
          room.id === payload.roomId
            ? { ...room, onlineCount: payload.count ?? 0 }
            : room,
        ),
      );

      if (payload.roomId === activeIdRef.current) {
        setOnlineUsers(payload.users || []);
      }
    };
    const handleMessage = (payload) => {
      const message = payload?.message;
      if (!message) return;

      if (message.roomId !== activeIdRef.current) {
        refreshRooms();
        return;
      }

      setMessages((prev) => mergeMessages(prev, [message]));
      setTypingUser(null);
      refreshRooms();
    };
    const handleTyping = (payload) => {
      if (payload?.roomId !== activeIdRef.current || !payload.user) return;

      setTypingUser((current) => {
        if (!payload.isTyping) {
          return current?.id === payload.user.id ? null : current;
        }
        return { id: payload.user.id, username: payload.user.username };
      });
    };
    const handleRoomCreated = () => {
      refreshRooms();
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("presence:update", handlePresence);
    socket.on("message:new", handleMessage);
    socket.on("typing:update", handleTyping);
    socket.on("room:created", handleRoomCreated);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("presence:update", handlePresence);
      socket.off("message:new", handleMessage);
      socket.off("typing:update", handleTyping);
      socket.off("room:created", handleRoomCreated);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, refreshRooms]);

  /* Rejoindre la room active + charger l'historique */
  useEffect(() => {
    const socket = socketRef.current;

    if (!activeId || !connected || !socket) return undefined;

    let cancelled = false;

    socket.emit("room:join", { roomId: activeId }, (response) => {
      if (cancelled) return;

      if (!response?.ok) {
        setError(response?.error?.message || "Impossible de rejoindre cette room.");
        return;
      }

      setOnlineUsers(response.users || []);

      api.listMessages(activeId)
        .then((list) => {
          if (!cancelled) {
            setMessages((prev) => mergeMessages(prev, list));
          }
        })
        .catch((err) => {
          if (!cancelled) setError(err.message || "Impossible de charger les messages.");
        });
    });

    return () => {
      cancelled = true;
      socket.emit("room:leave", { roomId: activeId });
      stopLocalTyping();
    };
  }, [activeId, connected]);

  /* Garder le dernier message visible */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, typingUser]);

  function stopLocalTyping() {
    window.clearTimeout(typingTimerRef.current);

    if (!typingActiveRef.current) return;

    typingActiveRef.current = false;
    const socket = socketRef.current;
    const roomId = activeIdRef.current;

    if (socket && roomId) {
      socket.emit("typing:stop", { roomId });
    }
  }

  function selectRoom(roomId) {
    if (roomId !== activeId) {
      stopLocalTyping();
      setMessages([]);
      setTypingUser(null);
      setOnlineUsers([]);
      setError("");
      setActiveId(roomId);
    }
    setSidebarOpen(false);
  }

  function handleDraftChange(event) {
    const value = event.target.value;
    setDraft(value);

    if (!value.trim() || !activeId) {
      stopLocalTyping();
      return;
    }

    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    if (!typingActiveRef.current) {
      typingActiveRef.current = true;
      socket.emit("typing:start", { roomId: activeId });
    }

    window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      typingActiveRef.current = false;
      socket.emit("typing:stop", { roomId: activeId });
    }, 1500);
  }

  function send(event) {
    event.preventDefault();
    const text = draft.trim();
    const socket = socketRef.current;
    const roomId = activeId;

    if (!text || !roomId || sending) return;

    if (!socket || !socket.connected) {
      setError("Connexion temps réel indisponible.");
      return;
    }

    setSending(true);
    setDraft("");
    setError("");
    stopLocalTyping();

    socket.emit("message:send", { roomId, text }, (response) => {
      setSending(false);

      if (!response?.ok) {
        if (activeIdRef.current === roomId) {
          setError(response?.error?.message || "Envoi impossible.");
          setDraft(text);
        }
        return;
      }

      if (response.message.roomId === activeIdRef.current) {
        setMessages((prev) => mergeMessages(prev, [response.message]));
      }

      refreshRooms();
    });
  }

  function onCreated(room) {
    setModalOpen(false);
    setSidebarOpen(false);
    stopLocalTyping();
    setMessages([]);
    setTypingUser(null);
    setOnlineUsers([]);
    setError("");
    setRooms((prev) =>
      prev.some((item) => item.id === room.id) ? prev : [...prev, room],
    );
    setActiveId(room.id);
    refreshRooms();
  }

  if (!token) {
    return (
      <div className="vc-chat vc-chat--locked">
        <div className="vc-locked">
          <p className="vc-locked-kicker">Comic Vault · Chat</p>
          <h2>Connecte-toi pour discuter</h2>
          <p>
            Les rooms, l’historique et les messages en temps réel sont réservés
            aux membres de HeroVerse.
          </p>
          <a className="vc-btn" href="/auth-preview.html?mode=login">Se connecter</a>
        </div>
      </div>
    );
  }

  return (
    <div className="vc-chat">
      {sidebarOpen && <div className="vc-scrim" onClick={() => setSidebarOpen(false)} />}

      <aside className={`vc-side${sidebarOpen ? " open" : ""}`} aria-label="Liste des rooms">
        <div className="vc-side-head">
          <h2>Rooms</h2>
          <button className="vc-btn vc-btn-small" onClick={() => setModalOpen(true)}>+ Nouvelle room</button>
        </div>

        {loading ? (
          <p className="vc-hint">Chargement des rooms…</p>
        ) : rooms.length === 0 ? (
          <p className="vc-hint">Aucune room pour l’instant. Crée la première pour lancer la discussion.</p>
        ) : (
          <ul className="vc-rooms">
            {rooms.map((r) => (
              <li key={r.id}>
                <button className={`vc-room${r.id === activeId ? " active" : ""}`}
                        onClick={() => selectRoom(r.id)}
                        aria-current={r.id === activeId ? "true" : undefined}>
                  <span className="vc-room-top">
                    <span className="vc-room-name"># {r.name}</span>
                    <span className="vc-tag">{r.universe}</span>
                  </span>
                  <span className="vc-room-last">
                    {r.lastMessage
                      ? `${r.lastMessage.author} : ${r.lastMessage.text}`
                      : "Aucun message"}
                  </span>
                  {r.onlineCount > 0 && (
                    <span className="vc-room-online">
                      ● {r.onlineCount} en ligne
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="vc-main" aria-label="Discussion">
        {active ? (
          <>
            <header className="vc-head">
              <button className="vc-burger" onClick={() => setSidebarOpen(true)} aria-label="Ouvrir la liste des rooms">☰</button>
              <div className="vc-head-info">
                <h2># {active.name} <span className="vc-tag">{active.universe}</span></h2>
                {active.description && <p>{active.description}</p>}
              </div>
              <div className={`vc-online${connected ? "" : " offline"}`}>
                <span className="vc-online-dot" aria-hidden="true" />
                <span className="vc-online-count">
                  {connected ? `${onlineUsers.length} en ligne` : "Connexion…"}
                </span>
                {connected && onlineUsers.length > 0 && (
                  <span className="vc-online-names" title={onlineUsers.map((u) => u.username).join(", ")}>
                    {onlineUsers.map((u) => u.username).join(", ")}
                  </span>
                )}
              </div>
            </header>

            <div className="vc-messages" role="log" aria-live="polite">
              {messages.length === 0 && (
                <p className="vc-empty">
                  {connected
                    ? "Personne n’a encore parlé ici. Écris le premier message."
                    : "Connexion au chat en cours…"}
                </p>
              )}
              {messages.map((m) => {
                const mine = m.author === username;
                return (
                  <div key={m.id} className={`vc-msg${mine ? " mine" : ""}`}>
                    {!mine && <Avatar name={m.author} />}
                    <div className="vc-bubble">
                      <span className="vc-meta">{mine ? "Vous" : m.author} · {fmtTime(m.createdAt)}</span>
                      <p>{m.text}</p>
                    </div>
                  </div>
                );
              })}
              {typingUser && <p className="vc-typing">{typingUser.username} écrit…</p>}
              <div ref={bottomRef} />
            </div>

            {error && <p className="vc-error vc-error-bar" role="alert">{error}</p>}

            <form className="vc-composer" onSubmit={send}>
              <input value={draft} onChange={handleDraftChange} maxLength={500}
                     placeholder={connected ? `Message dans # ${active.name}` : "Connexion au chat…"}
                     aria-label="Votre message" />
              <button className="vc-btn" type="submit" disabled={!draft.trim() || sending || !connected}>
                Envoyer
              </button>
            </form>
          </>
        ) : (
          <div className="vc-empty-main">
            <button className="vc-burger" onClick={() => setSidebarOpen(true)} aria-label="Ouvrir la liste des rooms">☰</button>
            <p>{loading ? "Chargement…" : "Choisis une room dans la liste, ou crée la tienne."}</p>
            {error && <p className="vc-error" role="alert">{error}</p>}
          </div>
        )}
      </section>

      {modalOpen && <RoomModal onClose={() => setModalOpen(false)} onCreated={onCreated} />}
    </div>
  );
}
