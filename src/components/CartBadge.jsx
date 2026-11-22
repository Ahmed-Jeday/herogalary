// CartBadge — compteur panier dans le footer
export default function CartBadge({ count, onClick }) {
  if (count === 0) return null;
  return (
    <button className="cart-badge lnk sm" onClick={onClick} title="Voir le panier">
      PANIER <span className="cart-badge-count">{count}</span>
    </button>
  );
}
