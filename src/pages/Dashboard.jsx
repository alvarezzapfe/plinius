// src/pages/Dashboard.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/dashboard.css";
import LogoPlinius from "../assets/images/Plinius_Negro.png";

/* =====================================================
   Iconos lineales minimalistas
   ===================================================== */
function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    className: "ni",
  };

  switch (name) {
    case "overview":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="5" rx="2" />
          <rect x="13" y="10" width="8" height="11" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
        </svg>
      );
    case "facilities":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M3 9h18" />
          <circle cx="9" cy="14" r="1.4" />
          <circle cx="15" cy="14" r="1.4" />
        </svg>
      );
    case "timeline":
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h10M4 18h8" />
          <circle cx="10" cy="6" r="1.4" />
          <circle cx="16" cy="12" r="1.4" />
          <circle cx="13" cy="18" r="1.4" />
        </svg>
      );
    case "covenants":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h5M8 16h4" />
          <path d="M10 5.5 11.5 7 14 4.5" />
        </svg>
      );
    case "scenarios":
      return (
        <svg {...common}>
          <path d="M4 18 9 6l4 9 3-5 4 8" />
          <path d="M4 18h16" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.8 1.8 0 0 0 .3 2L19 18.7a1.8 1.8 0 0 0-2 .3l-.3.3-1.4-.4a7 7 0 0 1-1.2.7L14 21h-4l-.1-1.4a7 7 0 0 1-1.2-.7L7.3 19a1.8 1.8 0 0 0-2-.3L4.3 17a1.8 1.8 0 0 0 .3-2 7.5 7.5 0 0 1 0-2 1.8 1.8 0 0 0-.3-2L5.3 6a1.8 1.8 0 0 0 2-.3l.4-.3 1.4.4a7 7 0 0 1 1.2-.7L10 3h4l.1 1.4a7 7 0 0 1 1.2.7l1.4-.4.3.3a1.8 1.8 0 0 0 2 .3L19.7 9a1.8 1.8 0 0 0-.3 2 7.5 7.5 0 0 1 0 2z" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
          <path d="M15 16l4-4-4-4" />
          <path d="M9 12h10" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
        </svg>
      );
  }
}

/* =====================================================
   Data fake – FACILITIES / EVENTS / COVENANTS
   ===================================================== */
const facilities = [
  {
    id: "FAC-001",
    lender: "BBVA",
    type: "Crédito simple",
    limit: 8_000_000,
    used: 4_300_000,
    rate: 0.205,
    matDate: "2027-03-15",
  },
  {
    id: "FAC-002",
    lender: "Banorte",
    type: "Arrendamiento",
    limit: 3_500_000,
    used: 2_100_000,
    rate: 0.235,
    matDate: "2026-11-30",
  },
  {
    id: "FAC-003",
    lender: "HSBC",
    type: "Revolving",
    limit: 5_000_000,
    used: 1_250_000,
    rate: 0.195,
    matDate: "2025-12-31",
  },
];

const events = [
  {
    id: 1,
    date: "2025-09-15",
    label: "Pago intereses FAC-002",
    type: "pago",
  },
  {
    id: 2,
    date: "2025-10-01",
    label: "Revisión covenants FAC-001",
    type: "covenant",
  },
  {
    id: 3,
    date: "2026-01-10",
    label: "Vencimiento parcial FAC-003",
    type: "vencimiento",
  },
];

const covenants = [
  {
    id: "cov-1",
    label: "DSCR mínimo 1.25x",
    status: "ok",
    current: "1.41x",
  },
  {
    id: "cov-2",
    label: "Deuda Neta / EBITDA ≤ 3.5x",
    status: "watch",
    current: "3.2x",
  },
  {
    id: "cov-3",
    label: "EBITDA mínimo 12m MXN",
    status: "risk",
    current: "11.4m",
  },
];

const pesos = (x) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(x);

/* =====================================================
   DASHBOARD ROOT
   ===================================================== */
export default function Dashboard() {
  const [active, setActive] = useState("overview");
  const navigate = useNavigate();

  // Metrics agregados
  const { totalLimit, totalUsed, headroom, utilization, wavgRate } =
    useMemo(() => {
      const totalLimit = facilities.reduce((acc, f) => acc + f.limit, 0);
      const totalUsed = facilities.reduce((acc, f) => acc + f.used, 0);
      const headroom = totalLimit - totalUsed;
      const utilization = totalLimit ? totalUsed / totalLimit : 0;
      const wavgRate = totalUsed
        ? facilities.reduce((acc, f) => acc + f.used * f.rate, 0) / totalUsed
        : 0;
      return { totalLimit, totalUsed, headroom, utilization, wavgRate };
    }, []);

  const navItems = [
    { key: "overview", label: "Overview", icon: "overview" },
    { key: "facilities", label: "Facilities", icon: "facilities" },
    { key: "timeline", label: "Timeline", icon: "timeline" },
    { key: "covenants", label: "Covenants", icon: "covenants" },
    { key: "scenarios", label: "Scenarios", icon: "scenarios" },
    { key: "settings", label: "Settings", icon: "settings" },
  ];

  const healthScore = 78; // fake

  return (
    <div className="dash">
      {/* SIDEBAR ================================================== */}
      <aside className="dash-nav">
        <div className="nav-head">
          <div className="brand-mark">
            <img
              src={LogoPlinius}
              alt="Plinius"
              className="brand-logo"
            />
          </div>
        </div>

        <div className="nav-section">
          <span className="nav-label">Workspace</span>
          <div className="nav-pill">Infraestructura en Finanzas · MX</div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${active === item.key ? "active" : ""}`.trim()}
              onClick={() => setActive(item.key)}
            >
              <Icon name={item.icon} />
              <span className="nl">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="nav-spacer" />

        <div className="nav-health">
          <div className="nav-health-top">
            <span className="nav-health-label">Liability Health</span>
            <span className="nav-health-score">{healthScore}</span>
          </div>
          <div className="nav-health-bar">
            <div
              className="nav-health-fill"
              style={{ width: `${healthScore}%` }}
            />
          </div>
          <p className="nav-health-note">
            Perfil estable. Revisa refinanciamientos 2026–2027.
          </p>
        </div>

        <button
          className="nav-item logout"
          onClick={() => navigate("/ingresar")}
        >
          <Icon name="logout" />
          <span className="nl">Cerrar sesión</span>
        </button>
      </aside>

      {/* MAIN ===================================================== */}
      <main className="dash-main">
        {/* TOPBAR */}
        <div className="dash-top">
          <div className="btngrp">
            <div>
              <h1 className="title">
                {active === "overview" && "Liability Overview"}
                {active === "facilities" && "Facilities & Lines"}
                {active === "timeline" && "Liability Timeline"}
                {active === "covenants" && "Covenants & Limits"}
                {active === "scenarios" && "Scenario Lab"}
                {active === "settings" && "Workspace Settings"}
              </h1>
              <p className="subtitle">
                Plataforma para gestionar créditos, arrendamientos y líneas de
                fondeo en un solo panel.
              </p>
            </div>
          </div>

          <div className="right">
            <div className="filter">
              <span className="filter-label">Horizon</span>
              <select>
                <option>12 meses</option>
                <option>24 meses</option>
                <option>36 meses</option>
              </select>
            </div>
            <div className="user">
              <div className="avatar" />
              <div className="meta">
                <strong>Operaciones</strong>
                <span>Mi Empresa, S.A. de C.V.</span>
              </div>
            </div>
          </div>
        </div>

        {/* RENDER DINÁMICO ======================================== */}
        {active === "overview" && (
          <>
            {/* TOP ROW – KPIs */}
            <section className="cards kpis">
              <article className="card kpi">
                <header className="card-head">
                  <span className="label">Exposure total</span>
                </header>
                <div className="value">{pesos(totalUsed)}</div>
                <p className="hint">
                  Límite consolidado {pesos(totalLimit)} · Headroom{" "}
                  {pesos(headroom)}
                </p>
                <div className="mini-track">
                  <div
                    className="mini-track-fill"
                    style={{ width: `${Math.round(utilization * 100)}%` }}
                  />
                </div>
                <span className="mini-tag">
                  Utilización {Math.round(utilization * 100)}%
                </span>
              </article>

              <article className="card kpi">
                <header className="card-head">
                  <span className="label">Costo promedio</span>
                </header>
                <div className="value">{(wavgRate * 100).toFixed(2)}%</div>
                <p className="hint">
                  Weighted average rate sobre deuda utilizada.
                </p>
                <div className="kpi-badges">
                  <span className="kpi-pill good">En rango mercado</span>
                  <span className="kpi-pill neutral">Mejorable vía swap</span>
                </div>
              </article>

              <article className="card kpi">
                <header className="card-head">
                  <span className="label">Próximos 90 días</span>
                </header>
                <div className="value">{pesos(410_000)}</div>
                <p className="hint">Pagos de capital + intereses.</p>
                <ul className="kpi-list">
                  <li>FAC-002 · {pesos(230_000)}</li>
                  <li>FAC-003 · {pesos(180_000)}</li>
                </ul>
              </article>

              <article className="card kpi">
                <header className="card-head">
                  <span className="label">Maturity profile</span>
                </header>
                <svg
                  className="ring"
                  width="86"
                  height="86"
                  viewBox="0 0 42 42"
                >
                  <circle className="ring-bg" cx="21" cy="21" r="16" />
                  {/* 65% expira después de 24m (ejemplo) */}
                  <circle
                    className="ring-fg"
                    cx="21"
                    cy="21"
                    r="16"
                    strokeDasharray={`${0.65 * 2 * Math.PI * 16} ${
                      2 * Math.PI * 16
                    }`}
                  />
                  <text x="21" y="23" textAnchor="middle">
                    65%
                  </text>
                </svg>
                <p className="hint">Expira después de 24 meses.</p>
              </article>
            </section>

            {/* MIDDLE – MATURITY LADDER + REFI */}
            <section className="cards two">
              <article className="card">
                <div className="card-head">
                  <h2>Maturity ladder</h2>
                  <span className="muted">Por bucket de vencimiento</span>
                </div>
                <div className="ladder">
                  {[
                    { label: "0–12 meses", v: 0.22, tone: "soon" },
                    { label: "13–24 meses", v: 0.33, tone: "mid" },
                    { label: "25–36 meses", v: 0.28, tone: "mid" },
                    { label: "37m+", v: 0.17, tone: "far" },
                  ].map((b) => (
                    <div className="ladder-row" key={b.label}>
                      <div className="ladder-label">{b.label}</div>
                      <div className="ladder-track">
                        <div
                          className={`ladder-fill ${b.tone}`}
                          style={{ width: `${b.v * 100}%` }}
                        />
                      </div>
                      <div className="ladder-val">
                        {Math.round(b.v * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="card">
                <div className="card-head">
                  <h2>Refinancing radar</h2>
                  <span className="muted">Oportunidades potenciales</span>
                </div>
                <ul className="radar-list">
                  <li>
                    <div className="radar-main">
                      <span className="radar-title">
                        FAC-003 · Revolving HSBC
                      </span>
                      <span className="radar-tag">2025–2026</span>
                    </div>
                    <p className="radar-note">
                      Vencimiento en 12 meses con tasa 19.5%. Podrías extender
                      plazo y bajar tasa con colateral adicional.
                    </p>
                  </li>
                  <li>
                    <div className="radar-main">
                      <span className="radar-title">
                        FAC-002 · Arrendamiento Banorte
                      </span>
                      <span className="radar-tag alt">Equipo pesado</span>
                    </div>
                    <p className="radar-note">
                      Analiza venta–leaseback de ciertos activos para mejorar
                      liquidez sin subir leverage contable.
                    </p>
                  </li>
                </ul>
                <div className="footer-cta">
                  <button className="btn btn-outline">
                    Ver detalle de ladder
                  </button>
                  <button className="btn btn-neon">
                    Generar plan de refinanciamiento
                  </button>
                </div>
              </article>
            </section>

            {/* BOTTOM – FACILITIES TABLE */}
            <section className="cards">
              <article className="card">
                <div className="card-head">
                  <h2>Facilities consolidadas</h2>
                </div>
                <div className="table">
                  <div className="trow thead">
                    <div>Facility</div>
                    <div>Acreedor</div>
                    <div>Tipo</div>
                    <div>Límite</div>
                    <div>Utilizado</div>
                    <div>Rate</div>
                    <div>Vencimiento</div>
                  </div>
                  {facilities.map((f) => (
                    <div className="trow" key={f.id}>
                      <div className="mono">{f.id}</div>
                      <div>{f.lender}</div>
                      <div>{f.type}</div>
                      <div className="mono">{pesos(f.limit)}</div>
                      <div className="mono">{pesos(f.used)}</div>
                      <div className="mono">
                        {(f.rate * 100).toFixed(2)}%
                      </div>
                      <div className="mono">{f.matDate}</div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </>
        )}

        {active === "facilities" && (
          <section className="cards two">
            <article className="card">
              <div className="card-head">
                <h2>Facilities & líneas</h2>
              </div>
              <div className="table">
                <div className="trow thead">
                  <div>Facility</div>
                  <div>Acreedor</div>
                  <div>Tipo</div>
                  <div>Límite</div>
                  <div>Utilizado</div>
                  <div>Rate</div>
                  <div>Vencimiento</div>
                </div>
                {facilities.map((f) => (
                  <div className="trow" key={f.id}>
                    <div className="mono">{f.id}</div>
                    <div>{f.lender}</div>
                    <div>{f.type}</div>
                    <div className="mono">{pesos(f.limit)}</div>
                    <div className="mono">{pesos(f.used)}</div>
                    <div className="mono">
                      {(f.rate * 100).toFixed(2)}%
                    </div>
                    <div className="mono">{f.matDate}</div>
                  </div>
                ))}
              </div>
            </article>

            <article className="card">
              <div className="card-head">
                <h2>Facility detail (preview)</h2>
              </div>
              <p className="muted">
                Aquí más adelante conectamos el click de la tabla para ver el
                detalle de una línea: cash-flows, covenants asociados,
                colaterales y escenarios de refinanciamiento.
              </p>
              <div className="footer-cta">
                <button className="btn btn-neon">
                  Ver mock de detalle de facility
                </button>
              </div>
            </article>
          </section>
        )}

        {active === "timeline" && (
          <section className="cards two">
            <article className="card">
              <div className="card-head">
                <h2>Liability timeline</h2>
              </div>
              <ul className="timeline">
                {events.map((e) => (
                  <li className="timeline-item" key={e.id}>
                    <div className="timeline-date mono">{e.date}</div>
                    <div className="timeline-main">
                      <span className="timeline-label">{e.label}</span>
                      <span className={`timeline-badge ${e.type}`}>
                        {e.type}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
            <article className="card">
              <div className="card-head">
                <h2>Alerts engine</h2>
              </div>
              <p className="muted">
                Próximamente: configuración granular de alertas por tipo de
                evento (pagos, vencimientos, rebases de covenants) con canales
                de envío (email, Slack, WhatsApp).
              </p>
            </article>
          </section>
        )}

        {active === "covenants" && (
          <section className="cards two">
            <article className="card">
              <div className="card-head">
                <h2>Resumen de covenants</h2>
              </div>
              <ul className="cov-list">
                {covenants.map((c) => (
                  <li className="cov-item" key={c.id}>
                    <div className="cov-main">
                      <span className="cov-label">{c.label}</span>
                      <span
                        className={`cov-pill ${
                          c.status === "ok"
                            ? "ok"
                            : c.status === "watch"
                            ? "watch"
                            : "risk"
                        }`}
                      >
                        {c.current}
                      </span>
                    </div>
                    <p className="cov-note">
                      {c.status === "ok" &&
                        "Dentro de rango. Mantener seguimiento trimestral."}
                      {c.status === "watch" &&
                        "Próximo al límite. Analiza reducir deuda o mejorar EBITDA."}
                      {c.status === "risk" &&
                        "Por debajo de umbral. Es clave un plan de acción con el banco."}
                    </p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="card">
              <div className="card-head">
                <h2>Policies</h2>
              </div>
              <p className="muted">
                Aquí puedes documentar tu propia política interna de
                endeudamiento: límites de concentración por banco, máximo
                apalancamiento permitido y criterios para tomar deuda nueva.
              </p>
            </article>
          </section>
        )}

        {active === "scenarios" && (
          <section className="cards two">
            <article className="card">
              <div className="card-head">
                <h2>Scenario lab</h2>
              </div>
              <p className="muted">
                Próxima etapa: simular escenarios de refinanciamiento,
                prepago, roll-over y cambios de tasa (TC, TIIE, SOFR) y ver el
                impacto en flujo, DSCR y métricas clave.
              </p>
              <div className="footer-cta">
                <button className="btn btn-neon">
                  Diseñar estructura del simulador
                </button>
              </div>
            </article>
            <article className="card">
              <div className="card-head">
                <h2>Escenarios guardados</h2>
              </div>
              <p className="muted">
                Aquí aparecerán los escenarios que guardes: “Swap BBVA 2026”,
                “Reperfilamiento arrendamiento equipo”, etc.
              </p>
            </article>
          </section>
        )}

        {active === "settings" && (
          <section className="cards two">
            <article className="card">
              <div className="card-head">
                <h2>Workspace</h2>
              </div>
              <p className="muted">
                Configura nombre de la empresa, monedas, zona horaria y equipo
                con acceso al módulo de liability management.
              </p>
            </article>
            <article className="card">
              <div className="card-head">
                <h2>Integraciones</h2>
              </div>
              <p className="muted">
                Próximamente: conexión con bancos, ERP y facturación para traer
                posiciones vivas y vencimientos en tiempo casi real.
              </p>
            </article>
          </section>
        )}
      </main>
    </div>
  );
}
