import { useEffect, useMemo, useState } from "react";
import { dashboardApi } from "../../api/dashboardApi";

const TYPES = ["All", "Movie", "Comic", "Character", "Series"];

export default function MyFavorites() {
  const [favorites, setFavorites] = useState(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    dashboardApi.getFavorites().then(setFavorites);
  }, []);

  const visible = useMemo(
    () => (favorites ?? []).filter((f) => filter === "All" || f.type === filter),
    [favorites, filter]
  );

  if (!favorites) return <p className="hv-loading">Loading favorites…</p>;

  return (
    <div>
      <h2 className="hv-section-title">My Favorites</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {TYPES.map((t) => (
          <button
            key={t}
            className={`hv-chip${filter === t ? " active" : ""}`}
            onClick={() => setFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="hv-loading">Nothing in this category yet.</p>
      ) : (
        <div className="hv-grid">
          {visible.map((f) => (
            <div key={f.id} className="hv-card">
              <div className="hv-card-cover" style={{ background: f.sc, color: f.st }}>
                {f.title}
              </div>
              <div className="hv-card-body">
                <span className="hv-tag">{f.type}</span>
                <span className="hv-card-title">{f.title}</span>
                <span className="hv-card-meta">{f.meta}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
