import { useId, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Lock, Mail } from "lucide-react";
import "../Auth.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Login — écran de connexion HeroVerse (identité Comic Vault).
 *
 * Props :
 * - onSubmit({ email, password, remember }) : appelé si le formulaire est valide.
 * - onSwitch() : bascule vers l'écran d'inscription.
 * - onForgotPassword() : lien « mot de passe oublié ».
 * - loading : désactive le formulaire pendant une requête gérée par le parent.
 * - error : message d'erreur global contrôlé par le parent.
 */
export default function Login({
  onSubmit,
  onSwitch,
  onForgotPassword,
  loading = false,
  error = "",
}) {
  const rawId = useId();
  const titleId = `${rawId}-title`;
  const emailId = `${rawId}-email`;
  const passwordId = `${rawId}-password`;
  const rememberId = `${rawId}-remember`;

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [values, setValues] = useState({
    email: "",
    password: "",
    remember: true,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  const busy = loading || pending;
  const alert = formError || error;

  function update(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFormError("");
  }

  function validate(current) {
    const next = {};

    if (!current.email.trim()) {
      next.email = "Entre ton adresse e-mail.";
    } else if (!EMAIL_RE.test(current.email.trim())) {
      next.email = "Cette adresse e-mail n’est pas valide.";
    }

    if (!current.password) {
      next.password = "Entre ton mot de passe.";
    }

    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.email) emailRef.current?.focus();
      else if (nextErrors.password) passwordRef.current?.focus();
      return;
    }

    try {
      setPending(true);
      await onSubmit?.({
        email: values.email.trim(),
        password: values.password,
        remember: values.remember,
      });
    } catch (err) {
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : "Connexion impossible pour le moment.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="hv-auth hv-auth--login">
      <header className="hv-auth__topbar">
        <span className="hv-auth__topbar-spacer" aria-hidden="true" />
        <div className="hv-auth__logo">
          <span className="hv-auth__logo-main">HERO VERSE</span>
          <span className="hv-auth__logo-sub">Bibliothèque de comics</span>
        </div>
        <span className="hv-auth__tag">Accès membre</span>
      </header>

      <main className="hv-auth__main">
        <section className="hv-auth__card" aria-labelledby={titleId}>
          <aside className="hv-auth__poster" aria-hidden="true">
            <span className="hv-poster__kicker">Comic Vault · N°01</span>
            <p className="hv-poster__title">
              Hero
              <br />
              Verse
            </p>
            <span className="hv-poster__sticker">
              Identifie-toi,
              <br />
              héros !
            </span>
            <span className="hv-poster__foot">
              Bibliothèque de comics
              <br />
              1940 — 1988
            </span>
            <span className="hv-poster__issue">01</span>
          </aside>

          <div className="hv-auth__body">
            <p className="hv-auth__eyebrow">Accès membre</p>
            <div className="hv-auth__title-mask">
              <h1 id={titleId} className="hv-auth__title">
                Connexion
              </h1>
            </div>
            <p className="hv-auth__lede">
              Reprends ta place dans le vault et retrouve ta collection là où
              tu l’as laissée.
            </p>

            <form className="hv-form" onSubmit={handleSubmit} noValidate>
              <div
                className={`hv-field${errors.email ? " hv-field--error" : ""}`}
              >
                <label className="hv-field__label" htmlFor={emailId}>
                  Adresse e-mail
                </label>
                <div className="hv-field__control">
                  <Mail
                    className="hv-field__icon"
                    size={16}
                    strokeWidth={2.2}
                    aria-hidden="true"
                  />
                  <input
                    ref={emailRef}
                    id={emailId}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    spellCheck={false}
                    className="hv-input"
                    placeholder="ton.nom@heroverse.com"
                    value={values.email}
                    onChange={(event) => update("email", event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                      errors.email ? `${emailId}-error` : undefined
                    }
                    disabled={busy}
                  />
                </div>
                {errors.email && (
                  <p className="hv-field__error" id={`${emailId}-error`}>
                    {errors.email}
                  </p>
                )}
              </div>

              <div
                className={`hv-field${
                  errors.password ? " hv-field--error" : ""
                }`}
              >
                <label className="hv-field__label" htmlFor={passwordId}>
                  Mot de passe
                </label>
                <div className="hv-field__control">
                  <Lock
                    className="hv-field__icon"
                    size={16}
                    strokeWidth={2.2}
                    aria-hidden="true"
                  />
                  <input
                    ref={passwordRef}
                    id={passwordId}
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    className="hv-input"
                    placeholder="••••••••"
                    value={values.password}
                    onChange={(event) => update("password", event.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password ? `${passwordId}-error` : undefined
                    }
                    disabled={busy}
                  />
                </div>
                {errors.password && (
                  <p className="hv-field__error" id={`${passwordId}-error`}>
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="hv-form__row">
                <label className="hv-check" htmlFor={rememberId}>
                  <input
                    id={rememberId}
                    name="remember"
                    type="checkbox"
                    checked={values.remember}
                    onChange={(event) =>
                      update("remember", event.target.checked)
                    }
                    disabled={busy}
                  />
                  <span className="hv-check__box" aria-hidden="true" />
                  <span>Se souvenir de moi</span>
                </label>

                <button
                  type="button"
                  className="hv-link"
                  onClick={() => onForgotPassword?.()}
                  disabled={busy}
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {alert && (
                <div className="hv-alert" role="alert">
                  <AlertCircle
                    size={16}
                    strokeWidth={2.4}
                    aria-hidden="true"
                  />
                  <span>{alert}</span>
                </div>
              )}

              <button className="hv-btn" type="submit" disabled={busy}>
                <span>{busy ? "Connexion…" : "Entrer dans le vault"}</span>
                {!busy && (
                  <ArrowRight
                    size={18}
                    strokeWidth={2.6}
                    aria-hidden="true"
                  />
                )}
              </button>
            </form>

            <p className="hv-auth__switch">
              <span>Pas encore de compte ?</span>
              <button
                type="button"
                className="hv-switch"
                onClick={() => onSwitch?.()}
                disabled={busy}
              >
                Créer un compte
              </button>
            </p>
          </div>
        </section>
      </main>

      <footer className="hv-auth__footer">
        <span>© {CURRENT_YEAR} HeroVerse · Titres et héros fictifs.</span>
        <span>Comic Vault / FB / TW / IG</span>
      </footer>
    </div>
  );
}
