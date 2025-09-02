// src/pages/Dashboard.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/dashboard.css";

/* ====== Iconos minimalistas (sin emojis) ====== */
function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    className: "ni",
  };
  switch (name) {
    case "panel":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="8" height="8" rx="2" />
          <rect x="13" y="3" width="8" height="5" rx="2" />
          <rect x="13" y="10" width="8" height="11" rx="2" />
          <rect x="3" y="13" width="8" height="8" rx="2" />
        </svg>
      );
    case "creditos":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M3 9h18" />
          <circle cx="8" cy="14" r="1.5" />
          <circle cx="14" cy="14" r="1.5" />
        </svg>
      );
    case "score":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 1 9 9" />
          <path d="M12 12l6-2" />
        </svg>
      );
    case "docs":
      return (
        <svg {...common}>
          <rect x="5" y="3" width="12" height="18" rx="2" />
          <path d="M8 7h8M8 11h8M8 15h6" />
        </svg>
      );
    case "sim":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="14" rx="2" />
          <path d="M6 13l4-4 3 3 5-5" />
        </svg>
      );
    case "pagos":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l4 2" />
        </svg>
      );
    case "config":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1-1.6 2.8- .1.1a1 1 0 0 0-1.1.2l-.1.1-3-.7a8 8 0 0 1-1.4.8l-.5 3.1h-3l-.5-3.1a8 8 0 0 1-1.4-.8l-3 .7-.1-.1a1 1 0 0 0-1.1-.2l-.1-.1L4.3 16a1 1 0 0 0 .2-1.1 8 8 0 0 1 0-2.0A1 1 0 0 0 4.3 12l-1.6-2.8.1-.1a1 1 0 0 0 1.1-.2l.1-.1 3 .7a8 8 0 0 1 1.4-.8L9 3.7h3l.5 3.1a8 8 0 0 1 1.4.8l3-.7.1.1a1 1 0 0 0 1.1.2l.1.1L19.7 12a1 1 0 0 0-.2 1.1 8 8 0 0 1 0 2z"
            stroke="none"
            fill="currentColor"
          />
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

/* ====== Datos fake mínimos ====== */
const loans = [
  {
    id: "PLN-00124",
    cliente: "Abarrotes Del Mar",
    monto: 1250000,
    estado: "En revisión",
    plazo: 24,
    tasa: 24.0,
    cat: 28.4,
  },
  {
    id: "PLN-00125",
    cliente: "TransLogix SA",
    monto: 3200000,
    estado: "Aprobado",
    plazo: 36,
    tasa: 22.5,
    cat: 27.1,
  },
  {
    id: "PLN-00126",
    cliente: "Maquila Norte",
    monto: 900000,
    estado: "Solicitado",
    plazo: 18,
    tasa: 26.0,
    cat: 30.5,
  },
];

const pesos = (x) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(x);

export default function Dashboard() {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState("panel");
  const navigate = useNavigate();

  const progress = useMemo(() => {
    const total = loans.length;
    const aprobados = loans.filter((l) => l.estado === "Aprobado").length;
    return total ? Math.round((aprobados / total) * 100) : 0;
  }, []);

  return (
    <div className={`dash${open ? " is-open" : ""}`}>
      {/* NAV LATERAL (aislado, sin Navbar/Footer globales) */}
      <aside className={`dash-nav ${open ? "is-open" : ""}`}>
        <div className="nav-head">
          <div className="mark" aria-hidden />
          <button
            className="nav-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-label="Expandir/contraer menú"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <nav className="nav-list">
          {[
            { key: "panel", label: "Panel", icon: "panel" },
            { key: "creditos", label: "Créditos", icon: "creditos" },
            { key: "score", label: "Calificación", icon: "score" },
            { key: "docs", label: "Documentos", icon: "docs" },
            { key: "sim", label: "Simulador", icon: "sim" },
            { key: "pagos", label: "Pagos", icon: "pagos" },
            { key: "config", label: "Configuración", icon: "config" },
          ].map((item) => (
            <button
              key={item.key}
              className={`nav-item ${active === item.key ? "active" : ""}`}
              onClick={() => setActive(item.key)}
            >
              <Icon name={item.icon} />
              <span className="nl">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="nav-spacer" />
        <button
          className="nav-item logout"
          onClick={() => navigate("/ingresar")}
        >
          <Icon name="config" />
          <span className="nl">Cerrar sesión</span>
        </button>
      </aside>

      {/* MAIN */}
      <main className="dash-main">
        <div className="dash-top">
          <div className="btngrp">
            <button
              className="ghost hamb"
              onClick={() => setOpen((o) => !o)}
              aria-label="Menú"
            >
              <span />
              <span />
              <span />
            </button>
            <h1 className="title">
              {active === "panel" && "Panel de control"}
              {active === "creditos" && "Créditos"}
              {active === "score" && "Calificación crediticia"}
              {active === "docs" && "Documentos"}
              {active === "sim" && "Simulador"}
              {active === "pagos" && "Pagos"}
              {active === "config" && "Configuración"}
            </h1>
          </div>

          <div className="right">
            <div className="search">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input placeholder="Buscar…" />
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

        {/* CONTENIDO DINÁMICO */}
        {active === "panel" && (
          <>
            <section className="cards kpis">
              <article className="card kpi">
                <header>
                  <span className="label">Créditos activos</span>
                </header>
                <div className="value">2</div>
                <div className="hint">Total gestionado {pesos(4_450_000)}</div>
              </article>
              <article className="card kpi">
                <header>
                  <span className="label">Aprobación</span>
                </header>
                <svg
                  className="ring"
                  width="86"
                  height="86"
                  viewBox="0 0 42 42"
                  role="img"
                  aria-label={`Aprobación ${progress}%`}
                >
                  <circle className="ring-bg" cx="21" cy="21" r="16" />
                  <circle
                    className="ring-fg"
                    cx="21"
                    cy="21"
                    r="16"
                    strokeDasharray={`${(progress / 100) * 2 * Math.PI * 16} ${
                      2 * Math.PI * 16
                    }`}
                  />
                  <text x="21" y="23" textAnchor="middle">
                    {progress}%
                  </text>
                </svg>
                <div className="hint">Sobre solicitudes en curso</div>
              </article>
              <article className="card kpi">
                <header>
                  <span className="label">CAT promedio</span>
                </header>
                <div className="value">27.3%</div>
                <div className="hint">Indicativo, sin IVA</div>
              </article>
              <article className="card kpi">
                <header>
                  <span className="label">Documentos</span>
                </header>
                <div className="value">3 pendientes</div>
                <div className="hint">Última carga hace 2 días</div>
              </article>
            </section>

            <section className="cards two">
              {/* Proceso resumido */}
              <article className="card">
                <div className="card-head">
                  <h2>Proceso actual</h2>
                </div>
                <div className="process">
                  <div className="process-top">
                    <span className="pid mono">PLN-00126</span>
                    <span className="ptitle">
                      Crédito simple — Maquila Norte
                    </span>
                    <span className="pmeta">18m · {pesos(900_000)}</span>
                  </div>
                  <div className="steps">
                    <div className="step done">
                      <div className="node" />
                      <div className="bar" />
                      <div className="sname">Solicitud</div>
                    </div>
                    <div className="step done">
                      <div className="node" />
                      <div className="bar" />
                      <div className="sname">Documentación</div>
                    </div>
                    <div className="step">
                      <div className="node" />
                      <div className="bar" />
                      <div className="sname">Comité</div>
                    </div>
                    <div className="step">
                      <div className="node" />
                      <div className="sname">Firma & Dispersión</div>
                    </div>
                  </div>
                  <div className="lprog" aria-hidden>
                    <div className="lprog__fill" style={{ width: "55%" }} />
                  </div>
                </div>
              </article>

              {/* Tabla rápida */}
              <article className="card">
                <div className="card-head">
                  <h2>Créditos recientes</h2>
                </div>
                <div className="table">
                  <div className="trow thead">
                    <div>ID</div>
                    <div>Cliente</div>
                    <div>Monto</div>
                    <div>Plazo</div>
                    <div>Tasa</div>
                    <div>Estado</div>
                    <div>CAT</div>
                  </div>
                  {loans.map((l) => (
                    <div className="trow" key={l.id}>
                      <div className="mono">{l.id}</div>
                      <div>{l.cliente}</div>
                      <div className="mono">{pesos(l.monto)}</div>
                      <div className="mono">{l.plazo}m</div>
                      <div className="mono">{l.tasa.toFixed(1)}%</div>
                      <div>
                        <span
                          className={`chip ${
                            l.estado === "Aprobado" ? "ok" : ""
                          }`}
                        >
                          {l.estado}
                        </span>
                      </div>
                      <div className="mono">{l.cat.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </>
        )}

        {active === "creditos" && (
          <section className="cards">
            <article className="card">
              <div className="card-head">
                <h2>Todos los créditos</h2>
              </div>
              <div className="table">
                <div className="trow thead">
                  <div>ID</div>
                  <div>Cliente</div>
                  <div>Monto</div>
                  <div>Plazo</div>
                  <div>Tasa</div>
                  <div>Estado</div>
                  <div>CAT</div>
                </div>
                {loans.map((l) => (
                  <div className="trow" key={l.id}>
                    <div className="mono">{l.id}</div>
                    <div>{l.cliente}</div>
                    <div className="mono">{pesos(l.monto)}</div>
                    <div className="mono">{l.plazo}m</div>
                    <div className="mono">{l.tasa.toFixed(1)}%</div>
                    <div>
                      <span
                        className={`chip ${
                          l.estado === "Aprobado" ? "ok" : ""
                        }`}
                      >
                        {l.estado}
                      </span>
                    </div>
                    <div className="mono">{l.cat.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {active === "score" && (
          <section className="cards two">
            <article className="card">
              <div className="card-head">
                <h2>Calificación</h2>
              </div>
              <div className="score">
                <div className="score-ring">
                  <svg
                    className="ring"
                    width="140"
                    height="140"
                    viewBox="0 0 42 42"
                  >
                    <circle className="ring-bg" cx="21" cy="21" r="16" />
                    <circle
                      className="ring-fg"
                      cx="21"
                      cy="21"
                      r="16"
                      strokeDasharray={`${0.74 * 2 * Math.PI * 16} ${
                        2 * Math.PI * 16
                      }`}
                    />
                  </svg>
                  <div className="score-num">
                    <strong>742</strong>
                    <span>Bueno</span>
                  </div>
                </div>
                <div className="score-bars">
                  {[
                    { label: "Flujo / SD (DSCR)", v: 0.68 },
                    { label: "Apalancamiento", v: 0.55 },
                    { label: "Historial pagos", v: 0.82 },
                    { label: "Concentración", v: 0.61 },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="sbar-top">
                        <span>{s.label}</span>
                        <span>{Math.round(s.v * 100)}%</span>
                      </div>
                      <div className="sbar-track">
                        <div
                          className="sbar-fill"
                          style={{ width: `${s.v * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="card">
              <div className="card-head">
                <h2>Documentos</h2>
              </div>
              <ul className="tasks">
                <li className="task">
                  <span className="dot" />
                  <div className="tmain">
                    <span>Estados financieros auditados</span>
                    <span className="badge ok">Entregado</span>
                  </div>
                </li>
                <li className="task">
                  <span className="dot" />
                  <div className="tmain">
                    <span>Constancia de situación fiscal</span>
                    <span className="badge warn">En revisión</span>
                  </div>
                </li>
                <li className="task">
                  <span className="dot" />
                  <div className="tmain">
                    <span>Identificación representante legal</span>
                    <span className="badge pending">Pendiente</span>
                  </div>
                </li>
              </ul>
              <div className="footer-cta">
                <button className="btn btn-outline">Ver checklist</button>
                <button className="btn btn-neon">Subir archivos</button>
              </div>
            </article>
          </section>
        )}

        {active === "docs" && (
          <section className="cards">
            <article className="card">
              <div className="card-head">
                <h2>Documentación</h2>
              </div>
              <ul className="tasks">
                <li className="task">
                  <span className="dot" />
                  <div className="tmain">
                    <span>Poderes notariales</span>
                    <span className="badge warn">En revisión</span>
                  </div>
                </li>
                <li className="task">
                  <span className="dot" />
                  <div className="tmain">
                    <span>EEFF 2022–2024</span>
                    <span className="badge ok">Entregado</span>
                  </div>
                </li>
                <li className="task">
                  <span className="dot" />
                  <div className="tmain">
                    <span>Relación de clientes (Top 10)</span>
                    <span className="badge pending">Pendiente</span>
                  </div>
                </li>
              </ul>
            </article>
          </section>
        )}

        {active === "sim" && (
          <section className="cards two">
            <article className="card">
              <div className="card-head">
                <h2>Simulador rápido</h2>
              </div>
              <p className="muted">
                Integraremos aquí el mismo motor del wizard con presets.
              </p>
              <div className="footer-cta">
                <button className="btn btn-neon">Abrir wizard</button>
              </div>
            </article>
            <article className="card">
              <div className="card-head">
                <h2>Escenarios guardados</h2>
              </div>
              <p className="muted">
                Pronto podrás guardar y comparar escenarios.
              </p>
            </article>
          </section>
        )}

        {active === "pagos" && (
          <section className="cards">
            <article className="card">
              <div className="card-head">
                <h2>Calendario de pagos</h2>
              </div>
              <div className="table">
                <div className="trow thead">
                  <div>Fecha</div>
                  <div>Crédito</div>
                  <div>Monto</div>
                  <div>Estado</div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
                {[
                  {
                    f: "2025-10-15",
                    id: "PLN-00125",
                    m: 178000,
                    e: "Programado",
                  },
                  {
                    f: "2025-10-22",
                    id: "PLN-00124",
                    m: 62000,
                    e: "Programado",
                  },
                ].map((r) => (
                  <div className="trow" key={r.id + r.f}>
                    <div className="mono">{r.f}</div>
                    <div className="mono">{r.id}</div>
                    <div className="mono">{pesos(r.m)}</div>
                    <div>
                      <span className="chip">{r.e}</span>
                    </div>
                    <div />
                    <div />
                    <div />
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {active === "config" && (
          <section className="cards two">
            <article className="card">
              <div className="card-head">
                <h2>Preferencias</h2>
              </div>
              <p className="muted">
                Notificaciones, empresa, equipos y accesos vendrán aquí.
              </p>
            </article>
            <article className="card">
              <div className="card-head">
                <h2>Integraciones</h2>
              </div>
              <p className="muted">
                API bancaria y de facturación próximamente.
              </p>
            </article>
          </section>
        )}
      </main>
    </div>
  );
}
