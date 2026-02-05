// src/pages/SobrePlinius.jsx
import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/css/sobreplinius.css";

export default function SobrePlinius() {
  return (
    <div className="app">
      <Navbar />

      <main className="spPage" aria-label="Sobre Plinius">
        <div className="wrap spWrap">
          <header className="spHead">
            <div className="spKicker mono">SOBRE PLINIUS</div>
            <h1 className="spH1">
              Plinius <span className="spAccent">Debt Fund</span>
            </h1>
          </header>

          <section className="spQuote" aria-label="Cita">
            <div className="spQuoteMark" aria-hidden="true">“</div>

            <blockquote className="spQuoteText">
              Rule No. 1: Never lose money. Rule No. 2: Never forget rule No. 1.
            </blockquote>

            <div className="spQuoteBy mono">— Warren Buffett</div>
          </section>

          <section className="spMission" aria-label="Misión">
            <div className="spMissionK mono">MISIÓN</div>
            <p className="spMissionText">
              Navegamos crédito privado en México con disciplina de riesgo, estructuras con fideicomiso y reporteo claro para
              inversionistas.
            </p>

            <div className="spMeta mono">
              PRIVATE CREDIT • RISK FIRST • STRUCTURING • REPORTING
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
