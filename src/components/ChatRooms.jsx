import { useCallback, useEffect, useRef, useState } from "react";
import { api, UNIVERSES } from "../api/chatApi";
import "../ChatRooms.css";

const AVATAR_COLORS = ["#D7261E", "#1F3FB0", "#1E7A4C", "#E8641B", "#5B2A86", "#0E7C86"];
const avatarColor = (name) => {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};
const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

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

export default function ChatRooms({ currentUser = "Lecteur" }) {
  const [rooms, setRooms] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const bottomRef = useRef(null);

  const active = rooms.find((r) => r.id === activeId) || null;

  const refreshRooms = useCallback(() => api.listRooms().then(setRooms).catch(() => {}), []);

  /* load rooms once */
  useEffect(() => {
    api.listRooms()
      .then((list) => {
        setRooms(list);
        setActiveId(list[0]?.id ?? null);
      })
      .catch(() => setError("Impossible de charger les rooms."))
      .finally(() => setLoading(false));
  }, []);

  /* load + subscribe to the active room */
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    setMessages([]);
    setTyping(null);
    setError("");

    api.listMessages(activeId)
      .then((list) => !cancelled && setMessages(list))
      .catch(() => !cancelled && setError("Impossible de charger les messages."));

    const unsubscribe = api.subscribe(activeId, (evt) => {
      if (evt.type === "typing") setTyping(evt.author);
      if (evt.type === "message") {
        setTyping(null);
        setMessages((m) => (m.some((x) => x.id === evt.message.id) ? m : [...m, evt.message]));
        refreshRooms();
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [activeId, refreshRooms]);

  /* keep the latest message in view */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, typing]);

  function selectRoom(id) {
    setActiveId(id);
    setSidebarOpen(false);
  }

  async function send(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    setDraft("");
    setError("");
    try {
      const saved = await api.sendMessage(activeId, { author: currentUser, text });
      setMessages((m) => [...m, saved]);
      refreshRooms();
    } catch (err) {
      setError(err.message);
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  function onCreated(room) {
    setModalOpen(false);
    setSidebarOpen(false);
    refreshRooms();
    setActiveId(room.id);
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
                    {r.last ? `${r.last.author} : ${r.last.text}` : "Aucun message"}
                  </span>
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
              <div>
                <h2># {active.name} <span className="vc-tag">{active.universe}</span></h2>
                {active.description && <p>{active.description}</p>}
              </div>
            </header>

            <div className="vc-messages" role="log" aria-live="polite">
              {messages.length === 0 && (
                <p className="vc-empty">Personne n’a encore parlé ici. Écris le premier message.</p>
              )}
              {messages.map((m) => {
                const mine = m.author === currentUser;
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
              {typing && <p className="vc-typing">{typing} écrit…</p>}
              <div ref={bottomRef} />
            </div>

            {error && <p className="vc-error vc-error-bar" role="alert">{error}</p>}

            <form className="vc-composer" onSubmit={send}>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={500}
                     placeholder={`Message dans # ${active.name}`} aria-label="Votre message" />
              <button className="vc-btn" type="submit" disabled={!draft.trim() || sending}>Envoyer</button>
            </form>
          </>
        ) : (
          <div className="vc-empty-main">
            <button className="vc-burger" onClick={() => setSidebarOpen(true)} aria-label="Ouvrir la liste des rooms">☰</button>
            <p>{loading ? "Chargement…" : "Choisis une room dans la liste, ou crée la tienne."}</p>
          </div>
        )}
      </section>

      {modalOpen && <RoomModal onClose={() => setModalOpen(false)} onCreated={onCreated} />}
    </div>
  );
}