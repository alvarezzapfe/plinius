// src/pages/Enfoque.jsx
import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Paso = ({ n, title, desc }) => (
  <div className="feature-card">
    <div className="icon" aria-hidden>
      <strong>{n}</strong>
    </div>
    <div>
      <h3 style={{ marginBottom: 4 }}>{title}</h3>
      <p style={{ margin: 0 }}>{desc}</p>
    </div>
  </div>
);

export default function Enfoque() {
  const pasos = [
    {
      n: "1",
      title: "Diagnóstico",
      desc: "Entendimiento del negocio, fuentes de ingreso, estacionalidad y necesidades tácticas.",
    },
    {
      n: "2",
      title: "Estructura",
      desc: "Propuesta de producto, plazo, garantías (cuando aplique) y covenants claros.",
    },
    {
      n: "3",
      title: "Documentación",
      desc: "Onboarding digital, checklist y acompañamiento para tiempos de salida más cortos.",
    },
    {
      n: "4",
      title: "Decisión",
      desc: "Comité ágil y comunicación transparente de términos y próximos pasos.",
    },
    {
      n: "5",
      title: "Desembolso y seguimiento",
      desc: "Calendario de pagos, soporte operativo y panel de desempeño para la empresa.",
    },
  ];

  return (
    <div className="app-container">
      <Navbar />
      <main className="section" style={{ padding: "72px 16px" }}>
        <div className="p-wrap">
          <header className="section-head">
            <h2 style={{ margin: 0, fontSize: "clamp(24px,4vw,36px)" }}>
              Enfoque
            </h2>
            <p className="section-sub">
              Disciplina de originación, estructura clara y ejecución enfocada
              en flujo de efectivo.
            </p>
          </header>

          <div className="what-grid" style={{ marginTop: 12 }}>
            {pasos.map((p) => (
              <Paso key={p.n} {...p} />
            ))}
          </div>

          <div style={{ marginTop: 16 }} className="track-grid">
            <article className="deal" data-type="originacion">
              <header className="deal-head">
                <h3 className="deal-title">Productos</h3>
                <div className="deal-chips">
                  <span className="chip">Crédito simple</span>
                  <span className="chip outline">Arrendamiento</span>
                  <span className="chip">Asesoría</span>
                </div>
              </header>
              <div className="deal-body">
                <p className="deal-note">
                  Productos orientados a flujo, con plazos y pricing
                  competitivos y comunicación de riesgos y costos transparente.
                </p>
              </div>
            </article>

            <article className="deal" data-type="inversion">
              <header className="deal-head">
                <h3 className="deal-title">Gobierno</h3>
                <div className="deal-chips">
                  <span className="chip">Políticas</span>
                  <span className="chip outline">Comité</span>
                </div>
              </header>
              <div className="deal-body">
                <p className="deal-note">
                  Políticas de crédito y operación, comités definidos y
                  monitoreo de portafolio con métricas y alertas.
                </p>
              </div>
            </article>

            <article className="deal" data-type="credito">
              <header className="deal-head">
                <h3 className="deal-title">Alianzas</h3>
                <div className="deal-chips">
                  <span className="chip">Crowdlink</span>
                  <span className="chip outline">Banca de desarrollo</span>
                </div>
              </header>
              <div className="deal-body">
                <p className="deal-note">
                  Estructuras de fondeo diversificadas, integradas al proceso
                  comercial y operativo.
                </p>
              </div>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
