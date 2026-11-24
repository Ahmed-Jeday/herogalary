import { type FormEvent, useEffect, useRef, useState } from "react";
import { createOrder } from "../../../api/shopApi";
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
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [orderId, setOrderId] = useState("");
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
      setError("");
      setSaving(false);
      setOrderId("");
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

  const goToPayment = () => {
    setError("");
    setStep("payment");
  };

  const clear = () => {
    setError("");
    setStep("cart");
    setOrderId("");
    onClear();
  };

  const pay = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || validLines.length === 0) return;

    setSaving(true);
    setError("");
    try {
      const result = await createOrder(
        validLines.map((line) => ({
          productId: String(line.id),
          name: ITEMS[line.id].name,
          price: productPrice(line.id),
          quantity: line.qty,
        })),
      );
      setOrderId(result?.order?._id || "");
      onCheckout();
      setStep("done");
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Impossible d’enregistrer la commande.",
      );
    } finally {
      setSaving(false);
    }
  };

  const title = step === "payment" ? "Commande" : "Panier";
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
            <h3>Commande enregistrée</h3>
            <p>
              Ta commande a été enregistrée dans ton compte. Aucun paiement n&apos;a
              été débité.
            </p>
            {orderId && <p>Référence : {orderId}</p>}
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
              La commande sera enregistrée dans ton compte. Aucun paiement ne sera
              effectué maintenant.
            </p>
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

            <button className="btn primary wide" type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer la commande"}
            </button>
            <button
              className="btn sline"
              type="button"
              disabled={saving}
              onClick={() => {
                setError("");
                setStep("cart");
              }}
            >
              Retour au panier
            </button>
            <p className="shopcart-secure">Commande liée à ton compte</p>
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
