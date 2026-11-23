import { useState } from "react";
import ReactDOM from "react-dom/client";
import Login from "./components/Login";
import Signup from "./components/Signup";
import { login, register } from "./api/authApi";

function Preview() {
  const initial =
    new URLSearchParams(window.location.search).get("mode") === "signup"
      ? "signup"
      : "login";
  const [mode, setMode] = useState(initial);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  async function handleLogin(credentials) {
    setAuthError("");
    setAuthLoading(true);
    try {
      await login(credentials);
      window.location.assign("/");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Connexion impossible.");
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister(credentials) {
    setAuthError("");
    setAuthLoading(true);
    try {
      await register(credentials);
      setMode("login");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Inscription impossible.");
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }

  if (mode === "signup") {
    return (
      <Signup
        onSubmit={handleRegister}
        onSwitch={() => {
          setAuthError("");
          setMode("login");
        }}
        loading={authLoading}
        error={authError}
      />
    );
  }

  return (
    <Login
      onSubmit={handleLogin}
      onSwitch={() => {
        setAuthError("");
        setMode("signup");
      }}
      loading={authLoading}
      error={authError}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Preview />);
