// src/App.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./assets/css/theme.css";
import plogo from "./assets/images/plogo.png";

/* =======================
   Inline Icons (sin librerías)
======================= */
function IconSpark(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" {...props}>
      <path
        d="M12 2l1.2 5.2L18 9l-4.8 1.8L12 16l-1.2-5.2L6 9l4.8-1.8L12 2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M4 13l.7 3L7 17l-2.3 1-.7 3-.7-3L1 17l2.3-1L4 13z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity=".8"
      />
      <path
        d="M19 13l.7 3L22 17l-2.3 1-.7 3-.7-3L16 17l2.3-1L19 13z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity=".8"
      />
    </svg>
  );
}
function IconBolt(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" {...props}>
      <path
        d="M13 2L3 14h8l-1 8 11-14h-8l0-6z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconShield(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" {...props}>
      <path
        d="M12 2l8 4v6c0 5-3.2 9.4-8 10-4.8-.6-8-5-8-10V6l8-4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 12.2l1.8 1.8 3.8-3.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconLayout(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" {...props}>
      <path
        d="M4 5h16v14H4V5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M4 9h16M9 9v10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity=".9"
      />
    </svg>
  );
}
function IconRadar(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" {...props}>
      <path
        d="M12 21a9 9 0 1 1 9-9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 18a6 6 0 1 1 6-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity=".85"
      />
      <path
        d="M12 12l6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

/* =======================
   React FX: Tilt + Glow follow
======================= */
function useCardFX() {
  const onMove = (e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    // glow follow
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);

    // tilt
    const px = (x / r.width) * 2 - 1; // -1..1
    const py = (y / r.height) * 2 - 1; // -1..1
    const tilt = 7; // grados
    el.style.setProperty("--rx", `${(-py * tilt).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * tilt).toFixed(2)}deg`);
  };

  const onLeave = (e) => {
    const el = e.currentTarget;
    el.style.setProperty("--rx", `0deg`);
    el.style.setProperty("--ry", `0deg`);
    el.style.setProperty("--mx", `50%`);
    el.style.setProperty("--my", `50%`);
  };

  return { onMove, onLeave };
}

/* =======================
   React FX: CountUp on visible
======================= */
function CountUp({ value = 0, suffix = "", duration = 900 }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let start = 0;
    let done = false;

    const startAnim = () => {
      if (done) return;
      done = true;

      const target = Number(value) || 0;
      const from = 0;

      const step = (t) => {
        if (!start) start = t;
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        const cur = from + (target - from) * eased;
        setN(cur);
        if (p < 1) raf = requestAnimationFrame(step);
      };

      raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) startAnim();
        });
      },
      { threshold: 0.35, rootMargin: "0px 0px -10% 0px" }
    );

    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [value, duration]);

  const isInt = Number.isInteger(Number(value));
  const shown = isInt ? Math.round(n) : n.toFixed(1);

  return (
    <span ref={ref}>
      {shown}
      {suffix}
    </span>
  );
}

/* =======================
   Hero Visual (Monitor + 360° Console)
======================= */
/* =======================
   Hero Visual (Dashboard)
======================= */
function HeroDashboard() {
  return (
    <div className="hero-visual hero-visual-dash" aria-hidden="true">
      <div className="monitor">
        <div className="monitor-top">
          <div className="monitor-brand">
            <span className="monitor-brandDot" />
            <span className="monitor-brandTxt">Plinius Console</span>
          </div>
          <div className="monitor-cam" />
        </div>

        <div className="monitor-screen dash">
          <div className="monitor-reflection" />

          {/* Topbar */}
          <div className="dash-topbar">
            <div className="dash-crumbs">
              <span className="dash-pill">Dashboard</span>
              <span className="dash-sep">/</span>
              <span className="dash-muted">Perfil de pasivos</span>
            </div>

            <div className="dash-actions">
              <span className="dash-badge">Audit trail</span>
              <span className="dash-badge">Alerts</span>
              <span className="dash-avatar" title="Admin" />
            </div>
          </div>

          {/* Body */}
          <div className="dash-body">
            {/* Sidebar */}
            <aside className="dash-sidebar">
              <div className="dash-brandMini">
                <span className="dash-logoDot" />
                <div>
                  <div className="dash-brandName">Plinius</div>
                  <div className="dash-brandSub">Financial OS</div>
                </div>
              </div>

              <nav className="dash-nav">
                <a className="dash-navItem isActive">Overview</a>
                <a className="dash-navItem">Pasivos</a>
                <a className="dash-navItem">Calendario</a>
                <a className="dash-navItem">Covenants</a>
                <a className="dash-navItem">Documentos</a>
                <a className="dash-navItem">Reportes</a>
              </nav>

              <div className="dash-sideCard">
                <div className="dash-sideTitle">Estado</div>
                <div className="dash-sideRow">
                  <span className="dash-dot live" />
                  <span>Señales en monitoreo</span>
                </div>
                <div className="dash-sideMeta">Última actualización: hoy</div>
              </div>
            </aside>

            {/* Main */}
            <section className="dash-main">
              <div className="dash-kpis">
                <div className="dash-kpiCard">
                  <div className="dash-kpiLabel">Deuda total</div>
                  <div className="dash-kpiValue">$12.4m</div>
                  <div className="dash-kpiMeta">consolidada</div>
                </div>

                <div className="dash-kpiCard">
                  <div className="dash-kpiLabel">Costo promedio</div>
                  <div className="dash-kpiValue">18.2%</div>
                  <div className="dash-kpiMeta">ponderado</div>
                </div>

                <div className="dash-kpiCard">
                  <div className="dash-kpiLabel">DSCR</div>
                  <div className="dash-kpiValue">1.36x</div>
                  <div className="dash-kpiMeta">últimos 3M</div>
                </div>
              </div>

              <div className="dash-grid">
                {/* Chart */}
                <div className="dash-card dash-cardChart">
                  <div className="dash-cardHead">
                    <div>
                      <div className="dash-cardTitle">Perfil de vencimientos</div>
                      <div className="dash-cardSub">maturity ladder · próximos 24 meses</div>
                    </div>
                    <div className="dash-miniPills">
                      <span className="dash-miniPill">12m</span>
                      <span className="dash-miniPill isOn">24m</span>
                      <span className="dash-miniPill">36m</span>
                    </div>
                  </div>

                  <div className="dash-bars" aria-hidden="true">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <span
                        key={i}
                        className="dash-bar"
                        style={{
                          height: `${28 + ((i * 17) % 58)}%`,
                          opacity: i % 5 === 0 ? 0.95 : 0.78,
                        }}
                      />
                    ))}
                  </div>

                  <div className="dash-footnote">
                    <span className="dash-dot" />
                    <span>Concentración y picos detectados automáticamente</span>
                  </div>
                </div>

                {/* Right panel */}
                <div className="dash-card dash-cardSide">
                  <div className="dash-cardHead">
                    <div>
                      <div className="dash-cardTitle">Decisión de financiamiento</div>
                      <div className="dash-cardSub">opciones comparables, mismo marco</div>
                    </div>
                    <span className="dash-score">Score 8.7</span>
                  </div>

                  <div className="dash-split">
                    <div className="dash-donut" aria-hidden="true">
                      <div className="dash-donutInner">
                        <div className="dash-donutBig">3</div>
                        <div className="dash-donutLbl">alternativas</div>
                      </div>
                    </div>

                    <div className="dash-metrics">
                      <div className="dash-metric">
                        <span className="dash-metricLbl">Riesgo</span>
                        <b className="dash-metricVal">Controlado</b>
                      </div>
                      <div className="dash-metric">
                        <span className="dash-metricLbl">Transparencia</span>
                        <b className="dash-metricVal">Alta</b>
                      </div>
                      <div className="dash-metric">
                        <span className="dash-metricLbl">Siguientes pasos</span>
                        <b className="dash-metricVal">2 acciones</b>
                      </div>
                    </div>
                  </div>

                  <div className="dash-list">
                    <div className="dash-row">
                      <b>Refinanciar pico</b>
                      <span>↓ estrés 6M</span>
                    </div>
                    <div className="dash-row">
                      <b>Unificar pasivos</b>
                      <span>↓ costo prom.</span>
                    </div>
                    <div className="dash-row">
                      <b>Calendarizar covenants</b>
                      <span>↓ sorpresas</span>
                    </div>
                  </div>

                  <div className="dash-footnote">
                    <span className="dash-dot live" />
                    <span>Vista demo — UI lista para producto real</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="pc-status pc-status-dash">
            <span className="dot live" />
            <span className="label">Dashboard interactivo (demo)</span>
          </div>
        </div>

        <div className="monitor-stand">
          <div className="stand-neck" />
          <div className="stand-base" />
        </div>
      </div>

      <div className="monitor-shadow" />
    </div>
  );
}


export default function App() {
  const location = useLocation();

  /* Reveal on scroll */
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in");
          else e.target.classList.remove("in");
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* Scroll to hash sections */
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;
    setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, [location.hash]);

  const about = useMemo(
    () => [
      {
        icon: <IconBolt className="box-icon" />,
        title: "Velocidad real",
        text: "Del intake a oferta: menos fricción, más claridad. Checklist + validaciones para no rebotarte.",
        meta: "SLA",
        stats: [
          { label: "Objetivo", value: 48, suffix: "h" },
          { label: "Tiempo por paso", value: 1.2, suffix: "s" },
        ],
        chips: ["Carga de docs", "Checklist", "Seguimiento"],
      },
      {
        icon: <IconLayout className="box-icon" />,
        title: "Un panel para todo",
        text: "Docs, estatus, términos, vencimientos y comunicación en un mismo lugar. Menos correos, más control.",
        meta: "Control",
        stats: [
          { label: "Paneles", value: 1, suffix: "" },
          { label: "Trazabilidad", value: 100, suffix: "%" },
        ],
        chips: ["Dashboard", "Historial", "Alertas"],
      },
      {
        icon: <IconShield className="box-icon" />,
        title: "Estructura con sentido",
        text: "Condiciones alineadas al flujo. Calendarios, covenants y fees visibles para que no te “sorprendan”.",
        meta: "Cashflow",
        stats: [
          { label: "DSCR min", value: 1.2, suffix: "x" },
          { label: "Plazo", value: 36, suffix: "m" },
        ],
        chips: ["Covenants", "Calendarios", "Términos claros"],
      },
    ],
    []
  );

  const focus = useMemo(
    () => [
      {
        icon: <IconRadar className="box-icon" />,
        title: "Criterio: flujo + operación",
        text: "No es magia: es capacidad de pago. Priorizamos señales que sí explican riesgo y continuidad operativa.",
        bullets: [
          "Flujo libre + estacionalidad (no “foto” mensual)",
          "Concentración de clientes/proveedores y margen",
          "Riesgo operativo (ciclos, inventario, cobranza)",
        ],
        chips: ["Cash-flow first", "Señales", "Riesgo real"],
        stats: [
          { label: "Variables clave", value: 18, suffix: "+" },
          { label: "Alerts", value: 6, suffix: "+" },
        ],
      },
      {
        icon: <IconSpark className="box-icon" />,
        title: "Decisión: clara y accionable",
        text: "Sí / no / sí-pero-así. Con razón concreta, ajuste directo y siguientes pasos para cerrar rápido.",
        bullets: [
          "Oferta estructurada (términos comparables)",
          "Siguientes pasos claros (docs faltantes / ajustes)",
          "Transparencia en fees y calendario",
        ],
        chips: ["Oferta", "Siguientes pasos", "Cierre"],
        stats: [
          { label: "Iteraciones", value: 2, suffix: " max" },
          { label: "Respuesta", value: 48, suffix: "h" },
        ],
      },
    ],
    []
  );

  const fx = useCardFX();

  return (
    <div className="app-container">
      <Navbar />

      {/* ---------- HERO ---------- */}
      {/* ---------- HERO ---------- */}
<main className="hero">
  <div className="hero-bg" aria-hidden />
  <div className="hero-grid" aria-hidden />

  <div className="hero-inner">
    <header className="hero-header">
      <div className="hero-miniBrand">
        <img src={plogo} alt="Plinius" className="hero-miniLogo" />
        <span className="hero-miniText">Perfil de pasivos · decisiones claras</span>
        <span className="hero-miniDot" aria-hidden />
        <span className="hero-miniTag">Plataforma</span>
      </div>

      <h1>
        Plinius
        <br />
        <span className="hero-highlight">Financiamiento con claridad.</span>
      </h1>

      <p className="hero-sub">
        Plinius es la plataforma de financiamiento que, además de ayudarte a obtener capital, te da una consola para visualizar el
        perfil de pasivos de tu negocio y tomar la mejor decisión.
      </p>

      <div className="hero-cta-row">
        <Link to="/#sobre-plinius" className="btn btn-neon">
          Ver la plataforma
        </Link>
        <Link to="/#enfoque" className="btn btn-outline">
          Ver cómo decidimos
        </Link>
      </div>

      <div className="hero-badges">
        <span className="hero-badge">Perfil de pasivos</span>
        <span className="hero-badge">Calendario de deuda</span>
        <span className="hero-badge">Covenants</span>
        <span className="hero-badge">Decisión accionable</span>
      </div>

      <div className="trust-strip">
        <div className="trust-pill">
          <span className="trust-kpi">1</span>
          <span className="trust-label">dashboard para todo</span>
        </div>

        <div className="trust-pill">
          <span className="trust-kpi">24m</span>
          <span className="trust-label">maturity ladder</span>
        </div>
      </div>
    </header>

    <HeroDashboard />
  </div>
</main>


      {/* ---------- SOBRE PLINIUS ---------- */}
      <section className="section section-lg about reveal reveal-left" id="sobre-plinius">
        <div className="section-inner">
          <header className="section-head section-head-lg">
            <h2>Sobre Plinius</h2>
            <p className="section-sub">
              Infra financiera para crédito empresarial: intake, validación, estructura y seguimiento — con obsesión por claridad.
            </p>
          </header>

          <div className="box-grid box-grid-lg">
            {about.map((b, idx) => (
              <article
                className="box pCard"
                key={b.title}
                onMouseMove={fx.onMove}
                onMouseLeave={fx.onLeave}
                style={{ transitionDelay: `${idx * 90}ms` }}
              >
                <div className="pCardTop">
                  <div className="box-iconWrap">{b.icon}</div>
                  <div className="box-meta">{b.meta}</div>
                </div>

                <h3>{b.title}</h3>
                <p>{b.text}</p>

                <div className="pStats">
                  {b.stats.map((s) => (
                    <div className="pStat" key={s.label}>
                      <div className="pStatNum">
                        <CountUp value={s.value} suffix={s.suffix} />
                      </div>
                      <div className="pStatLbl">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="pChips">
                  {b.chips.map((c) => (
                    <span className="pChip" key={c}>
                      {c}
                    </span>
                  ))}
                </div>

                <div className="pCardFoot">
                  <span className="pPulseDot" />
                  <span>Listo para solicitud y seguimiento sin fricción</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- ENFOQUE Y CRITERIOS ---------- */}
      <section className="section section-lg focus reveal reveal-right" id="enfoque">
        <div className="section-inner">
          <header className="section-head section-head-lg">
            <h2>Enfoque y criterios</h2>
            <p className="section-sub">
              Menos “story”, más señales. Evaluación práctica para estructurar crédito que sí aguanta el flujo real.
            </p>
          </header>

          <div className="focus-grid focus-grid-lg">
            {focus.map((c, idx) => (
              <article
                className="focus-card pCard"
                key={c.title}
                onMouseMove={fx.onMove}
                onMouseLeave={fx.onLeave}
                style={{ transitionDelay: `${idx * 110}ms` }}
              >
                <div className="focus-head focus-head-lg">
                  <div className="box-iconWrap">{c.icon}</div>
                  <div>
                    <h3>{c.title}</h3>
                    <p>{c.text}</p>
                  </div>
                </div>

                <div className="pStats pStatsCompact">
                  {c.stats.map((s) => (
                    <div className="pStat" key={s.label}>
                      <div className="pStatNum">
                        <CountUp value={s.value} suffix={s.suffix} />
                      </div>
                      <div className="pStatLbl">{s.label}</div>
                    </div>
                  ))}
                </div>

                <ul className="focus-list focus-list-lg">
                  {c.bullets.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>

                <div className="pChips">
                  {c.chips.map((x) => (
                    <span className="pChip" key={x}>
                      {x}
                    </span>
                  ))}
                </div>

                <div className="pCardFoot">
                  <span className="pPulseDot" />
                  <span>Decisión = razón concreta + siguientes pasos</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="section faq reveal reveal-left" id="faq">
        <div className="section-inner">
          <header className="section-head">
            <h2>FAQ</h2>
            <p className="section-sub">Lo típico que te preguntarías (y sí, aquí va directo).</p>
          </header>

          <div className="faq-grid">
            <details className="faq-item">
              <summary>¿Qué necesito para que sí salga en 48 horas?</summary>
              <div className="faq-body">
                Estados de cuenta, estados financieros (aunque sea internos), y claridad del uso del crédito. Entre más completo,
                más rápido.
              </div>
            </details>

            <details className="faq-item">
              <summary>¿Cómo se ve el seguimiento?</summary>
              <div className="faq-body">
                En tu dashboard: docs, estatus, historial y claridad de lo que sigue. Cero “¿me lo reenvías?”.
              </div>
            </details>

            <details className="faq-item">
              <summary>¿Qué significa “respuesta clara”?</summary>
              <div className="faq-body">
                “Sí”, “no” o “sí, pero así”. Con razón concreta, comparación simple y siguientes pasos.
              </div>
            </details>

            <details className="faq-item">
              <summary>¿Tasa promedio?</summary>
              <div className="faq-body">
                Depende de la capacidad de pago y el caso. Podemos darte rango desde el simulador y afinar con documentos.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* ---------- CTA FINAL ---------- */}
      <section className="section final-cta reveal reveal-up">
        <div className="section-inner final-cta-inner">
          <div>
            <h2>¿Listo para una oferta que sí te quede?</h2>
            <p className="section-sub">Haz la solicitud. Nosotros nos encargamos de estructurarla con sentido.</p>
          </div>

          <div className="cta-inline">
            <Link to="/ingresar" className="btn btn-neon">
              Iniciar solicitud
            </Link>
            <Link to="/simulador" className="btn btn-outline">
              Simular crédito
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
