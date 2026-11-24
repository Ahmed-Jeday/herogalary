import { useEffect, useState } from "react";
import { dashboardApi } from "../../api/dashboardApi";

const LABEL = { "to-watch": "To watch", watching: "Watching", watched: "Watched" };
const NEXT = { "to-watch": "watching", watching: "watched", watched: "to-watch" };
const NEXT_LABEL = { "to-watch": "Start watching", watching: "Mark as watched", watched: "Watch again" };

export default function MyWatchlist() {
  const [items, setItems] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    dashboardApi.getWatchlist().then(setItems);
  }, []);

  async function advance(item) {
    setBusyId(item.id);
    try {
      const updated = await dashboardApi.setWatchStatus(item.id, NEXT[item.status]);
      setItems((list) => list.map((i) => (i.id === item.id ? updated : i)));
    } finally {
      setBusyId(null);
    }
  }

  if (!items) return <p className="hv-loading">Loading your watchlist…</p>;

  return (
    <div>
      <h2 className="hv-section-title">My Watchlist</h2>
      <div className="hv-list">
        {items.map((item) => (
          <div key={item.id} className="hv-row">
            <div className="hv-row-cover" style={{ background: item.sc, color: item.st }}>
              {item.title}
            </div>
            <div className="hv-row-body">
              <div className="hv-row-title">{item.title}</div>
              <div className="hv-row-type">{item.type}</div>
            </div>
            <span className={`hv-status ${item.status}`}>{LABEL[item.status]}</span>
            <button
              className="hv-btn hv-btn-ghost"
              onClick={() => advance(item)}
              disabled={busyId === item.id}
            >
              {busyId === item.id ? "…" : NEXT_LABEL[item.status]}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
