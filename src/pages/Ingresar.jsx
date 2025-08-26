// src/pages/Ingresar.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/css/ingresar.css";

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export default function Ingresar() {
  const [modo, setModo] = useState("ingreso"); // "ingreso" | "registro"
  return (
    <div className="app-container">
      <Navbar />
      <main className="ing ing--center">
        <div className="ing-bg" aria-hidden />
        <div className="ing-shell">
          <div className="ing-card">
            <div className="ing-card__accent" aria-hidden />

            <header className="ing-head">
              <span className="ing-mark">Plinius</span>
              <h1 className="ing-title">
                {modo === "ingreso"
                  ? "Ingresar a tu cuenta"
                  : "Crear cuenta empresarial"}
              </h1>
              <p className="ing-sub">
                Crédito y arrendamiento para empresas. Acceso seguro y rápido.
              </p>
            </header>

            {/* Tabs */}
            <nav className="ing-tabs" role="tablist" aria-label="Cambiar modo">
              <button
                role="tab"
                aria-selected={modo === "ingreso"}
                className={`ing-tab ${modo === "ingreso" ? "is-active" : ""}`}
                onClick={() => setModo("ingreso")}
              >
                Ingreso
              </button>
              <button
                role="tab"
                aria-selected={modo === "registro"}
                className={`ing-tab ${modo === "registro" ? "is-active" : ""}`}
                onClick={() => setModo("registro")}
              >
                Registro
              </button>
            </nav>

            {/* Social login */}
            <div className="ing-social">
              <GoogleButton onClick={handleGoogleLogin} />
            </div>

            <div className="ing-sep">
              <span>o con correo</span>
            </div>

            {/* Forms */}
            {modo === "ingreso" ? <LoginForm /> : <SignupForm />}

            <p className="ing-terms">
              Al continuar aceptas los{" "}
              <Link className="ing-link" to="/terminos">
                Términos y Condiciones
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ===== Helpers ===== */
function GoogleButton({ onClick }) {
  return (
    <button type="button" className="ing-gbtn" onClick={onClick}>
      <span className="ing-gicon" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path
            fill="#EA4335"
            d="M24 9.5c3.7 0 7 1.3 9.6 3.8l7.2-7.2C36.6 2.3 30.7 0 24 0 14.6 0 6.5 4.9 1.9 12.1l8.6 6.7C12.5 13.9 17.8 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.1 24.6c0-1.6-.1-2.7-.3-3.9H24v7.3h12.7c-.3 2-1.7 5-4.8 7.1l7.3 5.6c4.4-4 7-9.9 7-16.1z"
          />
          <path
            fill="#FBBC05"
            d="M10.5 28.9c-1-3-1-6.3 0-9.3l-8.6-6.7C-1 17.8-1 30.2 1.9 36l8.6-7.1z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.5 0 12-2.1 16-5.7l-7.3-5.6c-2 1.4-4.7 2.4-8.7 2.4-6.2 0-11.5-4.4-13.4-10.4l-8.6 7.1C6.5 43.1 14.6 48 24 48z"
          />
        </svg>
      </span>
      Continuar con Google
    </button>
  );
}

function handleGoogleLogin() {
  // Enchufa con tu backend (OAuth 2.0 / GIS).
  // Ejemplo simple de redirect:
  window.location.href = "/api/auth/google";
}

/* ===== Forms ===== */
function LoginForm() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const valid = emailRx.test(email) && pass.length >= 8;

  const submit = (e) => {
    e.preventDefault();
    // TODO: POST /api/login
  };

  return (
    <form className="ing-form" onSubmit={submit}>
      <Field label="Correo empresarial">
        <input
          type="email"
          placeholder="tu@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
          required
        />
      </Field>

      <Field label="Contraseña">
        <div className="ing-pass">
          <input
            type={show ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            minLength={8}
            required
          />
          <button
            type="button"
            className="ing-eye"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
            title={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {show ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </Field>

      <div className="ing-row">
        <label className="ing-chk">
          <input type="checkbox" defaultChecked /> <span>Recordarme</span>
        </label>
        <Link className="ing-link ing-link--sm" to="/terminos">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <button type="submit" className="btn btn-neon w100" disabled={!valid}>
        Ingresar
      </button>
    </form>
  );
}

function SignupForm() {
  const [razon, setRazon] = useState("");
  const [rfc, setRfc] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [ok, setOk] = useState(false);

  const valid =
    razon.trim().length > 3 &&
    /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i.test(rfc.trim()) &&
    emailRx.test(email) &&
    pass.length >= 8 &&
    ok;

  const submit = (e) => {
    e.preventDefault();
    // TODO: POST /api/signup
  };

  return (
    <form className="ing-form" onSubmit={submit}>
      <div className="ing-grid2">
        <Field label="Razón social">
          <input
            type="text"
            placeholder="Mi Empresa, S.A. de C.V."
            value={razon}
            onChange={(e) => setRazon(e.target.value)}
            required
          />
        </Field>
        <Field label="RFC">
          <input
            type="text"
            placeholder="XXX000000XXX"
            value={rfc}
            onChange={(e) => setRfc(e.target.value.toUpperCase())}
            required
          />
        </Field>
      </div>

      <Field label="Correo empresarial">
        <input
          type="email"
          placeholder="contacto@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
          required
        />
      </Field>

      <Field label="Contraseña">
        <input
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          minLength={8}
          required
        />
      </Field>

      <label className="ing-chk">
        <input
          type="checkbox"
          checked={ok}
          onChange={(e) => setOk(e.target.checked)}
        />{" "}
        <span>
          Acepto los{" "}
          <Link className="ing-link" to="/terminos">
            Términos y Condiciones
          </Link>
        </span>
      </label>

      <button type="submit" className="btn btn-neon w100" disabled={!valid}>
        Crear cuenta
      </button>
    </form>
  );
}

/* ===== Atom ===== */
function Field({ label, children }) {
  return (
    <label className="ing-field">
      <span className="ing-field__label">{label}</span>
      <div className="ing-field__input">{children}</div>
    </label>
  );
}
