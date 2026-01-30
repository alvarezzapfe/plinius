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
   MiniDash (simple)
========================= */
function MiniDashSimple({ metrics }) {
  return (
    <section className="miniDash reveal" aria-label="Mini dashboard (5 métricas)">
      <div className="miniDash__head">
        <div className="miniDash__kicker mono">Plinius</div>
        <div className="miniDash__title">Administrador de Riesgo</div>

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
        <div className="monoNote">Panel de Empresa</div>
        <div className="monoNote" />
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
          <p className="sectionHead__sub">
            Sin fricción. Solo lo que mueve decisión y velocidad.
          </p>
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
                <input
                  className="field__input"
                  value={form.nombre}
                  onChange={onChange("nombre")}
                  placeholder="Tu nombre"
                />
              </div>
              <div className="field">
                <label className="field__label">Empresa</label>
                <input
                  className="field__input"
                  value={form.empresa}
                  onChange={onChange("empresa")}
                  placeholder="Empresa"
                />
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
              <div className={`formMsg ${status.type === "ok" ? "formMsg--ok" : "formMsg--err"}`}>
                {status.msg}
              </div>
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

  const metrics = useMemo(
    () => [
      { k: "Costo de la Deuda", v: "18.2%", sub: "costo promedio", tone: "good" },
      { k: "DSCR", v: "1.34×", sub: "mín 1.25×", tone: "warn" },
      { k: "Headroom", v: "+0.09×", sub: "buffer covenant", tone: "warn" },
      { k: "Deuda a Corto Plazo", v: "$12.4m", sub: "saldo total", tone: "neutral" },
      { k: "Peak maturity", v: "6–12M", sub: "ventana de riesgo", tone: "warn" },
    ],
    []
  );

  return (
    <div className="app">
      <Navbar />

      <main className="page">
        {/* SECTION 1 — HERO */}
        <section className="intro intro--full" id="top" aria-label="Intro">
          <div className="intro__bg" aria-hidden="true" />
          <div className="wrap intro__wrap">
            <div className="intro__copy reveal">
              <div className="kicker mono" />
              <h1 className="intro__h1">Plinius <span className="muted" /></h1>

              <p className="intro__lead">
                Una plataforma para <b>estructurar</b>, <b>medir</b> y <b>monitorear</b> deuda de tu Empresa.
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
              <MiniDashSimple metrics={metrics} />
            </div>
          </div>
        </section>

        {/* SECTION 2 */}
        <RequirementsBox />

        {/* SECTION 3 */}
        <FAQ />

        {/* SECTION 4 */}
        <ContactCenter />
      </main>

      <Footer />
    </div>
  );
}
