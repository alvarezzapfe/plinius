// src/pages/Productos.jsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/css/products.css";

// ---------- Helpers ----------
const pesos = (x, max = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: max,
  }).format(Number.isFinite(x) ? x : 0);

const pct = (x, digits = 1) => `${Number(x || 0).toFixed(digits)}%`;

function pagoMensual(M, tasaAnual, nMeses) {
  const r = (tasaAnual || 0) / 100 / 12;
  if (!nMeses) return 0;
  if (r === 0) return M / nMeses;
  return (M * r) / (1 - Math.pow(1 + r, -nMeses));
}

function futureValue(P, tasaAnual, meses) {
  const r = (tasaAnual || 0) / 100 / 12;
  return P * Math.pow(1 + r, meses || 0);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// ---------- UI Config ----------
const CATS = [
  {
    id: "credito",
    title: "Crédito",
    subtitle: "Simple o Revolvente",
    glow: "g-credit",
    options: [
      { id: "simple", label: "Simple", desc: "Pagos fijos mensuales, claridad total." },
      { id: "revolvente", label: "Revolvente", desc: "Línea disponible, paga interés sobre uso." },
    ],
  },
  {
    id: "arr",
    title: "Arrendamiento",
    subtitle: "Financiero o Puro",
    glow: "g-lease",
    options: [
      { id: "financiero", label: "Financiero", desc: "Adquisición al final (opción de compra)." },
      { id: "puro", label: "Puro", desc: "Renta deducible, flexible y operativo." },
    ],
  },
  {
    id: "inv",
    title: "Inversión",
    subtitle: "Cartera, por crédito o pagaré",
    glow: "g-inv",
    options: [
      { id: "cartera", label: "Cartera", desc: "Exposición diversificada a originación." },
      { id: "por_credito", label: "Por crédito", desc: "Selecciona créditos específicos." },
      { id: "pagare_36", label: "Pagaré 36m", desc: "Rendimiento fijo, horizonte claro." },
    ],
  },
];

export default function Productos() {
  const nav = useNavigate();

  // Category + option
  const [cat, setCat] = useState("credito"); // credito | arr | inv
  const activeCat = useMemo(() => CATS.find((c) => c.id === cat) || CATS[0], [cat]);

  const [opt, setOpt] = useState("simple"); // depends on cat

  // Keep opt valid when cat changes
  React.useEffect(() => {
    const first = activeCat.options[0]?.id;
    if (!activeCat.options.some((o) => o.id === opt)) setOpt(first);
  }, [cat]); // eslint-disable-line

  // Inputs (shared style)
  const [monto, setMonto] = useState(1_200_000);
  const [plazo, setPlazo] = useState(24);
  const [tasa, setTasa] = useState(24);
  const [fee, setFee] = useState(3.5);

  // Revolvente inputs
  const [linea, setLinea] = useState(2_500_000);
  const [usoPct, setUsoPct] = useState(45);

  // Inversión inputs
  const [invMonto, setInvMonto] = useState(500_000);
  const [invTasa, setInvTasa] = useState(14);
  const [invMeses, setInvMeses] = useState(36);

  // Cálculos Crédito simple / Arr
  const pago = useMemo(() => pagoMensual(monto, tasa, plazo), [monto, tasa, plazo]);
  const comApertura = useMemo(() => (monto * fee) / 100, [monto, fee]);
  const totalCredito = useMemo(() => pago * plazo + comApertura, [pago, plazo, comApertura]);

  // Revolvente (estimación): interés mensual sobre saldo usado
  const saldoUsado = useMemo(() => (linea * usoPct) / 100, [linea, usoPct]);
  const interesMensual = useMemo(() => saldoUsado * ((tasa || 0) / 100 / 12), [saldoUsado, tasa]);

  // Arrendamiento (aprox): usamos misma fórmula, pero KPI diferente
  const renta = pago;
  const totalArr = useMemo(() => renta * plazo + comApertura, [renta, plazo, comApertura]);

  // Inversión (FV)
  const invFV = useMemo(() => futureValue(invMonto, invTasa, invMeses), [invMonto, invTasa, invMeses]);
  const invGanancia = useMemo(() => Math.max(invFV - invMonto, 0), [invFV, invMonto]);

  const ctaLabel = useMemo(() => {
    if (cat === "inv") return "Iniciar onboarding";
    return "Iniciar solicitud";
  }, [cat]);

  const goCTA = () => {
    // Ajusta si quieres separar flujo inversión vs crédito
    nav("/solicitud");
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="products">
        {/* Background layers */}
        <div className="p-bg" aria-hidden />
        <div className="p-grid" aria-hidden />
        <div className="p-squares" aria-hidden />

        {/* HERO */}
        <section className="p-hero">
          <div className="p-wrap">
            <div className="p-heroTop">
              <div>
                <div className="p-badge">Plinius · Productos</div>
                <h1 className="p-h1">
                  Tres caminos. <span className="neon">Una plataforma.</span>
                </h1>
                <p className="p-sub">
                  Elige el vehículo y simula rápido. Todo con estética Plinius: oscuro, limpio y agresivo.
                </p>
              </div>

              <div className="p-heroCTA">
                <button className="btn btn-neon" onClick={goCTA}>
                  {ctaLabel}
                </button>
                <Link to="/terminos" className="btn btn-outline">
                  Ver términos
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 3 BOXES */}
        <section className="p-cats">
          <div className="p-wrap">
            <div className="p-catGrid">
              {CATS.map((c) => {
                const active = c.id === cat;
                return (
                  <button
                    key={c.id}
                    className={`p-catCard ${c.glow} ${active ? "is-active" : ""}`}
                    onClick={() => setCat(c.id)}
                    type="button"
                  >
                    <div className="p-catTop">
                      <div className="p-catTitle">{c.title}</div>
                      <div className="p-catPill">{c.subtitle}</div>
                    </div>
                    <div className="p-catDesc">
                      {c.id === "credito" && "Liquidez para operar: pagos claros o línea revolvente."}
                      {c.id === "arr" && "Equipo / activos productivos: deducible y estructurado."}
                      {c.id === "inv" && "Rendimiento y exposición: elige nivel de control."}
                    </div>
                    <div className="p-catHint">Click para configurar →</div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* CONFIG PANEL */}
        <section className="p-panel">
          <div className="p-wrap">
            <div className="p-panelShell">
              <header className="p-panelHead">
                <div>
                  <div className="p-panelKicker">Configuración</div>
                  <div className="p-panelH2">
                    {activeCat.title} · <span className="neon">{activeCat.options.find((o) => o.id === opt)?.label}</span>
                  </div>
                  <div className="p-panelSub">{activeCat.options.find((o) => o.id === opt)?.desc}</div>
                </div>

                <div className="p-panelActions">
                  <button className="p-ctaBtn" onClick={goCTA}>
                    {ctaLabel}
                  </button>
                  <Link className="p-ghostBtn" to="/ingresar?registro=0">
                    Ingresar
                  </Link>
                </div>
              </header>

              {/* option chips */}
              <div className="p-optRow">
                {activeCat.options.map((o) => (
                  <button
                    key={o.id}
                    className={`p-optChip ${opt === o.id ? "is-on" : ""}`}
                    onClick={() => setOpt(o.id)}
                    type="button"
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              <div className="p-panelGrid">
                {/* LEFT */}
                <div className="p-left">
                  {(cat === "credito" && opt === "simple") && (
                    <>
                      <ControlSlider
                        label="Monto"
                        value={monto}
                        display={pesos(monto)}
                        min={100_000}
                        max={10_000_000}
                        step={50_000}
                        onChange={setMonto}
                      />

                      <ControlSlider
                        label="Plazo"
                        value={plazo}
                        display={`${plazo} meses`}
                        min={6}
                        max={60}
                        step={1}
                        onChange={setPlazo}
                      />

                      <ControlSlider
                        label="Tasa anual"
                        value={tasa}
                        display={pct(tasa, 1)}
                        min={14}
                        max={42}
                        step={0.5}
                        onChange={setTasa}
                      />

                      <ControlSlider
                        label="Comisión de apertura"
                        value={fee}
                        display={pct(fee, 1)}
                        min={2}
                        max={6}
                        step={0.1}
                        onChange={setFee}
                      />

                      <div className="p-note">
                        *Simulación estimada. Condiciones reales dependen de perfil, garantías y revisión de expediente.
                      </div>
                    </>
                  )}

                  {(cat === "credito" && opt === "revolvente") && (
                    <>
                      <ControlSlider
                        label="Línea"
                        value={linea}
                        display={pesos(linea)}
                        min={200_000}
                        max={15_000_000}
                        step={50_000}
                        onChange={setLinea}
                      />

                      <ControlSlider
                        label="Uso de línea"
                        value={usoPct}
                        display={`${usoPct}%`}
                        min={5}
                        max={95}
                        step={1}
                        onChange={setUsoPct}
                      />

                      <ControlSlider
                        label="Tasa anual"
                        value={tasa}
                        display={pct(tasa, 1)}
                        min={14}
                        max={42}
                        step={0.5}
                        onChange={setTasa}
                      />

                      <div className="p-note">
                        Revolvente = pagas interés sobre el saldo usado. El capital se repone al pagar.
                      </div>
                    </>
                  )}

                  {(cat === "arr") && (
                    <>
                      <ControlSlider
                        label="Valor del activo"
                        value={monto}
                        display={pesos(monto)}
                        min={150_000}
                        max={12_000_000}
                        step={50_000}
                        onChange={setMonto}
                      />

                      <ControlSlider
                        label="Plazo"
                        value={plazo}
                        display={`${plazo} meses`}
                        min={12}
                        max={60}
                        step={1}
                        onChange={setPlazo}
                      />

                      <ControlSlider
                        label="Tasa anual (est.)"
                        value={tasa}
                        display={pct(tasa, 1)}
                        min={12}
                        max={38}
                        step={0.5}
                        onChange={setTasa}
                      />

                      <ControlSlider
                        label="Comisión de apertura"
                        value={fee}
                        display={pct(fee, 1)}
                        min={2}
                        max={6}
                        step={0.1}
                        onChange={setFee}
                      />

                      <div className="p-note">
                        {opt === "financiero"
                          ? "Arrendamiento financiero: puede incluir opción de compra."
                          : "Arrendamiento puro: renta deducible y enfoque operativo."}
                      </div>
                    </>
                  )}

                  {(cat === "inv") && (
                    <>
                      <ControlSlider
                        label="Monto a invertir"
                        value={invMonto}
                        display={pesos(invMonto)}
                        min={50_000}
                        max={20_000_000}
                        step={10_000}
                        onChange={setInvMonto}
                      />

                      <ControlSlider
                        label="Tasa anual objetivo"
                        value={invTasa}
                        display={pct(invTasa, 1)}
                        min={7}
                        max={22}
                        step={0.25}
                        onChange={setInvTasa}
                      />

                      <ControlSlider
                        label="Horizonte (meses)"
                        value={invMeses}
                        display={`${invMeses} meses`}
                        min={3}
                        max={60}
                        step={1}
                        onChange={setInvMeses}
                      />

                      <div className="p-note">
                        Inversión = estimación de crecimiento compuesto. En cartera / por crédito el rendimiento real
                        dependerá del desempeño de la originación.
                      </div>
                    </>
                  )}
                </div>

                {/* RIGHT */}
                <div className="p-right">
                  {(cat === "credito" && opt === "simple") && (
                    <div className="p-kpis">
                      <KPI label="Pago mensual (est.)" value={pesos(pago)} />
                      <KPI label="Comisión apertura" value={pesos(comApertura)} />
                      <KPI label="Total aprox" value={pesos(totalCredito)} />
                      <KPI label="Plazo" value={`${plazo} meses`} />
                    </div>
                  )}

                  {(cat === "credito" && opt === "revolvente") && (
                    <div className="p-kpis">
                      <KPI label="Línea" value={pesos(linea)} />
                      <KPI label="Saldo usado" value={pesos(saldoUsado)} />
                      <KPI label="Interés mensual (est.)" value={pesos(interesMensual)} />
                      <KPI label="Tasa" value={pct(tasa, 1)} />
                    </div>
                  )}

                  {(cat === "arr") && (
                    <div className="p-kpis">
                      <KPI label="Renta mensual (est.)" value={pesos(renta)} />
                      <KPI label="Comisión apertura" value={pesos(comApertura)} />
                      <KPI label="Total aprox" value={pesos(totalArr)} />
                      <KPI label="Plazo" value={`${plazo} meses`} />
                    </div>
                  )}

                  {(cat === "inv") && (
                    <div className="p-kpis">
                      <KPI label="Monto" value={pesos(invMonto)} />
                      <KPI label="Tasa objetivo" value={pct(invTasa, 2)} />
                      <KPI label="Valor futuro (est.)" value={pesos(invFV)} />
                      <KPI label="Ganancia (est.)" value={pesos(invGanancia)} />
                    </div>
                  )}

                  <div className="p-glassInfo">
                    <div className="p-glassTitle">Siguiente paso</div>
                    <div className="p-glassText">
                      {cat === "inv"
                        ? "Crea tu cuenta y completa onboarding. Luego podrás elegir: cartera, por crédito o pagaré."
                        : "Inicia tu solicitud. Se registrará en tu panel y el equipo Plinius la revisa."}
                    </div>

                    <div className="p-glassActions">
                      <button className="p-ctaBtn" onClick={goCTA}>
                        {ctaLabel}
                      </button>
                      <Link className="p-ghostBtn" to="/solicitudes">
                        Ver solicitudes
                      </Link>
                    </div>
                  </div>

                  <div className="p-miniWarn">
                    ⚡ Tip: si quieres que el rendimiento/instrumentos se vuelvan “reales”, lo conectamos después a tu
                    motor (tasas/curvas/reglas).
                  </div>
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <div className="p-bottomCTA">
              <Link to="/solicitud" className="btn btn-neon">
                Iniciar solicitud
              </Link>
              <Link to="/" className="btn btn-outline">
                Volver a inicio
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}

/* ---------- Components ---------- */

function KPI({ label, value }) {
  return (
    <div className="p-kpi">
      <div className="p-kLabel">{label}</div>
      <div className="p-kValue">{value}</div>
    </div>
  );
}

function ControlSlider({ label, value, display, min, max, step, onChange }) {
  const pctW = ((value - min) / Math.max(max - min, 1)) * 100;
  const safePct = clamp(pctW, 0, 100);

  return (
    <div className="p-ctrl">
      <div className="p-ctrlTop">
        <span className="p-ctrlLabel">{label}</span>
        <span className="p-ctrlValue">{display}</span>
      </div>

      <div className="p-range">
        <div className="p-rangeFill" style={{ width: `${safePct}%` }} />
        <input
          className="p-rangeInput"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>

      <div className="p-ctrlHint">
        <span>{pesos(min)}</span>
        <span>{pesos(max)}</span>
      </div>
    </div>
  );
}
