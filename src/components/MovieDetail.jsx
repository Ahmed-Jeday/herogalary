// ─── MovieDetail — overlay détail complet (remplace Overlay.jsx) ──────────────
import { useEffect, useRef, useState } from 'react';
import { MOVIES, posterSrc } from '../data/movies';
import StarRating from './StarRating';
import PurchaseBar from './PurchaseBar';
import CommentSection from './CommentSection';
import TrailerModal from './TrailerModal';

export default function MovieDetail({
  index,
  onClose,
  catalog,          // { myRatings, comments, getRating, isOwned, isRented, timeLeft, rate, addComment, addToCart, buy, rent }
  onToast,
}) {
  const isOpen = index !== null;
  const [shown, setShown] = useState(0);
  const [trailerUrl, setTrailerUrl] = useState(null);
  const blocksRef = useRef(null);

  // garde le dernier contenu pendant l'animation de fermeture
  useEffect(() => {
    if (index !== null) setShown(index);
  }, [index]);

  // animation de révélation des blocs (5 × 7 = 35) — identique à Overlay.jsx
  useEffect(() => {
    if (!isOpen || !blocksRef.current) return;
    const blocks = Array.from(blocksRef.current.children);
    blocks.forEach((b) => {
      b.style.transition = 'none';
      b.style.opacity = '1';
    });
    let r1 = 0, r2 = 0;
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        blocks.forEach((b) => {
          const delay = 300 + Math.random() * 700;
          b.style.transition = `opacity .45s ${delay.toFixed(0)}ms ease`;
          b.style.opacity = '0';
        });
      });
    });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [isOpen, shown]);

  // Échap pour fermer
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape' && !trailerUrl) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, trailerUrl]);

  const movie = MOVIES[shown];
  if (!movie) return null;

  const { myRatings, comments, getRating, isOwned, isRented, timeLeft, rate, addComment, addToCart, buy, rent } = catalog;
  const rating = getRating(movie.id);
  const myRate = myRatings[movie.id] ?? 0;

  /* ── handlers ── */
  const handleRate = (n) => {
    rate(movie.id, n);
    onToast(`NOTE : ${n} ★`);
  };

  const handleComment = (movieId, payload) => {
    addComment(movieId, payload);
    onToast('COMMENTAIRE AJOUTÉ');
  };

  const handleRent = () => {
    if (isRented(movie.id)) return;
    rent(movie.id);
    onToast(`LOUÉ · ${movie.price.rent.toFixed(2)} €`);
  };

  const handleBuy = () => {
    if (isOwned(movie.id)) return;
    buy(movie.id);
    onToast(`ACHETÉ · ${movie.price.buy.toFixed(2)} €`);
  };

  const handleCart = () => {
    addToCart(movie.id);
    onToast('+ PANIER');
  };

  /* ── genres pill ── */
  const metaLine = [
    `FILM ${String(shown + 1).padStart(2, '0')}`,
    movie.year,
    `${movie.runtime} MIN`,
    ...movie.genres.map((g) => g.toUpperCase()),
  ].join(' · ');

  return (
    <>
      <div
        id="overlay"
        className={isOpen ? 'on' : ''}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* ── Gauche : poster ── */}
        <div className="ov-left">
          <img id="ov-img" src={posterSrc(movie)} alt={movie.title} />
          <div className="ov-blocks" ref={blocksRef}>
            {Array.from({ length: 35 }).map((_, i) => <i key={i} />)}
          </div>
        </div>

        {/* ── Droite : détail ── */}
        <div className="ov-right">
          <div className="ov-num">{metaLine}</div>
          <div className="ov-name">{movie.title}</div>
          <div className="ov-director">{movie.director}</div>

          {/* Rating communautaire + ma note */}
          <div className="ov-rating">
            <StarRating value={rating.avg} size="md" count={rating.count} />
            <div className="ov-my-rating">
              <span className="ov-my-rating-label">MA NOTE :</span>
              <StarRating value={myRate} onChange={handleRate} size="sm" />
            </div>
          </div>

          {/* Synopsis */}
          <div className="ov-desc">{movie.synopsis}</div>

          {/* Boutons d'action */}
          <PurchaseBar
            movie={movie}
            isOwned={isOwned(movie.id)}
            isRented={isRented(movie.id)}
            timeLeft={timeLeft(movie.id)}
            onRent={handleRent}
            onBuy={handleBuy}
            onCart={handleCart}
            onTrailer={() => setTrailerUrl(movie.trailer)}
          />

          {/* Commentaires */}
          <CommentSection
            movieId={movie.id}
            comments={comments}
            onSubmit={handleComment}
          />
        </div>
      </div>

      {/* Bouton CLOSE */}
      <div id="ov-close" className={isOpen ? 'on' : ''} onClick={onClose}>
        CLOSE
      </div>

      {/* Modale bande-annonce */}
      {trailerUrl && (
        <TrailerModal url={trailerUrl} onClose={() => setTrailerUrl(null)} />
      )}
    </>
  );
}
