// src/pages/Solicitud.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/css/Solicitud.css";

// 🔁 AJUSTA ESTE PATH AL NOMBRE REAL DE TU LOGO
import PliniusLogo from "../assets/images/plinius-logo.png";


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

/* =======================
   Paso 3 opciones (NO texto)
======================= */
const USO_OPCIONES = [
  { id: "capital_trabajo", label: "Capital de trabajo" },
  { id: "inventario", label: "Inventario" },
  { id: "expansion", label: "Expansión / nuevas sucursales" },
  { id: "capex", label: "Equipo / maquinaria (CAPEX)" },
  { id: "logistica", label: "Logística / flotilla" },
  { id: "refinanciamiento", label: "Refinanciamiento de pasivos" },
  { id: "proveedores", label: "Pago a proveedores" },
  { id: "otro", label: "Otro" },
];

const PERFIL_OPCIONES = [
  { id: "estados_financieros", label: "Estados financieros" },
  { id: "edo_cta", label: "Estados de cuenta" },
  { id: "facturacion", label: "Facturación / CFDI" },
  { id: "garantia", label: "Garantía disponible" },
  { id: "sin_garantia", label: "Sin garantía" },
  { id: "rfc_listo", label: "RFC/CSF a la mano" },
];

const TIMING_OPCIONES = [
  { id: "urgente", label: "Urgente (0–7 días)" },
  { id: "corto", label: "Corto (1–4 semanas)" },
  { id: "normal", label: "Normal (1–3 meses)" },
];

function toggleMulti(arr, id) {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

export default function Solicitud() {
  const nav = useNavigate();

  // Step 1
  const [step, setStep] = useState(1);
  const [producto, setProducto] = useState("simple");
  const [conGarantia, setConGarantia] = useState(true);
  const [plazo, setPlazo] = useState(24);

  // Step 2
  const [monto, setMonto] = useState(1_200_000);
  const [ventasMensuales, setVentasMensuales] = useState(1_800_000);
  const [ebitdaMensual, setEbitdaMensual] = useState(150_000);

  // Step 3 (selecciones)
  const [usoSel, setUsoSel] = useState([]);
  const [perfilSel, setPerfilSel] = useState([]);
  const [timing, setTiming] = useState("normal");

  // Step 4 (contacto)
  const [empresa, setEmpresa] = useState("");
  const [rfc, setRfc] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  // Honeypot (hidden)
  const [website, setWebsite] = useState("");

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
  const canNext3 = usoSel.length >= 1; // ✅ ahora es selección, no texto

  const telefonoClean = useMemo(
    () => telefono.replace(/[^\d+]/g, "").slice(0, 18),
    [telefono]
  );

  const canSend =
    empresa.trim().length >= 2 &&
    nombre.trim().length >= 2 &&
    emailOk &&
    telefonoClean.replace(/[^\d]/g, "").length >= 8;

  const missingSend = useMemo(() => {
    const m = [];
    if (empresa.trim().length < 2) m.push("Empresa");
    if (nombre.trim().length < 2) m.push("Nombre");
    if (!emailOk) m.push("Email válido");
    if (telefonoClean.replace(/[^\d]/g, "").length < 8) m.push("Teléfono");
    return m;
  }, [empresa, nombre, emailOk, telefonoClean]);

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

      // Paso 3 (solo selecciones)
      objetivo: {
        uso: usoSel,
        perfil: perfilSel,
        timing,
      },

      contacto: {
        empresa,
        rfc,
        nombre,
        email,
        telefono: telefonoClean,
      },

      website, // honeypot
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
                <div className="sol-successTop">
                  <img className="sol-successLogo" src={PliniusLogo} alt="Plinius" />
                  <div className="sol-successBadge">Solicitud recibida</div>
                </div>

                <h2>Gracias. Ya estamos trabajando en tu solicitud.</h2>
                <p className="sol-successP">
                  Vamos a responderte lo antes posible. En la mayoría de los casos,
                  te damos respuesta en <strong>24 a 48 horas</strong>.
                </p>

                <div className="sol-successActions">
                  <button className="btnx primary" onClick={() => nav("/ingresar?registro=1")}>
                    Continuar
                  </button>
                  <button className="btnx ghost" onClick={() => nav("/")}>
                    Ir al inicio
                  </button>
                </div>

                <div className="sol-successMini">
                  Si quieres acelerar: contesta el correo con estados financieros/ventas de los últimos 12 meses.
                </div>
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
                        <Link className="btnx ghost" to="/simulador">Volver</Link>
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
                        <button className="btnx ghost" onClick={goPrev}>Atrás</button>
                        <button className="btnx primary" onClick={goNext} disabled={!canNext2}>
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ✅ Paso 3 multi-select */}
                  {step === 3 && (
                    <div className="sol-step">
                      <div className="sol-cardTop">
                        <div>
                          <div className="sol-kicker">Paso 3 · Objetivo</div>
                          <h2 className="sol-title">Selecciona tu caso</h2>
                          <p className="sol-hint">Cero texto. Solo opciones.</p>
                        </div>
                      </div>

                      <div className="sol-selectBlock">
                        <div className="sol-selectHead">
                          <div className="sol-selectTitle">Uso del crédito</div>
                          <div className="sol-selectReq">Requerido</div>
                        </div>
                        <div className="sol-chipGrid">
                          {USO_OPCIONES.map((o) => (
                            <button
                              key={o.id}
                              type="button"
                              className={`solOpt ${usoSel.includes(o.id) ? "active" : ""}`}
                              onClick={() => setUsoSel((s) => toggleMulti(s, o.id))}
                              aria-pressed={usoSel.includes(o.id)}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                        {usoSel.length === 0 && (
                          <div className="sol-inlineWarn">Selecciona al menos 1 opción.</div>
                        )}
                      </div>

                      <div className="sol-selectBlock">
                        <div className="sol-selectHead">
                          <div className="sol-selectTitle">Perfil / documentación</div>
                          <div className="sol-selectHint">Opcional</div>
                        </div>
                        <div className="sol-chipGrid">
                          {PERFIL_OPCIONES.map((o) => (
                            <button
                              key={o.id}
                              type="button"
                              className={`solOpt ${perfilSel.includes(o.id) ? "active" : ""}`}
                              onClick={() => setPerfilSel((s) => toggleMulti(s, o.id))}
                              aria-pressed={perfilSel.includes(o.id)}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="sol-selectBlock">
                        <div className="sol-selectHead">
                          <div className="sol-selectTitle">Urgencia</div>
                          <div className="sol-selectHint">Opcional</div>
                        </div>
                        <div className="sol-chipGrid">
                          {TIMING_OPCIONES.map((o) => (
                            <button
                              key={o.id}
                              type="button"
                              className={`solOpt ${timing === o.id ? "active" : ""}`}
                              onClick={() => setTiming(o.id)}
                              aria-pressed={timing === o.id}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="sol-actions">
                        <button className="btnx ghost" onClick={goPrev}>Atrás</button>
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

                      {/* honeypot (oculto) */}
                      <input
                        className="hp"
                        tabIndex={-1}
                        autoComplete="off"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        aria-hidden="true"
                      />

                      {sendError && <div className="sol-error">{sendError}</div>}

                      <div className="form-grid">
                        <div className="f">
                          <label>Empresa</label>
                          <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Ej. Atlas Logística Integrada" />
                        </div>

                        <div className="f">
                          <label>RFC (opcional)</label>
                          <input value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase())} placeholder="Ej. ALA010203XX0" />
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
                          <input
                            value={telefonoClean}
                            onChange={(e) => setTelefono(e.target.value)}
                            placeholder="55 1234 5678"
                            inputMode="tel"
                          />
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
                            <strong className="wrap">
                              {usoSel.map((id) => USO_OPCIONES.find((x) => x.id === id)?.label).filter(Boolean).join(", ") || "—"}
                            </strong>
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
