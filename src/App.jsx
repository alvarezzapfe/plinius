// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./assets/css/theme.css";
import Plogo from "./assets/images/logo2-plinius.png";

const pesos = (x, max = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: max,
  }).format(x);

const dollars = (x, max = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
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

// Bandas de riesgo típicas (ajustables)
const bandDSCR = (v) => (v >= 1.5 ? "good" : v >= 1.2 ? "warn" : "bad");
const bandICR = (v) => (v >= 3.0 ? "good" : v >= 1.5 ? "warn" : "bad");
const bandLev = (v) => (v <= 3.0 ? "good" : v <= 4.5 ? "warn" : "bad");
const bandLTV = (v) => (v <= 65 ? "good" : v <= 80 ? "warn" : "bad");

export default function App() {
  // Selecciones principales
  const [tipo, setTipo] = useState("simple"); // "simple" | "arrendamiento"
  const [garantias, setGarantias] = useState(true);

  // Entradas financieras
  const [monto, setMonto] = useState(750_000);
  const [plazo, setPlazo] = useState(18); // 12|18|24|36|48
  const [tasa, setTasa] = useState(24); // 18–36%
  const [fee, setFee] = useState(3.5); // 3–5%

  // Supuestos para métricas CFA
  const [ebitdaMensual, setEbitdaMensual] = useState(120_000);
  const [valorGarantia, setValorGarantia] = useState(1_200_000);

  // Cálculos clave
  const rMensual = tasa / 100 / 12;
  const pago = useMemo(
    () => pagoMensual(monto, tasa, plazo),
    [monto, tasa, plazo]
  );
  const comApertura = useMemo(() => (monto * fee) / 100, [monto, fee]);
  const totalPagar = useMemo(
    () => pago * plazo + comApertura,
    [pago, plazo, comApertura]
  ); // informativo
  const cat = useMemo(() => catEstimado(tasa, fee, plazo), [tasa, fee, plazo]);

  // Métricas CFA
  const servicioDeudaMensual = pago; // aprox: servicio = pago (cap+int)
  const interesMensualAprox = monto * rMensual; // aprox primer mes
  const dscr = ebitdaMensual / Math.max(servicioDeudaMensual, 1);
  const icr = ebitdaMensual / Math.max(interesMensualAprox, 1);
  const leverage = monto / Math.max(ebitdaMensual * 12, 1);
  const ltv = garantias ? (monto / Math.max(valorGarantia, 1)) * 100 : NaN;

  // Etiquetas
  const fmtX = (x) => `${x.toFixed(2)}x`;
  const fmtLTV = (x) => `${x.toFixed(0)}%`;

  // Scroll reveal para secciones/cards
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) =>
          e.target.classList.toggle("in", e.isIntersecting)
        ),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="app-container">
      <Navbar />

      <main className="heroB">
        <div className="heroB-bg" aria-hidden />
        <div className="heroB-grid" aria-hidden />

        <section className="heroB-wrap">
          {/* Lado izquierdo */}
          <div className="copy">
            <img src={Plogo} alt="Logo Plinius" className="brand" />
            <h1>
              Crédito & <span className="neon">Arrendamiento</span> para PyMEs.
              Más simple. Más facil.
            </h1>
            <p className="lead">
              Crédito simple y arrendamiento con foco en flujo de efectivo.
              Experiencia clara, decisión ágil y cumplimiento sólido.
            </p>

            <div className="cta-row">
              <Link to="/productos" className="btn btn-neon">
                Explorar productos
              </Link>
              <Link to="/login" className="btn btn-outline">
                Ingresar
              </Link>
            </div>

            <ul className="bullets">
              <li>Originación simple y documentación guiada</li>
              <li>Pricing competitivo y transparente</li>
              <li>
                Alianzas estratégicas con{" "}
                <span className="neon">Crowdlink</span>
              </li>
            </ul>
          </div>

          {/* Lado derecho: tarjeta con métricas CFA */}
          <aside className="card credit">
            <header className="card-head">
              {/* Tipo de financiamiento */}
              <div className="row-top">
                <div
                  className="seg seg-type"
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
                    Arrendamiento puro
                  </label>
                </div>

                {/* Garantía (toggle mejorado) */}
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

              {/* Métricas CFA */}
              <div className="cfa-metrics">
                <div className={`metric ${bandDSCR(dscr)}`}>
                  <div className="m-top">
                    <span className="m-title">DSCR</span>
                    <span className="m-tag">Flujo/SD</span>
                  </div>
                  <div className="m-value">
                    {fmtX(isFinite(dscr) ? dscr : 0)}
                  </div>
                </div>

                <div className={`metric ${bandICR(icr)}`}>
                  <div className="m-top">
                    <span className="m-title">ICR</span>
                    <span className="m-tag">EBITDA/Int.</span>
                  </div>
                  <div className="m-value">{fmtX(isFinite(icr) ? icr : 0)}</div>
                </div>

                <div className={`metric ${bandLev(leverage)}`}>
                  <div className="m-top">
                    <span className="m-title">Deuda/EBITDA</span>
                    <span className="m-tag">Leverage</span>
                  </div>
                  <div className="m-value">
                    {fmtX(isFinite(leverage) ? leverage : 0)}
                  </div>
                </div>

                <div className={`metric ${garantias ? bandLTV(ltv) : "off"}`}>
                  <div className="m-top">
                    <span className="m-title">LTV</span>
                    <span className="m-tag"></span>
                  </div>
                  <div className="m-value">
                    {garantias && isFinite(ltv) ? fmtLTV(ltv) : "N/A"}
                  </div>
                </div>
              </div>
            </header>

            {/* Stats financieras clave */}
            <section className="stats">
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
                <span className="label">
                  {tipo === "arrendamiento"
                    ? "Renta mensual (est.)"
                    : "Pago mensual (est.)"}
                </span>
                <span className="value">{pesos(pago)}</span>
              </div>
              <div className="stat">
                <span className="label">Com. apertura</span>
                <span className="value">{pct(fee, 1)}</span>
                <span className="subvalue">{pesos(comApertura)}</span>
              </div>
              <div className="stat">
                <span className="label">CAT estimado*</span>
                <span className="value">{pct(cat, 1)}</span>
              </div>
            </section>

            {/* Controles */}
            <section className="controls">
              {/* Monto */}
              <div className="ctrl">
                <div className="ctrl-row">
                  <label htmlFor="monto">Monto</label>
                  <span className="mono">{pesos(monto)}</span>
                </div>
                <input
                  id="monto"
                  type="range"
                  min={50_000}
                  max={5_000_000}
                  step={10_000}
                  value={monto}
                  onChange={(e) => setMonto(Number(e.target.value))}
                />
                <div className="ctrl-hints">
                  <span>{pesos(50_000)}</span>
                  <span>{pesos(5_000_000)}</span>
                </div>
              </div>

              {/* Plazo fijo (segmentado) */}
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

              {/* Tasa 18–36% */}
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

              {/* Comisión 3–5% */}
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

              {/* Supuestos métricas CFA */}
              <div className="ctrl grid2">
                <div>
                  <div className="ctrl-row">
                    <label htmlFor="ebitda">EBITDA mensual </label>
                    <span className="mono">{pesos(ebitdaMensual)}</span>
                  </div>
                  <input
                    id="ebitda"
                    type="range"
                    min={30_000}
                    max={1_000_000}
                    step={5_000}
                    value={ebitdaMensual}
                    onChange={(e) => setEbitdaMensual(Number(e.target.value))}
                  />
                  <div className="ctrl-hints">
                    <span>{pesos(30_000)}</span>
                    <span>{pesos(1_000_000)}</span>
                  </div>
                </div>

                <div>
                  <div className="ctrl-row">
                    <label htmlFor="valorGarantia">Valor de garantía</label>
                    <span className="mono">
                      {garantias ? pesos(valorGarantia) : "N/A"}
                    </span>
                  </div>
                  <input
                    id="valorGarantia"
                    type="range"
                    min={0}
                    max={10_000_000}
                    step={50_000}
                    value={garantias ? valorGarantia : 0}
                    onChange={(e) => setValorGarantia(Number(e.target.value))}
                    disabled={!garantias}
                  />
                  <div className="ctrl-hints">
                    <span>{pesos(0)}</span>
                    <span>{pesos(10_000_000)}</span>
                  </div>
                </div>
              </div>
            </section>

            <footer className="card-foot">
              <div className="foot-left">
                <span className="disclaimer">
                  *Valores <strong>indicativos</strong> sujetos a evaluación y
                  políticas de crédito. CAT estimado sin IVA.
                </span>
              </div>
              <div className="foot-right">
                <Link to="/productos" className="btn btn-outline">
                  Ver términos
                </Link>
                <Link to="/login" className="btn btn-neon">
                  Solicitar ahora
                </Link>
              </div>
            </footer>
          </aside>
        </section>

        {/* scroll cue */}
        <div className="scroll-indicator" aria-hidden>
          <span className="chev">▼</span>
        </div>
      </main>

      {/* Divider + ¿Qué hace Plinius? */}
      <div className="section-divider" aria-hidden />
      <section className="what reveal">
        <div className="what-wrap">
          <h2>¿Qué hace Plinius?</h2>

          <div className="what-grid">
            <article className="feature-card" data-icon="🎯">
              <h3>Asesoría estratégica financiera</h3>
              <p>
                Diseño de capital y deuda para <strong>PyMEs</strong> con
                enfoque en flujo.
              </p>
            </article>

            <article className="feature-card" data-icon="💳">
              <h3>Crédito Simple</h3>
              <p>
                Originación y fondeo a través de{" "}
                <span className="neon">Crowdlink</span>.
              </p>
            </article>

            <article className="feature-card" data-icon="🚀">
              <h3>Inversión de capital</h3>
              <p>
                Acompañamos rondas y crecimientos vía{" "}
                <span className="neon">Crowdlink</span>.
              </p>
            </article>

            <article className="feature-card" data-icon="📈">
              <h3>Bursatilizaciones BMV</h3>
              <p>
                Estructura y asesoría para emisiones en el mercado mexicano.
              </p>
            </article>

            <article className="feature-card" data-icon="🧾">
              <h3>Arrendamiento puro</h3>
              <p>
                Soluciones de equipo/activos con foco fiscal y de flujo (
                <strong>Plinius</strong>).
              </p>
            </article>

            <article className="feature-card" data-icon="⛓️">
              <h3>Financiamiento puente</h3>
              <p>
                Tickets de <strong>100–250 MM MXN</strong> vía{" "}
                <span className="neon">PiMX</span>.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Divider + TRACK RECORD */}
      <div className="section-divider" aria-hidden />
      <section className="track reveal">
        <div className="track-wrap">
          <h2>Track record</h2>

          <div className="track-grid">
            {/* 1. MAS AIR */}
            <article className="deal" data-type="originacion">
              <header className="deal-head">
                <h3 className="deal-title">MAS AIR</h3>
                <div className="deal-chips">
                  <span className="chip">Originación</span>
                  <span className="chip outline">Crédito</span>
                </div>
              </header>
              <div className="deal-body">
                <div className="deal-amount">
                  {pesos(100_000_000, 0)} <span className="unit">MXN</span>
                </div>
                <p className="deal-note">
                  Originación y acompañamiento en crédito corporativo.
                </p>
              </div>
            </article>

            {/* 2. INTERCAM BANCO */}
            <article className="deal" data-type="cautelar">
              <header className="deal-head">
                <h3 className="deal-title">INTERCAM BANCO</h3>
                <div className="deal-chips">
                  <span className="chip">Asesor</span>
                  <span className="chip outline">Adm. cautelar</span>
                </div>
              </header>
              <div className="deal-body">
                <div className="deal-amount">Mandato regulatorio</div>
                <p className="deal-note">
                  Asesor en equipo de administración cautelar (IPAB / FinCEN).
                </p>
              </div>
            </article>

            {/* 3. LA PEOPLES LEAGUE */}
            <article className="deal" data-type="inversion">
              <header className="deal-head">
                <h3 className="deal-title">LA PEOPLES LEAGUE</h3>
                <div className="deal-chips">
                  <span className="chip">Inversión</span>
                  <span className="chip outline">Capital</span>
                </div>
              </header>
              <div className="deal-body">
                <div className="deal-amount">
                  {pesos(8_000_000, 0)} <span className="unit">MXN</span>
                </div>
                <p className="deal-note">
                  Participación de capital en etapa de crecimiento.
                </p>
              </div>
            </article>

            {/* 4. Logística (Banca de Desarrollo) */}
            <article className="deal" data-type="credito">
              <header className="deal-head">
                <h3 className="deal-title">Empresa de Logística</h3>
                <div className="deal-chips">
                  <span className="chip">Crédito BD</span>
                  <span className="chip outline">Project / Corp</span>
                </div>
              </header>
              <div className="deal-body">
                <div className="deal-amount">
                  {dollars(35_000_000, 0)} <span className="unit">USD</span>
                </div>
                <p className="deal-note">
                  Estructuración y fondeo con Banca de Desarrollo.
                </p>
              </div>
            </article>

            {/* 5. M&A Neobanco */}
            <article className="deal" data-type="ma">
              <header className="deal-head">
                <h3 className="deal-title">M&A — Neobanco</h3>
                <div className="deal-chips">
                  <span className="chip">M&amp;A</span>
                  <span className="chip outline">Cartera</span>
                </div>
              </header>
              <div className="deal-body">
                <div className="deal-amount">Activos bancarios</div>
                <p className="deal-note">
                  Venta de activos de banco a nuevo adquiriente (neobanco).
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
