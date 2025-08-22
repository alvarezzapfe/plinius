// src/pages/Productos.jsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/css/products.css";

// ------------ Helpers ------------
const pesos = (x, max = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: max,
  }).format(x);

const pct = (x, digits = 1) => `${x.toFixed(digits)}%`;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function pagoMensual(M, tasaAnual, nMeses) {
  const r = tasaAnual / 100 / 12;
  if (r === 0) return M / nMeses;
  return (M * r) / (1 - Math.pow(1 + r, -nMeses));
}

// ------------ Constantes UI ------------
const TABS = [
  { id: "simple", label: "Crédito simple" },
  { id: "arrendamiento", label: "Arrendamiento puro" },
  { id: "asesoria", label: "Asesoría estratégica" },
  { id: "bursatilizacion", label: "Bursatilización" },
];

const PLAZOS = [12, 18, 24, 36, 48];

// ------------ SVG Micro-charts ------------
function BarChart({ data, w = 260, h = 120, pad = 22, format = (v) => v }) {
  // data: [{label, value}]
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = (w - pad * 2) / data.length - 10;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mini-chart">
      <line
        x1={pad}
        y1={h - pad}
        x2={w - pad}
        y2={h - pad}
        stroke="currentColor"
        opacity="0.25"
      />
      {data.map((d, i) => {
        const x = pad + i * ((w - pad * 2) / data.length) + 5;
        const hh = ((h - pad * 2) * d.value) / max;
        const y = h - pad - hh;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={hh} rx="6" className="bar" />
            <text x={x + barW / 2} y={h - 6} className="t-label">
              {d.label}
            </text>
            <text x={x + barW / 2} y={y - 6} className="t-value">
              {format(d.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ points, w = 320, h = 140, pad = 24, format = (v) => v }) {
  // points: [{x, y, label}]
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const scaleX = (x) =>
    pad + ((x - minX) / Math.max(maxX - minX, 1)) * (w - pad * 2);
  const scaleY = (y) =>
    h - pad - ((y - minY) / Math.max(maxY - minY, 1)) * (h - pad * 2);

  const pathD = points
    .map((p, i) => `${i ? "L" : "M"} ${scaleX(p.x)} ${scaleY(p.y)}`)
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mini-chart">
      <polyline
        fill="none"
        stroke="currentColor"
        opacity="0.25"
        strokeWidth="1"
        points={`${pad},${h - pad} ${w - pad},${h - pad}`}
      />
      <path d={pathD} className="line" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={scaleX(p.x)} cy={scaleY(p.y)} r="3" className="dot" />
          <text x={scaleX(p.x)} y={scaleY(p.y) - 8} className="t-value">
            {format(p.y)}
          </text>
          <text x={scaleX(p.x)} y={h - 6} className="t-label">
            {p.label ?? p.x}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Donut({ parts, w = 160, h = 160 }) {
  // parts: [{label, value}]
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - 10;
  const total = Math.max(
    parts.reduce((s, p) => s + p.value, 0),
    1
  );
  let angle = -Math.PI / 2;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mini-chart">
      {parts.map((p, idx) => {
        const slice = (p.value / total) * Math.PI * 2;
        const x1 = cx + r * Math.cos(angle);
        const y1 = cy + r * Math.sin(angle);
        const x2 = cx + r * Math.cos(angle + slice);
        const y2 = cy + r * Math.sin(angle + slice);
        const large = slice > Math.PI ? 1 : 0;
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
        angle += slice;
        return <path key={idx} d={d} className={`arc arc-${idx}`} />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.55} className="donut-hole" />
      <text x={cx} y={cy} className="donut-text">
        Mix
      </text>
    </svg>
  );
}

// ------------ Página ------------
export default function Productos() {
  // UI
  const [tab, setTab] = useState("simple");
  const tabIndex = TABS.findIndex((t) => t.id === tab);

  // Inputs financieros
  const [monto, setMonto] = useState(1_200_000);
  const [plazo, setPlazo] = useState(24);
  const [tasa, setTasa] = useState(24);
  const [fee, setFee] = useState(3.5);

  // Cálculos comunes
  const pago = useMemo(
    () => pagoMensual(monto, tasa, plazo),
    [monto, tasa, plazo]
  );
  const comApertura = useMemo(() => (monto * fee) / 100, [monto, fee]);
  const totalCredito = useMemo(
    () => pago * plazo + comApertura,
    [pago, plazo, comApertura]
  );

  // Arrendamiento (aprox igual fórmula; se puede ajustar con residual si quieres después)
  const renta = pago;
  const totalArr = useMemo(
    () => renta * plazo + comApertura,
    [renta, plazo, comApertura]
  );

  // Datos charts
  const linePoints = useMemo(() => {
    // pago vs plazo
    return [12, 18, 24, 36, 48].map((p) => ({
      x: p,
      y: pagoMensual(monto, tasa, p),
      label: `${p}m`,
    }));
  }, [monto, tasa]);

  const donutParts = useMemo(() => {
    // Aprox: intereses = total - monto - com
    const intereses = clamp(totalCredito - monto - comApertura, 0, Infinity);
    const principal = monto;
    const com = comApertura;
    return [
      { label: "Intereses", value: intereses },
      { label: "Principal", value: principal },
      { label: "Comisión", value: com },
    ];
  }, [totalCredito, monto, comApertura]);

  const compBars = useMemo(() => {
    return [
      { label: "Crédito", value: totalCredito },
      { label: "Arrend.", value: totalArr },
    ];
  }, [totalCredito, totalArr]);

  // Card selection visual (texto amarillo)
  const [activeCard, setActiveCard] = useState("simple");

  return (
    <div className="app-container">
      <Navbar />

      <main className="products">
        <section className="p-hero">
          <div className="p-wrap">
            <h1>
              Productos <span className="neon">Plinius</span>
            </h1>
            <p className="p-sub">
              Financiamiento claro y operativo para PyMEs: elige el vehículo que
              mejor se adapta a tu flujo y objetivos.
            </p>

            {/* Tabs */}
            <div className="tabs" role="tablist" aria-label="Tipos de producto">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`tab-btn ${tab === t.id ? "active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
              {/* Indicador con CSS vars (string) */}
              <span
                className="tab-indicator"
                style={{
                  "--idx": String(tabIndex),
                  "--count": String(TABS.length),
                }}
                aria-hidden
              />
            </div>
          </div>
        </section>

        {/* Cards de producto rápidas */}
        <section className="p-cards">
          <div className="p-wrap grid">
            <article
              className={`p-card ${activeCard === "simple" ? "active" : ""}`}
              onClick={() => {
                setActiveCard("simple");
                setTab("simple");
              }}
            >
              <header>
                <h3 className="p-title">Crédito simple</h3>
                <span className="p-chip">Tasa {pct(tasa, 1)}</span>
              </header>
              <p className="p-text">
                Liquidez inmediata para capital de trabajo, con pagos fijos y
                condiciones transparentes.
              </p>
              <ul className="p-list">
                <li>Plazos: 12–48 meses</li>
                <li>Comisión de apertura: {pct(fee, 1)}</li>
                <li>Desembolso ágil</li>
              </ul>
              <div className="p-cta">Seleccionar</div>
            </article>

            <article
              className={`p-card ${
                activeCard === "arrendamiento" ? "active" : ""
              }`}
              onClick={() => {
                setActiveCard("arrendamiento");
                setTab("arrendamiento");
              }}
            >
              <header>
                <h3 className="p-title">Arrendamiento puro</h3>
                <span className="p-chip">Plazo {plazo}m</span>
              </header>
              <p className="p-text">
                Renta deducible de activos productivos, optimizando caja y
                contabilidad.
              </p>
              <ul className="p-list">
                <li>Pagos mensuales estimados</li>
                <li>Documentación guiada</li>
                <li>Flexibilidad en plazos</li>
              </ul>
              <div className="p-cta">Seleccionar</div>
            </article>

            <article
              className={`p-card ${activeCard === "asesoria" ? "active" : ""}`}
              onClick={() => {
                setActiveCard("asesoria");
                setTab("asesoria");
              }}
            >
              <header>
                <h3 className="p-title">Asesoría estratégica</h3>
                <span className="p-chip">Consultoría</span>
              </header>
              <p className="p-text">
                Estructuración financiera, planeación de deuda y soporte en
                procesos de fondeo e inversión.
              </p>
              <ul className="p-list">
                <li>Diagnóstico y plan de acción</li>
                <li>Optimización de obligaciones</li>
                <li>Acompañamiento con inversionistas</li>
              </ul>
              <div className="p-cta">Solicitar</div>
            </article>

            <article
              className={`p-card ${
                activeCard === "bursatilizacion" ? "active" : ""
              }`}
              onClick={() => {
                setActiveCard("bursatilizacion");
                setTab("bursatilizacion");
              }}
            >
              <header>
                <h3 className="p-title">Bursatilización</h3>
                <span className="p-chip">Mercado</span>
              </header>
              <p className="p-text">
                Asesoría para estructurar y listar vehículos de financiamiento
                en el mercado mexicano.
              </p>
              <ul className="p-list">
                <li>Estructura a medida</li>
                <li>Gobierno y compliance</li>
                <li>Relación con intermediarios</li>
              </ul>
              <div className="p-cta">Conocer más</div>
            </article>
          </div>
        </section>

        {/* Panel según tab */}
        <section className="p-panel">
          <div className="p-wrap panel-grid">
            {/* Columna izquierda: controles (solo para crédito/arrendamiento) */}
            <div className="panel-left">
              {(tab === "simple" || tab === "arrendamiento") && (
                <>
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

                  <div className="ctrl">
                    <div className="ctrl-row">
                      <label htmlFor="fee">Comisión de apertura</label>
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
                </>
              )}

              {tab === "asesoria" && (
                <div className="advisory">
                  <h3>Asesoría estratégica</h3>
                  <p>
                    Servicio de consultoría financiera para diseñar tu
                    estructura de capital, plan de deuda y narrativa de
                    inversión. Entregables claros y ejecutables.
                  </p>
                  <ul className="ticks">
                    <li>Diagnóstico financiero y KPIs clave</li>
                    <li>Mapa de fondeo y calendario de ejecución</li>
                    <li>Soporte en mesas con fondeadores</li>
                  </ul>
                  <Link to="/contacto" className="btn btn-neon">
                    Agendar diagnóstico
                  </Link>
                </div>
              )}

              {tab === "bursatilizacion" && (
                <div className="advisory">
                  <h3>Bursatilización</h3>
                  <p>
                    Acompañamiento integral para diseñar, validar y listar
                    vehículos de financiamiento en el mercado mexicano.
                  </p>
                  <ul className="ticks">
                    <li>Estructuración y gobierno</li>
                    <li>Análisis de riesgos y documentación</li>
                    <li>Relación con intermediarios y listados</li>
                  </ul>
                  <Link to="/contacto" className="btn btn-outline">
                    Solicitar información
                  </Link>
                </div>
              )}
            </div>

            {/* Columna derecha: resultados / charts */}
            <div className="panel-right">
              {(tab === "simple" || tab === "arrendamiento") && (
                <>
                  <div className="kpi-grid">
                    <div className="kpi">
                      <span className="k-label">
                        {tab === "arrendamiento"
                          ? "Renta mensual (est.)"
                          : "Pago mensual (est.)"}
                      </span>
                      <span className="k-value">{pesos(pago)}</span>
                    </div>
                    <div className="kpi">
                      <span className="k-label">Comisión apertura</span>
                      <span className="k-value">{pesos(comApertura)}</span>
                    </div>
                    <div className="kpi">
                      <span className="k-label">Total (aprox)</span>
                      <span className="k-value">
                        {tab === "arrendamiento"
                          ? pesos(totalArr)
                          : pesos(totalCredito)}
                      </span>
                    </div>
                  </div>

                  <div className="charts-grid">
                    <div className="chart-card">
                      <h4 className="chart-title">Pago vs Plazo</h4>
                      <LineChart
                        points={linePoints}
                        format={(v) => pesos(v, 0)}
                      />
                    </div>

                    <div className="chart-card">
                      <h4 className="chart-title">Distribución de costos</h4>
                      <div className="donut-wrap">
                        <Donut parts={donutParts} />
                        <ul className="legend">
                          <li>
                            <span className="swatch swatch-0" />
                            Intereses
                          </li>
                          <li>
                            <span className="swatch swatch-1" />
                            Principal
                          </li>
                          <li>
                            <span className="swatch swatch-2" />
                            Comisión
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="chart-card">
                      <h4 className="chart-title">Comparativo total</h4>
                      <BarChart data={compBars} format={(v) => pesos(v, 0)} />
                    </div>
                  </div>
                </>
              )}

              {(tab === "asesoria" || tab === "bursatilizacion") && (
                <div className="info-card">
                  <h4>Entregables & Alcance</h4>
                  <ul className="grid-2">
                    <li>Brief ejecutivo y objetivos</li>
                    <li>Métricas operativas & financieras</li>
                    <li>Mapa de riesgos y mitigantes</li>
                    <li>Documentación y governance</li>
                  </ul>
                  <div className="cta-inline">
                    <Link to="/terminos" className="btn btn-outline">
                      Ver términos
                    </Link>
                    <Link to="/login" className="btn btn-neon">
                      Iniciar proceso
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Comparativa rica */}
        <section className="p-compare">
          <div className="p-wrap">
            <h2>Comparativa de vehículos</h2>
            <div className="compare-table">
              <div className="c-row c-head">
                <div className="c-col">Atributo</div>
                <div className="c-col">Crédito simple</div>
                <div className="c-col">Arrendamiento puro</div>
                <div className="c-col">Asesoría</div>
              </div>

              <div className="c-row">
                <div className="c-col">Destino</div>
                <div className="c-col">Capital de trabajo, expansión</div>
                <div className="c-col">Activos productivos, equipo</div>
                <div className="c-col">Estructura y planeación financiera</div>
              </div>

              <div className="c-row">
                <div className="c-col">Plazo</div>
                <div className="c-col">12–48 meses</div>
                <div className="c-col">12–48 meses</div>
                <div className="c-col">Por proyecto</div>
              </div>

              <div className="c-row">
                <div className="c-col">Pagos</div>
                <div className="c-col">Fijos mensuales</div>
                <div className="c-col">Rentas mensuales</div>
                <div className="c-col">Hitos y entregables</div>
              </div>

              <div className="c-row">
                <div className="c-col">Comisión apertura</div>
                <div className="c-col">3–5%</div>
                <div className="c-col">3–5%</div>
                <div className="c-col">N/A</div>
              </div>

              <div className="c-row">
                <div className="c-col">Documentación</div>
                <div className="c-col">Contrato & garantías (según caso)</div>
                <div className="c-col">Contrato de arrendamiento</div>
                <div className="c-col">Alcance, cronograma, NDA</div>
              </div>

              <div className="c-row">
                <div className="c-col">Tiempo estimado</div>
                <div className="c-col">Ágil (según expediente)</div>
                <div className="c-col">Ágil (según proveedor)</div>
                <div className="c-col">Kickoff en 3–5 días</div>
              </div>
            </div>
          </div>
        </section>

        <section className="p-cta-final">
          <div className="p-wrap ctas">
            <Link to="/login" className="btn btn-neon">
              Iniciar solicitud
            </Link>
            <Link to="/terminos" className="btn btn-outline">
              Términos y condiciones
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
