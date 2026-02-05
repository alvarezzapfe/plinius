// src/pages/Equipo.jsx
import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/css/equipo.css";

// Assets
import luisImg from "../assets/images/luis.png";
import crowdlink from "../assets/images/crowdlink.png";
import mxc from "../assets/images/mxc.png";
import pimx from "../assets/images/pimx.png";
import idlogo from "../assets/images/id.png";

const Metric = ({ k, v }) => (
  <div className="fmMetric">
    <div className="fmMetricK mono">{k}</div>
    <div className="fmMetricV">{v}</div>
  </div>
);

const Partner = ({ name, desc, img }) => (
  <div className="pCard" aria-label={name}>
    <div className="pLogo">
      <img src={img} alt={`${name} logo`} loading="lazy" decoding="async" />
    </div>
    <div className="pMeta">
      <div className="pName">{name}</div>
      <div className="pDesc">{desc}</div>
    </div>
  </div>
);

export default function Equipo() {
  const bullets = [
    "Luis ha tenido amplia experiencia desde 2020 en transacciones de Banca de Inversion y asesoria, participo en la Administracion Cautelar de Intercam en 2025. Ha participado en algunas Transacciones relevantes de Deuda Privada en 2025.",
    "Luis fue Portafolio Manager de Fixed Income en Fondo Actinver durante 2018 y 2019.",
    "Trader de Fixed Income en Seguros Monterrey",
    "Cofundador de Crowdlink, una plataforma de Crowdlending para Pymes en Mexico",
    "Ingeniero Industrial por la Universidad Anahuac Norte",
    "Candidato al nivel 3 del CFA",
  ];

  const metrics = [
    { k: "AUM", v: "MXN X.XB" },
    { k: "IRR Neto", v: "X.X%" },
    { k: "Default", v: "X.XX%" },
    { k: "Vintage", v: "20XX–20XX" },
  ];

  const partners = [
    { name: "Crowdlink", desc: "Originación y acceso a crédito.", img: crowdlink },
    { name: "MXC Capital", desc: "Banca de inversión boutique.", img: mxc },
    { name: "PiMX", desc: "Fondo de deuda privada.", img: pimx },
    { name: "International Disruption ID", desc: "Ecosistema y alianzas.", img: idlogo },
  ];

  return (
    <div className="app">
      <Navbar />

      {/* Full viewport content */}
      <main className="fmPage" aria-label="Fund Manager + Partnerships">
        <div className="wrap fmWrap">
          <section className="fmGrid">
            {/* Fund Manager */}
            <div className="fmCard" aria-label="Fund Manager">
              <div className="fmTop">
                <div className="fmPhoto">
                  <img src={luisImg} alt="Luis Armando Alvarez Zapfe" loading="eager" decoding="async" />
                </div>

                <div className="fmHead">
                  <div className="fmK mono">FUND MANAGER</div>
                  <div className="fmName">Luis Armando Alvarez Zapfe</div>
                  <div className="fmTitle">Plinius Debt Fund · Mexico</div>

                  
                </div>
              </div>

              <div className="fmBody">
                <div className="fmBullets">
                  <div className="fmBulletsK mono">HIGHLIGHTS</div>
                  <ul>
                    {bullets.map((b, i) => (
                      <li key={i}>
                        <span className="dot" aria-hidden="true" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                
              </div>
            </div>

            {/* Partnerships */}
            <div className="pWrap" aria-label="Partnerships">
              <div className="pHead">
                <div className="pK mono">PARTNERSHIPS</div>
                <div className="pH">Ecosistema</div>
              </div>

              <div className="pGrid">
                {partners.map((p) => (
                  <Partner key={p.name} {...p} />
                ))}
              </div>

              <div className="pFoot mono">PLINIUS • DEBT FUND</div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
