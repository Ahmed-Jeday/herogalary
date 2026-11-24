export default function DashboardHeader({ user, onBurger, onExit }) {
  return (
    <header className="hv-head">
      <button className="hv-burger" onClick={onBurger} aria-label="Open navigation">☰</button>
      <div>
        <h1>
          Welcome back, {user?.name ?? "Fan"}!{" "}
          {user?.online && <span className="hv-online">Online</span>}
        </h1>
        <p>Your universe, your journey.</p>
      </div>
      {onExit && (
        <button className="hv-btn hv-btn-ghost" type="button" onClick={onExit}>
          Back to Heroverse
        </button>
      )}
    </header>
  );
}
