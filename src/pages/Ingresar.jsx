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

      <main className="ing">
        <div className="ing-bg" aria-hidden />
        <div className="ing-grid" aria-hidden />

        <div className="ing-shell">
          <section className="ing-card ing-card--light">
            <header className="ing-head">
              <div className="ing-pill">Plinius · Acceso</div>
              <h2 className="ing-title">
                {modo === "ingreso"
                  ? "Ingresar a tu panel"
                  : "Crear cuenta empresarial"}
              </h2>
              <p className="ing-sub">
                Administra tus créditos y arrendamientos desde un solo lugar.
              </p>
            </header>

            {/* Tabs modo ingreso / registro */}
            <nav
              className="ing-tabs ing-tabs--soft"
              role="tablist"
              aria-label="Cambiar modo"
            >
              <button
                type="button"
                role="tab"
                aria-selected={modo === "ingreso"}
                className={`ing-tab ${modo === "ingreso" ? "is-active" : ""}`}
                onClick={() => setModo("ingreso")}
              >
                Ingresar
              </button>
              <button
                type="button"
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

            <div className="ing-sep ing-sep--soft">
              <span>o con correo</span>
            </div>

            {/* Contenedor para que el tamaño sea constante */}
            <div className="ing-form-shell">
              {modo === "ingreso" ? <LoginForm /> : <SignupForm />}
            </div>

            <p className="ing-terms">
              Al continuar aceptas los{" "}
              <Link className="ing-link ing-link--inline" to="/terminos">
                Términos y Condiciones
              </Link>
              .
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* =====================================================
   Google Button
   ===================================================== */
function GoogleButton({ onClick }) {
  return (
    <button type="button" className="ing-gbtn ing-gbtn--soft" onClick={onClick}>
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
  // Conecta a tu backend (OAuth 2.0 / Google Identity Services)
  window.location.href = "/api/auth/google";
}

/* =====================================================
   LoginForm – conecta con /api/auth/login
   ===================================================== */
function LoginForm() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const valid = emailRx.test(email) && pass.length >= 8;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || loading) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: pass,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data?.message || "Usuario no encontrado. Verifica tus datos."
        );
      }

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("plinius_token", data.token);
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setErrorMsg(err.message || "Usuario no encontrado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="ing-form ing-form--soft" onSubmit={submit}>
      <Field label="Correo empresarial">
        <input
          type="email"
          placeholder="tu@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
          required
          maxLength={120}
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
            maxLength={128}
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
        <label className="ing-chk ing-chk--soft">
          <input type="checkbox" defaultChecked /> <span>Recordarme</span>
        </label>
        <Link className="ing-link ing-link--sm" to="/recuperar">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      {errorMsg && <p className="ing-error">{errorMsg}</p>}

      <button
        type="submit"
        className="btn btn-neon w100"
        disabled={!valid || loading}
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>

      <div className="ing-demo">
        <Link to="/dashboard" className="btn btn-outline ing-demo-btn">
          Ir al Dashboard (demo)
        </Link>
      </div>
    </form>
  );
}

/* =====================================================
   SignupForm – lista de espera (sin backend por ahora)
   ===================================================== */
function SignupForm() {
  const [razon, setRazon] = useState("");
  const [rfc, setRfc] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [ok, setOk] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const valid =
    razon.trim().length > 3 &&
    /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i.test(rfc.trim()) &&
    emailRx.test(email) &&
    pass.length >= 8 &&
    ok;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || loading) return;

    setLoading(true);
    setErrorMsg("");
    setSuccess(false);

    try {
      // POR AHORA: no llamamos backend real, solo simulamos alta en lista de espera
      await new Promise((r) => setTimeout(r, 500));
      setSuccess(true);
    } catch (err) {
      setErrorMsg("Ocurrió un error. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="ing-form ing-form--soft" onSubmit={submit}>
      <div className="ing-grid2">
        <Field label="Razón social">
          <input
            type="text"
            placeholder="Mi Empresa, S.A. de C.V."
            value={razon}
            onChange={(e) => setRazon(e.target.value)}
            required
            maxLength={140}
          />
        </Field>
        <Field label="RFC">
          <input
            type="text"
            placeholder="XXX000000XXX"
            value={rfc}
            onChange={(e) => setRfc(e.target.value.toUpperCase())}
            required
            maxLength={13}
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
          maxLength={120}
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
          maxLength={128}
        />
      </Field>

      <label className="ing-chk ing-chk--soft">
        <input
          type="checkbox"
          checked={ok}
          onChange={(e) => setOk(e.target.checked)}
        />{" "}
        <span>
          Acepto los{" "}
          <Link className="ing-link ing-link--inline" to="/terminos">
            Términos y Condiciones
          </Link>
        </span>
      </label>

      {errorMsg && <p className="ing-error">{errorMsg}</p>}
      {success && (
        <p className="ing-success">
          Usuario registrado. Estás en la lista de espera para nuestro
          lanzamiento en el primer trimestre de 2026 🚀
        </p>
      )}

      <button
        type="submit"
        className="btn btn-neon w100"
        disabled={!valid || loading}
      >
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <div className="ing-demo">
        <Link to="/dashboard" className="btn btn-outline ing-demo-btn">
          Ir al Dashboard (demo)
        </Link>
      </div>
    </form>
  );
}

/* =====================================================
   Field atom
   ===================================================== */
function Field({ label, children }) {
  return (
    <label className="ing-field">
      <span className="ing-field__label">{label}</span>
      <div className="ing-field__input ing-field__input--soft">{children}</div>
    </label>
  );
}
