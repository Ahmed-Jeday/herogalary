import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  CATS,
  formatPrice,
  ITEMS,
  productPrice,
  productThumb,
} from "./data";

export interface ShopCartLine {
  id: number;
  qty: number;
}

interface ShopCartProps {
  open: boolean;
  lines: ShopCartLine[];
  onClose: () => void;
  onRemove: (id: number) => void;
  onQty: (id: number, qty: number) => void;
  onClear: () => void;
  onCheckout: () => void;
}

type Step = "cart" | "payment" | "done";

interface PaymentForm {
  name: string;
  email: string;
  card: string;
  exp: string;
  cvc: string;
}

const EMPTY_FORM: PaymentForm = {
  name: "",
  email: "",
  card: "",
  exp: "",
  cvc: "",
};

export function ShopCart({
  open,
  lines,
  onClose,
  onRemove,
  onQty,
  onClear,
  onCheckout,
}: ShopCartProps) {
  const [step, setStep] = useState<Step>("cart");
  const [form, setForm] = useState<PaymentForm>(EMPTY_FORM);
  const [error, setError] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);

  const validLines = lines.filter(
    (line) => Number.isInteger(line.id) && ITEMS[line.id] && line.qty > 0,
  );
  const total = validLines.reduce(
    (sum, line) => sum + productPrice(line.id) * line.qty,
    0,
  );
  const count = validLines.reduce((sum, line) => sum + line.qty, 0);

  useEffect(() => {
    if (!open) {
      setStep("cart");
      setForm(EMPTY_FORM);
      setError("");
      return;
    }
    const timer = window.setTimeout(() => closeRef.current?.focus(), 250);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const update = (key: keyof PaymentForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateCard = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    update("card", digits.replace(/(.{4})/g, "$1 ").trim());
  };

  const updateExp = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    update("exp", digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
  };

  const validate = () => {
    if (form.name.trim().length < 2) return "Indique ton nom complet.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Indique un email valide.";
    }
    if (form.card.replace(/\D/g, "").length !== 16) {
      return "Le numéro de carte doit contenir 16 chiffres.";
    }
    const exp = form.exp.match(/^(\d{2})\/(\d{2})$/);
    if (!exp) return "La date d'expiration doit être au format MM/AA.";
    const month = Number(exp[1]);
    const year = 2000 + Number(exp[2]);
    const now = new Date();
    if (month < 1 || month > 12) return "Le mois d'expiration est invalide.";
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
      return "Cette carte est expirée.";
    }
    if (!/^\d{3,4}$/.test(form.cvc)) return "Le CVC doit contenir 3 ou 4 chiffres.";
    return "";
  };

  const goToPayment = () => {
    setError("");
    setStep("payment");
  };

  const clear = () => {
    setError("");
    setStep("cart");
    onClear();
  };

  const pay = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    onCheckout();
    setForm(EMPTY_FORM);
    setStep("done");
  };

  const title = step === "payment" ? "Paiement" : "Panier";
  const kicker =
    step === "done"
      ? "Merci !"
      : step === "payment"
        ? `Commande · ${formatPrice(total)}`
        : count > 0
          ? `${count} article${count > 1 ? "s" : ""}`
          : "Boutique";

  return (
    <>
      <div
        className={`shopcart-scrim${open ? " open" : ""}`}
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        className={`shopcart${open ? " open" : ""}`}
        aria-label="Panier"
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
      >
        <header className="shopcart-head">
          <div>
            <span className="shopcart-kicker">{kicker}</span>
            <h2>{title}</h2>
          </div>
          <button
            className="shopcart-close"
            type="button"
            onClick={onClose}
            aria-label="Fermer le panier"
            ref={closeRef}
          >
            ✕
          </button>
        </header>

        {step === "done" ? (
          <div className="shopcart-done">
            <span className="shopcart-kicker">Merci !</span>
            <h3>Commande confirmée</h3>
            <p>
              Ceci est une démo front-end : aucun paiement n&apos;a été effectué et
              aucune donnée n&apos;a été envoyée.
            </p>
            <button className="btn primary wide" type="button" onClick={onClose}>
              Continuer mes achats
            </button>
          </div>
        ) : validLines.length === 0 ? (
          <div className="shopcart-empty">
            <span className="shopcart-kicker">Rien ici pour l&apos;instant</span>
            <h3>Ton panier est vide</h3>
            <p>Ajoute une figurine depuis le Shelf ou le Store.</p>
            <button className="btn sline" type="button" onClick={onClose}>
              Retour à la boutique
            </button>
          </div>
        ) : step === "payment" ? (
          <form className="shopcart-pay" onSubmit={pay} noValidate>
            <p className="shopcart-pay-note">
              Paiement de démonstration — aucune donnée n&apos;est envoyée.
            </p>

            <label className="shopcart-field">
              <span>Nom complet</span>
              <input
                autoComplete="cc-name"
                placeholder="Peter Parker"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
              />
            </label>

            <label className="shopcart-field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="peter@dailybugle.com"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
              />
            </label>

            <label className="shopcart-field">
              <span>Numéro de carte</span>
              <input
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="4242 4242 4242 4242"
                value={form.card}
                onChange={(event) => updateCard(event.target.value)}
              />
            </label>

            <div className="shopcart-pay-row">
              <label className="shopcart-field">
                <span>Expiration</span>
                <input
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/AA"
                  value={form.exp}
                  onChange={(event) => updateExp(event.target.value)}
                />
              </label>
              <label className="shopcart-field">
                <span>CVC</span>
                <input
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  value={form.cvc}
                  onChange={(event) =>
                    update("cvc", event.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                />
              </label>
            </div>

            <div className="shopcart-pay-summary">
              <span>
                {count} article{count > 1 ? "s" : ""}
              </span>
              <strong>{formatPrice(total)}</strong>
            </div>

            {error && (
              <p className="shopcart-error" role="alert">
                {error}
              </p>
            )}

            <button className="btn primary wide" type="submit">
              Confirmer la commande
            </button>
            <button
              className="btn sline"
              type="button"
              onClick={() => {
                setError("");
                setStep("cart");
              }}
            >
              Retour au panier
            </button>
            <p className="shopcart-secure">Démo front-end · pas de backend</p>
          </form>
        ) : (
          <>
            <div className="shopcart-lines">
              {validLines.map((line) => {
                const item = ITEMS[line.id];
                const price = productPrice(line.id);
                return (
                  <article className="shopcart-line" key={line.id}>
                    <img
                      src={productThumb(line.id)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="shopcart-info">
                      <span className="shopcart-cat">{CATS[item.category]}</span>
                      <strong>{item.name}</strong>
                      <span className="shopcart-unit">{formatPrice(price)}</span>
                      <div className="shopcart-controls">
                        <button
                          type="button"
                          aria-label={`Diminuer ${item.name}`}
                          onClick={() => onQty(line.id, line.qty - 1)}
                        >
                          −
                        </button>
                        <span aria-live="polite">{line.qty}</span>
                        <button
                          type="button"
                          aria-label={`Augmenter ${item.name}`}
                          onClick={() => onQty(line.id, line.qty + 1)}
                        >
                          +
                        </button>
                        <button
                          className="shopcart-remove"
                          type="button"
                          onClick={() => onRemove(line.id)}
                        >
                          Retirer
                        </button>
                      </div>
                    </div>
                    <span className="shopcart-linetotal">
                      {formatPrice(price * line.qty)}
                    </span>
                  </article>
                );
              })}
            </div>

            <footer className="shopcart-foot">
              <div className="shopcart-total">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <button className="btn primary wide" type="button" onClick={goToPayment}>
                Passer commande
              </button>
              <button className="btn sline" type="button" onClick={clear}>
                Vider le panier
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
