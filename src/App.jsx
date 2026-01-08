// src/App.jsx
import React, { useEffect } from "react";
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
   Hero Visual (Monitor + 360° Console)
======================= */
function Platform360() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="monitor">
        {/* bezel/top */}
        <div className="monitor-top">
          <div className="monitor-brand">
            <span className="monitor-brandDot" />
            <span className="monitor-brandTxt">Plinius Console</span>
          </div>
          <div className="monitor-cam" />
        </div>

        {/* screen */}
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

          {/* orbit content */}
          <div className="orbit">
            <div className="orbit-ring ring-1" />
            <div className="orbit-ring ring-2" />
            <div className="orbit-ring ring-3" />

            {/* Panel A */}
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

            {/* Panel B */}
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

            {/* Panel C */}
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

        {/* stand */}
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

  const about = [
    {
      icon: <IconBolt className="box-icon" />,
      title: "Velocidad real",
      text: "Solicitud y respuesta rápida.",
      meta: "SLA 48h",
    },
    {
      icon: <IconLayout className="box-icon" />,
      title: "Un panel para todo",
      text: "Docs, estatus, términos, vencimientos y comunicación.",
      meta: "Control",
    },
    {
      icon: <IconShield className="box-icon" />,
      title: "Estructura con sentido",
      text: "Calendarios y condiciones alineadas al flujo.",
      meta: "Cashflow",
    },
  ];

  const focus = [
    {
      icon: <IconRadar className="box-icon" />,
      title: "Criterio: flujo y operación",
      text: "Revisamos capacidad de pago.",
      bullets: ["Flujo libre + estacionalidad", "Concentración y riesgo operativo"],
    },
    {
      icon: <IconSpark className="box-icon" />,
      title: "Decisión: clara y accionable",
      text: "Respuesta directa con razón concreta y siguientes pasos.",
      bullets: ["Oferta", "Términos simples, comparables"],
    },
  ];

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
              Solicita, sube documentos y recibe una oferta estructurada. Monitorea el proceso, términos y trazabilidad en un solo lugar.
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
      <section className="section about reveal reveal-left" id="sobre-plinius">
        <div className="section-inner">
          <header className="section-head">
            <h2>Sobre Plinius</h2>
            <p className="section-sub">Somos un facilitador de herramientas financieras.</p>
          </header>

          <div className="box-grid">
            {about.map((b) => (
              <article className="box" key={b.title}>
                <div className="box-top">
                  <div className="box-iconWrap">{b.icon}</div>
                  <div className="box-meta">{b.meta}</div>
                </div>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- ENFOQUE Y CRITERIOS ---------- */}
      <section className="section focus reveal reveal-right" id="enfoque">
        <div className="section-inner">
          <header className="section-head">
            <h2>Enfoque y criterios</h2>
            <p className="section-sub">Buscamos agregar valor a empresas que buscan crecer.</p>
          </header>

          <div className="focus-grid">
            {focus.map((c) => (
              <article className="focus-card" key={c.title}>
                <div className="focus-head">
                  <div className="box-iconWrap">{c.icon}</div>
                  <div>
                    <h3>{c.title}</h3>
                    <p>{c.text}</p>
                  </div>
                </div>

                <ul className="focus-list">
                  {c.bullets.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="focus-note">
            
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
