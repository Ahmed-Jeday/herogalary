import * as THREE from 'three';
import { IMGS, proxy, N } from '../data/movies';
import { blip } from '../audio/sfx';
import {
  BG_VERT, BG_FRAG,
  CARD_VERT, CARD_FRAG,
  GLASS_VERT, GLASS_FRAG
} from './shaders';

/* ---------------------------------------------------------------- helpers */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

const PITCH_U = 0.1786;
const CARD_W_U = 0.174;
const CARDS_TOTAL = N * 3;
const SPAN = CARDS_TOTAL * PITCH_U;

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const randomBlock = (n) => {
  let s = '';
  for (let i = 0; i < n; i++) s += CHARS[(Math.random() * CHARS.length) | 0];
  return s;
};
const randomCode = () =>
  randomBlock(2 + ((Math.random() * 2) | 0)) + ' ' + randomBlock(3 + ((Math.random() * 2) | 0));

function pointInQuad(px, py, a, b, c, d) {
  let sign = 0;
  const pts = [a, b, c, d];
  for (let i = 0; i < 4; i++) {
    const p1 = pts[i], p2 = pts[(i + 1) % 4];
    const cross = (p2[0] - p1[0]) * (py - p1[1]) - (p2[1] - p1[1]) * (px - p1[0]);
    if (Math.abs(cross) < 1e-9) continue;
    const s = cross > 0 ? 1 : -1;
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

/* ================================================================= engine */
export function createLabEngine(opts) {
  const {
    canvas, labelsEl, titleEl, tickEl, ruleEl, crossEl, crossVid,
    onOpenExperiment
  } = opts;

  /* ---------------- mutable state ---------------- */
  let VW = window.innerWidth;
  let VH = window.innerHeight;
  let PR = Math.min(window.devicePixelRatio || 1, 2);
  let MOBILE = window.matchMedia('(max-width:760px)').matches;

  let pos = 0;
  let target = 0;
  let gridTarget = 0;
  let overlayOpen = false;

  let rafId = 0;
  let lastT = 0;
  let frameCount = 0;
  let centreIdx = 0;
  let lastCentreIdx = -1;
  let disposed = false;
  let bootT = 0;

  let baseTarget = [0.059, 0.055, 0.078];

  let dragging = false, dragStartX = 0, dragStartTarget = 0, dragMoved = 0;

  const disposers = [];
  const listen = (el, ev, fn, opt) => {
    el.addEventListener(ev, fn, opt);
    disposers.push(() => el.removeEventListener(ev, fn, opt));
  };

  /* ---------------- renderer / scene ---------------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(PR);
  renderer.setSize(VW, VH, false);
  renderer.setClearColor(0x0f0e14, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, VW, 0, VH, -1000, 1000);

  const uRes = { value: new THREE.Vector2(VW, VH) };
  const uGrid = { value: 0 };
  const uMobile = { value: MOBILE ? 1 : 0 };

  /* ---------------- background ---------------- */
  const bgUni = {
    uBase: { value: new THREE.Color(0.059, 0.055, 0.078) },
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(VW, VH) }
  };
  const bgMat = new THREE.ShaderMaterial({
    uniforms: bgUni,
    vertexShader: BG_VERT,
    fragmentShader: BG_FRAG,
    depthTest: false,
    depthWrite: false
  });
  const bgGeo = new THREE.PlaneGeometry(1, 1);
  const bgMesh = new THREE.Mesh(bgGeo, bgMat);
  bgMesh.renderOrder = -10;
  bgMesh.position.set(VW / 2, VH / 2, -1);
  bgMesh.scale.set(VW, VH, 1);
  scene.add(bgMesh);

  /* ---------------- textures ---------------- */
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');

  const textures = IMGS.map((d) => {
    const tex = loader.load(proxy(d.id, 800));
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.userData = { loaded: false };
    return tex;
  });

  const polls = [];
  textures.forEach((t) => {
    const check = () => { t.userData.loaded = true; };
    if (t.image && t.image.complete && t.image.naturalWidth) check();
    else if (t.image) t.image.addEventListener('load', check);

    const poll = setInterval(() => {
      if (t.image && t.image.complete && t.image.naturalWidth) {
        check();
        clearInterval(poll);
      }
    }, 120);
    polls.push(poll);
  });

  /* ---------------- cards ---------------- */
  const cardGeo = new THREE.PlaneGeometry(1, 1, 48, 1);
  const cards = [];

  for (let i = 0; i < CARDS_TOTAL; i++) {
    const texIdx = i % N;
    const copy = Math.floor(i / N);

    const u = {
      uRes,
      uGrid,
      uMobile,
      uX: { value: 0 },
      uS: { value: 1 },
      uGR: { value: new THREE.Vector4(0, 0, 1, 1) },
      uTex: { value: textures[texIdx] },
      uLoaded: { value: 0 },
      uRev: { value: 0 },
      uSeed: { value: Math.random() * 97 + 3 },
      uHover: { value: 0 }
    };

    const mat = new THREE.ShaderMaterial({
      uniforms: u,
      vertexShader: CARD_VERT,
      fragmentShader: CARD_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(cardGeo, mat);
    mesh.position.z = 0;
    mesh.renderOrder = i;
    scene.add(mesh);

    const el = document.createElement('div');
    el.className = 'lbl';
    el.textContent = IMGS[texIdx].label;
    labelsEl.appendChild(el);

    cards.push({
      i, tex: texIdx, copy, mesh, u, el,
      x: 0, s: 1, rev: 0, revStart: 0, revDur: 0.9,
      wasIn: false, hovered: false,
      gr: { x: 0, y: 0, w: 1, h: 1 }
    });
  }

  /* ---------------- grid layout ---------------- */
  function layoutGrid() {
    let cw = 0.13 * VW;
    let ch = cw / 0.68;
    let gx = cw * 0.09;
    let gy = ch * 0.09;
    let tw = 5 * cw + 4 * gx;
    let th = 2 * ch + gy;

    const fit = Math.min(1, (VW * 0.92) / tw, (VH * 0.8) / th);
    cw *= fit; ch *= fit; gx *= fit; gy *= fit;
    tw = 5 * cw + 4 * gx;
    th = 2 * ch + gy;

    const x0 = (VW - tw) / 2;
    const y0 = (VH - th) / 2;

    cards.forEach((m) => {
      const col = m.tex % 5;
      const row = Math.floor(m.tex / 5);
      m.gr.x = x0 + col * (cw + gx);
      m.gr.y = y0 + row * (ch + gy);
      m.gr.w = cw;
      m.gr.h = ch;
      m.u.uGR.value.set(m.gr.x, m.gr.y, m.gr.w, m.gr.h);
    });
  }

  /* ---------------- glass pass ---------------- */
  const rt = new THREE.WebGLRenderTarget(VW * PR, VH * PR, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    depthBuffer: false,
    stencilBuffer: false
  });

  const glassScene = new THREE.Scene();
  const glassCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const glassUni = {
    uScene: { value: rt.texture },
    uRes: { value: new THREE.Vector2(VW * PR, VH * PR) },
    uTime: { value: 0 }
  };

  const glassMat = new THREE.ShaderMaterial({
    uniforms: glassUni,
    vertexShader: GLASS_VERT,
    fragmentShader: GLASS_FRAG,
    depthTest: false,
    depthWrite: false
  });

  const glassQuadGeo = new THREE.PlaneGeometry(2, 2);
  const glassQuad = new THREE.Mesh(glassQuadGeo, glassMat);
  glassScene.add(glassQuad);

  /* ---------------- CPU mirror of vertex maths ---------------- */
  const _a = [0, 0], _b = [0, 0], _c = [0, 0], _d = [0, 0];

  function cardPt(m, u, v, out) {
    const cw = CARD_W_U * VW;
    const xPx = (0.5 + m.x) * VW + (u - 0.5) * cw * m.s;
    const dxn = xPx / VW - 0.5;

    const mm = MOBILE ? 1.6 : 1.0;
    const topBase = MOBILE ? 0.26 : 0.217;
    const botBase = MOBILE ? 0.60 : 0.659;

    const sTop = smoothstep(0.30 * mm, 0.45 * mm, Math.abs(dxn));
    const sBot = smoothstep(0.12 * mm, 0.39 * mm, Math.abs(m.x));

    const topY = VH * (topBase - 0.03 * sTop);
    const botY = VH * (botBase - 0.135 * sBot);

    const cy = (topY + botY) * 0.5;
    const hgt = (botY - topY) * m.s;
    const yPx = cy - (v - 0.5) * hgt;

    const gxp = m.gr.x + u * m.gr.w;
    const gyp = m.gr.y + (1 - v) * m.gr.h;

    out[0] = xPx + (gxp - xPx) * uGrid.value;
    out[1] = yPx + (gyp - yPx) * uGrid.value;
    return out;
  }

  function pick(mx, my) {
    for (let i = 0; i < cards.length; i++) {
      const m = cards[i];
      if (Math.abs(m.x) > 1.0) continue;
      cardPt(m, 0, 1, _a);
      cardPt(m, 1, 1, _b);
      cardPt(m, 1, 0, _c);
      cardPt(m, 0, 0, _d);
      if (pointInQuad(mx, my, _a, _b, _c, _d)) return m;
    }
    return null;
  }

  /* ---------------- public: overlay / cross / palette ---------------- */
  function openExperiment(idx) {
    overlayOpen = true;
    onOpenExperiment(idx);
  }

  function setOverlayOpen(v) {
    overlayOpen = v;
    if (v) cards.forEach((m) => { m.hovered = false; });
  }

  function setGridTarget(v) { gridTarget = v; }
  function setPaletteBase(rgb) { baseTarget = rgb.slice(); }

  /* ---------------- input ---------------- */
  const onPointerDown = (e) => {
    dragging = true;
    dragStartX = e.clientX;
    dragStartTarget = target;
    dragMoved = 0;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
  };

  const onPointerMoveDrag = (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStartX;
    dragMoved = Math.max(dragMoved, Math.abs(dx));
    target = dragStartTarget - (dx / VW) * 1.1;
  };

  const onPointerUp = (e) => {
    if (!dragging) return;
    dragging = false;
    if (dragMoved < 6) {
      const hit = pick(e.clientX, e.clientY);
      if (hit) openExperiment(hit.tex);
    }
  };

  const onPointerMoveHover = (e) => {
    if (dragging || overlayOpen) return;
    const hit = pick(e.clientX, e.clientY);
    cards.forEach((m) => { m.hovered = m === hit; });
    canvas.style.cursor = hit ? 'pointer' : 'default';
  };

  const onWheel = (e) => {
    e.preventDefault();
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    target += d * 0.00042 * (MOBILE ? 2 : 1);
  };

  const onKeyDown = (e) => {
    if (overlayOpen) return;
    if (e.key === 'ArrowRight') target = (Math.round(target / PITCH_U) + 1) * PITCH_U;
    if (e.key === 'ArrowLeft') target = (Math.round(target / PITCH_U) - 1) * PITCH_U;
  };

  const onCrossClick = (e) => {
    e.stopPropagation();
    const n = 3 + Math.floor(Math.random() * 4);
    target = (Math.round(target / PITCH_U) + n) * PITCH_U;
    blip(220);
  };

  listen(canvas, 'pointerdown', onPointerDown);
  listen(canvas, 'pointermove', onPointerMoveDrag);
  listen(canvas, 'pointerup', onPointerUp);
  listen(canvas, 'pointercancel', () => { dragging = false; });
  listen(window, 'pointermove', onPointerMoveHover);
  listen(window, 'wheel', onWheel, { passive: false });
  listen(window, 'keydown', onKeyDown);
  listen(crossEl, 'click', onCrossClick);

  /* ---------------- resize ---------------- */
  function resize() {
    VW = window.innerWidth;
    VH = window.innerHeight;
    PR = Math.min(window.devicePixelRatio || 1, 2);
    MOBILE = window.matchMedia('(max-width:760px)').matches;

    renderer.setPixelRatio(PR);
    renderer.setSize(VW, VH, false);

    camera.left = 0; camera.right = VW;
    camera.top = 0; camera.bottom = VH;
    camera.updateProjectionMatrix();

    uRes.value.set(VW, VH);
    uMobile.value = MOBILE ? 1 : 0;

    bgUni.uRes.value.set(VW, VH);
    bgMesh.position.set(VW / 2, VH / 2, -1);
    bgMesh.scale.set(VW, VH, 1);

    rt.setSize(VW * PR, VH * PR);
    glassUni.uRes.value.set(VW * PR, VH * PR);

    layoutGrid();
  }
  listen(window, 'resize', resize);

  /* ---------------- animation loop ---------------- */
  function animate(now) {
    if (disposed) return;
    rafId = requestAnimationFrame(animate);

    const t = now / 1000;
    const dt = Math.min((now - lastT) / 1000 || 0.016, 0.05);
    lastT = now;
    frameCount++;

    /* easing */
    const k = 1 - Math.pow(1 - 0.12, dt * 30);
    pos += (target - pos) * k;

    /* background palette lerp */
    const bc = bgUni.uBase.value;
    bc.r += (baseTarget[0] - bc.r) * 0.05;
    bc.g += (baseTarget[1] - bc.g) * 0.05;
    bc.b += (baseTarget[2] - bc.b) * 0.05;
    bgUni.uTime.value = t;

    /* grid morph */
    uGrid.value += (gridTarget - uGrid.value) * (1 - Math.pow(0.88, dt * 60));
    const gp = uGrid.value;

    titleEl.style.opacity = String(clamp(1 - gp * 1.6, 0, 1));
    ruleEl.style.opacity = String(clamp(1 - gp * 1.6, 0, 1));
    crossEl.style.opacity = String(clamp(1 - gp * 1.6, 0, 1));

    /* cards */
    centreIdx = 0;
    let centreDist = Infinity;

    for (let i = 0; i < cards.length; i++) {
      const m = cards[i];

      let x = m.i * PITCH_U - pos;
      x = x - Math.floor((x + SPAN * 0.5) / SPAN) * SPAN;
      m.x = x;
      m.u.uX.value = x;

      m.mesh.visible = !(gp > 0.5 && m.copy > 0);

      const inRange = Math.abs(x) < 0.62;
      if (inRange && !m.wasIn) {
        m.wasIn = true;
        m.revStart = t + Math.random() * 0.12;
        m.revDur = 0.75;
      } else if (!inRange) {
        m.wasIn = false;
      }
      m.rev = clamp((t - m.revStart) / m.revDur, 0, 1);
      m.u.uRev.value = m.rev;

      const hs = m.hovered ? 1.015 : 1.0;
      m.s += (hs - m.s) * 0.15;
      m.u.uS.value = m.s;
      m.u.uHover.value += ((m.hovered ? 1 : 0) - m.u.uHover.value) * 0.15;

      m.u.uLoaded.value = textures[m.tex].userData.loaded ? 1 : 0;

      const d = Math.abs(x);
      if (d < centreDist) { centreDist = d; centreIdx = i; }

      /* labels */
      const el = m.el;
      if (gp > 0.25 || Math.abs(x) > 0.62 || m.rev < 0.55) {
        if (el.style.opacity !== '0') el.style.opacity = '0';
      } else {
        cardPt(m, 0, 1, _a);
        cardPt(m, 0.03, 1, _b);
        cardPt(m, 0.15, 1, _c);

        const ang = (Math.atan2(_c[1] - _b[1], _c[0] - _b[0]) * 180) / Math.PI;

        el.style.left = `${_a[0] + 2}px`;
        el.style.top = `${_a[1] - VH * 0.006}px`;
        el.style.transform = `translateY(-100%) rotate(${ang.toFixed(2)}deg)`;
        el.style.opacity = String(
          clamp((m.rev - 0.55) / 0.35, 0, 1) * clamp(1 - gp * 4, 0, 1)
        );
      }
    }

    /* centre card change */
    const texIdx = cards[centreIdx] ? cards[centreIdx].tex : 0;
    if (texIdx !== lastCentreIdx) {
      lastCentreIdx = texIdx;
      tickEl.style.left = `${(texIdx / Math.max(1, N - 1)) * 100}%`;
      if (t > 1.2) blip(1400);
    }

    /* title scramble */
    const moving = Math.abs(target - pos) > 0.004;
    if (moving) {
      if (frameCount % 3 === 0) titleEl.textContent = randomCode();
    } else {
      const lbl = IMGS[texIdx].label;
      if (titleEl.textContent !== lbl) titleEl.textContent = lbl;
    }

    /* cross video speed */
    const speed = Math.abs(target - pos);
    if (crossVid) {
      try { crossVid.playbackRate = clamp(1 + speed * 26, 1, 4); } catch (e) { /* noop */ }
    }

    /* render */
    glassUni.uTime.value = t;

    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(glassScene, glassCam);
  }

  /* ---------------- boot / dispose ---------------- */
  function start() {
    resize();

    bootT = performance.now() / 1000;

    cards.forEach((m) => {
      let x = m.i * PITCH_U;
      x = x - Math.floor((x + SPAN * 0.5) / SPAN) * SPAN;
      m.revStart = bootT + 0.2 + Math.abs(x) * 0.8;
      m.revDur = 0.9;
      m.wasIn = Math.abs(x) < 0.62;
    });

    titleEl.textContent = IMGS[0].label;
    tickEl.style.left = '0%';

    if (crossVid) {
      try { crossVid.play().catch(() => {}); } catch (e) { /* noop */ }
    }

    requestAnimationFrame((now) => {
      if (disposed) return;
      lastT = now;
      rafId = requestAnimationFrame(animate);
    });
  }

  function dispose() {
    disposed = true;
    cancelAnimationFrame(rafId);
    polls.forEach(clearInterval);
    disposers.forEach((fn) => fn());

    cards.forEach((m) => m.mesh.material.dispose());
    cardGeo.dispose();
    textures.forEach((t) => t.dispose());
    bgGeo.dispose();
    bgMat.dispose();
    rt.dispose();
    glassQuadGeo.dispose();
    glassMat.dispose();
    renderer.dispose();

    if (labelsEl) labelsEl.innerHTML = '';
  }

  return {
    start,
    dispose,
    setGridTarget,
    setPaletteBase,
    setOverlayOpen
  };
}