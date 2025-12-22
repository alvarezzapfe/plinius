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
const totalSteps = 4;
const PLAZOS = [12, 18, 24, 36, 48];

const PRODUCTOS = [
  { id: "simple", title: "Crédito simple", desc: "Capital de trabajo, proyectos y crecimiento." },
  { id: "arrendamiento", title: "Arrendamiento", desc: "Maquinaria, equipo o flotilla (pago mensual)." },
  { id: "revolvente", title: "Revolvente", desc: "Línea para operar mes a mes con flexibilidad." },
];

const STEPS_META = [
  { n: 1, title: "Estructura", desc: "Producto, garantía y plazo." },
  { n: 2, title: "Monto y flujo", desc: "Monto, ventas y EBITDA." },
  { n: 3, title: "Objetivo", desc: "Uso del crédito y perfil." },
  { n: 4, title: "Contacto", desc: "Datos mínimos para responder." },
];

export default function Solicitud() {
  const nav = useNavigate();

  // Step 1
  const [step, setStep] = useState(1); // 1..4
  const [producto, setProducto] = useState("simple");
  const [conGarantia, setConGarantia] = useState(true);
  const [plazo, setPlazo] = useState(24);

  // Step 2
  const [monto, setMonto] = useState(1_200_000);
  const [ventasMensuales, setVentasMensuales] = useState(1_800_000);
  const [ebitdaMensual, setEbitdaMensual] = useState(150_000);

  // Step 3
  const [uso, setUso] = useState("");
  const [industria, setIndustria] = useState("");
  const [antiguedadAnios, setAntiguedadAnios] = useState(0);
  const [estado, setEstado] = useState("");

  // Step 4 (contacto)
  const [empresa, setEmpresa] = useState("");
  const [rfc, setRfc] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  // Envío
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");

  // Prefill desde simulador
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
  ======================= */
  const tasaEstimada = useMemo(() => {
    let t =
      producto === "revolvente" ? 28 :
      producto === "arrendamiento" ? 25 :
      23;

    t += conGarantia ? -1.2 : +2.0;

    const pagoRef = pagoMensual(monto, Math.max(t, 18), plazo);
    const dscrLocal = ebitdaMensual / Math.max(pagoRef, 1);
    const lev = monto / Math.max(ebitdaMensual * 12, 1);

    if (dscrLocal >= 1.8) t -= 1.2;
    else if (dscrLocal >= 1.5) t -= 0.6;
    else if (dscrLocal < 1.2) t += 1.2;

    if (lev <= 3.0) t -= 0.6;
    else if (lev >= 5.0) t += 1.0;

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

  /* =======================
     Validation
  ======================= */
  const emailOk = /\S+@\S+\.\S+/.test(email);

  const canNext1 = Boolean(producto) && Number.isFinite(plazo);
  const canNext2 = monto >= 100_000 && plazo >= 12 && ebitdaMensual >= 0 && ventasMensuales >= 0;
  const canNext3 = uso.trim().length >= 10;

  const canSend =
    empresa.trim().length >= 2 &&
    nombre.trim().length >= 2 &&
    emailOk &&
    telefono.trim().length >= 8;

  const missingSend = useMemo(() => {
    const m = [];
    if (empresa.trim().length < 2) m.push("Empresa");
    if (nombre.trim().length < 2) m.push("Nombre");
    if (!emailOk) m.push("Email válido");
    if (telefono.trim().length < 8) m.push("Teléfono");
    return m;
  }, [empresa, nombre, emailOk, telefono]);

  const stepPct = ((Math.min(step, totalSteps) - 1) / (totalSteps - 1)) * 100;

  const goNext = () => setStep((s) => Math.min(totalSteps, s + 1));
  const goPrev = () => setStep((s) => Math.max(1, s - 1));
  const jumpTo = (n) => setStep(clamp(n, 1, totalSteps));

  const productoTitle = PRODUCTOS.find((x) => x.id === producto)?.title || "—";

  const submit = async () => {
    setSendError("");
    setSending(true);

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
      uso,
      industria,
      antiguedadAnios,
      estado,
      contacto: { empresa, rfc, nombre, email, telefono },
      website: "", // honeypot anti-bot
      createdAt: new Date().toISOString(),
    };

    try {
      const r = await fetch("/api/plinius/solicitud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.ok) throw new Error(data?.error || "Error enviando solicitud");

      setSent(true);
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
    } catch (e) {
      setSendError(e?.message || "Error enviando solicitud");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="sol-page">
        <div className="hero-bg" aria-hidden />
        <div className="hero-grid" aria-hidden />

        <div className="sol-container">
          <header className="sol-head">
            <div>
              <h1>Solicitud</h1>
              <p className="sol-sub">
                4 pasos. Rápido. Sin fricción. <span className="dotsep">•</span> Indicativo (no vinculante).
              </p>
            </div>

            <div className="sol-head-right">
              <div className="sol-health" style={{ borderColor: salud.color }}>
                <span className="sol-health-label">Salud estimada</span>
                <span className="sol-health-value" style={{ color: salud.color }}>
                  {salud.label}
                </span>
                <span className="sol-health-mini">
                  Match: <strong>{Math.round(salud.score * 100)}%</strong>
                </span>
              </div>
            </div>
          </header>

          {/* SUCCESS */}
          {sent ? (
            <section className="sol-center">
              <div className="sol-cardClean sol-success">
                <h2>Tu solicitud fue recibida</h2>
                <p>
                  Daremos respuesta en <strong>24 a 48 horas</strong>.
                </p>

                <div className="sol-success-actions">
                  <button className="btnx primary" onClick={() => nav("/ingresar?registro=1")}>
                    Continuar
                  </button>
                  <button className="btnx ghost" onClick={() => nav("/")}>
                    Ir al inicio
                  </button>
                </div>

                <p className="sol-success-mini">
                  Tip: responde al correo de confirmación con info financiera básica para acelerar tu proceso papi.
                </p>
              </div>
            </section>
          ) : (
            <>
              {/* PROGRESS BAR */}
              <div className="sol-progress">
                <div className="sol-progress-bar">
                  <div className="sol-progress-fill" style={{ width: `${stepPct}%` }} />
                </div>
              </div>

              {/* CENTER CARD */}
              <section className="sol-center">
                <div className="sol-cardClean">
                  {step === 1 && (
                    <div className="sol-step">
                      <div className="sol-cardTop">
                        <div>
                          <div className="sol-kicker">Paso 1 · Estructura</div>
                          <h2 className="sol-title">Producto y condiciones</h2>
                          <p className="sol-hint">Elige lo esencial. Lo demás lo ajustamos.</p>
                        </div>
                        <Link className="btnx ghost" to="/simulador">
                          Volver
                        </Link>
                      </div>

                      <div className="sol-productsClean" role="radiogroup" aria-label="Producto">
                        {PRODUCTOS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className={`pboxClean ${producto === p.id ? "active" : ""}`}
                            onClick={() => setProducto(p.id)}
                            aria-pressed={producto === p.id}
                          >
                            <div className="ptitleClean">{p.title}</div>
                            <div className="pdescClean">{p.desc}</div>
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
                        <span />
                        <button className="btnx primary" onClick={goNext} disabled={!canNext1}>
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="sol-step">
                      <div className="sol-cardTop">
                        <div>
                          <div className="sol-kicker">Paso 2 · Monto y flujo</div>
                          <h2 className="sol-title">Monto y capacidad</h2>
                          <p className="sol-hint">Estimamos pago y comodidad del crédito.</p>
                        </div>
                      </div>

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
                          <div className="mini-note">Indicativo. Se ajusta con documentos.</div>
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
                      <div className="sol-cardTop">
                        <div>
                          <div className="sol-kicker">Paso 3 · Objetivo</div>
                          <h2 className="sol-title">Uso del crédito</h2>
                          <p className="sol-hint">Una frase clara nos acelera mucho.</p>
                        </div>
                      </div>

                      <div className="form-grid">
                        <div className="f full">
                          <label>Uso del crédito</label>
                          <textarea
                            value={uso}
                            onChange={(e) => setUso(e.target.value)}
                            placeholder="Ej. 1.2M para inventario y expansión (2 sucursales) en 6 meses."
                            rows={4}
                          />
                          <div className="mini-note">
                            Mínimo 10 caracteres.
                          </div>
                        </div>

                        <div className="f">
                          <label>Industria (opcional)</label>
                          <input
                            value={industria}
                            onChange={(e) => setIndustria(e.target.value)}
                            placeholder="Ej. logística, retail, agro"
                          />
                        </div>

                        <div className="f">
                          <label>Antigüedad (años)</label>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={antiguedadAnios}
                            onChange={(e) => setAntiguedadAnios(Number(e.target.value))}
                          />
                        </div>

                        <div className="f">
                          <label>Estado (opcional)</label>
                          <input
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            placeholder="Ej. CDMX, EdoMex, Jalisco"
                          />
                        </div>
                      </div>

                      <div className="sol-actions">
                        <button className="btnx ghost" onClick={goPrev}>
                          Atrás
                        </button>
                        <button className="btnx primary" onClick={goNext} disabled={!canNext3}>
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="sol-step">
                      <div className="sol-cardTop">
                        <div>
                          <div className="sol-kicker">Paso 4 · Contacto</div>
                          <h2 className="sol-title">Datos para responder</h2>
                          <p className="sol-hint">Solo lo mínimo. Respuesta en 24–48h.</p>
                        </div>
                      </div>

                      {sendError && <div className="sol-error">{sendError}</div>}

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
                            <strong>{productoTitle}</strong>
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
                          <div className="srow">
                            <span>Uso</span>
                            <strong className="wrap">{uso.trim() || "—"}</strong>
                          </div>
                          <div className="sfoot">*Indicativo. No es oferta vinculante.</div>
                        </div>
                      </div>

                      {!canSend && (
                        <div className="sol-missing">
                          Faltan: <strong>{missingSend.join(", ")}</strong>
                        </div>
                      )}

                      <div className="sol-actions">
                        <button className="btnx ghost" onClick={goPrev} disabled={sending}>
                          Atrás
                        </button>
                        <button className="btnx primary" onClick={submit} disabled={!canSend || sending}>
                          {sending ? "Enviando..." : "Enviar solicitud"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Steps strip BELOW */}
                <div className="sol-stepsStrip" aria-label="Pasos">
                  {STEPS_META.map((s) => (
                    <button
                      key={s.n}
                      type="button"
                      className={`stepTile ${step === s.n ? "active" : ""} ${step > s.n ? "done" : ""}`}
                      onClick={() => jumpTo(s.n)}
                      aria-pressed={step === s.n}
                    >
                      <div className="stepNum">{s.n}</div>
                      <div className="stepTxt">
                        <div className="stepTitle">{s.title}</div>
                        <div className="stepDesc">{s.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="sol-bottomNote">
                  Este resultado es informativo y no constituye oferta vinculante.
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
