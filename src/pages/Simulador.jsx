// src/pages/Simulador.jsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/css/simulator.css";

// --- Utilidades de formato ---
const pesos = (x, max = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: max,
  }).format(x);
const pct = (x, digits = 1) => `${x.toFixed(digits)}%`;

// --- Parámetros ---
const PLAZOS = [12, 18, 24, 36, 48];

// --- Cálculos básicos ---
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

// --- Amortización simple para gráficas ---
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

// --- Colores UI ---
const bandGood = "#76ff7a";
const bandWarn = "#ffd166";
const bandBad = "#ff6b6b";
const colorRatio = (x) => (x >= 1.5 ? bandGood : x >= 1.2 ? bandWarn : bandBad);

export default function Simulador() {
  // Estado principal
  const [tipo, setTipo] = useState("simple"); // "simple" | "arrendamiento"
  const [garantias, setGarantias] = useState(true);

  const [monto, setMonto] = useState(1_200_000);
  const [plazo, setPlazo] = useState(24);
  const [tasa, setTasa] = useState(23);
  const [fee, setFee] = useState(3.0);

  const [ebitdaMensual, setEbitdaMensual] = useState(150_000);
  const [valorGarantia, setValorGarantia] = useState(1_800_000);

  // Presets
  const applyPreset = (mode) => {
    if (mode === "conservador") {
      setMonto(800_000);
      setPlazo(18);
      setTasa(20);
      setFee(3);
      setEbitdaMensual(160_000);
      setValorGarantia(1_800_000);
      setGarantias(true);
    } else if (mode === "base") {
      setMonto(1_200_000);
      setPlazo(24);
      setTasa(23);
      setFee(3.5);
      setEbitdaMensual(150_000);
      setValorGarantia(1_800_000);
      setGarantias(true);
    } else if (mode === "expansivo") {
      setMonto(2_500_000);
      setPlazo(36);
      setTasa(26);
      setFee(4.5);
      setEbitdaMensual(220_000);
      setValorGarantia(2_800_000);
      setGarantias(false);
    }
  };

  // Cálculos
  const rMensual = tasa / 100 / 12;
  const pago = useMemo(
    () => pagoMensual(monto, tasa, plazo),
    [monto, tasa, plazo]
  );
  const comApertura = useMemo(() => (monto * fee) / 100, [monto, fee]);
  const cat = useMemo(() => catEstimado(tasa, fee, plazo), [tasa, fee, plazo]);
  const tabla = useMemo(
    () => amortizacion(monto, tasa, plazo),
    [monto, tasa, plazo]
  );

  // Indicadores (solo visuales)
  const leverage = monto / Math.max(ebitdaMensual * 12, 1);
  const ltv = garantias ? (monto / Math.max(valorGarantia, 1)) * 100 : NaN;

  // Series para gráficas
  const pagosSerie = tabla.map((t) => t.pago);
  const totalIntereses = tabla.reduce((a, t) => a + t.interes, 0);
  const totalCapital = tabla.reduce((a, t) => a + t.capital, 0);
  const totalCostos = totalIntereses + comApertura;

  // Line chart path (pagos)
  const linePath = useMemo(() => {
    const w = 300,
      h = 120,
      pad = 8;
    if (!pagosSerie.length) return "";
    const max = Math.max(...pagosSerie);
    const min = Math.min(...pagosSerie);
    const norm = (v) =>
      h - pad - ((v - min) / Math.max(max - min || 1, 1)) * (h - pad * 2);
    const dx = (w - pad * 2) / Math.max(pagosSerie.length - 1, 1);
    return pagosSerie
      .map((y, i) => `${i === 0 ? "M" : "L"} ${pad + dx * i} ${norm(y)}`)
      .join(" ");
  }, [pagosSerie]);

  // Donut data
  const donut = useMemo(() => {
    const parts = [
      { label: "Intereses", value: totalIntereses },
      { label: "Comisión", value: comApertura },
      { label: "Capital", value: totalCapital },
    ];
    const sum = parts.reduce((a, b) => a + b.value, 0) || 1;
    let start = 0;
    const arcs = parts.map((p, i) => {
      const angle = (p.value / sum) * Math.PI * 2;
      const end = start + angle;
      const x1 = 80 + 60 * Math.cos(start);
      const y1 = 80 + 60 * Math.sin(start);
      const x2 = 80 + 60 * Math.cos(end);
      const y2 = 80 + 60 * Math.sin(end);
      const large = angle > Math.PI ? 1 : 0;
      const d = `M80,80 L${x1},${y1} A60,60 0 ${large} 1 ${x2},${y2} Z`;
      const seg = { d, i, label: p.label, value: p.value };
      start = end;
      return seg;
    });
    return { parts, arcs, sum };
  }, [totalIntereses, comApertura, totalCapital]);

  // Mailto prellenado
  const mailtoHref = useMemo(() => {
    const subject = `Solicitud de crédito - ${
      tipo === "simple" ? "Crédito simple" : "Arrendamiento"
    }`;
    const body =
      `Hola Plinius,\n\nMe interesa continuar con el proceso.\n\n` +
      `Datos (simulador):\n` +
      `- Monto: ${pesos(monto)}\n` +
      `- Plazo: ${plazo} meses\n` +
      `- Tasa referencia: ${pct(tasa, 1)}\n` +
      `- Comisión: ${pct(fee, 1)}\n` +
      `- Con garantía: ${garantias ? "Sí" : "No"}\n\n` +
      `Empresa:\n- Nombre:\n- RFC:\n- Contacto:\n\n` +
      `Gracias.`;
    return `mailto:contacto@crowdlink.mx?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }, [tipo, monto, plazo, tasa, fee, garantias]);

  return (
    <div className="app-container">
      <Navbar />
      <main className="sim">
        <div className="sim-bg" aria-hidden />
        <div className="sim-wrap">
          {/* Encabezado */}
          <header className="sim-head">
            <h1>Simulador</h1>
            <p className="sim-sub">
              Ajusta variables y visualiza pagos, composición de costos y
              trayectorias.
            </p>
            <div className="sim-presets" role="group" aria-label="Escenarios">
              <button
                className="chip"
                onClick={() => applyPreset("conservador")}
              >
                Conservador
              </button>
              <button className="chip" onClick={() => applyPreset("base")}>
                Base
              </button>
              <button className="chip" onClick={() => applyPreset("expansivo")}>
                Expansivo
              </button>
            </div>
          </header>

          {/* Layout principal */}
          <section className="sim-grid">
            {/* Col izquierda: tarjeta principal */}
            <aside className="sim-card">
              <div className="sim-rowtop">
                {/* Tipo */}
                <div
                  className="seg"
                  role="radiogroup"
                  aria-label="Tipo de financiamiento"
                >
                  <label
                    className={`seg-btn ${tipo === "simple" ? "active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value="simple"
                      checked={tipo === "simple"}
                      onChange={() => setTipo("simple")}
                    />
                    Crédito simple
                  </label>
                  <label
                    className={`seg-btn ${
                      tipo === "arrendamiento" ? "active" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value="arrendamiento"
                      checked={tipo === "arrendamiento"}
                      onChange={() => setTipo("arrendamiento")}
                    />
                    Arrendamiento
                  </label>
                </div>

                {/* Garantía */}
                <div className="toggle" role="radiogroup" aria-label="Garantía">
                  <button
                    type="button"
                    className={`toggle-btn ${garantias ? "active" : ""}`}
                    aria-pressed={garantias}
                    onClick={() => setGarantias(true)}
                    title="Con garantía"
                  >
                    🛡 Con garantía
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${!garantias ? "active" : ""}`}
                    aria-pressed={!garantias}
                    onClick={() => setGarantias(false)}
                    title="Sin garantía"
                  >
                    ∅ Sin garantía
                  </button>
                </div>
              </div>

              {/* KPIs */}
              <div className="sim-kpis">
                <div className="kpi">
                  <span className="k-label">Pago mensual estimado</span>
                  <span className="k-value">{pesos(pago)}</span>
                </div>
                <div className="kpi">
                  <span className="k-label">CAT estimado*</span>
                  <span className="k-value">{pct(cat, 1)}</span>
                </div>
                <div className="kpi">
                  <span className="k-label">Relación flujo/pago (aprox)</span>
                  <span
                    className="k-value"
                    style={{
                      color: colorRatio(ebitdaMensual / Math.max(pago, 1)),
                    }}
                  >
                    {(ebitdaMensual / Math.max(pago, 1)).toFixed(2)}x
                  </span>
                </div>
                <div className="kpi">
                  <span className="k-label">Apalancamiento (aprox)</span>
                  <span className="k-value">{(leverage || 0).toFixed(2)}x</span>
                </div>
              </div>

              {/* Stats */}
              <div className="sim-stats">
                <div className="stat">
                  <span className="label">Monto</span>
                  <span className="value">{pesos(monto)}</span>
                </div>
                <div className="stat">
                  <span className="label">Plazo</span>
                  <span className="value">{plazo} meses</span>
                </div>
                <div className="stat">
                  <span className="label">Tasa anual</span>
                  <span className="value">{pct(tasa, 1)}</span>
                </div>
                <div className="stat">
                  <span className="label">Comisión</span>
                  <span className="value">
                    {pct(fee, 1)}{" "}
                    <span className="sub">{pesos(comApertura)}</span>
                  </span>
                </div>
                <div className="stat">
                  <span className="label">Con garantía</span>
                  <span className="value">{garantias ? "Sí" : "No"}</span>
                </div>
                <div className="stat">
                  <span className="label">LTV (si aplica)</span>
                  <span className="value">
                    {garantias && isFinite(ltv) ? `${ltv.toFixed(0)}%` : "N/A"}
                  </span>
                </div>
              </div>

              {/* Controles */}
              <div className="sim-controls">
                {/* Monto */}
                <div className="ctrl">
                  <div className="ctrl-row">
                    <label htmlFor="monto">Monto</label>
                    <span className="mono">{pesos(monto)}</span>
                  </div>
                  <input
                    id="monto"
                    type="range"
                    min={100_000}
                    max={10_000_000}
                    step={50_000}
                    value={monto}
                    onChange={(e) => setMonto(Number(e.target.value))}
                  />
                  <div className="ctrl-hints">
                    <span>{pesos(100_000)}</span>
                    <span>{pesos(10_000_000)}</span>
                  </div>
                </div>

                {/* Plazo */}
                <div className="ctrl">
                  <div className="ctrl-row">
                    <label>Plazo</label>
                    <span className="mono">{plazo} meses</span>
                  </div>
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

                {/* Tasa */}
                <div className="ctrl">
                  <div className="ctrl-row">
                    <label htmlFor="tasa">Tasa anual</label>
                    <span className="mono">{pct(tasa, 1)}</span>
                  </div>
                  <input
                    id="tasa"
                    type="range"
                    min={18}
                    max={36}
                    step={0.5}
                    value={tasa}
                    onChange={(e) => setTasa(Number(e.target.value))}
                  />
                  <div className="ctrl-hints">
                    <span>18%</span>
                    <span>36%</span>
                  </div>
                </div>

                {/* Comisión */}
                <div className="ctrl">
                  <div className="ctrl-row">
                    <label htmlFor="fee">Comisión por apertura</label>
                    <span className="mono">{pct(fee, 1)}</span>
                  </div>
                  <input
                    id="fee"
                    type="range"
                    min={3}
                    max={5}
                    step={0.1}
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                  />
                  <div className="ctrl-hints">
                    <span>3%</span>
                    <span>5%</span>
                  </div>
                </div>

                {/* Supuestos adicionales */}
                <div className="ctrl grid2">
                  <div>
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

                  <div>
                    <div className="ctrl-row">
                      <label htmlFor="garantia">
                        Valor garantía (si aplica)
                      </label>
                      <span className="mono">
                        {garantias ? pesos(valorGarantia) : "N/A"}
                      </span>
                    </div>
                    <input
                      id="garantia"
                      type="range"
                      min={0}
                      max={20_000_000}
                      step={50_000}
                      value={garantias ? valorGarantia : 0}
                      onChange={(e) => setValorGarantia(Number(e.target.value))}
                      disabled={!garantias}
                    />
                    <div className="ctrl-hints">
                      <span>{pesos(0)}</span>
                      <span>{pesos(20_000_000)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sim-foot">
                <span className="disclaimer">
                  *Valores indicativos sujetos a evaluación y políticas de
                  crédito. CAT estimado sin IVA.
                </span>
                <div className="foot-actions">
                  <Link to="/productos" className="btn btn-outline">
                    Ver productos
                  </Link>
                  <Link to="/login" className="btn btn-neon">
                    Solicitar ahora
                  </Link>
                </div>
              </div>
            </aside>

            {/* Col derecha: charts + PROCESO */}
            <section className="sim-right">
              <div className="charts-grid">
                {/* Línea: pago por mes */}
                <div className="chart-card">
                  <h4 className="chart-title">Trayectoria de pagos</h4>
                  <svg
                    className="mini-chart"
                    viewBox="0 0 300 140"
                    role="img"
                    aria-label="Pagos por mes"
                  >
                    <path d={linePath} className="line" />
                    {tabla.map((t, i) => {
                      const w = 300,
                        h = 120,
                        pad = 8;
                      const serie = tabla.map((x) => x.pago);
                      const max = Math.max(...serie);
                      const min = Math.min(...serie);
                      const normY = (v) =>
                        h -
                        pad -
                        ((v - min) / Math.max(max - min || 1, 1)) *
                          (h - pad * 2);
                      const dx = (w - pad * 2) / Math.max(serie.length - 1, 1);
                      const cx = pad + dx * i;
                      const cy = normY(t.pago);
                      return (
                        <circle
                          key={i}
                          cx={cx}
                          cy={cy}
                          r="2.5"
                          className="dot"
                        />
                      );
                    })}
                    <text x="8" y="132" className="t-label">
                      0
                    </text>
                    <text x="292" y="132" className="t-label">
                      {tabla.length} m
                    </text>
                  </svg>
                </div>

                {/* Barras: capital vs interés (primeros meses) */}
                <div className="chart-card">
                  <h4 className="chart-title">Capital vs interés (inicio)</h4>
                  <svg
                    className="mini-chart"
                    viewBox="0 0 300 140"
                    role="img"
                    aria-label="Capital e interés"
                  >
                    {tabla.slice(0, Math.min(12, tabla.length)).map((t, i) => {
                      const h = 100,
                        yBase = 120,
                        x0 = 12,
                        bw = 14,
                        gap = 10;
                      const maxPago =
                        Math.max(...tabla.map((x) => x.pago)) || 1;
                      const kH = (t.capital / maxPago) * h;
                      const iH = (t.interes / maxPago) * h;
                      const x = x0 + i * (bw * 2 + gap);
                      return (
                        <g key={i} transform={`translate(${x},0)`}>
                          <rect
                            x="0"
                            y={yBase - kH}
                            width={bw}
                            height={kH}
                            className="bar"
                          />
                          <rect
                            x={bw + 2}
                            y={yBase - iH}
                            width={bw}
                            height={iH}
                            className="bar"
                            style={{ opacity: 0.7 }}
                          />
                          <text
                            x={bw}
                            y="132"
                            className="t-label"
                            textAnchor="middle"
                          >
                            {t.mes}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Donut: composición */}
                <div className="chart-card">
                  <h4 className="chart-title">Composición del total</h4>
                  <div className="donut-wrap">
                    <svg
                      className="mini-chart"
                      viewBox="0 0 160 160"
                      role="img"
                      aria-label="Composición"
                    >
                      {donut.arcs.map((a) => (
                        <path key={a.i} d={a.d} className={`arc arc-${a.i}`} />
                      ))}
                      <circle cx="80" cy="80" r="40" className="donut-hole" />
                      <text x="80" y="78" className="donut-text">
                        {pct(
                          (totalCostos / (totalCapital + totalCostos)) * 100,
                          0
                        )}
                      </text>
                      <text
                        x="80"
                        y="94"
                        className="t-label"
                        style={{ fontSize: 10 }}
                      >
                        Costos / Total
                      </text>
                    </svg>
                    <ul className="legend">
                      <li>
                        <span className="swatch swatch-0" /> Intereses ·{" "}
                        {pesos(totalIntereses)}
                      </li>
                      <li>
                        <span className="swatch swatch-2" /> Comisión ·{" "}
                        {pesos(comApertura)}
                      </li>
                      <li>
                        <span className="swatch swatch-1" /> Capital ·{" "}
                        {pesos(totalCapital)}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* NUEVA CAJA: Proceso para continuar */}
              <div className="process">
                <div className="process-head">
                  <div className="ph-left">
                    <span className="ph-ico" aria-hidden>
                      🚀
                    </span>
                    <div>
                      <h3>Siguiente paso para obtener tu crédito</h3>
                      <p className="ph-sub">Guía rápida en 4 pasos</p>
                    </div>
                  </div>
                  <span className="pill-time">Tiempo: 24–72h*</span>
                </div>

                <ol className="steps">
                  <li className="step">
                    <span className="step-num">1</span>
                    <div className="step-body">
                      <h4>Define tu producto y parámetros</h4>
                      <p>
                        Selecciona{" "}
                        <strong>
                          {tipo === "simple"
                            ? "Crédito simple"
                            : "Arrendamiento"}
                        </strong>
                        , ajusta monto, plazo, tasa y comisión.
                      </p>
                    </div>
                  </li>

                  <li className="step">
                    <span className="step-num">2</span>
                    <div className="step-body">
                      <h4>Prepara documentación básica</h4>
                      <div className="doc-chips">
                        <span className="doc">
                          Identificación representante
                        </span>
                        <span className="doc">Acta constitutiva</span>
                        <span className="doc">Poderes</span>
                        <span className="doc">RFC</span>
                        <span className="doc">Estados financieros</span>
                        <span className="doc">Comprobante de domicilio</span>
                      </div>
                    </div>
                  </li>

                  <li className="step">
                    <span className="step-num">3</span>
                    <div className="step-body">
                      <h4>Envíanos tu solicitud</h4>
                      <p>
                        Mándanos un correo a{" "}
                        <a className="mailto" href={mailtoHref}>
                          contacto@crowdlink.mx
                        </a>{" "}
                        con tus datos y adjuntos. El correo se prellena con lo
                        que configuraste en el simulador.
                      </p>
                    </div>
                  </li>

                  <li className="step">
                    <span className="step-num">4</span>
                    <div className="step-body">
                      <h4>Evaluación y respuesta</h4>
                      <p>
                        Te contactaremos para validación y siguientes pasos.
                        Tiempos pueden variar según la información recibida.
                      </p>
                    </div>
                  </li>
                </ol>

                <div className="process-cta">
                  <a className="btn btn-neon" href={mailtoHref}>
                    Enviar correo
                  </a>
                  <Link className="btn btn-outline" to="/productos">
                    Ver productos
                  </Link>
                  <Link className="btn btn-outline" to="/terminos">
                    Términos
                  </Link>
                </div>

                <p className="process-foot">
                  *Plazo referencial y no vinculante. Sujeto a revisión de
                  información y políticas de crédito.
                </p>
              </div>
            </section>
          </section>

          {/* === NUEVO: Botón hasta abajo para Calculadora Avanzada === */}
        </div>
      </main>
      <Footer />
    </div>
  );
}
