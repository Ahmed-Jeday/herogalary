import { useEffect, useMemo, useState } from "react";
import { dashboardApi } from "../../api/dashboardApi";

const STATUS_LABEL = { reading: "Reading", completed: "Completed", saved: "Saved" };
const FILTERS = ["All", "Reading", "Completed", "Saved"];

export default function MyComics() {
  const [comics, setComics] = useState(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    dashboardApi.getComics().then(setComics);
  }, []);

  const visible = useMemo(
    () => (comics ?? []).filter((c) => filter === "All" || STATUS_LABEL[c.status] === filter),
    [comics, filter]
  );

  if (!comics) return <p className="hv-loading">Loading your comics…</p>;

  return (
    <div>
      <h2 className="hv-section-title">My Comics</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {FILTERS.map((t) => (
          <button
            key={t}
            className={`hv-chip${filter === t ? " active" : ""}`}
            onClick={() => setFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="hv-grid">
        {visible.map((c) => (
          <div key={c.id} className="hv-card">
            <div className="hv-card-cover" style={{ background: c.sc, color: c.st }}>
              {c.title}
            </div>
            <div className="hv-card-body">
              <span className="hv-tag">{STATUS_LABEL[c.status]}</span>
              <span className="hv-card-title">{c.title}</span>
              <span className="hv-card-meta">
                {c.status === "saved" ? "Not started" : `Chapter ${c.chapter} · ${c.progress}%`}
              </span>
              {c.status !== "saved" && (
                <div className="hv-progress">
                  <div className="hv-progress-bar" style={{ width: `${c.progress}%` }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
