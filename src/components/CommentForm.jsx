// CommentForm — textarea + note optionnelle + bouton Envoyer
import { useState } from 'react';
import StarRating from './StarRating';

export default function CommentForm({ onSubmit }) {
  const [text, setText] = useState('');
  const [stars, setStars] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit({ text, stars: stars || null });
    setText('');
    setStars(0);
  };

  return (
    <form className="ov-comment-form" onSubmit={handleSubmit}>
      <div className="ov-comment-form-row">
        <textarea
          className="ov-comment-textarea"
          rows={2}
          maxLength={400}
          placeholder="Votre avis…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="ov-comment-form-footer">
        <StarRating value={stars} onChange={setStars} size="sm" />
        <button
          type="submit"
          className="btn btn-ghost"
          disabled={!text.trim()}
        >
          ENVOYER
        </button>
      </div>
    </form>
  );
}
