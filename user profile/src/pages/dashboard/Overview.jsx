import { useEffect, useState } from "react";
import { dashboardApi } from "../../api/dashboardApi";
import StatCard from "../../components/dashboard/StatCard";
import ActivityCard from "../../components/dashboard/ActivityCard";

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [reading, setReading] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([dashboardApi.getStats(), dashboardApi.getContinueReading()]).then(
      ([s, r]) => {
        if (cancelled) return;
        setStats(s);
        setReading(r);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return <p className="hv-loading">Loading your universe…</p>;

  return (
    <div>
      <div className="hv-stats">
        {stats.map((s) => (
          <StatCard key={s.key} label={s.label} value={s.value} />
        ))}
      </div>

      <h2 className="hv-section-title">Continue Reading</h2>
      {reading && (
        <ActivityCard
          title={reading.title}
          chapter={reading.chapter}
          progress={reading.progress}
          sc={reading.sc}
          st={reading.st}
        />
      )}

      <p style={{ marginTop: 18, fontSize: 12, color: "var(--muted)", fontFamily: "var(--serif)" }}>
        Illustrative dashboard content, not actual user data.
      </p>
    </div>
  );
}
