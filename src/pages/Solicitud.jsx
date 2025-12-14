// src/pages/Solicitud.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/css/Solicitud.css";

/* =======================
   Helpers
======================= */
const pesos = (x, max = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: max,
  }).format(Number.isFinite(x) ? x : 0);

const pct = (x, digits = 1) =>
  `${(Number.isFinite(x) ? x : 0).toFixed(digits)}%`;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function pagoMensual(M, tasaAnual, nMeses) {
  const r = tasaAnual / 100 / 12;
  if (r === 0) return M / nMeses;
  return (M * r) / (1 - Math.pow(1 + r, -nMeses));
}

/* =======================
   Defaults
======================= */
const PLAZOS = [12, 18, 24, 36, 48];
const PRODUCTOS = [
  {
    id: "simple",
    title: "Crédito simple",
    desc: "Capital de trabajo, proyectos y crecimiento.",
    icon: "⚡",
  },
  {
    id: "arrendamiento",
    title: "Arrendamiento",
    desc: "Maquinaria, equipo o flotilla (pago mensual).",
    icon: "🧰",
  },
  {
    id: "revolvente",
    title: "Revolvente",
    desc: "Línea para operar mes a mes con flexibilidad.",
    icon: "♻️",
  },
];

export default function Solicitud() {
  const nav = useNavigate();

  // Step 1
  const [step, setStep] = useState(1); // 1..3
  const [producto, setProducto] = useState("simple");
  const [conGarantia, setConGarantia] = useState(true);
  const [plazo, setPlazo] = useState(24);

  // Step 2
  const [monto, setMonto] = useState(1_200_000);
  const [ventasMensuales, setVentasMensuales] = useState(1_800_000);
  const [ebitdaMensual, setEbitdaMensual] = useState(150_000);

  // Step 3 (contacto)
  const [empresa, setEmpresa] = useState("");
  const [rfc, setRfc] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  // Prefill desde simulador (si quieres)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("plinius_sim_payload");
      if (!raw) return;
      const p = JSON.parse(raw);

      if (p?.tipo) setProducto(p.tipo);
      if (typeof p?.garantias === "boolean") setConGarantia(p.garantias);
      if (p?.plazo) setPlazo(Number(p.plazo));
      if (p?.monto) setMonto(Number(p.monto));
      if (p?.ebitdaMensual) setEbitdaMensual(Number(p.ebitdaMensual));
      if (p?.ventasMensuales) setVentasMensuales(Number(p.ventasMensuales));
    } catch {}
  }, []);

  /* =======================
     Motor simple (UX)
     (No es oferta vinculante)
  ======================= */
  const tasaEstimada = useMemo(() => {
    // base por producto
    let t = producto === "revolvente" ? 28 : producto === "arrendamiento" ? 25 : 23;

    // garantía
    t += conGarantia ? -1.2 : +2.0;

    // ratios (heurística)
    const pagoRef = pagoMensual(monto, Math.max(t, 18), plazo);
    const dscr = ebitdaMensual / Math.max(pagoRef, 1);
    const lev = monto / Math.max(ebitdaMensual * 12, 1);

    if (dscr >= 1.8) t -= 1.2;
    else if (dscr >= 1.5) t -= 0.6;
    else if (dscr < 1.2) t += 1.2;

    if (lev <= 3.0) t -= 0.6;
    else if (lev >= 5.0) t += 1.0;

    // clamp
    return clamp(t, 18, 36);
  }, [producto, conGarantia, monto, plazo, ebitdaMensual]);

  const pago = useMemo(
    () => pagoMensual(monto, tasaEstimada, plazo),
    [monto, tasaEstimada, plazo]
  );

  const dscr = useMemo(
    () => ebitdaMensual / Math.max(pago, 1),
    [ebitdaMensual, pago]
  );

  const salud = useMemo(() => {
    // mini score (UX)
    const a = dscr >= 1.7 ? 0.55 : dscr >= 1.3 ? 0.35 : 0.15;
    const lev = monto / Math.max(ebitdaMensual * 12, 1);
    const b = lev <= 3.5 ? 0.35 : lev <= 5 ? 0.22 : 0.10;
    const c = conGarantia ? 0.10 : 0.04;
    const s = clamp(a + b + c, 0, 1);

    return {
      score: s,
      label: s >= 0.78 ? "Muy saludable" : s >= 0.60 ? "Aprobable" : "A revisar",
      color: s >= 0.78 ? "var(--ok)" : s >= 0.60 ? "var(--warn)" : "var(--bad)",
    };
  }, [dscr, monto, ebitdaMensual, conGarantia]);

  const canNext1 = Boolean(producto) && Number.isFinite(plazo);
  const canNext2 = monto >= 100_000 && plazo >= 12 && ebitdaMensual >= 0;
  const canSend =
    empresa.trim().length >= 2 &&
    nombre.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email) &&
    telefono.trim().length >= 8;

  const goNext = () => setStep((s) => Math.min(3, s + 1));
  const goPrev = () => setStep((s) => Math.max(1, s - 1));

  const submit = () => {
    // MVP: guardamos local y mandamos a /ingresar (o a /dashboard si quieres)
    const payload = {
      producto,
      conGarantia,
      plazo,
      monto,
      ventasMensuales,
      ebitdaMensual,
      tasaEstimada,
      pago,
      dscr,
      contacto: { empresa, rfc, nombre, email, telefono },
      createdAt: new Date().toISOString(),
    };

    try {
      sessionStorage.setItem("plinius_solicitud_payload", JSON.stringify(payload));
    } catch {}

    // Si quieres ir a login/registro:
    nav("/ingresar?registro=1");
  };

  const stepPct = ((step - 1) / 2) * 100;

  return (
    <div className="app-container">
      <Navbar />

      <main className="sol-page">
        {/* Mismo background que Inicio/Simulador */}
        <div className="hero-bg" aria-hidden />
        <div className="hero-grid" aria-hidden />

        <div className="sol-container">
          {/* Header */}
          <header className="sol-head">
            <div>
              <h1>Solicitud</h1>
              <p className="sol-sub">
                3 pasos. Rápido. Sin fricción. <span className="dotsep">•</span>{" "}
                Resultado indicativo (no vinculante).
              </p>
            </div>

            <div className="sol-head-right">
              <div className="sol-health" style={{ borderColor: salud.color }}>
                <span className="sol-health-label">Salud estimada</span>
                <span className="sol-health-value" style={{ color: salud.color }}>
                  {salud.label}
                </span>
                <span className="sol-health-mini">
                  Match estimado: <strong>{Math.round(salud.score * 100)}%</strong>
                </span>
              </div>
            </div>
          </header>

          {/* Stepper */}
          <div className="sol-stepper" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step}>
            <div className="sol-stepper-bar">
              <div className="sol-stepper-fill" style={{ width: `${stepPct}%` }} />
            </div>
            <div className="sol-stepper-row">
              <span className={`st ${step >= 1 ? "on" : ""}`}>1</span>
              <span className={`st ${step >= 2 ? "on" : ""}`}>2</span>
              <span className={`st ${step >= 3 ? "on" : ""}`}>3</span>
              <span className="sol-stepper-txt">
                Paso <strong>{step}</strong> de 3
              </span>
            </div>
          </div>

          {/* Layout */}
          <section className="sol-grid">
            {/* Left (card) */}
            <section className="sol-card">
              {step === 1 && (
                <div className="sol-step">
                  <h2 className="sol-title">Producto y estructura</h2>
                  <p className="sol-hint">
                    Elige lo que necesitas y ajustamos el resto.
                  </p>

                  <div className="sol-products" role="radiogroup" aria-label="Producto">
                    {PRODUCTOS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`pbox ${producto === p.id ? "active" : ""}`}
                        onClick={() => setProducto(p.id)}
                        aria-pressed={producto === p.id}
                      >
                        <span className="pico" aria-hidden>{p.icon}</span>
                        <span className="ptitle">{p.title}</span>
                        <span className="pdesc">{p.desc}</span>
                      </button>
                    ))}
                  </div>

                  <div className="sol-row">
                    <label className="sol-label">Garantía</label>
                    <div className="sol-toggle" role="radiogroup" aria-label="Garantía">
                      <button
                        type="button"
                        className={`tbtn ${conGarantia ? "active" : ""}`}
                        onClick={() => setConGarantia(true)}
                        aria-pressed={conGarantia}
                      >
                        Con garantía
                      </button>
                      <button
                        type="button"
                        className={`tbtn ${!conGarantia ? "active" : ""}`}
                        onClick={() => setConGarantia(false)}
                        aria-pressed={!conGarantia}
                      >
                        Sin garantía
                      </button>
                    </div>
                  </div>

                  <div className="sol-row">
                    <label className="sol-label">Plazo</label>
                    <div className="sol-chips" role="radiogroup" aria-label="Plazo">
                      {PLAZOS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          className={`chip ${plazo === p ? "active" : ""}`}
                          onClick={() => setPlazo(p)}
                          aria-pressed={plazo === p}
                        >
                          {p}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sol-actions">
                    <Link className="btnx ghost" to="/simulador">
                      Volver al simulador
                    </Link>
                    <button className="btnx primary" onClick={goNext} disabled={!canNext1}>
                      Siguiente
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="sol-step">
                  <h2 className="sol-title">Monto y flujo</h2>
                  <p className="sol-hint">
                    Esto nos ayuda a estimar pago y comodidad del crédito.
                  </p>

                  <div className="sol-grid2">
                    <div className="ibox">
                      <div className="ibox-top">
                        <label>Monto</label>
                        <span className="mono">{pesos(monto)}</span>
                      </div>
                      <input
                        type="range"
                        min={100_000}
                        max={10_000_000}
                        step={50_000}
                        value={monto}
                        onChange={(e) => setMonto(Number(e.target.value))}
                      />
                      <div className="ibox-hints">
                        <span>{pesos(100_000)}</span>
                        <span>{pesos(10_000_000)}</span>
                      </div>
                    </div>

                    <div className="ibox">
                      <div className="ibox-top">
                        <label>EBITDA mensual</label>
                        <span className="mono">{pesos(ebitdaMensual)}</span>
                      </div>
                      <input
                        type="range"
                        min={30_000}
                        max={1_500_000}
                        step={10_000}
                        value={ebitdaMensual}
                        onChange={(e) => setEbitdaMensual(Number(e.target.value))}
                      />
                      <div className="ibox-hints">
                        <span>{pesos(30_000)}</span>
                        <span>{pesos(1_500_000)}</span>
                      </div>
                    </div>

                    <div className="ibox">
                      <div className="ibox-top">
                        <label>Ventas mensuales</label>
                        <span className="mono">{pesos(ventasMensuales)}</span>
                      </div>
                      <input
                        type="range"
                        min={100_000}
                        max={20_000_000}
                        step={50_000}
                        value={ventasMensuales}
                        onChange={(e) => setVentasMensuales(Number(e.target.value))}
                      />
                      <div className="ibox-hints">
                        <span>{pesos(100_000)}</span>
                        <span>{pesos(20_000_000)}</span>
                      </div>
                    </div>

                    <div className="ibox kpi">
                      <div className="kpi-line">
                        <span className="klabel">Tasa estimada</span>
                        <span className="kval">{pct(tasaEstimada, 1)}</span>
                      </div>
                      <div className="kpi-line">
                        <span className="klabel">Pago estimado</span>
                        <span className="kval">{pesos(pago)}</span>
                      </div>
                      <div className="kpi-line">
                        <span className="klabel">Flujo / pago</span>
                        <span className="kval">{dscr.toFixed(2)}x</span>
                      </div>

                      <div className="mini-note">
                        Indicativo. Se ajusta con documentos y estructura final.
                      </div>
                    </div>
                  </div>

                  <div className="sol-actions">
                    <button className="btnx ghost" onClick={goPrev}>
                      Atrás
                    </button>
                    <button className="btnx primary" onClick={goNext} disabled={!canNext2}>
                      Siguiente
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="sol-step">
                  <h2 className="sol-title">Datos de contacto</h2>
                  <p className="sol-hint">
                    Lo mínimo para poder contactarte. Sin fricción.
                  </p>

                  <div className="form-grid">
                    <div className="f">
                      <label>Empresa</label>
                      <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Ej. Atlas Logística Integrada" />
                    </div>

                    <div className="f">
                      <label>RFC (opcional)</label>
                      <input value={rfc} onChange={(e) => setRfc(e.target.value)} placeholder="Ej. ALA010203XX0" />
                    </div>

                    <div className="f">
                      <label>Tu nombre</label>
                      <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Luis Armando" />
                    </div>

                    <div className="f">
                      <label>Email</label>
                      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@empresa.com" />
                    </div>

                    <div className="f">
                      <label>Teléfono</label>
                      <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="55 1234 5678" />
                    </div>

                    <div className="summary-box">
                      <div className="srow">
                        <span>Producto</span>
                        <strong>{PRODUCTOS.find((x) => x.id === producto)?.title}</strong>
                      </div>
                      <div className="srow">
                        <span>Estructura</span>
                        <strong>{conGarantia ? "Con garantía" : "Sin garantía"} · {plazo}m</strong>
                      </div>
                      <div className="srow">
                        <span>Monto</span>
                        <strong>{pesos(monto)}</strong>
                      </div>
                      <div className="srow">
                        <span>Pago indicativo</span>
                        <strong>{pesos(pago)} / mes</strong>
                      </div>
                      <div className="sfoot">
                        *Indicativo. No es oferta vinculante.
                      </div>
                    </div>
                  </div>

                  <div className="sol-actions">
                    <button className="btnx ghost" onClick={goPrev}>
                      Atrás
                    </button>
                    <button className="btnx primary" onClick={submit} disabled={!canSend}>
                      Enviar y continuar
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Right (ultra light info) */}
            <aside className="sol-side">
              <div className="side-card">
                <div className="side-top">
                  <span className="side-badge">Rápido</span>
                  <h3>¿Qué pasa después?</h3>
                </div>

                <ol className="side-steps">
                  <li>
                    <span className="n">1</span>
                    <div>
                      <strong>Validación</strong>
                      <span>Confirmamos datos básicos y objetivo.</span>
                    </div>
                  </li>
                  <li>
                    <span className="n">2</span>
                    <div>
                      <strong>Documentos</strong>
                      <span>Pedimos lo mínimo según tu caso.</span>
                    </div>
                  </li>
                  <li>
                    <span className="n">3</span>
                    <div>
                      <strong>Respuesta</strong>
                      <span>Te damos términos y siguientes pasos.</span>
                    </div>
                  </li>
                </ol>

                <div className="side-kpis">
                  <div className="sk">
                    <span className="k">Tiempo típico</span>
                    <strong>24–72h*</strong>
                  </div>
                  <div className="sk">
                    <span className="k">Impacto buró</span>
                    <strong>No</strong>
                  </div>
                </div>

                <p className="side-foot">
                  *Depende de información recibida y complejidad del caso.
                </p>
              </div>
            </aside>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
