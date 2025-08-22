// src/pages/Productos.jsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/css/products.css";

const TABS = [
  { id: "simple", label: "Crédito simple", emoji: "💳" },
  { id: "arrenda", label: "Arrendamiento puro", emoji: "🧰" },
  { id: "puente", label: "Financiamiento puente", emoji: "🏗️" },
  { id: "capital", label: "Capital", emoji: "📈" },
  { id: "asesoria", label: "Asesoría estratégica", emoji: "🧠" },
];

const PRODUCTS = [
  {
    id: "simple",
    name: "Crédito simple",
    ticketRel: 3, // 1..5
    speedDays: 9, // días estimados
    radar: { flex: 4, gar: 3, compl: 2, dil: 0, cost: 3 },
  },
  {
    id: "arrenda",
    name: "Arrendamiento",
    ticketRel: 4,
    speedDays: 12,
    radar: { flex: 3, gar: 4, compl: 3, dil: 0, cost: 3 },
  },
  {
    id: "puente",
    name: "Puente",
    ticketRel: 5,
    speedDays: 20,
    radar: { flex: 2, gar: 5, compl: 5, dil: 0, cost: 5 },
  },
  {
    id: "capital",
    name: "Capital",
    ticketRel: 3,
    speedDays: 45,
    radar: { flex: 4, gar: 0, compl: 4, dil: 5, cost: 2 }, // cost bajo = menos “costo financiero”, pero hay dilución
  },
  {
    id: "asesoria",
    name: "Asesoría",
    ticketRel: 2,
    speedDays: 14,
    radar: { flex: 5, gar: 0, compl: 3, dil: 0, cost: 2 },
  },
];

const Term = ({ label, value, sub }) => (
  <div className="term">
    <span className="t-label">{label}</span>
    <span className="t-value">{value}</span>
    {sub && <span className="t-sub">{sub}</span>}
  </div>
);

const Bullet = ({ children }) => (
  <li className="b-item">
    <span className="b-ico" aria-hidden>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 12l4 4L19 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
    <span className="b-txt">{children}</span>
  </li>
);

const Badge = ({ children, tone = "neutral" }) => (
  <span className={`p-badge ${tone}`}>{children}</span>
);

/* ---------- Charts (SVG puros) ---------- */

// Escala util para barras
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// Bar chart simple horizontal
function BarChart({ title, unit, data, selectedId }) {
  const maxV = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="chart-card">
      <div className="chart-head">
        <h4>{title}</h4>
        {unit && <span className="ch-unit">{unit}</span>}
      </div>
      <div className="bars">
        {data.map((d) => {
          const w = (d.value / maxV) * 100;
          const sel = d.id === selectedId;
          return (
            <div key={d.id} className={`bar-row ${sel ? "sel" : ""}`}>
              <span className="bar-label">{d.label}</span>
              <div className="bar-track" role="img" aria-label={`${d.label}: ${d.value}${unit || ""}`}>
                <div
                  className="bar-fill"
                  style={{ width: `${w}%` }}
                  aria-hidden
                />
              </div>
              <span className="bar-val">{d.value}</span>
            </div>
          );
        })}
      </div>
      <div className="chart-note">Valores indicativos, no constituyen oferta.</div>
    </div>
  );
}

// Radar chart 5 ejes
function RadarChart({ title, categories, valuesById, selectedId }) {
  const size = 260;
  const pad = 24;
  const R = (size - pad * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const steps = 5; // rejilla
  const angle = (i) => ((-90 + (360 / categories.length) * i) * Math.PI) / 180;

  const toPoint = (val, i) => {
    const r = (val / 5) * R;
    const a = angle(i);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  // Path de un set de valores
  const pathFor = (vals) => {
    const pts = vals.map((v, i) => toPoint(v, i));
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]},${p[1]}`).join(" ");
    return d + " Z";
  };

  const selected = valuesById[selectedId];

  return (
    <div className="chart-card">
      <div className="chart-head">
        <h4>{title}</h4>
      </div>
      <div className="radar-wrap">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Radar comparativo">
          {/* Grid concéntrica */}
          {[...Array(steps).keys()].map((s) => {
            const r = ((s + 1) / steps) * R;
            return (
              <circle key={s} cx={cx} cy={cy} r={r} className="rg-ring" />
            );
          })}
          {/* Ejes */}
          {categories.map((_, i) => {
            const [x, y] = toPoint(5, i);
            return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="rg-axis" />;
          })}

          {/* Todos (tenue) */}
          {Object.entries(valuesById).map(([id, vals]) => {
            const isSel = id === selectedId;
            return (
              <path
                key={id}
                d={pathFor(vals)}
                className={`rg-poly ${isSel ? "sel" : ""}`}
              />
            );
          })}
        </svg>

        {/* Labels alrededor */}
        <div className="radar-labels">
          {categories.map((c, i) => {
            const [x, y] = toPoint(5.6, i); // un poco fuera del radio
            const style = { left: x, top: y };
            return (
              <span key={c} className="radar-label" style={style}>
                {c}
              </span>
            );
          })}
        </div>
      </div>
      <div className="legend">
        {PRODUCTS.map((p) => (
          <span key={p.id} className={`lg-dot ${p.id === selectedId ? "sel" : ""}`}>
            <i /> {p.name}
          </span>
        ))}
      </div>
      <div className="chart-note">Escala 1–5. Ilustrativo.</div>
    </div>
  );
}

export default function Productos() {
  const [tab, setTab] = useState("simple");
  const [selectedCol, setSelectedCol] = useState(0); // 0: ninguna; 1..5 columnas

  const tabIndex = useMemo(() => TABS.findIndex((t) => t.id === tab), [tab]);
  const selectedId = useMemo(() => {
    const map = ["", "simple", "arrenda", "puente", "capital", "asesoria"];
    return map[selectedCol] || "";
  }, [selectedCol]);

  // Datos charts
  const chartSpeed = useMemo(
    () =>
      PRODUCTS.map((p) => ({
        id: p.id,
        label: p.name,
        value: p.speedDays,
      })),
    []
  );

  const chartTicket = useMemo(
    () =>
      PRODUCTS.map((p) => ({
        id: p.id,
        label: p.name,
        value: p.ticketRel * 20, // 1..5 => 20..100
      })),
    []
  );

  const radarVals = useMemo(() => {
    const obj = {};
    PRODUCTS.forEach((p) => {
      obj[p.id] = [p.radar.flex, p.radar.gar, p.radar.compl, p.radar.dil, p.radar.cost];
    });
    return obj;
  }, []);

  return (
    <div className="app-container products">
      <Navbar />

      {/* HERO */}
      <header className="p-hero">
        <div className="p-bg" aria-hidden />
        <div className="p-grid" aria-hidden />
        <div className="p-hero-wrap">
          <h1>Productos</h1>
          <p className="p-sub">
            Líneas de crédito, arrendamiento, puente, capital y asesoría con
            ejecución ágil y claridad contractual. Elige el instrumento ideal para tu PyME.
          </p>

          <div className="p-tabs" role="tablist" aria-label="Selecciona un producto">
            <div
              className="p-tab-indicator"
              style={
                {
                  "--idx": tabIndex,
                  "--count": TABS.length,
                } as React.CSSProperties
              }
              aria-hidden
            />
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={`p-tab ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                <span className="p-tab-ico" aria-hidden>
                  {t.emoji}
                </span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <div className="p-mini-help" aria-hidden>
            <span className="dot" /> Tip: usa la tabla comparativa para resaltar un producto (clic).
          </div>
        </div>
      </header>

      {/* DETALLES POR TAB */}
      <main className="p-wrap">
        {/* CRÉDITO SIMPLE */}
        {tab === "simple" && (
          <section className="p-card">
            <div className="p-head">
              <div className="p-headline">
                <Badge>Liquidez operativa</Badge>
                <h2>Crédito simple</h2>
              </div>
              <p className="p-lead">
                Capital de trabajo, reposición de inventario y expansión con
                pagos mensuales y condiciones transparentes.
              </p>
              <div className="p-kpis">
                <div className="kpi">
                  <span className="k-label">Ticket</span>
                  <span className="k-value">$0.5–5M MXN</span>
                </div>
                <div className="kpi">
                  <span className="k-label">Plazos</span>
                  <span className="k-value">12–48 m</span>
                </div>
                <div className="kpi">
                  <span className="k-label">Costo</span>
                  <span className="k-value">18%–36% + 3–5%</span>
                </div>
                <div className="kpi">
                  <span className="k-label">Garantías</span>
                  <span className="k-value">Sí/No</span>
                </div>
              </div>
            </div>

            <div className="p-body">
              <div className="p-terms">
                <Term label="Ticket" value="$500 mil – $5 millones MXN" />
                <Term label="Plazos" value="12, 18, 24, 36, 48 meses" />
                <Term label="Tasa" value="18% – 36% anual" sub="según riesgo" />
                <Term label="Comisión" value="3% – 5%" sub="apertura" />
                <Term label="Garantías" value="Sí / No" sub="según perfil" />
              </div>

              <div className="p-elig">
                <h3 id="elig-simple">Elegibilidad</h3>
                <ul className="b-list" aria-labelledby="elig-simple">
                  <Bullet>Antigüedad del negocio ≥ 2 años</Bullet>
                  <Bullet>Estados financieros y flujo positivo</Bullet>
                  <Bullet>Buró y cumplimiento fiscal al día</Bullet>
                  <Bullet>Documentación básica completa</Bullet>
                </ul>
              </div>

              <div className="p-actions">
                <Link to="/#simulador" className="btn btn-neon">Simular</Link>
                <Link to="/login" className="btn btn-outline">Solicitar</Link>
                <Link to="/terminos" className="btn btn-ghost">Ver términos</Link>
              </div>
            </div>
          </section>
        )}

        {/* ARRENDAMIENTO */}
        {tab === "arrenda" && (
          <section className="p-card">
            <div className="p-head">
              <div className="p-headline">
                <Badge tone="info">Capex eficiente</Badge>
                <h2>Arrendamiento puro</h2>
              </div>
              <p className="p-lead">
                Adquiere equipo/activos sin descapitalizarte. Estructura fiscal
                eficiente y pagos predecibles.
              </p>
              <div className="p-kpis">
                <div className="kpi">
                  <span className="k-label">Ticket</span>
                  <span className="k-value">$0.5–8M MXN</span>
                </div>
                <div className="kpi">
                  <span className="k-label">Plazos</span>
                  <span className="k-value">12–48 m</span>
                </div>
                <div className="kpi">
                  <span className="k-label">Costo</span>
                  <span className="k-value">18%–34% + 3–5%</span>
                </div>
                <div className="kpi">
                  <span className="k-label">Garantías</span>
                  <span className="k-value">El activo</span>
                </div>
              </div>
            </div>

            <div className="p-body">
              <div className="p-terms">
                <Term label="Ticket" value="$500 mil – $8 millones MXN" />
                <Term label="Plazos" value="12, 18, 24, 36, 48 meses" />
                <Term label="Tasa" value="18% – 34% anual" sub="según activo" />
                <Term label="Comisión" value="3% – 5%" />
                <Term label="Garantías" value="Principalmente el activo" />
              </div>

              <div className="p-elig">
                <h3 id="elig-arr">Elegibilidad</h3>
                <ul className="b-list" aria-labelledby="elig-arr">
                  <Bullet>Activos con vida útil ≥ al plazo</Bullet>
                  <Bullet>Flujo de caja estable para renta</Bullet>
                  <Bullet>Seguro/aforo cuando aplique</Bullet>
                  <Bullet>Documentación del proveedor</Bullet>
                </ul>
              </div>

              <div className="p-actions">
                <Link to="/#simulador" className="btn btn-neon">Simular</Link>
                <Link to="/login" className="btn btn-outline">Solicitar</Link>
                <Link to="/terminos" className="btn btn-ghost">Ver términos</Link>
              </div>
            </div>
          </section>
        )}

        {/* PUENTE */}
        {tab === "puente" && (
          <section className="p-card">
            <div className="p-head">
              <div className="p-headline">
                <Badge tone="warn">Eventos & crecimiento</Badge>
                <h2>Financiamiento puente</h2>
              </div>
              <p className="p-lead">
                Liquidez temporal para adquisiciones, expansión o necesidades
                extraordinarias con plan de salida claro.
              </p>
              <div className="p-kpis">
                <div className="kpi">
                  <span className="k-label">Ticket</span>
                  <span className="k-value">$100–250M MXN</span>
                </div>
                <div className="kpi">
                  <span className="k-label">Plazos</span>
                  <span className="k-value">6–24 m</span>
                </div>
                <div className="kpi">
                  <span className="k-label">Costo</span>
                  <span className="k-value">Caso por caso</span>
                </div>
                <div className="kpi">
                  <span className="k-label">Garantías</span>
                  <span className="k-value">Sí</span>
                </div>
              </div>
            </div>

            <div className="p-body">
              <div className="p-terms">
                <Term label="Ticket" value="$100 – $250 millones MXN" />
                <Term label="Plazos" value="6 – 24 meses" />
                <Term label="Tasa" value="Caso por caso" sub="según riesgo" />
                <Term label="Comisión" value="Estructuración & éxito" />
                <Term label="Garantías" value="Colaterales/aforos" />
              </div>

              <div className="p-elig">
                <h3 id="elig-puente">Elegibilidad</h3>
                <ul className="b-list" aria-labelledby="elig-puente">
                  <Bullet>Plan de salida (refi/venta/flujo) definido</Bullet>
                  <Bullet>Gobierno corporativo y reporting</Bullet>
                  <Bullet>LTV objetivo ≤ 65% (cuando aplique)</Bullet>
                  <Bullet>Due diligence completo</Bullet>
                </ul>
              </div>

              <div className="p-actions">
                <Link to="/login" className="btn btn-neon">Hablar con un asesor</Link>
                <Link to="/terminos" className="btn btn-ghost">Ver términos</Link>
              </div>
            </div>
          </section>
        )}

        {/* CAPITAL */}
        {tab === "capital" && (
          <section className="p-card">
            <div className="p-head">
              <div className="p-headline">
                <Badge tone="success">Growth equity</Badge>
                <h2>Capital</h2>
              </div>
              <p className="p-lead">
                Inversión minoritaria para acelerar crecimiento con disciplina
                financiera y acompañamiento estratégico.
              </p>
              <div className="p-kpis">
                <div className="kpi">
                  <span className="k-label">Ticket</span>
                  <span className="k-value">$5–30M MXN</span>
                </div>
                <div className="kpi">
                  <span className="k-label">Horizonte</span>
                  <span className="k-value">3–5 años</span>
                </div>
                <div className="kpi">
                  <span className="k-label">Estructura</span>
                  <span className="k-value">Equity / convertibles</span>
                </div>
                <div className="kpi">
                  <span className="k-label">Co-inv.</span>
                  <span className="k-value">Crowdlink / LPs</span>
                </div>
              </div>
            </div>

            <div className="p-body">
              <div className="p-terms">
                <Term label="Ticket" value="$5 – $30 millones MXN" />
                <Term label="Horizonte" value="3 – 5 años" />
                <Term label="Estructura" value="Equity / notes convertibles" />
                <Term label="Acompañamiento" value="Gobierno & KPIs" />
                <Term label="Co-inversión" value="Crowdlink / LPs" />
              </div>

              <div className="p-elig">
                <h3 id="elig-cap">Elegibilidad</h3>
                <ul className="b-list" aria-labelledby="elig-cap">
                  <Bullet>PMF y unit economics sanos</Bullet>
                  <Bullet>Equipo fundador con track record</Bullet>
                  <Bullet>Plan de crecimiento y KPIs claros</Bullet>
                  <Bullet>Auditoría y data room</Bullet>
                </ul>
              </div>

              <div className="p-actions">
                <Link to="/login" className="btn btn-neon">Aplicar</Link>
                <Link to="/terminos" className="btn btn-ghost">Ver términos</Link>
              </div>
            </div>
          </section>
        )}

        {/* ASESORÍA */}
        {tab === "asesoria" && (
          <section className="p-card">
            <div className="p-head">
              <div className="p-headline">
                <Badge tone="neutral">CFO-as-a-Service</Badge>
                <h2>Asesoría financiera estratégica</h2>
              </div>
              <p className="p-lead">
                Diagnóstico 360°, modelación financiera, estructura de capital,
                preparación para deuda/capital y acompañamiento a mercado.
              </p>
              <div className="p-kpis">
                <div className="kpi">
                  <span className="k-label">Modalidad</span>
                  <span className="k-value">Proyecto / Retainer</span>
                </div>
                <div className="kpi">
                  <span className="k-label">Duración</span>
                  <span className="k-value">4–12 semanas</span>
                </div>
                <div className="kpi">
                  <span className="k-label">Entregables</span>
                  <span className="k-value">Modelo + deck</span>
                </div>
                <div className="kpi">
                  <span className="k-label">Honorarios</span>
                  <span className="k-value">Fijo / éxito</span>
                </div>
              </div>
            </div>

            <div className="p-body">
              <div className="p-terms">
                <Term label="Alcance" value="Diagnóstico y plan 90 días" />
                <Term label="Modelo" value="3 estados + escenarios" />
                <Term label="Capital" value="Deuda/Equity readiness" />
                <Term label="Mercado" value="Bursatilización BMV" sub="advisory" />
                <Term label="M&A" value="Buy/Sell-side" sub="teaser + DD list" />
              </div>

              <div className="p-elig">
                <h3 id="elig-ase">Casos típicos</h3>
                <ul className="b-list" aria-labelledby="elig-ase">
                  <Bullet>Reestructura de pasivos y covenants</Bullet>
                  <Bullet>Planeación de crecimiento y CAPEX</Bullet>
                  <Bullet>Preparación para fondeo (data room)</Bullet>
                  <Bullet>Salida a mercado (BMV) o proceso M&A</Bullet>
                </ul>
              </div>

              <div className="p-actions">
                <Link to="/login" className="btn btn-neon">Agendar diagnóstico</Link>
                <Link to="/terminos" className="btn btn-ghost">Ver términos</Link>
              </div>
            </div>
          </section>
        )}

        {/* CHARTS */}
        <section className="p-charts">
          <BarChart
            title="Velocidad de decisión (días estimados)"
            unit="d"
            data={chartSpeed}
            selectedId={selectedId}
          />
          <BarChart
            title="Ticket típico (escala relativa)"
            unit=""
            data={chartTicket}
            selectedId={selectedId}
          />
          <RadarChart
            title="Atributos comparativos"
            categories={["Flexibilidad", "Garantías", "Complejidad", "Dilución", "Costo relativo"]}
            valuesById={radarVals}
            selectedId={selectedId}
          />
        </section>

        {/* COMPARATIVA */}
        <section className="p-compare">
          <h3>Comparativa rápida</h3>
          <div
            className={`cmp-table selcol-${selectedCol}`}
            role="table"
            aria-label="Comparativa de productos"
          >
            <div className="cmp-row cmp-head" role="row">
              <div className="c c-sticky" role="columnheader">Criterio</div>
              {["Crédito simple","Arrendamiento","Puente","Capital","Asesoría"].map((h, i) => (
                <button
                  key={h}
                  type="button"
                  role="columnheader"
                  className={`c c-head ${selectedCol === i+1 ? "sel" : ""}`}
                  onClick={() => setSelectedCol(selectedCol === i+1 ? 0 : i+1)}
                  title="Seleccionar columna"
                >
                  {h}
                </button>
              ))}
            </div>

            {[
              ["Uso típico", "Cap. de trabajo", "Activos productivos", "Eventos / expansión", "Crecimiento", "CFO-as-a-Service"],
              ["Ticket", "$0.5–5M MXN", "$0.5–8M MXN", "$100–250M MXN", "$5–30M MXN", "N/A"],
              ["Plazos", "12–48 m", "12–48 m", "6–24 m", "3–5 años", "4–12 sem"],
              ["Garantías", "Sí/No", "El activo", "Sí", "No aplica", "No aplica"],
              ["Costo", "18%–36% + 3–5%", "18%–34% + 3–5%", "Caso por caso", "Dilución", "Fijo + éxito"],
              ["Velocidad (días)", "~9", "~12", "~20", "~45", "~14"],
            ].map((row, ridx) => (
              <div className="cmp-row" role="row" key={ridx}>
                {row.map((cell, cidx) => {
                  const isHead = cidx === 0;
                  const colIndex = cidx; // 0..5
                  const sel = !isHead && selectedCol === colIndex;
                  return isHead ? (
                    <div key={cidx} className="c c-sticky" role="rowheader">
                      {cell}
                    </div>
                  ) : (
                    <button
                      key={cidx}
                      type="button"
                      className={`c c-cell ${sel ? "sel" : ""}`}
                      data-col={colIndex}
                      onClick={() => setSelectedCol(selectedCol === colIndex ? 0 : colIndex)}
                      title="Resaltar columna"
                    >
                      {cell}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="cmp-cta">
            <Link to="/#simulador" className="btn btn-outline">Simular crédito</Link>
            <Link to="/login" className="btn btn-neon">Hablar con un asesor</Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
