export default function Toast({ text, visible }) {
  return (
    <div id="toast" className={visible ? 'on' : ''}>
      {text}
    </div>
  );
}