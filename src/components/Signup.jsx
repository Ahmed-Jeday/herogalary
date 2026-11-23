import { useId, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Lock, Mail, User } from "lucide-react";
import "../Auth.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9._-]+$/;
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Signup — écran de création de compte HeroVerse (identité Comic Vault).
 *
 * Props :
 * - onSubmit({ username, email, password, acceptTerms }) : appelé si le formulaire est valide.
 * - onSwitch() : bascule vers l'écran de connexion.
 * - loading : désactive le formulaire pendant une requête gérée par le parent.
 * - error : message d'erreur global contrôlé par le parent.
 */
export default function Signup({
  onSubmit,
  onSwitch,
  loading = false,
  error = "",
}) {
  const rawId = useId();
  const titleId = `${rawId}-title`;
  const usernameId = `${rawId}-username`;
  const emailId = `${rawId}-email`;
  const passwordId = `${rawId}-password`;
  const confirmId = `${rawId}-confirm`;
  const termsId = `${rawId}-terms`;

  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const termsRef = useRef(null);

  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
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
    const username = current.username.trim();

    if (!username) {
      next.username = "Choisis un pseudo de héros.";
    } else if (username.length < 3) {
      next.username = "3 caractères minimum.";
    } else if (username.length > 24) {
      next.username = "24 caractères maximum.";
    } else if (!USERNAME_RE.test(username)) {
      next.username = "Lettres, chiffres, points, tirets et underscores uniquement.";
    }

    if (!current.email.trim()) {
      next.email = "Entre ton adresse e-mail.";
    } else if (!EMAIL_RE.test(current.email.trim())) {
      next.email = "Cette adresse e-mail n’est pas valide.";
    }

    if (!current.password) {
      next.password = "Choisis un mot de passe.";
    } else if (current.password.length < 8) {
      next.password = "8 caractères minimum.";
    } else if (!/[A-Z]/.test(current.password) || !/\d/.test(current.password)) {
      next.password = "Ajoute au moins une majuscule et un chiffre.";
    }

    if (!current.confirmPassword) {
      next.confirmPassword = "Confirme ton mot de passe.";
    } else if (current.confirmPassword !== current.password) {
      next.confirmPassword = "Les deux mots de passe ne correspondent pas.";
    }

    if (!current.acceptTerms) {
      next.acceptTerms = "Tu dois accepter les conditions pour continuer.";
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
      if (nextErrors.username) usernameRef.current?.focus();
      else if (nextErrors.email) emailRef.current?.focus();
      else if (nextErrors.password) passwordRef.current?.focus();
      else if (nextErrors.confirmPassword) confirmRef.current?.focus();
      else if (nextErrors.acceptTerms) termsRef.current?.focus();
      return;
    }

    try {
      setPending(true);
      await onSubmit?.({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        acceptTerms: values.acceptTerms,
      });
    } catch (err) {
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : "Création du compte impossible pour le moment.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="hv-auth hv-auth--signup">
      <header className="hv-auth__topbar">
        <span className="hv-auth__topbar-spacer" aria-hidden="true" />
        <div className="hv-auth__logo">
          <span className="hv-auth__logo-main">HERO VERSE</span>
          <span className="hv-auth__logo-sub">Bibliothèque de comics</span>
        </div>
        <span className="hv-auth__tag">Nouveau membre</span>
      </header>

      <main className="hv-auth__main">
        <section className="hv-auth__card" aria-labelledby={titleId}>
          <aside className="hv-auth__poster" aria-hidden="true">
            <span className="hv-poster__kicker">Comic Vault · N°02</span>
            <p className="hv-poster__title">
              Hero
              <br />
              Verse
            </p>
            <span className="hv-poster__sticker">
              Rejoins
              <br />
              la ligue !
            </span>
            <span className="hv-poster__foot">
              Nouveau membre
              <br />
              Accès complet
            </span>
            <span className="hv-poster__issue">02</span>
          </aside>

          <div className="hv-auth__body">
            <p className="hv-auth__eyebrow">Première visite ?</p>
            <div className="hv-auth__title-mask">
              <h1 id={titleId} className="hv-auth__title">
                Créer un compte
              </h1>
            </div>
            <p className="hv-auth__lede">
              Ouvre ta carte de membre, collectionne les comics et rejoins la
              communauté du vault.
            </p>

            <form className="hv-form" onSubmit={handleSubmit} noValidate>
              <div
                className={`hv-field${
                  errors.username ? " hv-field--error" : ""
                }`}
              >
                <label className="hv-field__label" htmlFor={usernameId}>
                  Pseudo de héros
                </label>
                <div className="hv-field__control">
                  <User
                    className="hv-field__icon"
                    size={16}
                    strokeWidth={2.2}
                    aria-hidden="true"
                  />
                  <input
                    ref={usernameRef}
                    id={usernameId}
                    name="username"
                    type="text"
                    autoComplete="username"
                    spellCheck={false}
                    className="hv-input"
                    placeholder="CrimsonFalcon"
                    value={values.username}
                    onChange={(event) => update("username", event.target.value)}
                    aria-invalid={Boolean(errors.username)}
                    aria-describedby={
                      errors.username ? `${usernameId}-error` : undefined
                    }
                    disabled={busy}
                  />
                </div>
                {errors.username && (
                  <p className="hv-field__error" id={`${usernameId}-error`}>
                    {errors.username}
                  </p>
                )}
              </div>

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
                    autoComplete="new-password"
                    className="hv-input"
                    placeholder="••••••••"
                    value={values.password}
                    onChange={(event) => update("password", event.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                      errors.password
                        ? `${passwordId}-error`
                        : `${passwordId}-hint`
                    }
                    disabled={busy}
                  />
                </div>
                {errors.password ? (
                  <p className="hv-field__error" id={`${passwordId}-error`}>
                    {errors.password}
                  </p>
                ) : (
                  <p className="hv-field__hint" id={`${passwordId}-hint`}>
                    8 caractères minimum.
                  </p>
                )}
              </div>

              <div
                className={`hv-field${
                  errors.confirmPassword ? " hv-field--error" : ""
                }`}
              >
                <label className="hv-field__label" htmlFor={confirmId}>
                  Confirmer le mot de passe
                </label>
                <div className="hv-field__control">
                  <Lock
                    className="hv-field__icon"
                    size={16}
                    strokeWidth={2.2}
                    aria-hidden="true"
                  />
                  <input
                    ref={confirmRef}
                    id={confirmId}
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className="hv-input"
                    placeholder="••••••••"
                    value={values.confirmPassword}
                    onChange={(event) =>
                      update("confirmPassword", event.target.value)
                    }
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={
                      errors.confirmPassword
                        ? `${confirmId}-error`
                        : undefined
                    }
                    disabled={busy}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="hv-field__error" id={`${confirmId}-error`}>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div
                className={`hv-field${
                  errors.acceptTerms ? " hv-field--error" : ""
                }`}
              >
                <label className="hv-check" htmlFor={termsId}>
                  <input
                    ref={termsRef}
                    id={termsId}
                    name="acceptTerms"
                    type="checkbox"
                    checked={values.acceptTerms}
                    onChange={(event) =>
                      update("acceptTerms", event.target.checked)
                    }
                    aria-invalid={Boolean(errors.acceptTerms)}
                    aria-describedby={
                      errors.acceptTerms ? `${termsId}-error` : undefined
                    }
                    disabled={busy}
                  />
                  <span className="hv-check__box" aria-hidden="true" />
                  <span>
                    J’accepte les <strong>conditions d’utilisation</strong> et
                    la <strong>politique de confidentialité</strong> de
                    HeroVerse.
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p className="hv-field__error" id={`${termsId}-error`}>
                    {errors.acceptTerms}
                  </p>
                )}
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
                <span>{busy ? "Création…" : "Créer mon compte"}</span>
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
              <span>Déjà membre ?</span>
              <button
                type="button"
                className="hv-switch"
                onClick={() => onSwitch?.()}
                disabled={busy}
              >
                Se connecter
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
