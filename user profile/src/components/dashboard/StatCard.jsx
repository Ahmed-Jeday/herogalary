export default function StatCard({ label, value }) {
  return (
    <div className="hv-stat">
      <div className="hv-stat-value">{value}</div>
      <div className="hv-stat-label">{label}</div>
    </div>
  );
}
