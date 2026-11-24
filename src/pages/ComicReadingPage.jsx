
import { useNavigate } from "react-router-dom";
import ComicReader from "../../components/comic/ComicReader";

function ComicReadingPage() {
  const navigate = useNavigate();

  return (
    <main className="comic-reading-page">

      <button onClick={() => navigate("/comics")}>
        ← Back to Comics
      </button>

      <h1>Spider-Man #01</h1>

      <ComicReader
        file="/comics/spiderman-01.cbz"
      />

    </main>
  );
}

export default ComicReadingPage;
