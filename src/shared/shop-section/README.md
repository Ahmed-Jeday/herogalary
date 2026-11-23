# Shop Section

Package reutilisable Next.js contenant la section Shelf, le catalogue Store et la fenetre quick-view partagee.

## Contenu

- `components/Shelf.tsx`
- `components/StoreGrid.tsx`
- `components/SiteUi.tsx`
- `components/data.ts`
- `components/hooks.ts`
- `components/navigation.ts`
- `styles/twilight-shop.css`
- `public/sites/twilightcomix/img/`
- `example/store-page.tsx`
- `index.ts`

## Prerequis

- Next.js App Router
- React 19
- Next `Link`
- Import des polices variables nommees `--font-bangers` et `--font-barlow`

## Installation dans un autre projet

1. Copiez le dossier `shop-section` dans `src/shared/`.
2. Copiez `public/sites/twilightcomix/img/` vers `public/sites/twilightcomix/img/`.
3. Importez le CSS dans le layout global Next.js:

```tsx
import "@/shared/shop-section/styles/twilight-shop.css";
```

4. Copiez ou adaptez `example/store-page.tsx` vers `src/app/store/page.tsx`.
5. Ajoutez `Shelf` dans une page enveloppee par `SiteUiProvider`:

```tsx
import { Shelf, SiteUiProvider } from "@/shared/shop-section";

export default function Page() {
  return (
    <SiteUiProvider>
      <main>
        <Shelf />
      </main>
    </SiteUiProvider>
  );
}
```
