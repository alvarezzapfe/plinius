// src/components/Footer.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/images/logo-plinius.png";
import "../assets/css/footer.css";

const year = new Date().getFullYear();

const Footer = () => {
  // THEME TOGGLE
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("plinius-theme") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("theme-light");
    } else {
      root.classList.remove("theme-light");
    }
    localStorage.setItem("plinius-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  // PWA INSTALL
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [pwaReady, setPwaReady] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPwaReady(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } finally {
      setDeferredPrompt(null);
      setPwaReady(false);
    }
  };

  // STATUS WIDGET (mock)
  const [statusOpen, setStatusOpen] = useState(false);
  const status = {
    overall: "operational", // "operational" | "degraded" | "incident"
    services: [
      { name: "API", state: "operational" },
      { name: "Auth", state: "operational" },
      { name: "Dashboard", state: "operational" },
    ],
    uptime90d: "99.97%",
    lastUpdate: "hace 3 min",
  };

  const statusLabel = {
    operational: "Operational",
    degraded: "Degradado",
    incident: "Incidente",
  }[status.overall];

  // 🔧 FIX: evita import.meta; usa solo process.env
  // reemplaza cualquier línea previa que calcule "build" por ESTA:
  const build =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_APP_BUILD) ||
    (typeof process !== "undefined" &&
      process.env &&
      process.env.REACT_APP_BUILD) ||
    (typeof window !== "undefined" && window.__APP_BUILD__) ||
    "v1.0.0";

  return (
    <footer className="footer">
      <div className="footer-accent" aria-hidden />

      <div className="footer-wrap">
        {/* Toolbar: Theme / Status / Install */}
        <div className="f-toolbar" role="toolbar" aria-label="Controles">
          <button
            type="button"
            className="toggler"
            onClick={toggleTheme}
            aria-pressed={theme === "light"}
            aria-label="Cambiar tema"
            title="Cambiar tema"
          >
            <span className="tog-knob" />
            <span className="tog-ico sun" aria-hidden>
              ☀️
            </span>
            <span className="tog-ico moon" aria-hidden>
              🌙
            </span>
          </button>

          <button
            type="button"
            className={`status-pill ${status.overall}`}
            onClick={() => setStatusOpen((v) => !v)}
            aria-expanded={statusOpen}
            aria-controls="status-drawer"
            title="Estado de la plataforma"
          >
            <span className="dot" aria-hidden />
            <span className="txt">Status: {statusLabel}</span>
          </button>

          <button
            type="button"
            className={`install-btn ${pwaReady ? "ready" : "disabled"}`}
            onClick={handleInstall}
            disabled={!pwaReady}
            title={pwaReady ? "Instalar app" : "Instalación no disponible"}
          >
            <span className="ic" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3v12m0 0 4-4m-4 4-4-4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 21h14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span>Instalar app</span>
          </button>
        </div>

        {/* Marca */}
        <div className="f-brand">
          <img src={logo} alt="Plinius" className="f-logo" />
          <p className="f-tagline">
            Infraestructura en Finanzas AI, S.A.P.I. de C.V. —{" "}
            <strong>Plinius</strong> (marca registrada)
          </p>
          <div className="f-chips">
            <span className="chip">Crédito simple</span>
            <span className="chip">Arrendamiento puro</span>
            <span className="chip">Capital</span>
            <span className="chip">Bursatilización</span>
          </div>
        </div>

        {/* Grid */}
        <div className="f-grid">
          <div className="f-col">
            <h5 className="f-title">Contacto</h5>
            <ul className="f-list">
              <li className="f-item">
                <span className="ic" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 5c0-1.1.9-2 2-2h2l2 4-2 2c.8 1.9 2.1 3.3 4 4l2-2 4 2v2c0 1.1-.9 2-2 2h-1C9.8 19 5 14.2 5 8V7c0-1.1-.9-2-1-2Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <a href="tel:+525551609091" className="f-link">
                  (55) 5551609091
                </a>
              </li>
              <li className="f-item">
                <span className="ic" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 6h16v12H4z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M4 7l8 6 8-6"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <a href="mailto:contacto@crowdlink.mx" className="f-link">
                  contacto@crowdlink.mx
                </a>
              </li>
              <li className="f-item">
                <span className="ic" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <circle
                      cx="12"
                      cy="11"
                      r="2.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                  </svg>
                </span>
                <a
                  className="f-link"
                  target="_blank"
                  rel="noreferrer"
                  href="https://maps.google.com/?q=Torre Esmeralda III, Blvd. Manuel Ávila Camacho 32, Sky Lobby B, Lomas de Chapultepec I, Miguel Hidalgo, CDMX 11000"
                >
                  Torre Esmeralda III, Blvd. Manuel Ávila Camacho 32, Sky Lobby
                  B, Lomas de Chapultepec I, Miguel Hidalgo, CDMX 11000
                </a>
              </li>
            </ul>
            <div className="f-social">
              <a
                className="s-btn"
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 9v9M6 6v0M10 18v-5a3 3 0 016 0v5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </a>
              <a
                className="s-btn"
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 4l16 16M20 4L4 20"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div className="f-col">
            <h5 className="f-title">Enlaces</h5>
            <ul className="f-list">
              <li>
                <Link to="/" className="f-link">
                  Inicio
                </Link>
              </li>
              <li>
                <a href="/#que" className="f-link">
                  ¿Qué hacemos?
                </a>
              </li>
              <li>
                <a href="/#track" className="f-link">
                  Track record
                </a>
              </li>
              <li>
                <Link to="/productos" className="f-link">
                  Productos
                </Link>
              </li>
              <li>
                <a href="#simulador" className="f-link">
                  Simulador
                </a>
              </li>
              <li>
                <a href="#solicitud" className="f-link">
                  Solicitud
                </a>
              </li>
              <li>
                <Link to="/login" className="f-link">
                  Ingresar
                </Link>
              </li>
            </ul>
            <div className="meta-build">
              Build <span className="badge">{build}</span>
            </div>
          </div>

          <div className="f-col">
            <h5 className="f-title">Alianzas</h5>
            <ul className="f-list">
              <li>
                <a
                  href="https://www.crowdlink.mx"
                  target="_blank"
                  rel="noreferrer"
                  className="f-link ext"
                >
                  Crowdlink
                  <span className="ext-ic" aria-hidden>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M14 4h6v6M10 14l10-10M20 14v6H4V4h6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </a>
              </li>
              <li>
                <span className="f-kicker">PiMX</span> · Financiamiento puente
              </li>
            </ul>
            <div className="f-badges">
              <span className="badge soft">SOC 2 (en proceso)</span>
              <span className="badge soft">ISO 27001 (roadmap)</span>
            </div>
          </div>

          <div className="f-col">
            <h5 className="f-title">Legal</h5>
            <ul className="f-list">
              <li>
                <a href="#aviso" className="f-link">
                  Aviso de privacidad
                </a>
              </li>
              <li>
                <a href="#terminos" className="f-link">
                  Términos y condiciones
                </a>
              </li>
              <li>
                <a href="#cookies" className="f-link">
                  Política de cookies
                </a>
              </li>
            </ul>
            <p className="f-micro">
              La información mostrada tiene fines informativos y no constituye
              una oferta, recomendación o solicitud para adquirir productos
              financieros. Sujeta a evaluación y políticas de crédito.
            </p>
          </div>
        </div>

        {/* Drawer de status */}
        <div
          id="status-drawer"
          className={`status-drawer ${statusOpen ? "open" : ""}`}
          role="dialog"
          aria-modal="false"
          aria-label="Estado de la plataforma"
        >
          <div className="sd-head">
            <span className={`sd-dot ${status.overall}`} aria-hidden />
            <strong>Plinius Status</strong>
            <span className="sd-meta">
              Uptime 90d: {status.uptime90d} · {status.lastUpdate}
            </span>
          </div>
          <ul className="sd-list">
            {status.services.map((s) => (
              <li key={s.name} className="sd-item">
                <span className={`sd-bullet ${s.state}`} aria-hidden />
                <span className="sd-name">{s.name}</span>
                <span className="sd-state">
                  {s.state === "operational" ? "Operational" : s.state}
                </span>
              </li>
            ))}
          </ul>
          <div className="sd-actions">
            <a
              href="/status"
              className="btn-sd"
              aria-label="Ver status detallado"
            >
              Ver más
            </a>
            <button
              className="btn-sd ghost"
              onClick={() => setStatusOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>

        <hr className="f-divider" />

        <div className="f-bottom">
          <p className="f-copy">
            &copy; {year} Plinius. Todos los derechos reservados.
          </p>
          <nav className="f-bottom-nav" aria-label="Atajos legales">
            <a href="#aviso" className="f-mini">
              Privacidad
            </a>
            <a href="#terminos" className="f-mini">
              Términos
            </a>
            <a href="#cookies" className="f-mini">
              Cookies
            </a>
          </nav>
        </div>
      </div>

      <a href="#top" className="to-top" aria-label="Volver arriba">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 5l7 7M12 5L5 12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 5v14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </a>
    </footer>
  );
};

export default Footer;
