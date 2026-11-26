export const PAGES = [
  { label: "Home",       id: "n-lab",     section: 0 },
  { label: "Films",      id: "n-list",    section: 1 },
  { label: "Comics",     id: "n-about",   section: 2 },
  { label: "Shop",       id: "n-shop",    section: 3 },
  { label: "Let's Talk", id: "n-talk",    section: 4 },
  { label: "Profile",    id: "n-profile", section: 5 },
];

export default function Nav({ onNavigate, active }) {
  const handleKey = (section) => (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onNavigate?.(section);
    }
  };

  return (
    <>
      {PAGES.map(({ label, id, section }) => {
        const current = section === active;
        return (
          <div
            key={id}
            id={id}
            role="button"
            tabIndex={0}
            className={`nav sm lnk${current ? " is-active" : ""}`}
            aria-current={current ? "page" : undefined}
            onClick={() => onNavigate?.(section)}
            onKeyDown={handleKey(section)}
          >
            {label}
          </div>
        );
      })}
    </>
  );
}