import ProfileCard from "./ProfileCard";
import { SECTIONS } from "./sections";

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
