import { WORLDS } from "./data";

/** Jump the scroll position to the shelf stop for a universe. */
export function goToShelf(key: string) {
  const shelf = document.getElementById("shelf");
  const stage = shelf?.querySelector<HTMLElement>(".shelfstage");
  if (!shelf || !stage) return;
  const index = WORLDS.findIndex((w) => w.k === key);
  if (index < 0) return;

  const span = shelf.offsetHeight - stage.offsetHeight;
  const offset = (span * index) / (WORLDS.length - 1);

  // The shop lives in its own scroll container inside the single-page app.
  const scroller = shelf.closest<HTMLElement>(".shop-section");
  if (scroller) {
    const top =
      shelf.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top +
      scroller.scrollTop +
      offset;
    scroller.scrollTo({ top, behavior: "smooth" });
    return;
  }

  window.scrollTo(0, shelf.offsetTop + offset);
}
