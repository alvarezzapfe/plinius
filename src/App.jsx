// src/App.jsx
import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./assets/css/theme.css";
import plogo from "./assets/images/plogo.png";

export default function App() {
  const location = useLocation();

  /* Reveal on scroll (snap desde extremos) */
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in");
          else e.target.classList.remove("in");
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -10% 0px",
      }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* Scroll to hash sections */
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;
    setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, [location.hash]);

  return (
    <div className="app-container">
      <Navbar />

      {/* ---------- HERO ---------- */}
      <main className="hero">
        <div className="hero-bg" aria-hidden />
        <div className="hero-grid" aria-hidden />

        <div className="hero-inner">
          <header className="hero-header">
            <div className="hero-miniBrand">
              <img src={plogo} alt="Plinius" className="hero-miniLogo" />
              <span className="hero-miniText">Tailor-made offers · 48h · sin fricción</span>
              <span className="hero-miniDot" aria-hidden />
              <span className="hero-miniTag">Fintech crédito empresarial</span>
            </div>

            <h1>
              Crédito empresarial que <span className="hero-highlight">sí se ajusta a tu negocio</span>.
              <br />
              <span className="hero-highlight">Oferta en máximo 48 horas.</span>
            </h1>

            <p className="hero-sub">
              
            </p>

            <div className="hero-cta-row hero-cta-row-3">
              <Link to="/ingresar" className="btn btn-neon">
                Iniciar solicitud
              </Link>
              <Link to="/simulador" className="btn btn-outline">
                Simular crédito
              </Link>
              <Link to="/#tailor" className="btn btn-outline btn-accentOutline">
                Ver cómo tailor-made
              </Link>
            </div>

            <div className="hero-badges">
              <span className="hero-badge">Cash-flow first</span>
              <span className="hero-badge">Trazabilidad</span>
              <span className="hero-badge">Documentos y seguimiento</span>
              <span className="hero-badge">Calendarios inteligentes</span>
            </div>

            <div className="trust-strip">
              <div className="trust-pill">
                <span className="trust-kpi">48h</span>
                <span className="trust-label">respuesta objetivo</span>
              </div>
              <div className="trust-pill">
                <span className="trust-kpi">1</span>
                <span className="trust-label">panel para todo</span>
              </div>
              
            </div>
          </header>
        </div>
      </main>

      {/* ---------- SOBRE PLINIUS ---------- */}
      <section className="section why reveal reveal-left" id="sobre-plinius">
        <div className="section-inner">
          <header className="section-head">
            <h2>Sobre Plinius</h2>
            <p className="section-sub">
              Financiamiento empresarial con criterio práctico: claridad, velocidad y estructura basada en flujo real.
            </p>
          </header>

          <div className="why-grid">
            <article className="why-card">
              <div className="why-top">
                <h3>Proceso sin fricción</h3>
                <span className="why-badge">Digital + humano</span>
              </div>
              <p>Solicitud clara, seguimiento en panel y comunicación directa.</p>
              <ul className="why-list">
                <li>Checklist simple de docs</li>
                <li>Visibilidad de estatus</li>
                <li>Una sola conversación, sin perder contexto</li>
              </ul>
            </article>

            <article className="why-card">
              <div className="why-top">
                <h3>Tailor-made de verdad</h3>
                <span className="why-badge">No plantillas</span>
              </div>
              <p>Diseñamos el crédito alrededor de tu operación (no al revés).</p>
              <ul className="why-list">
                <li>Monto/plazo/calendario según ciclo</li>
                <li>Pagos alineados a cobros</li>
                <li>Covenants con sentido</li>
              </ul>
            </article>

            <article className="why-card">
              <div className="why-top">
                <h3>Control total</h3>
                <span className="why-badge">Panel</span>
              </div>
              <p>Docs, avance, términos, vencimientos y comunicación: todo en un solo lugar.</p>
              <ul className="why-list">
                <li>Documentos centralizados</li>
                <li>Historial y trazabilidad</li>
                <li>Menos correo, más control</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* ---------- ENFOQUE Y CRITERIOS ---------- */}
      <section className="section process reveal reveal-right" id="enfoque">
        <div className="section-inner">
          <header className="section-head">
            <h2>Enfoque y criterios</h2>
            <p className="section-sub">Lo que buscamos para darte respuesta rápida y una oferta con sentido.</p>
          </header>

          <div className="process-grid">
            <article className="process-card">
              <div className="process-index">1</div>
              <h3>Diagnóstico express</h3>
              <p>Entendemos tu operación y tu ciclo de cobro/pago.</p>
              <ul className="process-list">
                <li>Flujo libre + estacionalidad</li>
                <li>Concentración y dependencias</li>
                <li>Uso del crédito (para qué y para cuándo)</li>
              </ul>
            </article>

            <article className="process-card">
              <div className="process-index">2</div>
              <h3>Estructura tailor-made</h3>
              <p>No es solo “tasa”: es diseño de producto y calendario.</p>
              <ul className="process-list">
                <li>Calendario alineado a caja</li>
                <li>Garantías cuando agregan valor</li>
                <li>Cláusulas claras, sin letra chiquita</li>
              </ul>
            </article>

            <article className="process-card">
              <div className="process-index">3</div>
              <h3>Oferta en 48h</h3>
              <p>Con datos completos, cotizamos rápido.</p>
              <ul className="process-list">
                <li>Pre-análisis → oferta</li>
                <li>Validación → términos</li>
                <li>Firma → desembolso</li>
              </ul>
            </article>
          </div>

          <div className="criteria-note">
            <div className="criteria-card">
              <h4>Tip para acelerar</h4>
              <p>Sube estados de cuenta + estados financieros: reduces ida y vuelta y te respondemos más rápido.</p>
            </div>
            <div className="criteria-card">
              <h4>Qué puedes esperar</h4>
              <p>“Sí”, “no” o “sí, pero así”. Con razón concreta y siguientes pasos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- TAILOR MADE ---------- */}
      <section className="section tailor reveal reveal-left" id="tailor">
        <div className="section-inner">
          <header className="section-head">
            <h2>Tailor-made offers (los detalles que sí importan)</h2>
            <p className="section-sub">
              Estructuramos para que el crédito te ayude a operar: pagos, plazos y condiciones diseñadas alrededor de tu flujo.
            </p>
          </header>

          <div className="tailor-grid">
            <div className="tailor-card">
              <div className="tailor-title">Calendario inteligente</div>
              <div className="tailor-sub">Pagos alineados a tu ciclo (no a nuestra comodidad).</div>
              <div className="tailor-pills">
                <span className="tailor-pill">mensual</span>
                <span className="tailor-pill">quincenal</span>
                <span className="tailor-pill">estacional</span>
                <span className="tailor-pill">bullet</span>
              </div>
            </div>

            <div className="tailor-card">
              <div className="tailor-title">Términos claros</div>
              <div className="tailor-sub">Menos sorpresas. Más transparencia.</div>
              <div className="tailor-pills">
                <span className="tailor-pill">fees visibles</span>
                <span className="tailor-pill">covenants sensatos</span>
                <span className="tailor-pill">documentos checklist</span>
              </div>
            </div>

            <div className="tailor-card">
              <div className="tailor-title">Producto correcto</div>
              <div className="tailor-sub">No todo es crédito simple: elegimos herramienta.</div>
              <div className="tailor-pills">
                <span className="tailor-pill">capital de trabajo</span>
                <span className="tailor-pill">arrendamiento</span>
                <span className="tailor-pill">refinanciamiento</span>
              </div>
            </div>
          </div>

          <div className="tailor-ctaRow">
            <Link to="/ingresar" className="btn btn-neon">
              Quiero mi oferta
            </Link>
            <Link to="/simulador" className="btn btn-ghost">
              Ver simulador
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- CASOS DE USO ---------- */}
      <section className="section usecases reveal reveal-right" id="casos">
        <div className="section-inner">
          <header className="section-head">
            <h2>Casos de Uso</h2>
            <p className="section-sub">Ejemplos de “problemas reales” con solución estructurada.</p>
          </header>

          <div className="use-grid">
            <article className="use-card">
              <div className="use-kicker">Crecimiento</div>
              <h3>Capital para inventario / expansión</h3>
              <p>Pagos que entienden estacionalidad y rotación.</p>
            </article>

            <article className="use-card">
              <div className="use-kicker">Operación</div>
              <h3>Desfase de cobranza</h3>
              <p>Calendario alineado a flujo de clientes (sin asfixia).</p>
            </article>

            <article className="use-card">
              <div className="use-kicker">Eficiencia</div>
              <h3>Maquinaria / flotilla</h3>
              <p>Arrendamiento puro o estructura mixta, según tu caso.</p>
            </article>

            <article className="use-card">
              <div className="use-kicker">Orden</div>
              <h3>Consolidación / refinanciamiento</h3>
              <p>Reordenamos pasivos y hacemos el pago “vivible”.</p>
            </article>

            
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="section faq reveal reveal-left" id="faq">
        <div className="section-inner">
          <header className="section-head">
            <h2>FAQ</h2>
            <p className="section-sub">Lo típico que te preguntarías (y sí, aquí va directo).</p>
          </header>

          <div className="faq-grid">
            <details className="faq-item">
              <summary>¿Qué necesito para que sí salga en 48 horas?</summary>
              <div className="faq-body">
                Estados de cuenta, estados financieros (aunque sea internos), y claridad de uso del crédito. Entre más completo,
                más rápido.
              </div>
            </details>

            <details className="faq-item">
              <summary>¿Tailor-made significa más caro?</summary>
              <div className="faq-body">
                No necesariamente. Muchas veces baja el riesgo (mejor estructura) y eso ayuda. Lo caro es el crédito mal alineado.
              </div>
            </details>

            <details className="faq-item">
              <summary>¿Cómo se ve el seguimiento?</summary>
              <div className="faq-body">
                En tu dashboard: docs, estatus, historial, y claridad de lo que sigue. Cero “¿me lo reenvías?”.
              </div>
            </details>

            <details className="faq-item">
              <summary>¿Tasa Promedio?</summary>
              <div className="faq-body">
                Depende de la capacidad de pago de la empresa, pero nuestra tasa promedio es 28% anualizada.
              </div>
            </details>


          </div>
        </div>
      </section>

      {/* ---------- CTA FINAL ---------- */}
      <section className="section final-cta reveal reveal-up">
        <div className="section-inner final-cta-inner">
          <div>
            <h2>¿Listo para una oferta que sí te quede?</h2>
            <p className="section-sub">Haz la solicitud. Nosotros nos encargamos de estructurarla con sentido.</p>
          </div>

          <div className="cta-inline">
            <Link to="/ingresar" className="btn btn-neon">
              Iniciar solicitud
            </Link>
            <Link to="/simulador" className="btn btn-outline">
              Simular crédito
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
