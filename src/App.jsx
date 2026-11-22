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
import vanguardhero from './components/vanguard-hero';

export default function App() {
  
  const engineRef = useRef(null);

  const [overlayIdx, setOverlayIdx] = useState(null);
  const [toastText, setToastText] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [sfxOn, setSfxOn] = useState(false);
  const [paletteName, setPaletteName] = useState('GREEN');
  const [comicVaultVisible, setComicVaultVisible] = useState(false);

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
     
      <main
        className={`movie-catalog${comicVaultVisible ? ' movie-catalog--hidden' : ''}`}
        aria-hidden={comicVaultVisible}
        inert={comicVaultVisible}
      >
        <Scene engineRef={engineRef} onOpenExperiment={handleOpenExperiment} />

        <Nav onGrid={toggleGrid} />
         <vanguardhero />

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

      <button
        className={`section-switch ${comicVaultVisible ? 'section-switch--up' : 'section-switch--down'}`}
        type="button"
        aria-label={comicVaultVisible ? 'Revenir au catalogue de films' : 'Aller à Comic Vault'}
        onClick={() => setComicVaultVisible(visible => !visible)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d={comicVaultVisible ? 'M10 15V5M5 10l5-5 5 5' : 'M10 5v10m-5-5 5 5 5-5'} />
        </svg>
      </button>

      {comicVaultVisible && <ComicVault />}
    </>
  );
}