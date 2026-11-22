export default function Logo() {
  return (
    <div id="logo">
      <svg
        viewBox="0 0 40 46"
        fill="none"
        stroke="#e7e4ee"
        strokeWidth="1.6"
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        <path d="M20 1v44" />
        <path d="M9 15h22" />
        <circle cx="20" cy="27" r="7" />
        <circle cx="20" cy="27" r="2.4" fill="#e7e4ee" stroke="none" />
        <path d="M4 15v6" />
        <path d="M36 15v6" />
        <path d="M14 37v8" />
        <path d="M26 37v8" />
      </svg>
      <div className="vzx">HV</div>
    </div>
  );
}