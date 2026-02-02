// src/components/Footer.jsx
import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/images/logo-plinius.png";
import "../assets/css/footer.css";

const year = new Date().getFullYear();

const Footer = () => {
  const [statusOpen, setStatusOpen] = useState(false);
  const location = useLocation();

  // STATUS (mock)
  const status = useMemo(
    () => ({
      overall: "operational", // "operational" | "degraded" | "incident"
      services: [
        { name: "API", state: "operational" },
        { name: "Auth", state: "operational" },
        { name: "Dashboard", state: "operational" },
      ],
      uptime90d: "99.97%",
      lastUpdate: "hace 3 min",
    }),
    []
  );

  const statusLabel =
    {
      operational: "Operational",
      degraded: "Degradado",
      incident: "Incidente",
    }[status.overall] || "—";

  // Scroll a top “inteligente”
  const toTopHref = location?.pathname === "/" ? "#top" : "/#top";

  const onNewsletterSubmit = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("sent");
    setTimeout(() => e.currentTarget.classList.remove("sent"), 1800);
  };

  return (
    <footer className="footer">
      <div className="footer-accent" aria-hidden />

      <div className="footer-wrap">
        {/* BRAND (centrado) */}
        <div className="f-brand">
          <img src={logo} alt="Plinius" className="f-logo" />
          <p className="f-tagline">
            Infraestructura en Finanzas AI, S.A.P.I. de C.V. — <strong>Plinius</strong>
          </p>

          {/* Toolbar compacta: Status + Simulador */}
          <div className="f-toolbar" role="toolbar" aria-label="Controles del footer">
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

            <Link to="/simulador" className="sim-cta" aria-label="Ir al simulador">
              <span className="sim-ic" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 7h10M7 12h10M7 17h6"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                </svg>
              </span>
              Simulador
            </Link>
          </div>

          {/* Newsletter mini */}
          <form className="f-news" onSubmit={onNewsletterSubmit}>
            <div className="f-newsRow">
              <span className="f-newsKicker">
                <span className="f-newsDot" aria-hidden />
                Actualizaciones (0 spam)
              </span>
              <div className="f-newsField">
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  aria-label="Correo para actualizaciones"
                />
                <button type="submit" className="f-newsBtn">
                  Suscribirme
                </button>
              </div>
            </div>
            <div className="f-newsHint">
              Te avisamos cambios de producto, mejoras y disponibilidad.
            </div>
          </form>
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
                    <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.6" />
                    <path
                      d="M4 7l8 6 8-6"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <a
                  href="mailto:contacto@crowdlink.mx"
                  className="f-link"
                  rel="noopener noreferrer"
                >
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
                    <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </span>
                <a
                  className="f-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://maps.google.com/?q=Torre Esmeralda III, Blvd. Manuel Ávila Camacho 32, Sky Lobby B, Lomas de Chapultepec I, Miguel Hidalgo, CDMX 11000"
                >
                  Torre Esmeralda III, Blvd. Manuel Ávila Camacho 32, Sky Lobby B,
                  Lomas de Chapultepec I, Miguel Hidalgo, CDMX 11000
                </a>
              </li>
            </ul>

            {/* Social */}
            <div className="f-social">
              <a
                className="s-btn"
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
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
                rel="noopener noreferrer"
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
                <a href="/#sobre-plinius" className="f-link">
                  Sobre Plinius
                </a>
              </li>
              <li>
                <a href="/#enfoque" className="f-link">
                  Enfoque
                </a>
              </li>
              <li>
                <Link to="/productos" className="f-link">
                  Productos
                </Link>
              </li>
              <li>
                <Link to="/simulador" className="f-link">
                  Simulador
                </Link>
              </li>
              <li>
                <Link to="/solicitud" className="f-link">
                  Solicitud
                </Link>
              </li>
              <li>
                <Link to="/ingresar?registro=0" className="f-link">
                  Ingresar
                </Link>
              </li>
            </ul>
          </div>

          <div className="f-col">
            <h5 className="f-title">Alianzas</h5>
            <ul className="f-list">
              <li>
                <a
                  href="https://www.crowdlink.mx"
                  target="_blank"
                  rel="noopener noreferrer"
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

              <li>
                <span className="f-kicker">Soporte Impulsa</span> · Originación y soporte operativo
              </li>
            </ul>

            <div className="f-badges">
              <span className="badge soft">SOC 2 (en proceso)</span>
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
                <Link to="/terminos" className="f-link">
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <a href="#cookies" className="f-link">
                  Política de cookies
                </a>
              </li>
            </ul>

            <p className="f-micro">
              La información mostrada tiene fines informativos y no constituye una oferta,
              recomendación o solicitud para adquirir productos financieros. Sujeta a evaluación
              y políticas de crédito.
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
            <a href="/status" className="btn-sd" aria-label="Ver status detallado">
              Ver más
            </a>
            <button className="btn-sd ghost" onClick={() => setStatusOpen(false)}>
              Cerrar
            </button>
          </div>
        </div>

        <hr className="f-divider" />

        <div className="f-bottom">
          <p className="f-copy">&copy; {year} Plinius. Todos los derechos reservados.</p>

          <nav className="f-bottom-nav" aria-label="Atajos legales">
            <a href="#aviso" className="f-mini">
              Privacidad
            </a>
            <Link to="/terminos" className="f-mini">
              Términos
            </Link>
            <a href="#cookies" className="f-mini">
              Cookies
            </a>
          </nav>
        </div>
      </div>

      {/* Back to top */}
      <a href={toTopHref} className="to-top" aria-label="Volver arriba">
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
