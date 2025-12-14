// src/pages/Pricing.jsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/css/pricing.css";

/* ---------- Helpers ---------- */
const pesos = (x, max = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: max,
  }).format(Number.isFinite(x) ? x : 0);

const pct = (x, digits = 1) =>
  `${(Number.isFinite(x) ? x : 0).toFixed(digits)}%`;

/* ---------- Parámetros ---------- */
const MIN = 100_000;
const MAX = 10_000_000;
const PLAZOS = [12, 18, 24, 36, 48];
const TIPO_GARANTIA = [
  { id: "inmueble", label: "Inmueble", ltvCap: 65, baseAdj: -1.0 },
  { id: "maquinaria", label: "Maquinaria", ltvCap: 60, baseAdj: +0.5 },
  { id: "transporte", label: "Transporte", ltvCap: 60, baseAdj: +0.5 },
  { id: "cxc", label: "Cuentas por cobrar", ltvCap: 70, baseAdj: +0.2 },
  { id: "inventario", label: "Inventario", ltvCap: 50, baseAdj: +1.0 },
];

/* ---------- Fórmulas ---------- */
function pagoMensual(M, tasaAnual, nMeses) {
  const r = tasaAnual / 100 / 12;
  if (r === 0) return M / nMeses;
  return (M * r) / (1 - Math.pow(1 + r, -nMeses));
}
function catEstimado(tasaAnual, comAperturaPct, nMeses) {
  const rm = tasaAnual / 100 / 12;
  const ea = Math.pow(1 + rm, 12) - 1;
  const feeAnnualized = (comAperturaPct / 100) * (12 / Math.max(nMeses, 1));
  return (ea + feeAnnualized) * 100;
}
function amortizacion(M, tasaAnual, nMeses) {
  const r = tasaAnual / 100 / 12;
  const cuota = pagoMensual(M, tasaAnual, nMeses);
  let saldo = M;
  const filas = [];
  for (let i = 1; i <= nMeses; i++) {
    const interes = saldo * r;
    const capital = Math.max(cuota - interes, 0);
    saldo = Math.max(saldo - capital, 0);
    filas.push({ mes: i, pago: cuota, interes, capital, saldo });
  }
  return filas;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round1 = (x) => Math.round(x * 10) / 10;

/* ---------- Motor de precio ---------- */
function priceEngineWizard({
  conGarantia,
  tipoGarantiaId,
  dscr,
  lev,
  ltv,
  conc,
  antig,
  hist,
}) {
  let baseMin = conGarantia ? 18.0 : 22.0;
  let baseMax = conGarantia ? 30.0 : 36.0;

  let ltvCap = null;
  if (conGarantia && tipoGarantiaId) {
    const tg = TIPO_GARANTIA.find((t) => t.id === tipoGarantiaId);
    if (tg) {
      baseMin += tg.baseAdj;
      baseMax += tg.baseAdj;
      ltvCap = tg.ltvCap;
    }
  }

  let score = 0;

  // DSCR
  if (conGarantia) {
    if (dscr >= 1.8) score -= 2;
    else if (dscr >= 1.5) score -= 1;
    else if (dscr >= 1.2) score += 1;
    else score += 2;
  } else {
    if (dscr >= 2.0) score -= 2;
    else if (dscr >= 1.8) score -= 1;
    else if (dscr >= 1.5) score += 1;
    else score += 2;
  }

  // Leverage
  if (conGarantia) {
    if (lev <= 2.5) score -= 1;
    else if (lev > 4.5) score += 2;
    else if (lev > 3.5) score += 1;
  } else {
    if (lev <= 2.0) score -= 1;
    else if (lev > 3.5) score += 2;
    else if (lev > 2.5) score += 1;
  }

  // LTV
  if (conGarantia && Number.isFinite(ltv) && Number.isFinite(ltvCap)) {
    if (ltv <= ltvCap) score -= 1;
    else if (ltv <= ltvCap + 10) score += 1;
    else score += 2;
  }

  // Operativo
  if (conc <= 30) score -= 0.5;
  else if (conc > 45) score += 1;

  if (antig >= 3) score -= 0.5;
  else if (antig < 1) score += 1;

  if (hist === "ok") score -= 1;
  else if (hist === "bad") score += 2;

  const adj = score * 1.2;
  let tMin = clamp(baseMin + adj, 18, 36);
  let tMax = clamp(baseMax + adj, 20, 36);
  if (tMin > tMax) tMin = tMax - 1;
  tMin = round1(tMin);
  tMax = round1(tMax);

  let fee = conGarantia ? 3.0 : 3.5;
  fee += score * 0.3;
  if (conGarantia && tipoGarantiaId === "inventario") fee += 0.3;
  if (conGarantia && tipoGarantiaId === "cxc") fee += 0.2;
  fee = clamp(fee, 3.0, 5.0);
  fee = round1(fee);

  return { tasaMin: tMin, tasaMax: tMax, feePct: fee, score, ltvCap };
}

/* ===========================================================
   Wizard compacto — Mejorado con intro y loader
   =========================================================== */
export default function Pricing() {
  const [step, setStep] = useState(0); // Intro primero
  const totalSteps = 6;
  const [loading, setLoading] = useState(false);

  // Estado global
  const [conGarantia, setConGarantia] = useState(true);
  const [tipoGarantia, setTipoGarantia] = useState("inmueble");
  const [plazo, setPlazo] = useState(24);

  const [monto, setMonto] = useState(1_200_000);
  const [ebitdaMensual, setEbitdaMensual] = useState(150_000);

  const [valorGarantia, setValorGarantia] = useState(1_800_000);

  const [concentracion, setConcentracion] = useState(25);
  const [antiguedad, setAntiguedad] = useState(3);
  const [historial, setHistorial] = useState("ok");

  // Estimaciones
  const tasaRef = conGarantia ? 24 : 28;
  const pagoRef = useMemo(
    () => pagoMensual(monto, tasaRef, plazo),
    [monto, tasaRef, plazo]
  );
  const dscr = ebitdaMensual / Math.max(pagoRef, 1);
  const leverage = monto / Math.max(ebitdaMensual * 12, 1);
  const ltv = conGarantia ? (monto / Math.max(valorGarantia, 1)) * 100 : NaN;

  // Precio final
  const precio = useMemo(
    () =>
      priceEngineWizard({
        conGarantia,
        tipoGarantiaId: conGarantia ? tipoGarantia : null,
        dscr,
        lev: leverage,
        ltv,
        conc: concentracion,
        antig: antiguedad,
        hist: historial,
      }),
    [
      conGarantia,
      tipoGarantia,
      dscr,
      leverage,
      ltv,
      concentracion,
      antiguedad,
      historial,
    ]
  );

  const tasaMid = (precio.tasaMin + precio.tasaMax) / 2;
  const pagoMid = useMemo(
    () => pagoMensual(monto, tasaMid, plazo),
    [monto, tasaMid, plazo]
  );
  const comApertura = (monto * precio.feePct) / 100;
  const cat = useMemo(
    () => catEstimado(tasaMid, precio.feePct, plazo),
    [tasaMid, precio.feePct, plazo]
  );

  // Loader helper
  const go = (fn, ms = 420) => {
    setLoading(true);
    setTimeout(() => {
      setStep(fn);
      setLoading(false);
    }, ms);
  };

  const start = () => go(() => 1, 380);
  const next = () => go((s) => Math.min(s + 1, totalSteps), 420);
  const prev = () => go((s) => Math.max(s - 1, 1), 320);
  const calc = () => go(() => 6, 650);

  // Guardar payload al iniciar solicitud
  const savePayload = () => {
    const payload = {
      conGarantia,
      tipoGarantia,
      plazo,
      monto,
      ebitdaMensual,
      valorGarantia,
      concentracion,
      antiguedad,
      historial,
      tasaMin: precio.tasaMin,
      tasaMax: precio.tasaMax,
      tasaMid,
      pagoMid,
      feePct: precio.feePct,
      cat,
    };
    try {
      sessionStorage.setItem(
        "plinius_pricing_payload",
        JSON.stringify(payload)
      );
    } catch {}
  };

  const showStepper = step >= 1;

  return (
    <div className="app-container">
      <Navbar />
      <main className="pwz">
        <div className="pwz__bg" aria-hidden />
        <div className="pwz__wrap">
          <header className="pwz-head">
            <h1>Solicitud de crédito</h1>
            <p className="pwz-sub">
              Estructuramos crédito simple, arrendamiento y revolvente para
              empresas en México. Responde unas preguntas y obtén una oferta
              indicativa basada en un esquema regulado.
            </p>
          </header>

          {/* Stepper */}
          {showStepper && (
            <div
              className="pwz-stepper"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={totalSteps}
              aria-valuenow={Math.min(step, totalSteps)}
            >
              <div className="pwz-stepper__bar">
                <div
                  className="pwz-stepper__fill"
                  style={{
                    width: `${
                      (Math.max(step, 1) - 1) * (100 / (totalSteps - 1))
                    }%`,
                  }}
                />
              </div>
              <ol className="pwz-stepper__dots">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <li
                    key={n}
                    className={`dot ${n <= step ? "is-active" : ""}`}
                    aria-label={`Paso ${n}`}
                  />
                ))}
              </ol>
            </div>
          )}

          {/* Card */}
          <section
            className="pwz-card"
            aria-busy={loading ? "true" : "false"}
            aria-live="polite"
          >
            {loading && (
              <div className="pwz-loading" role="status" aria-label="Cargando">
                <div className="spinner" />
              </div>
            )}

            {/* Intro */}
            {step === 0 && (
              <div className="pwz-intro">
                <div className="intro-card">
                  <h3>Calcula tu oferta indicativa</h3>
                  <p>
                    Responde algunas preguntas rápidas y obtén un rango de tasa,
                    pago estimado y costos. No impacta buró.
                  </p>
                  <ul className="intro-points">
                    <li>⏱️ 2–3 minutos</li>
                    <li>🔒 Datos privados</li>
                    <li>📄 Resultado descargable</li>
                  </ul>
                  <div className="intro-ctas">
                    <button className="btn btn-neon" onClick={start}>
                      Comenzar solicitud
                    </button>
                    <Link className="btn btn-outline" to="/simulador">
                      Ver simulador
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Contenido del wizard */}
            {step >= 1 && (
              <>
                <div className="pwz-body">
                  {step === 1 && (
                    <Step1
                      conGarantia={conGarantia}
                      setConGarantia={setConGarantia}
                      tipoGarantia={tipoGarantia}
                      setTipoGarantia={setTipoGarantia}
                      plazo={plazo}
                      setPlazo={setPlazo}
                    />
                  )}

                  {step === 2 && (
                    <Step2
                      monto={monto}
                      setMonto={setMonto}
                      ebitdaMensual={ebitdaMensual}
                      setEbitdaMensual={setEbitdaMensual}
                    />
                  )}

                  {step === 3 && conGarantia && (
                    <Step3Garantia
                      tipoGarantia={tipoGarantia}
                      valorGarantia={valorGarantia}
                      setValorGarantia={setValorGarantia}
                      ltv={ltv}
                    />
                  )}
                  {step === 3 && !conGarantia && <Step3Skip />}

                  {step === 4 && (
                    <Step4Perfil
                      concentracion={concentracion}
                      setConcentracion={setConcentracion}
                      antiguedad={antiguedad}
                      setAntiguedad={setAntiguedad}
                      historial={historial}
                      setHistorial={setHistorial}
                    />
                  )}

                  {step === 5 && (
                    <Step5Resumen
                      conGarantia={conGarantia}
                      tipoGarantia={tipoGarantia}
                      plazo={plazo}
                      monto={monto}
                      ebitdaMensual={ebitdaMensual}
                      valorGarantia={valorGarantia}
                      ltv={ltv}
                      concentracion={concentracion}
                      antiguedad={antiguedad}
                      historial={historial}
                    />
                  )}

                  {step === 6 && (
                    <Step6Resultado
                      conGarantia={conGarantia}
                      tipoGarantia={tipoGarantia}
                      plazo={plazo}
                      monto={monto}
                      tasaMin={precio.tasaMin}
                      tasaMax={precio.tasaMax}
                      tasaMid={tasaMid}
                      pagoMid={pagoMid}
                      feePct={precio.feePct}
                      comApertura={comApertura}
                      cat={cat}
                      dscrMid={ebitdaMensual / Math.max(pagoMid, 1)}
                      lev={leverage}
                      ltv={ltv}
                    />
                  )}
                </div>

                {/* Controles */}
                <div className="pwz-controls">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={prev}
                    disabled={step === 1}
                  >
                    Atrás
                  </button>

                  {step < 5 && (
                    <button
                      type="button"
                      className="btn btn-neon"
                      onClick={next}
                    >
                      Siguiente
                    </button>
                  )}

                  {step === 5 && (
                    <button
                      type="button"
                      className="btn btn-neon"
                      onClick={calc}
                    >
                      Ver precio
                    </button>
                  )}

                  {step === 6 && (
                    <div className="pwz-result-ctas">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => go(() => 1, 320)}
                      >
                        Editar respuestas
                      </button>
                      <Link
                        to="/ingresar?registro=1"
                        className="btn btn-neon"
                        onClick={savePayload}
                      >
                        Iniciar solicitud
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          <p className="pwz-note">
            *Valores <strong>indicativos</strong> sujetos a validación y
            políticas de crédito. CAT estimado sin IVA.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ---------------- PASOS ---------------- */

function Step1({
  conGarantia,
  setConGarantia,
  tipoGarantia,
  setTipoGarantia,
  plazo,
  setPlazo,
}) {
  return (
    <div className="pwz-step">
      <h3 className="pwz-title">Modalidad y plazo</h3>

      <div className="pwz-grid2">
        <div className="pwz-row">
          <label className="pwz-label">Modalidad</label>
          <div className="toggle" role="radiogroup" aria-label="Garantía">
            <button
              type="button"
              className={`toggle-btn ${conGarantia ? "active" : ""}`}
              aria-pressed={conGarantia}
              onClick={() => setConGarantia(true)}
            >
              Con garantía
            </button>
            <button
              type="button"
              className={`toggle-btn ${!conGarantia ? "active" : ""}`}
              aria-pressed={!conGarantia}
              onClick={() => setConGarantia(false)}
            >
              Sin garantía
            </button>
          </div>
        </div>

        <div className="pwz-row">
          <label className="pwz-label">Plazo</label>
          <div className="seg" role="radiogroup" aria-label="Plazo">
            {PLAZOS.map((p) => (
              <label
                key={p}
                className={`seg-btn ${plazo === p ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="plazo"
                  value={p}
                  checked={plazo === p}
                  onChange={() => setPlazo(p)}
                />
                {p} m
              </label>
            ))}
          </div>
        </div>
      </div>

      {conGarantia && (
        <div className="pwz-row">
          <label className="pwz-label">Tipo de garantía</label>
          <div className="seg" role="radiogroup" aria-label="Tipo de garantía">
            {TIPO_GARANTIA.map((t) => (
              <label
                key={t.id}
                className={`seg-btn ${tipoGarantia === t.id ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="tipoGarantia"
                  value={t.id}
                  checked={tipoGarantia === t.id}
                  onChange={() => setTipoGarantia(t.id)}
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Step2({ monto, setMonto, ebitdaMensual, setEbitdaMensual }) {
  return (
    <div className="pwz-step">
      <h3 className="pwz-title">Monto y flujo</h3>

      <div className="pwz-grid2">
        <div className="ctrl">
          <div className="ctrl-row">
            <label htmlFor="monto">Monto solicitado</label>
            <span className="mono">{pesos(monto)}</span>
          </div>
          <input
            id="monto"
            type="range"
            min={MIN}
            max={MAX}
            step={50_000}
            value={monto}
            onChange={(e) => setMonto(Number(e.target.value))}
          />
          <div className="ctrl-hints">
            <span>{pesos(MIN)}</span>
            <span>{pesos(MAX)}</span>
          </div>
        </div>

        <div className="ctrl">
          <div className="ctrl-row">
            <label htmlFor="ebitda">EBITDA mensual</label>
            <span className="mono">{pesos(ebitdaMensual)}</span>
          </div>
          <input
            id="ebitda"
            type="range"
            min={30_000}
            max={1_500_000}
            step={10_000}
            value={ebitdaMensual}
            onChange={(e) => setEbitdaMensual(Number(e.target.value))}
          />
          <div className="ctrl-hints">
            <span>{pesos(30_000)}</span>
            <span>{pesos(1_500_000)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step3Garantia({ tipoGarantia, valorGarantia, setValorGarantia, ltv }) {
  const g = TIPO_GARANTIA.find((x) => x.id === tipoGarantia);
  return (
    <div className="pwz-step">
      <h3 className="pwz-title">Garantía</h3>
      <div className="pwz-grid2">
        <div className="ctrl">
          <div className="ctrl-row">
            <label htmlFor="garantia">Valor garantía</label>
            <span className="mono">{pesos(valorGarantia)}</span>
          </div>
          <input
            id="garantia"
            type="range"
            min={0}
            max={20_000_000}
            step={50_000}
            value={valorGarantia}
            onChange={(e) => setValorGarantia(Number(e.target.value))}
          />
          <div className="ctrl-hints">
            <span>{pesos(0)}</span>
            <span>{pesos(20_000_000)}</span>
          </div>
        </div>

        <div className="kpis kpis--mini">
          <div className="kpi">
            <span className="k-label">LTV estimado</span>
            <span className="k-value">
              {Number.isFinite(ltv) ? `${ltv.toFixed(0)}%` : "N/A"}
            </span>
          </div>
          <div className="kpi">
            <span className="k-label">Cap objetivo</span>
            <span className="k-value">{g?.ltvCap}%</span>
          </div>
          <p className="pwz-hint" style={{ gridColumn: "1 / -1", margin: 0 }}>
            LTV recomendado para {g?.label}: ≤ {g?.ltvCap}%.
          </p>
        </div>
      </div>
    </div>
  );
}

function Step3Skip() {
  return (
    <div className="pwz-step">
      <h3 className="pwz-title">Sin garantía</h3>
      <p className="pwz-hint">Seguimos con tu perfil operativo.</p>
    </div>
  );
}

function Step4Perfil({
  concentracion,
  setConcentracion,
  antiguedad,
  setAntiguedad,
  historial,
  setHistorial,
}) {
  return (
    <div className="pwz-step">
      <h3 className="pwz-title">Perfil operativo</h3>

      <div className="pwz-grid2">
        <div className="ctrl">
          <div className="ctrl-row">
            <label htmlFor="conc">Concentración top cliente</label>
            <span className="mono">{concentracion}%</span>
          </div>
          <input
            id="conc"
            type="range"
            min={0}
            max={100}
            step={1}
            value={concentracion}
            onChange={(e) => setConcentracion(Number(e.target.value))}
          />
          <div className="ctrl-hints">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="ctrl">
          <div className="ctrl-row">
            <label htmlFor="antig">Antigüedad de la empresa</label>
            <span className="mono">{antiguedad} años</span>
          </div>
          <input
            id="antig"
            type="range"
            min={0}
            max={20}
            step={1}
            value={antiguedad}
            onChange={(e) => setAntiguedad(Number(e.target.value))}
          />
          <div className="ctrl-hints">
            <span>0</span>
            <span>20</span>
          </div>
        </div>
      </div>

      <div className="pwz-row">
        <label className="pwz-label">Historial de pagos</label>
        <div className="seg" role="radiogroup" aria-label="Historial">
          {[
            { id: "ok", txt: "Impecable" },
            { id: "mild", txt: "Atrasos menores" },
            { id: "bad", txt: "Atrasos >30 días / reestructura" },
          ].map((o) => (
            <label
              key={o.id}
              className={`seg-btn ${historial === o.id ? "active" : ""}`}
            >
              <input
                type="radio"
                name="historial"
                value={o.id}
                checked={historial === o.id}
                onChange={() => setHistorial(o.id)}
              />
              {o.txt}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step5Resumen({
  conGarantia,
  tipoGarantia,
  plazo,
  monto,
  ebitdaMensual,
  valorGarantia,
  ltv,
  concentracion,
  antiguedad,
  historial,
}) {
  const tg = TIPO_GARANTIA.find((x) => x.id === tipoGarantia);
  return (
    <div className="pwz-step">
      <h3 className="pwz-title">Revisión rápida</h3>
      <ul className="pwz-summary">
        <li>
          <span>Modalidad</span>
          <strong>{conGarantia ? "Con garantía" : "Sin garantía"}</strong>
        </li>
        {conGarantia && (
          <li>
            <span>Tipo de garantía</span>
            <strong>{tg?.label}</strong>
          </li>
        )}
        <li>
          <span>Plazo</span>
          <strong>{plazo} meses</strong>
        </li>
        <li>
          <span>Monto</span>
          <strong>{pesos(monto)}</strong>
        </li>
        <li>
          <span>EBITDA mensual</span>
          <strong>{pesos(ebitdaMensual)}</strong>
        </li>
        {conGarantia && (
          <li>
            <span>Valor garantía</span>
            <strong>
              {pesos(valorGarantia)}{" "}
              {Number.isFinite(ltv) ? `· LTV ${ltv.toFixed(0)}%` : ""}
            </strong>
          </li>
        )}
        <li>
          <span>Concentración top cliente</span>
          <strong>{concentracion}%</strong>
        </li>
        <li>
          <span>Antigüedad</span>
          <strong>{antiguedad} años</strong>
        </li>
        <li>
          <span>Historial</span>
          <strong>
            {historial === "ok"
              ? "Impecable"
              : historial === "mild"
              ? "Atrasos menores"
              : "Atrasos >30d / reestructura"}
          </strong>
        </li>
      </ul>
    </div>
  );
}

function Step6Resultado({
  conGarantia,
  tipoGarantia,
  plazo,
  monto,
  tasaMin,
  tasaMax,
  tasaMid,
  pagoMid,
  feePct,
  comApertura,
  cat,
  dscrMid,
  lev,
  ltv,
}) {
  const tg = TIPO_GARANTIA.find((x) => x.id === tipoGarantia);

  const tabla = useMemo(
    () => amortizacion(monto, tasaMid, plazo),
    [monto, tasaMid, plazo]
  );
  const totalIntereses = useMemo(
    () => tabla.reduce((a, t) => a + t.interes, 0),
    [tabla]
  );
  const totalCapital = useMemo(
    () => tabla.reduce((a, t) => a + t.capital, 0),
    [tabla]
  );
  const totalCostos = totalIntereses + comApertura;
  const totalPagos = pagoMid * plazo;

  const saldoSerie = tabla.map((t) => t.saldo);
  const sparkPath = useMemo(() => {
    if (!saldoSerie.length) return "";
    const w = 260,
      h = 60,
      pad = 6;
    const max = Math.max(...saldoSerie);
    const min = Math.min(...saldoSerie);
    const norm = (v) =>
      h - pad - ((v - min) / Math.max(max - min || 1, 1)) * (h - pad * 2);
    const dx = (w - pad * 2) / Math.max(saldoSerie.length - 1, 1);
    return saldoSerie
      .map((y, i) => `${i === 0 ? "M" : "L"} ${pad + dx * i} ${norm(y)}`)
      .join(" ");
  }, [saldoSerie]);

  const [showTabla, setShowTabla] = useState(false);

  return (
    <div className="pwz-step">
      <h3 className="pwz-title">Resultado indicativo</h3>

      <article className="pwz-result">
        <header className="r-head">
          <span className="badge">Indicativo</span>
          <h4 className="r-title">
            {conGarantia ? "Crédito con garantía" : "Crédito sin garantía"}
          </h4>
          <p className="r-sub">
            Rango de tasa y términos estimados con base en tu perfil.
          </p>
        </header>

        <div className="r-grid r-grid--compact">
          <div className="cell">
            <span className="clabel">Rango de tasa fija anual</span>
            <div className="cvalue big">
              {pct(tasaMin, 1)} – {pct(tasaMax, 1)}
            </div>
          </div>
          <div className="cell">
            <span className="clabel">Tasa usada para estimar</span>
            <div className="cvalue">{pct(tasaMid, 1)}</div>
          </div>
          <div className="cell">
            <span className="clabel">Pago mensual estimado</span>
            <div className="cvalue">{pesos(pagoMid)}</div>
          </div>
          <div className="cell">
            <span className="clabel">Comisión de apertura</span>
            <div className="cvalue">
              {pct(feePct, 1)}{" "}
              <span className="sub">· {pesos(comApertura)}</span>
            </div>
          </div>
          <div className="cell">
            <span className="clabel">CAT estimado*</span>
            <div className="cvalue">{pct(cat, 1)}</div>
          </div>
        </div>

        <div className="r-extras">
          <div className="spark-card">
            <div className="spark-head">
              <span className="clabel">Saldo vs tiempo</span>
              <span className="spark-meta">{plazo} meses</span>
            </div>
            <svg
              className="spark"
              viewBox="0 0 260 60"
              role="img"
              aria-label="Saldo"
            >
              <path d={sparkPath} className="spark-line" />
            </svg>
          </div>

          <div className="stack-card">
            <div className="clabel">Composición de pagos</div>
            <div className="stack">
              <div
                className="stack-capital"
                style={{ width: `${(totalCapital / totalPagos) * 100 || 0}%` }}
                title={`Capital · ${pesos(totalCapital)}`}
              />
              <div
                className="stack-costos"
                style={{ width: `${(totalCostos / totalPagos) * 100 || 0}%` }}
                title={`Costos (interés+comisión) · ${pesos(totalCostos)}`}
              />
            </div>
            <div className="stack-legend">
              <span>
                <i className="sw s-cap" /> Capital {pesos(totalCapital)}
              </span>
              <span>
                <i className="sw s-cst" /> Costos {pesos(totalCostos)}
              </span>
            </div>
          </div>
        </div>

        <div className="table-box">
          <button
            className="btn btn-outline small"
            onClick={() => setShowTabla((v) => !v)}
            aria-expanded={showTabla}
            aria-controls="tabla-amort"
          >
            {showTabla ? "Ocultar detalle de pagos" : "Ver detalle de pagos"}
          </button>

          {showTabla && (
            <div id="tabla-amort" className="pay-table-wrap">
              <table className="pay-table">
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th>Pago</th>
                    <th>Interés</th>
                    <th>Capital</th>
                    <th>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {tabla.map((r) => (
                    <tr key={r.mes}>
                      <td>{r.mes}</td>
                      <td>{pesos(r.pago)}</td>
                      <td>{pesos(r.interes)}</td>
                      <td>{pesos(r.capital)}</td>
                      <td>{pesos(r.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className="r-foot">
          <div className="tags">
            <span className="tag">Plazo {plazo}m</span>
            <span className="tag">Monto {pesos(monto)}</span>
            <span className="tag">Flujo/SD {dscrMid.toFixed(2)}x</span>
            <span className="tag">Deuda/EBITDA {lev.toFixed(2)}x</span>
            {conGarantia && Number.isFinite(ltv) && (
              <span className="tag">
                LTV {ltv.toFixed(0)}% {tg ? `(${tg.label})` : ""}
              </span>
            )}
          </div>
        </footer>
      </article>
    </div>
  );
}
