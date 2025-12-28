// src/pages/CreditoDetalle.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "../assets/css/theme.css"; // ya lo tienes global, esto es opcional

/* =======================
   Helpers
======================= */
const pesos = (x, max = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: max,
  }).format(Number.isFinite(x) ? x : 0);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function safeNum(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function pillForEstado(estado = "") {
  const s = String(estado || "").toLowerCase();
  if (s.includes("fonde")) return { label: "Fondeando", cls: "cd-pill cd-pillLive" };
  if (s.includes("activo")) return { label: "Activo", cls: "cd-pill cd-pillOk" };
  if (s.includes("cerr")) return { label: "Cerrado", cls: "cd-pill cd-pillMuted" };
  if (s.includes("paus")) return { label: "Pausado", cls: "cd-pill cd-pillWarn" };
  return { label: estado || "—", cls: "cd-pill cd-pillMuted" };
}

function inferKind(producto = "") {
  const p = String(producto || "").toLowerCase();
  if (p.includes("arrend")) return "lease";
  if (p.includes("private") || p.includes("privado")) return "private";
  if (p.includes("reestr") || p.includes("consol")) return "refi";
  return "credit";
}

function iconText(kind) {
  if (kind === "lease") return "L";
  if (kind === "private") return "P";
  if (kind === "refi") return "R";
  return "C";
}

/* =======================
   Page
======================= */
export default function CreditoDetalle() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [row, setRow] = useState(null);

  // UI state (demo)
  const [tab, setTab] = useState("resumen"); // resumen | riesgo | docs | pagos
  const [montoInvertir, setMontoInvertir] = useState("");

  const idStr = String(id ?? "").trim();
  const idNum = /^\d+$/.test(idStr) ? Number(idStr) : null;

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setErr("");
      setRow(null);

      try {
        // 1) intento con string tal cual (por si es UUID o texto)
        let q = supabase.from("creditos").select("*").eq("id", idStr).maybeSingle();
        let { data, error } = await q;

        // 2) si no encuentra y parece numérico, intento con Number
        if ((!data || error) && idNum !== null) {
          const r2 = await supabase.from("creditos").select("*").eq("id", idNum).maybeSingle();
          data = r2.data;
          error = r2.error;
        }

        if (!mounted) return;

        if (error) {
          setErr(error.message || "No pude cargar el crédito.");
          setLoading(false);
          return;
        }

        if (!data) {
          setErr("No encontré este crédito. Puede estar fuera de línea o sin permisos (RLS).");
          setLoading(false);
          return;
        }

        setRow(data);
        setLoading(false);
      } catch (e) {
        if (!mounted) return;
        setErr(e?.message || "Error inesperado cargando el crédito.");
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [idStr, idNum]);

  const view = useMemo(() => {
    const c = row || {};
    const target = safeNum(c.monto_objetivo, 0);
    const raised = safeNum(c.monto_recaudado, 0);
    const pct = target > 0 ? clamp((raised / target) * 100, 0, 100) : 0;

    const kind = inferKind(c.producto);
    const estadoPill = pillForEstado(c.estado);

    const tasa = safeNum(c.tasa_anual, 0);
    const plazo = c.plazo_meses ?? "—";

    // Campos opcionales (si existen en tu tabla)
    const empresa = c.empresa || c.deudor || c.nombre_empresa || c.tag || "Empresa";
    const desc = c.descripcion || c.resumen || "Ticket de crédito privado con estructura clara y trazabilidad.";
    const garantia = c.garantia || c.colateral || "—";
    const rating = c.rating || c.riesgo || "—";

    return {
      c,
      kind,
      estadoPill,
      empresa,
      desc,
      tasa,
      plazo,
      target,
      raised,
      pct,
      remaining: Math.max(0, target - raised),
      garantia,
      rating,
    };
  }, [row]);

  const canInvest = useMemo(() => {
    const s = String(view?.c?.estado || "").toLowerCase();
    return s.includes("fonde"); // fondeando
  }, [view?.c?.estado]);

  const suggested = useMemo(() => {
    // sugerencias para input, nice UX
    const t = view.target || 0;
    if (!t) return [100000, 250000, 500000];
    return [
      Math.min(100000, t),
      Math.min(250000, t),
      Math.min(500000, t),
    ].filter((n, i, arr) => n > 0 && arr.indexOf(n) === i);
  }, [view.target]);

  const goInvest = () => {
    // manda al hub de inversionistas con query para prefill después
    const m = safeNum(String(montoInvertir).replace(/[^\d]/g, ""), 0);
    const qs = new URLSearchParams();
    qs.set("credito", idStr);
    if (m > 0) qs.set("monto", String(m));
    nav(`/inversionistas?${qs.toString()}`);
  };

  if (loading) {
    return (
      <div className="cd-page">
        <div className="cd-bg" aria-hidden />
        <div className="cd-shell">
          <div className="cd-topbar">
            <Link to="/" className="cd-back">← Inicio</Link>
            <div className="cd-topRight">
              <span className="cd-topHint">Cargando ticket…</span>
            </div>
          </div>

          <div className="cd-skelGrid">
            <div className="cd-skelCard" />
            <div className="cd-skelCard" />
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="cd-page">
        <div className="cd-bg" aria-hidden />
        <div className="cd-shell">
          <div className="cd-topbar">
            <Link to="/" className="cd-back">← Inicio</Link>
          </div>

          <div className="cd-error">
            <div className="cd-errorTitle">No pude abrir este crédito</div>
            <div className="cd-errorMsg">{err}</div>

            <div className="cd-errorActions">
              <button className="btn btn-outline" onClick={() => nav(-1)}>Regresar</button>
              <Link className="btn btn-neon" to="/inversionistas">Ir a inversionistas</Link>
            </div>

            <div className="cd-errorHint">
              Si tienes RLS, revisa que exista policy de <strong>SELECT</strong> para <strong>creditos</strong>.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----- Normal render -----
  return (
    <div className="cd-page">
      <div className="cd-bg" aria-hidden />

      <div className="cd-shell">
        {/* Top */}
        <div className="cd-topbar">
          <Link to="/" className="cd-back">← Inicio</Link>

          <div className="cd-topRight">
            <Link to="/inversionistas" className="cd-topLink">Inversionistas</Link>
            <Link to="/dashboard" className="cd-topLink">Dashboard</Link>
          </div>
        </div>

        {/* Header */}
        <header className="cd-head">
          <div className="cd-titleRow">
            <div className={`cd-icon cd-icon-${view.kind}`} aria-hidden>
              <strong>{iconText(view.kind)}</strong>
            </div>

            <div className="cd-titleText">
              <div className="cd-kicker">
                <span className={view.estadoPill.cls}>{view.estadoPill.label}</span>
                <span className="cd-dot" aria-hidden />
                <span className="cd-kickerMuted">ID: {idStr}</span>
              </div>

              <h1 className="cd-h1">{view.c?.producto || "Crédito"}</h1>
              <p className="cd-sub">
                <strong>{view.empresa}</strong> · {view.desc}
              </p>
            </div>

            <div className="cd-headActions">
              <button
                className="btn btn-neon"
                onClick={goInvest}
                disabled={!canInvest}
                title={!canInvest ? "Este ticket no está fondeando" : "Continuar a invertir"}
              >
                Invertir
              </button>

              <Link className="btn btn-outline" to="/inversionistas">
                Ver más tickets
              </Link>
            </div>
          </div>

          {/* Stats band */}
          <div className="cd-band">
            <div className="cd-bandGrid">
              <BandStat label="Tasa" value={`${view.tasa.toFixed(1)}% anual`} />
              <BandStat label="Plazo" value={`${view.plazo} meses`} />
              <BandStat label="Objetivo" value={pesos(view.target)} />
              <BandStat label="Recaudado" value={pesos(view.raised)} accent />
              <BandStat label="Faltan" value={pesos(view.remaining)} />
              <BandStat label="Riesgo" value={String(view.rating || "—")} />
            </div>

            <div className="cd-progress">
              <div className="cd-progressTop">
                <span>Avance</span>
                <span>
                  <strong>{view.pct.toFixed(0)}%</strong>
                </span>
              </div>
              <div className="cd-progressBar" aria-hidden>
                <div className="cd-progressFill" style={{ ["--p"]: `${view.pct.toFixed(0)}%` }} />
              </div>
              <div className="cd-progressFoot">
                <span className="cd-footMuted">Estructura y trazabilidad desde Plinius</span>
                <span className="cd-chip">{canInvest ? "Disponible" : "No disponible"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main grid */}
        <div className="cd-grid">
          {/* Left: tabs content */}
          <section className="cd-card">
            <div className="cd-tabs">
              <TabButton active={tab === "resumen"} onClick={() => setTab("resumen")}>Resumen</TabButton>
              <TabButton active={tab === "riesgo"} onClick={() => setTab("riesgo")}>Riesgo</TabButton>
              <TabButton active={tab === "docs"} onClick={() => setTab("docs")}>Documentos</TabButton>
              <TabButton active={tab === "pagos"} onClick={() => setTab("pagos")}>Pagos</TabButton>
            </div>

            {tab === "resumen" && (
              <div className="cd-body">
                <h3 className="cd-h3">Lo esencial</h3>
                <div className="cd-twoCol">
                  <Info label="Producto" value={view.c?.producto || "—"} />
                  <Info label="Estado" value={view.c?.estado || "—"} />
                  <Info label="Garantía" value={view.garantia} />
                  <Info label="Tag" value={view.c?.tag || "—"} />
                </div>

                <div className="cd-divider" />

                <h3 className="cd-h3">Narrativa del ticket</h3>
                <p className="cd-p">
                  Este es un ticket de deuda privada con enfoque en claridad: monto objetivo, avance de fondeo, tasa y plazo.
                  Aquí podemos añadir (cuando quieras) KPIs, estados financieros, DSCR, covenants y anexos.
                </p>

                <div className="cd-callout">
                  <div className="cd-calloutTitle">Nota</div>
                  <div className="cd-calloutText">
                    Si tu tabla <strong>creditos</strong> tiene campos extra (ej. <code>dscr</code>, <code>sector</code>, <code>covenants</code>),
                    los conectamos y queda aún más pro.
                  </div>
                </div>
              </div>
            )}

            {tab === "riesgo" && (
              <div className="cd-body">
                <h3 className="cd-h3">Riesgo y consideraciones</h3>
                <ul className="cd-list">
                  <li>Riesgo de crédito: incumplimiento parcial o total del deudor.</li>
                  <li>Riesgo de iliquidez: el capital puede estar comprometido durante el plazo.</li>
                  <li>Riesgo operativo: documentación, cobranza y ejecución dependen del proceso.</li>
                </ul>

                <div className="cd-divider" />

                <h3 className="cd-h3">Controles (ejemplo)</h3>
                <div className="cd-kpis">
                  <MiniKpi label="Due diligence" value="Estandarizado" />
                  <MiniKpi label="Monitoreo" value="Mensual" />
                  <MiniKpi label="Reporting" value="Panel" />
                </div>

                <div className="cd-miniDisclaimer">
                  *Contenido informativo. No constituye asesoría financiera.
                </div>
              </div>
            )}

            {tab === "docs" && (
              <div className="cd-body">
                <h3 className="cd-h3">Documentos</h3>
                <p className="cd-p">
                  Aquí normalmente irían: contrato, pagaré, ficha del ticket, anexos, estados financieros y evidencia.
                </p>

                <div className="cd-emptyBox">
                  <div className="cd-emptyTitle">Aún no hay documentos publicados</div>
                  <div className="cd-emptySub">Cuando subas docs a Storage, los listamos aquí.</div>
                </div>
              </div>
            )}

            {tab === "pagos" && (
              <div className="cd-body">
                <h3 className="cd-h3">Calendario de pagos</h3>
                <p className="cd-p">
                  Próximo paso: generar amortización / bullet desde tus campos y mostrar flujos esperados.
                </p>

                <div className="cd-emptyBox">
                  <div className="cd-emptyTitle">Calendario pendiente</div>
                  <div className="cd-emptySub">Lo armamos con tus reglas (amortización, bullet, intereses mensuales, etc.).</div>
                </div>
              </div>
            )}
          </section>

          {/* Right: invest card */}
          <aside className="cd-card cd-cardSticky">
            <div className="cd-body">
              <div className="cd-sideTitle">Invertir en este ticket</div>
              <div className="cd-sideSub">
                Define el monto y continúa al flujo de inversionistas.
              </div>

              <div className="cd-inputWrap">
                <label className="cd-label">Monto a invertir (MXN)</label>
                <input
                  className="cd-input"
                  value={montoInvertir}
                  onChange={(e) => setMontoInvertir(e.target.value)}
                  placeholder="Ej. 250000"
                  inputMode="numeric"
                />
                <div className="cd-suggest">
                  {suggested.map((n) => (
                    <button
                      key={n}
                      className="cd-chipBtn"
                      onClick={() => setMontoInvertir(String(n))}
                      type="button"
                    >
                      {pesos(n)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cd-sideActions">
                <button
                  className="btn btn-neon"
                  onClick={goInvest}
                  disabled={!canInvest}
                  title={!canInvest ? "Este ticket no está fondeando" : "Continuar"}
                >
                  Continuar
                </button>
                <Link className="btn btn-outline" to="/inversionistas">
                  Ver pipeline
                </Link>
              </div>

              <div className="cd-sideNote">
                <strong>Disclaimer:</strong> Invertir implica riesgos. Este ticket es informativo.
              </div>
            </div>
          </aside>
        </div>

        {/* Footer small */}
        <div className="cd-footerNote">
          Plinius · Crédito privado con trazabilidad y control.
        </div>
      </div>
    </div>
  );
}

/* =======================
   Small components
======================= */
function BandStat({ label, value, accent = false }) {
  return (
    <div className="cd-bandStat">
      <div className="cd-bandLabel">{label}</div>
      <div className={`cd-bandValue ${accent ? "cd-bandValueAccent" : ""}`}>{String(value ?? "—")}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button className={`cd-tab ${active ? "active" : ""}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function Info({ label, value }) {
  return (
    <div className="cd-info">
      <div className="cd-infoLabel">{label}</div>
      <div className="cd-infoValue">{String(value ?? "—")}</div>
    </div>
  );
}

function MiniKpi({ label, value }) {
  return (
    <div className="cd-miniKpi">
      <div className="cd-miniKpiLabel">{label}</div>
      <div className="cd-miniKpiValue">{value}</div>
    </div>
  );
}
