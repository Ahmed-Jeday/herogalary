
import { useEffect, useState } from "react";
import JSZip from "jszip";

import { ComicViewer } from "react-comic-viewer";
import "react-comic-viewer/styles.css";

import "../ComicReader.css";

function ComicReader({ file }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const objectUrls = [];
    const controller = new AbortController();

    function releaseObjectUrls() {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
      objectUrls.length = 0;
    }

    async function loadComic() {
      try {
        setLoading(true);
        setError("");
        setPages([]);

        const response = await fetch(file, { signal: controller.signal });

        if (!response.ok) {
          throw new Error("Fichier CBZ introuvable.");
        }

        const buffer = await response.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);

        const images = Object.values(zip.files)
          .filter(entry =>
            !entry.dir &&
            /\.(jpg|jpeg|png|webp|gif)$/i.test(entry.name)
          )
          .sort((a, b) =>
            a.name.localeCompare(
              b.name,
              undefined,
              { numeric: true }
            )
          );

        if (!images.length) {
          throw new Error("Aucune page d’image trouvée dans cette archive.");
        }

        const results = await Promise.allSettled(
          images.map(async image => {
            const blob = await image.async("blob");
            const url = URL.createObjectURL(blob);

            objectUrls.push(url);
            return url;
          })
        );
        const failedPage = results.find(result => result.status === "rejected");
        if (failedPage) throw failedPage.reason;
        const urls = results.map(result => result.value);

        if (!cancelled) {
          setPages(urls);
        }

      } catch (err) {
        releaseObjectUrls();
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Impossible de charger ce comic.");
        }
      } finally {
        if (cancelled) {
          releaseObjectUrls();
        } else {
          setLoading(false);
        }
      }
    }

    loadComic();

    return () => {
      cancelled = true;
      controller.abort();
      releaseObjectUrls();
    };

  }, [file]);

  if (loading) {
    return <div className="comic-loading" role="status">Chargement du comic…</div>;
  }

  if (error) {
    return <div className="comic-error" role="alert">{error}</div>;
  }

  return (
    <div className="comic-reader">
      <ComicViewer
        pages={pages}
        direction="ltr"
        showPageIndicator={true}
      />
    </div>
  );
}

export default ComicReader;
