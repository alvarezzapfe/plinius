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
   Wizard compacto
   =========================================================== */
export default function Pricing() {
  const [step, setStep] = useState(1);
  const totalSteps = 6;

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

  const next = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="app-container">
      <Navbar />
      <main className="pwz">
        <div className="pwz__bg" aria-hidden />
        <div className="pwz__wrap">
          <header className="pwz-head">
            <h1>Pricing indicativo</h1>
            <p className="pwz-sub">
              Completa los pasos. El cálculo es indicativo y puede ajustarse
              tras revisión documental.
            </p>
          </header>

          {/* Stepper */}
          <div
            className="pwz-stepper"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-valuenow={step}
          >
            <div className="pwz-stepper__bar">
              <div
                className="pwz-stepper__fill"
                style={{
                  width: `${(step - 1) * (100 / (totalSteps - 1))}%`,
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

          {/* Card compacta (altura fija + scroll interno si hace falta) */}
          <section className="pwz-card">
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
                <button type="button" className="btn btn-neon" onClick={next}>
                  Siguiente
                </button>
              )}
              {step === 5 && (
                <button
                  type="button"
                  className="btn btn-neon"
                  onClick={() => setStep(6)}
                >
                  Calcular
                </button>
              )}
              {step === 6 && (
                <div className="pwz-result-ctas">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setStep(1)}
                  >
                    Editar respuestas
                  </button>
                  <Link to="/login" className="btn btn-neon">
                    Solicitar ahora
                  </Link>
                </div>
              )}
            </div>
          </section>

          <p className="pwz-note">
            *Valores **indicativos** sujetos a validación y políticas de
            crédito. CAT estimado sin IVA.
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
