// PurchaseBar — boutons Louer / Acheter / Panier / Bande-annonce
import { useState } from 'react';

export default function PurchaseBar({ movie, isOwned, isRented, timeLeft, onRent, onBuy, onCart, onTrailer }) {
  const [cartAdded, setCartAdded] = useState(false);

  const handleCart = () => {
    onCart();
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
  };

  if (isOwned) {
    return (
      <div className="ov-actions">
        <button className="btn btn-primary" onClick={onTrailer}>
          ▶ REGARDER
        </button>
      </div>
    );
  }

  return (

    <div className="ov-actions">
      { /* find in cinema */}
      <button  className="btn">
        find now🍿
      </button>


      {/* Bande-annonce */}



      <button className="btn btn-ghost" onClick={onTrailer}>
        ▶   Traller 
      </button>

      {/* Louer */}
      {isRented ? (
        <button className="btn btn-ghost" disabled>
          ⏱ LOUÉ · {timeLeft}
        </button>
      ) : (
        <button className="btn btn-secondary" onClick={onRent}>
          LOUER {movie.price.rent.toFixed(2)} €
        </button>
      )}

      {/* Acheter */}
      <button className="btn btn-primary" onClick={onBuy}>
        ACHETER {movie.price.buy.toFixed(2)} €
      </button>

      {/* Panier */}
      <button className="btn btn-ghost" onClick={handleCart} disabled={cartAdded}>
        {cartAdded ? '✓ AJOUTÉ' : '+ PANIER'}
      </button>
    </div>
  );
}
