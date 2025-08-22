// src/pages/Equipo.jsx
import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const TeamMember = ({ name, role, bio, initials }) => (
  <div className="feature-card">
    <div className="icon" aria-hidden>
      <strong>{initials}</strong>
    </div>
    <div>
      <h3 style={{ marginBottom: 2 }}>{name}</h3>
      <p style={{ margin: 0, color: "#aeb4bf", fontSize: 12 }}>{role}</p>
      <p style={{ margin: "8px 0 0" }}>{bio}</p>
    </div>
  </div>
);

export default function Equipo() {
  const team = [
    {
      name: "Luis Armando Alvarez",
      role: "Partner",
      bio: "Originación, crédito estructurado.",
      initials: "LA",
    },
    {
      name: "Paulina Alvarez.",
      role: "Partner · ESG",
      bio: "Políticas de crédito, métricas y comité.",
      initials: "PA",
    },
    {
      name: "Juana Monroy.",
      role: "Gerencia Contabilidad y Fiscal",
      bio: "Estructuras contables, reportes regulatorios.",
      initials: "JM",
    },
    {
      name: "Equipo Operaciones",
      role: "Ops & Compliance",
      bio: "Procesos, KYC/AML y documentación.",
      initials: "OP",
    },
    {
      name: "Advisors",
      role: "Advisory Board",
      bio: "Mercados, banca de desarrollo y M&A.",
      initials: "AB",
    },
  ];

  return (
    <div className="app-container">
      <Navbar />
      <main className="section" style={{ padding: "72px 16px" }}>
        <div className="p-wrap">
          <header className="section-head">
            <h2 style={{ margin: 0, fontSize: "clamp(24px,4vw,36px)" }}>
              Nuestro equipo
            </h2>
            <p className="section-sub">
              Operación liviana, foco en riesgo y ejecución. Red de expertos por
              mandato.
            </p>
          </header>

          <div className="what-grid" style={{ marginTop: 12 }}>
            {team.map((m) => (
              <TeamMember key={m.name} {...m} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
