import { useRef, useEffect } from "react";
import PageNav from "./PageNav";
import "../ComicVault.css";

/* =========================================================
   DATA
   ========================================================= */
const WM = "https://commons.wikimedia.org/wiki/Special:FilePath/";
const FILMS = [
  { id:"meteor",   title:"Captain Meteor",    hero:"Marcus Hale",       pub:"Vault Comics",   year:1940, genre:"Aventure",        pages:64, sc:"#D7261E", st:"#FFF3D6", cover:WM+"Fantastic_Comics_1.jpg?width=700",        syn:"Un pilote d'essai frôle une pluie de météorites et en revient capable de voler plus vite que le son. Les nazis de l'ombre le savent déjà." },
  { id:"falcon",   title:"Crimson Falcon",    hero:"Ellie Ward",        pub:"Vault Comics",   year:1941, genre:"Justicier",       pages:52, sc:"#15110E", st:"#FFC914", cover:WM+"WhizComicsNo02.jpg?width=700",             syn:"La nuit, une ancienne trapéziste patrouille les toits de Port-Aurore. Le jour, elle enquête sur ceux qui ont fait tomber son cirque." },
  { id:"eclipse",  title:"Professor Eclipse", hero:"Dr. Amos Kane",     pub:"Nova Press",     year:1943, genre:"Mystère",         pages:48, sc:"#5B2A86", st:"#FFE9A8", cover:WM+"IbisTheInvincibleNo1.jpg?width=700",      syn:"Un égyptologue découvre une amulette qui éteint le soleil pendant sept minutes — juste assez pour changer le cours de l'histoire." },
  { id:"sentinel", title:"Steel Sentinel",    hero:"Unité S-19",        pub:"Nova Press",     year:1945, genre:"Science-fiction",  pages:56, sc:"#1F3FB0", st:"#FFFFFF", cover:WM+"HitComicsNo19.jpg?width=700",              syn:"Un robot de l'armée refuse un ordre, et découvre qu'il vient de développer une conscience. La ville, elle, n'est pas prête." },
  { id:"lightning",title:"Lady Lightning",    hero:"Rose Delacroix",    pub:"Starlight",      year:1952, genre:"Héroïne",         pages:44, sc:"#FFC914", st:"#15110E", cover:WM+"MasterComicsNo16.jpg?width=700",           syn:"Foudroyée sur le toit d'un cinéma, une projectionniste apprend à canaliser l'orage. Chaque séance devient une mission." },
  { id:"ranger",   title:"Atomic Ranger",     hero:"Sheriff Cole",      pub:"Starlight",      year:1956, genre:"Western",         pages:40, sc:"#1E7A4C", st:"#F5EBCB", cover:WM+"PepNumber67.jpg?width=700",                syn:"Dans un désert irradié, un shérif au bras de métal protège les derniers villages contre les bandits mutants." },
  { id:"wasp",     title:"The Iron Wasp",     hero:"Tina & Leo Marsh",  pub:"Marble Studios", year:1963, genre:"Équipe",          pages:36, sc:"#E8641B", st:"#15110E", cover:WM+"MarvelFamilyNumber4.png?width=700",        syn:"Deux jumeaux fusionnent leurs armures et forment un seul héros. Chaque bourdonnement annonce une bataille." },
  { id:"legion",   title:"Shadow Legion",     hero:"Escouade Zéro",     pub:"Marble Studios", year:1967, genre:"Espionnage",      pages:36, sc:"#15110E", st:"#D7261E", cover:WM+"T.H.U.N.D.E.R._Agents_12.jpg?width=700",   syn:"Six agents sans nom opèrent hors de tout registre. Quand l'un d'eux disparaît, la Légion doit trahir ses propres règles." },
  { id:"aurora",   title:"Captain Aurora",    hero:"Lt. Nadia Rahal",   pub:"Zenith",         year:1974, genre:"Cosmique",        pages:32, sc:"#0E7C86", st:"#FFF3D6", cover:WM+"WonderworldComics3.jpg?width=700",         syn:"Une capitaine de l'espace revient d'une mission perdue avec des pouvoirs qu'elle ne comprend pas, et une aurore qui la suit partout." },
  { id:"comet",    title:"Phantom Comet",     hero:"Inconnu",           pub:"Zenith",         year:1978, genre:"Fantastique",     pages:32, sc:"#D7261E", st:"#FFC914", cover:WM+"Bulletman_05_0001.png?width=700",          syn:"Tous les soixante-dix ans, une comète traverse le ciel et réveille un fantôme qui cherche à finir ce qu'il a commencé." },
  { id:"knight",   title:"Cyber Knight",      hero:"Kai Nakamura",      pub:"Neon House",     year:1983, genre:"Cyberpunk",       pages:48, sc:"#5B2A86", st:"#7DF9FF", cover:WM+"MagicianfromMarsfromAmazingManComics11.PNG?width=700", syn:"Dans une mégapole saturée de néons, un hacker greffé d'une armure ancienne se bat pour libérer la ville de ses propres machines." },
  { id:"starfall", title:"Starfall",          hero:"Mira Okoye",        pub:"Neon House",     year:1988, genre:"Cosmique",        pages:60, sc:"#1F3FB0", st:"#FFC914", cover:WM+"An_Earth_Man_on_Venus_comic_book.jpg?width=700", syn:"Une étoile s'écrase au cœur de Lagos. Mira en émerge avec le pouvoir de plier la lumière — et une dette envers le ciel." },
  { id:"xmen-incursions", title:"X-Men: Incursions #001", hero:"X-Men", pub :"Marvel Comics", year:2027, genre:"Science-fiction", pages:32, sc:"#5B2A86", st:"#FFFFFF", cover:"/comic/xmen-incursions.jpg", file:"/comic/X-Men%20-%20Incursions%20001%20(2027)%20(Digital).cbz", syn:"L’édition numérique de ce numéro est disponible dans la bibliothèque HeroVerse." },
];

const DECADE_FIRST = { 1940:0, 1950:4, 1960:6, 1970:8, 1980:10, 2020:12 };
const N = FILMS.length;
const COPIES = 3;
const LOOP = N * COPIES;
const EASE = "cubic-bezier(.2,.8,.2,1)";
const EASE_SHEET = "cubic-bezier(.76,0,.18,1)";
const START = N + 5;

/* =========================================================
   PURE HELPERS
   ========================================================= */
function smoothstep(x) { return x * x * (3 - 2 * x); }
function B(r) {
  if (Math.abs(r) >= 1) return Math.sign(r) * 0.5;
  return (r + Math.sin(Math.PI * r) / Math.PI) / 2;
}
function relIndex(v, sc) {
  let r = ((v - sc) % LOOP + LOOP) % LOOP;
  if (r > LOOP / 2) r -= LOOP;
  return r;
}

/* =========================================================
   COMPONENT
   ========================================================= */
export default function ComicVault({ onRead, onExit, onNavigateSection }) {
  const stageRef      = useRef(null);
  const shelfRef      = useRef(null);
  const tabsRef       = useRef(null);
  const indicatorRef  = useRef(null);
  const playRingRef   = useRef(null);
  const cursorRef     = useRef(null);
  const grainRef      = useRef(null);
  const detailRef     = useRef(null);
  const dleftRef      = useRef(null);
  const dSubRef       = useRef(null);
  const dTitleRef     = useRef(null);
  const dMetaRef      = useRef(null);
  const dSynRef       = useRef(null);
  const watchRef      = useRef(null);
  const posterImgRef  = useRef(null);
  const maskTitleRef  = useRef(null);
  const maskSubRef    = useRef(null);
  const maskYearRef   = useRef(null);
  const tapeElsRef    = useRef([]);
  const blobRefs      = useRef([]);

  const stateRef = useRef({
    W: 0, H: 0, ws: 0, d: 0, gap: 0,
    s: START, T: START,
    active: START % N,
    hover: -1,
    dragging: false, dragMoved: false,
    dragStartX: 0, dragT0: 0, dragStartY: 0,
    overBtn: false,
    mx: window.innerWidth / 2, my: window.innerHeight / 2,
    cx: window.innerWidth / 2, cy: window.innerHeight / 2,
    tiltX: 0, tiltY: 0,
    onCover: false, isOpen: false,
    centerTape: null,
    tapes: [],
    wheelTimer: 0,
    reduce: false,
    sheetAnim: null, lineAnims: [], inkRaf: 0,
    openDetail: null, closeDetail: null, jumpTo: null,
  });

  /* ---------------------------------------------------------
     IMPERATIVE ENGINE
     --------------------------------------------------------- */
  useEffect(() => {
    const st = stateRef.current;
    const root = document.documentElement;
    st.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* grain */
    const grainSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="n">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 0.45 0 0 0 0 0.42 0 0 0 0 0.38 0 0 0 0.22 0"/>' +
      '</filter><rect width="100%" height="100%" filter="url(#n)"/></svg>';
    if (grainRef.current) {
      grainRef.current.style.backgroundImage =
        'url("data:image/svg+xml,' + encodeURIComponent(grainSvg) + '")';
    }

    /* probe for --H */
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:absolute;left:-9999px;top:0;width:0;height:var(--H);visibility:hidden;pointer-events:none;";
    stageRef.current.closest(".comic-vault").appendChild(probe);

    function positionIndicator() {
      if (!indicatorRef.current || !tabsRef.current) return;
      const activeTab = tabsRef.current.querySelector(".tab.active");
      if (!activeTab) return;
      indicatorRef.current.style.width = activeTab.offsetWidth + "px";
      indicatorRef.current.style.transform = "translateX(" + activeTab.offsetLeft + "px)";
    }

    function measure() {
      st.W = window.innerWidth;
      st.H = probe.offsetHeight || 1;
      st.ws = st.H * 0.13;
      st.d  = st.H * 0.66;
      st.gap = st.H * 0.03;
      root.style.setProperty("--ws", st.ws + "px");
      root.style.setProperty("--d", st.d + "px");
      positionIndicator();
    }

    /* caption swap */
    function swapLine(maskEl, text, dir, className) {
      if (!maskEl) return;
      const old = Array.from(maskEl.children);
      const span = document.createElement("span");
      span.textContent = text;
      span.className = className;
      maskEl.appendChild(span);
      old.forEach(o => { o.style.position = "absolute"; o.style.inset = "0"; });
      if (st.reduce) { old.forEach(o => o.remove()); return; }
      span.animate(
        [{ transform: "translateY(" + (dir * 105) + "%)" }, { transform: "translateY(0)" }],
        { duration: 650, easing: EASE, fill: "both" }
      );
      old.forEach(o => {
        const from = getComputedStyle(o).transform;
        const a = o.animate(
          [{ transform: from === "none" ? "translateY(0)" : from },
           { transform: "translateY(" + (-dir * 105) + "%)" }],
          { duration: 650, easing: EASE, fill: "both" }
        );
        a.finished.then(() => o.remove()).catch(() => {});
      });
    }

    function updateTabs(film) {
      if (!tabsRef.current) return;
      const decade = Math.floor(film.year / 10) * 10;
      const target = tabsRef.current.querySelector('.tab[data-decade="' + decade + '"]');
      if (!target) return;
      tabsRef.current.querySelectorAll(".tab").forEach(b =>
        b.classList.toggle("active", b === target)
      );
      positionIndicator();
    }

    function setActiveCaption(filmIndex, dir) {
      const film = FILMS[filmIndex];
      swapLine(maskTitleRef.current, film.title, dir, "cap-title");
      swapLine(maskSubRef.current, film.hero + " / " + film.pub, dir, "cap-sub");
      swapLine(maskYearRef.current, String(film.year), dir, "cap-year");
      updateTabs(film);
    }

    /* detail helpers */
    function resetBlobs() {
      blobRefs.current.forEach(c => c && c.setAttribute("r", "0"));
    }

    function fillDetail(film) {
      if (dSubRef.current)   dSubRef.current.textContent   = film.hero + " / " + film.pub;
      if (dTitleRef.current) dTitleRef.current.textContent = film.title;
      if (dMetaRef.current)  dMetaRef.current.textContent  = film.year + " / " + film.genre.toUpperCase() + " / " + film.pages + " PAGES";
      if (dSynRef.current)   dSynRef.current.textContent   = film.syn;
      if (watchRef.current) {
        watchRef.current.disabled = !film.file;
        watchRef.current.textContent = film.file ? "Lire le comic" : "Archive indisponible";
      }
      if (posterImgRef.current) {
        if (film.cover) posterImgRef.current.setAttribute("href", film.cover);
        else posterImgRef.current.removeAttribute("href");
      }
      resetBlobs();
    }

    function coverRect() {
      if (!st.centerTape) {
        return { left: st.W / 2 - 100, top: window.innerHeight / 2 - 200,
                 right: st.W / 2 + 100, bottom: window.innerHeight / 2 + 200,
                 width: 200, height: 400 };
      }
      return st.centerTape.cvEl.getBoundingClientRect();
    }

    function insetFor(rect) {
      return "inset(" + rect.top + "px " + (window.innerWidth - rect.right) + "px " +
             (window.innerHeight - rect.bottom) + "px " + rect.left + "px round 3px)";
    }

    function cancelLines() {
      st.lineAnims.forEach(a => { try { a.cancel(); } catch (e) {} });
      st.lineAnims = [];
    }

    function runInk() {
      cancelAnimationFrame(st.inkRaf);
      const t0 = performance.now() + (st.reduce ? -5000 : 520);
      const start = performance.now();
      const dur = st.reduce ? 1 : 1250;
      function frame(now) {
        const elapsed = now - t0;
        let done = true;
        blobRefs.current.forEach(c => {
          if (!c) return;
          const delay = Number(c.dataset.delay) || 0;
          const p = Math.min(1, Math.max(0, (elapsed - delay) / dur));
          if (p < 1) done = false;
          c.setAttribute("r", (720 * (1 - Math.pow(1 - p, 3))).toFixed(2));
        });
        if (!done && now - start < 2400) st.inkRaf = requestAnimationFrame(frame);
        else blobRefs.current.forEach(c => c && c.setAttribute("r", "720"));
      }
      st.inkRaf = requestAnimationFrame(frame);
    }

    /* open / close detail */
    function openDetail() {
      if (st.isOpen) return;
      st.isOpen = true;
      st.T = Math.round(st.T);
      fillDetail(FILMS[st.active]);

      const rect = coverRect();
      const detail = detailRef.current;
      detail.style.visibility = "visible";
      detail.style.pointerEvents = "auto";
      detail.style.transformOrigin =
        (rect.left + rect.width / 2) + "px " + (rect.top + rect.height / 2) + "px";

      st.sheetAnim = detail.animate(
        [{ clipPath: insetFor(rect), transform: "rotate(-4.5deg)" },
         { clipPath: "inset(0px 0px 0px 0px round 0px)", transform: "rotate(0deg)" }],
        { duration: st.reduce ? 1 : 1050, easing: EASE_SHEET, fill: "both" }
      );

      cancelLines();
      if (dleftRef.current) {
        Array.from(dleftRef.current.children).forEach((line, i) => {
          const child = line.firstElementChild;
          if (!child) return;
          st.lineAnims.push(child.animate(
            [{ transform: "translateY(110%)" }, { transform: "translateY(0)" }],
            { duration: st.reduce ? 1 : 900, delay: st.reduce ? 0 : 620 + i * 75, easing: EASE, fill: "both" }
          ));
        });
      }
      runInk();
    }

    function closeDetail() {
      if (!st.isOpen) return;
      st.isOpen = false;
      cancelLines();
      cancelAnimationFrame(st.inkRaf);

      const rect = coverRect();
      const detail = detailRef.current;
      const a = detail.animate(
        [{ clipPath: "inset(0px 0px 0px 0px round 0px)", transform: "rotate(0deg)" },
         { clipPath: insetFor(rect), transform: "rotate(-4.5deg)" }],
        { duration: st.reduce ? 1 : 850, easing: EASE_SHEET, fill: "both" }
      );
      a.finished.then(() => {
        detail.style.visibility = "hidden";
        detail.style.pointerEvents = "none";
        if (st.sheetAnim) { try { st.sheetAnim.cancel(); } catch (e) {} st.sheetAnim = null; }
        try { a.cancel(); } catch (e) {}
        resetBlobs();
      }).catch(() => {});
    }

    function jumpTo(i) {
      const base = Math.round((st.T - i) / N) * N + i;
      let best = base;
      [base - N, base + N].forEach(c => {
        if (Math.abs(c - st.T) < Math.abs(best - st.T)) best = c;
      });
      st.T = best;
    }

    st.openDetail  = openDetail;
    st.closeDetail = closeDetail;
    st.jumpTo      = jumpTo;

    /* build tapes from rendered DOM */
    const tapes = [];
    for (let copy = 0; copy < COPIES; copy++) {
      for (let i = 0; i < N; i++) {
        const v = copy * N + i;
        const el = tapeElsRef.current[v];
        if (!el) continue;
        tapes.push({
          el,
          spEl: el.children[0],
          cvEl: el.children[1],
          v,
          film: FILMS[i],
          lift: 0,
          hidden: false,
        });
      }
    }
    st.tapes = tapes;

    /* cover fallback */
    FILMS.forEach(f => {
      if (!f.cover) {
        document.querySelectorAll('.cv[data-id="' + f.id + '"]').forEach(c => c.classList.add("nocover"));
        return;
      }
      const img = new Image();
      img.onerror = () => {
        document.querySelectorAll('.cv[data-id="' + f.id + '"]').forEach(c => {
          c.classList.add("nocover");
          c.style.backgroundImage = "none";
        });
      };
      img.src = f.cover;
    });

    /* ---- input listeners ---- */
    const tabButtons = tabsRef.current ? Array.from(tabsRef.current.querySelectorAll(".tab")) : [];
    const tabHandlers = tabButtons.map(b => {
      const h = () => {
        const dec = b.dataset.decade;
        const idx = dec === "all" ? 0 : DECADE_FIRST[Number(dec)];
        if (idx !== undefined) jumpTo(idx);
      };
      b.addEventListener("click", h);
      return [b, h];
    });

    const shelf = shelfRef.current;

    function onWheel(ev) {
      if (st.isOpen) return;
      const delta = Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.deltaY;
      st.T += (delta / (st.ws + st.gap)) * 0.5;
      clearTimeout(st.wheelTimer);
      st.wheelTimer = setTimeout(() => { st.T = Math.round(st.T); }, 160);
    }
    function onPointerDown(ev) {
      if (st.isOpen) return;
      st.dragging = true; st.dragMoved = false;
      st.dragStartX = ev.clientX; st.dragStartY = ev.clientY; st.dragT0 = st.T;
      if (shelf.setPointerCapture) shelf.setPointerCapture(ev.pointerId);
    }
    function onPointerMove(ev) {
      if (!st.dragging) return;
      const dx = ev.clientX - st.dragStartX;
      const dy = ev.clientY - st.dragStartY;
      if (!st.dragMoved && Math.hypot(dx, dy) > 5) st.dragMoved = true;
      if (st.dragMoved) st.T = st.dragT0 - dx / (st.ws + st.gap);
    }
    function endDrag() {
      if (!st.dragging) return;
      st.dragging = false;
      st.T = Math.round(st.T);
      setTimeout(() => { st.dragMoved = false; }, 0);
    }
    function onPointerLeaveShelf() { if (st.dragging) endDrag(); }

    function onWinPointerMove(ev) { st.mx = ev.clientX; st.my = ev.clientY; }
    function onDocPointerOver(ev) {
      const t = ev.target;
      st.overBtn = !!(t && t.closest && t.closest("button, a, .tab"));
    }
    function onKey(ev) {
      if (ev.key === "Escape") { closeDetail(); return; }
      if (st.isOpen) return;
      if (ev.key === "ArrowLeft")  st.T = Math.round(st.T) - 1;
      else if (ev.key === "ArrowRight") st.T = Math.round(st.T) + 1;
      else if (ev.key === "Enter") {
        const tag = (document.activeElement && document.activeElement.tagName) || "";
        if (tag !== "BUTTON" && tag !== "A") openDetail();
      }
    }

    shelf.addEventListener("wheel", onWheel, { passive: true });
    shelf.addEventListener("pointerdown", onPointerDown);
    shelf.addEventListener("pointermove", onPointerMove);
    shelf.addEventListener("pointerup", endDrag);
    shelf.addEventListener("pointercancel", endDrag);
    shelf.addEventListener("pointerleave", onPointerLeaveShelf);
    window.addEventListener("pointermove", onWinPointerMove, { passive: true });
    document.addEventListener("pointerover", onDocPointerOver);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", measure);

    /* ---- boot ---- */
    measure();

    const initialFilm = FILMS[st.active];
    if (maskTitleRef.current) {
      const el = maskTitleRef.current.firstElementChild;
      if (el) { el.textContent = initialFilm.title; el.className = "cap-title"; }
    }
    if (maskSubRef.current) {
      const el = maskSubRef.current.firstElementChild;
      if (el) { el.textContent = initialFilm.hero + " / " + initialFilm.pub; el.className = "cap-sub"; }
    }
    if (maskYearRef.current) {
      const el = maskYearRef.current.firstElementChild;
      if (el) { el.textContent = String(initialFilm.year); el.className = "cap-year"; }
    }
    updateTabs(initialFilm);

    /* ---- main loop ---- */
    let last = performance.now();
    let rafId = 0;

    function loop(now) {
      const dt = Math.min(50, now - last) / 1000;
      last = now;

      const k = st.dragging ? 18 : (st.reduce ? 60 : 5.2);
      st.s += (st.T - st.s) * (1 - Math.exp(-k * dt));
      if (Math.abs(st.T - st.s) < 1e-4) st.s = st.T;

      if (Math.abs(st.s) > N * 4) {
        const shift = Math.round(st.s / N) * N;
        st.s -= shift; st.T -= shift;
      }

      const ai = ((Math.round(st.s) % N) + N) % N;
      if (ai !== st.active) {
        const dir = Math.sign(st.T - st.s) || 1;
        st.active = ai;
        setActiveCaption(ai, dir);
      }

      st.cx += (st.mx - st.cx) * (1 - Math.exp(-16 * dt));
      st.cy += (st.my - st.cy) * (1 - Math.exp(-16 * dt));

      const shelfCx = st.W / 2, shelfCy = window.innerHeight / 2;
      const nearX = Math.abs(st.mx - shelfCx) < 0.55 * st.d;
      const nearY = Math.abs(st.my - shelfCy) < 0.55 * st.H;
      const settled = Math.abs(st.T - st.s) < 0.3;
      st.onCover = !st.isOpen && settled && nearX && nearY;

      let tyTarget, txTarget;
      if (st.onCover) {
        tyTarget = ((st.mx - shelfCx) / (0.55 * st.d)) * 9;
        txTarget = -((st.my - shelfCy) / (st.H / 2)) * 6;
      } else {
        tyTarget = ((st.mx - shelfCx) / st.W) * 5;
        txTarget = 0;
      }
      const tiltEase = st.reduce ? 1 : (1 - Math.exp(-7 * dt));
      st.tiltY += (tyTarget - st.tiltY) * tiltEase;
      st.tiltX += (txTarget - st.tiltX) * tiltEase;

      st.centerTape = null;

      for (let i = 0; i < st.tapes.length; i++) {
        const tp = st.tapes[i];
        const r = relIndex(tp.v, st.s);
        const x = r * (st.ws + st.gap) + (st.d - st.ws + 1.6 * st.gap) * B(r);

        if (Math.abs(x) > st.W / 2 + 1.5 * st.d) {
          if (!tp.hidden) { tp.el.style.visibility = "hidden"; tp.hidden = true; }
          continue;
        }
        if (tp.hidden) { tp.el.style.visibility = "visible"; tp.hidden = false; }

        const o = smoothstep(Math.max(0, 1 - Math.abs(r)));
        const liftTarget = (st.hover === tp.v && Math.abs(r) > 0.5) ? 1 : 0;
        if (st.reduce) tp.lift = liftTarget;
        else tp.lift += (liftTarget - tp.lift) * (1 - Math.exp(-12 * dt));

        const ty = -o * 0.025 * st.H - tp.lift * 0.045 * st.H;
        const tz = o * 0.2 * st.H;
        tp.el.style.transform =
          "translate3d(" + x.toFixed(3) + "px," + ty.toFixed(3) + "px," + tz.toFixed(3) + "px)" +
          " rotateZ(" + (-4.5 * o).toFixed(3) + "deg)" +
          " rotateX(" + (st.tiltX * o).toFixed(3) + "deg)" +
          " rotateY(" + (-90 * o + st.tiltY * o).toFixed(3) + "deg)";

        tp.el.style.zIndex = String(Math.round(100 - Math.abs(r) * 4));
        tp.el.style.setProperty("--sp-shade", (o * 0.55).toFixed(3));
        tp.el.style.setProperty("--cv-shade", ((1 - o) * 0.5).toFixed(3));

        if (Math.abs(r) < 0.5) st.centerTape = tp;
      }

      const ps = smoothstep(Math.max(0, 1 - Math.abs(st.T - st.s) * 3)) * (st.isOpen ? 0 : 1);
      if (playRingRef.current) {
        playRingRef.current.style.transform = "translate(-50%,-50%) scale(" + ps.toFixed(4) + ")";
        playRingRef.current.style.pointerEvents = ps > 0.4 ? "auto" : "none";
      }

      if (cursorRef.current) {
        cursorRef.current.style.transform =
          "translate3d(" + st.cx.toFixed(2) + "px," + st.cy.toFixed(2) + "px,0)";
        cursorRef.current.classList.toggle("open", st.onCover);
        cursorRef.current.classList.toggle("spine", !st.onCover && st.hover >= 0 && !st.isOpen);
        cursorRef.current.classList.toggle("btn", !st.onCover && st.hover < 0 && st.overBtn);
      }

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(t => {
      last = t;
      rafId = requestAnimationFrame(loop);
    });

    /* ---- cleanup ---- */
    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(st.inkRaf);
      clearTimeout(st.wheelTimer);
      window.removeEventListener("pointermove", onWinPointerMove);
      document.removeEventListener("pointerover", onDocPointerOver);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", measure);
      if (shelf) {
        shelf.removeEventListener("wheel", onWheel);
        shelf.removeEventListener("pointerdown", onPointerDown);
        shelf.removeEventListener("pointermove", onPointerMove);
        shelf.removeEventListener("pointerup", endDrag);
        shelf.removeEventListener("pointercancel", endDrag);
        shelf.removeEventListener("pointerleave", onPointerLeaveShelf);
      }
      tabHandlers.forEach(([b, h]) => b.removeEventListener("click", h));
      probe.remove();
    };
  }, []);

  /* ---------------------------------------------------------
     JSX
     --------------------------------------------------------- */
  return (
    <div className="comic-vault">
      <header className="topbar">
        <button type="button" className="box lbl left" onClick={onExit}>Retour</button>
        <a className="logo" href="#">
          <span className="cn">COMIC VAULT</span>
          <span className="en">BIBLIOTHÈQUE DE COMICS</span>
        </a>
        <div className="topbar-right">
          <span className="lbl">Collection 1940–2027</span>
          <PageNav variant="comic" active={2} onNavigate={onNavigateSection} />
        </div>
      </header>

      <nav className="tabs" aria-label="Décennies" ref={tabsRef}>
        <span className="indicator" ref={indicatorRef} />
        <button className="tab lbl" data-decade="all">Tous</button>
        <button className="tab lbl" data-decade="1940">1940s</button>
        <button className="tab lbl" data-decade="1950">1950s</button>
        <button className="tab lbl" data-decade="1960">1960s</button>
        <button className="tab lbl" data-decade="1970">1970s</button>
        <button className="tab lbl" data-decade="1980">1980s</button>
        <button className="tab lbl" data-decade="2020">2020s</button>
      </nav>

      <section className="shelf" ref={shelfRef} aria-label="Étagère de comics">
        <div className="stage" ref={stageRef}>
          {Array.from({ length: COPIES }).map((_, copy) =>
            FILMS.map((film, i) => {
              const v = copy * N + i;
              return (
                <div
                  key={v}
                  className="tape"
                  ref={el => { tapeElsRef.current[v] = el; }}
                  onPointerEnter={() => { stateRef.current.hover = v; }}
                  onPointerLeave={() => {
                    const st = stateRef.current;
                    if (st.hover === v) st.hover = -1;
                  }}
                  onClick={ev => {
                    const st = stateRef.current;
                    if (st.dragMoved) return;
                    ev.stopPropagation();
                    const r = relIndex(v, st.s);
                    if (Math.abs(r) < 0.5) st.openDetail?.();
                    else st.T = Math.round(st.T + r);
                  }}
                >
                  <div
                    className="face sp"
                    style={{ "--sc": film.sc, "--st": film.st }}
                  >
                    <span className="sp-t">{film.title}</span>
                    <span className="sp-n">#{i + 1}</span>
                  </div>
                  <div
                    className="face cv"
                    data-id={film.id}
                    style={{
                      "--sc": film.sc,
                      "--st": film.st,
                      backgroundImage: film.cover ? `url("${film.cover}")` : "none",
                    }}
                  >
                    <span className="nc">{film.title}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <button
        className="play"
        ref={playRingRef}
        aria-label="Ouvrir le comic"
        onClick={() => stateRef.current.openDetail?.()}
      >
        <span className="tri" />
      </button>

      <div className="caption" aria-live="polite">
        <div className="mask" ref={maskTitleRef}><span className="cap-title" /></div>
        <div className="mask" ref={maskSubRef}><span className="cap-sub" /></div>
        <div className="mask" ref={maskYearRef}><span className="cap-year" /></div>
      </div>

      <button
        className="arrow prev"
        aria-label="Comic précédent"
        onClick={() => { stateRef.current.T = Math.round(stateRef.current.T) - 1; }}
      >
        <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M5 1 L1 5 L5 9" /><path d="M1 5 H17" />
        </svg>
      </button>
      <button
        className="arrow next"
        aria-label="Comic suivant"
        onClick={() => { stateRef.current.T = Math.round(stateRef.current.T) + 1; }}
      >
        <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M13 1 L17 5 L13 9" /><path d="M17 5 H1" />
        </svg>
      </button>

      <footer className="footer">
        <span className="lbl">© Comic Vault. Titres et héros fictifs.</span>
        <span className="lbl"><a href="#">FB</a> / <a href="#">TW</a></span>
      </footer>

      <div className="grain" ref={grainRef} />

      <div className="cursor" ref={cursorRef}>
        <div className="ring" />
        <div className="dot" />
        <div className="clabel">Ouvrir</div>
      </div>

      <div className="detail" ref={detailRef} role="dialog" aria-modal="true" aria-label="Détail du comic">
        <button
          className="box lbl close"
          onClick={() => stateRef.current.closeDetail?.()}
        >
          Fermer
        </button>
        <div className="dlogo">
          <a className="logo" href="#">
            <span className="cn">COMIC VAULT</span>
            <span className="en">BIBLIOTHÈQUE DE COMICS</span>
          </a>
        </div>
        <div className="dgrid">
          <div className="dleft" ref={dleftRef}>
            <div className="dline"><span className="dsub" ref={dSubRef} /></div>
            <div className="dline"><span className="dtitle" ref={dTitleRef} /></div>
            <div className="dline"><span className="dmeta" ref={dMetaRef} /></div>
            <div className="dline"><span className="dsyn" ref={dSynRef} /></div>
            <div className="dline"><span className="dcredit">Scénario et dessin : l'équipe Comic Vault.</span></div>
            <div className="dline">
              <button
                className="watch"
                ref={watchRef}
                onClick={() => {
                  const film = FILMS[stateRef.current.active];
                  if (film.file) onRead?.(film);
                }}
              />
            </div>
          </div>
          <div className="dright">
            <svg viewBox="0 0 600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              <defs>
                <filter id="inkFilter" x="-40%" y="-40%" width="180%" height="180%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="3" seed="7" result="t" />
                  <feDisplacementMap in="SourceGraphic" in2="t" scale="120" xChannelSelector="R" yChannelSelector="G" />
                </filter>
                <mask id="inkMask" maskUnits="userSpaceOnUse" x="-200" y="-200" width="1000" height="1300">
                  <g filter="url(#inkFilter)" fill="#fff">
                    <circle cx="150" cy="330" r="0" data-delay="0"   ref={el => { blobRefs.current[0] = el; }} />
                    <circle cx="440" cy="600" r="0" data-delay="120" ref={el => { blobRefs.current[1] = el; }} />
                    <circle cx="300" cy="120" r="0" data-delay="220" ref={el => { blobRefs.current[2] = el; }} />
                    <circle cx="90"  cy="760" r="0" data-delay="300" ref={el => { blobRefs.current[3] = el; }} />
                    <circle cx="500" cy="250" r="0" data-delay="360" ref={el => { blobRefs.current[4] = el; }} />
                    <circle cx="320" cy="860" r="0" data-delay="420" ref={el => { blobRefs.current[5] = el; }} />
                    <circle cx="300" cy="470" r="0" data-delay="180" ref={el => { blobRefs.current[6] = el; }} />
                  </g>
                </mask>
                <clipPath id="posterClip"><rect x="0" y="0" width="600" height="900" /></clipPath>
              </defs>
              <g clipPath="url(#posterClip)" mask="url(#inkMask)">
                <rect width="600" height="900" fill="#222" />
                <image ref={posterImgRef} preserveAspectRatio="xMidYMid slice" x="0" y="0" width="600" height="900" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}