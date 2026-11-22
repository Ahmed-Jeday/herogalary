import CartBadge from './CartBadge';

export default function Footer({ sfxOn, onToggleSfx, onHub, cartCount = 0, onCart }) {
  return (
    <>
      <div
        className={`ft sm lnk${sfxOn ? ' on' : ''}`}
        id="f-sfx"
        onClick={onToggleSfx}
      >
        <svg width="11" height="10" viewBox="0 0 11 10" fill="none">
          <path
            d="M1 3.4h2.1L5.9 1v8L3.1 6.6H1z"
            stroke="currentColor"
            strokeWidth=".9"
            strokeLinejoin="round"
          />
          <path
            className="wv"
            d="M7.6 3.2a2.6 2.6 0 0 1 0 3.6"
            stroke="currentColor"
            strokeWidth=".9"
            strokeLinecap="round"
          />
          <path
            className="wv"
            d="M9.1 2a4.6 4.6 0 0 1 0 6"
            stroke="currentColor"
            strokeWidth=".9"
            strokeLinecap="round"
          />
        </svg>
        <span>SFX</span>
      </div>

      <div className="ft sm lnk" id="f-hub" onClick={onHub}>
        Hero Verse
      </div>
     
      <div className="ft sm" id="f-copy">©2026</div>
      {cartCount > 0 && (
        <div className="ft sm" id="f-cart">
          <CartBadge count={cartCount} onClick={onCart} />
        </div>
      )}
    </>
  );
}