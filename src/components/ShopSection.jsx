import { useCallback, useEffect, useRef, useState } from 'react';
import { Shelf, ShopCart, SiteUiProvider, StoreGrid } from '../shared/shop-section';
import shopStyles from '../shared/shop-section/styles/twilight-shop.css?inline';

/**
 * Wraps the reusable shop package inside the single-page app.
 * The CSS is injected only while this section is mounted so the shop's
 * standalone styles never leak into the Films / Comics / Chat sections.
 */
export default function ShopSection({
  shopCart = [],
  shopCount = 0,
  onAddToCart,
  onRemoveFromCart,
  onSetQty,
  onClearCart,
  onCheckout,
}) {
  const [view, setView] = useState('shelf');
  const [cartOpen, setCartOpen] = useState(false);
  const scrollerRef = useRef(null);
  const shelfScroll = useRef(0);

  const openStore = useCallback(() => {
    shelfScroll.current = scrollerRef.current?.scrollTop ?? 0;
    setView('store');
  }, []);

  const backToShelf = useCallback(() => setView('shelf'), []);

  useEffect(() => {
    if (view !== 'shelf') return;
    const frame = requestAnimationFrame(() => {
      if (scrollerRef.current) scrollerRef.current.scrollTop = shelfScroll.current;
    });
    return () => cancelAnimationFrame(frame);
  }, [view]);

  // Prevent the shop from scrolling behind the cart drawer.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !cartOpen) return;
    const previous = scroller.style.overflowY;
    scroller.style.overflowY = 'hidden';
    return () => {
      scroller.style.overflowY = previous;
    };
  }, [cartOpen]);

  return (
    <>
      <style>{shopStyles}</style>
      <div className="shop-section" ref={scrollerRef}>
        <SiteUiProvider
          onAddToCart={onAddToCart}
          onOpenStore={openStore}
          onBackToShelf={backToShelf}
          onOpenCart={() => setCartOpen(true)}
          cartCount={shopCount}
        >
          {view === 'shelf' ? <Shelf /> : <StoreGrid />}
        </SiteUiProvider>

        <ShopCart
          open={cartOpen}
          lines={shopCart}
          onClose={() => setCartOpen(false)}
          onRemove={onRemoveFromCart}
          onQty={onSetQty}
          onClear={onClearCart}
          onCheckout={onCheckout}
        />
      </div>
    </>
  );
}
