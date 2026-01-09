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
function Platform360() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="monitor">
        <div className="monitor-top">
          <div className="monitor-brand">
            <span className="monitor-brandDot" />
            <span className="monitor-brandTxt">Plinius Console</span>
          </div>
          <div className="monitor-cam" />
        </div>

        <div className="monitor-screen">
          <div className="monitor-reflection" />
          <div className="screen-header">
            <div className="screen-title">
              <span className="screen-kicker">360° Plataforma</span>
              <b className="screen-headline">Crédito empresarial — monitoreo y decisión</b>
            </div>
            <div className="screen-badges">
              <span className="sBadge">KYC</span>
              <span className="sBadge">OCR</span>
              <span className="sBadge">Audit Trail</span>
            </div>
          </div>

          <div className="orbit">
            <div className="orbit-ring ring-1" />
            <div className="orbit-ring ring-2" />
            <div className="orbit-ring ring-3" />

            <div className="platform platform-a">
              <div className="ui-top">
                <span className="ui-pill">Risk Engine</span>
                <span className="ui-pill dim">Signals</span>
                <span className="ui-pill dim">Score</span>
              </div>

              <div className="ui-body">
                <div className="ui-kpi2">
                  <div>
                    <div className="kpiLabel">Latency</div>
                    <div className="kpiValue">&lt; 1.2s</div>
                  </div>
                  <div>
                    <div className="kpiLabel">Decision SLA</div>
                    <div className="kpiValue">48h</div>
                  </div>
                </div>

                <div className="ui-code">
                  <div className="codeLine">
                    <span className="codeKey">model</span>
                    <span className="codeVal">cashflow_v2</span>
                  </div>
                  <div className="codeLine">
                    <span className="codeKey">dscr_min</span>
                    <span className="codeVal">1.20x</span>
                  </div>
                  <div className="codeLine">
                    <span className="codeKey">alerts</span>
                    <span className="codeVal">concentration, seasonality</span>
                  </div>
                </div>

                <div className="ui-row">
                  <div className="ui-chip">Bancos</div>
                  <div className="ui-chip">CFDI / SAT</div>
                  <div className="ui-chip">Buró</div>
                </div>
              </div>
            </div>

            <div className="platform platform-b">
              <div className="ui-top">
                <span className="ui-pill">Workflow</span>
                <span className="ui-pill dim">Docs</span>
                <span className="ui-pill dim">Tasks</span>
              </div>

              <div className="ui-body">
                <div className="ui-cardMini">
                  <div className="ui-miniTitle">Documentos</div>
                  <div className="ui-progress">
                    <i style={{ width: "78%" }} />
                  </div>
                  <div className="ui-miniMeta">checklist 78%</div>
                </div>

                <div className="ui-cardMini">
                  <div className="ui-miniTitle">Validaciones</div>
                  <div className="ui-progress">
                    <i style={{ width: "54%" }} />
                  </div>
                  <div className="ui-miniMeta">KYC / AML / firmas</div>
                </div>

                <div className="ui-note">
                  <span className="ui-dot" />
                  trazabilidad por evento
                </div>
              </div>
            </div>

            <div className="platform platform-c">
              <div className="ui-top">
                <span className="ui-pill">Terms</span>
                <span className="ui-pill dim">Covenants</span>
                <span className="ui-pill dim">Calendar</span>
              </div>

              <div className="ui-body">
                <div className="ui-table">
                  <div className="ui-tr">
                    <b>Amort</b>
                    <span>mensual</span>
                  </div>
                  <div className="ui-tr">
                    <b>Plazo</b>
                    <span>12–36m</span>
                  </div>
                  <div className="ui-tr">
                    <b>DSCR</b>
                    <span>&ge; 1.20x</span>
                  </div>
                </div>

                <div className="ui-row">
                  <div className="ui-chip">Fees visibles</div>
                  <div className="ui-chip">Cláusulas claras</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pc-status">
            <span className="dot live" />
            <span className="label">Vista interactiva (360°)</span>
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
      <main className="hero">
        <div className="hero-bg" aria-hidden />
        <div className="hero-grid" aria-hidden />

        <div className="hero-inner">
          <header className="hero-header">
            <div className="hero-miniBrand">
              <img src={plogo} alt="Plinius" className="hero-miniLogo" />
              <span className="hero-miniText">Oferta objetivo en 48h · sin fricción</span>
              <span className="hero-miniDot" aria-hidden />
              <span className="hero-miniTag">Crédito empresarial</span>
            </div>

            <h1>
              Crédito empresarial
              <br />
              <span className="hero-highlight">Rápido y claro.</span>
            </h1>

            <p className="hero-sub">
              Solicita, sube documentos y recibe una oferta estructurada. Monitorea proceso, términos y trazabilidad en un solo lugar.
            </p>

            <div className="hero-cta-row">
              <Link to="/ingresar" className="btn btn-neon">
                Iniciar solicitud
              </Link>
              <Link to="/simulador" className="btn btn-outline">
                Simular crédito
              </Link>
            </div>

            <div className="hero-badges">
              <span className="hero-badge">Cash-flow first</span>
              <span className="hero-badge">Trazabilidad</span>
              <span className="hero-badge">Docs + checklist</span>
              <span className="hero-badge">Calendarios</span>
            </div>

            <div className="trust-strip">
              <div className="trust-pill">
                <span className="trust-kpi">48h</span>
                <span className="trust-label">respuesta objetivo</span>
              </div>

              <div className="trust-pill">
                <span className="trust-kpi">1</span>
                <span className="trust-label">panel para todo</span>
              </div>
            </div>
          </header>

          <Platform360 />
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
