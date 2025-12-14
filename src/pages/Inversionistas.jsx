// src/pages/Inversionistas.jsx
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/css/Inversionistas.css";
import crowdlinkLogo from "../assets/images/crowdlink-logo.png";

// --- Simulación de API ficticia Crowdlink ---
function fetchCrowdlinkData() {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve({
        rendimientoPromedio: 16.8,
        inversionistasActivos: 1243,
        ticketsAbiertos: 32,
        totalColocado: 485_000_000,
        volatilidad: 3.4,
        pipeline: [
          { empresa: "Rising Farms", monto: 10_000_000, tasa: 18, plazo: "24 meses", riesgo: "B+" },
          { empresa: "Servimsa Logistics", monto: 7_500_000, tasa: 19.5, plazo: "36 meses", riesgo: "BB-" },
          { empresa: "Punto Medio Retail", monto: 4_200_000, tasa: 17.2, plazo: "18 meses", riesgo: "BBB" },
        ],
      });
    }, 500)
  );
}

const fmtMonto = (x) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(x);

export default function Inversionistas() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchCrowdlinkData().then((d) => setData(d));
  }, []);

  return (
    <div className="page-inv">
      <Navbar />

      <main className="inv-main">
        {/* HERO GRID */}
        <section className="inv-hero-grid">
          <div className="inv-hero-left">
            <div className="inv-badge-row">
              <div className="inv-partner-pill">
                <img
                  src={crowdlinkLogo}
                  alt="Crowdlink"
                  className="inv-partner-logo"
                />
                <span>Integración Crowdlink</span>
              </div>
              <span className="inv-tag">Deuda privada · PYMEs MX</span>
            </div>

            <h1>Invierte en crédito empresarial estructurado</h1>
            <p className="inv-sub">
              Accede a oportunidades de deuda privada originadas por Plinius y
              fondeadas a través de Crowdlink. Tickets claros, retornos
              objetivo y control granular del riesgo.
            </p>

            <div className="inv-hero-actions">
              <button className="inv-btn-primary">
                Crear cuenta de inversionista
              </button>
              <button className="inv-btn-ghost">
                Descargar ficha informativa
              </button>
            </div>

            <ul className="inv-hero-bullets">
              <li>· Tickets desde 100 mil MXN.</li>
              <li>· Flujo mensual de intereses.</li>
              <li>· Operaciones auditadas y con contrato.</li>
            </ul>
          </div>

          {/* Panel derecho – “Portafolio” fake */}
          <aside className="inv-hero-right">
            <div className="inv-panel-head">
              <span className="inv-panel-title">Resumen de portafolio</span>
              <span className="inv-panel-pill">Vista demo</span>
            </div>

            {data ? (
              <>
                <div className="inv-panel-kpis">
                  <div className="inv-panel-kpi">
                    <span className="k-label">Valor estimado</span>
                    <span className="k-main">
                      {fmtMonto(1_250_000)}
                    </span>
                    <span className="k-sub">Capital invertido: {fmtMonto(1_000_000)}</span>
                  </div>
                  <div className="inv-panel-kpi">
                    <span className="k-label">Rendimiento anualizado</span>
                    <span className="k-main accent">
                      {data.rendimientoPromedio}%
                    </span>
                    <span className="k-sub">
                      Volatilidad: {data.volatilidad}% (hist.)
                    </span>
                  </div>
                </div>

                <div className="inv-mini-chart">
                  {[
                    { mes: "Ene", valor: 100 },
                    { mes: "Feb", valor: 102 },
                    { mes: "Mar", valor: 104 },
                    { mes: "Abr", valor: 106 },
                    { mes: "May", valor: 108 },
                    { mes: "Jun", valor: 112 },
                  ].map((p, i, arr) => {
                    const max = Math.max(...arr.map((r) => r.valor));
                    const pct = (p.valor / max) * 100;
                    return (
                      <div className="inv-mini-row" key={p.mes}>
                        <span className="inv-mini-label">{p.mes}</span>
                        <div className="inv-mini-bar">
                          <div
                            className="inv-mini-fill"
                            style={{ ["--w"]: `${pct}%` }}
                          />
                        </div>
                        <span className="inv-mini-val">
                          {p.valor.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="inv-panel-footer">
                  <div>
                    <span className="inv-foot-label">Inversionistas activos</span>
                    <span className="inv-foot-val">
                      {data.inversionistasActivos.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="inv-foot-label">Total colocado</span>
                    <span className="inv-foot-val">
                      {fmtMonto(data.totalColocado)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="inv-loading">Cargando integración demo…</div>
            )}
          </aside>
        </section>

        {/* GRID KPIs */}
        <section className="inv-kpis-section">
          <div className="inv-kpi-card">
            <h3>Deuda privada simplificada</h3>
            <p>
              Estructuras claras, contratos estándar y reporting alineado a lo
              que esperan family offices e inversionistas sofisticados.
            </p>
          </div>
          <div className="inv-kpi-card">
            <h3>Origen regulado</h3>
            <p>
              Originación y análisis de crédito respaldados por entidades
              reguladas, con controles y procesos robustos.
            </p>
          </div>
          <div className="inv-kpi-card">
            <h3>Panel unificado</h3>
            <p>
              Visualiza tickets, flujos de pago, vencimientos y concentración
              por deudor en un solo tablero.
            </p>
          </div>
        </section>

        {/* PIPELINE */}
        <section className="inv-pipeline-section">
          <div className="inv-sec-head">
            <div>
              <h2>Operaciones disponibles para fondeo</h2>
              <p className="inv-sec-sub">
                Ejemplo de pipeline alimentado mediante una API de Crowdlink
                hacia Plinius.
              </p>
            </div>
            <div className="inv-filters">
              <button className="chip small active">Todas</button>
              <button className="chip small">Corto plazo</button>
              <button className="chip small">Garantizadas</button>
            </div>
          </div>

          <div className="inv-pipeline-table">
            <div className="inv-pipeline-head">
              <span>Empresa</span>
              <span>Monto</span>
              <span>Tasa objetivo</span>
              <span>Plazo</span>
              <span>Rating interno</span>
              <span />
            </div>

            <div className="inv-pipeline-body">
              {data?.pipeline.map((p, i) => (
                <div className="inv-pipeline-row" key={i}>
                  <span className="col-main">{p.empresa}</span>
                  <span>{fmtMonto(p.monto)}</span>
                  <span>{p.tasa}%</span>
                  <span>{p.plazo}</span>
                  <span>
                    <span className="rating-pill">{p.riesgo}</span>
                  </span>
                  <span className="col-cta">
                    <button className="inv-row-btn">Ver ticket</button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section className="inv-steps-section">
          <h2>¿Cómo funciona para inversionistas?</h2>
          <div className="inv-steps-grid">
            <article className="inv-step">
              <div className="inv-step-num">1</div>
              <h3>Apertura y KYC</h3>
              <p>
                Abre tu cuenta, completa KYC y define el tipo de perfil
                (persona física, moral, family office).
              </p>
            </article>
            <article className="inv-step">
              <div className="inv-step-num">2</div>
              <h3>Selección de tickets</h3>
              <p>
                Filtra por plazo, tasa, sector y nivel de riesgo. Elige los
                tickets que quieres fondear.
              </p>
            </article>
            <article className="inv-step">
              <div className="inv-step-num">3</div>
              <h3>Monitoreo y flujos</h3>
              <p>
                Recibe intereses y amortizaciones según cada estructura. Haz
                seguimiento desde el panel de Plinius.
              </p>
            </article>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="inv-final-cta">
          <div className="inv-final-inner">
            <div>
              <h2>¿Te interesa fondear el siguiente ticket?</h2>
              <p>
                Agenda una llamada para revisar pipeline, estructura legal y
                proceso operativo de Plinius × Crowdlink.
              </p>
            </div>
            <div className="inv-final-actions">
              <button className="inv-btn-primary">Hablar con el equipo</button>
              <button className="inv-btn-ghost">Recibir deck para inversionistas</button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
