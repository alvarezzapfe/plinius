// src/App.jsx
import React, { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./assets/css/theme.css";

// Assets
import soporteImg from "./assets/images/soporte.jpg";
import pliniusLogo from "./assets/images/plinius-logo.png";

/* =========================================================
   0) HOOKS
========================================================= */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function useHashScroll() {
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;
    setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }, [location.hash]);
}

/* =========================================================
   1) HERO
========================================================= */
function Hero() {
  return (
    <section className="hero" id="top" aria-label="Hero">
      <div className="heroBg" aria-hidden="true" />

      <div className="wrap heroWrap">
        <div className="heroCopy reveal">
          <div className="kicker mono"></div>

          <h1 className="heroH1">
            <span className="muted">Administra el servicio de la Deuda en una sola plataforma</span>
          </h1>

          <p className="heroLead">
            Plinius ayuda a <b>gestionar derechos de cobro</b>, operar{" "}
            <b>fideicomisos de administración y garantía</b>, monitorear <b>riesgos/triggers</b> y generar{" "}
            <b>reporteo</b>.
            <br />
            <span className="muted">
              Servicing y ejecución diaria: <b>Soporte Impulsa (SOFOM)</b>.
            </span>
          </p>

          <div className="heroCta">
            <Link to="/solicitud" className="btn btn--primary">
              Iniciar solicitud
            </Link>
            <Link to="/#flow-l" className="btn btn--secondary">
              Ver diagrama
            </Link>
          </div>
        </div>

        <div className="heroPanelWrap reveal" aria-label="Pantalla (dashboard) simulada">
          <HeroScreen />
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   2) HERO SCREEN — dashboard realista
========================================================= */
function HeroScreen() {
  const kpis = useMemo(
    () => [
      { k: "Cobranza conciliada", v: "MXN 18.4m", s: "últimos 30 días", tone: "good" },
      { k: "Mora temprana", v: "2.1%", s: "0–30 días", tone: "warn" },
      { k: "Triggers activos", v: "1", s: "en vigilancia", tone: "warn" },
      { k: "Waterfall", v: "OK", s: "dispersión en orden", tone: "good" },
    ],
    []
  );

  const recent = useMemo(
    () => [
      { ref: "CBR-2041", who: "Acreditado 019", amt: "48,250", st: "OK" },
      { ref: "CBR-2042", who: "Acreditado 044", amt: "79,300", st: "OK" },
      { ref: "CBR-2043", who: "Acreditado 112", amt: "15,300", st: "REV" },
      { ref: "CBR-2044", who: "Acreditado 087", amt: "62,400", st: "OK" },
    ],
    []
  );

  return (
    <section className="screen" aria-label="Pantalla de panel operativo">
      <div className="screen__top">
        <div>
          <div className="mono screenK">PANEL OPERATIVO</div>
          <div className="screenH">Cobranza • Calendario • Conciliación</div>
        </div>

        <div className="screenLive" aria-label="estado">
          <span className="liveDot" aria-hidden="true" />
          <span className="mono liveText">operando</span>
        </div>
      </div>

      <div className="screen__grid">
        <div className="screenCard screenCard--chart">
          <div className="screenCard__hdr">
            <div>
              <div className="mono miniK">líneas de cobro</div>
              <div className="miniH">Ingresos a cuenta (4 semanas)</div>
            </div>
            <span className="mono tagChip">live</span>
          </div>

          <div className="chartFake" aria-hidden="true">
            <div className="chartLine chartLine--a" />
            <div className="chartLine chartLine--b" />
            <div className="chartAxis" />
          </div>

          <div className="kpiGrid">
            {kpis.map((r) => (
              <div key={r.k} className={`kpi kpi--${r.tone}`}>
                <div className="mono kpiK">{r.k}</div>
                <div className="mono kpiV">{r.v}</div>
                <div className="kpiS">{r.s}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="screenCard">
          <div className="screenCard__hdr">
            <div>
              <div className="mono miniK">calendario</div>
              <div className="miniH">Fechas de cobro / reporte</div>
            </div>
            <span className="mono tagChip">mes</span>
          </div>

          <div className="calFake" aria-hidden="true">
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                className={`calCell ${[2, 4, 7, 11, 17, 23].includes(i) ? "isPay" : ""} ${
                  i === 9 ? "isReport" : ""
                }`}
              />
            ))}
          </div>

          <div className="calLegend">
            <span className="lg lg--blue" /> <span className="mono">pago</span>
            <span className="lg lg--purple" /> <span className="mono">reporte</span>
          </div>
        </div>

        <div className="screenCard screenCard--table">
          <div className="screenCard__hdr">
            <div>
              <div className="mono miniK">cobros recientes</div>
              <div className="miniH">Referencias y estatus</div>
            </div>
            <span className="mono tagChip">últimos</span>
          </div>

          <div className="t">
            <div className="tRow tHead">
              <div>Ref</div>
              <div>Deudor</div>
              <div className="tNum">Monto</div>
              <div>Estatus</div>
            </div>

            {recent.map((r) => (
              <div key={r.ref} className={`tRow ${r.st === "REV" ? "tRow--warn" : ""}`}>
                <div className="mono tStrong">{r.ref}</div>
                <div className="tMut">{r.who}</div>
                <div className="mono tNum">MXN {r.amt}</div>
                <div className={`mono pill ${r.st === "REV" ? "pill--warn" : "pill--ok"}`}>{r.st}</div>
              </div>
            ))}
          </div>

          <div className="screenFoot mono">Conciliación y evidencia • Servicing + gobierno en Plinius</div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   3) FLOW-L DIAGRAM
========================================================= */
function FlowLDiagram({ soporteSrc, pliniusLogoSrc }) {
  return (
    <section className="flowL section" id="flow-l" aria-label="Diagrama L">
      <div className="wrap">
        <div className="sectionHead reveal">
          <div className="sectionHead__kicker mono">estructura</div>
          <h2 className="sectionHead__title">Todo el servicio de la Deuda en una sola estructura</h2>
          <p className="sectionHead__sub">Administramos las garantias y gestionamos cobranza.</p>
        </div>

        <div className="flowLStage reveal" role="region" aria-label="Stage del diagrama">
          <div className="flowLGrid">
            {/* COL 1 — CAPITAL */}
            <div className="flowCard flowCard--left flowLCol flowLCol--left">
              <div className="flowCard__k mono">CAPITAL</div>
              <div className="flowCard__t">Inversionistas / Acreedores</div>
              <div className="flowCard__d"></div>

              <div className="flowTags">
                <span className="mono flowTag">mandato</span>
                <span className="mono flowTag">rendimientos</span>
                <span className="mono flowTag">reporteo</span>
              </div>
            </div>

            {/* COL 2 — L CONNECTOR (solo una línea →) */}
            <div className="flowLCol flowLCol--conn" aria-hidden="true">
              <LConnector hDrop={18} />
            </div>

            {/* COL 3 — STACK */}
            <div className="flowLCol flowLCol--center">
              <div className="spvStack">
                <div className="spvTriWrap">
                  <div className="spvTri" aria-label="SPV">
                    <div className="spvTri__label mono">SPV</div>
                    <div className="spvTri__sub mono">fideicomiso de garantias</div>
                  </div>
                </div>

                {/* ⇅ ahora se entiende ida/vuelta */}
                <VConnector label="SPV ⇅ Soporte Impulsa" tone="green" bidir />

                <div className="soporteBox" aria-label="Soporte Impulsa">
                  <div className="soporteBox__in">
                    <div className="soporteBox__k mono">SOPORTE IMPULSA</div>

                    <div className="soporteBox__logo">
                      <img src={soporteSrc} alt="Soporte Impulsa" />
                      <div>
                        <div className="soporteBox__t">SOFOM • Servicing</div>
                        <div className="soporteBox__d">Cobranza, conciliación, evidencia</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ⇅ también */}
                <VConnector label="Servicing ⇅ Empresas acreditadas" tone="blue" bidir />

                <div className="flowCard flowCard--borrower flowBorrower" aria-label="Empresa Acreditada">
                  <div className="flowCard__k mono">ACREDITADO</div>
                  <div className="flowCard__t">Empresas acreditadas</div>
                  <div className="flowCard__d">
                    Reciben crédito y pagan por calendario. La cobranza se opera vía Soporte y se administra via Plinius.
                  </div>

                  <div className="flowTags"></div>
                </div>
              </div>
            </div>

            {/* COL 4 — PLINIUS */}
            <div className="adminCard flowLCol flowLCol--right" aria-label="Plinius administrador del crédito">
              <div className="adminCard__top">
                <div className="adminBrand">
                  <div className="adminBrand__logo" aria-hidden="true">
                    {pliniusLogoSrc ? <img src={pliniusLogoSrc} alt="" /> : <span className="mono">P</span>}
                  </div>
                  <div>
                    <div className="adminBrand__k mono">PLINIUS</div>
                    <div className="adminBrand__t">Administrador del Crédito</div>
                  </div>
                </div>

                <div className="adminStatus" aria-label="estado operativo">
                  <span className="adminDot" aria-hidden="true" />
                  <span className="adminStatus__t mono">operando</span>
                </div>
              </div>

              <div className="adminDesc">Gobierno, triggers, bitácora y reportes. Control del activo y del servicing.</div>

              <div className="miniScreen" aria-label="Mini pantalla">
                <div className="miniScreen__hdr">
                  <div className="miniScreen__ttl mono">control & riesgos</div>
                  <div className="miniScreen__chips">
                    <span className="mono chip">covenants</span>
                    <span className="mono chip">alerts</span>
                  </div>
                </div>

                <div className="miniScreen__body">
                  <div className="screenPulse" aria-hidden="true" />

                  <div className="sparkRow">
                    <div className="sparkLabel mono">Cobranza</div>
                    <div className="sparkBar">
                      <span className="sparkFill" />
                    </div>
                  </div>

                  <div className="sparkRow">
                    <div className="sparkLabel mono">Conciliación</div>
                    <div className="sparkBar">
                      <span className="sparkFill sparkFill--b" />
                    </div>
                  </div>

                  <div className="sparkRow">
                    <div className="sparkLabel mono">Riesgo</div>
                    <div className="sparkBar">
                      <span className="sparkFill sparkFill--c" />
                    </div>
                  </div>
                </div>

                <div className="miniScreen__ftr mono">servicing + gobierno</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================
   CONNECTORS (layout-anchored, no SVG)
========================= */

/**
 * LConnector:
 * - ahora es SOLO un flujo (una línea) con flecha a la derecha
 * - sin flecha arriba y sin “ida/vuelta”
 * - hDrop baja el codo+horizontal sin romper la conexión
 */
function LConnector({ hDrop = 0 }) {
  return (
    <div className="LConn" style={{ "--LhDrop": `${hDrop}px` }} aria-hidden="true">
      <div className="LConn__label mono">capital → spv</div>

      {/* Vertical (sin flecha) */}
      <div className="LConn__v" aria-hidden="true" />

      {/* Joint */}
      <div className="LConn__joint" aria-hidden="true" />

      {/* Horizontal + flecha derecha */}
      <div className="LConn__h" aria-hidden="true">
        <span className="LConn__headRight" />
      </div>
    </div>
  );
}

/**
 * VConnector bidireccional (⇅):
 * - una sola línea, flecha arriba y abajo
 */
function VConnector({ label, tone = "green", bidir = true }) {
  return (
    <div className={`VConn VConn--${tone}`} aria-hidden="true">
      <div className="VConn__lbl mono">{label}</div>
      <div className="VConn__line">
        {bidir && <span className="VConn__headUp" />}
        <span className="VConn__headDown" />
      </div>
    </div>
  );
}

/* =========================================================
   4) ABOUT
========================================================= */
function About() {
  const cards = useMemo(
    () => [
      { t: "Fideicomisos", d: "Administración y garantía: reglas claras, cuentas y reporteo continuo." },
      { t: "Derechos de cobro", d: "Trazabilidad por contrato: calendario, evidencia y conciliación bancaria." },
      { t: "Riesgo", d: "Triggers, covenants, alertas y bitácora para comité / inversionistas." },
      { t: "Operación", d: "Servicing con Soporte Impulsa (SOFOM) y gobierno en Plinius." },
    ],
    []
  );

  return (
    <section className="section" id="sobre-plinius" aria-label="Sobre Plinius">
      <div className="wrap">
        <div className="sectionHead reveal">
          <div className="sectionHead__kicker mono">sobre plinius</div>
          <h2 className="sectionHead__title">Administra deuda, cobros y garantías con gobierno real</h2>
          <p className="sectionHead__sub">
            Modular y operativo. Diseñado para deuda privada, estructuras con servicing y reporteo a inversionistas.
          </p>
        </div>

        <div className="aboutGrid reveal">
          {cards.map((c) => (
            <div key={c.t} className="aboutCard">
              <div className="aboutT">{c.t}</div>
              <div className="aboutD">{c.d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   5) PAGE
========================================================= */
export default function App() {
  useReveal();
  useHashScroll();

  return (
    <div className="app">
      <Navbar />

      <main className="page">
        <Hero />
        <FlowLDiagram soporteSrc={soporteImg} pliniusLogoSrc={pliniusLogo} />
        <About />
      </main>

      <Footer />
    </div>
  );
}
