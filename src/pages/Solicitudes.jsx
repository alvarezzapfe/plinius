// src/pages/Solicitudes.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "../assets/css/dashboard.css"; // reutilizamos tu estilo base del dashboard

/* =======================
   Helpers
======================= */
const fmtDT = (d) => (d ? new Date(d).toLocaleString("es-MX") : "—");

const pill = (status = "") => {
  const s = String(status || "").toLowerCase();
  if (s.includes("pend")) return { cls: "dash-status pendiente", label: "pendiente" };
  if (s.includes("aprob")) return { cls: "dash-status aplicado", label: "aprobada" };
  if (s.includes("rech")) return { cls: "dash-status rechazado", label: "rechazada" };
  if (s.includes("rev")) return { cls: "dash-status pendiente", label: "en revisión" };
  return { cls: "dash-status", label: status || "—" };
};

const cleanText = (s, max = 120) =>
  String(s ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

function safeJson(obj) {
  if (!obj) return {};
  if (typeof obj === "object") return obj;
  try {
    return JSON.parse(obj);
  } catch {
    return {};
  }
}

/**
 * Trata de sacar campos comunes de tu payload del wizard.
 * Ajusta keys si tu wizard usa otros nombres.
 */
function deriveFromPayload(payloadRaw) {
  const p = safeJson(payloadRaw);

  // nombres “probables” (wizard)
  const empresa =
    p.empresa ||
    p.nombre_empresa ||
    p.razon_social ||
    p.empresa_nombre ||
    p.company ||
    p?.general?.empresa ||
    p?.general?.razon_social ||
    "";

  const producto = p.producto || p.tipo_credito || p?.credito?.producto || p?.costo?.producto || "";

  const monto =
    p.monto ||
    p.monto_solicitado ||
    p.montoSolicitado ||
    p?.credito?.monto ||
    p?.costo?.monto ||
    p?.financiera?.monto ||
    null;

  const plazo =
    p.plazo ||
    p.plazo_meses ||
    p.plazoMeses ||
    p?.credito?.plazo_meses ||
    p?.costo?.plazo_meses ||
    null;

  const tasa =
    p.tasa ||
    p.tasa_anual ||
    p.tasaAnual ||
    p?.credito?.tasa_anual ||
    p?.costo?.tasa_anual ||
    null;

  return {
    empresa: cleanText(empresa, 64) || "—",
    producto: cleanText(producto, 48) || "—",
    monto: monto === null ? "—" : String(monto),
    plazo: plazo === null ? "—" : String(plazo),
    tasa: tasa === null ? "—" : String(tasa),
  };
}

export default function Solicitudes() {
  const nav = useNavigate();

  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);
  const user = session?.user;

  const [profile, setProfile] = useState(null);
  const isAdmin = !!profile?.is_admin;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("all"); // all | pendiente | aprobada | rechazada

  // Boot session
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

  useEffect(() => {
    if (!booting && !session) nav("/ingresar?registro=0");
  }, [booting, session, nav]);

  // Load profile (para saber si es admin)
  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,email,is_admin,nombres,apellido_paterno,empresa,created_at")
        .eq("id", user.id)
        .single();

      setProfile(data || null);
    })();
  }, [user?.id]);

  const load = async () => {
    if (!user?.id) return;

    setLoading(true);
    setErr("");

    try {
      /**
       * Si NO eres admin: solo tus solicitudes
       * Si eres admin: todas (ojo: RLS debe permitirlo)
       */
      let query = supabase
        .from("solicitudes")
        .select("id,user_id,status,created_at,payload")
        .order("created_at", { ascending: false })
        .limit(250);

      if (!isAdmin) query = query.eq("user_id", user.id);

      const { data, error } = await query;

      if (error) throw error;

      const mapped = (data || []).map((r) => {
        const d = deriveFromPayload(r.payload);
        return {
          ...r,
          _empresa: d.empresa,
          _producto: d.producto,
          _monto: d.monto,
          _plazo: d.plazo,
          _tasa: d.tasa,
        };
      });

      setRows(mapped);
    } catch (e) {
      setErr(e?.message || "No pude cargar solicitudes.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    // esperamos a profile para saber si admin
    // pero si tarda, igual jalamos y luego recargamos
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAdmin]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return (rows || [])
      .filter((r) => {
        if (fStatus === "all") return true;
        const s = String(r.status || "").toLowerCase();
        if (fStatus === "pendiente") return s.includes("pend");
        if (fStatus === "aprobada") return s.includes("aprob") || s.includes("aplic");
        if (fStatus === "rechazada") return s.includes("rech");
        return true;
      })
      .filter((r) => {
        if (!needle) return true;
        const blob = `${r.id} ${r.status} ${r._empresa} ${r._producto}`.toLowerCase();
        return blob.includes(needle);
      });
  }, [rows, q, fStatus]);

  const counts = useMemo(() => {
    const all = rows.length;
    const pend = rows.filter((r) => String(r.status || "").toLowerCase().includes("pend")).length;
    const aprob = rows.filter((r) => String(r.status || "").toLowerCase().includes("aprob")).length;
    const rech = rows.filter((r) => String(r.status || "").toLowerCase().includes("rech")).length;
    return { all, pend, aprob, rech };
  }, [rows]);

  if (booting) {
    return (
      <div className="dash">
        <div className="dash-bg" aria-hidden />
        <div className="dash-grid" aria-hidden />
        <div className="dash-shell">
          <div className="dash-loading">Cargando…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash">
      <div className="dash-bg" aria-hidden />
      <div className="dash-grid" aria-hidden />

      <div className="dash-shell">
        {/* Sidebar mini (reuso estilo) */}
        <aside className="dash-side">
          <div className="dash-brandRow">
            <div className="dash-badge">Plinius · Crédito</div>
            <button className="dash-iconBtn" onClick={() => nav("/dashboard")} title="Regresar al dashboard">
              ←
            </button>
          </div>

          <div className="dash-profileCard">
            <div className="dash-avatar">
              {(profile?.nombres?.[0] || "P").toUpperCase()}
              {(profile?.apellido_paterno?.[0] || "").toUpperCase()}
            </div>
            <div>
              <div className="dash-profileName">
                {(profile?.nombres || "Usuario") + " " + (profile?.apellido_paterno || "")}
              </div>
              <div className="dash-profileEmail">{profile?.email || user?.email || "—"}</div>
              {isAdmin && <div className="dash-adminPill">ADMIN</div>}
            </div>
          </div>

          <div className="dash-nav">
            <div className="dash-navSection">
              <div className="dash-navSectionTitle">Crédito</div>

              <button className="dash-navItem is-active">
                <span className="dash-navIcon">↻</span>
                <span className="dash-navLabel">Solicitudes</span>
                <span className="dash-navMeta">{rows.length}</span>
              </button>

              <button className="dash-navItem" onClick={() => nav("/solicitud")} title="Nueva solicitud">
                <span className="dash-navIcon">＋</span>
                <span className="dash-navLabel">Nueva</span>
                <span />
              </button>

              <button className="dash-navItem" onClick={() => nav("/")} title="Inicio">
                <span className="dash-navIcon">⌂</span>
                <span className="dash-navLabel">Inicio</span>
                <span />
              </button>
            </div>
          </div>

          <div className="dash-sideFoot">
            <div className="dash-sideHint">
              Tip: abre una solicitud y adjunta Edo. cuenta para acelerar análisis.
            </div>

            <div className="dash-sideActions">
              <button className="dash-btn dash-btnPrimary w100" onClick={() => nav("/solicitud")}>
                Nueva solicitud
              </button>
              <button className="dash-btn dash-btnSoft w100" onClick={load} disabled={loading}>
                {loading ? "Cargando…" : "Refresh"}
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <section className="dash-main">
          <div className="dash-mainInner">
            <header className="dash-head">
              <div className="dash-headLeft">
                <h1 className="dash-h1">Solicitudes</h1>
                <p className="dash-sub">
                  Lista ordenada (tabla). El botón <strong>Ver</strong> abre la nueva pantalla pro del detalle.
                </p>
              </div>

              <div className="dash-headRight">
                <div className="dash-headActions">
                  <button className="dash-btn dash-btnSoft" onClick={() => nav("/solicitud")}>
                    + Nueva
                  </button>
                  <button className="dash-btn dash-btnSoft" onClick={load} disabled={loading}>
                    {loading ? "…" : "Refresh"}
                  </button>
                </div>
              </div>
            </header>

            {/* filtros */}
            <div className="dash-panel">
              <div className="dash-panelTitleRow">
                <div className="dash-panelTitle">Filtros</div>
                <div className="dash-chip">
                  {counts.all} total · {counts.pend} pendientes
                </div>
              </div>

              <div className="dash-formGrid" style={{ gridTemplateColumns: "2fr 1fr 1fr" }}>
                <label className="dash-field">
                  <span className="dash-fieldLabel">Buscar</span>
                  <div className="dash-fieldInput">
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Empresa, producto, status, id…"
                    />
                  </div>
                </label>

                <label className="dash-field">
                  <span className="dash-fieldLabel">Estatus</span>
                  <div className="dash-fieldInput">
                    <select value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
                      <option value="all">Todas</option>
                      <option value="pendiente">Pendientes</option>
                      <option value="aprobada">Aprobadas</option>
                      <option value="rechazada">Rechazadas</option>
                    </select>
                  </div>
                </label>

                <div className="dash-field">
                  <span className="dash-fieldLabel">Acción</span>
                  <div className="dash-fieldInput" style={{ display: "grid", placeItems: "center" }}>
                    <button className="dash-btn dash-btnPrimary" onClick={() => nav("/solicitud")}>
                      Crear solicitud
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* tabla */}
            <div className="dash-panel">
              <div className="dash-panelTitleRow">
                <div className="dash-panelTitle">Listado</div>
                <div className="dash-chip">{filtered.length}</div>
              </div>

              {err ? (
                <div className="dash-empty">Error: {err}</div>
              ) : loading ? (
                <div className="dash-empty">Cargando solicitudes…</div>
              ) : filtered.length === 0 ? (
                <div className="dash-empty">
                  No hay solicitudes con esos filtros. <Link to="/solicitud">Crea una</Link>.
                </div>
              ) : (
                <div className="sol-tableWrap">
                  <div className="sol-table">
                    <div className="sol-tr sol-th">
                      <div>ID</div>
                      <div>Empresa</div>
                      <div>Producto</div>
                      <div>Monto</div>
                      <div>Plazo</div>
                      <div>Tasa</div>
                      <div>Estatus</div>
                      <div>Creada</div>
                      <div />
                    </div>

                    {filtered.map((r) => {
                      const p = pill(r.status);
                      return (
                        <div className="sol-tr" key={r.id}>
                          <div className="sol-id">{String(r.id).slice(0, 8)}…</div>
                          <div className="sol-main">{r._empresa}</div>
                          <div className="sol-sub">{r._producto}</div>
                          <div className="sol-num">{r._monto}</div>
                          <div className="sol-num">{r._plazo}</div>
                          <div className="sol-num">{r._tasa}</div>
                          <div>
                            <span className={p.cls}>{p.label}</span>
                          </div>
                          <div className="sol-date">{fmtDT(r.created_at)}</div>
                          <div className="sol-actions">
                            {/* ✅ RUTA NUEVA PRO */}
                            <button
                              className="dash-btn dash-btnSoft"
                              onClick={() => nav(`/solicitudes/${encodeURIComponent(String(r.id))}`)}
                              title="Ver detalle pro"
                            >
                              Ver
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* nota */}
            <div className="dash-sideHint" style={{ marginTop: 10 }}>
              Próximo paso: ruta <code>/solicitudes/:id</code> con pantalla pro (sidebar fijo + detalle + stats).
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
