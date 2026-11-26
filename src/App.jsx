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
import Dashboard from './dashboard/App';
import ComicReadingPage from './pages/ComicReadingPage';
import ShopSection from './components/ShopSection';


const SECTIONS = ['Vanguard', 'Films', 'Comics', 'Shop', 'Chat', 'Dashboard'];

export default function App() {
  const engineRef = useRef(null);

  const [overlayIdx, setOverlayIdx] = useState(null);
  const [toastText, setToastText] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [sfxOn, setSfxOn] = useState(false);
  const [paletteName, setPaletteName] = useState('GREEN');
  const [activeSection, setActiveSection] = useState(1);
  const [readingComic, setReadingComic] = useState(null);

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

  /* --------------------------- shop -------------------------------- */
  const handleShopAddToCart = useCallback((item) => {
    catalog.addShopToCart(item.id);
    const count = catalog.shopCount + 1;
    toast(`PANIER · ${count} ARTICLE${count > 1 ? 'S' : ''}`);
  }, [catalog, toast]);

  const handleShopCheckout = useCallback(() => {
    catalog.clearShopCart();
    toast('COMMANDE CONFIRMÉE · MERCI !');
  }, [catalog, toast]);

  const cartCount = catalog.cart.length + catalog.shopCount;

  if (readingComic) {
    return <ComicReadingPage comic={readingComic} onBack={() => setReadingComic(null)} />;
  }

  /* --------------------------- render ------------------------------ */
  return (
    <>
      {activeSection === 0 && <VanguardHero onNavigateSection={setActiveSection} />}

      <main
        className={`movie-catalog${activeSection !== 1 ? ' movie-catalog--hidden' : ''}`}
        aria-hidden={activeSection !== 1}
        inert={activeSection !== 1}
      >
        <Scene engineRef={engineRef} onOpenExperiment={handleOpenExperiment} />

<Nav
  active={activeSection}
  onNavigate={(section) => {
    if (section === 1) {
      toggleGrid();           // Films = toggle liste/grille
      return;
    }
    setActiveSection(section);
  }}
/>
        <Logo />

        <Footer sfxOn={sfxOn} onToggleSfx={toggleSfx} onHub={handleHub} cartCount={cartCount} onCart={() => toast(`PANIER · ${cartCount} ARTICLE${cartCount > 1 ? 'S' : ''}`)} />

        <Palette active={paletteName} onChange={handlePalette} />

        <MovieDetail
          index={overlayIdx}
          onClose={handleCloseOverlay}
          catalog={catalog}
          onToast={toast}
        />
      </main>

      {activeSection === 2 && (
        <ComicVault
          onRead={setReadingComic}
          onExit={() => setActiveSection(1)}
          onNavigateSection={setActiveSection}
        />
      )}
      {activeSection === 3 && (
        <ShopSection
          shopCart={catalog.shopCart}
          shopCount={catalog.shopCount}
          onAddToCart={handleShopAddToCart}
          onRemoveFromCart={catalog.removeShopFromCart}
          onSetQty={catalog.setShopQty}
          onClearCart={catalog.clearShopCart}
          onCheckout={handleShopCheckout}
          onNavigateSection={setActiveSection}
        />
      )}
      {activeSection === 4 && (
        <div className="chat-section">
          <ChatRooms />
        </div>
      )}
      {activeSection === 5 && <Dashboard onExit={() => setActiveSection(1)} />}

      <Toast text={toastText} visible={toastVisible} />

      {activeSection !== 5 && <nav className="section-navigation" aria-label="Navigation entre les sections">
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
      </nav>}
    </>
  );
}
