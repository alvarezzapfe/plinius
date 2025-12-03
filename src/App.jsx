// src/App.jsx
import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./assets/css/theme.css";
import Plogo from "./assets/images/logo2-plinius.png";

// Helpers de formato
const pesos = (x, max = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: max,
  }).format(x);

const pct = (x, digits = 1) => `${x.toFixed(digits)}%`;

// Hook para animar secciones al hacer scroll
function useRevealOnScroll() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

// Contenedor con animación de entrada
function Reveal({ children, className = "" }) {
  const ref = useRevealOnScroll();
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

export default function App() {
  const monto = 1_250_000;
  const plazoMeses = 24;
  const tasa = 21.8;

  return (
    <div className="app-container">
      <Navbar />

      <main className="landing">
        <div className="landing-bg" aria-hidden />
        <div className="landing-grid" aria-hidden />

        {/* ================= HERO: SLOGAN + DASHBOARD ================= */}
        <section className="hero">
          <div className="hero-inner">
            {/* Copy principal */}
            <div className="hero-copy">
              <img src={Plogo} alt="Plinius" className="hero-logo" />

              <h1>
                Crédito y arrendamiento puro
                <br />
                para tu negocio.
              </h1>

              <p className="hero-sub">
                Respuesta en máximo <strong>48 horas</strong>. Diseñado para
                empresas que necesitan velocidad, claridad y estructura.
              </p>

              <div className="hero-badges">
                <span className="pill hero-pill">
                  Tickets desde {pesos(250_000, 0)} hasta {pesos(5_000_000, 0)}
                </span>
                <span className="pill hero-pill">
                  PyMEs y empresas mid-market
                </span>
                <span className="pill hero-pill">
                  Crédito y arrendamiento puro
                </span>
              </div>

              <div className="hero-cta-row">
                <Link to="/simulador" className="btn btn-neon">
                  Simular mi financiamiento
                </Link>
                <Link to="/solicitud" className="btn btn-outline">
                  Iniciar solicitud
                </Link>
              </div>
            </div>

            {/* Pantalla tipo dashboard (vista cliente) */}
            <div className="hero-screen">
              <div className="screen-frame">
                <div className="screen-topbar">
                  <div className="screen-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                  <span className="screen-title">
                    Plinius · Panel de deuda · Logística Delta S.A. de C.V.
                  </span>
                  <div className="screen-user">
                    <span className="screen-user-avatar">LD</span>
                    <span className="screen-user-name">
                      Ana López · Finanzas
                    </span>
                  </div>
                </div>

                <div className="screen-body">
                  <div className="screen-layout">
                    {/* SIDEBAR */}
                    <aside className="screen-sidebar">
                      <div className="sidebar-company">
                        <span className="sidebar-company-name">
                          Logística Delta
                        </span>
                        <span className="sidebar-company-tag">
                          MID·MARKET · MX
                        </span>
                      </div>

                      <nav className="sidebar-menu">
                        <button className="sidebar-item active">
                          <span className="sidebar-dot" />
                          Vencimientos
                        </button>
                        <button className="sidebar-item">
                          <span className="sidebar-dot" />
                          Créditos activos
                        </button>
                        <button className="sidebar-item">
                          <span className="sidebar-dot" />
                          Arrendamientos
                        </button>
                        <button className="sidebar-item">
                          <span className="sidebar-dot" />
                          Ofertas de línea
                        </button>
                        <button className="sidebar-item">
                          <span className="sidebar-dot" />
                          Documentos
                        </button>
                        <button className="sidebar-item">
                          <span className="sidebar-dot" />
                          Configuración
                        </button>
                      </nav>

                      <div className="sidebar-footer">
                        <span className="sidebar-status-label">
                          Estado general
                        </span>
                        <span className="sidebar-status-pill">
                          Perfil sano · DSCR 1.8x
                        </span>
                      </div>
                    </aside>

                    {/* MAIN AREA */}
                    <div className="screen-mainarea">
                      {/* KPIs fila superior */}
                      <div className="main-kpi-row">
                        <div className="main-kpi-card">
                          <div className="main-kpi-label">
                            Crédito activo total
                          </div>
                          <div className="main-kpi-value">
                            {pesos(monto, 0)}
                          </div>
                          <div className="main-kpi-sub">
                            {plazoMeses} meses · {pct(tasa, 1)} · Crédito simple
                          </div>
                        </div>

                        <div className="main-kpi-card">
                          <div className="main-kpi-label">
                            Próximo vencimiento
                          </div>
                          <div className="main-kpi-value">{pesos(73_500)}</div>
                          <div className="main-kpi-sub">
                            15 de marzo · Pago mensual estimado
                          </div>
                        </div>

                        <div className="main-kpi-card">
                          <div className="main-kpi-label">
                            Oferta preaprobada
                          </div>
                          <div className="main-kpi-value">
                            {pesos(1_800_000, 0)}
                          </div>
                          <div className="main-kpi-sub">
                            Línea arrendamiento · 36 meses
                          </div>
                        </div>
                      </div>

                      {/* ROW: Vencimientos + Ofertas */}
                      <div className="main-row">
                        {/* Vencimientos */}
                        <div className="main-panel">
                          <div className="panel-header">
                            <span className="panel-title">
                              Vencimientos próximos (90 días)
                            </span>
                          </div>

                          <div className="panel-table small">
                            <div className="panel-table-head">
                              <span>Fecha</span>
                              <span>Producto</span>
                              <span>Monto</span>
                              <span>Estado</span>
                            </div>

                            <div className="panel-table-row">
                              <span>15 · Mar</span>
                              <span>Crédito capital de trabajo</span>
                              <span>{pesos(73_500)}</span>
                              <span className="status-text status-ok">
                                <span className="status-dot-mini" />
                                Al corriente
                              </span>
                            </div>
                            <div className="panel-table-row">
                              <span>30 · Mar</span>
                              <span>Arrendamiento flotilla</span>
                              <span>{pesos(92_300)}</span>
                              <span className="status-text status-watch">
                                <span className="status-dot-mini" />
                                Revisar flujo
                              </span>
                            </div>
                            <div className="panel-table-row">
                              <span>10 · Abr</span>
                              <span>Línea revolvente logística</span>
                              <span>{pesos(41_800)}</span>
                              <span className="status-text status-risk">
                                <span className="status-dot-mini" />
                                Vencido
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ofertas */}
                        <div className="main-panel">
                          <div className="panel-header">
                            <span className="panel-title">
                              Ofertas de crédito y arrendamiento
                            </span>
                            <span className="panel-preapproved">
                              Preaprobado
                            </span>
                          </div>

                          <div className="panel-offers-list">
                            <div className="offer-card">
                              <div className="offer-main-line">
                                <span className="offer-title">
                                  Crédito para inventario
                                </span>
                                <span className="offer-amount">
                                  {pesos(900_000)}
                                </span>
                              </div>
                              <div className="offer-sub">
                                18 meses · Tasa desde 19.9% · Sin garantía
                                hipotecaria
                              </div>
                            </div>

                            <div className="offer-card">
                              <div className="offer-main-line">
                                <span className="offer-title">
                                  Arrendamiento de unidades
                                </span>
                                <span className="offer-amount">
                                  {pesos(1_800_000)}
                                </span>
                              </div>
                              <div className="offer-sub">
                                36 meses · Opción de compra · Flotilla ligera
                              </div>
                            </div>

                            <div className="offer-cta">
                              Ver todas las estructuras sugeridas
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ROW: Actividad */}
                      <div className="main-row">
                        <div className="main-panel">
                          <div className="panel-header">
                            <span className="panel-title">
                              Actividad reciente
                            </span>
                            <span className="panel-tag">Log</span>
                          </div>

                          <div className="activity-timeline">
                            <div className="activity-item">
                              <span className="activity-dot" />
                              <div className="activity-body">
                                <div className="activity-title">
                                  Term sheet actualizado
                                </div>
                                <div className="activity-meta">
                                  Nuevo límite sugerido para línea revolvente.
                                </div>
                                <div className="activity-time">
                                  Hace 12 min · Por motor Plinius
                                </div>
                              </div>
                            </div>

                            <div className="activity-item">
                              <span className="activity-dot" />
                              <div className="activity-body">
                                <div className="activity-title">
                                  Archivo SAT sincronizado
                                </div>
                                <div className="activity-meta">
                                  Facturación febrero leída correctamente.
                                </div>
                                <div className="activity-time">
                                  Hoy · 08:42 · API SAT
                                </div>
                              </div>
                            </div>

                            <div className="activity-item">
                              <span className="activity-dot" />
                              <div className="activity-body">
                                <div className="activity-title">
                                  Recordatorio de vencimiento
                                </div>
                                <div className="activity-meta">
                                  Enviado correo a Ana López por pago del 15 de
                                  marzo.
                                </div>
                                <div className="activity-time">
                                  Ayer · 17:10
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* END MAIN AREA */}
                  </div>
                </div>

                <div className="screen-footer">
                  <span className="screen-foot-text">
                    Vista de ejemplo para fines demostrativos. La interfaz real
                    de Plinius se adapta a tu empresa, productos y límites de
                    crédito.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SECCIÓN: POR QUÉ PLINIUS ================= */}
        <section className="why-section" id="por-que-plinius">
          <div className="section-inner">
            <div className="section-header">
              <span className="section-kicker">POR QUÉ PLINIUS</span>
              <h2>Más que crédito: un socio financiero que entiende la empresa</h2>
              <p>
                Plinius nace desde el mundo regulado y estructurado, pero con la
                velocidad y diseño de producto de una fintech moderna.
              </p>
            </div>

            <div className="why-grid">
              <Reveal className="why-card">
                <div className="why-icon-badge">01</div>
                <h3>Respaldo regulado</h3>
                <p>
                  Somos el brazo de dos instituciones financieras reguladas en
                  México, supervisadas por <strong>CNBV</strong> y{" "}
                  <strong>Banxico</strong>.
                </p>
                <ul>
                  <li>Gobierno corporativo y cumplimiento normativo</li>
                  <li>Procesos de crédito institucionales</li>
                  <li>Seguridad y trazabilidad en cada operación</li>
                </ul>
              </Reveal>

              <Reveal className="why-card">
                <div className="why-icon-badge">02</div>
                <h3>Diseño 100% digital</h3>
                <p>
                  Nacimos con tecnología: conexión directa a SAT, estados
                  financieros y modelos de riesgo propios.
                </p>
                <ul>
                  <li>Onboarding en minutos, sin papeles</li>
                  <li>Tablero para seguimiento de créditos</li>
                  <li>Procesos pensados para equipos de finanzas</li>
                </ul>
              </Reveal>

              <Reveal className="why-card">
                <div className="why-icon-badge">03</div>
                <h3>Oferta que crece contigo</h3>
                <p>
                  Entendemos crédito como ningún otro: buscamos construir una
                  relación de largo plazo con tu empresa.
                </p>
                <ul>
                  <li>Esquemas de crédito y arrendamiento escalables</li>
                  <li>Aumentos de línea sujetos a desempeño</li>
                  <li>Diseño de estructuras a la medida</li>
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ================= SECCIÓN: PROCESO ================= */}
        <section className="process-section" id="proceso">
          <div className="section-inner">
            <div className="section-header">
              <span className="section-kicker">PROCESO</span>
              <h2>De solicitud a fondeo, en tres pasos claros</h2>
              <p>
                Sin sucursales ni filas: el proceso está pensado para equipos de
                finanzas que necesitan claridad, orden y tiempos concretos.
              </p>
            </div>

            <div className="process-grid">
              <Reveal className="process-card">
                <div className="process-step">
                  <span className="process-step-number">1</span>
                </div>
                <div className="process-body">
                  <h3>Abre tu cuenta y verifícate</h3>
                  <p>
                    Crea tu usuario, registra la empresa y completa tu perfil.
                    Verificamos identidad y datos básicos de forma digital.
                  </p>
                  <ul>
                    <li>Usuario administrador de la empresa</li>
                    <li>Carga de documentos clave (RFC, acta, etc.)</li>
                    <li>Validación inicial automática</li>
                  </ul>
                </div>
              </Reveal>

              <Reveal className="process-card">
                <div className="process-step">
                  <span className="process-step-number">2</span>
                </div>
                <div className="process-body">
                  <h3>Conecta SAT y generamos la oferta</h3>
                  <p>
                    Con nuestra conexión a SAT analizamos facturación,
                    patrones de cobro y riesgos para definir capacidad de
                    crédito.
                  </p>
                  <ul>
                    <li>Lectura de ingresos y concentración de clientes</li>
                    <li>Modelos de riesgo y métricas tipo banca</li>
                    <li>Term sheet indicativo de crédito / arrendamiento</li>
                  </ul>
                </div>
              </Reveal>

              <Reveal className="process-card">
                <div className="process-step">
                  <span className="process-step-number">3</span>
                </div>
                <div className="process-body">
                  <h3>Firma y recibe el crédito</h3>
                  <p>
                    Una vez aprobada la propuesta, firmas contrato
                    electrónicamente y liberamos recursos.
                  </p>
                  <ul>
                    <li>Revisión de garantías (si aplica)</li>
                    <li>Firma digital de contratos</li>
                    <li>Depósito del crédito en tu cuenta</li>
                  </ul>
                </div>
              </Reveal>
            </div>

            <div className="process-cta">
              <Link to="/solicitud" className="btn btn-neon-green">
                Iniciar solicitud
              </Link>
              <span className="process-micro">
                Tiempo típico de respuesta: hasta 48 horas hábiles, sujeto a
                documentación completa.
              </span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
