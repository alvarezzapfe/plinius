// src/pages/Calculadora.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/css/calculadora.css";

/** ==================== Utilidades base ==================== **/
const fmt = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 4 });
const money = (x, max = 2) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: max,
  }).format(x);
const pct = (x, d = 2) => `${globalThis.Number(x ?? 0).toFixed(d)}%`;
const toNum = (v) => (v === "" || v === null ? 0 : globalThis.Number(v));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const idGen = () =>
  globalThis.crypto?.randomUUID?.() ??
  `id_${Math.random().toString(36).slice(2)}`;

/** ==================== Math helpers ==================== **/
function phi(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429;
  const erf =
    1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}
function normPdf(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}
const linspace = (a, b, n) => {
  if (n <= 1) return [a];
  const step = (b - a) / (n - 1);
  return Array.from({ length: n }, (_, i) => a + step * i);
};
const lerp = (a, b, t) => a + (b - a) * t;
function interpLinear(xs, ys, x) {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  let i = 0;
  while (x > xs[i + 1]) i++;
  const t = (x - xs[i]) / (xs[i + 1] - xs[i] || 1);
  return lerp(ys[i], ys[i + 1], t);
}

/** ==================== Bonos / CETES ==================== **/
function bondPrice(face, couponRate, ytm, nPeriods, freq) {
  const c = ((couponRate / 100) * face) / freq;
  const y = ytm / 100 / freq;
  let p = 0;
  for (let t = 1; t <= nPeriods; t++) p += c / Math.pow(1 + y, t);
  return p + face / Math.pow(1 + y, nPeriods);
}
function bondYTM(price, face, couponRate, nPeriods, freq) {
  let lo = 0.0,
    hi = 0.6;
  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2;
    const p = bondPrice(face, couponRate, mid * 100, nPeriods, freq);
    p > price ? (lo = mid) : (hi = mid);
  }
  return ((lo + hi) / 2) * 100;
}
function bondCashflows(face, couponRate, nPeriods, freq) {
  const c = ((couponRate / 100) * face) / freq;
  return Array.from({ length: nPeriods }, (_, i) => {
    const t = i + 1;
    return { t, cf: t < nPeriods ? c : c + face };
  });
}
function bondRisk(face, coupon, ytm, n, freq) {
  // Dur Macaulay, Mod y Convexidad
  const y = ytm / 100 / freq;
  const c = ((coupon / 100) * face) / freq;
  let P = 0,
    Dur = 0,
    Conv = 0;
  for (let t = 1; t <= n; t++) {
    const df = Math.pow(1 + y, -t);
    const cf = t < n ? c : c + face;
    P += cf * df;
    Dur += t * cf * df;
    Conv += t * (t + 1) * cf * df;
  }
  const macaulay = Dur / P / freq;
  const mod = macaulay / (1 + y);
  // Convexidad anualizada (conv = 1/P * sum t(t+1)cf/(1+y)^(t+2)) / freq^2
  const convex = Conv / Math.pow(1 + y, 2) / P / (freq * freq);
  const dv01 = (mod * P) / 10000; // aprox ΔP por 1bp
  return { macaulay, mod, convex, dv01, price: P };
}

function cetesPrice(face, annualRatePct, days) {
  const r = annualRatePct / 100;
  const t = days / 360;
  return face / (1 + r * t);
}
function cetesYieldFromPrice(face, price, days) {
  const t = days / 360;
  return t <= 0 ? 0 : ((face / price - 1) / t) * 100;
}
function tasaEfectivaAnualSimple(r360) {
  // convierte tasa simple 360 a efectiva anual (compuesta)
  const r = r360 / 100;
  return (Math.pow(1 + r * (360 / 360), 1) - 1) * 100;
}
function tasaNominal365(rEfectiva) {
  // convierte efectiva anual a nominal 365 simple (aprox)
  const ea = rEfectiva / 100;
  return ((ea * 365) / 360) * 100;
}

/** ==================== Swap TIIE ==================== **/
function dfFlat(r, t) {
  return 1 / (1 + r * t);
} // simple
function dfCont(z, t) {
  return Math.exp(-z * t);
} // continuo
function parSwapRateFlat(rDisc, delta, n) {
  let A = 0;
  for (let i = 1; i <= n; i++) A += dfFlat(rDisc, i * delta) * delta;
  const DFN = dfFlat(rDisc, n * delta);
  return ((1 - DFN) / A) * 100;
}
function parSwapRateCurve(nodes, delta, n) {
  let A = 0;
  for (let i = 1; i <= n; i++) {
    const t = i * delta;
    const z = curveZ(nodes, t);
    A += dfCont(z, t) * delta;
  }
  const zN = curveZ(nodes, n * delta);
  const DFN = dfCont(zN, n * delta);
  return ((1 - DFN) / A) * 100;
}
function swapPVFlat(notional, fixedPct, rDisc, delta, n) {
  const S_par = parSwapRateFlat(rDisc, delta, n) / 100;
  let A = 0;
  for (let i = 1; i <= n; i++) A += dfFlat(rDisc, i * delta) * delta;
  return notional * (fixedPct / 100 - S_par) * A;
}
function swapPVCurve(notional, fixedPct, nodes, delta, n) {
  // descuento con curva cero continua
  let A = 0;
  for (let i = 1; i <= n; i++) {
    const t = i * delta;
    const z = curveZ(nodes, t);
    A += dfCont(z, t) * delta;
  }
  const zN = curveZ(nodes, n * delta);
  const DFN = dfCont(zN, n * delta);
  const S_par = (1 - DFN) / A;
  return notional * (fixedPct / 100 - S_par) * A;
}
function curveZ(nodes, t) {
  // nodes: [{t, z}] tasas cero (anual) en comp contínua
  const xs = nodes.map((n) => n.t);
  const ys = nodes.map((n) => n.z);
  return interpLinear(xs, ys, t);
}

/** ==================== Opciones (GK / BS) ==================== **/
function gkCore(S, K, rd, rf, sig, T) {
  const srt = sig * Math.sqrt(T);
  const d1 = (Math.log(S / K) + (rd - rf + 0.5 * sig * sig) * T) / (srt || 1);
  const d2 = d1 - (srt || 0);
  const dfR = Math.exp(-rd * T),
    dfF = Math.exp(-rf * T);
  return { d1, d2, dfR, dfF };
}
function gkPrice(S, K, rDom, rFor, vol, T, isCall = true) {
  const sig = vol / 100,
    rd = rDom / 100,
    rf = rFor / 100;
  if (T <= 0) return Math.max(isCall ? S - K : K - S, 0);
  const { d1, d2, dfR, dfF } = gkCore(S, K, rd, rf, sig, T);
  if (isCall) return S * dfF * phi(d1) - K * dfR * phi(d2);
  return K * dfR * phi(-d2) - S * dfF * phi(-d1);
}
function gkGreeks(S, K, rDom, rFor, vol, T, isCall = true) {
  const sig = vol / 100,
    rd = rDom / 100,
    rf = rFor / 100;
  const { d1, d2, dfR, dfF } = gkCore(S, K, rd, rf, sig, T);
  const Nd1 = phi(d1),
    Nd2 = phi(d2),
    nd1 = normPdf(d1);
  const callDelta = dfF * Nd1,
    putDelta = callDelta - dfF;
  const gamma = (dfF * nd1) / (S * sig * Math.sqrt(T || 1e-8));
  const vega = S * dfF * nd1 * Math.sqrt(T); // por 1.00 de vol (100%)
  const thetaCall =
    -(S * dfF * nd1 * sig) / (2 * Math.sqrt(T)) -
    rd * K * dfR * Nd2 +
    rf * S * dfF * Nd1;
  const thetaPut =
    -(S * dfF * nd1 * sig) / (2 * Math.sqrt(T)) +
    rd * K * dfR * phi(-d2) -
    rf * S * dfF * phi(-d1);
  const rhoCall = K * T * dfR * Nd2;
  const rhoPut = -K * T * dfR * phi(-d2);
  return {
    delta: isCall ? callDelta : putDelta,
    gamma,
    vega,
    theta: isCall ? thetaCall : thetaPut,
    rho: isCall ? rhoCall : rhoPut,
    Nd1,
    Nd2,
  };
}

function bsCore(S, K, rd, q, sig, T) {
  const srt = sig * Math.sqrt(T);
  const d1 = (Math.log(S / K) + (rd - q + 0.5 * sig * sig) * T) / (srt || 1);
  const d2 = d1 - (srt || 0);
  const dfR = Math.exp(-rd * T),
    dfQ = Math.exp(-q * T);
  return { d1, d2, dfR, dfQ };
}
function bsPrice(S, K, r, q, vol, T, isCall = true) {
  const sig = vol / 100,
    rd = r / 100,
    dq = q / 100;
  if (T <= 0) return Math.max(isCall ? S - K : K - S, 0);
  const { d1, d2, dfR, dfQ } = bsCore(S, K, rd, dq, sig, T);
  if (isCall) return S * dfQ * phi(d1) - K * dfR * phi(d2);
  return K * dfR * phi(-d2) - S * dfQ * phi(-d1);
}
function bsGreeks(S, K, r, q, vol, T, isCall = true) {
  const sig = vol / 100,
    rd = r / 100,
    dq = q / 100;
  const { d1, d2, dfR, dfQ } = bsCore(S, K, rd, dq, sig, T);
  const Nd1 = phi(d1),
    Nd2 = phi(d2),
    nd1 = normPdf(d1);
  const callDelta = dfQ * Nd1,
    putDelta = callDelta - dfQ;
  const gamma = (dfQ * nd1) / (S * sig * Math.sqrt(T || 1e-8));
  const vega = S * dfQ * nd1 * Math.sqrt(T);
  const thetaCall =
    -(S * dfQ * nd1 * sig) / (2 * Math.sqrt(T)) -
    rd * K * dfR * Nd2 +
    dq * S * dfQ * Nd1;
  const thetaPut =
    -(S * dfQ * nd1 * sig) / (2 * Math.sqrt(T)) +
    rd * K * dfR * phi(-d2) -
    dq * S * dfQ * phi(-d1);
  const rhoCall = K * T * dfR * Nd2;
  const rhoPut = -K * T * dfR * phi(-d2);
  return {
    delta: isCall ? callDelta : putDelta,
    gamma,
    vega,
    theta: isCall ? thetaCall : thetaPut,
    rho: isCall ? rhoCall : rhoPut,
    Nd1,
    Nd2,
  };
}

/** ==================== Paleta y estado ==================== **/
const PALETTE = [
  "#eaff00",
  "#76b6ff",
  "#ffd166",
  "#ff6b6b",
  "#b692ff",
  "#7fffd4",
  "#f8a5ff",
  "#9cffd0",
];

/** ==================== Componente principal ==================== **/
export default function Calculadora() {
  const [tab, setTab] = useState("bonos"); // bonos | cetes | swap | fx | vanilla
  const [escenarios, setEscenarios] = useLocalStorage(
    "calc_pro_escenarios",
    []
  );
  const addScenario = (s) =>
    setEscenarios((old) => [
      ...old,
      { id: idGen(), color: PALETTE[old.length % PALETTE.length], ...s },
    ]);
  const removeScenario = (id) =>
    setEscenarios((old) => old.filter((x) => x.id !== id));
  const clearAll = () => setEscenarios([]);

  // Selector de métrica de gráfica por tab
  const metricOptions = {
    bonos: [
      { id: "price_ytm", label: "Precio vs YTM" },
      { id: "dv01_ytm", label: "DV01 vs YTM" },
    ],
    cetes: [{ id: "price_rate", label: "Precio vs Tasa simple (360)" }],
    swap: [
      { id: "pv_fixed", label: "PV vs Tasa fija" },
      { id: "pv_shift", label: "PV vs Shift (bps)" },
    ],
    fx: [
      { id: "px_spot", label: "Precio vs Spot" },
      { id: "delta_spot", label: "Delta vs Spot" },
      { id: "vega_vol", label: "Vega vs Vol" },
    ],
    vanilla: [
      { id: "px_spot", label: "Precio vs Spot" },
      { id: "delta_spot", label: "Delta vs Spot" },
      { id: "vega_vol", label: "Vega vs Vol" },
    ],
  };
  const [metric, setMetric] = useState("price_ytm");
  useEffect(() => {
    const def = metricOptions[tab][0]?.id;
    if (def && !metricOptions[tab].some((m) => m.id === metric)) {
      setMetric(def);
    }
  }, [tab]); // eslint-disable-line

  return (
    <div className="app-container">
      <Navbar />
      <main className="calc">
        <div className="calc-bg" aria-hidden />
        <div className="calc-wrap">
          <header className="calc-head">
            <h1>Calculadora avanzada</h1>
            <p className="calc-sub">
              Bonos & CETES, Swap TIIE y Opciones (FX & BS) con escenarios,
              métricas de riesgo y gráficas comparativas.
            </p>
            <div className="calc-tabs" role="tablist" aria-label="Instrumentos">
              {["bonos", "cetes", "swap", "fx", "vanilla"].map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  className={`tab ${tab === t ? "active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {labelTab(t)}
                </button>
              ))}
            </div>
          </header>

          <section className="calc-grid">
            <div className="calc-left">
              {tab === "bonos" && <BonosCard onSave={addScenario} />}
              {tab === "cetes" && <CetesCard onSave={addScenario} />}
              {tab === "swap" && <SwapCard onSave={addScenario} />}
              {tab === "fx" && <FxCard onSave={addScenario} />}
              {tab === "vanilla" && <VanillaCard onSave={addScenario} />}
            </div>

            <div className="calc-right">
              <ComparePanel
                tab={tab}
                metric={metric}
                setMetric={setMetric}
                metricOptions={metricOptions[tab]}
                escenarios={escenarios}
                onRemove={removeScenario}
                onClear={clearAll}
              />
            </div>
          </section>

          <div className="calc-bottom">
            <Link to="/simulador" className="btn btn-outline">
              ← Volver al simulador
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/** ==================== Tarjetas por instrumento ==================== **/
function BonosCard({ onSave }) {
  const [face, setFace] = useState(100.0);
  const [coupon, setCoupon] = useState(9.0);
  const [ytm, setYtm] = useState(10.5);
  const [years, setYears] = useState(5);
  const [freq, setFreq] = useState(2);

  const n = years * freq;
  const price = useMemo(
    () => bondPrice(face, coupon, ytm, n, freq),
    [face, coupon, ytm, n, freq]
  );
  const { macaulay, mod, convex, dv01 } = useMemo(
    () => bondRisk(face, coupon, ytm, n, freq),
    [face, coupon, ytm, n, freq]
  );
  const cfs = useMemo(
    () => bondCashflows(face, coupon, n, freq),
    [face, coupon, n, freq]
  );

  const save = () =>
    onSave({
      kind: "bono",
      label: `Bono ${coupon}% ${years}a`,
      face,
      coupon,
      ytm,
      years,
      freq,
      price,
      macaulay,
      mod,
      convex,
      dv01,
    });

  return (
    <div className="card">
      <h3>Bonos (Mbonos · cupón fijo)</h3>
      <div className="toolbar">
        <Chip>DV01: {money(dv01, 4)}</Chip>
        <Chip>Dur. Mod: {fmt.format(mod)}a</Chip>
        <Chip>Convex: {fmt.format(convex)}</Chip>
      </div>

      <div className="form grid2">
        <NumInput
          label="Valor nominal"
          value={face}
          onChange={setFace}
          suffix="MXN"
        />
        <NumInput
          label="Cupón anual"
          value={coupon}
          onChange={setCoupon}
          suffix="%"
          step="0.1"
        />
        <NumInput
          label="YTM anual"
          value={ytm}
          onChange={setYtm}
          suffix="%"
          step="0.1"
        />
        <NumInput
          label="Años a vencimiento"
          value={years}
          onChange={setYears}
          step="1"
        />
        <Select
          label="Frecuencia"
          value={freq}
          onChange={setFreq}
          options={[
            { label: "Anual (1)", value: 1 },
            { label: "Semestral (2)", value: 2 },
            { label: "Trimestral (4)", value: 4 },
          ]}
        />
      </div>

      <div className="kpis">
        <KPI label="Precio" value={money(price)} />
        <KPI label="Dur. Macaulay" value={`${fmt.format(macaulay)} años`} />
        <KPI label="Dur. Modificada" value={`${fmt.format(mod)} años`} />
      </div>

      <Disclosure title="Cashflows">
        <div className="table-wrap">
          <table className="cmp-table">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Flujo</th>
              </tr>
            </thead>
            <tbody>
              {cfs.map((r) => (
                <tr key={r.t}>
                  <td>{r.t}</td>
                  <td>{money(r.cf, 4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Disclosure>

      <div className="actions">
        <button className="btn btn-neon" onClick={save}>
          Guardar escenario
        </button>
      </div>
    </div>
  );
}

function CetesCard({ onSave }) {
  const [face, setFace] = useState(10.0);
  const [days, setDays] = useState(91);
  const [rate, setRate] = useState(10.0);

  const price = useMemo(() => cetesPrice(face, rate, days), [face, rate, days]);
  const yld = useMemo(
    () => cetesYieldFromPrice(face, price, days),
    [face, price, days]
  );
  const ea = useMemo(() => tasaEfectivaAnualSimple(rate), [rate]);
  const r365 = useMemo(() => tasaNominal365(ea), [ea]);

  const save = () =>
    onSave({
      kind: "cetes",
      label: `CETES ${days}d`,
      face,
      days,
      rate,
      price,
      yld,
      ea,
      r365,
    });

  return (
    <div className="card">
      <h3>CETES (descuento simple 360)</h3>
      <div className="toolbar">
        <Chip>Equiv. Efectiva anual: {pct(ea, 2)}</Chip>
        <Chip>Nominal 365 (aprox): {pct(r365, 2)}</Chip>
      </div>
      <div className="form grid2">
        <NumInput
          label="Valor nominal"
          value={face}
          onChange={setFace}
          suffix="MXN"
        />
        <Select
          label="Días"
          value={days}
          onChange={setDays}
          options={[
            { label: "28", value: 28 },
            { label: "91", value: 91 },
            { label: "182", value: 182 },
            { label: "364", value: 364 },
          ]}
        />
        <NumInput
          label="Tasa anual simple (360)"
          value={rate}
          onChange={setRate}
          suffix="%"
          step="0.1"
        />
        <Read label="Precio" value={money(price)} />
      </div>
      <div className="kpis">
        <KPI label="Rendimiento implícito" value={pct(yld, 2)} />
      </div>

      <Disclosure title="Detalle">
        <ul className="legend">
          <li>t = {days}/360 años</li>
          <li>Precio = Face / (1 + r·t)</li>
        </ul>
      </Disclosure>

      <div className="actions">
        <button className="btn btn-neon" onClick={save}>
          Guardar escenario
        </button>
      </div>
    </div>
  );
}

function SwapCard({ onSave }) {
  const [modeCurve, setModeCurve] = useState("flat"); // flat | curve
  const [notional, setNotional] = useState(10_000_000);
  const [years, setYears] = useState(3);
  const [delta, setDelta] = useState(0.25);
  const [rDisc, setRDisc] = useState(12.0);
  const [fixed, setFixed] = useState(11.5);

  const [nodes, setNodes] = useState([
    { id: idGen(), t: 0.25, z: 0.12 },
    { id: idGen(), t: 1.0, z: 0.115 },
    { id: idGen(), t: 2.0, z: 0.108 },
    { id: idGen(), t: 3.0, z: 0.103 },
    { id: idGen(), t: 5.0, z: 0.098 },
  ]); // z en decimales

  const n = Math.round(years / delta);
  const spar = useMemo(() => {
    if (modeCurve === "flat") return parSwapRateFlat(rDisc / 100, delta, n);
    // curva: nodos en decimales, par en %
    return parSwapRateCurve(nodes, delta, n);
  }, [modeCurve, rDisc, nodes, delta, n]);

  const pv = useMemo(() => {
    if (modeCurve === "flat")
      return swapPVFlat(notional, fixed, rDisc / 100, delta, n);
    return swapPVCurve(notional, fixed, nodes, delta, n);
  }, [modeCurve, notional, fixed, rDisc, nodes, delta, n]);

  const dv01 = useMemo(() => {
    // Shock +1bp a tasa de descuento (o a toda la curva en continuo)
    const shock = 1 / 10000;
    if (modeCurve === "flat") {
      const pvUp = swapPVFlat(notional, fixed, rDisc / 100 + shock, delta, n);
      return pvUp - pv;
    }
    const bumped = nodes.map((nd) => ({ ...nd, z: nd.z + shock }));
    const pvUp = swapPVCurve(notional, fixed, bumped, delta, n);
    return pvUp - pv;
  }, [modeCurve, notional, fixed, rDisc, nodes, delta, n, pv]);

  const save = () =>
    onSave({
      kind: "swap",
      label: `Swap ${years}a ${fixed.toFixed(2)}% (${modeCurve})`,
      notional,
      years,
      delta,
      rDisc,
      fixed,
      pv,
      spar,
      curve: modeCurve === "curve" ? nodes : null,
    });

  const addNode = () =>
    setNodes((xs) =>
      [...xs, { id: idGen(), t: 4.0, z: 0.1 }].sort((a, b) => a.t - b.t)
    );
  const removeNode = (id) => setNodes((xs) => xs.filter((x) => x.id !== id));
  const updateNode = (id, key, val) =>
    setNodes((xs) => {
      const ys = xs.map((x) => (x.id === id ? { ...x, [key]: val } : x));
      return ys.sort((a, b) => a.t - b.t);
    });

  return (
    <div className="card">
      <h3>Swap TIIE (fijo ↔ flotante)</h3>

      <div className="toolbar">
        <Chip>Par rate: {pct(spar, 2)}</Chip>
        <Chip>PV: {money(pv, 0)}</Chip>
        <Chip>DV01: {money(dv01, 0)}</Chip>
      </div>

      <div className="form grid2">
        <Select
          label="Modo curva"
          value={modeCurve}
          onChange={setModeCurve}
          options={[
            { label: "Curva plana (simple)", value: "flat" },
            { label: "Curva cero personalizada", value: "curve" },
          ]}
        />
        <NumInput
          label="Notional"
          value={notional}
          onChange={setNotional}
          suffix="MXN"
          step="100000"
        />
        <NumInput label="Años" value={years} onChange={setYears} step="1" />
        <Select
          label="Frecuencia (delta)"
          value={delta}
          onChange={setDelta}
          options={[
            { label: "Mensual (1/12)", value: 1 / 12 },
            { label: "Bimestral (1/6)", value: 1 / 6 },
            { label: "Trimestral (1/4)", value: 0.25 },
            { label: "Semestral (1/2)", value: 0.5 },
          ]}
        />
        {modeCurve === "flat" ? (
          <NumInput
            label="Tasa de descuento anual (TIIE)"
            value={rDisc}
            onChange={setRDisc}
            suffix="%"
            step="0.1"
          />
        ) : (
          <NumInput
            label="Tasa fija del swap"
            value={fixed}
            onChange={setFixed}
            suffix="%"
            step="0.1"
          />
        )}
        {modeCurve === "flat" && (
          <NumInput
            label="Tasa fija del swap"
            value={fixed}
            onChange={setFixed}
            suffix="%"
            step="0.1"
          />
        )}
      </div>

      {modeCurve === "curve" && (
        <Disclosure title="Curva cero (comp. continua)">
          <div className="rowlist">
            {nodes.map((nd) => (
              <div key={nd.id} className="row">
                <div className="row-col">
                  <label>Tenor (años)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={nd.t}
                    onChange={(e) =>
                      updateNode(nd.id, "t", toNum(e.target.value))
                    }
                  />
                </div>
                <div className="row-col">
                  <label>z(t) (decimal)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={nd.z}
                    onChange={(e) =>
                      updateNode(nd.id, "z", toNum(e.target.value))
                    }
                  />
                </div>
                <button
                  className="btn btn-outline sm"
                  onClick={() => removeNode(nd.id)}
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button className="btn btn-neon sm" onClick={addNode}>
              + Agregar nodo
            </button>
          </div>
        </Disclosure>
      )}

      <div className="actions">
        <button className="btn btn-neon" onClick={save}>
          Guardar escenario
        </button>
      </div>
    </div>
  );
}

function FxCard({ onSave }) {
  const [S, setS] = useState(17.0);
  const [K, setK] = useState(17.0);
  const [rDom, setRDom] = useState(11.0);
  const [rFor, setRFor] = useState(5.0);
  const [vol, setVol] = useState(12.0);
  const [T, setT] = useState(0.5);
  const [isCall, setIsCall] = useState(true);

  const price = useMemo(
    () => gkPrice(S, K, rDom, rFor, vol, T, isCall),
    [S, K, rDom, rFor, vol, T, isCall]
  );
  const greeks = useMemo(
    () => gkGreeks(S, K, rDom, rFor, vol, T, isCall),
    [S, K, rDom, rFor, vol, T, isCall]
  );

  const save = () =>
    onSave({
      kind: "fx",
      label: `FX ${isCall ? "Call" : "Put"} K=${K}`,
      S,
      K,
      rDom,
      rFor,
      vol,
      T,
      isCall,
      price,
      greeks,
    });

  return (
    <div className="card">
      <h3>Opciones FX (Garman–Kohlhagen)</h3>
      <div className="toolbar">
        <Chip>Δ {fmt.format(greeks.delta)}</Chip>
        <Chip>Γ {fmt.format(greeks.gamma)}</Chip>
        <Chip>Vega {fmt.format(greeks.vega)}</Chip>
        <Chip>θ {fmt.format(greeks.theta)}</Chip>
        <Chip>ρ {fmt.format(greeks.rho)}</Chip>
      </div>

      <div className="form grid2">
        <NumInput label="Spot (S)" value={S} onChange={setS} />
        <NumInput label="Strike (K)" value={K} onChange={setK} />
        <NumInput
          label="Tasa doméstica (MXN)"
          value={rDom}
          onChange={setRDom}
          suffix="%"
          step="0.1"
        />
        <NumInput
          label="Tasa extranjera (USD)"
          value={rFor}
          onChange={setRFor}
          suffix="%"
          step="0.1"
        />
        <NumInput
          label="Volatilidad anual"
          value={vol}
          onChange={setVol}
          suffix="%"
          step="0.1"
        />
        <NumInput label="Tiempo (años)" value={T} onChange={setT} step="0.1" />
        <Toggle
          label="Tipo"
          value={isCall}
          onChange={setIsCall}
          onLabel="Call"
          offLabel="Put"
        />
      </div>

      <div className="kpis">
        <KPI label="Precio" value={money(price, 4)} />
        <KPI label="Prob. ITM~" value={pct(greeks.Nd2 * 100, 2)} />
      </div>

      <div className="actions">
        <button className="btn btn-neon" onClick={save}>
          Guardar escenario
        </button>
      </div>
    </div>
  );
}

function VanillaCard({ onSave }) {
  const [S, setS] = useState(100);
  const [K, setK] = useState(100);
  const [r, setR] = useState(8.0);
  const [q, setQ] = useState(0.0);
  const [vol, setVol] = useState(20.0);
  const [T, setT] = useState(1.0);
  const [isCall, setIsCall] = useState(true);

  const price = useMemo(
    () => bsPrice(S, K, r, q, vol, T, isCall),
    [S, K, r, q, vol, T, isCall]
  );
  const greeks = useMemo(
    () => bsGreeks(S, K, r, q, vol, T, isCall),
    [S, K, r, q, vol, T, isCall]
  );

  const save = () =>
    onSave({
      kind: "vanilla",
      label: `BS ${isCall ? "Call" : "Put"} K=${K}`,
      S,
      K,
      r,
      q,
      vol,
      T,
      isCall,
      price,
      greeks,
    });

  return (
    <div className="card">
      <h3>Opciones (Black–Scholes)</h3>
      <div className="toolbar">
        <Chip>Δ {fmt.format(greeks.delta)}</Chip>
        <Chip>Γ {fmt.format(greeks.gamma)}</Chip>
        <Chip>Vega {fmt.format(greeks.vega)}</Chip>
        <Chip>θ {fmt.format(greeks.theta)}</Chip>
        <Chip>ρ {fmt.format(greeks.rho)}</Chip>
      </div>

      <div className="form grid2">
        <NumInput label="Spot (S)" value={S} onChange={setS} />
        <NumInput label="Strike (K)" value={K} onChange={setK} />
        <NumInput
          label="Tasa libre de riesgo (r)"
          value={r}
          onChange={setR}
          suffix="%"
          step="0.1"
        />
        <NumInput
          label="Rendimiento/Div (q)"
          value={q}
          onChange={setQ}
          suffix="%"
          step="0.1"
        />
        <NumInput
          label="Volatilidad anual"
          value={vol}
          onChange={setVol}
          suffix="%"
          step="0.1"
        />
        <NumInput label="Tiempo (años)" value={T} onChange={setT} step="0.1" />
        <Toggle
          label="Tipo"
          value={isCall}
          onChange={setIsCall}
          onLabel="Call"
          offLabel="Put"
        />
      </div>

      <div className="kpis">
        <KPI label="Precio" value={money(price, 4)} />
        <KPI label="Prob. ITM~" value={pct(greeks.Nd2 * 100, 2)} />
      </div>

      <div className="actions">
        <button className="btn btn-neon" onClick={save}>
          Guardar escenario
        </button>
      </div>
    </div>
  );
}

/** ==================== Comparador & Chart ==================== **/
function ComparePanel({
  tab,
  metric,
  setMetric,
  metricOptions,
  escenarios,
  onRemove,
  onClear,
}) {
  // Filtro por tipo
  const data = escenarios.filter((e) => e.kind === mapTabToKind(tab));

  // Series según métrica
  const { series, xLabel, yLabel } = useMemo(
    () => buildSeries(tab, metric, data),
    [tab, metric, data]
  );

  // Export
  const exportJSON = () =>
    download("escenarios.json", JSON.stringify(data, null, 2));
  const exportCSV = () => {
    const rows = ["id,label,kind,fields"];
    data.forEach((d) =>
      rows.push(
        `${d.id},"${d.label}",${d.kind},"${Object.entries(d)
          .map(
            ([k, v]) =>
              `${k}:${
                Array.isArray(v) ? "[...]" : typeof v === "object" ? "{...}" : v
              }`
          )
          .join(";")}"`
      )
    );
    download("escenarios.csv", rows.join("\n"));
  };

  return (
    <div className="card">
      <div className="panel-head">
        <h3>Comparar & Graficar</h3>
        <div className="panel-actions">
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="select-sm"
          >
            {metricOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <button className="btn btn-outline sm" onClick={exportCSV}>
            Exportar CSV
          </button>
          <button className="btn btn-outline sm" onClick={exportJSON}>
            Exportar JSON
          </button>
          <button className="btn btn-outline sm" onClick={onClear}>
            Limpiar
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="cmp-table">
          <thead>
            <tr>
              <th>Escenario</th>
              <th>Tipo</th>
              <th>Resumen</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  Guarda uno o más escenarios para comparar.
                </td>
              </tr>
            )}
            {data.map((s) => (
              <tr key={s.id}>
                <td>
                  <span className="dot" style={{ background: s.color }} />{" "}
                  {s.label}
                </td>
                <td className="tag">{s.kind}</td>
                <td className="muted">{scenarioShort(s)}</td>
                <td>
                  <button
                    className="btn btn-outline sm"
                    onClick={() => onRemove(s.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="chart-title">
        {xLabel} vs {yLabel}
      </h4>
      <AdvancedChart series={series} xLabel={xLabel} yLabel={yLabel} />
    </div>
  );
}

function buildSeries(tab, metric, data) {
  if (tab === "bonos") {
    const xs = linspace(4, 20, 33);
    if (metric === "dv01_ytm") {
      return {
        xLabel: "YTM (%)",
        yLabel: "DV01 (MXN)",
        series: data.map((s) => ({
          color: s.color,
          label: s.label,
          points: xs.map((x) => {
            const n = s.years * s.freq;
            const r = bondRisk(s.face, s.coupon, x, n, s.freq);
            return { x, y: r.dv01 };
          }),
        })),
      };
    }
    // precio vs ytm
    return {
      xLabel: "YTM (%)",
      yLabel: "Precio",
      series: data.map((s) => ({
        color: s.color,
        label: s.label,
        points: xs.map((x) => ({
          x,
          y: bondPrice(s.face, s.coupon, x, s.years * s.freq, s.freq),
        })),
      })),
    };
  }

  if (tab === "cetes") {
    const xs = linspace(2, 20, 25);
    return {
      xLabel: "Tasa anual simple (360) %",
      yLabel: "Precio",
      series: data.map((s) => ({
        color: s.color,
        label: s.label,
        points: xs.map((x) => ({ x, y: cetesPrice(s.face, x, s.days) })),
      })),
    };
  }

  if (tab === "swap") {
    if (metric === "pv_shift") {
      const xs = linspace(-200, 200, 41); // bps
      return {
        xLabel: "Shift curva (bps)",
        yLabel: "PV (MXN)",
        series: data.map((s) => ({
          color: s.color,
          label: s.label,
          points: xs.map((bps) => {
            if (s.curve) {
              const bumped = s.curve.map((nd) => ({
                ...nd,
                z: nd.z + bps / 10000,
              }));
              const n = Math.round(s.years / s.delta);
              return {
                x: bps,
                y: swapPVCurve(s.notional, s.fixed, bumped, s.delta, n),
              };
            } else {
              const n = Math.round(s.years / s.delta);
              return {
                x: bps,
                y: swapPVFlat(
                  s.notional,
                  s.fixed,
                  s.rDisc / 100 + bps / 10000,
                  s.delta,
                  n
                ),
              };
            }
          }),
        })),
      };
    }
    // PV vs tasa fija
    const xs = linspace(5, 25, 41);
    return {
      xLabel: "Tasa fija (%)",
      yLabel: "PV (MXN)",
      series: data.map((s) => ({
        color: s.color,
        label: s.label,
        points: xs.map((x) => {
          const n = Math.round(s.years / s.delta);
          if (s.curve)
            return { x, y: swapPVCurve(s.notional, x, s.curve, s.delta, n) };
          return { x, y: swapPVFlat(s.notional, x, s.rDisc / 100, s.delta, n) };
        }),
      })),
    };
  }

  if (tab === "fx") {
    if (metric === "vega_vol") {
      const xs = linspace(5, 40, 36);
      return {
        xLabel: "Volatilidad (%)",
        yLabel: "Vega",
        series: data.map((s) => ({
          color: s.color,
          label: s.label,
          points: xs.map((x) => ({
            x,
            y: gkGreeks(s.S, s.K, s.rDom, s.rFor, x, s.T, s.isCall).vega,
          })),
        })),
      };
    }
    if (metric === "delta_spot") {
      const xs = linspace(
        safeLow(data, "S", 0.7),
        safeHigh(data, "S", 1.3),
        37
      );
      return {
        xLabel: "Spot",
        yLabel: "Delta",
        series: data.map((s) => ({
          color: s.color,
          label: s.label,
          points: xs.map((X) => ({
            x: X,
            y: gkGreeks(X, s.K, s.rDom, s.rFor, s.vol, s.T, s.isCall).delta,
          })),
        })),
      };
    }
    // precio vs spot
    const xs = linspace(safeLow(data, "S", 0.7), safeHigh(data, "S", 1.3), 37);
    return {
      xLabel: "Spot",
      yLabel: "Precio",
      series: data.map((s) => ({
        color: s.color,
        label: s.label,
        points: xs.map((X) => ({
          x: X,
          y: gkPrice(X, s.K, s.rDom, s.rFor, s.vol, s.T, s.isCall),
        })),
      })),
    };
  }

  // vanilla
  if (metric === "vega_vol") {
    const xs = linspace(5, 60, 56);
    return {
      xLabel: "Volatilidad (%)",
      yLabel: "Vega",
      series: data.map((s) => ({
        color: s.color,
        label: s.label,
        points: xs.map((x) => ({
          x,
          y: bsGreeks(s.S, s.K, s.r, s.q, x, s.T, s.isCall).vega,
        })),
      })),
    };
  }
  if (metric === "delta_spot") {
    const xs = linspace(safeLow(data, "S", 0.7), safeHigh(data, "S", 1.3), 37);
    return {
      xLabel: "Spot",
      yLabel: "Delta",
      series: data.map((s) => ({
        color: s.color,
        label: s.label,
        points: xs.map((X) => ({
          x: X,
          y: bsGreeks(X, s.K, s.r, s.q, s.vol, s.T, s.isCall).delta,
        })),
      })),
    };
  }
  const xs = linspace(safeLow(data, "S", 0.7), safeHigh(data, "S", 1.3), 37);
  return {
    xLabel: "Spot",
    yLabel: "Precio",
    series: data.map((s) => ({
      color: s.color,
      label: s.label,
      points: xs.map((X) => ({
        x: X,
        y: bsPrice(X, s.K, s.r, s.q, s.vol, s.T, s.isCall),
      })),
    })),
  };
}

function AdvancedChart({ series, xLabel, yLabel }) {
  const w = 540,
    h = 280,
    pad = 40;
  const allX = series.flatMap((s) => s.points.map((p) => p.x));
  const allY = series.flatMap((s) => s.points.map((p) => p.y));
  const minX = Math.min(...allX, 0),
    maxX = Math.max(...allX, 1);
  const minY = Math.min(...allY),
    maxY = Math.max(...allY);
  const sx = (x) => pad + ((x - minX) / (maxX - minX || 1)) * (w - pad * 2);
  const sy = (y) => h - pad - ((y - minY) / (maxY - minY || 1)) * (h - pad * 2);

  const gridY = 4,
    yTicks = Array.from(
      { length: gridY + 1 },
      (_, i) => minY + (i * (maxY - minY)) / gridY
    );
  const [hover, setHover] = useState(null);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mini-chart big"
      onMouseLeave={() => setHover(null)}
    >
      {/* Ejes */}
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} className="axis" />
      <line x1={pad} y1={pad} x2={pad} y2={h - pad} className="axis" />

      {/* Grid y labels Y */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={pad} y1={sy(v)} x2={w - pad} y2={sy(v)} className="grid" />
          <text x={8} y={sy(v) + 4} className="t-label">
            {formatSmart(v)}
          </text>
        </g>
      ))}

      {/* Series */}
      {series.map((s, idx) => {
        const d = s.points
          .map((p, i) => `${i ? "L" : "M"} ${sx(p.x)} ${sy(p.y)}`)
          .join(" ");
        return (
          <g key={idx}>
            <path d={d} className="line" style={{ stroke: s.color }} />
            {s.points.map((p, i) => (
              <circle
                key={i}
                cx={sx(p.x)}
                cy={sy(p.y)}
                r={3}
                className="dot"
                onMouseEnter={() =>
                  setHover({
                    label: s.label,
                    color: s.color,
                    x: p.x,
                    y: p.y,
                    cx: sx(p.x),
                    cy: sy(p.y),
                  })
                }
              />
            ))}
          </g>
        );
      })}

      {/* Tooltip */}
      {hover && (
        <g>
          <line
            x1={hover.cx}
            x2={hover.cx}
            y1={pad}
            y2={h - pad}
            className="vline"
          />
          <rect
            x={hover.cx + 10}
            y={hover.cy - 26}
            width="160"
            height="40"
            rx="8"
            className="tt-box"
          />
          <text x={hover.cx + 16} y={hover.cy - 10} className="tt">
            {hover.label}
          </text>
          <text x={hover.cx + 16} y={hover.cy + 6} className="tt">
            {xLabel}: {formatSmart(hover.x)} · {yLabel}: {formatSmart(hover.y)}
          </text>
        </g>
      )}

      {/* Labels ejes */}
      <text x={w / 2} y={h - 6} className="t-label">
        {xLabel}
      </text>
      <text x={-h / 2} y={12} transform="rotate(-90)" className="t-label">
        {yLabel}
      </text>
    </svg>
  );
}

/** ==================== UI básicos ==================== **/
function labelTab(t) {
  return (
    {
      bonos: "Bonos",
      cetes: "CETES",
      swap: "Swap TIIE",
      fx: "Opciones FX",
      vanilla: "Opciones (BS)",
    }[t] || t
  );
}

function NumInput({ label, value, onChange, suffix, step = "1" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(toNum(e.target.value))}
        />
        {suffix && <em>{suffix}</em>}
      </div>
    </label>
  );
}
function Read({ label, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input read">{value}</div>
    </label>
  );
}
function Select({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input">
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
function Toggle({ label, value, onChange, onLabel = "On", offLabel = "Off" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="toggle">
        <button
          type="button"
          className={`tgl ${value ? "active" : ""}`}
          onClick={() => onChange(true)}
        >
          {onLabel}
        </button>
        <button
          type="button"
          className={`tgl ${!value ? "active" : ""}`}
          onClick={() => onChange(false)}
        >
          {offLabel}
        </button>
      </div>
    </label>
  );
}
function KPI({ label, value }) {
  return (
    <div className="kpi">
      <span className="k-label">{label}</span>
      <span className="k-value">{value}</span>
    </div>
  );
}
function Chip({ children }) {
  return <span className="chip">{children}</span>;
}
function Disclosure({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="disclosure">
      <button
        className="disclosure-head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {title} <span className="caret">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="disclosure-body">{children}</div>}
    </div>
  );
}

/** ==================== Helpers & estado ==================== **/
function formatSmart(v) {
  if (Math.abs(v) >= 1e6) return `${fmt.format(v / 1e6)}M`;
  if (Math.abs(v) >= 1e3) return `${fmt.format(v / 1e3)}k`;
  if (Math.abs(v) >= 1) return fmt.format(v);
  return (v || 0).toFixed(4);
}
function mapTabToKind(tab) {
  return tab === "vanilla" ? "vanilla" : tab; // mismo id
}
function scenarioShort(s) {
  switch (s.kind) {
    case "bono":
      return `Face ${money(s.face, 0)} · Cupón ${pct(s.coupon, 1)} · YTM ${pct(
        s.ytm,
        2
      )} · P ${money(s.price)} · Dur ${fmt.format(s.mod)}a`;
    case "cetes":
      return `Face ${money(s.face, 2)} · ${s.days}d · Tasa ${pct(
        s.rate,
        2
      )} · Precio ${money(s.price, 4)}`;
    case "swap":
      return `Notional ${money(s.notional, 0)} · Par ${pct(
        s.spar,
        2
      )} · PV ${money(s.pv, 0)} (${s.curve ? "curva" : "plana"})`;
    case "fx":
      return `${s.isCall ? "Call" : "Put"} · S=${s.S} K=${s.K} · vol ${pct(
        s.vol,
        1
      )} · px ${money(s.price, 4)}`;
    case "vanilla":
      return `${s.isCall ? "Call" : "Put"} · S=${s.S} K=${s.K} · vol ${pct(
        s.vol,
        1
      )} · px ${money(s.price, 4)}`;
    default:
      return "";
  }
}
function safeLow(arr, key, mult = 0.7) {
  const v = Math.min(
    ...arr.map((a) => a[key] ?? a.S).filter((x) => isFinite(x))
  );
  return isFinite(v) ? v * mult : 1 * mult;
}
function safeHigh(arr, key, mult = 1.3) {
  const v = Math.max(
    ...arr.map((a) => a[key] ?? a.S).filter((x) => isFinite(x))
  );
  return isFinite(v) ? v * mult : 1 * mult;
}
function download(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function useLocalStorage(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}
