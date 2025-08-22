// src/pages/SobrePlinius.jsx
import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function SobrePlinius() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="section" style={{ padding: "72px 16px" }}>
        <div className="p-wrap">
          <header className="section-head">
            <h2 style={{ margin: 0, fontSize: "clamp(24px,4vw,36px)" }}>
              Sobre Plinius
            </h2>
            <p className="section-sub">
              Plataforma de financiamiento y asesoría para PyMEs en México.
            </p>
          </header>

          <div className="what-grid">
            <article className="feature-card">
              <div className="icon">🎯</div>
              <div>
                <h3>Misión</h3>
                <p>
                  Reducir fricción en crédito y arrendamiento con productos
                  claros y tiempos de respuesta competitivos.
                </p>
              </div>
            </article>
            <article className="feature-card">
              <div className="icon">🧭</div>
              <div>
                <h3>Visión</h3>
                <p>
                  Ser el partner financiero preferido de PyMEs de alto
                  crecimiento, integrando fondeo e inteligencia de negocio.
                </p>
              </div>
            </article>
            <article className="feature-card">
              <div className="icon">🤝</div>
              <div>
                <h3>Modelo</h3>
                <p>
                  Crédito simple, arrendamiento y asesoría estratégica, con
                  fondeo vía alianzas y gobierno de riesgo disciplinado.
                </p>
              </div>
            </article>
          </div>

          <div style={{ marginTop: 16 }} className="what-grid">
            <article className="feature-card">
              <div className="icon">⚙️</div>
              <div>
                <h3>Operación</h3>
                <p>
                  Onboarding digital, documentación guiada y panel de
                  seguimiento para solicitantes.
                </p>
              </div>
            </article>
            <article className="feature-card">
              <div className="icon">🔗</div>
              <div>
                <h3>Alianzas</h3>
                <p>
                  Crowdlink y socios estratégicos de fondeo institucional y
                  banca de desarrollo.
                </p>
              </div>
            </article>
            <article className="feature-card">
              <div className="icon">🔒</div>
              <div>
                <h3>Compliance</h3>
                <p>
                  KYC/AML, gobierno y auditoría de procesos. Transparencia para
                  inversionistas y reguladores.
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
