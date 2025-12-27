// src/pages/Solicitud.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/css/Solicitud.css";
import PliniusLogo from "../assets/images/plinius-logo.png";
import { supabase } from "../lib/supabaseClient";

/* =======================
   Helpers
======================= */
const pesos = (x, max = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: max,
  }).format(Number.isFinite(x) ? x : 0);

const pct = (x, digits = 1) => `${(Number.isFinite(x) ? x : 0).toFixed(digits)}%`;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function pagoMensual(M, tasaAnual, nMeses) {
  const r = tasaAnual / 100 / 12;
  if (!Number.isFinite(M) || !Number.isFinite(tasaAnual) || !Number.isFinite(nMeses) || nMeses <= 0) return 0;
  if (r === 0) return M / nMeses;
  return (M * r) / (1 - Math.pow(1 + r, -nMeses));
}

const cleanText = (s, max = 120) =>
  String(s ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const cleanRFC = (s) =>
  String(s ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9&Ñ]/g, "")
    .slice(0, 13);

const cleanPhone = (s) => String(s ?? "").replace(/[^\d+]/g, "").slice(0, 18);

/* =======================
   Config
======================= */
const totalSteps = 4;
const PLAZOS = [12, 18, 24, 36, 48];

const PRODUCTOS = [
  { id: "simple", title: "Crédito simple", desc: "Capital de trabajo, proyectos y crecimiento." },
  { id: "arrendamiento", title: "Arrendamiento", desc: "Maquinaria, equipo o flotilla (pago mensual)." },
  { id: "revolvente", title: "Revolvente", desc: "Línea para operar mes a mes con flexibilidad." },
];

const STEPS_META = [
  { n: 1, title: "Estructura" },
  { n: 2, title: "Monto" },
  { n: 3, title: "Objetivo" },
  { n: 4, title: "Contacto" },
];

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

function labelsFrom(ids, opts) {
  return ids.map((id) => opts.find((o) => o.id === id)?.label).filter(Boolean);
}

/* =======================
   API call -> Resend + Insert (tu handler)
   - Soporta base URL opcional para debug/routing
======================= */
const API_BASE = (import.meta?.env?.VITE_API_BASE_URL || "").replace(/\/$/, ""); 
// Si no defines VITE_API_BASE_URL, queda "" y usa mismo dominio.

async function postSolicitudToApi(payload, accessToken) {
  const url = `${API_BASE}/api/plinius/solicitud`;

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  // Intentar JSON; si no, texto
  let data = null;
  let rawText = "";
  try {
    data = await r.json();
  } catch {
    try {
      rawText = await r.text();
    } catch {}
  }

  if (!r.ok || !data?.ok) {
    const msg =
      data?.error ||
      (rawText ? `API respondió: ${rawText.slice(0, 220)}` : `Error enviando solicitud (HTTP ${r.status || "?"})`);

    const err = new Error(msg);
    err.status = r.status;
    err.payload = data;
    err.rawText = rawText;
    err.url = url;
    throw err;
  }

  return data; // { ok:true, id, ... (si tu backend regresa más) }
}

export default function Solicitud() {
  const nav = useNavigate();

  // step=0 => landing
  const [step, setStep] = useState(0);

  // Auth / profile
  const [session, setSession] = useState(null);
  const [profileRow, setProfileRow] = useState(null);
  const isLoggedIn = !!session?.user;

  // Step 1
  const [producto, setProducto] = useState("simple");
  const [conGarantia, setConGarantia] = useState(true);
  const [plazo, setPlazo] = useState(24);

  // Step 2
  const [monto, setMonto] = useState(1_200_000);
  const [ventasMensuales, setVentasMensuales] = useState(1_800_000);
  const [ebitdaMensual, setEbitdaMensual] = useState(150_000);

  // Step 3
  const [usoSel, setUsoSel] = useState([]);
  const [perfilSel, setPerfilSel] = useState([]);
  const [timing, setTiming] = useState("normal");

  // Contacto
  const [empresa, setEmpresa] = useState("");
  const [rfc, setRfc] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  // Honeypot
  const [website, setWebsite] = useState("");

  // Envío
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendWarn, setSendWarn] = useState(""); // 👈 warning si insert ok pero mail falla
  const [lastSolicitudId, setLastSolicitudId] = useState(""); // 👈 para debug / UI

  // Panel abierto Step 3
  const [openPanel, setOpenPanel] = useState("uso"); // uso | perfil | timing

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

  // Session listener
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data?.session || null);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => setSession(s));

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Load profile -> prefill contacto (sin pisar si ya escribió)
  useEffect(() => {
    if (!session?.user?.id) return;

    (async () => {
      const uid = session.user.id;

      const { data, error } = await supabase
        .from("profiles")
        .select("email,nombres,apellido_paterno,empresa,rfc,telefono")
        .eq("id", uid)
        .single();

      if (!error && data) {
        setProfileRow(data);

        const fullName = `${data.nombres || ""} ${data.apellido_paterno || ""}`.trim();

        if (!empresa) setEmpresa(data.empresa || "");
        if (!rfc) setRfc(data.rfc || "");
        if (!nombre) setNombre(fullName || "");
        if (!email) setEmail(data.email || session.user.email || "");
        if (!telefono) setTelefono(data.telefono || "");
        return;
      }

      // Fallback metadata
      const m = session.user.user_metadata || {};
      const fullName2 = `${m.nombres || ""} ${m.apellido_paterno || ""}`.trim();
      if (!empresa) setEmpresa(m.empresa || "");
      if (!rfc) setRfc(m.rfc || "");
      if (!nombre) setNombre(fullName2 || "");
      if (!email) setEmail(session.user.email || "");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  /* =======================
     Motor simple (UX)
  ======================= */
  const tasaEstimada = useMemo(() => {
    let t = producto === "revolvente" ? 28 : producto === "arrendamiento" ? 25 : 23;
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

  const pago = useMemo(() => pagoMensual(monto, tasaEstimada, plazo), [monto, tasaEstimada, plazo]);
  const dscr = useMemo(() => ebitdaMensual / Math.max(pago, 1), [ebitdaMensual, pago]);

  const salud = useMemo(() => {
    const a = dscr >= 1.7 ? 0.55 : dscr >= 1.3 ? 0.35 : 0.15;
    const lev = monto / Math.max(ebitdaMensual * 12, 1);
    const b = lev <= 3.5 ? 0.35 : lev <= 5 ? 0.22 : 0.1;
    const c = conGarantia ? 0.1 : 0.04;
    const s = clamp(a + b + c, 0, 1);
    return {
      score: s,
      label: s >= 0.78 ? "Muy saludable" : s >= 0.6 ? "Aprobable" : "A revisar",
      tone: s >= 0.78 ? "ok" : s >= 0.6 ? "warn" : "bad",
    };
  }, [dscr, monto, ebitdaMensual, conGarantia]);

  /* =======================
     Validation
  ======================= */
  const emailOk = /\S+@\S+\.\S+/.test(email);
  const telefonoClean = useMemo(() => cleanPhone(telefono), [telefono]);

  const canNext1 = Boolean(producto) && Number.isFinite(plazo);
  const canNext2 = monto >= 100_000 && plazo >= 12 && ebitdaMensual >= 0 && ventasMensuales >= 0;
  const canNext3 = usoSel.length >= 1;

  const canSend =
    cleanText(empresa, 120).length >= 2 &&
    cleanText(nombre, 80).length >= 2 &&
    emailOk &&
    telefonoClean.replace(/[^\d]/g, "").length >= 8;

  const missingSend = useMemo(() => {
    const m = [];
    if (cleanText(empresa, 120).length < 2) m.push("Empresa");
    if (cleanText(nombre, 80).length < 2) m.push("Nombre");
    if (!emailOk) m.push("Email válido");
    if (telefonoClean.replace(/[^\d]/g, "").length < 8) m.push("Teléfono");
    return m;
  }, [empresa, nombre, emailOk, telefonoClean]);

  const stepPct = step <= 0 ? 0 : ((Math.min(step, totalSteps) - 1) / (totalSteps - 1)) * 100;

  const goNext = () => setStep((s) => Math.min(totalSteps, s + 1));
  const goPrev = () => setStep((s) => Math.max(0, s - 1));
  const jumpTo = (n) => setStep(clamp(n, 0, totalSteps));

  const productoTitle = PRODUCTOS.find((x) => x.id === producto)?.title || "—";
  const usoLabels = useMemo(() => labelsFrom(usoSel, USO_OPCIONES), [usoSel]);
  const perfilLabels = useMemo(() => labelsFrom(perfilSel, PERFIL_OPCIONES), [perfilSel]);
  const timingLabel = useMemo(() => TIMING_OPCIONES.find((x) => x.id === timing)?.label || "—", [timing]);

  // PendingCount (solo si hay session)
  const [pendingCount, setPendingCount] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const s = data?.session;
      if (!s) return;

      const { count } = await supabase
        .from("solicitudes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", s.user.id)
        .eq("status", "pendiente");

      if (!alive) return;
      setPendingCount(typeof count === "number" ? count : null);
    })();

    return () => {
      alive = false;
    };
  }, [session?.user?.id]);

  const submit = async () => {
    if (sending) return;

    setSendError("");
    setSendWarn("");
    setLastSolicitudId("");
    setSending(true);

    const payload = {
      producto,
      conGarantia,
      plazo: Number(plazo),
      monto: Math.round(Number(monto)),
      ventasMensuales: Math.round(Number(ventasMensuales)),
      ebitdaMensual: Math.round(Number(ebitdaMensual)),
      tasaEstimada,
      pago,
      dscr,
      objetivo: { uso: usoSel, perfil: perfilSel, timing },
      contacto: {
        empresa: cleanText(empresa, 120),
        rfc: cleanRFC(rfc),
        nombre: cleanText(nombre, 80),
        email: cleanText(email, 120),
        telefono: telefonoClean,
      },
      website: cleanText(website, 40),
      createdAt: new Date().toISOString(),
    };

    try {
      const { data: sess } = await supabase.auth.getSession();
      const s = sess?.session;

      if (!s) {
        try {
          sessionStorage.setItem("plinius_solicitud_draft", JSON.stringify(payload));
        } catch {}
        nav("/ingresar?registro=0");
        return;
      }

      // honeypot
      if (payload.website) return;

      if (typeof pendingCount === "number" && pendingCount >= 2) {
        throw new Error("Ya tienes 2 solicitudes pendientes. Espera respuesta antes de enviar otra.");
      }

      const resp = await postSolicitudToApi(payload, s.access_token);

      if (resp?.id) setLastSolicitudId(resp.id);

      // Si tu backend regresa mail status (recomendado), aquí lo mostramos.
      // Ej: { ok:true, id, mail:{ admin:{ok:false,error:"..."}, user:{ok:true} } }
      const adminOk = resp?.mail?.admin?.ok;
      const userOk = resp?.mail?.user?.ok;
      if (adminOk === false || userOk === false) {
        const parts = [];
        if (adminOk === false) parts.push(`admin: ${resp.mail.admin.error || "falló"}`);
        if (userOk === false) parts.push(`usuario: ${resp.mail.user.error || "falló"}`);
        setSendWarn(`Solicitud guardada, pero el correo falló (${parts.join(" · ")}).`);
      }

      setSent(true);
      setPendingCount((x) => (typeof x === "number" ? x + 1 : x));

      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {}

      try {
        sessionStorage.removeItem("plinius_solicitud_draft");
      } catch {}
    } catch (e) {
      console.error("SOLICITUD ERROR:", e);

      // Mensaje usuario + hint técnico si aplica
      const hint =
        e?.url ? ` (endpoint: ${e.url})` : "";

      setSendError((e?.message || "Error enviando solicitud") + hint);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="solPage">
        <div className="solOverlayGrid" aria-hidden />
        <div className="solOverlaySquares" aria-hidden />

        <div className="solWrap">
          <header className="solHeader">
            <div className="solHeaderLeft">
              <h1 className="solH1">Solicitud</h1>
              <div className="solSub">
                {isLoggedIn ? "3 pasos · Rápido · Indicativo (no vinculante)" : "4 pasos · Rápido · Indicativo (no vinculante)"}
              </div>
            </div>

            <div className={`solHealth ${salud.tone}`} title="Indicativo">
              <div className="solHealthTop">
                <span>Salud</span>
                <strong>{Math.round(salud.score * 100)}%</strong>
              </div>
              <div className="solHealthLabel">{salud.label}</div>
            </div>
          </header>

          <section className="solCard">
            <div className="solProg">
              <div className="solProgBar">
                <div className="solProgFill" style={{ width: `${stepPct}%` }} />
              </div>
            </div>

            <div className="solBody">
              {sent ? (
                <div className="solPane">
                  <div className="solSuccessTop">
                    <div className="solBrand">
                      <img className="solBrandLogo" src={PliniusLogo} alt="Plinius" />
                      <div className="solBrandTxt">
                        <div className="solBrandK">Plinius</div>
                        <div className="solBrandS">Financiamiento para PyMEs</div>
                      </div>
                    </div>
                    <div className="solPill">Solicitud recibida</div>
                  </div>

                  <h2 className="solH2">Gracias. Ya estamos trabajando en tu solicitud.</h2>
                  <p className="solP">
                    Normalmente respondemos en <strong>24 a 48 horas</strong>.
                  </p>

                  {sendWarn && <div className="solWarn" style={{ marginTop: 10 }}>{sendWarn}</div>}
                  {lastSolicitudId && (
                    <div className="solTiny" style={{ marginTop: 8 }}>
                      ID interno: <strong>{String(lastSolicitudId).slice(0, 8)}</strong>
                    </div>
                  )}

                  <div className="solTiles">
                    <div className="solTile">
                      <div className="solTileT">Siguiente paso</div>
                      <div className="solTileV">Revisión preliminar</div>
                      <div className="solTileS">Te pediremos 2–3 documentos si aplica.</div>
                    </div>
                    <div className="solTile">
                      <div className="solTileT">Tiempo estimado</div>
                      <div className="solTileV">1–2 días</div>
                      <div className="solTileS">Si tu info está lista, puede ser el mismo día.</div>
                    </div>
                  </div>

                  <div className="solActions">
                    <button type="button" className="btnx primary" onClick={() => nav("/dashboard")}>
                      Ir a Dashboard
                    </button>
                    <button type="button" className="btnx ghost" onClick={() => nav("/")}>
                      Ir al inicio
                    </button>
                  </div>

                  <div className="solFootNote">Tip: responde con estados financieros, ventas y deuda actual.</div>
                </div>
              ) : (
                <>
                  {step === 0 && (
                    <div className="solPane">
                      <div className="solHeroTop">
                        <img className="solHeroLogo" src={PliniusLogo} alt="Plinius" />
                        <div className="solPill">Precalificación</div>
                      </div>

                      <h2 className="solH2">Inicia tu solicitud</h2>
                      <p className="solP">Te toma menos de 2 minutos. Proceso claro y sin fricción.</p>

                      <div className="solBullets">
                        <div className="solBullet">✓ Respuesta en 24–48h</div>
                        <div className="solBullet">✓ Indicativo (no vinculante)</div>
                        <div className="solBullet">✓ Opciones rápidas</div>
                      </div>

                      <div className="solActions">
                        <button type="button" className="btnx primary" onClick={() => setStep(1)}>
                          Iniciar solicitud
                        </button>
                        <Link className="btnx ghost" to="/simulador">
                          Volver al simulador
                        </Link>
                      </div>

                      <div className="solFootNote">*Este resultado es informativo y no constituye oferta vinculante.</div>
                    </div>
                  )}

                  {/* Step 1 */}
                  {step === 1 && (
                    <div className="solPane">
                      <div className="solTopRow">
                        <div>
                          <div className="solKicker">Paso 1</div>
                          <div className="solTitle">Producto y condiciones</div>
                          <div className="solHint">Elige lo esencial. Lo demás lo ajustamos.</div>
                        </div>
                        <Link className="btnx ghost" to="/simulador">
                          Volver
                        </Link>
                      </div>

                      <div className="solProducts">
                        {PRODUCTOS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className={`solProd ${producto === p.id ? "active" : ""}`}
                            onClick={() => setProducto(p.id)}
                            aria-pressed={producto === p.id}
                          >
                            <div className="solProdT">{p.title}</div>
                            <div className="solProdD">{p.desc}</div>
                          </button>
                        ))}
                      </div>

                      <div className="solRow">
                        <div className="solLabel">Garantía</div>
                        <div className="solSeg">
                          <button
                            type="button"
                            className={`solSegBtn ${conGarantia ? "active" : ""}`}
                            onClick={() => setConGarantia(true)}
                          >
                            Con garantía
                          </button>
                          <button
                            type="button"
                            className={`solSegBtn ${!conGarantia ? "active" : ""}`}
                            onClick={() => setConGarantia(false)}
                          >
                            Sin garantía
                          </button>
                        </div>
                      </div>

                      <div className="solRow">
                        <div className="solLabel">Plazo</div>
                        <div className="solChips">
                          {PLAZOS.map((p) => (
                            <button
                              key={p}
                              type="button"
                              className={`solChip ${plazo === p ? "active" : ""}`}
                              onClick={() => setPlazo(p)}
                            >
                              {p}m
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="solActions">
                        <button type="button" className="btnx ghost" onClick={goPrev}>
                          Atrás
                        </button>
                        <button type="button" className="btnx primary" onClick={goNext} disabled={!canNext1}>
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2 */}
                  {step === 2 && (
                    <div className="solPane">
                      <div className="solTopRow">
                        <div>
                          <div className="solKicker">Paso 2</div>
                          <div className="solTitle">Monto y capacidad</div>
                          <div className="solHint">Estimamos pago y comodidad del crédito.</div>
                        </div>
                      </div>

                      <div className="solGrid2">
                        <div className="solBox">
                          <div className="solBoxTop">
                            <span>Monto</span>
                            <strong>{pesos(monto)}</strong>
                          </div>
                          <input
                            type="range"
                            min={100_000}
                            max={10_000_000}
                            step={50_000}
                            value={monto}
                            onChange={(e) => setMonto(Number(e.target.value))}
                          />
                          <div className="solBoxHint">
                            <span>{pesos(100_000)}</span>
                            <span>{pesos(10_000_000)}</span>
                          </div>
                        </div>

                        <div className="solBox">
                          <div className="solBoxTop">
                            <span>EBITDA mensual</span>
                            <strong>{pesos(ebitdaMensual)}</strong>
                          </div>
                          <input
                            type="range"
                            min={30_000}
                            max={1_500_000}
                            step={10_000}
                            value={ebitdaMensual}
                            onChange={(e) => setEbitdaMensual(Number(e.target.value))}
                          />
                          <div className="solBoxHint">
                            <span>{pesos(30_000)}</span>
                            <span>{pesos(1_500_000)}</span>
                          </div>
                        </div>

                        <div className="solBox">
                          <div className="solBoxTop">
                            <span>Ventas mensuales</span>
                            <strong>{pesos(ventasMensuales)}</strong>
                          </div>
                          <input
                            type="range"
                            min={100_000}
                            max={20_000_000}
                            step={50_000}
                            value={ventasMensuales}
                            onChange={(e) => setVentasMensuales(Number(e.target.value))}
                          />
                          <div className="solBoxHint">
                            <span>{pesos(100_000)}</span>
                            <span>{pesos(20_000_000)}</span>
                          </div>
                        </div>

                        <div className="solBox solKpi">
                          <div className="solKpiRow">
                            <span>Tasa estimada</span>
                            <strong>{pct(tasaEstimada, 1)}</strong>
                          </div>
                          <div className="solKpiRow">
                            <span>Pago estimado</span>
                            <strong>{pesos(pago)}</strong>
                          </div>
                          <div className="solKpiRow">
                            <span>Flujo / pago</span>
                            <strong>{dscr.toFixed(2)}x</strong>
                          </div>
                          <div className="solTiny">Indicativo. Se ajusta con documentos.</div>
                        </div>
                      </div>

                      <div className="solActions">
                        <button type="button" className="btnx ghost" onClick={goPrev}>
                          Atrás
                        </button>
                        <button type="button" className="btnx primary" onClick={goNext} disabled={!canNext2}>
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3 */}
                  {step === 3 && (
                    <div className="solPane">
                      <div className="solTopRow">
                        <div>
                          <div className="solKicker">Paso 3</div>
                          <div className="solTitle">Selecciona tu caso</div>
                          <div className="solHint">
                            {isLoggedIn ? "Si ya tienes cuenta, enviamos al finalizar." : "Para enviar, primero inicia sesión."}
                          </div>
                        </div>
                      </div>

                      <div className="solAcc">
                        <details className="solDet" open={openPanel === "uso"} onToggle={(e) => e.target.open && setOpenPanel("uso")}>
                          <summary className="solSum">
                            <div className="solSumL">
                              <div className="solSumT">Uso del crédito</div>
                              <div className="solTag req">Requerido</div>
                            </div>
                            <div className="solSumR">{usoSel.length} seleccionado(s)</div>
                          </summary>

                          <div className="solOpts">
                            {USO_OPCIONES.map((o) => {
                              const checked = usoSel.includes(o.id);
                              return (
                                <label key={o.id} className={`solOpt ${checked ? "on" : ""}`}>
                                  <input type="checkbox" checked={checked} onChange={() => setUsoSel((s) => toggleMulti(s, o.id))} />
                                  <span>{o.label}</span>
                                </label>
                              );
                            })}
                            {usoSel.length === 0 && <div className="solWarn">Selecciona al menos 1 opción.</div>}
                          </div>
                        </details>

                        <details className="solDet" open={openPanel === "perfil"} onToggle={(e) => e.target.open && setOpenPanel("perfil")}>
                          <summary className="solSum">
                            <div className="solSumL">
                              <div className="solSumT">Perfil / documentación</div>
                              <div className="solTag opt">Opcional</div>
                            </div>
                            <div className="solSumR">{perfilSel.length} seleccionado(s)</div>
                          </summary>

                          <div className="solOpts">
                            {PERFIL_OPCIONES.map((o) => {
                              const checked = perfilSel.includes(o.id);
                              return (
                                <label key={o.id} className={`solOpt ${checked ? "on" : ""}`}>
                                  <input type="checkbox" checked={checked} onChange={() => setPerfilSel((s) => toggleMulti(s, o.id))} />
                                  <span>{o.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </details>

                        <details className="solDet" open={openPanel === "timing"} onToggle={(e) => e.target.open && setOpenPanel("timing")}>
                          <summary className="solSum">
                            <div className="solSumL">
                              <div className="solSumT">Urgencia</div>
                              <div className="solTag opt">Opcional</div>
                            </div>
                            <div className="solSumR">{timingLabel}</div>
                          </summary>

                          <div className="solOpts">
                            {TIMING_OPCIONES.map((o) => {
                              const checked = timing === o.id;
                              return (
                                <label key={o.id} className={`solOpt ${checked ? "on" : ""}`}>
                                  <input type="radio" name="timing" checked={checked} onChange={() => setTiming(o.id)} />
                                  <span>{o.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </details>

                        <div className="solMini">
                          <div className="solMiniRow">
                            <span>Uso</span>
                            <strong>{usoLabels.join(", ") || "—"}</strong>
                          </div>
                          <div className="solMiniRow">
                            <span>Urgencia</span>
                            <strong>{timingLabel}</strong>
                          </div>
                          <div className="solMiniRow">
                            <span>Docs</span>
                            <strong>{perfilLabels.join(", ") || "—"}</strong>
                          </div>
                        </div>

                        {/* Contacto inline si está logueado */}
                        {isLoggedIn && (
                          <div className="solForm" style={{ marginTop: 14 }}>
                            <div className="solSummary" style={{ marginBottom: 10 }}>
                              <div className="solSumRow">
                                <span>Tu cuenta</span>
                                <strong>{session?.user?.email || "—"}</strong>
                              </div>
                              {profileRow?.empresa ? (
                                <div className="solTiny">Prefill desde tu perfil. Puedes editar aquí si hace falta.</div>
                              ) : (
                                <div className="solTiny">Confirma tus datos de contacto para responderte.</div>
                              )}
                            </div>

                            {sendError && <div className="solError">{sendError}</div>}
                            {sendWarn && <div className="solWarn">{sendWarn}</div>}

                            <div className="solField">
                              <label>Empresa</label>
                              <input
                                value={empresa}
                                onChange={(e) => setEmpresa(e.target.value)}
                                onBlur={() => setEmpresa(cleanText(empresa, 120))}
                                placeholder="Ej. Atlas Logística Integrada"
                                autoComplete="organization"
                              />
                            </div>

                            <div className="solField">
                              <label>RFC (opcional)</label>
                              <input value={rfc} onChange={(e) => setRfc(cleanRFC(e.target.value))} placeholder="Ej. ALA010203XX0" />
                            </div>

                            <div className="solField">
                              <label>Tu nombre</label>
                              <input
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                onBlur={() => setNombre(cleanText(nombre, 80))}
                                placeholder="Ej. Luis Armando"
                                autoComplete="name"
                              />
                            </div>

                            <div className="solField">
                              <label>Email</label>
                              <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => setEmail(cleanText(email, 120))}
                                placeholder="tucorreo@empresa.com"
                                autoComplete="email"
                                inputMode="email"
                              />
                            </div>

                            <div className="solField">
                              <label>Teléfono</label>
                              <input
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                onBlur={() => setTelefono(cleanPhone(telefono))}
                                placeholder="55 1234 5678"
                                inputMode="tel"
                                autoComplete="tel"
                              />
                            </div>

                            {!canSend && (
                              <div className="solMissing">
                                Faltan: <strong>{missingSend.join(", ")}</strong>
                              </div>
                            )}

                            {typeof pendingCount === "number" && pendingCount >= 2 && (
                              <div className="solError">Ya tienes 2 solicitudes pendientes. Espera respuesta antes de enviar otra.</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* honeypot hidden */}
                      <input
                        className="hp"
                        tabIndex={-1}
                        autoComplete="off"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        aria-hidden="true"
                      />

                      <div className="solActions">
                        <button type="button" className="btnx ghost" onClick={goPrev} disabled={sending}>
                          Atrás
                        </button>

                        {isLoggedIn ? (
                          <button
                            type="button"
                            className="btnx primary"
                            onClick={submit}
                            disabled={
                              !canNext3 || !canSend || sending || (typeof pendingCount === "number" && pendingCount >= 2)
                            }
                            title={!canSend ? `Faltan: ${missingSend.join(", ")}` : "Enviar solicitud"}
                          >
                            {sending ? "Enviando..." : "Enviar solicitud"}
                          </button>
                        ) : (
                          <button type="button" className="btnx primary" onClick={() => nav("/ingresar?registro=0")}>
                            Iniciar sesión para enviar
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 4 (solo para NO logged) */}
                  {step === 4 && !isLoggedIn && (
                    <div className="solPane">
                      <div className="solTopRow">
                        <div>
                          <div className="solKicker">Paso 4</div>
                          <div className="solTitle">Datos para responder</div>
                          <div className="solHint">Para enviar, primero inicia sesión.</div>
                        </div>
                      </div>

                      <div className="solActions">
                        <button type="button" className="btnx ghost" onClick={goPrev} disabled={sending}>
                          Atrás
                        </button>
                        <button type="button" className="btnx primary" onClick={() => nav("/ingresar?registro=0")}>
                          Iniciar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          <nav className="solStepper" aria-label="Pasos">
            <ol className="solStepList">
              {STEPS_META.map((s) => {
                const active = step === s.n;
                const done = step > s.n;
                const clickable = step !== 0 && !(isLoggedIn && s.n === 4);

                return (
                  <li key={s.n} className={`solStep ${active ? "active" : ""} ${done ? "done" : ""}`}>
                    <button
                      type="button"
                      className="solStepBtn"
                      onClick={() => clickable && jumpTo(s.n)}
                      disabled={!clickable}
                      aria-current={active ? "step" : undefined}
                      title={isLoggedIn && s.n === 4 ? "No aplica si ya iniciaste sesión" : undefined}
                    >
                      <span className="solDot" />
                      <span className="solStepNum">{s.n}</span>
                      <span className="solStepTitle">{s.title}</span>
                    </button>
                    {s.n !== 4 && <span className="solLine" aria-hidden />}
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="solBottom">Este resultado es informativo y no constituye oferta vinculante.</div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
