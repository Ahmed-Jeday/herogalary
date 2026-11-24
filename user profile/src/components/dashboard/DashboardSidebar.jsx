import ProfileCard from "./ProfileCard";

export const SECTIONS = [
  { key: "overview", label: "Overview", icon: "🏠", ready: true },
  { key: "favorites", label: "My Favorites", icon: "⭐", ready: true },
  { key: "watchlist", label: "My Watchlist", icon: "🎬", ready: true },
  { key: "comics", label: "My Comics", icon: "📚", ready: true },
  { key: "games", label: "My Games", icon: "🕹️", ready: false },
  { key: "quizzes", label: "My Quizzes", icon: "❓", ready: false },
  { key: "community", label: "Community", icon: "💬", ready: false },
  { key: "achievements", label: "Achievements", icon: "🏆", ready: false },
  { key: "notifications", label: "Notifications", icon: "🔔", ready: false },
  { key: "settings", label: "Settings", icon: "⚙️", ready: false },
];

export default function DashboardSidebar({ user, active, onSelect, open }) {
  return (
    <aside className={`hv-side${open ? " open" : ""}`} aria-label="Dashboard navigation">
      <div className="hv-brand">
        <span className="hv-brand-mark">HEROVERSE</span>
      </div>

      <ProfileCard user={user} onClick={() => onSelect("profile")} />

      <ul className="hv-nav">
        {SECTIONS.map((s) => (
          <li key={s.key}>
            <button
              className={`hv-nav-item${s.key === active ? " active" : ""}${s.ready ? "" : " soon"}`}
              onClick={() => onSelect(s.key)}
              aria-current={s.key === active ? "true" : undefined}
            >
              <span className="hv-ic" aria-hidden="true">{s.icon}</span>
              {s.label}
              {!s.ready && <span className="hv-tag hv-soon-tag">Soon</span>}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
