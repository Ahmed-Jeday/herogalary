"use client";

import {
  createContext,
  type FormEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CATS, ITEMS, productImage } from "./data";

interface SiteUiValue {
  openLead: (prefill?: string) => void;
  openQuick: (id: number) => void;
}

const SiteUiContext = createContext<SiteUiValue | null>(null);

export function useSiteUi() {
  const context = useContext(SiteUiContext);
  if (!context) throw new Error("useSiteUi must be used inside SiteUiProvider");
  return context;
}

export function SiteUiProvider({ children }: { children: ReactNode }) {
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadDone, setLeadDone] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [quickId, setQuickId] = useState<number | null>(null);
  const [pillOn, setPillOn] = useState(false);

  const quickRef = useRef<HTMLDialogElement>(null);
  const firstInput = useRef<HTMLInputElement>(null);

  const openLead = useCallback((prefill?: string) => {
    setMessage(prefill ?? "");
    setLeadDone(false);
    setError("");
    setLeadOpen(true);
  }, []);
  const closeLead = useCallback(() => setLeadOpen(false), []);
  const openQuick = useCallback((id: number) => setQuickId(id), []);
  const closeQuick = useCallback(() => setQuickId(null), []);

  useEffect(() => {
    document.body.classList.toggle("drawer-open", leadOpen);
    if (!leadOpen) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const timer = window.setTimeout(() => firstInput.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, [leadOpen]);

  useEffect(() => {
    if (!leadOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLead();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [leadOpen, closeLead]);

  useEffect(() => {
    const dialog = quickRef.current;
    if (!dialog) return;
    if (quickId !== null && !dialog.open) dialog.showModal();
    if (quickId === null && dialog.open) dialog.close();
  }, [quickId]);

  useEffect(() => {
    const update = () => setPillOn(window.scrollY > window.innerHeight * 0.8 && !leadOpen);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [leadOpen]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    if (!String(data.name || "").trim()) {
      setError("Add your name so we know who to call.");
      return;
    }
    const reach = String(data.contact || "").trim();
    if (!/@/.test(reach) && reach.replace(/\D/g, "").length < 10) {
      setError("Add an email or a 10 digit phone number.");
      return;
    }
    setError("");
    setLeadDone(true);
    form.reset();
    setMessage("");
  };

  const holdQuick = () => {
    if (quickId === null) return;
    const id = quickId;
    setQuickId(null);
    openLead(ITEMS[id].name);
  };

  return (
    <SiteUiContext.Provider value={{ openLead, openQuick }}>
      {children}

      <div className={`pill${pillOn ? " on" : ""}`}>
        <span>Never miss an issue.</span>
        <button className="btn primary" type="button" onClick={() => openLead()}>
          <span>GO TO MAIN PAGE</span>
        </button>
      </div>

      <div className="scrim" aria-hidden="true" onClick={closeLead} />
      <aside
        className={`drawer${leadOpen ? " open" : ""}`}
        id="lead"
        aria-hidden={!leadOpen}
        aria-label="Start a pull list"
      >
        <button className="x" type="button" onClick={closeLead}>
          Close
        </button>
        <div className="body" hidden={leadDone}>
          <h2>Start a pull list</h2>
          <form noValidate onSubmit={submit}>
            <label className="fld">
              <span>Name</span>
              <input name="name" autoComplete="name" ref={firstInput} />
            </label>
            <label className="fld">
              <span>Phone or email</span>
              <input name="contact" autoComplete="email" />
            </label>
            <label className="fld">
              <span>What should we hold for you?</span>
              <textarea name="message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
            <p className="err" role="alert">
              {error}
            </p>
            <button className="btn primary wide" type="submit">
              <span>Hold my books</span>
            </button>
          </form>
        </div>
        <div className="done" hidden={!leadDone}>
          <h2>You&apos;re on the list.</h2>
          <p>This is a demo, so nothing was sent.</p>
          <button className="btn line big" type="button" onClick={closeLead}>
            Keep browsing
          </button>
        </div>
      </aside>

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
              <button className="btn primary" type="button" onClick={holdQuick}>
                <span>Hold it for me</span>
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
