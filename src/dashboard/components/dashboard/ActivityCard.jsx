export default function ActivityCard({ title, chapter, progress, sc, st }) {
  return (
    <div className="hv-activity">
      <div className="hv-poster" style={{ background: sc, color: st }}>
        {title}
      </div>
      <div className="hv-activity-body">
        <h3 className="hv-activity-title">{title}</h3>
        <p className="hv-activity-meta">
          Chapter {chapter} · {progress}% completed
        </p>
        <div className="hv-progress">
          <div className="hv-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
