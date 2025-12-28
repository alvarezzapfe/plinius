// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./assets/css/theme.css";
import { supabase } from "./lib/supabaseClient";

/* =====================================================
   HELPERS
   ===================================================== */
const pesos = (x, max = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: max,
  }).format(Number.isFinite(x) ? x : 0);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function inferKind(producto = "") {
  const p = String(producto).toLowerCase();
  if (p.includes("arrend")) return "lease";
  if (p.includes("private") || p.includes("privado")) return "private";
  if (p.includes("reestr") || p.includes("consol")) return "refi";
  return "credit";
}

function titleFromCredito(c) {
  const prod = c?.producto ? String(c.producto) : "Crédito";
  return `${prod}`;
}

/**
 * ✅ NO UUID assumptions
 * Blocks ONLY placeholders like "ph-1"
 */
const isRealId = (id) => {
  if (id === null || id === undefined) return false;
  const s = String(id).trim();
  if (!s || s === "undefined" || s === "null") return false;
  return !s.startsWith("ph-") && s !== "empty";
};

/* =====================================================
   Home
   ===================================================== */
export default function App() {
  const location = useLocation();

  /* =======================
     Reveal on scroll
  ======================= */
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle("in", e.isIntersecting)),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* =======================
     Scroll to hash sections
  ======================= */
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;

    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }, [location.hash]);

  /* =====================================================
     Opportunities from Supabase (creditos)
     - Estado: "fondeando" = invertible
  ===================================================== */
  const [opps, setOpps] = useState([]);
  const [oppErr, setOppErr] = useState("");
  const [oppLoading, setOppLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setOppErr("");
      setOppLoading(true);

      const { data, error } = await supabase
        .from("creditos")
        .select("id,estado,producto,monto_objetivo,monto_recaudado,tasa_anual,plazo_meses,tag,created_at")
        .in("estado", ["fondeando"])
        .order("created_at", { ascending: false })
        .limit(40);

      if (!mounted) return;

      if (error) {
        setOppErr(error.message);
        setOpps([]);
        setOppLoading(false);
        return;
      }

      const mapped = (data || []).map((c) => {
        const idStr = String(c?.id ?? "").trim();
        const real = isRealId(idStr);

        // ✅ IMPORTANT: cards never send to /inversionistas
        const href = real ? `/creditos/${encodeURIComponent(idStr)}` : "/#oportunidades";

        return {
          id: idStr,
          kind: inferKind(c.producto),
          title: titleFromCredito(c),
          tag: c.tag || "Oportunidad",
          rate: `${Number(c.tasa_anual || 0).toFixed(1)}% anual`,
          term: `${c.plazo_meses || "—"} meses`,
          target: Number(c.monto_objetivo || 0),
          raised: Number(c.monto_recaudado || 0),
          ctaTo: href,
          detailTo: href,
          canOpenDetail: real,
        };
      });

      setOpps(mapped);
      setOppLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const opportunities = useMemo(() => opps || [], [opps]);

  const hasOpps = opportunities.length > 0;
  const showEmpty = !oppLoading && !oppErr && !hasOpps;

  return (
    <div className="app-container">
      <Navbar />

      {/* ---------- HERO ---------- */}
      <main className="hero">
        <div className="hero-bg" aria-hidden />
        <div className="hero-grid" aria-hidden />

        <div className="hero-inner">
          <header className="hero-header">
            <h1>
              Crédito, gestión de crédito e inversión en{" "}
              <span className="hero-highlight">crédito privado</span>.{" "}
              <span className="hero-highlight">Respuesta en máximo 48 horas.</span>
            </h1>

            <p className="hero-sub">
              Plinius es una plataforma para empresas e inversionistas: pide crédito, administra tus vencimientos y accede a
              oportunidades de inversión en crédito privado (con datos y trazabilidad).
            </p>

            {/* 3 CTAs */}
            <div className="hero-cta-row hero-cta-row-3">
              <Link to="/ingresar" className="btn btn-neon">
                Iniciar solicitud
              </Link>
              <Link to="/simulador" className="btn btn-outline">
                Simular crédito
              </Link>
              {/* ✅ Scroll a oportunidades (NO /inversionistas) */}
              <Link to="/#oportunidades" className="btn btn-outline btn-accentOutline">
                Invertir
              </Link>
            </div>

            {/* badges */}
            <div className="hero-badges">
              <span className="hero-badge">Crédito empresarial</span>
              <span className="hero-badge">Panel de control</span>
              <span className="hero-badge">Crédito privado</span>
              <span className="hero-badge">Data + humano</span>
            </div>

            {/* Header del carrusel */}
            <div className="hero-carouselHead" id="oportunidades">
              <div>
                <h2>Oportunidades activas</h2>
                <p>
                  Conectado a Supabase (tabla <strong>creditos</strong>). Hover pausa el movimiento.
                </p>
              </div>

              <div className="hero-carouselHint" title="Se actualiza al recargar (después lo hacemos realtime)">
                <span className="hint-dot" />
                {oppLoading ? "Cargando…" : oppErr ? "Error" : hasOpps ? "Live" : "Sin oportunidades"}
              </div>
            </div>
          </header>

          {/* FULL BLEED BAND */}
          <section className="offer-bleed" aria-label="Oportunidades fondeando">
            <div className="offer-bleedGlow" aria-hidden />
            <div className="offer-marquee reveal">
              <div className="offer-edges" aria-hidden />

              {/* Error */}
              {oppErr ? (
                <div style={{ padding: "0 18px", opacity: 0.9 }}>
                  No pude cargar oportunidades: <strong>{oppErr}</strong>
                </div>
              ) : /* Empty coqueto */ showEmpty ? (
                <EmptyOpportunities />
              ) : /* Loading */ oppLoading ? (
                <div style={{ padding: "0 18px", opacity: 0.9 }}>Cargando oportunidades…</div>
              ) : (
                <OfferCarousel items={opportunities} duration={46} />
              )}
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
              Financiamiento empresarial con enfoque práctico: claridad, velocidad y criterio de crédito basado en flujo real.
            </p>
          </header>

          <div className="why-grid">
            <article className="why-card">
              <div className="why-top">
                <h3>Financiamiento sin fricción</h3>
                <span className="why-badge">Digital + humano</span>
              </div>
              <p>Solicitud clara, seguimiento en panel y comunicación directa.</p>
              <ul className="why-list">
                <li>Proceso guiado y transparente</li>
                <li>Panel de control de créditos y vencimientos</li>
                <li>Documentos y avances visibles</li>
              </ul>
            </article>

            <article className="why-card">
              <div className="why-top">
                <h3>Criterio de crédito serio</h3>
                <span className="why-badge">Cash-flow first</span>
              </div>
              <p>Estructura óptima (monto, plazo, producto) para crecer sin ahorcarte.</p>
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
              <p>Capital de trabajo, maquinaria, flotillas y crecimiento. Calendarios alineados al negocio.</p>
              <ul className="why-list">
                <li>Crédito simple para capital de trabajo</li>
                <li>Arrendamiento puro</li>
                <li>Pagos alineados al ciclo</li>
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
            <p className="section-sub">Lo que buscamos para darte respuesta rápida y una oferta con sentido.</p>
          </header>

          <div className="process-grid">
            <article className="process-card">
              <div className="process-index">1</div>
              <h3>Enfoque de análisis</h3>
              <p>Capacidad de pago real y calidad de flujos.</p>
              <ul className="process-list">
                <li>Flujo libre y cobertura</li>
                <li>Recurrencia y concentración</li>
                <li>Uso del crédito</li>
              </ul>
            </article>

            <article className="process-card">
              <div className="process-index">2</div>
              <h3>Criterios base</h3>
              <p>Fundamentos + trazabilidad.</p>
              <ul className="process-list">
                <li>Ventas comprobables</li>
                <li>Fiscal y bancarización</li>
                <li>Historial de pago</li>
              </ul>
            </article>

            <article className="process-card">
              <div className="process-index">3</div>
              <h3>Oferta en 48 horas</h3>
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
              <p>Conecta SAT y adjunta estados de cuenta para análisis más rápido.</p>
            </div>
            <div className="criteria-card">
              <h4>Qué puedes esperar</h4>
              <p>“Sí”, “no” o “sí, pero así”. Con razón clara.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CTA FINAL ---------- */}
      <section className="section final-cta reveal">
        <div className="section-inner final-cta-inner">
          <div>
            <h2>¿Listo para solicitar crédito o invertir?</h2>
            <p className="section-sub">Empieza en línea: solicita, administra y estructuramos bien.</p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link to="/ingresar" className="btn btn-neon">
              Iniciar solicitud
            </Link>
            <Link to="/#oportunidades" className="btn btn-outline btn-accentOutline">
              Ver oportunidades
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* =====================================================
   Empty state coqueto (si NO hay oportunidades)
   ===================================================== */
function EmptyOpportunities() {
  return (
    <div className="offer-emptyWrap">
      <div className="offer-empty">
        <div className="offer-emptyGlow" aria-hidden />
        <div className="offer-emptyInner">
          <div className="offer-emptyKicker">
            <span className="offer-emptyDot" aria-hidden />
            Próxima ventana de fondeo
          </div>

          <h3 className="offer-emptyTitle">Estamos preparando ofertas para ti</h3>

          <p className="offer-emptySub">
            En Plinius abrimos ventanas de fondeo por lotes: cuando el siguiente crédito esté listo,
            lo verás aquí primero. Si quieres prioridad, deja tu señal y te avisamos.
          </p>

          <div className="offer-emptyActions">
            <Link to="/inversionistas" className="btn btn-neon btn-compact">
              Quiero acceso prioritario
            </Link>
            <Link to="/ingresar" className="btn btn-ghost btn-compact">
              Solicitar crédito
            </Link>
          </div>

          <div className="offer-emptyFoot">
            <span className="offer-emptyChip">Data + trazabilidad</span>
            <span className="offer-emptyChip">Tickets claros</span>
            <span className="offer-emptyChip">Flujos y reporting</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   Offer Carousel
   - duplicates items for seamless loop (track moves -50%)
   - only duplicates if > 1 item
   ===================================================== */
function OfferCarousel({ items, duration = 46 }) {
  const safe = Array.isArray(items) ? items : [];
  const shouldLoop = safe.length > 1;
  const doubled = shouldLoop ? [...safe, ...safe] : safe;
  const dur = `${Math.max(18, Number(duration) || 46)}s`;

  return (
    <div className="offer-track" style={{ ["--duration"]: dur }}>
      {doubled.map((it, idx) => (
        <OfferCard key={`${it.id}-${idx}`} item={it} />
      ))}
    </div>
  );
}

function OfferCard({ item }) {
  const target = Number(item?.target || 0);
  const raised = Number(item?.raised || 0);
  const pct = target > 0 ? clamp((raised / target) * 100, 0, 100) : 0;

  const iconClass =
    item.kind === "lease" ? "lease" : item.kind === "private" ? "private" : item.kind === "refi" ? "refi" : "";

  const iconText = item.kind === "lease" ? "L" : item.kind === "private" ? "P" : item.kind === "refi" ? "R" : "C";

  // ✅ Strong routing: real -> /creditos/:id, else -> #oportunidades
  const idStr = String(item?.id ?? "").trim();
  const real = isRealId(idStr);
  const creditHref = real ? `/creditos/${encodeURIComponent(idStr)}` : "/#oportunidades";

  return (
    <article className="offer-card">
      <div className="offer-top">
        <div className={`offer-iconWrap ${iconClass}`} aria-hidden>
          <strong>{iconText}</strong>
        </div>

        <div className="offer-topText">
          <h3 className="offer-title">{item.title}</h3>

          <div className="offer-meta">
            <span className="offer-pill">{item.rate}</span>
            <span className="offer-pill">{item.term}</span>
            <span className="offer-pill">{item.tag}</span>
          </div>
        </div>
      </div>

      <div className="offer-grid">
        <div className="offer-stat">
          <span className="offer-label">Monto objetivo</span>
          <span className="offer-value">{pesos(target, 0)}</span>
        </div>

        <div className="offer-stat">
          <span className="offer-label">Capital recaudado</span>
          <span className="offer-value offer-raised">{pesos(raised, 0)}</span>
        </div>
      </div>

      <div className="offer-progress">
        <div className="offer-progressBar" aria-hidden>
          <div className="offer-progressFill" style={{ ["--p"]: `${pct.toFixed(0)}%` }} />
        </div>

        <div className="offer-progressFoot">
          <span>
            Avance: <strong>{pct.toFixed(0)}%</strong>
          </span>
          <span className="offer-chip">Fondeando</span>
        </div>
      </div>

      <div className="offer-cta">
        <Link to={creditHref} className="btn btn-neon btn-compact">
          Invertir
        </Link>
        <Link to={creditHref} className="btn btn-ghost btn-compact">
          Ver detalle
        </Link>
      </div>
    </article>
  );
}
