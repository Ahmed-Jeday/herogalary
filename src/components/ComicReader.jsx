
import { useEffect, useState } from "react";
import JSZip from "jszip";

import { ComicViewer } from "react-comic-viewer";
import "react-comic-viewer/styles.css";

import "./ComicReader.css";

function ComicReader({ file }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const objectUrls = [];

    async function loadComic() {
      try {
        setLoading(true);
        setError("");
        setPages([]);

        // 1. Fetch the CBZ file
        const response = await fetch(file);

        if (!response.ok) {
          throw new Error("Comic file not found");
        }

        // 2. Extract the ZIP archive
        const buffer = await response.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);

        // 3. Get and sort comic images
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
          throw new Error("No comic pages found");
        }

        // 4. Convert images into browser URLs
        const urls = await Promise.all(
          images.map(async image => {
            const blob = await image.async("blob");
            const url = URL.createObjectURL(blob);

            objectUrls.push(url);
            return url;
          })
        );

        if (!cancelled) {
          setPages(urls);
        }

      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadComic();

    // Clean up generated URLs
    return () => {
      cancelled = true;
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };

  }, [file]);

  if (loading) {
    return <div className="comic-loading">
      Loading comic...
    </div>;
  }

  if (error) {
    return <div className="comic-error">
      {error}
    </div>;
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
