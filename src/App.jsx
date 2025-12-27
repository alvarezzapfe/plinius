// src/App.jsx
import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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
  const location = useLocation();

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

  // ✅ Scroll a secciones por hash (#sobre-plinius, #enfoque)
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;

    // un pequeño delay para que el layout termine (navbar / fonts)
    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, [location.hash]);

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
                              {pesos(row.monto / 1000, 0).replace("MXN", "")} mil
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

      {/* ---------- SOBRE PLINIUS ---------- */}
      <section className="section why reveal" id="sobre-plinius">
        <div className="section-inner">
          <header className="section-head">
            <h2>Sobre Plinius</h2>
            <p className="section-sub">
              Financiamiento empresarial con enfoque práctico: claridad, velocidad y
              criterio de crédito basado en flujo real.
            </p>
          </header>

          <div className="why-grid">
            <article className="why-card">
              <div className="why-top">
                <h3>Financiamiento sin fricción</h3>
                <span className="why-badge">Digital + humano</span>
              </div>
              <p>
                Una experiencia simple para founders y equipos de finanzas:
                solicitud clara, seguimiento en panel y comunicación directa.
              </p>
              <ul className="why-list">
                <li>Proceso guiado y transparente</li>
                <li>Panel de control de créditos y vencimientos</li>
                <li>Documentos y avances siempre visibles</li>
              </ul>
            </article>

            <article className="why-card">
              <div className="why-top">
                <h3>Criterio de crédito serio</h3>
                <span className="why-badge">Cash-flow first</span>
              </div>
              <p>
                Analizamos capacidad de pago y estructura óptima (monto, plazo,
                producto) para que el crédito ayude a crecer, no a ahorcar.
              </p>
              <ul className="why-list">
                <li>Flujos, márgenes y estacionalidad</li>
                <li>Riesgo concentrado y dependencias</li>
                <li>Garantías cuando agregan valor</li>
              </ul>
            </article>

            <article className="why-card">
              <div className="why-top">
                <h3>Productos para operar</h3>
                <span className="why-badge">Crédito + Arrendamiento</span>
              </div>
              <p>
                Capital de trabajo, maquinaria, flotillas y crecimiento. Diseñamos
                la estructura para tu operación y tu ciclo de cobranza.
              </p>
              <ul className="why-list">
                <li>Crédito simple para capital de trabajo</li>
                <li>Arrendamiento puro (activos productivos)</li>
                <li>Calendarios alineados a tu negocio</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* ---------- ENFOQUE Y CRITERIOS ---------- */}
      <section className="section process reveal" id="enfoque">
        <div className="section-inner">
          <header className="section-head">
            <h2>Enfoque y criterios</h2>
            <p className="section-sub">
              Esto es lo que buscamos para darte una respuesta rápida y una oferta
              que tenga sentido.
            </p>
          </header>

          <div className="process-grid">
            <article className="process-card">
              <div className="process-index">1</div>
              <h3>Enfoque de análisis</h3>
              <p>
                Priorizamos la capacidad de pago real y la calidad de los flujos.
                Menos “papel”, más lectura de negocio.
              </p>
              <ul className="process-list">
                <li>Flujo libre y cobertura de deuda</li>
                <li>Calidad de ingresos y recurrencia</li>
                <li>Uso del crédito y retorno esperado</li>
              </ul>
            </article>

            <article className="process-card">
              <div className="process-index">2</div>
              <h3>Criterios base</h3>
              <p>
                No buscamos empresas “perfectas”, buscamos empresas con fundamentos
                y trazabilidad.
              </p>
              <ul className="process-list">
                <li>Antigüedad operando y evidencia de ventas</li>
                <li>Información fiscal (SAT) y bancarización</li>
                <li>Historial de pago y concentración de clientes</li>
              </ul>
            </article>

            <article className="process-card">
              <div className="process-index">3</div>
              <h3>Oferta en 48 horas</h3>
              <p>
                Con datos completos, podemos cotizar rápido: monto, plazo, tasa,
                comisiones y garantías (si aplican).
              </p>
              <ul className="process-list">
                <li>Pre-análisis → oferta preliminar</li>
                <li>Validación → términos finales</li>
                <li>Firma → desembolso / entrega de activo</li>
              </ul>
            </article>
          </div>

          <div className="criteria-note">
            <div className="criteria-card">
              <h4>Tip para acelerar</h4>
              <p>
                Si conectas SAT y adjuntas estados de cuenta, el análisis corre más
                rápido y la oferta sale mejor estructurada.
              </p>
            </div>
            <div className="criteria-card">
              <h4>Qué puedes esperar</h4>
              <p>
                Te diremos “sí”, “no” o “sí, pero así” (con estructura alternativa).
                Siempre con razón clara.
              </p>
            </div>
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
