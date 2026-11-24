"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CATS,
  DECK_SLOTS,
  ITEMS,
  PHONE_SLOTS,
  productImage,
  productThumb,
  WORLD_ITEMS,
  WORLDS,
} from "./data";
import { clamp, smooth, useIsPhone, useIsTouch, useLatest, useRaf } from "./hooks";
import { goToShelf } from "./navigation";
import { useSiteUi } from "./SiteUi";

interface BoxRef {
  el: HTMLButtonElement;
  img: HTMLImageElement;
  g: number;
  n: number;
  id: number;
}

/** Fly through a stack of boxes, each one flooding the screen with its universe. */
export function Shelf() {
  const { openLead, openQuick } = useSiteUi();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sbaseRef = useRef<HTMLElement>(null);
  const floodRef = useRef<HTMLElement>(null);
  const speedRef = useRef<HTMLElement>(null);
  const giantRef = useRef<HTMLParagraphElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const sfxRef = useRef<HTMLSpanElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  const boxes = useRef<BoxRef[]>([]);
  const current = useRef(0);
  const previous = useRef(0);
  const velocity = useRef(0);
  const front = useRef(0);
  const firstWorld = useRef(true);
  const [world, setWorld] = useState(0);

  const phone = useIsPhone();
  const touch = useIsTouch();
  const phoneRef = useLatest(phone);
  const touchRef = useLatest(touch);

  const active = WORLDS[world];

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    boxes.current = Array.from(deck.querySelectorAll<HTMLButtonElement>(".sbox")).map((el) => ({
      el,
      img: el.querySelector("img") as HTMLImageElement,
      g: Number(el.dataset.g),
      n: Number(el.dataset.n),
      id: Number(el.dataset.id),
    }));
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        boxes.current.forEach((box) => {
          box.img.src = touchRef.current ? productThumb(box.id) : productImage(box.id);
        });
      },
      { rootMargin: "250% 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [touch]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const w = WORLDS[world];
    stage.style.setProperty("--fg", w.fg);
    if (giantRef.current) giantRef.current.textContent = w.word;
    if (stripRef.current) stripRef.current.scrollLeft = 0;
    if (infoRef.current) {
      infoRef.current.classList.remove("swap");
      void infoRef.current.offsetWidth;
      infoRef.current.classList.add("swap");
    }

    const chips = chipsRef.current;
    chips?.querySelectorAll<HTMLButtonElement>(".chip").forEach((chip) => {
      const on = chip.dataset.k === w.k;
      chip.setAttribute("aria-pressed", String(on));
      if (on) {
        chips.scrollTo({ left: chip.offsetLeft - chips.offsetLeft - 12, behavior: "smooth" });
      }
    });

    const flood = floodRef.current;
    const sbase = sbaseRef.current;
    if (firstWorld.current) {
      firstWorld.current = false;
      if (sbase) sbase.style.background = w.bg;
      return;
    }
    if (flood) {
      flood.classList.remove("go");
      void flood.offsetWidth;
      flood.style.background = w.bg;
      flood.classList.add("go");
    }
    const timer = window.setTimeout(() => {
      if (sbase) sbase.style.background = w.bg;
    }, 520);
    if (sfxRef.current) {
      sfxRef.current.textContent = w.sfx;
      sfxRef.current.classList.remove("pop");
      void sfxRef.current.offsetWidth;
      sfxRef.current.classList.add("pop");
    }
    return () => clearTimeout(timer);
  }, [world]);

  useRaf((now) => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const rect = section.getBoundingClientRect();
    if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;

    const n = WORLDS.length;
    const raw = clamp(-rect.top / Math.max(1, rect.height - stage.offsetHeight)) * (n - 1);
    const a = Math.floor(raw);
    const f = raw - a;
    const step = f < 0.3 ? 0 : f > 0.7 ? 1 : smooth((f - 0.3) / 0.4); // hold on each universe, then burst
    const settled = Math.min(n - 1, a + step);

    current.current += (settled - current.current) * 0.16;
    if (Math.abs(current.current - settled) < 0.001) current.current = settled;

    velocity.current += (Math.abs(current.current - previous.current) - velocity.current) * 0.2;
    previous.current = current.current;
    if (speedRef.current) speedRef.current.style.opacity = String(clamp(velocity.current * 22 - 0.1));

    const next = clamp(Math.round(current.current), 0, n - 1);
    if (next !== front.current) {
      front.current = next;
      setWorld(next);
    }

    const ph = phoneRef.current;
    const slots = ph ? PHONE_SLOTS : DECK_SLOTS;
    for (const box of boxes.current) {
      const u = (box.g - current.current) * (1 + box.n * 0.1);
      const slot = box.n ? slots[box.n - 1] : null;
      if (Math.abs(u) > 1.05 || (box.n && !slot)) {
        // eslint-disable-next-line react-hooks/immutability -- imperative 3D deck transform
        box.el.style.visibility = "hidden";
        continue;
      }
      box.el.style.visibility = "visible";
      const open = 1 - clamp(Math.abs(u));
      const bob = Math.sin(now / 900 + box.n * 1.7) * 5;
      const x = slot ? slot[0] * window.innerWidth * open * (ph ? 1 : 1.05) : 0;
      const y = (slot ? slot[1] * window.innerHeight * open : 0) + bob;
      const base = slot ? slot[2] : 0;
      const z = u > 0 ? base - u * 1500 : base + -u * 900;
      box.el.style.opacity = String(u < 0 ? clamp(1 + u * 1.5) : clamp(1.4 - u * 1.4));
      box.el.style.zIndex = String(box.n ? 20 - box.n : 30);
      box.el.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), ${z.toFixed(1)}px)`;
      box.el.style.pointerEvents = Math.abs(u) < 0.2 ? "auto" : "none";
    }
  });

  const holdIt = (id: number) => openLead(ITEMS[id].name);

  return (
    <section className="shelf" id="shelf" ref={sectionRef}>
      <div className="shelfstage" ref={stageRef}>
        <i className="sbase" ref={sbaseRef} />
        <i className="flood" ref={floodRef} />
        <i className="speed" ref={speedRef} />
        <p className="sgiant" aria-hidden="true" ref={giantRef} />

        <div className="chiprow">
          <h2>The Shelf</h2>
          <div className="chiprow-right">
            <div id="chips" role="group" aria-label="Jump to a universe" ref={chipsRef}>
              {WORLDS.map((w) => (
                <button
                  key={w.k}
                  className="chip"
                  type="button"
                  data-k={w.k}
                  aria-pressed={w.k === active.k}
                  onClick={() => goToShelf(w.k)}
                >
                  {CATS[w.k]}
                </button>
              ))}
            </div>
            <Link href="/store" className="btn sline seeall">
              See all
            </Link>
          </div>
        </div>

        <div className="deckwrap" aria-hidden="true">
          <div className="deck" ref={deckRef}>
            {WORLDS.map((w, g) =>
              WORLD_ITEMS[w.k].slice(0, 1 + DECK_SLOTS.length).map((id, n) => (
                <button
                  key={`${w.k}-${id}`}
                  className={`sbox${n ? "" : " hero"}`}
                  type="button"
                  tabIndex={-1}
                  data-g={g}
                  data-n={n}
                  data-id={id}
                  onClick={() => openQuick(id)}
                >
                  <img alt="" decoding="async" />
                </button>
              )),
            )}
          </div>
        </div>

        <span className="sfx2" aria-hidden="true" ref={sfxRef} />

        <div
          className="strip"
          id="strip"
          tabIndex={0}
          aria-label="Every box in this universe. Swipe sideways."
          ref={stripRef}
        >
          {WORLD_ITEMS[active.k].map((id) => (
            <button
              key={id}
              className="thumb"
              type="button"
              aria-label={ITEMS[id].name}
              onClick={() => openQuick(id)}
            >
              <img loading="lazy" src={touch ? productThumb(id) : productImage(id)} alt="" />
            </button>
          ))}
        </div>

        <div className="sinfo" ref={infoRef}>
          <span className="s-n">
            {WORLD_ITEMS[active.k].length} on the shelf{touch ? ". Tap a box." : ""}
          </span>
          <h3 className="s-name">{CATS[active.k]}</h3>
          <p className="s-cat">Up front: {ITEMS[active.hero].name}</p>
          <div className="qbtn">
            <button className="btn ink" id="sHold" type="button" onClick={() => holdIt(active.hero)}>
              Hold it for me
            </button>
            <button className="btn sline" id="sLook" type="button" onClick={() => openQuick(active.hero)}>
              Look closer
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
