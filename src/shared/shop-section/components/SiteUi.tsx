import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CATS, ITEMS, productImage, type Category } from "./data";

export interface ShopItem {
  id: number;
  name: string;
  category: Category;
}

interface SiteUiValue {
  addToCart: (id: number) => void;
  openQuick: (id: number) => void;
  openStore: () => void;
  backToShelf: () => void;
  openCart: () => void;
  cartCount: number;
}

interface SiteUiProviderProps {
  children: ReactNode;
  onAddToCart?: (item: ShopItem) => void;
  onOpenStore?: () => void;
  onBackToShelf?: () => void;
  onOpenCart?: () => void;
  cartCount?: number;
}

const SiteUiContext = createContext<SiteUiValue | null>(null);

export function useSiteUi() {
  const context = useContext(SiteUiContext);
  if (!context) throw new Error("useSiteUi must be used inside SiteUiProvider");
  return context;
}

export function SiteUiProvider({
  children,
  onAddToCart,
  onOpenStore,
  onBackToShelf,
  onOpenCart,
  cartCount = 0,
}: SiteUiProviderProps) {
  const [quickId, setQuickId] = useState<number | null>(null);
  const quickRef = useRef<HTMLDialogElement>(null);

  const addToCart = useCallback(
    (id: number) => {
      const item = ITEMS[id];
      if (!item) return;
      onAddToCart?.({ id, name: item.name, category: item.category });
      setQuickId(null);
    },
    [onAddToCart],
  );

  const openQuick = useCallback((id: number) => setQuickId(id), []);
  const closeQuick = useCallback(() => setQuickId(null), []);
  const openStore = useCallback(() => onOpenStore?.(), [onOpenStore]);
  const backToShelf = useCallback(() => onBackToShelf?.(), [onBackToShelf]);
  const openCart = useCallback(() => onOpenCart?.(), [onOpenCart]);

  useEffect(() => {
    const dialog = quickRef.current;
    if (!dialog) return;
    if (quickId !== null && !dialog.open) dialog.showModal();
    if (quickId === null && dialog.open) dialog.close();
  }, [quickId]);

  return (
    <SiteUiContext.Provider
      value={{ addToCart, openQuick, openStore, backToShelf, openCart, cartCount }}
    >
      {children}

      <dialog
        id="quick"
        aria-label="Figure details"
        ref={quickRef}
        onClose={() => setQuickId(null)}
      >
        {quickId !== null && (
          <>
            <img id="qImg" src={productImage(quickId)} alt={ITEMS[quickId].name} />
            <h3 id="qName">{ITEMS[quickId].name}</h3>
            <p id="qCat">{CATS[ITEMS[quickId].category]}</p>
            <div className="qbtn">
              <button className="btn primary" type="button" onClick={() => addToCart(quickId)}>
                <span>Add to cart</span>
              </button>
              <button className="btn line" type="button" onClick={closeQuick}>
                Close
              </button>
            </div>
          </>
        )}
      </dialog>
    </SiteUiContext.Provider>
  );
}
