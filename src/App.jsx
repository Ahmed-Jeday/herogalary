import { useCallback, useEffect, useRef, useState } from 'react';
import Scene from './components/Scene';
import Nav from './components/Nav';
import Logo from './components/Logo';
import Footer from './components/Footer';
import Palette from './components/Palette';
import Toast from './components/Toast';
import MovieDetail from './components/MovieDetail';
import { PAL } from './data/movies';
import { blip, setSfxEnabled } from './audio/sfx';
import { useCatalog } from './store/useCatalog';
import ComicVault from './components/ComicVault';
import ChatRooms from './components/ChatRooms';
import VanguardHero from './components/vanguard-hero';

const SECTIONS = ['Vanguard', 'Films', 'Comics', 'Chat'];

export default function App() {
  const engineRef = useRef(null);

  const [overlayIdx, setOverlayIdx] = useState(null);
  const [toastText, setToastText] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [sfxOn, setSfxOn] = useState(false);
  const [paletteName, setPaletteName] = useState('GREEN');
  const [activeSection, setActiveSection] = useState(1);

  // refs miroirs (évite les setState avec effets de bord)
  const sfxOnRef = useRef(false);
  const gridOnRef = useRef(false);
  const toastTimer = useRef(0);

  // catalogue (ratings, commentaires, panier…)
  const catalog = useCatalog();

  /* ----------------------------- toast ----------------------------- */
  const toast = useCallback((msg) => {
    setToastText(msg);
    setToastVisible(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastVisible(false), 1800);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  /* -------------------------- overlay ------------------------------ */
  const handleOpenExperiment = useCallback((idx) => {
    setOverlayIdx(idx);
    blip(440);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setOverlayIdx(null);
    engineRef.current?.setOverlayOpen(false);
  }, []);

  /* ------------------------- nav actions --------------------------- */
  const handleLab = useCallback(() => toast('LAB.EXP — 10 EXPERIMENTS'), [toast]);
  const handleAbout = useCallback(() => toast('VEKTOR LAB · CREATIVE CODE STUDIO'), [toast]);
  const handleTalk = useCallback(() => toast('HELLO@VEKTOR.LAB'), [toast]);
  const handleHub = useCallback(() => toast('EXPERIMENTS HUB'), [toast]);

  const toggleGrid = useCallback(() => {
    const next = !gridOnRef.current;
    gridOnRef.current = next;
    engineRef.current?.setGridTarget(next ? 1 : 0);
    blip(660);
  }, []);

  /* ---------------------------- sfx -------------------------------- */
  const toggleSfx = useCallback(() => {
    const next = !sfxOnRef.current;
    sfxOnRef.current = next;
    setSfxOn(next);
    setSfxEnabled(next);
    blip(660);
  }, []);

  /* -------------------------- palette ------------------------------ */
  const handlePalette = useCallback((name) => {
    setPaletteName(name);
    engineRef.current?.setPaletteBase(PAL[name]);
  }, []);

  /* --------------------------- render ------------------------------ */
  return (
    <>
      {activeSection === 0 && <VanguardHero />}

      <main
        className={`movie-catalog${activeSection !== 1 ? ' movie-catalog--hidden' : ''}`}
        aria-hidden={activeSection !== 1}
        inert={activeSection !== 1}
      >
        <Scene engineRef={engineRef} onOpenExperiment={handleOpenExperiment} />

        <Nav onGrid={toggleGrid} />

        <Logo />

        <Footer sfxOn={sfxOn} onToggleSfx={toggleSfx} onHub={handleHub} cartCount={catalog.cart.length} onCart={() => toast(`PANIER · ${catalog.cart.length} FILM${catalog.cart.length > 1 ? 'S' : ''}`)} />

        <Palette active={paletteName} onChange={handlePalette} />

        <Toast text={toastText} visible={toastVisible} />

        <MovieDetail
          index={overlayIdx}
          onClose={handleCloseOverlay}
          catalog={catalog}
          onToast={toast}
        />
      </main>

      {activeSection === 2 && <ComicVault />}
      {activeSection === 3 && (
        <div className="chat-section">
          <ChatRooms />
        </div>
      )}

      <nav className="section-navigation" aria-label="Navigation entre les sections">
        <button
          type="button"
          aria-label={activeSection > 0 ? `Section précédente : ${SECTIONS[activeSection - 1]}` : 'Première section'}
          disabled={activeSection === 0}
          onClick={() => setActiveSection(section => Math.max(0, section - 1))}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M15 10H5m5 5-5-5 5-5" />
          </svg>
        </button>
        <span aria-live="polite">
          {String(activeSection + 1).padStart(2, '0')} / {String(SECTIONS.length).padStart(2, '0')} · {SECTIONS[activeSection]}
        </span>
        <button
          type="button"
          aria-label={activeSection < SECTIONS.length - 1 ? `Section suivante : ${SECTIONS[activeSection + 1]}` : 'Dernière section'}
          disabled={activeSection === SECTIONS.length - 1}
          onClick={() => setActiveSection(section => Math.min(SECTIONS.length - 1, section + 1))}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 10h10m-5-5 5 5-5 5" />
          </svg>
        </button>
      </nav>
    </>
  );
}