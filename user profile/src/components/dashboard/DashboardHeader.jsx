export default function DashboardHeader({ user, onBurger }) {
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
    </header>
  );
}
