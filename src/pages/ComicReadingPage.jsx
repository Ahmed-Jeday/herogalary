
import ComicReader from "../components/ComicReader";

function ComicReadingPage({ comic, onBack }) {
  return (
    <main className="comic-reading-page">
      <header className="comic-reading-header">
        <button type="button" onClick={onBack}>
          ← Retour aux comics
        </button>
        <div>
          <h1>{comic.title}</h1>
          <p>{comic.hero} · {comic.year} · {comic.pages} pages</p>
        </div>
      </header>
      <ComicReader file={comic.file} />
    </main>
  );
}

export default ComicReadingPage;
