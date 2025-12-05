// src/App.jsx
import React, { useEffect } from "react";
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

export default function App() {
  // Animación reveal on scroll
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

      {/* ---------- HERO: SLOGAN + DASHBOARD ---------- */}
      <main className="hero">
        <div className="hero-bg" aria-hidden />
        <div className="hero-grid" aria-hidden />

        <div className="hero-inner">
          {/* Título y subtítulo */}
          <header className="hero-header">
            <img src={Plogo} alt="Plinius" className="hero-logo" />
            <h1>
              Crédito y arrendamiento puro para tu negocio.
              <span className="hero-highlight">
                {" "}
                Respuesta en máximo 48 horas.
              </span>
            </h1>
            <p className="hero-sub">
              Plinius simplifica el acceso a financiamiento para empresas en
              México. Procesos claros, panel de control para tus créditos y un
              equipo que habla el mismo idioma que tu negocio.
            </p>

            <div className="hero-cta-row">
              <Link to="/ingresar" className="btn btn-neon">
                Iniciar solicitud
              </Link>
              <Link to="/simulador" className="btn btn-outline">
                Simular crédito
              </Link>
            </div>
          </header>

          {/* Dashboard tipo Microsoft / Office */}
          <section className="hero-dashboard reveal">
            <div className="dash-screen">
              {/* Top bar */}
              <div className="dash-topbar">
                <div className="dash-topbar-left">
                  <span className="dash-app-name">Plinius</span>
                  <span className="dash-app-tag">Panel de cliente</span>
                </div>
                <div className="dash-topbar-right">
                  <span className="dash-company">
                    Atlas Logística Integrada, S.A. de C.V.
                  </span>
                  <span className="dash-user-avatar">AL</span>
                </div>
              </div>

              {/* Cuerpo: sidebar + contenido */}
              <div className="dash-body">
                {/* Sidebar */}
                <aside className="dash-sidebar">
                  <div className="dash-sidebar-section">
                    <p className="dash-sidebar-title">Menú</p>
                    <button className="dash-nav-item active">
                      Resumen general
                    </button>
                    <button className="dash-nav-item">Créditos activos</button>
                    <button className="dash-nav-item">Arrendamientos</button>
                    <button className="dash-nav-item">Vencimientos</button>
                    <button className="dash-nav-item">Ofertas disponibles</button>
                    <button className="dash-nav-item">Documentos</button>
                    <button className="dash-nav-item">Ajustes</button>
                  </div>
                </aside>

                {/* Contenido principal */}
                <section className="dash-main">
                  {/* KPIs */}
                  <div className="dash-kpi-row">
                    <div className="dash-kpi">
                      <span className="dash-kpi-label">
                        Línea aprobada total
                      </span>
                      <span className="dash-kpi-value">
                        {pesos(8_000_000, 0)}
                      </span>
                      <span className="dash-kpi-foot">
                        Disponible: {pesos(3_200_000, 0)}
                      </span>
                    </div>
                    <div className="dash-kpi">
                      <span className="dash-kpi-label">
                        Pago estimado este mes
                      </span>
                      <span className="dash-kpi-value">
                        {pesos(286_400, 0)}
                      </span>
                      <span className="dash-kpi-foot">Vencen 3 créditos</span>
                    </div>
                    <div className="dash-kpi">
                      <span className="dash-kpi-label">Estado general</span>
                      <span className="dash-kpi-status ok">Preaprobado</span>
                      <span className="dash-kpi-foot">
                        Perfil de riesgo dentro de políticas.
                      </span>
                    </div>
                  </div>

                  {/* Gráfica + tabla */}
                  <div className="dash-middle-row">
                    {/* Gráfica de flujo de pagos */}
                    <div className="dash-card">
                      <div className="dash-card-head">
                        <div>
                          <h3>Próximos pagos por mes</h3>
                          <p>Calendario estimado de flujos de los siguientes 6 meses.</p>
                        </div>
                        <select
                          className="dash-select"
                          defaultValue="6m"
                          aria-label="Rango de tiempo"
                        >
                          <option value="3m">3M</option>
                          <option value="6m">6M</option>
                          <option value="12m">12M</option>
                        </select>
                      </div>
                      <div className="dash-chart">
                        {[
                          { mes: "Sep", monto: 220_000 },
                          { mes: "Oct", monto: 310_000 },
                          { mes: "Nov", monto: 280_000 },
                          { mes: "Dic", monto: 340_000 },
                          { mes: "Ene", monto: 260_000 },
                          { mes: "Feb", monto: 295_000 },
                        ].map((row) => (
                          <div className="dash-chart-row" key={row.mes}>
                            <span className="dash-chart-label">{row.mes}</span>
                            <div
                              className="dash-chart-bar"
                              style={{
                                ["--w"]: `${Math.min(
                                  100,
                                  (row.monto / 340_000) * 100
                                ).toFixed(0)}%`,
                              }}
                            >
                              <div className="dash-chart-fill" />
                            </div>
                            <span className="dash-chart-value">
                              {pesos(row.monto / 1000, 0).replace(
                                "MXN",
                                ""
                              )}{" "}
                              mil
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tabla de créditos */}
                    <div className="dash-card">
                      <div className="dash-card-head">
                        <div>
                          <h3>Créditos y arrendamientos</h3>
                          <p>Resumen de operaciones activas con Plinius.</p>
                        </div>
                      </div>
                      <div className="dash-table">
                        <div className="dash-table-head">
                          <span>Producto</span>
                          <span>Saldo</span>
                          <span>Pago mensual</span>
                          <span>Próx. vencimiento</span>
                        </div>
                        <div className="dash-table-row">
                          <span>Crédito simple capital de trabajo</span>
                          <span>{pesos(2_800_000, 0)}</span>
                          <span>{pesos(145_000, 0)}</span>
                          <span>15 / Oct / 2025</span>
                        </div>
                        <div className="dash-table-row">
                          <span>Arrendamiento flotilla logística</span>
                          <span>{pesos(3_100_000, 0)}</span>
                          <span>{pesos(98_500, 0)}</span>
                          <span>07 / Nov / 2025</span>
                        </div>
                        <div className="dash-table-row">
                          <span>Crédito puente maquinaria</span>
                          <span>{pesos(1_450_000, 0)}</span>
                          <span>{pesos(42_900, 0)}</span>
                          <span>28 / Dic / 2025</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ---------- POR QUÉ PLINIUS ---------- */}
      <section className="section why reveal">
        <div className="section-inner">
          <header className="section-head">
            <h2>¿Por qué financiarte con Plinius?</h2>
            <p className="section-sub">
              Combinamos regulación, tecnología y criterio de crédito para
              acompañar a tu empresa mientras crece.
            </p>
          </header>

          <div className="why-grid">
            <article className="why-card">
              <h3>Brazo de instituciones reguladas</h3>
              <p>
                Plinius opera como brazo de dos entidades financieras reguladas
                en México ante CNBV y Banxico, con procesos diseñados para
                cumplir normativa sin frenar tu crecimiento.
              </p>
            </article>

            <article className="why-card">
              <h3>Procesos ágiles desde el día uno</h3>
              <p>
                Nacimos con tecnología: conexión a SAT, tableros de seguimiento
                y firma digital para que el tiempo se vaya a operar tu negocio,
                no a perseguir papeles.
              </p>
            </article>

            <article className="why-card">
              <h3>Crédito que crece contigo</h3>
              <p>
                Entendemos crédito empresarial: estructuramos montos, plazos y
                productos para acompañar la evolución de tu empresa, no para
                ahogarla en pagos.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ---------- PROCESO ---------- */}
      <section className="section process reveal">
        <div className="section-inner">
          <header className="section-head">
            <h2>Así de simple es obtener financiamiento</h2>
            <p className="section-sub">
              Un flujo pensado para founders, CFOs y equipos de finanzas que ya
              no quieren procesos eternos.
            </p>
          </header>

          <div className="process-grid">
            <article className="process-card">
              <div className="process-index">1</div>
              <h3>Cuenta y verificación</h3>
              <p>
                Crea tu cuenta, carga datos básicos de la empresa y verifica tu
                identidad en minutos.
              </p>
            </article>

            <article className="process-card">
              <div className="process-index">2</div>
              <h3>Conexión a SAT y análisis</h3>
              <p>
                Nos conectamos a SAT, analizamos tus flujos y construimos una
                oferta de crédito o arrendamiento a tu medida.
              </p>
            </article>

            <article className="process-card">
              <div className="process-index">3</div>
              <h3>Oferta, firma y desembolso</h3>
              <p>
                Revisa condiciones, firma tus contratos y recibe los recursos
                directo en tu cuenta. Sin vueltas innecesarias.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ---------- CTA FINAL ---------- */}
      <section className="section final-cta reveal">
        <div className="section-inner final-cta-inner">
          <div>
            <h2>Listo para solicitar crédito o arrendamiento?</h2>
            <p className="section-sub">
              Empieza tu solicitud en línea, déjanos leer tus números y
              construyamos juntos la estructura que tu empresa necesita.
            </p>
          </div>
          <Link to="/ingresar" className="btn btn-neon">
            Iniciar solicitud
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
