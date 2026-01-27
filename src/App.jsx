// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./assets/css/theme.css";
import plogo from "./assets/images/plogo.png";

/* =========================
   Helpers
========================= */
function useReveal() {
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
   UI bits
========================= */
function Pill({ children, tone = "muted" }) {
  return <span className={`pill pill--${tone}`}>{children}</span>;
}

function Stat({ label, value, sub, tone = "neutral" }) {
  return (
    <div className={`stat stat--${tone}`}>
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
      {sub ? <div className="stat__sub">{sub}</div> : null}
    </div>
  );
}

/* =========================
   MiniDash — geometric perfection
   - strict grid
   - equal gutters
   - align baselines
========================= */
function MiniDash() {
  const [tab, setTab] = useState("overview");

  const rows = useMemo(
    () => [
      { name: "Línea revolvente", rate: "18.4%", term: "24m", fee: "1.5%", score: "8.6" },
      { name: "Refinanciamiento", rate: "17.2%", term: "36m", fee: "1.0%", score: "8.9" },
      { name: "Arrendamiento", rate: "19.1%", term: "48m", fee: "0.8%", score: "8.3" },
    ],
    []
  );

  return (
    <section className="dash" aria-label="Mini dashboard preview">
      {/* Header */}
      <div className="dash__head">
        <div className="dash__brand">
          <div className="dash__mark" aria-hidden="true">
            <img src={plogo} alt="" />
          </div>
          <div className="dash__brandText">
            <div className="dash__title">PLINIUS</div>
            <div className="dash__subtitle">Debt Console</div>
          </div>
        </div>

        <div className="dash__right">
          <Pill tone="good">Live</Pill>
          <Pill tone="muted">Audit trail</Pill>
          <Pill tone="muted">v0.9</Pill>
        </div>
      </div>

      {/* Tabs */}
      <div className="dash__tabs" role="tablist" aria-label="Dashboard tabs">
        {[
          { id: "overview", label: "Overview" },
          { id: "liabilities", label: "Liabilities" },
          { id: "covenants", label: "Covenants" },
        ].map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`dashTab ${tab === t.id ? "isOn" : ""}`}
            onClick={() => setTab(t.id)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid body */}
      <div className="dash__grid">
        {/* Left: maturity timeline */}
        <div className="dashCard dashCard--span2">
          <div className="dashCard__top">
            <div>
              <div className="dashCard__kicker">Maturity</div>
              <div className="dashCard__title">Peak risk window</div>
            </div>
            <Pill tone="warn">6M</Pill>
          </div>

          <div className="timeline">
            <div className="timeline__labels">
              <span>Now</span>
              <span>6m</span>
              <span>12m</span>
              <span>18m</span>
              <span>24m</span>
            </div>

            <div className="timeline__bars" aria-hidden="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="barRow">
                  <span className="barRow__name">{["Credit A", "Credit B", "Lease", "Invoice", "Bridge", "Line", "Term", "Other"][i]}</span>
                  <div className="barRow__track">
                    <span
                      className={`barRow__fill ${i === 2 || i === 5 ? "isHot" : ""}`}
                      style={{
                        width: `${48 + ((i * 11) % 40)}%`,
                        left: `${(i * 7) % 18}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="timeline__foot">
              <div className="monoNote">Stress-tested: cashflow −12%</div>
              <div className="monoNote">Coverage target: ≥ 1.25×</div>
            </div>
          </div>
        </div>

        {/* Right: score + stats */}
        <div className="dashCard">
          <div className="dashCard__top">
            <div>
              <div className="dashCard__kicker">Decision</div>
              <div className="dashCard__title">Quality score</div>
            </div>
            <Pill tone="good">8.7</Pill>
          </div>

          <div className="scoreRing" aria-hidden="true">
            <svg viewBox="0 0 120 120" width="120" height="120">
              <circle cx="60" cy="60" r="48" className="ring ring--bg" />
              <circle cx="60" cy="60" r="48" className="ring ring--fg" />
              <text x="60" y="58" textAnchor="middle" className="ringText__big">
                8.7
              </text>
              <text x="60" y="78" textAnchor="middle" className="ringText__small">
                decision-grade
              </text>
            </svg>
          </div>

          <div className="split">
            <div className="split__item">
              <div className="split__k">WAC</div>
              <div className="split__v mono">18.2%</div>
            </div>
            <div className="split__item">
              <div className="split__k">Debt</div>
              <div className="split__v mono">$12.4m</div>
            </div>
          </div>

          <div className="dashHint">
            <span className="dot dot--good" />
            Signals normalized across comparable terms.
          </div>
        </div>

        <div className="dashCard">
          <div className="dashCard__top">
            <div>
              <div className="dashCard__kicker">Covenants</div>
              <div className="dashCard__title">Calendar</div>
            </div>
            <Pill tone="muted">Next</Pill>
          </div>

          <div className="cal">
            <div className="cal__row">
              <div className="cal__d mono">Feb 14</div>
              <div className="cal__t">DSCR reporting</div>
              <div className="cal__s"><span className="badge badge--good">OK</span></div>
            </div>
            <div className="cal__row">
              <div className="cal__d mono">Mar 01</div>
              <div className="cal__t">Borrowing base</div>
              <div className="cal__s"><span className="badge badge--warn">Review</span></div>
            </div>
            <div className="cal__row">
              <div className="cal__d mono">Mar 20</div>
              <div className="cal__t">Insurance update</div>
              <div className="cal__s"><span className="badge badge--muted">Queued</span></div>
            </div>
          </div>

          <div className="dashHint">
            <span className="dot dot--warn" />
            Alerts trigger before breach windows.
          </div>
        </div>

        {/* Bottom: offers table */}
        <div className="dashCard dashCard--span3">
          <div className="dashCard__top">
            <div>
              <div className="dashCard__kicker">Comparables</div>
              <div className="dashCard__title">Offer table</div>
            </div>
            <div className="dashActions">
              <Pill tone="muted">Same metric</Pill>
              <Pill tone="muted">Same assumptions</Pill>
            </div>
          </div>

          <div className="table">
            <div className="tHead">
              <div>Product</div>
              <div className="mono tNum">Rate</div>
              <div className="mono tNum">Term</div>
              <div className="mono tNum">Fee</div>
              <div className="mono tNum">Score</div>
              <div></div>
            </div>

            {rows.map((r) => (
              <div className="tRow" key={r.name}>
                <div className="tName">{r.name}</div>
                <div className="mono tNum">{r.rate}</div>
                <div className="mono tNum">{r.term}</div>
                <div className="mono tNum">{r.fee}</div>
                <div className="mono tNum">{r.score}</div>
                <div className="tCta">
                  <button className="miniBtn" type="button">Select</button>
                </div>
              </div>
            ))}
          </div>

          <div className="tableFoot">
            <div className="monoNote">Decision output: yes / no / yes-but-structure</div>
            <div className="monoNote">Audit: input → model → recommendation</div>
          </div>
        </div>
      </div>

      {/* Footer strip */}
      <div className="dash__foot">
        <div className="footItem">
          <span className="dot dot--good" /> Risk lens: cashflow-first
        </div>
        <div className="footItem">
          <span className="dot dot--muted" /> Traceability: full audit trail
        </div>
        <div className="footItem">
          <span className="dot dot--warn" /> Monitoring: maturity + covenants
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

  const features = useMemo(
    () => [
      { k: "Clarity", t: "Comparables limpios", d: "Misma métrica y supuestos para comparar términos sin ruido." },
      { k: "Control", t: "Maturity map", d: "Detecta picos y concentración de vencimientos con anticipación." },
      { k: "Governance", t: "Covenants calendar", d: "Calendario + alertas para evitar sorpresas y estrés operativo." },
      { k: "Ops", t: "Intake → oferta", d: "Checklist y validaciones: menos fricción, más velocidad real." },
      { k: "Risk", t: "Señales útiles", d: "Estacionalidad, concentración y cobranza; no “score cosmético”." },
      { k: "Trust", t: "Audit trail", d: "Trazabilidad de inputs a decisión: listo para compliance e inversionistas." },
    ],
    []
  );

  return (
    <div className="app">
      <Navbar />

      <main className="page">
        <section className="hero">
          <div className="wrap hero__wrap">
            <div className="hero__left reveal">
              <div className="brandline">
                <img className="brandline__logo" src={plogo} alt="Plinius" />
                <div className="brandline__txt">
                  <div className="brandline__name">Plinius</div>
                  <div className="brandline__tag">Debt intelligence for serious operators</div>
                </div>
              </div>

              <h1 className="h1">
                Financiamiento con control.
                <br />
                <span className="h1__muted">No más decisiones a ciegas.</span>
              </h1>

              <p className="lead">
                Un sistema operativo de deuda empresarial: comparables consistentes, calendario de covenants y monitoreo
                para operar con claridad.
              </p>

              <div className="ctaRow">
                <Link to="/#plataforma" className="btn btn--primary">Ver plataforma</Link>
                <Link to="/#demo" className="btn btn--secondary">Ver demo</Link>
              </div>

              <div className="proof">
                <div className="proof__item">
                  <div className="proof__k">Response</div>
                  <div className="proof__v mono">48h</div>
                </div>
                <div className="proof__item">
                  <div className="proof__k">Metrics</div>
                  <div className="proof__v mono">Normalized</div>
                </div>
                <div className="proof__item">
                  <div className="proof__k">Audit</div>
                  <div className="proof__v mono">On</div>
                </div>
              </div>
            </div>

            <div className="hero__right reveal" id="demo">
              <MiniDash />
            </div>
          </div>
        </section>

        <section className="section" id="plataforma">
          <div className="wrap">
            <div className="section__head reveal">
              <h2 className="h2">Plataforma</h2>
              <p className="sub">
                Diseño sobrio, consistente y tech-pro. Todo está alineado a una grilla estricta para que se vea “producto real”.
              </p>
            </div>

            <div className="featureGrid reveal">
              {features.map((f) => (
                <article className="fCard" key={f.t}>
                  <div className="fCard__k mono">{f.k}</div>
                  <div className="fCard__t">{f.t}</div>
                  <div className="fCard__d">{f.d}</div>
                </article>
              ))}
            </div>

            <div className="section__cta reveal">
              <div className="ctaBox">
                <div className="ctaBox__copy">
                  <div className="ctaBox__title">Listo para convertirlo en dashboard real</div>
                  <div className="ctaBox__desc">
                    Si quieres, lo conectamos a tus datos (requests, ledger, covenants) y queda “production-grade”.
                  </div>
                </div>
                <div className="ctaBox__btns">
                  <Link to="/ingresar" className="btn btn--primary">Iniciar solicitud</Link>
                  <Link to="/simulador" className="btn btn--secondary">Simular</Link>
                </div>
              </div>
            </div>

            <div className="note reveal">
              Tip: si tu `Navbar` es fixed, deja padding-top arriba (en CSS ya lo consideré de forma safe).
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
