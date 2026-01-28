// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./assets/css/theme.css";

/* =========================
   Helpers
========================= */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
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
    setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, [location.hash]);
}

/* =========================
   MiniDash (simple, 5 metrics)
========================= */
function MiniDashSimple({ metrics }) {
  return (
    <section className="miniDash reveal" aria-label="Mini dashboard (5 métricas)">
      <div className="miniDash__head">
        <div className="miniDash__kicker mono">private credit</div>
        <div className="miniDash__title">Risk snapshot</div>
        <div className="miniDash__sub">5 métricas, una lectura. Sin humo.</div>

        <div className="miniDash__live" aria-label="Estado: funcionando">
          <span className="liveDot" aria-hidden="true" />
          <span className="mono liveText">app funcionando</span>
        </div>
      </div>

      <div className="miniDash__grid">
        {metrics.map((m) => (
          <div className={`mCard ${m.tone ? `mCard--${m.tone}` : ""}`} key={m.k}>
            <div className="mCard__k mono">{m.k}</div>
            <div className="mCard__v mono">{m.v}</div>
            <div className="mCard__sub">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="miniDash__foot">
        <div className="monoNote">
          Fuente de pago al SPV: derechos de cobro (auditable).
        </div>
        <div className="monoNote">Input → lógica → recomendación</div>
      </div>
    </section>
  );
}

/* =========================
   Interactive cards
========================= */
function FeatureCards({ title, sub, items, anchor }) {
  const [active, setActive] = useState(items?.[0]?.k || null);

  const activeItem = useMemo(
    () => items.find((x) => x.k === active) || items[0],
    [active, items]
  );

  return (
    <section className="section section--cards" id={anchor}>
      <div className="wrap">
        <div className="sectionHead reveal">
          <div className="sectionHead__kicker mono">modules</div>
          <h2 className="sectionHead__title">{title}</h2>
          <p className="sectionHead__sub">{sub}</p>
        </div>

        <div className="cardsLayout">
          <div className="cardsGrid reveal" role="list">
            {items.map((f) => (
              <button
                key={f.k}
                type="button"
                role="listitem"
                className={`iCard ${active === f.k ? "is-active" : ""}`}
                onClick={() => setActive(f.k)}
              >
                <div className="iCard__top">
                  <div className="iCard__k mono">{f.k}</div>
                  <div className="iCard__tag mono">{f.tag}</div>
                </div>
                <div className="iCard__t">{f.t}</div>
                <div className="iCard__d">{f.d}</div>
                <div className="iCard__hint mono">Click para ver detalle</div>
              </button>
            ))}
          </div>

          <aside className="cardsDetail reveal" aria-label="Detalle del módulo seleccionado">
            <div className="cardsDetail__panel">
              <div className="cardsDetail__k mono">{activeItem.k}</div>
              <div className="cardsDetail__t">{activeItem.t}</div>
              <p className="cardsDetail__p">{activeItem.detail}</p>

              <div className="cardsDetail__bullets">
                {activeItem.bullets.map((b) => (
                  <div className="bullet" key={b}>
                    <span className="bullet__dot" aria-hidden="true" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              <div className="cardsDetail__cta">
                <Link to={activeItem.ctaHref} className="btn btn--primary">
                  {activeItem.ctaText}
                </Link>
                <Link to="/simulador" className="btn btn--secondary">
                  Ver simulador
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

/* =========================
   Page
========================= */
export default function App() {
  useReveal();
  useHashScroll();

  const metrics = useMemo(
    () => [
      { k: "WAC", v: "18.2%", sub: "costo promedio", tone: "good" },
      { k: "DSCR", v: "1.34×", sub: "mín 1.25×", tone: "warn" },
      { k: "Headroom", v: "+0.09×", sub: "buffer covenant", tone: "warn" },
      { k: "Debt", v: "$12.4m", sub: "saldo total", tone: "neutral" },
      { k: "Peak maturity", v: "6–12M", sub: "ventana de riesgo", tone: "warn" },
    ],
    []
  );

  const modulesA = useMemo(
    () => [
      {
        k: "Intake",
        tag: "funnel",
        t: "Solicitud sin fricción",
        d: "Validaciones, checklist y evidencia desde el inicio.",
        detail:
          "Un intake que se siente como software: menos campos inútiles, más señales accionables. Ideal para escalar originación sin perder control.",
        bullets: [
          "Campos inteligentes + validación en vivo",
          "Documentos / KYC listos para comité",
          "Estructura sugerida por perfil de riesgo",
        ],
        ctaText: "Iniciar solicitud",
        ctaHref: "/solicitud",
      },
      {
        k: "Comparables",
        tag: "terms",
        t: "Términos comparables",
        d: "Misma métrica, mismos supuestos. Comparas de verdad.",
        detail:
          "Comparables limpios: costo total, covenants, amortización, comisiones y ventanas de riesgo. Sin ruido, sin ‘marketing terms’.",
        bullets: [
          "Costo total (all-in) y sensibilidad",
          "Estructura: bullet / amort / revolvente",
          "Bandas de covenants y triggers",
        ],
        ctaText: "Ver productos",
        ctaHref: "/productos",
      },
      {
        k: "Covenants",
        tag: "monitor",
        t: "Calendar + alertas",
        d: "Antes del breach window, ya lo viste venir.",
        detail:
          "Monitoreo operativo: covenants, vencimientos, DSCR, concentración y alertas. Diseñado para no sorprenderte en el peor momento.",
        bullets: [
          "Calendario de covenants y reportes",
          "Alertas por umbral y tendencia",
          "Bitácora auditable por periodo",
        ],
        ctaText: "Entrar al dashboard",
        ctaHref: "/dashboard",
      },
      {
        k: "Audit trail",
        tag: "compliance",
        t: "Decisión trazable",
        d: "De input → lógica → recomendación, todo queda.",
        detail:
          "Lo que se decide, se puede explicar. Trazabilidad para comité, compliance y terceros. El sistema registra supuestos, fuentes y cambios.",
        bullets: [
          "Historial de cambios y supuestos",
          "Evidencia por fuente de pago",
          "Listo para auditoría / comité",
        ],
        ctaText: "Ver plataforma",
        ctaHref: "/#plataforma",
      },
    ],
    []
  );

  const modulesB = useMemo(
    () => [
      {
        k: "Structure",
        tag: "spv",
        t: "SPV / fideicomiso",
        d: "Estructuras por fuente de pago y derechos de cobro.",
        detail:
          "Estructuración pragmática: defines fuente de pago, garantías, waterfall y controles. Lo importante: que se ejecute bien.",
        bullets: [
          "Waterfall simple y verificable",
          "Triggers y reservas (si aplica)",
          "Reporting estándar para inversionista",
        ],
        ctaText: "Ver productos",
        ctaHref: "/productos",
      },
      {
        k: "Risk ops",
        tag: "signals",
        t: "Señales útiles",
        d: "Cobranza, estacionalidad, concentración: señales reales.",
        detail:
          "Menos ‘score bonito’, más señales que mueven el resultado: comportamiento de flujo, concentración de clientes, rezagos y ciclos.",
        bullets: [
          "Señales de stress temprano",
          "Concentración y estacionalidad",
          "Revisión mensual con trazabilidad",
        ],
        ctaText: "Simular",
        ctaHref: "/simulador",
      },
      {
        k: "Pipeline",
        tag: "speed",
        t: "Velocidad con control",
        d: "Intake → análisis → estructura → decisión.",
        detail:
          "Estandarizas el flujo y reduces fricción: checklist, validaciones y outputs repetibles. Operación sólida sin improvisación.",
        bullets: [
          "SLA operable por etapas",
          "Checklist y validaciones por rol",
          "Outputs: yes/no/structure + razones",
        ],
        ctaText: "Iniciar",
        ctaHref: "/ingresar",
      },
      {
        k: "Governance",
        tag: "committee",
        t: "Listo para comité",
        d: "Material claro, consistente y defendible.",
        detail:
          "La gobernanza deja de ser PDFs dispersos: todo vive en el sistema. El comité ve el mismo lenguaje, las mismas métricas, y el mismo audit trail.",
        bullets: [
          "Paquetes por operación",
          "Métricas consistentes",
          "Evidencia ordenada y rápida",
        ],
        ctaText: "Entrar",
        ctaHref: "/dashboard",
      },
    ],
    []
  );

  return (
    <div className="app">
      <Navbar />

      <main className="page">
        {/* =========================
            SECTION 1 — INTRO + MINIDASH
        ========================= */}
        <section className="intro" id="top" aria-label="Intro">
          <div className="wrap intro__wrap">
            <div className="intro__copy reveal">
              <div className="kicker mono">plinius</div>
              <h1 className="intro__h1">
                Private credit, <span className="muted">sin caos.</span>
              </h1>
              <p className="intro__lead">
                Una plataforma para <b>estructurar</b>, <b>medir</b> y <b>monitorear</b> deuda como software:
                comparables, covenants, vencimientos y trazabilidad.
              </p>

              <div className="intro__cta">
                <Link to="/solicitud" className="btn btn--primary">
                  Iniciar solicitud
                </Link>
                <Link to="/#modulos" className="btn btn--secondary">
                  Ver módulos
                </Link>
              </div>

              <div className="intro__proof">
                <div className="proofChip">
                  <span className="proofChip__k mono">SLA</span>
                  <span className="proofChip__v mono">48h</span>
                </div>
                <div className="proofChip">
                  <span className="proofChip__k mono">Outputs</span>
                  <span className="proofChip__v mono">yes/no/structure</span>
                </div>
                <div className="proofChip">
                  <span className="proofChip__k mono">Governance</span>
                  <span className="proofChip__v mono">on</span>
                </div>
              </div>
            </div>

            <div className="intro__dash">
              <MiniDashSimple metrics={metrics} />
            </div>
          </div>
        </section>

        {/* =========================
            SECTION 2 — INFO (cards interactivas)
        ========================= */}
        <FeatureCards
          anchor="modulos"
          title="Módulos que sí mueven el resultado"
          sub="Menos pantalla por pantalla. Más señales útiles, control operativo y trazabilidad."
          items={modulesA}
        />

        {/* =========================
            SECTION 3 — INFO (cards interactivas)
        ========================= */}
        <FeatureCards
          anchor="gobernanza"
          title="Estructura + operación + gobernanza"
          sub="Estructuras por fuente de pago, monitoreo y comité: todo bajo un mismo lenguaje."
          items={modulesB}
        />

        {/* Footer CTA */}
        <section className="endCta">
          <div className="wrap reveal">
            <div className="endCta__box">
              <div className="endCta__copy">
                <div className="endCta__t">Listo para data real</div>
                <div className="endCta__d">
                  Conecta requests, ledger, covenants y fuentes de pago y se vuelve production-grade.
                </div>
              </div>
              <div className="endCta__btns">
                <Link to="/ingresar" className="btn btn--primary">Entrar</Link>
                <Link to="/simulador" className="btn btn--secondary">Simular</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
