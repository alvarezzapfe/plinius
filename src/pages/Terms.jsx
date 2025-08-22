// src/pages/Terms.jsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "../assets/css/terms.css";

export default function Terms() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fechaVigencia = "22 de agosto de 2025";
  return (
    <div className="legal-page">
      <header className="legal-hero">
        <div className="legal-hero-wrap">
          <h1>Términos y Condiciones</h1>
          <p className="legal-sub">
            Infraestructura en Finanzas AI, S.A.P.I. de C.V. —{" "}
            <strong>Plinius</strong>
          </p>
          <div className="legal-meta">
            <span className="badge">Última actualización: {fechaVigencia}</span>
            <button className="btn-print" onClick={() => window.print()}>
              Imprimir / Guardar PDF
            </button>
          </div>
          <nav className="legal-breadcrumb" aria-label="Miga de pan">
            <Link to="/" className="crumb">
              Inicio
            </Link>
            <span className="sep">/</span>
            <span className="crumb current">Términos</span>
          </nav>
        </div>
      </header>

      <div className="legal-wrap">
        {/* TOC pegajoso */}
        <aside className="legal-toc" aria-label="Índice">
          <h2>Contenido</h2>
          <ol>
            <li>
              <a href="#objeto">1. Objeto</a>
            </li>
            <li>
              <a href="#definiciones">2. Definiciones</a>
            </li>
            <li>
              <a href="#elegibilidad">3. Elegibilidad del Usuario</a>
            </li>
            <li>
              <a href="#servicios">4. Servicios y Alcance</a>
            </li>
            <li>
              <a href="#proceso">5. Proceso de Originación</a>
            </li>
            <li>
              <a href="#precios">6. Tasas, Comisiones y Simulador</a>
            </li>
            <li>
              <a href="#covenants">7. Covenants y Monitoreo</a>
            </li>
            <li>
              <a href="#incumplimiento">8. Eventos de Incumplimiento</a>
            </li>
            <li>
              <a href="#kyc">9. KYC/AML, Prevención de Fraude</a>
            </li>
            <li>
              <a href="#datos">10. Privacidad y Datos</a>
            </li>
            <li>
              <a href="#propiedad">11. Propiedad Intelectual</a>
            </li>
            <li>
              <a href="#responsabilidad">12. Limitación de Responsabilidad</a>
            </li>
            <li>
              <a href="#modificaciones">13. Modificaciones</a>
            </li>
            <li>
              <a href="#ley">14. Ley Aplicable y Jurisdicción</a>
            </li>
            <li>
              <a href="#contacto">15. Contacto</a>
            </li>
          </ol>
        </aside>

        {/* Artículo */}
        <article className="legal-article">
          <section id="objeto">
            <h2>1. Objeto</h2>
            <p>
              Estos Términos y Condiciones regulan el acceso y uso de la
              plataforma
              <strong> Plinius</strong>, así como la relación entre la empresa
              <em> Infraestructura en Finanzas AI, S.A.P.I. de C.V.</em> (“
              <strong>Nosotros</strong>”) y los usuarios (“
              <strong>Usuario</strong>”). Los productos financieros están
              sujetos a evaluación crediticia y a políticas internas; la
              información del sitio tiene fines informativos y no constituye una
              oferta vinculante.
            </p>
          </section>

          <section id="definiciones">
            <h2>2. Definiciones</h2>
            <ul>
              <li>
                <strong>Crédito simple:</strong> financiamiento con calendario
                de pagos definido.
              </li>
              <li>
                <strong>Arrendamiento puro:</strong> esquema de renta sin opción
                de compra automática.
              </li>
              <li>
                <strong>DSCR/ICR/LTV/Leverage:</strong> métricas financieras
                utilizadas para underwriting y monitoreo.
              </li>
              <li>
                <strong>Crowdlink:</strong> aliado de fondeo; su acceso está
                sujeto a términos propios.
              </li>
            </ul>
          </section>

          <section id="elegibilidad">
            <h2>3. Elegibilidad del Usuario</h2>
            <p>
              El Usuario declara contar con capacidad legal, información veraz y
              documentación suficiente. Nos reservamos el derecho de aceptar,
              rechazar o cancelar solicitudes a nuestra discreción y conforme a
              la normativa aplicable.
            </p>
          </section>

          <section id="servicios">
            <h2>4. Servicios y Alcance</h2>
            <p>
              Ofrecemos originación y administración de financiamientos (crédito
              simple y arrendamiento), asesoría financiera y estructuración. El
              otorgamiento efectivo de recursos depende de la aprobación
              crediticia y disponibilidad de fondeo.
            </p>
            <p>
              Las funcionalidades del simulador son referenciales y no
              garantizan aprobación ni condiciones finales.
            </p>
          </section>

          <section id="proceso">
            <h2>5. Proceso de Originación</h2>
            <ol>
              <li>Solicitud y carga de documentación.</li>
              <li>
                Underwriting (DSCR, ICR, LTV, Leverage) y análisis cualitativo.
              </li>
              <li>Emisión de term sheet indicativo.</li>
              <li>
                Due diligence y validaciones (KYC/AML, legales, operativas).
              </li>
              <li>Formalización y desembolso.</li>
            </ol>
          </section>

          <section id="precios">
            <h2>6. Tasas, Comisiones y Simulador</h2>
            <p>
              Las tasas, plazos y comisiones publicadas (ej. tasas 18–36%,
              plazos 12–48 meses, comisión de apertura 3–5%) son orientativas y
              pueden variar según el perfil de riesgo. El{" "}
              <strong>CAT estimado</strong> mostrado por el simulador es un
              cálculo aproximado sin IVA; las condiciones finales se establecen
              en el contrato.
            </p>
          </section>

          <section id="covenants">
            <h2>7. Covenants y Monitoreo</h2>
            <p>
              El Usuario se obliga a proporcionar información financiera
              periódica, mantener métricas dentro de umbrales acordados y
              notificar eventos relevantes. El incumplimiento puede detonar
              remedios contractuales conforme a lo pactado.
            </p>
          </section>

          <section id="incumplimiento">
            <h2>8. Eventos de Incumplimiento</h2>
            <p>
              A título enunciativo: mora en pagos, información falsa, deterioro
              material de métricas, uso indebido de recursos, incumplimiento
              legal o contractual. Los remedios aplican según contrato
              (aceleración, penalidades, garantías, entre otros).
            </p>
          </section>

          <section id="kyc">
            <h2>9. KYC/AML, Prevención de Fraude</h2>
            <p>
              Implementamos procesos de identificación de clientes, verificación
              documental, listas restrictivas y reportes conforme a la normativa
              aplicable y mejores prácticas de la industria.
            </p>
          </section>

          <section id="datos">
            <h2>10. Privacidad y Datos</h2>
            <p>
              El tratamiento de datos personales se rige por nuestro Aviso de
              Privacidad. El Usuario autoriza el uso y resguardo de información
              conforme a la regulación vigente y consiente el intercambio con
              aliados de fondeo cuando sea necesario.
            </p>
          </section>

          <section id="propiedad">
            <h2>11. Propiedad Intelectual</h2>
            <p>
              Marcas, logotipos, textos, diseños, código y contenidos pertenecen
              a sus titulares. Queda prohibida su reproducción o uso no
              autorizado.
            </p>
          </section>

          <section id="responsabilidad">
            <h2>12. Limitación de Responsabilidad</h2>
            <p>
              La plataforma se ofrece “tal cual”. No garantizamos disponibilidad
              ininterrumpida. En la medida permitida por la ley, no somos
              responsables por daños indirectos, incidentales o consecuenciales.
            </p>
          </section>

          <section id="modificaciones">
            <h2>13. Modificaciones</h2>
            <p>
              Podemos modificar estos Términos en cualquier momento. La versión
              vigente se indicará mediante la fecha de última actualización. El
              uso continuado implica aceptación.
            </p>
          </section>

          <section id="ley">
            <h2>14. Ley Aplicable y Jurisdicción</h2>
            <p>
              Estos Términos se rigen por las leyes de los Estados Unidos
              Mexicanos. Cualquier controversia se someterá a los tribunales
              competentes de la Ciudad de México, renunciando a cualquier otro
              fuero que pudiera corresponder.
            </p>
          </section>

          <section id="contacto">
            <h2>15. Contacto</h2>
            <p>
              Dudas o solicitudes:{" "}
              <a href="mailto:contacto@crowdlink.mx">contacto@crowdlink.mx</a> ·
              Tel. <a href="tel:+525551609091">(55) 5551609091</a>
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
