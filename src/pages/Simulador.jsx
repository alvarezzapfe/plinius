// src/pages/Simulador.jsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/css/simulator.css";

const pesos = (x, max = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: max,
  }).format(x);

const pct = (x, digits = 1) => `${x.toFixed(digits)}%`;

const PLAZOS = [12, 18, 24, 36, 48];

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

export default function Simulador() {
  const [tipo, setTipo] = useState("simple"); // "simple" | "arrendamiento"
  const [garantias, setGarantias] = useState(true);

  const [monto, setMonto] = useState(1_200_000);
  const [plazo, setPlazo] = useState(24);
  const [tasa, setTasa] = useState(23);
  const [fee, setFee] = useState(3.0);

  const [ebitdaMensual, setEbitdaMensual] = useState(150_000);
  const [valorGarantia, setValorGarantia] = useState(1_800_000);

  const pago = useMemo(
    () => pagoMensual(monto, tasa, plazo),
    [monto, tasa, plazo]
  );
  const comApertura = (monto * fee) / 100;
  const cat = catEstimado(tasa, fee, plazo);
  const tabla = amortizacion(monto, tasa, plazo);

  const leverage = monto / Math.max(ebitdaMensual * 12, 1);
  const ltv = garantias ? (monto / Math.max(valorGarantia, 1)) * 100 : NaN;

  const totalIntereses = tabla.reduce((a, t) => a + t.interes, 0);
  const totalCapital = tabla.reduce((a, t) => a + t.capital, 0);
  const totalCostos = totalIntereses + comApertura;

  // Score simple para UX (no es modelo real)
  const flujoRatio = ebitdaMensual / Math.max(pago, 1);
  const flujoScore = flujoRatio > 1.7 ? 0.4 : flujoRatio > 1.3 ? 0.28 : 0.12;
  const ltvScore = !garantias
    ? 0.12
    : ltv < 55
    ? 0.35
    : ltv < 75
    ? 0.26
    : 0.12;
  const levScore = leverage < 3.5 ? 0.35 : leverage < 5 ? 0.24 : 0.1;

  const score = Math.min(1, flujoScore + ltvScore + levScore);

  const creditLabel =
    score > 0.8 ? "Muy saludable" : score > 0.6 ? "Aprobable" : "En zona de riesgo";

  const creditColor =
    score > 0.8 ? "#8fff7a" : score > 0.6 ? "#ffd166" : "#ff6b6b";

  return (
    <div className="app-container">
      <Navbar />

      <main className="sim-page">
        {/* Reuse same bg as landing */}
        <div className="hero-bg" aria-hidden />
        <div className="hero-grid" aria-hidden />

        <div className="sim-container">
          {/* HEADER */}
          <header className="sim-header">
            <div>
              <h1>Simulador inteligente</h1>
              <p>
                Ajusta variables, mira pagos, costo total y una lectura rápida
                de qué tan sano es el crédito para tu empresa.
              </p>
            </div>
            <div className="credit-score" style={{ borderColor: creditColor }}>
              <span className="label">Salud del crédito</span>
              <span className="score" style={{ color: creditColor }}>
                {creditLabel}
              </span>
            </div>
          </header>

          {/* MAIN GRID */}
          <section className="sim-grid-new">
            {/* LEFT – SIDEBAR */}
            <aside className="sidebar-card">
              <h3>Parámetros del crédito</h3>

              <div className="input-block">
                <label>Monto solicitado</label>
                <input
                  type="range"
                  min={100_000}
                  max={10_000_000}
                  step={50_000}
                  value={monto}
                  onChange={(e) => setMonto(Number(e.target.value))}
                />
                <span className="val">{pesos(monto)}</span>
              </div>

              <div className="input-block">
                <label>Plazo</label>
                <div className="chips">
                  {PLAZOS.map((p) => (
                    <button
                      key={p}
                      className={plazo === p ? "chip active" : "chip"}
                      onClick={() => setPlazo(p)}
                    >
                      {p} m
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-block">
                <label>Tasa anual</label>
                <input
                  type="range"
                  min={18}
                  max={36}
                  step={0.5}
                  value={tasa}
                  onChange={(e) => setTasa(Number(e.target.value))}
                />
                <span className="val">{pct(tasa)}</span>
              </div>

              <div className="input-block">
                <label>Comisión de apertura</label>
                <input
                  type="range"
                  min={3}
                  max={5}
                  step={0.1}
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                />
                <span className="val">{pct(fee)}</span>
              </div>

              <h3>Perfil de la empresa</h3>

              <div className="input-block">
                <label>EBITDA mensual</label>
                <input
                  type="range"
                  min={30_000}
                  max={1_500_000}
                  step={10_000}
                  value={ebitdaMensual}
                  onChange={(e) => setEbitdaMensual(Number(e.target.value))}
                />
                <span className="val">{pesos(ebitdaMensual)}</span>
              </div>

              <div className="input-block">
                <label>Valor de la garantía</label>
                <input
                  type="range"
                  min={0}
                  max={20_000_000}
                  step={50_000}
                  value={garantias ? valorGarantia : 0}
                  onChange={(e) => setValorGarantia(Number(e.target.value))}
                  disabled={!garantias}
                />
                <span className="val">
                  {garantias ? pesos(valorGarantia) : "Sin garantía"}
                </span>
              </div>
            </aside>

            {/* RIGHT – MAIN PANEL */}
            <section className="main-panel">
              {/* TOP CONTROLS (tipo + garantía) */}
              <div className="panel-top-controls">
                <div className="seg-toggle" aria-label="Tipo de producto">
                  <button
                    className={
                      tipo === "simple" ? "seg-option active" : "seg-option"
                    }
                    onClick={() => setTipo("simple")}
                  >
                    Crédito simple
                  </button>
                  <button
                    className={
                      tipo === "arrendamiento"
                        ? "seg-option active"
                        : "seg-option"
                    }
                    onClick={() => setTipo("arrendamiento")}
                  >
                    Arrendamiento
                  </button>
                </div>

                <div
                  className="seg-toggle seg-small"
                  aria-label="Uso de garantías"
                >
                  <button
                    className={
                      garantias ? "seg-option active" : "seg-option"
                    }
                    onClick={() => setGarantias(true)}
                  >
                    Con garantía
                  </button>
                  <button
                    className={
                      !garantias ? "seg-option active" : "seg-option"
                    }
                    onClick={() => setGarantias(false)}
                  >
                    Sin garantía
                  </button>
                </div>
              </div>

              {/* KPIs */}
              <div className="kpi-row">
                <div className="kpi-card">
                  <span className="kpi-label">Pago mensual estimado</span>
                  <span className="kpi-value accent">
                    {pesos(pago)}
                  </span>
                  <span className="kpi-caption">
                    Incluye capital + intereses
                  </span>
                </div>

                <div className="kpi-card">
                  <span className="kpi-label">CAT estimado*</span>
                  <span className="kpi-value accent-soft">
                    {pct(cat)}
                  </span>
                  <span className="kpi-caption">Incluye comisión anualizada</span>
                </div>

                <div className="kpi-card">
                  <span className="kpi-label">Apalancamiento aprox.</span>
                  <span className="kpi-value">
                    {leverage.toFixed(2)}x
                  </span>
                  <span className="kpi-caption">
                    {leverage < 4 ? "Dentro de rango" : "Zona a revisar"}
                  </span>
                </div>

                <div className="kpi-card">
                  <span className="kpi-label">Relación flujo / pago</span>
                  <span
                    className={
                      flujoRatio > 1.7
                        ? "kpi-value good"
                        : flujoRatio > 1.3
                        ? "kpi-value warn"
                        : "kpi-value bad"
                    }
                  >
                    {flujoRatio.toFixed(2)}x
                  </span>
                  <span className="kpi-caption">
                    Ideal &gt; 1.5x para comodidad.
                  </span>
                </div>
              </div>

              {/* INSIGHT BAR */}
              <div className="insight-bar">
                <div className="risk-bar">
                  <div
                    className="risk-fill"
                    style={{ width: `${Math.round(score * 100)}%` }}
                  />
                </div>
                <span className="risk-label">
                  Match con políticas internas estimado:{" "}
                  <strong>{Math.round(score * 100)}%</strong>
                </span>
              </div>

              {/* AMORTIZATION TABLE */}
              <div className="card amort-card-new">
                <div className="card-head-row">
                  <div>
                    <h3>Calendario de pagos</h3>
                    <p className="card-sub">
                      Visualiza cómo se descompone cada mensualidad entre
                      interés y capital.
                    </p>
                  </div>
                  <span className="badge-small">
                    {plazo} meses · {tipo === "simple" ? "Crédito simple" : "Arrendamiento"}
                  </span>
                </div>

                <div className="amort-table-scroll">
                  <table className="amort-modern">
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

                <div className="amort-summary-new">
                  <span>Intereses: {pesos(totalIntereses)}</span>
                  <span>Comisión: {pesos(comApertura)}</span>
                  <span>Capital: {pesos(totalCapital)}</span>
                  <span>
                    Costos / Total:{" "}
                    {(
                      (totalCostos / Math.max(totalCapital + totalCostos, 1)) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>

                <p className="amort-footnote">
                  *CAT estimado, sin IVA, calculado de forma indicativa. La
                  oferta final puede variar según análisis de riesgo.
                </p>
              </div>

              {/* CTA */}
              <div className="cta-area">
                <Link className="btn-neon-xl" to="/ingresar">
                  Continuar con solicitud
                </Link>
              </div>
            </section>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
