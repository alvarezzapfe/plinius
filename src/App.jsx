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
    setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, [location.hash]);
}

/* =========================
   PC Screen — Financial Health (Interactive Donut)
========================= */
function PcHealthScreen() {
  const presets = useMemo(
    () => ({
      "12M": {
        score: 86,
        ring: [
          { k: "Liquidez", v: 36, sub: "Caja / ciclo", tone: "blue" },
          { k: "Cobertura", v: 34, sub: "DSCR / ICR", tone: "purple" },
          { k: "Apalancamiento", v: 30, sub: "Net debt", tone: "blue2" },
        ],
        badges: [
          { k: "DSCR", v: "1.34×" },
          { k: "Costo", v: "18.2%" },
          { k: "Peak", v: "6–12M" },
        ],
      },
      "6M": {
        score: 79,
        ring: [
          { k: "Liquidez", v: 32, sub: "Caja / ciclo", tone: "blue" },
          { k: "Cobertura", v: 28, sub: "DSCR / ICR", tone: "purple" },
          { k: "Apalancamiento", v: 40, sub: "Net debt", tone: "blue2" },
        ],
        badges: [
          { k: "DSCR", v: "1.26×" },
          { k: "Costo", v: "18.6%" },
          { k: "Peak", v: "3–9M" },
        ],
      },
      "3M": {
        score: 72,
        ring: [
          { k: "Liquidez", v: 28, sub: "Caja / ciclo", tone: "blue" },
          { k: "Cobertura", v: 24, sub: "DSCR / ICR", tone: "purple" },
          { k: "Apalancamiento", v: 48, sub: "Net debt", tone: "blue2" },
        ],
        badges: [
          { k: "DSCR", v: "1.18×" },
          { k: "Costo", v: "19.1%" },
          { k: "Peak", v: "0–6M" },
        ],
      },
    }),
    []
  );

  const tabs = useMemo(() => ["12M", "6M", "3M"], []);
  const [tab, setTab] = useState("12M");
  const data = presets[tab];

  const [active, setActive] = useState(data.ring[0].k);
  useEffect(() => setActive(presets[tab].ring[0].k), [tab, presets]);

  // subtle “alive” pulse
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 1200);
    return () => clearInterval(t);
  }, []);

  // Donut math
  const r = 54;
  const c = 2 * Math.PI * r;

  const segs = data.ring.map((s) => ({
    ...s,
    pct: Math.max(0, Math.min(100, s.v)),
  }));

  let acc = 0;
  const circles = segs.map((s) => {
    const dash = (s.pct / 100) * c;
    const offset = (acc / 100) * c;
    acc += s.pct;
    return { ...s, dash, offset };
  });

  const activeSeg = segs.find((s) => s.k === active) || segs[0];

  return (
    <section className="pcScreen reveal" aria-label="Pantalla de PC con salud financiera">
      <div className="pcScreen__bezel">
        <div className="pcScreen__topbar">
          <div className="pcLights" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div className="pcTitle mono">
            FINSCORE <span className="pcTitle__dim">/ {tab}</span>
          </div>

          <div className="pcTabs" role="tablist" aria-label="Horizonte">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                className={`pcTab ${tab === t ? "is-active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="pcScreen__body">
          <div className="pcLeft">
            <div className="pcScore">
              <div className="pcScore__k mono">health score</div>
              <div className="pcScore__v">
                <span className={`pcScore__num ${pulse ? "is-pulse" : ""}`}>{data.score}</span>
                <span className="pcScore__den mono">/100</span>
              </div>
              <div className="pcScore__hint">Señal agregada de liquidez, cobertura y apalancamiento.</div>
            </div>

            <div className="pcBadges" aria-label="Indicadores rápidos">
              {data.badges.map((b) => (
                <div className="pcBadge" key={b.k}>
                  <div className="pcBadge__k mono">{b.k}</div>
                  <div className="pcBadge__v mono">{b.v}</div>
                </div>
              ))}
            </div>

            <div className="pcLegend" aria-label="Leyenda">
              {segs.map((s) => (
                <button
                  type="button"
                  key={s.k}
                  className={`pcLegend__row ${active === s.k ? "is-active" : ""}`}
                  onMouseEnter={() => setActive(s.k)}
                  onFocus={() => setActive(s.k)}
                  onClick={() => setActive(s.k)}
                >
                  <span className={`pcDot pcDot--${s.tone}`} aria-hidden="true" />
                  <span className="pcLegend__name">{s.k}</span>
                  <span className="pcLegend__val mono">{s.v}%</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pcRight" aria-label="Gráfica de pie">
            <div className="donutWrap">
              <svg
                className="donut"
                viewBox="0 0 140 140"
                role="img"
                aria-label="Diagrama de pie de salud financiera"
              >
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2.2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* track */}
                <circle
                  cx="70"
                  cy="70"
                  r={r}
                  fill="none"
                  stroke="rgba(170,190,235,.14)"
                  strokeWidth="16"
                />

                {/* segments */}
                {circles.map((s) => (
                  <circle
                    key={s.k}
                    cx="70"
                    cy="70"
                    r={r}
                    fill="none"
                    strokeWidth="16"
                    strokeLinecap="round"
                    className={`donutSeg donutSeg--${s.tone} ${active === s.k ? "is-active" : ""}`}
                    strokeDasharray={`${s.dash} ${c}`}
                    strokeDashoffset={-s.offset}
                    transform="rotate(-90 70 70)"
                    onMouseEnter={() => setActive(s.k)}
                    onMouseLeave={() => null}
                    onFocus={() => setActive(s.k)}
                    tabIndex={0}
                    style={{ filter: "url(#glow)" }}
                  />
                ))}

                {/* center */}
                <circle cx="70" cy="70" r="40" fill="rgba(7,10,18,.88)" />

                <text x="70" y="66" textAnchor="middle" className="donutTextK mono">
                  {activeSeg.k}
                </text>
                <text x="70" y="90" textAnchor="middle" className="donutTextV mono">
                  {activeSeg.v}%
                </text>
              </svg>

              <div className="donutTip" role="note">
                <div className="donutTip__k">{activeSeg.k}</div>
                <div className="donutTip__sub">{activeSeg.sub}</div>
                <div className="donutTip__row mono">
                  señal: <span className="donutTip__num">{activeSeg.v}</span>
                </div>
              </div>
            </div>

            <div className="pcFooterNote mono">
              interactivo • hover/click para ver componente • {tab}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================
   Section — About (Sobre Plinius)
========================= */
function AboutPlinius() {
  const bullets = useMemo(
    () => [
      { t: "Estructura", d: "Define fuente de pago, covenants y triggers (sin complicarte).", tone: "blue" },
      { t: "Medición", d: "KPIs y score por riesgo: liquidez, cobertura, apalancamiento, calendario.", tone: "purple" },
      { t: "Monitoreo", d: "Alertas y reporting; lo mínimo que mueve decisiones.", tone: "blue2" },
      { t: "Gobernanza", d: "Checklist, evidencia y trazabilidad para comité / inversionista.", tone: "purple" },
    ],
    []
  );

  return (
    <section className="section section--about" id="sobre-plinius" aria-label="Sobre Plinius">
      <div className="wrap">
        <div className="sectionHead reveal">
          <div className="sectionHead__kicker mono">sobre plinius</div>
          <h2 className="sectionHead__title">Riesgo y deuda empresarial, sin fricción</h2>
          <p className="sectionHead__sub">
            Plinius convierte tu solicitud en estructura: datos → lectura → decisión. Sin PDFs tirados y sin
            “mándame todo y vemos”.
          </p>
        </div>

        <div className="aboutGrid reveal" role="region" aria-label="About">
          <div className="aboutCard">
            <div className="aboutCard__kicker mono">qué hacemos</div>
            <div className="aboutCard__title">Una ruta directa</div>
            <p className="aboutCard__p">
              Integramos información, ordenamos evidencia y te damos outputs accionables:
              <b> yes/no</b>, <b>estructura</b>, <b>covenants</b>, <b>plazo</b> y <b>monitoreo</b>.
            </p>

            <div className="aboutChips">
              <span className="aboutChip mono">fuente de pago</span>
              <span className="aboutChip mono">SPV / fideicomiso</span>
              <span className="aboutChip mono">triggers</span>
              <span className="aboutChip mono">reporting</span>
            </div>

            <div className="aboutCTA">
              <Link to="/solicitud" className="btn btn--primary">
                Iniciar solicitud
              </Link>
              <Link to="/#requisitos" className="btn btn--secondary">
                Ver requisitos
              </Link>
            </div>
          </div>

          <div className="aboutPillars" id="enfoque" aria-label="Enfoque">
            {bullets.map((b) => (
              <div className={`pillar pillar--${b.tone}`} key={b.t}>
                <div className="pillar__t">{b.t}</div>
                <div className="pillar__d">{b.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================
   Section 2 — Requisitos (BOX centrado)
========================= */
function RequirementsBox() {
  const reqs = useMemo(
    () => [
      {
        k: "01",
        t: "Identidad y constitución",
        d: "Acta constitutiva, poderes, RFC y estructura accionaria (si aplica).",
      },
      {
        k: "02",
        t: "Flujo y estados financieros",
        d: "Estados financieros recientes + estacionalidad del negocio.",
      },
      {
        k: "03",
        t: "Historial y disciplina de pago",
        d: "Señales: comportamiento, líneas vigentes y consistencia en pagos.",
      },
      {
        k: "04",
        t: "Fuente de pago / garantías",
        d: "Claridad de la fuente (contratos / cobros) y colateral (si aplica).",
      },
    ],
    []
  );

  return (
    <section className="section section--req" id="requisitos" aria-label="Requisitos">
      <div className="wrap">
        <div className="sectionHead reveal">
          <div className="sectionHead__kicker mono">requisitos</div>
          <h2 className="sectionHead__title">Lo mínimo para iniciar</h2>
          <p className="sectionHead__sub">Sin fricción. Solo lo que mueve decisión y velocidad.</p>
        </div>

        <div className="reqBox reveal" role="region" aria-label="Caja de requisitos">
          <div className="reqBox__glow" aria-hidden="true" />

          <div className="reqBox__grid">
            {reqs.map((r) => (
              <div className="reqItem" key={r.k}>
                <div className="reqItem__k mono">{r.k}</div>
                <div className="reqItem__body">
                  <div className="reqItem__t">{r.t}</div>
                  <div className="reqItem__d">{r.d}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="reqBox__cta">
            <Link to="/solicitud" className="btn btn--primary">
              Iniciar solicitud
            </Link>
            <Link to="/simulador" className="btn btn--secondary">
              Probar simulador
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================
   Section 3 — FAQ (ACORDEÓN)
========================= */
function FAQ() {
  const items = useMemo(
    () => [
      {
        q: "¿Qué tan rápido puedo tener una respuesta inicial?",
        a: "Si la información está completa, una lectura inicial puede salir en 24–48h hábiles (varía por caso).",
      },
      {
        q: "¿Qué monto mínimo / máximo manejan?",
        a: "Depende de perfil y fuente de pago. Tú ingresa objetivo y te diremos si conviene ajustar plazo, estructura o garantías.",
      },
      {
        q: "¿Puedo aplicar sin estados financieros perfectos?",
        a: "Sí. Nos importa consistencia y explicación. Estacionalidad o eventos puntuales se documentan y se modelan.",
      },
      {
        q: "¿Manejan estructuras con fideicomiso/SPV?",
        a: "Sí. Si la fuente de pago lo amerita, proponemos estructura simple y verificable con triggers y reporting.",
      },
      {
        q: "¿Qué información NO debo mandar al inicio?",
        a: "Evita mandar dumps de PDFs sin orden. Te pedimos lo mínimo y te damos checklist claro para avanzar rápido.",
      },
    ],
    []
  );

  const [open, setOpen] = useState(items[0]?.q || null);

  return (
    <section className="section section--faq" id="faq" aria-label="FAQ">
      <div className="wrap">
        <div className="sectionHead reveal">
          <div className="sectionHead__kicker mono">faq</div>
          <h2 className="sectionHead__title">Preguntas frecuentes</h2>
          <p className="sectionHead__sub">Inventadas por ahora. Luego tú ajustas copy.</p>
        </div>

        <div className="faqBox reveal" role="region" aria-label="Acordeón FAQ">
          <div className="faqBox__glow" aria-hidden="true" />

          {items.map((it) => {
            const isOpen = open === it.q;
            return (
              <button
                key={it.q}
                type="button"
                className={`faqItem ${isOpen ? "is-open" : ""}`}
                onClick={() => setOpen(isOpen ? null : it.q)}
                aria-expanded={isOpen}
              >
                <div className="faqItem__row">
                  <div className="faqItem__q">{it.q}</div>
                  <div className="faqItem__icon mono" aria-hidden="true">
                    {isOpen ? "–" : "+"}
                  </div>
                </div>

                <div className="faqItem__aWrap" aria-hidden={!isOpen}>
                  <div className="faqItem__a">{it.a}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* =========================
   Section 4 — Contacto (BOX centrado)
========================= */
function ContactCenter() {
  const [form, setForm] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    mensaje: "",
  });

  const [status, setStatus] = useState({ type: "idle", msg: "" });

  const onChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const validate = () => {
    if (!form.nombre.trim()) return "Escribe tu nombre.";
    if (!form.empresa.trim()) return "Escribe tu empresa.";
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Escribe un email válido.";
    if (!form.telefono.trim()) return "Escribe un teléfono.";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "idle", msg: "" });

    const err = validate();
    if (err) return setStatus({ type: "error", msg: err });

    // Placeholder — aquí conectamos resend después
    setStatus({ type: "ok", msg: "Listo. Recibimos tus datos. Te contactamos en breve." });
  };

  return (
    <section className="section section--contact" id="contacto" aria-label="Contacto">
      <div className="wrap">
        <div className="sectionHead reveal">
          <div className="sectionHead__kicker mono">contacto</div>
          <h2 className="sectionHead__title">Hablemos</h2>
          <p className="sectionHead__sub">Déjanos tus datos y te mandamos la ruta más directa.</p>
        </div>

        <div className="contactCenter reveal" role="region" aria-label="Formulario de contacto">
          <div className="contactCenter__glow" aria-hidden="true" />

          <form className="contactForm" onSubmit={onSubmit}>
            <div className="fieldRow">
              <div className="field">
                <label className="field__label">Nombre</label>
                <input className="field__input" value={form.nombre} onChange={onChange("nombre")} placeholder="Tu nombre" />
              </div>
              <div className="field">
                <label className="field__label">Empresa</label>
                <input className="field__input" value={form.empresa} onChange={onChange("empresa")} placeholder="Empresa" />
              </div>
            </div>

            <div className="fieldRow">
              <div className="field">
                <label className="field__label">Email</label>
                <input
                  className="field__input"
                  value={form.email}
                  onChange={onChange("email")}
                  placeholder="correo@empresa.com"
                />
              </div>
              <div className="field">
                <label className="field__label">Teléfono</label>
                <input
                  className="field__input"
                  value={form.telefono}
                  onChange={onChange("telefono")}
                  placeholder="+52 55 0000 0000"
                />
              </div>
            </div>

            <div className="field">
              <label className="field__label">Mensaje</label>
              <textarea
                className="field__input field__textarea"
                value={form.mensaje}
                onChange={onChange("mensaje")}
                placeholder="Uso del crédito, plazo, fuente de pago."
              />
            </div>

            <button type="submit" className="btn btn--primary btn--full">
              Enviar
            </button>

            {status.type !== "idle" && (
              <div className={`formMsg ${status.type === "ok" ? "formMsg--ok" : "formMsg--err"}`}>{status.msg}</div>
            )}
          </form>
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

  return (
    <div className="app">
      <Navbar />

      <main className="page">
        {/* SECTION 1 — HERO */}
        <section className="intro intro--full" id="top" aria-label="Intro">
          <div className="intro__bg" aria-hidden="true" />
          <div className="wrap intro__wrap">
            <div className="intro__copy reveal">
              <div className="kicker mono">Plataforma de riesgo</div>
              <h1 className="intro__h1">
                Plinius <span className="muted">para deuda empresarial</span>
              </h1>

              <p className="intro__lead">
                Una plataforma para <b>estructurar</b>, <b>medir</b> y <b>monitorear</b> deuda de tu Empresa.
                <br />
                <span className="muted">Outputs: decisión, estructura y plan de monitoreo.</span>
              </p>

              <div className="intro__cta">
                <Link to="/solicitud" className="btn btn--primary">
                  Iniciar solicitud
                </Link>
                <Link to="/#requisitos" className="btn btn--secondary">
                  Ver requisitos
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
              <PcHealthScreen />
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <AboutPlinius />

        {/* REQUISITOS */}
        <RequirementsBox />

        {/* FAQ */}
        <FAQ />

        {/* CONTACTO */}
        <ContactCenter />
      </main>

      <Footer />
    </div>
  );
}
