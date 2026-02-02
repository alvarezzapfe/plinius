// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "../assets/css/dashboard.css";
import Finanzas360 from "../components/Finanzas360";



/* =======================
   Helpers
======================= */
const ADMIN_EMAIL_FALLBACK = "luis@plinius.mx";

const fmtDT = (d) => (d ? new Date(d).toLocaleString("es-MX") : "—");

function initialsFromProfile(p) {
  const a = (p?.nombres || "").trim();
  const b = (p?.apellido_paterno || "").trim();
  const c = `${a} ${b}`.trim();
  if (!c) return "P";
  return c
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

const copyText = async (txt) => {
  try {
    await navigator.clipboard.writeText(String(txt || ""));
    return true;
  } catch {
    try {
      const t = document.createElement("textarea");
      t.value = String(txt || "");
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      document.body.removeChild(t);
      return true;
    } catch {
      return false;
    }
  }
};

const lastNYears = (n = 3) => {
  const now = new Date();
  const y = now.getFullYear();
  // “últimos 3 años cerrados”: y-1, y-2, y-3
  return Array.from({ length: n }, (_, i) => y - 1 - i);
};

/* =======================
   Component
======================= */
export default function Dashboard() {
  const nav = useNavigate();

  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);
  const user = session?.user;

  const [profile, setProfile] = useState(null);

  // ✅ ADMIN: bandera en profiles o email fallback
  const isAdmin = useMemo(() => {
    const email = String(profile?.email || user?.email || "").toLowerCase();
    return !!profile?.is_admin || email === ADMIN_EMAIL_FALLBACK;
  }, [profile?.is_admin, profile?.email, user?.email]);

  // Tabs
  const [tab, setTab] = useState("resumen"); // resumen | fin360 | docs | tesoreria

  // KPIs (solicitudes)
  const [mineSolicitudes, setMineSolicitudes] = useState([]);
  const pendingCount = useMemo(
    () => mineSolicitudes.filter((s) => s.status === "pendiente").length,
    [mineSolicitudes]
  );

  // Docs
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [docsMsg, setDocsMsg] = useState("");

  // Finanzas 360 (solo “contexto”)
  const years = useMemo(() => lastNYears(3), []);
  const finKey = useMemo(() => (user?.id ? `plinius_fin360_${user.id}` : "plinius_fin360_anon"), [user?.id]);

  // =========================
  // Boot session
  // =========================
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

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (e) {
      console.log("signOut error", e);
    } finally {
      nav("/ingresar?registro=0", { replace: true });
      setTimeout(() => {
        if (window.location.pathname !== "/ingresar") {
          window.location.href = "/ingresar?registro=0";
        }
      }, 50);
    }
  };

  // =========================
  // Load profile
  // =========================
  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id,email,is_admin,nombres,apellido_paterno,apellido_materno,empresa,rfc,telefono,puesto,industria,ciudad,estado,sitio_web,ventas_mensuales,ebitda_mensual,created_at,updated_at"
        )
        .eq("id", user.id)
        .single();

      if (error) {
        setProfile(null);
        return;
      }
      setProfile(data || null);
    })();
  }, [user?.id]);

  // =========================
  // Load solicitudes (admin ve todas; user ve suyas)
  // =========================
  const loadSolicitudes = useCallback(async () => {
    if (!user?.id) return;

    let q = supabase
      .from("solicitudes")
      .select("id,status,created_at,user_id")
      .order("created_at", { ascending: false })
      .limit(250);

    if (!isAdmin) q = q.eq("user_id", user.id);

    const { data } = await q;
    setMineSolicitudes(data || []);
  }, [user?.id, isAdmin]);

  useEffect(() => {
    if (!user?.id) return;
    loadSolicitudes();
  }, [user?.id, isAdmin, loadSolicitudes]);

  // =========================
  // Docs
  // =========================
  const listDocs = useCallback(async () => {
    if (!user?.id) return;
    setDocsMsg("");

    const { data, error } = await supabase.storage.from("user_docs").list(`${user.id}`, {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });

    if (error) {
      setDocs([]);
      setDocsMsg(`No pude listar docs: ${error.message}`);
      return;
    }
    setDocs(data || []);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    listDocs();
  }, [user?.id, listDocs]);

  const uploadDoc = async (file) => {
    if (!user?.id || !file) return;

    setUploading(true);
    setDocsMsg("");

    try {
      const safeName = `${Date.now()}_${file.name}`.replace(/[^\w.\-]+/g, "_");
      const path = `${user.id}/${safeName}`;

      const { error } = await supabase.storage.from("user_docs").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;

      setDocsMsg("✅ Archivo subido");
      await listDocs();
    } catch (e) {
      setDocsMsg(`Error subiendo: ${e?.message || "falló"}`);
    } finally {
      setUploading(false);
      setTimeout(() => setDocsMsg(""), 3500);
    }
  };

  const downloadDoc = async (name) => {
    if (!user?.id || !name) return;
    const path = `${user.id}/${name}`;

    const { data, error } = await supabase.storage.from("user_docs").download(path);
    if (error) {
      setDocsMsg(`No pude descargar: ${error.message}`);
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteDoc = async (name) => {
    if (!user?.id || !name) return;
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("¿Eliminar este archivo?")) return;

    setDocsMsg("");
    const path = `${user.id}/${name}`;
    const { error } = await supabase.storage.from("user_docs").remove([path]);
    if (error) {
      setDocsMsg(`No pude eliminar: ${error.message}`);
      return;
    }

    setDocsMsg("✅ Eliminado");
    await listDocs();
    setTimeout(() => setDocsMsg(""), 3500);
  };

  // =========================
  // UI loading
  // =========================
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
        {/* Sidebar */}
        <aside className="dash-side">
          <div className="dash-brandRow">
            <div className="dash-badge">Plinius · Panel</div>
            <button className="dash-iconBtn" onClick={signOut} title="Cerrar sesión">
              ⎋
            </button>
          </div>

          <div className="dash-quickRow">
            <button className="dash-quickIcon" onClick={() => nav("/")} title="Inicio">
              ⌂
            </button>
            <div className="dash-quickHint">Inicio</div>
          </div>

          <div className="dash-profileCard">
            <div className="dash-avatar">{initialsFromProfile(profile)}</div>
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
              <div className="dash-navSectionTitle">Panel</div>

              <button
                className={`dash-navItem ${tab === "resumen" ? "is-active" : ""}`}
                onClick={() => setTab("resumen")}
              >
                <span className="dash-navIcon">◎</span>
                <span className="dash-navLabel">Resumen</span>
                <span />
              </button>

              <button
                className={`dash-navItem ${tab === "fin360" ? "is-active" : ""}`}
                onClick={() => setTab("fin360")}
              >
                <span className="dash-navIcon">◍</span>
                <span className="dash-navLabel">Finanzas 360</span>
                <span className="dash-navMeta">3Y</span>
              </button>

              <button className={`dash-navItem ${tab === "docs" ? "is-active" : ""}`} onClick={() => setTab("docs")}>
                <span className="dash-navIcon">⧉</span>
                <span className="dash-navLabel">Documentos</span>
                <span className="dash-navMeta">{docs.length}</span>
              </button>

              <button
                className={`dash-navItem ${tab === "tesoreria" ? "is-active" : ""}`}
                onClick={() => setTab("tesoreria")}
              >
                <span className="dash-navIcon">$</span>
                <span className="dash-navLabel">Tesorería</span>
                <span className="dash-navMeta">SPEI</span>
              </button>
            </div>

            <div className="dash-navDivider" />

            <div className="dash-navSection">
              <div className="dash-navSectionTitle">Crédito</div>

              <button className="dash-navItem" onClick={() => nav("/solicitudes")}>
                <span className="dash-navIcon">↻</span>
                <span className="dash-navLabel">Solicitudes</span>
                <span className="dash-navMeta">{mineSolicitudes.length}</span>
              </button>

              <button className="dash-navItem" onClick={() => nav("/solicitud")} title="Nueva solicitud">
                <span className="dash-navIcon">＋</span>
                <span className="dash-navLabel">Nueva</span>
                <span className="dash-navMeta">{pendingCount}/2</span>
              </button>

              <button className="dash-navItem" onClick={() => nav("/creditos")}>
                <span className="dash-navIcon">▦</span>
                <span className="dash-navLabel">Créditos</span>
                <span />
              </button>
            </div>
          </div>

          <div className="dash-sideFoot">
            <div className="dash-sideHint">
              Pendientes crédito: <strong>{pendingCount}</strong> (límite 2)
            </div>

            <div className="dash-sideActions">
              <button className="dash-btn dash-btnSoft w100" onClick={() => nav("/solicitudes")}>
                Ver solicitudes
              </button>
              <button className="dash-btn dash-btnPrimary w100" onClick={() => nav("/solicitud")}>
                Nueva solicitud
              </button>
              <button className="dash-btn dash-btnGhost w100" onClick={signOut}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <section className="dash-main">
          <div className="dash-mainInner">
            <header className="dash-head">
              <div className="dash-headLeft">
                <h1 className="dash-h1">
                  {tab === "resumen" ? "Resumen" : tab === "fin360" ? "Finanzas 360" : tab === "docs" ? "Documentos" : "Tesorería"}
                </h1>
                <p className="dash-sub">
                  {tab === "resumen"
                    ? "Tu actividad y estado general."
                    : tab === "fin360"
                    ? "Captura estados financieros 3 años, valida consistencia y genera insights."
                    : tab === "docs"
                    ? "Sube y administra tus documentos."
                    : "Estamos construyendo SPEI IN/OUT para tesorerías empresariales."}
                </p>
              </div>

              <div className="dash-headRight">
                <div className="dash-headActions">
                  <button className="dash-btn dash-btnSoft" onClick={loadSolicitudes}>
                    Refresh
                  </button>
                </div>

                <button className="dash-topSignout" onClick={signOut} title="Cerrar sesión">
                  ⎋ <span>Cerrar sesión</span>
                </button>
              </div>
            </header>

            {/* RESUMEN */}
            {tab === "resumen" && (
              <>
                <div className="dash-kpis dash-kpis3">
                  <div className="dash-kpiCard">
                    <div className="dash-kpiLabel">Solicitudes</div>
                    <div className="dash-kpiValue">{mineSolicitudes.length}</div>
                    <div className="dash-kpiSub">Últimas 250</div>
                  </div>

                  <div className="dash-kpiCard">
                    <div className="dash-kpiLabel">Pendientes</div>
                    <div className="dash-kpiValue">{pendingCount}</div>
                    <div className="dash-kpiSub">Límite 2</div>
                  </div>

                  <div className="dash-kpiCard">
                    <div className="dash-kpiLabel">Finanzas 360</div>
                    <div className="dash-kpiValue">{years.length}Y</div>
                    <div className="dash-kpiSub">Input + insights</div>
                  </div>
                </div>

                <div className="dash-panel">
                  <div className="dash-panelTitleRow">
                    <div className="dash-panelTitle">Acciones rápidas</div>
                    <div className="dash-chip">MVP</div>
                  </div>

                  <ul className="dash-modList">
                    <li>Captura tu estado de resultados y balance de los últimos 3 años.</li>
                    <li>Valida consistencia (checks automáticos).</li>
                    <li>Simula niveles de deuda y observa el impacto en métricas.</li>
                    <li>Sube documentos para soporte (edo. cuenta / estados financieros).</li>
                  </ul>

                  <div className="dash-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="dash-btn dash-btnPrimary" onClick={() => setTab("fin360")}>
                      Abrir Finanzas 360
                    </button>
                    <button className="dash-btn dash-btnSoft" onClick={() => setTab("docs")}>
                      Subir docs
                    </button>
                    <button className="dash-btn dash-btnSoft" onClick={() => nav("/solicitudes")}>
                      Ver solicitudes
                    </button>
                    <button className="dash-btn dash-btnSoft" onClick={() => setTab("tesoreria")}>
                      Ver Tesorería
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* FINANZAS 360 (ahora en componente) */}
            {tab === "fin360" && (
              <Finanzas360
                user={user}
                years={years}
                finKey={finKey}
              />
            )}

            {/* DOCS */}
            {tab === "docs" && (
              <div className="dash-panel">
                <div className="dash-panelTitleRow">
                  <div className="dash-panelTitle">Documentos</div>
                  {docsMsg ? <div className="dash-miniNote">{docsMsg}</div> : null}
                </div>

                <div className="dash-row" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <label className="dash-fileBtn">
                    {uploading ? "Subiendo…" : "Subir archivo"}
                    <input
                      type="file"
                      className="dash-fileInput"
                      onChange={(e) => uploadDoc(e.target.files?.[0])}
                      disabled={uploading}
                    />
                  </label>

                  <button className="dash-btn dash-btnSoft" onClick={listDocs} disabled={uploading}>
                    Refresh
                  </button>

                  <div className="dash-sideHint">
                    Tip: sube <strong>Edo. cuenta</strong> / <strong>Estados financieros</strong> / <strong>CFDI</strong>.
                  </div>
                </div>

                {docs.length === 0 ? (
                  <div className="dash-empty" style={{ marginTop: 12 }}>
                    Sin documentos aún.
                  </div>
                ) : (
                  <div className="dash-list" style={{ marginTop: 12 }}>
                    {docs.map((f) => (
                      <div key={f.name} className="dash-listRow">
                        <div>
                          <div className="dash-listMain">
                            <strong>{f.name}</strong>
                          </div>
                          <div className="dash-listSub">
                            {f.updated_at ? `Actualizado: ${fmtDT(f.updated_at)}` : ""}
                            {typeof f.metadata?.size === "number" ? ` · ${(f.metadata.size / 1024).toFixed(0)} KB` : ""}
                          </div>
                        </div>

                        <div className="dash-listRight" style={{ display: "flex", gap: 10 }}>
                          <button className="dash-btn dash-btnSoft" onClick={() => downloadDoc(f.name)}>
                            Descargar
                          </button>
                          <button className="dash-btn dash-btnGhost" onClick={() => deleteDoc(f.name)}>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TESORERIA (EN CONSTRUCCIÓN) */}
            {tab === "tesoreria" && (
              <div className="dash-panel">
                <div className="dash-panelTitleRow">
                  <div className="dash-panelTitle">Tesorería empresarial</div>
                  <div className="dash-chip">En construcción</div>
                </div>

                <div className="build-hero">
                  <div className="build-badge">
                    <span className="build-dot" /> BUILD MODE
                  </div>

                  <h2 className="build-title">SPEI IN / SPEI OUT</h2>
                  <p className="build-sub">
                    Estamos a nada de habilitar <strong>cuentas SPEI</strong> para administrar tesorerías de empresas:
                    fondeo, pagos, conciliación automática y control.
                  </p>

                  <div className="build-grid">
                    <div className="build-card">
                      <div className="build-cardTitle">Muy pronto</div>
                      <ul className="build-list">
                        <li>CLABE dedicada por empresa</li>
                        <li>Webhooks y conciliación automática</li>
                        <li>Pagos SPEI (out) con controles</li>
                        <li>Estados y reportes descargables</li>
                      </ul>
                    </div>

                    <div className="build-card">
                      <div className="build-cardTitle">¿Te avisamos?</div>
                      <div className="build-kpi">
                        <span>Contacto</span>
                        <strong>{profile?.email || user?.email || "—"}</strong>
                      </div>
                      <div className="build-actions">
                        <button
                          className="dash-btn dash-btnPrimary"
                          onClick={async () => {
                            const ok = await copyText(profile?.email || user?.email || "");
                            // reutiliza el hint visual del dashboard
                            alert(ok ? "✅ Correo copiado. Te avisamos." : "No se pudo copiar.");
                          }}
                        >
                          Copiar correo
                        </button>
                        <button className="dash-btn dash-btnSoft" onClick={() => setTab("fin360")}>
                          Mientras: Finanzas 360
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>
      </div>
    </div>
  );
}
