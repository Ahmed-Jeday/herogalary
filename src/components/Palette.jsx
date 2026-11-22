const ITEMS = ['BLACK', 'RED', 'GREEN', 'YELLOW', 'BLUE'];

export default function Palette({ active, onChange }) {
  return (
    <div id="palette">
      {ITEMS.map((p) => (
        <div
          key={p}
          data-p={p}
          className={p === active ? 'active' : ''}
          onClick={() => onChange(p)}
        >
          {p === active ? `▪ ${p}` : p}
        </div>
      ))}
    </div>
  );
}