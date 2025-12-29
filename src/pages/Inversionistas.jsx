// src/pages/Inversionistas.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/css/Inversionistas.css";
import crowdlinkLogo from "../assets/images/crowdlink-logo.png";
import { supabase } from "../lib/supabaseClient";

/* =======================
   Helpers
======================= */
const fmtMXN = (x) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(Number(x)) ? Number(x) : 0);

const fmtPct = (x, d = 1) => `${(Number.isFinite(Number(x)) ? Number(x) : 0).toFixed(d)}%`;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const cleanText = (s, max = 120) =>
  String(s ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

/* =======================
   MVP Market Data (local)
   ✅ Cambia esto luego por Supabase: deals/tickets
======================= */
const MARKET_DEALS = [
  {
    id: "PLN-RF-2412",
    empresa: "Rising Farms",
    sector: "Agro",
    ciudad: "GDL",
    monto: 10_000_000,
    tasa: 18.0,
    plazo_meses: 24,
    pago: "Mensual",
    estructura: "Amortizable",
    garantia: "Garantía mobiliaria + cobranza",
    rating: "B+",
    ltv: 62,
    dscr: 1.35,
    stage: "Abierto",
    min_ticket: 100_000,
  },
  {
    id: "PLN-SV-2501",
    empresa: "Servimsa Logistics",
    sector: "Logística",
    ciudad: "CDMX",
    monto: 7_500_000,
    tasa: 19.5,
    plazo_meses: 36,
    pago: "Mensual",
    estructura: "Amortizable",
    garantia: "Cesión de derechos + aval",
    rating: "BB-",
    ltv: 58,
    dscr: 1.22,
    stage: "En colocación",
    min_ticket: 150_000,
  },
  {
    id: "PLN-PM-2411",
    empresa: "Punto Medio Retail",
    sector: "Retail",
    ciudad: "QRO",
    monto: 4_200_000,
    tasa: 17.2,
    plazo_meses: 18,
    pago: "Mensual",
    estructura: "Bullet",
    garantia: "Garantía personal",
    rating: "BBB",
    ltv: 45,
    dscr: 1.55,
    stage: "Abierto",
    min_ticket: 100_000,
  },
  {
    id: "PLN-AL-2502",
    empresa: "Atlas Logística Integrada",
    sector: "Logística",
    ciudad: "MTY",
    monto: 12_000_000,
    tasa: 20.0,
    plazo_meses: 24,
    pago: "Mensual",
    estructura: "Amortizable",
    garantia: "Garantía mobiliaria",
    rating: "B",
    ltv: 66,
    dscr: 1.18,
    stage: "Próximo",
    min_ticket: 200_000,
  },
];

/* =======================
   Component
======================= */
export default function Inversionistas() {
  const nav = useNavigate();

  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);
  const user = session?.user;

  // UI state (logged-in market)
  const [q, setQ] = useState("");
  const [fStage, setFStage] = useState("all"); // all | abierto | colocacion | proximo
  const [fSector, setFSector] = useState("all");
  const [fEstructura, setFEstructura] = useState("all"); // all | amortizable | bullet
  const [sort, setSort] = useState("score"); // score | tasa | plazo | monto

  // modal simple (MVP)
  const [openDeal, setOpenDeal] = useState(null);

  // Boot session (Supabase)
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data?.session || null);
      setBooting(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => setSession(s));

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // derived filters options
  const sectors = useMemo(() => {
    const set = new Set(MARKET_DEALS.map((d) => d.sector).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    let out = MARKET_DEALS.slice();

    // stage filter
    if (fStage !== "all") {
      const s = fStage;
      out = out.filter((d) => String(d.stage || "").toLowerCase().includes(s));
    }

    // sector filter
    if (fSector !== "all") out = out.filter((d) => d.sector === fSector);

    // estructura filter
    if (fEstructura !== "all") {
      out = out.filter((d) => String(d.estructura || "").toLowerCase().includes(fEstructura));
    }

    // search
    if (needle) {
      out = out.filter((d) => {
        const blob = `${d.id} ${d.empresa} ${d.sector} ${d.ciudad} ${d.estructura} ${d.garantia} ${d.rating}`.toLowerCase();
        return blob.includes(needle);
      });
    }

    // sorting
    const score = (d) => {
      // Score heurístico (MVP): más tasa + mejor dscr + menor ltv + mejor rating proxy
      // rating proxy: BBB > BB- > B+ > B
      const r = String(d.rating || "").toUpperCase();
      const ratingScore =
        r.startsWith("BBB") ? 4 : r.startsWith("BB") ? 3 : r.startsWith("B+") ? 2 : r.startsWith("B") ? 1 : 0;

      const tasa = Number(d.tasa || 0);
      const dscr = Number(d.dscr || 0);
      const ltv = Number(d.ltv || 0);
      return tasa * 2 + dscr * 10 + ratingScore * 6 + (100 - ltv) * 0.15;
    };

    out.sort((a, b) => {
      if (sort === "tasa") return Number(b.tasa || 0) - Number(a.tasa || 0);
      if (sort === "plazo") return Number(a.plazo_meses || 0) - Number(b.plazo_meses || 0);
      if (sort === "monto") return Number(b.monto || 0) - Number(a.monto || 0);
      return score(b) - score(a);
    });

    return out;
  }, [q, fStage, fSector, fEstructura, sort]);

  const stats = useMemo(() => {
    const total = MARKET_DEALS.length;
    const abiertos = MARKET_DEALS.filter((d) => String(d.stage || "").toLowerCase().includes("abierto")).length;
    const colocacion = MARKET_DEALS.filter((d) => String(d.stage || "").toLowerCase().includes("coloc")).length;
    const avgTasa =
      total > 0 ? MARKET_DEALS.reduce((acc, d) => acc + Number(d.tasa || 0), 0) / total : 0;

    return { total, abiertos, colocacion, avgTasa };
  }, []);

  // Actions (MVP)
  const goLogin = () => nav("/ingresar?registro=1");
  const goRegister = () => nav("/ingresar?registro=1");
  const onInvest = (deal) => {
    // MVP: manda a inversiones tab del dashboard o a solicitud de inversión
    // Ajusta cuando tengas flujo real (ticket checkout)
    nav("/dashboard");
    // opcional: toast o guardar estado en localStorage
    try {
      localStorage.setItem("plinius_last_deal", JSON.stringify({ id: deal.id, ts: Date.now() }));
    } catch {}
  };

  if (booting) {
    return (
      <div className="page-inv">
        <Navbar />
        <main className="inv-main">
          <div className="inv-skeleton">Cargando…</div>
        </main>
        <Footer />
      </div>
    );
  }

  // =========================
  // Gate: NOT logged in
  // =========================
  if (!user) {
    return (
      <div className="page-inv">
        <Navbar />

        <main className="inv-main">
          <section className="inv-gate">
            <div className="inv-gateCard">
              <div className="inv-badge-row">
                <div className="inv-partner-pill">
                  <img src={crowdlinkLogo} alt="Crowdlink" className="inv-partner-logo" />
                  <span>Plinius × Crowdlink</span>
                </div>
                <span className="inv-tag">Mercado privado · Inversionistas</span>
              </div>

              <h1>Acceso restringido</h1>
              <p className="inv-sub">
                Para ver oportunidades de inversión y tickets, necesitas iniciar sesión o crear tu cuenta.
              </p>

              <div className="inv-gateActions">
                <button className="inv-btn-primary" onClick={goLogin}>
                  Ingresar
                </button>
                <button className="inv-btn-ghost" onClick={goRegister}>
                  Crear cuenta
                </button>
              </div>

              <div className="inv-gateHint">
                Tip: si ya estás registrado, usa <strong>Ingresar</strong>.
              </div>
            </div>

            <aside className="inv-gateSide">
              <div className="inv-gateMini">
                <div className="inv-gateMiniTitle">¿Qué vas a ver al entrar?</div>
                <ul className="inv-gateList">
                  <li>· Tabla de tickets con tasa, plazo, garantías y rating.</li>
                  <li>· Filtros por sector, estructura, etapa y búsqueda.</li>
                  <li>· Botones para ver el ticket y solicitar inversión.</li>
                </ul>
              </div>
            </aside>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  // =========================
  // Logged-in market
  // =========================
  return (
    <div className="page-inv">
      <Navbar />

      <main className="inv-main">
        {/* Header */}
        <section className="inv-marketHead">
          <div className="inv-marketTitle">
            <div className="inv-badge-row">
              <div className="inv-partner-pill">
                <img src={crowdlinkLogo} alt="Crowdlink" className="inv-partner-logo" />
                <span>Mercado · Inversionistas</span>
              </div>
              <span className="inv-tag">Crédito privado · PYMEs MX</span>
            </div>

            <h1>Mercado de oportunidades</h1>
            <p className="inv-sub">
              Filtra y revisa tickets. Usa <strong>Ver</strong> para detalle, o <strong>Invertir</strong> para iniciar el flujo.
            </p>
          </div>

          <div className="inv-marketStats">
            <div className="inv-stat">
              <span className="s-l">Tickets</span>
              <span className="s-v">{stats.total}</span>
            </div>
            <div className="inv-stat">
              <span className="s-l">Abiertos</span>
              <span className="s-v">{stats.abiertos}</span>
            </div>
            <div className="inv-stat">
              <span className="s-l">En colocación</span>
              <span className="s-v">{stats.colocacion}</span>
            </div>
            <div className="inv-stat">
              <span className="s-l">Tasa prom.</span>
              <span className="s-v">{fmtPct(stats.avgTasa, 1)}</span>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="inv-filtersCard">
          <div className="inv-filtersGrid">
            <label className="inv-field">
              <span className="inv-fieldLabel">Buscar</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Empresa, sector, ciudad, garantía, rating…"
              />
            </label>

            <label className="inv-field">
              <span className="inv-fieldLabel">Etapa</span>
              <select value={fStage} onChange={(e) => setFStage(e.target.value)}>
                <option value="all">Todas</option>
                <option value="abierto">Abierto</option>
                <option value="coloc">En colocación</option>
                <option value="próximo">Próximo</option>
              </select>
            </label>

            <label className="inv-field">
              <span className="inv-fieldLabel">Sector</span>
              <select value={fSector} onChange={(e) => setFSector(e.target.value)}>
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s === "all" ? "Todos" : s}
                  </option>
                ))}
              </select>
            </label>

            <label className="inv-field">
              <span className="inv-fieldLabel">Estructura</span>
              <select value={fEstructura} onChange={(e) => setFEstructura(e.target.value)}>
                <option value="all">Todas</option>
                <option value="amort">Amortizable</option>
                <option value="bullet">Bullet</option>
              </select>
            </label>

            <label className="inv-field">
              <span className="inv-fieldLabel">Ordenar</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="score">Recomendado</option>
                <option value="tasa">Tasa (desc)</option>
                <option value="monto">Monto (desc)</option>
                <option value="plazo">Plazo (asc)</option>
              </select>
            </label>

            <div className="inv-field inv-fieldActions">
              <span className="inv-fieldLabel">Acción</span>
              <button className="inv-btn-primary" onClick={() => nav("/dashboard")}>
                Ir a Dashboard
              </button>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="inv-tableCard">
          <div className="inv-tableTop">
            <div className="inv-tableTitle">
              Tickets ({filtered.length})
              <span className="inv-tableHint">· Click en “Ver” para detalles</span>
            </div>
          </div>

          <div className="inv-tableWrap">
            <div className="inv-table">
              <div className="inv-tr inv-th">
                <div>ID</div>
                <div>Empresa</div>
                <div>Sector</div>
                <div>Monto</div>
                <div>Tasa</div>
                <div>Plazo</div>
                <div>DSCR</div>
                <div>LTV</div>
                <div>Rating</div>
                <div>Etapa</div>
                <div />
              </div>

              {filtered.map((d) => {
                const stage = String(d.stage || "").toLowerCase();
                const stageCls =
                  stage.includes("abierto") ? "stage open" : stage.includes("coloc") ? "stage placing" : "stage soon";

                const ltv = clamp(Number(d.ltv || 0), 0, 100);
                const dscr = Number(d.dscr || 0);

                return (
                  <div className="inv-tr" key={d.id}>
                    <div className="inv-id">{d.id}</div>
                    <div className="inv-main">
                      <div className="inv-emp">{d.empresa}</div>
                      <div className="inv-mini">{cleanText(d.garantia, 48)}</div>
                    </div>
                    <div>{d.sector}</div>
                    <div className="inv-num">{fmtMXN(d.monto)}</div>
                    <div className="inv-num strong">{fmtPct(d.tasa, 1)}</div>
                    <div className="inv-num">{d.plazo_meses}m</div>
                    <div className={`inv-num ${dscr >= 1.3 ? "ok" : dscr >= 1.15 ? "mid" : "bad"}`}>
                      {dscr.toFixed(2)}
                    </div>
                    <div className={`inv-num ${ltv <= 55 ? "ok" : ltv <= 65 ? "mid" : "bad"}`}>{ltv}%</div>
                    <div>
                      <span className="inv-pill rating">{d.rating}</span>
                    </div>
                    <div>
                      <span className={stageCls}>{d.stage}</span>
                    </div>
                    <div className="inv-actions">
                      <button className="inv-btn-mini" onClick={() => setOpenDeal(d)}>
                        Ver
                      </button>
                      <button className="inv-btn-mini ghost" onClick={() => nav("/dashboard")}>
                        Simular
                      </button>
                      <button className="inv-btn-mini primary" onClick={() => onInvest(d)}>
                        Invertir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Modal: Deal detail (MVP) */}
        {openDeal && (
          <div className="inv-modalBackdrop" role="dialog" aria-modal="true" onClick={() => setOpenDeal(null)}>
            <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
              <div className="inv-modalHead">
                <div>
                  <div className="inv-modalTitle">{openDeal.empresa}</div>
                  <div className="inv-modalSub">{openDeal.id} · {openDeal.sector} · {openDeal.ciudad}</div>
                </div>
                <button className="inv-x" onClick={() => setOpenDeal(null)} title="Cerrar">
                  ✕
                </button>
              </div>

              <div className="inv-modalGrid">
                <div className="inv-kv">
                  <span>Monto</span>
                  <strong>{fmtMXN(openDeal.monto)}</strong>
                </div>
                <div className="inv-kv">
                  <span>Tasa objetivo</span>
                  <strong>{fmtPct(openDeal.tasa, 1)}</strong>
                </div>
                <div className="inv-kv">
                  <span>Plazo</span>
                  <strong>{openDeal.plazo_meses} meses</strong>
                </div>
                <div className="inv-kv">
                  <span>Estructura</span>
                  <strong>{openDeal.estructura}</strong>
                </div>
                <div className="inv-kv">
                  <span>DSCR</span>
                  <strong>{Number(openDeal.dscr || 0).toFixed(2)}</strong>
                </div>
                <div className="inv-kv">
                  <span>LTV</span>
                  <strong>{Number(openDeal.ltv || 0)}%</strong>
                </div>
                <div className="inv-kv">
                  <span>Rating</span>
                  <strong>{openDeal.rating}</strong>
                </div>
                <div className="inv-kv">
                  <span>Ticket mínimo</span>
                  <strong>{fmtMXN(openDeal.min_ticket)}</strong>
                </div>
              </div>

              <div className="inv-modalNote">
                <div className="inv-modalNoteTitle">Garantías / Consideraciones</div>
                <div className="inv-modalNoteBody">{openDeal.garantia}</div>
              </div>

              <div className="inv-modalActions">
                <button className="inv-btn-ghost" onClick={() => setOpenDeal(null)}>
                  Cerrar
                </button>
                <button className="inv-btn-primary" onClick={() => onInvest(openDeal)}>
                  Invertir
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
