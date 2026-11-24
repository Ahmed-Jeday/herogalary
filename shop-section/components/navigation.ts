import { WORLDS } from "./data";

/** Jump the scroll position to the shelf stop for a universe. */
export function goToShelf(key: string) {
  const shelf = document.getElementById("shelf");
  const stage = shelf?.querySelector<HTMLElement>(".shelfstage");
  if (!shelf || !stage) return;
  const index = WORLDS.findIndex((w) => w.k === key);
  if (index < 0) return;
  const span = shelf.offsetHeight - stage.offsetHeight;
  window.scrollTo(0, shelf.offsetTop + (span * index) / (WORLDS.length - 1));
}
