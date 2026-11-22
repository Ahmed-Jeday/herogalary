// StarRating — 5 étoiles, mode lecture ET interactif
// Props :
//   value    : nombre 0..5 (supporte les demi-étoiles en lecture)
//   onChange : (n: 1..5) => void   — si absent, mode lecture seul
//   size     : 'sm' | 'md' | 'lg'  (défaut 'md')
//   count    : nombre d'avis (optionnel, affiché après les étoiles)

export default function StarRating({ value = 0, onChange, size = 'md', count }) {
  const sizes = { sm: '1em', md: '1.3em', lg: '1.8em' };
  const sz = sizes[size] ?? sizes.md;
  const interactive = typeof onChange === 'function';

  return (
    <span className={`star-rating${interactive ? ' interactive' : ''}`} style={{ '--sz': sz }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = value >= n ? 'full' : value >= n - 0.5 ? 'half' : 'empty';
        return (
          <span
            key={n}
            className={`star star-${filled}`}
            onClick={interactive ? () => onChange(n) : undefined}
            title={interactive ? `${n} étoile${n > 1 ? 's' : ''}` : undefined}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') onChange(n); } : undefined}
          >
            {filled === 'full'  ? '★' : filled === 'half' ? '⯨' : '☆'}
          </span>
        );
      })}
      {count !== undefined && (
        <span className="star-count">({count.toLocaleString('fr-FR')})</span>
      )}
    </span>
  );
}
