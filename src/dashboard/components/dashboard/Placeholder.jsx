export default function Placeholder({ icon = "🛠️", title, text }) {
  return (
    <div className="hv-placeholder">
      <span className="hv-placeholder-ic" aria-hidden="true">{icon}</span>
      <h3>{title}</h3>
      <p>{text || "This section is coming soon."}</p>
    </div>
  );
}
