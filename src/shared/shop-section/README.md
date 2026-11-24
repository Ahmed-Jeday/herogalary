# Shop Section

Section boutique réutilisable (Shelf 3D + catalogue + quick-view) adaptée à
l'application **Vite + React** de HeroVerse.

## Contenu

- `components/Shelf.tsx` — étagère 3D, navigation par univers
- `components/StoreGrid.tsx` — catalogue filtrable
- `components/SiteUi.tsx` — provider + fenêtre quick-view
- `components/data.ts` — produits, univers, chemins d'images
- `components/hooks.ts` — hooks responsive / animation
- `components/navigation.ts` — scroll vers un univers du Shelf
- `styles/twilight-shop.css` — styles de la boutique
- `public/sites/twilightcomix/img/` — visuels des produits
- `example/store-page.tsx` — exemple d'usage

## Intégration dans l'application

1. Copier les images vers le dossier public de Vite :

```bash
cp -r src/shared/shop-section/public/sites public/
```

2. Envelopper le Shelf et/ou le StoreGrid dans `SiteUiProvider` :

```tsx
import { Shelf, SiteUiProvider, StoreGrid } from "@/shared/shop-section";

<SiteUiProvider
  onAddToCart={(item) => addToCart(item)}
  onOpenStore={() => setView("store")}
  onBackToShelf={() => setView("shelf")}
>
  {view === "shelf" ? <Shelf /> : <StoreGrid />}
</SiteUiProvider>
```

3. Le composant `src/components/ShopSection.jsx` fournit déjà ce branchement,
   avec le CSS injecté uniquement lorsque la section est montée (`?inline`).

## Notes

- Les imports `next/link` ont été remplacés par des boutons et des callbacks
  (`openStore`, `backToShelf`) pour fonctionner dans une SPA Vite.
- Les polices `Bangers` et `Barlow` sont chargées depuis `index.html`.
- Les images sont servies depuis `/sites/twilightcomix/img/...`.
