// TrailerModal — iframe YouTube dans une modale
import { useEffect } from 'react';

// Extrait l'ID YouTube d'une URL youtu.be ou youtube.com
function youtubeId(url) {
  if (!url) return null;
  const m =
    url.match(/youtu\.be\/([^?&]+)/) ||
    url.match(/[?&]v=([^?&]+)/);
  return m ? m[1] : null;
}

export default function TrailerModal({ url, onClose }) {
  const id = youtubeId(url);

  useEffect(() => {
    if (!url) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [url, onClose]);

  if (!url) return null;

  return (
    <div className="trailer-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="trailer-box">
        <button className="trailer-close sm" onClick={onClose}>✕ FERMER</button>
        {id ? (
          <iframe
            title="Bande-annonce"
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${id}?autoplay=1`}
            allow="autoplay; encrypted-media"
            allowFullScreen
            frameBorder="0"
          />
        ) : (
          <div className="trailer-no-id">URL de bande-annonce invalide.</div>
        )}
      </div>
    </div>
  );
}
