"use client";

import { useMemo, useState } from "react";
import { CATS, ITEMS, productImage, productThumb } from "./data";
import { useIsTouch } from "./hooks";
import { useSiteUi } from "./SiteUi";

type CategoryKey = keyof typeof CATS;
type FilterKey = "all" | CategoryKey;

/** Full catalog: every item on the shelf, filterable by universe, opening the same quick-view dialog as the Shelf. */
export function StoreGrid() {
  const { openQuick, backToShelf, openCart, cartCount } = useSiteUi();
  const touch = useIsTouch();
  const [filter, setFilter] = useState<FilterKey>("all");

  const categories = useMemo(() => Object.keys(CATS) as CategoryKey[], []);

  const items = useMemo(
    () =>
      ITEMS.map((item, id) => ({ ...item, id })).filter(
        (item) => filter === "all" || item.category === filter,
      ),
    [filter],
  );

  return (
    <main className="storepage">
      <header className="storehead">
        <div className="storehead-top">
          <button className="btn sline back" type="button" onClick={backToShelf}>
            ← Back to the shelf
          </button>
          <button className="btn sline cartbtn" type="button" onClick={openCart}>
            Panier{cartCount > 0 ? ` · ${cartCount}` : ""}
          </button>
        </div>
        <h1>The Store</h1>
        <p className="storecount">
          {items.length} {items.length === 1 ? "piece" : "pieces"} on the shelves
        </p>
      </header>

      <div className="storefilters" role="group" aria-label="Filter by universe">
        <button
          type="button"
          className="chip"
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        {categories.map((key) => (
          <button
            key={key}
            type="button"
            className="chip"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {CATS[key]}
          </button>
        ))}
      </div>

      <div className="storegrid">
        {items.length === 0 ? (
          <p className="storeempty">Nothing here yet in this universe.</p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="scard"
              onClick={() => openQuick(item.id)}
            >
              <img
                loading="lazy"
                decoding="async"
                src={touch ? productThumb(item.id) : productImage(item.id)}
                alt=""
              />
              <span className="scard-cat">{CATS[item.category]}</span>
              <span className="scard-name">{item.name}</span>
            </button>
          ))
        )}
      </div>
    </main>
  );
}
