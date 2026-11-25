const PAGES = [
  { label: "Accueil", section: 0 },
  { label: "Films", section: 1 },
  { label: "Comics", section: 2 },
  { label: "Shop", section: 3 },
  { label: "Chat", section: 4 },
  { label: "Dashboard", section: 5 },
];

/**
 * Navigation commune aux pages autonomes (Comic Vault, Shop).
 * Le style est fourni par la page hôte via `page-nav--comic` / `page-nav--shop`.
 */
export default function PageNav({ active, onNavigate, variant = "shop" }) {
  return (
    <nav
      className={`page-nav page-nav--${variant}`}
      aria-label="Navigation entre les pages"
    >
      {PAGES.map(({ label, section }) => {
        const current = section === active;
        return (
          <button
            key={section}
            type="button"
            className={`page-nav-item${current ? " is-active" : ""}`}
            aria-current={current ? "page" : undefined}
            onClick={() => onNavigate?.(section)}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
