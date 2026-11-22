// CommentSection — liste des commentaires + formulaire
import StarRating from './StarRating';
import CommentForm from './CommentForm';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function CommentSection({ movieId, comments = [], onSubmit }) {
  const list = comments[movieId] ?? [];

  return (
    <div className="ov-comments">
      <div className="ov-comments-title">
        COMMENTAIRES {list.length > 0 ? `(${list.length})` : ''}
      </div>

      {list.length === 0 && (
        <p className="ov-comments-empty">Aucun commentaire — soyez le premier !</p>
      )}

      <div className="ov-comments-list">
        {list.map((c) => (
          <div key={c.id} className="ov-comment">
            <div className="ov-comment-header">
              <span className="ov-comment-user">{c.user}</span>
              {c.stars && <StarRating value={c.stars} size="sm" />}
              <span className="ov-comment-date">{formatDate(c.date)}</span>
            </div>
            <p className="ov-comment-text">{c.text}</p>
          </div>
        ))}
      </div>

      <CommentForm onSubmit={({ text, stars }) => onSubmit(movieId, { text, stars })} />
    </div>
  );
}
