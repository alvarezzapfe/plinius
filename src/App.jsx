// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./assets/css/theme.css";

// Assets
import cdmxPng from "./assets/images/cdmx.png";
import pliniusLogo from "./assets/images/plinius-logo.png";

/* =========================================================
   0) HOOKS
========================================================= */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function useHashScroll() {
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;
    setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }, [location.hash]);
}

/* =========================================================
   1) HERO — Pro tech + CDMX bigger
========================================================= */
function Hero({ bgPng, logoSrc }) {
  return (
    <section className="heroFund heroFund--v3" id="top" aria-label="Plinius Debt Fund hero">
      <div className="wrap heroFund__wrap">
        <div className="heroFund__grid reveal">
          {/* Copy */}
          <div className="heroFund__copy">
            <div className="fundMark">
              <span className="fundMark__logo" aria-hidden="true">
                {logoSrc ? <img src={logoSrc} alt="" decoding="async" /> : <span className="mono">P</span>}
              </span>

              <div className="fundMark__txt">
                <div className="fundMark__k mono">PLINIUS</div>
                <div className="fundMark__t">Debt Fund • México</div>
              </div>

              <span className="mono fundBadge">PRIVATE CREDIT</span>
            </div>

            <h1 className="heroFund__h1">Navegamos Crédito Privado en México juntos.</h1>

            <p className="heroFund__lead">
              Deuda privada ejecutada con <b>estructura institucional</b>: originación disciplinada, control de flujos,
              monitoreo de riesgos y administración vía <b>fideicomiso</b>.
            </p>

            <div className="heroFund__cta">
              <Link to="/solicitud" className="btn btn--primary">
                Invertir / Contacto
              </Link>
              <a href="#tesis" className="btn btn--secondary">
                Ver tesis
              </a>
            </div>

            <div className="heroFund__meta" aria-label="facts">
              <div className="metaItem">
                <div className="mono metaK">Perfil</div>
                <div className="metaV">Institucional</div>
              </div>
              <div className="metaItem">
                <div className="mono metaK">Estructura</div>
                <div className="metaV">Fideicomiso</div>
              </div>
              <div className="metaItem">
                <div className="mono metaK">Ejecución</div>
                <div className="metaV">Operativa</div>
              </div>
            </div>
          </div>

          {/* Photo plate (bigger) */}
          <div className="heroFund__plate" aria-label="CDMX">
            <img
              className="heroFund__img"
              src={bgPng}
              alt="Ciudad de México"
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />
            <div className="heroFund__imgOverlay" aria-hidden="true" />
            <div className="heroFund__plateHud" aria-hidden="true">
              <div className="hudChip mono">LIVE RISK</div>
              <div className="hudChip mono">COVENANTS</div>
              <div className="hudChip mono">WATERFALL</div>
            </div>
          </div>
        </div>
      </div>

      <div className="heroFund__hairline" aria-hidden="true" />
    </section>
  );
}

/* =========================================================
   2) TESIS
========================================================= */
function Thesis() {
  const items = useMemo(
    () => [
      { t: "Medimos el downside risk primero" },
      { t: "Enfoque en capacidad de cobertura de Empresas Promovidas" },
      { t: "Alineacion de incentivos con inversionistas del fondo" },
      
    ],
    []
  );

  return (
    <section className="section" id="tesis" aria-label="Tesis de inversión">
      <div className="wrap">
        <div className="sectionHead reveal">
          <div className="sectionHead__kicker mono">tesis</div>
          <h2 className="sectionHead__title">Tesis para invertir</h2>
          <p className="sectionHead__sub">
            Crédito privado en México diseñado para las Empresas del segmento mid market en Mexico que facturan arriba de 20 millones hasta 400 millones de pesos .
          </p>
        </div>

        <div className="gridCards reveal">
          {items.map((x) => (
            <div key={x.t} className="fundCard">
              <div className="fundCard__t">{x.t}</div>
              <div className="fundCard__d">{x.d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   3) PROCESO — Center interactive steps
========================================================= */
function ProcessSteps() {
  const steps = useMemo(
    () => [
      {
        k: "01",
        t: "Sourcing:  ",
        d: "Pipeline y screening eficiente",
        more: [
          "Origen de dealflow: red, originadores, referrals y data.",
          "Filtros: integridad, trazabilidad, capacidad de pago y estructura.",
          "Revisión rápida de términos y viabilidad de garantías/covenants.",
        ],
      },
      {
        k: "02",
        t: "Underwriting:  ",
        d: "Análisis de flujos, estrés, colateral y recuperación.",
        more: [
          "Modelado de escenarios y sensibilidad (downside-case).",
          "Calidad de ingresos, concentración y drivers operativos.",
          "Definición de términos: plazo, amortización, pricing y covenants.",
        ],
      },
      {
        k: "03",
        t: "Estructuración:  ",
        d: "Utilizamos un Fideicomiso de garantias para fuente de pago",
        more: [
          "Covenants financieros y operativos: medición + frecuencia.",
          "Triggers de intervención: early-warning y eventos de default.",
          "Remedios: step-in, reservas, reestructura o ejecución.",
        ],
      },
      {
        k: "04",
        t: "Ejecución:  ",
        d: "Enfoque en colocación exitosa de recursos.",
        more: [
          "Setup de cuentas, calendarios y reglas de dispersión.",
          "Evidencia de cobro y conciliación bancaria desde el día 1.",
          "Checklist de documentos y alta del activo en el sistema.",
        ],
      },
      {
        k: "05",
        t: "Monitoreo: ",
        d: "Seguimiento y reporteo.",
        more: [
          "Seguimiento de covenants y triggers con bitácora.",
          "Conciliación periódica + evidencia y auditoría operativa.",
          "Reporte institucional orientado a comité e inversionistas.",
        ],
      },
      {
        k: "06",
        t: "Workout: ",
        d: "Gestión y proceso de recuperación en caso de cartera emproblemada.",
        more: [
          "Protocolos: negociación, reestructura o ejecución.",
          "Activación de garantías y control de flujos cuando aplica.",
          "Gestión de recuperación con métricas y tiempos objetivo.",
        ],
      },
    ],
    []
  );

  const [openIdx, setOpenIdx] = useState(1); // arranca en 02 (se ve “vivo”)
  const onToggle = (idx) => setOpenIdx((p) => (p === idx ? -1 : idx));

  return (
    <section className="section" id="como-invertimos" aria-label="Proceso de inversión">
      <div className="wrap">
        <div className="sectionHead reveal">
          <div className="sectionHead__kicker mono">proceso</div>
          <h2 className="sectionHead__title">Cómo invertimos</h2>
          <p className="sectionHead__sub">
            Seis pasos, un estándar: disciplina, estructura y control. Haz click en cada paso para ver detalle.
          </p>
        </div>

        <div className="processCenter reveal" role="list" aria-label="Lista de pasos">
          {steps.map((s, idx) => {
            const isOpen = openIdx === idx;
            const detailsId = `step-details-${idx}`;
            return (
              <div key={s.k} className={`pStep ${isOpen ? "is-open" : ""}`} role="listitem">
                <button
                  type="button"
                  className="pStep__btn"
                  aria-expanded={isOpen}
                  aria-controls={detailsId}
                  onClick={() => onToggle(idx)}
                >
                  <span className="mono pStep__k">{s.k}</span>
                  <span className="pStep__main">
                    <span className="pStep__t">{s.t}</span>
                    <span className="pStep__d">{s.d}</span>
                  </span>
                  <span className="pStep__chev" aria-hidden="true" />
                </button>

                <div id={detailsId} className="pStep__panel" hidden={!isOpen}>
                  <ul className="pStep__list">
                    {s.more.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>

                  <div className="pStep__miniCta">
                    <a href="#faq" className="btn btn--secondary">
                      FAQ
                    </a>
                    <Link to="/solicitud" className="btn btn--primary">
                      Contacto
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   4) FAQ
========================================================= */
function FAQ() {
  const faqs = useMemo(
    () => [
      {
        q: "  ¿Para quién es Plinius Debt Fund?",
        a: "Para inversionistas sofisticados e institucionales que buscan exposición a deuda privada en México con estructura, control de flujos y reporteo consistente.",
      },
      {
        q: "  ¿Qué aporta el fideicomiso en la práctica?",
        a: "Define cuentas, reglas de dispersión (waterfall), evidencia/conciliación y triggers de intervención para proteger el capital.",
      },
      {
        q: "  ¿Cómo gestionan el riesgo?",
        a: "Underwriting conservador + covenants + garantías + triggers + monitoreo. Priorizamos detección temprana y remedios contractuales.",
      },
      {
        q: "¿Cómo es el reporteo?",
        a: "Cartera, KPIs, eventos/alertas, estatus de covenants, cobranza y conciliación. Formato orientado a comité.",
      },
      {
        q: "¿Qué tipo de operaciones consideran?",
        a: "Deuda privada con flujos verificables y estructura de control. La mezcla exacta depende de pricing y protecciones contractuales.",
      },
      {
        q: "¿Cómo inicio conversación para invertir?",
        a: "Da click en “Invertir / Contacto”. Compartimos overview, tesis, estructura y siguientes pasos de onboarding.",
      },
    ],
    []
  );

  return (
    <section className="section" id="faq" aria-label="Preguntas frecuentes">
      <div className="wrap">
        <div className="sectionHead reveal">
          <div className="sectionHead__kicker mono">faq</div>
          <h2 className="sectionHead__title">Preguntas frecuentes</h2>
          <p className="sectionHead__sub">Respuestas directas. Si quieres, lo convertimos a investor deck.</p>
        </div>

        <div className="faqGrid reveal">
          {faqs.map((f) => (
            <details key={f.q} className="faqItem">
              <summary className="faqQ">
                <span>{f.q}</span>
                <span className="faqIcon" aria-hidden="true" />
              </summary>
              <div className="faqA">{f.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   5) APP
========================================================= */
export default function App() {
  useReveal();
  useHashScroll();

  return (
    <div className="app">
      <Navbar />

      <main className="page">
        <div className="pliniusFund">
          <Hero bgPng={cdmxPng} logoSrc={pliniusLogo} />
          <Thesis />
          <ProcessSteps />
          <FAQ />
        </div>
      </main>

      <Footer />
    </div>
  );
}
