// src/pages/Simulador.jsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/css/simulator.css";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const pesos = (x, max = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: max,
  }).format(x);

const pct = (x, digits = 1) => `${Number(x).toFixed(digits)}%`;

const PLAZOS = [12, 18, 24, 36, 48];

function pagoMensualAmort(M, tasaAnual, nMeses) {
  const r = tasaAnual / 100 / 12;
  if (r === 0) return M / nMeses;
  return (M * r) / (1 - Math.pow(1 + r, -nMeses));
}

function pagoMensualInterestOnly(M, tasaAnual) {
  const r = tasaAnual / 100 / 12;
  return M * r;
}

function catEstimado(tasaAnual, comAperturaPct, nMeses) {
  const rm = tasaAnual / 100 / 12;
  const ea = Math.pow(1 + rm, 12) - 1;
  const feeAnnualized = (comAperturaPct / 100) * (12 / Math.max(nMeses, 1));
  return (ea + feeAnnualized) * 100;
}

function buildSchedule(M, tasaAnual, nMeses, amortiza) {
  const r = tasaAnual / 100 / 12;

  // Amortización estándar (annuity)
  if (amortiza) {
    const cuota = pagoMensualAmort(M, tasaAnual, nMeses);
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

  // Interest-only + balloon final
  const pagoIO = pagoMensualInterestOnly(M, tasaAnual);
  let saldo = M;
  const filas = [];

  for (let i = 1; i <= nMeses; i++) {
    const interes = saldo * r;
    const capital = i === nMeses ? saldo : 0;
    const pago = i === nMeses ? pagoIO + saldo : pagoIO;
    saldo = i === nMeses ? 0 : saldo;
    filas.push({ mes: i, pago, interes, capital, saldo });
  }
  return filas;
}

function scoreUX({ ebitdaMensual, pagoMensual, leverage, ltv, garantias }) {
  // Score UX (NO MODELO REAL). Solo para lectura rápida.
  const flujoRatio = ebitdaMensual / Math.max(pagoMensual, 1);

  const flujoScore =
    flujoRatio > 1.7 ? 0.44 : flujoRatio > 1.3 ? 0.30 : flujoRatio > 1.1 ? 0.20 : 0.12;

  const ltvScore = !garantias
    ? 0.16
    : ltv < 55
    ? 0.34
    : ltv < 75
    ? 0.26
    : 0.18;

  const levScore = leverage < 3.5 ? 0.32 : leverage < 5 ? 0.24 : 0.16;

  const score = Math.min(1, flujoScore + ltvScore + levScore);

  const label =
    score >= 0.78 ? "Sano" : score >= 0.60 ? "Revisable" : "Ajusta términos";

  // Solo verde/amarillo
  const tone = score >= 0.78 ? "good" : "warn";

  return { score, label, tone, flujoRatio };
}

export default function Simulador() {
  // Wizard step: 1 intro, 2 inputs, 3 results
  const [step, setStep] = useState(1);

  // Producto (si lo quieres mantener)
  const [tipo, setTipo] = useState("simple"); // "simple" | "arrendamiento"
  const [garantias, setGarantias] = useState(true);
  const [amortiza, setAmortiza] = useState(true);

  // Inputs
  const [monto, setMonto] = useState(1_200_000);
  const [plazo, setPlazo] = useState(24);
  const [tasa, setTasa] = useState(23);
  const [fee, setFee] = useState(3.0);

  const [ebitdaMensual, setEbitdaMensual] = useState(150_000);
  const [valorGarantia, setValorGarantia] = useState(1_800_000);

  // Derived
  const pago = useMemo(() => {
    return amortiza
      ? pagoMensualAmort(monto, tasa, plazo)
      : pagoMensualInterestOnly(monto, tasa);
  }, [monto, tasa, plazo, amortiza]);

  const comApertura = useMemo(() => (monto * fee) / 100, [monto, fee]);
  const cat = useMemo(() => catEstimado(tasa, fee, plazo), [tasa, fee, plazo]);

  const tabla = useMemo(() => buildSchedule(monto, tasa, plazo, amortiza), [monto, tasa, plazo, amortiza]);

  const leverage = useMemo(() => monto / Math.max(ebitdaMensual * 12, 1), [monto, ebitdaMensual]);
  const ltv = useMemo(() => (garantias ? (monto / Math.max(valorGarantia, 1)) * 100 : NaN), [
    garantias,
    monto,
    valorGarantia,
  ]);

  const totalIntereses = useMemo(() => tabla.reduce((a, t) => a + t.interes, 0), [tabla]);
  const totalCapital = useMemo(() => tabla.reduce((a, t) => a + t.capital, 0), [tabla]);
  const totalCostos = useMemo(() => totalIntereses + comApertura, [totalIntereses, comApertura]);

  const { score, label: creditLabel, tone: creditTone, flujoRatio } = useMemo(
    () =>
      scoreUX({
        ebitdaMensual,
        pagoMensual: pago,
        leverage,
        ltv,
        garantias,
      }),
    [ebitdaMensual, pago, leverage, ltv, garantias]
  );

  // handlers para slider + number sync
  const setMontoSafe = (v) => setMonto(clamp(Number(v || 0), 100_000, 10_000_000));
  const setTasaSafe = (v) => setTasa(clamp(Number(v || 0), 18, 36));
  const setFeeSafe = (v) => setFee(clamp(Number(v || 0), 0, 6));
  const setEbitdaSafe = (v) => setEbitdaMensual(clamp(Number(v || 0), 30_000, 1_500_000));
  const setGarantiaSafe = (v) => setValorGarantia(clamp(Number(v || 0), 0, 20_000_000));

  const canGoStep3 = monto >= 100_000 && plazo >= 12 && tasa >= 0;

  return (
    <div className="app-container">
      <Navbar />

      <main className="sim3">
        {/* fondo sobrio */}
        <div className="sim3__bg" aria-hidden="true" />

        <div className="sim3__wrap">
          {/* top line */}
          <header className="sim3__top">
            <div className="sim3__titleBlock">
              <h1 className="sim3__h1"></h1>
              <p className="sim3__sub">
                
              </p>
            </div>

            <div className="sim3__steps" aria-label="Progreso">
              <div className={`sim3__step ${step === 1 ? "is-active" : step > 1 ? "is-done" : ""}`}>
                <span className="sim3__stepN">1</span>
                <span className="sim3__stepT">Iniciar</span>
              </div>
              <div className={`sim3__step ${step === 2 ? "is-active" : step > 2 ? "is-done" : ""}`}>
                <span className="sim3__stepN">2</span>
                <span className="sim3__stepT">Parámetros</span>
              </div>
              <div className={`sim3__step ${step === 3 ? "is-active" : ""}`}>
                <span className="sim3__stepN">3</span>
                <span className="sim3__stepT">Resultado</span>
              </div>
            </div>
          </header>

          {/* STEP 1 */}
          {step === 1 && (
            <section className="sim3__center">
              <div className="card3 card3--hero">
                <div className="card3__kicker">plataforma de crédito privado</div>
                <div className="card3__title">Simulador de crédito</div>
                <p className="card3__p">
                  
                </p>

                <div className="card3__actions">
                  <button className="btn3 btn3--primary" onClick={() => setStep(2)}>
                    Iniciar
                  </button>
                  <Link className="btn3 btn3--ghost" to="/solicitud">
                    Ir a solicitud
                  </Link>
                </div>

                <div className="card3__fine">
                  *Resultados indicativos. La oferta final depende de análisis de riesgo y documentación.
                </div>
              </div>
            </section>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <section className="sim3__grid">
              <div className="card3">
                <div className="card3__head">
                  <div>
                    <div className="card3__titleSm">Paso 2 · Parámetros</div>
                    <div className="card3__subSm">Puedes usar barra o ingresar el número exacto.</div>
                  </div>

                  <div className="miniBadge">
                    {tipo === "simple" ? "Crédito simple" : "Arrendamiento"} · {plazo}m
                  </div>
                </div>

                {/* toggles sobrios */}
                <div className="togRow">
                  <div className="tog">
                    <button className={`tog__btn ${tipo === "simple" ? "is-on" : ""}`} onClick={() => setTipo("simple")}>
                      Crédito simple
                    </button>
                    <button
                      className={`tog__btn ${tipo === "arrendamiento" ? "is-on" : ""}`}
                      onClick={() => setTipo("arrendamiento")}
                    >
                      Arrendamiento
                    </button>
                  </div>

                  <div className="tog">
                    <button className={`tog__btn ${garantias ? "is-on" : ""}`} onClick={() => setGarantias(true)}>
                      Con garantía
                    </button>
                    <button className={`tog__btn ${!garantias ? "is-on" : ""}`} onClick={() => setGarantias(false)}>
                      Sin garantía
                    </button>
                  </div>

                  <div className="tog">
                    <button className={`tog__btn ${amortiza ? "is-on" : ""}`} onClick={() => setAmortiza(true)}>
                      Amortiza
                    </button>
                    <button className={`tog__btn ${!amortiza ? "is-on" : ""}`} onClick={() => setAmortiza(false)}>
                      Sin amortizar
                    </button>
                  </div>
                </div>

                {/* Inputs */}
                <div className="formGrid">
                  {/* Monto */}
                  <div className="field3 field3--wide">
                    <div className="field3__top">
                      <label className="field3__label">Monto solicitado</label>
                      <div className="field3__val">{pesos(monto)}</div>
                    </div>

                    <input
                      className="range3"
                      type="range"
                      min={100_000}
                      max={10_000_000}
                      step={50_000}
                      value={monto}
                      onChange={(e) => setMontoSafe(e.target.value)}
                    />

                    <div className="field3__row">
                      <input
                        className="num3"
                        type="number"
                        min={100_000}
                        max={10_000_000}
                        step={50_000}
                        value={monto}
                        onChange={(e) => setMontoSafe(e.target.value)}
                      />
                      <span className="hint3">MXN</span>
                    </div>
                  </div>

                  {/* Plazo */}
                  <div className="field3">
                    <div className="field3__top">
                      <label className="field3__label">Plazo</label>
                      <div className="field3__val">{plazo} meses</div>
                    </div>
                    <div className="pillRow">
                      {PLAZOS.map((p) => (
                        <button
                          key={p}
                          className={`pillBtn ${plazo === p ? "is-on" : ""}`}
                          onClick={() => setPlazo(p)}
                        >
                          {p}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tasa */}
                  <div className="field3">
                    <div className="field3__top">
                      <label className="field3__label">Tasa anual</label>
                      <div className="field3__val">{pct(tasa, 1)}</div>
                    </div>
                    <input
                      className="range3"
                      type="range"
                      min={18}
                      max={36}
                      step={0.5}
                      value={tasa}
                      onChange={(e) => setTasaSafe(e.target.value)}
                    />
                    <div className="field3__row">
                      <input
                        className="num3"
                        type="number"
                        min={0}
                        max={60}
                        step={0.1}
                        value={tasa}
                        onChange={(e) => setTasaSafe(e.target.value)}
                      />
                      <span className="hint3">%</span>
                    </div>
                  </div>

                  {/* Fee */}
                  <div className="field3">
                    <div className="field3__top">
                      <label className="field3__label">Comisión de apertura</label>
                      <div className="field3__val">{pct(fee, 1)}</div>
                    </div>
                    <input
                      className="range3"
                      type="range"
                      min={0}
                      max={6}
                      step={0.1}
                      value={fee}
                      onChange={(e) => setFeeSafe(e.target.value)}
                    />
                    <div className="field3__row">
                      <input
                        className="num3"
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        value={fee}
                        onChange={(e) => setFeeSafe(e.target.value)}
                      />
                      <span className="hint3">%</span>
                    </div>
                  </div>

                  {/* EBITDA */}
                  <div className="field3">
                    <div className="field3__top">
                      <label className="field3__label">EBITDA mensual</label>
                      <div className="field3__val">{pesos(ebitdaMensual)}</div>
                    </div>
                    <input
                      className="range3"
                      type="range"
                      min={30_000}
                      max={1_500_000}
                      step={10_000}
                      value={ebitdaMensual}
                      onChange={(e) => setEbitdaSafe(e.target.value)}
                    />
                    <div className="field3__row">
                      <input
                        className="num3"
                        type="number"
                        min={0}
                        step={10_000}
                        value={ebitdaMensual}
                        onChange={(e) => setEbitdaSafe(e.target.value)}
                      />
                      <span className="hint3">MXN</span>
                    </div>
                  </div>

                  {/* Garantía */}
                  <div className="field3">
                    <div className="field3__top">
                      <label className="field3__label">Valor de la garantía</label>
                      <div className="field3__val">{garantias ? pesos(valorGarantia) : "Sin garantía"}</div>
                    </div>

                    <input
                      className="range3"
                      type="range"
                      min={0}
                      max={20_000_000}
                      step={50_000}
                      value={garantias ? valorGarantia : 0}
                      onChange={(e) => setGarantiaSafe(e.target.value)}
                      disabled={!garantias}
                    />

                    <div className="field3__row">
                      <input
                        className="num3"
                        type="number"
                        min={0}
                        step={50_000}
                        value={garantias ? valorGarantia : 0}
                        onChange={(e) => setGarantiaSafe(e.target.value)}
                        disabled={!garantias}
                      />
                      <span className="hint3">MXN</span>
                    </div>
                  </div>
                </div>

                {/* bottom actions */}
                <div className="card3__actionsRow">
                  <button className="btn3 btn3--ghost" onClick={() => setStep(1)}>
                    Volver
                  </button>
                  <button
                    className="btn3 btn3--primary"
                    disabled={!canGoStep3}
                    onClick={() => setStep(3)}
                  >
                    Calcular
                  </button>
                </div>
              </div>

              {/* Side preview (sobrio, sin tabla aún) */}
              <aside className="card3 card3--side">
                <div className="card3__titleSm">Vista previa</div>
                <div className="kv">
                  <span className="kv__k">Pago estimado</span>
                  <span className="kv__v">{pesos(pago)}</span>
                </div>
                <div className="kv">
                  <span className="kv__k">CAT estimado</span>
                  <span className="kv__v">{pct(cat, 1)}</span>
                </div>
                <div className="kv">
                  <span className="kv__k">Apalancamiento</span>
                  <span className="kv__v">{leverage.toFixed(2)}x</span>
                </div>
                <div className="kv">
                  <span className="kv__k">Flujo / Pago</span>
                  <span className={`kv__v ${creditTone === "good" ? "t-good" : "t-warn"}`}>
                    {flujoRatio.toFixed(2)}x
                  </span>
                </div>

                <div className="scoreBar">
                  <div className="scoreBar__line" />
                  <div className="scoreBar__fill" style={{ width: `${Math.round(score * 100)}%` }} />
                </div>
                <div className="scoreText">
                  Salud estimada: <strong className={creditTone === "good" ? "t-good" : "t-warn"}>{creditLabel}</strong>{" "}
                  · {Math.round(score * 100)}%
                </div>

                <div className="sideNote">
                  Tip: si el flujo/pago baja de 1.3x, ajusta plazo, monto o estructura.
                </div>
              </aside>
            </section>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <section className="sim3__stack">
              <div className="card3">
                <div className="card3__head">
                  <div>
                    <div className="card3__titleSm">Paso 3 · Resultado</div>
                    <div className="card3__subSm">
                      {amortiza ? "Calendario amortizable" : "Interest-only + balloon final"} · {plazo} meses
                    </div>
                  </div>

                  <div className={`status3 ${creditTone === "good" ? "is-good" : "is-warn"}`}>
                    <span className="status3__k">Salud</span>
                    <span className="status3__v">{creditLabel}</span>
                  </div>
                </div>

                {/* KPI row sobria */}
                <div className="kpi3">
                  <div className="kpi3__item">
                    <div className="kpi3__k">Pago mensual</div>
                    <div className="kpi3__v t-good">{pesos(pago)}</div>
                    <div className="kpi3__s">{amortiza ? "Capital + interés" : "Interés (balloon al final)"}</div>
                  </div>

                  <div className="kpi3__item">
                    <div className="kpi3__k">CAT estimado*</div>
                    <div className="kpi3__v t-warn">{pct(cat, 1)}</div>
                    <div className="kpi3__s">Incluye comisión anualizada</div>
                  </div>

                  <div className="kpi3__item">
                    <div className="kpi3__k">Apalancamiento</div>
                    <div className="kpi3__v">{leverage.toFixed(2)}x</div>
                    <div className="kpi3__s">{leverage < 4 ? "Rango típico" : "Revisar covenant"}</div>
                  </div>

                  <div className="kpi3__item">
                    <div className="kpi3__k">Flujo / pago</div>
                    <div className={`kpi3__v ${creditTone === "good" ? "t-good" : "t-warn"}`}>
                      {flujoRatio.toFixed(2)}x
                    </div>
                    <div className="kpi3__s">Objetivo: &gt; 1.5x</div>
                  </div>
                </div>

                {/* summary costs */}
                <div className="sum3">
                  <span>Intereses: {pesos(totalIntereses)}</span>
                  <span>Comisión: {pesos(comApertura)}</span>
                  <span>Capital: {pesos(totalCapital)}</span>
                  <span>
                    Costos/Total:{" "}
                    {(
                      (totalCostos / Math.max(totalCapital + totalCostos, 1)) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>

                {/* table (fixed height, no crecer) */}
                <div className="table3">
                  <table>
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
                      {tabla.map((t) => (
                        <tr key={t.mes}>
                          <td>{t.mes}</td>
                          <td>{pesos(t.pago)}</td>
                          <td>{pesos(t.interes)}</td>
                          <td>{pesos(t.capital)}</td>
                          <td>{pesos(t.saldo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="fine3">
                  *CAT estimado, sin IVA, cálculo indicativo. La oferta final puede variar según análisis de riesgo.
                </p>

                <div className="card3__actionsRow">
                  <button className="btn3 btn3--ghost" onClick={() => setStep(2)}>
                    Editar parámetros
                  </button>
                  <Link className="btn3 btn3--primary" to="/solicitud">
                    Continuar con solicitud
                  </Link>
                </div>
              </div>

              <div className="card3 card3--miniNote">
                <div className="card3__titleSm">Siguiente paso sugerido</div>
                <div className="card3__subSm">
                  Si quieres mejorar salud: sube plazo, baja monto o cambia estructura (amortiza vs bullet).
                </div>
                <div className="miniActions">
                  <button className="btn3 btn3--ghost" onClick={() => setStep(2)}>Ajustar</button>
                  <Link className="btn3 btn3--ghost" to="/productos">Ver productos</Link>
                  <Link className="btn3 btn3--ghost" to="/ingresar">Entrar</Link>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
