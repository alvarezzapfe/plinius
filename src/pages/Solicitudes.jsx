// src/pages/Solicitudes.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "../assets/css/dashboard.css";

/* =======================
   Helpers
======================= */
const pesos = (x) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(x) ? x : 0);

const fmtDT = (d) => (d ? new Date(d).toLocaleString("es-MX") : "—");

function statusPillClass(status) {
  if (status === "aprobada") return "dash-btn dash-btnPrimary";
  if (status === "rechazada") return "dash-btn dash-btnGhost";
  return "dash-btn dash-btnSoft";
}

const TAB_BTN = (active) => ({
  height: 36,
  padding: "0 14px",
  borderRadius: 999,
  fontWeight: 900,
  border: active
    ? "1px solid rgba(34,197,94,0.55)"
    : "1px solid rgba(148,163,184,0.55)",
  background: active ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)",
  color: "rgba(226,232,240,0.95)",
  cursor: "pointer",
});

const INPUT_STYLE = {
  height: 36,
  padding: "0 12px",
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,0.55)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(226,232,240,0.95)",
  outline: "none",
};

/* =======================
   Data hydration (profiles)
======================= */
async function hydrateProfilesForSolicitudes(rows) {
  // rows: [{ user_id, ... }]
  if (!rows || rows.length === 0) return rows;

  const ids = Array.from(
    new Set(rows.map((r) => r.user_id).filter(Boolean))
  );

  if (ids.length === 0) return rows;

  const { data: profs, error: perr } = await supabase
    .from("profiles")
    .select("id,email,nombres,apellido_paterno,is_admin,created_at")
    .in("id", ids)
    .limit(1000);

  if (perr) {
    // Si RLS no deja leer perfiles por admin o hay issues, regresamos filas sin perfiles
    return rows.map((r) => ({ ...r, profile: null }));
  }

  const map = new Map((profs || []).map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, profile: map.get(r.user_id) || null }));
}

export default function Solicitudes() {
  const nav = useNavigate();

  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);

  const [profileRow, setProfileRow] = useState(null);
  const isAdmin = !!profileRow?.is_admin;

  const [tab, setTab] = useState("mine"); // mine | all | users
  const [mine, setMine] = useState([]);
  const [all, setAll] = useState([]);
  const [users, setUsers] = useState([]);

  const [selected, setSelected] = useState(null);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const user = session?.user;

  /* =======================
     Auth boot
  ======================= */
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data?.session || null);
      setBooting(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => {
      setSession(s || null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!booting && !session) nav("/ingresar?registro=0");
  }, [booting, session, nav]);

  /* =======================
     Load my profile (is_admin)
  ======================= */
  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      setErrMsg("");
      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,is_admin,nombres,apellido_paterno,created_at")
        .eq("id", user.id)
        .maybeSingle(); // <- no revienta si no existe

      if (error) {
        setProfileRow(null);
        setErrMsg(`No pude leer tu perfil (profiles). ${error.message}`);
        return;
      }

      // Si por alguna razón no existe profile, lo dejamos null sin romper UX
      setProfileRow(data || null);
    })();
  }, [user?.id]);

  // Si no es admin, asegúrate de no quedarte en tabs admin
  useEffect(() => {
    if (!isAdmin && (tab === "all" || tab === "users")) setTab("mine");
  }, [isAdmin, tab]);

  /* =======================
     Stats / limits
  ======================= */
  const pendingCount = useMemo(
    () => (mine || []).filter((x) => x.status === "pendiente").length,
    [mine]
  );
  const canCreate = pendingCount < 2;

  const mineStats = useMemo(() => {
    const p = mine.filter((x) => x.status === "pendiente").length;
    const a = mine.filter((x) => x.status === "aprobada").length;
    const r = mine.filter((x) => x.status === "rechazada").length;
    return { p, a, r };
  }, [mine]);

  const adminStats = useMemo(() => {
    const p = all.filter((x) => x.status === "pendiente").length;
    const a = all.filter((x) => x.status === "aprobada").length;
    const r = all.filter((x) => x.status === "rechazada").length;
    return { p, a, r };
  }, [all]);

  /* =======================
     Loaders
  ======================= */
  const loadMine = useCallback(async () => {
    if (!user?.id) return;
    setErrMsg("");

    const { data, error } = await supabase
      .from("solicitudes")
      .select("id,status,created_at,decided_at,admin_note,payload")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      setErrMsg(`Error cargando mis solicitudes: ${error.message}`);
      return;
    }
    setMine(data || []);
  }, [user?.id]);

  const loadAll = useCallback(async () => {
    setErrMsg("");

    const { data, error } = await supabase
      .from("solicitudes")
      .select("id,user_id,status,created_at,decided_at,admin_note,payload")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      setErrMsg(`Error cargando todas (admin): ${error.message}`);
      return;
    }

    const hydrated = await hydrateProfilesForSolicitudes(data || []);
    setAll(hydrated);
  }, []);

  const loadUsers = useCallback(async () => {
    setErrMsg("");

    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,nombres,apellido_paterno,is_admin,created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      setErrMsg(`Error cargando usuarios (admin): ${error.message}`);
      return;
    }
    setUsers(data || []);
  }, []);

  // First load mine
  useEffect(() => {
    if (!user?.id) return;
    loadMine();
  }, [user?.id, loadMine]);

  // Admin loads
  useEffect(() => {
    if (!isAdmin) return;
    loadAll();
    loadUsers();
  }, [isAdmin, loadAll, loadUsers]);

  /* =======================
     Filters
  ======================= */
  const filteredAll = useMemo(() => {
    let rows = all || [];
    if (statusFilter !== "all") rows = rows.filter((r) => r.status === statusFilter);

    const qq = q.trim().toLowerCase();
    if (qq) {
      rows = rows.filter((r) => {
        const em = (r.profile?.email || "").toLowerCase();
        const st = (r.status || "").toLowerCase();
        const emp = (r.payload?.contacto?.empresa || "").toLowerCase();
        return em.includes(qq) || st.includes(qq) || emp.includes(qq);
      });
    }
    return rows;
  }, [all, q, statusFilter]);

  /* =======================
     Open detail
  ======================= */
  const openRow = async (row) => {
    setErrMsg("");
    setSelected(null);

    const { data, error } = await supabase
      .from("solicitudes")
      .select("id,user_id,status,created_at,decided_at,admin_note,payload")
      .eq("id", row.id)
      .maybeSingle();

    if (error || !data) {
      // fallback: lo que tengas
      setSelected(row);
      if (error) setErrMsg(`No pude cargar detalle completo: ${error.message}`);
      return;
    }

    // hidrata profile para el detalle si eres admin
    let profile = row.profile || null;
    if (!profile && data.user_id) {
      const { data: p2 } = await supabase
        .from("profiles")
        .select("id,email,nombres,apellido_paterno")
        .eq("id", data.user_id)
        .maybeSingle();
      profile = p2 || null;
    }

    setSelected({ ...data, profile });
  };

  /* =======================
     Admin decision
  ======================= */
  const decide = async (id, nextStatus) => {
    if (!isAdmin) return;

    setBusy(true);
    setErrMsg("");

    const note =
      nextStatus === "aprobada"
        ? "Aprobada en revisión preliminar"
        : "Rechazada en revisión preliminar";

    const decidedAt = new Date().toISOString();

    const { error } = await supabase
      .from("solicitudes")
      .update({ status: nextStatus, admin_note: note, decided_at: decidedAt })
      .eq("id", id);

    if (error) {
      setBusy(false);
      setErrMsg(error.message);
      return;
    }

    await loadMine();
    await loadAll();

    setSelected((s) =>
      s?.id === id
        ? { ...s, status: nextStatus, admin_note: note, decided_at: decidedAt }
        : s
    );

    setBusy(false);
  };

  /* =======================
     Sign out
  ======================= */
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      nav("/ingresar?registro=0");
    }
  };

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
            <div className="dash-badge">Plinius · Solicitudes</div>
            <button className="dash-iconBtn" onClick={signOut} title="Cerrar sesión">
              ⎋
            </button>
          </div>

          <div className="dash-panel" style={{ marginTop: 0 }}>
            <div className="dash-panelTitle">Acciones</div>
            <div className="dash-row" style={{ display: "grid", gap: 10 }}>
              <button className="dash-btn dash-btnSoft w100" onClick={() => nav("/dashboard")}>
                Volver al Dashboard
              </button>

              <button className="dash-btn dash-btnSoft w100" onClick={() => nav("/")}>
                Inicio
              </button>

              <button
                className="dash-btn dash-btnPrimary w100"
                onClick={() => nav("/solicitud")}
                disabled={!canCreate}
                title={!canCreate ? "Tienes 2 solicitudes pendientes" : "Crear solicitud"}
              >
                Nueva solicitud
              </button>

              {!canCreate && (
                <div className="dash-sideHint">
                  Límite: <strong>2 pendientes</strong>. Espera respuesta.
                </div>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="dash-panel">
              <div className="dash-panelTitle">Admin</div>
              <div className="dash-sideHint">
                Ves <strong>todos los usuarios</strong> y <strong>todas las solicitudes</strong>.
              </div>
              <div className="dash-sideHint" style={{ marginTop: 6 }}>
                Totales: Pend <strong>{adminStats.p}</strong> · Apr <strong>{adminStats.a}</strong> · Rech{" "}
                <strong>{adminStats.r}</strong>
              </div>
            </div>
          )}
        </aside>

        {/* Main */}
        <section className="dash-main">
          <header className="dash-head">
            <div>
              <h1 className="dash-h1">Solicitudes</h1>
              <p className="dash-sub">
                {isAdmin ? "Modo admin: revisión y decisión." : "Aquí ves tus solicitudes y su estatus."}
              </p>
            </div>

            <div className="dash-headActions">
              <button
                className="dash-btn dash-btnSoft"
                onClick={async () => {
                  setBusy(true);
                  try {
                    await loadMine();
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
              >
                {busy ? "Actualizando…" : "Refresh"}
              </button>

              {isAdmin && (
                <button
                  className="dash-btn dash-btnSoft"
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await loadAll();
                      await loadUsers();
                    } finally {
                      setBusy(false);
                    }
                  }}
                  disabled={busy}
                >
                  {busy ? "Actualizando…" : "Refresh admin"}
                </button>
              )}
            </div>
          </header>

          {errMsg && <div className="dash-miniNote">{errMsg}</div>}

          {/* Tabs */}
          <div className="dash-panel">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={TAB_BTN(tab === "mine")} onClick={() => setTab("mine")}>
                Mis solicitudes ({mine.length})
              </button>

              {isAdmin && (
                <>
                  <button style={TAB_BTN(tab === "all")} onClick={() => setTab("all")}>
                    Todas ({all.length})
                  </button>
                  <button style={TAB_BTN(tab === "users")} onClick={() => setTab("users")}>
                    Usuarios ({users.length})
                  </button>
                </>
              )}
            </div>

            {tab === "mine" && (
              <div style={{ marginTop: 12 }}>
                <div className="dash-miniNote">
                  Pendientes: <strong>{mineStats.p}</strong> · Aprobadas: <strong>{mineStats.a}</strong> · Rechazadas:{" "}
                  <strong>{mineStats.r}</strong>
                </div>

                <List rows={mine} onOpen={openRow} isAdmin={false} />
              </div>
            )}

            {tab === "all" && isAdmin && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar: email, empresa o status…"
                    style={INPUT_STYLE}
                  />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={INPUT_STYLE}>
                    <option value="all">Todas</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="aprobada">Aprobadas</option>
                    <option value="rechazada">Rechazadas</option>
                  </select>
                </div>

                <div className="dash-miniNote" style={{ marginTop: 8 }}>
                  Resultados: <strong>{filteredAll.length}</strong>
                </div>

                <List rows={filteredAll} onOpen={openRow} isAdmin />
              </div>
            )}

            {tab === "users" && isAdmin && (
              <div style={{ marginTop: 12 }}>
                {users.length === 0 ? (
                  <div className="dash-empty">No hay usuarios (o tu RLS no deja ver).</div>
                ) : (
                  <div className="dash-list">
                    {users.map((u) => (
                      <div key={u.id} className="dash-listRow">
                        <div>
                          <div className="dash-listMain">
                            <strong>{u.email}</strong>
                            {u.is_admin ? <span style={{ marginLeft: 8, fontWeight: 950 }}>★ ADMIN</span> : null}
                          </div>
                          <div className="dash-listSub">
                            {u.nombres || "—"} {u.apellido_paterno || ""} · Alta: {fmtDT(u.created_at)}
                          </div>
                        </div>
                        <div className="dash-listRight" style={{ display: "flex", gap: 10 }}>
                          <button
                            className="dash-btn dash-btnSoft"
                            onClick={() => {
                              setTab("all");
                              setQ(u.email || "");
                            }}
                          >
                            Ver solicitudes
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Detalle */}
          {selected && (
            <div className="dash-panel">
              <div className="dash-panelTitle">Detalle</div>

              <div className="dash-miniNote">
                Status: <strong>{selected.status}</strong> · Creada: <strong>{fmtDT(selected.created_at)}</strong>
                {selected.decided_at ? ` · Decidida: ${fmtDT(selected.decided_at)}` : ""}
                {selected.admin_note ? ` · Nota: ${selected.admin_note}` : ""}
              </div>

              {(selected.profile?.email || selected.profiles?.email) && (
                <div className="dash-miniNote">
                  Usuario: <strong>{selected.profile?.email || selected.profiles?.email}</strong>
                </div>
              )}

              <div className="dash-profileGrid" style={{ marginTop: 10 }}>
                <Mini label="Empresa" value={selected.payload?.contacto?.empresa || "—"} />
                <Mini label="Producto" value={selected.payload?.producto || "—"} />
                <Mini label="Monto" value={pesos(Number(selected.payload?.monto || 0))} />
                <Mini label="Plazo" value={`${selected.payload?.plazo || "—"} meses`} />
                <Mini label="Tasa" value={`${selected.payload?.tasaEstimada ?? "—"}%`} />
                <Mini label="Pago" value={pesos(Number(selected.payload?.pago || 0))} />
                <Mini label="DSCR" value={`${Number(selected.payload?.dscr || 0).toFixed(2)}x`} />
                <Mini label="Uso" value={(selected.payload?.objetivo?.uso || []).join(", ") || "—"} />
              </div>

              {isAdmin && (
                <div className="dash-row" style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    className="dash-btn dash-btnPrimary"
                    onClick={() => decide(selected.id, "aprobada")}
                    disabled={busy}
                  >
                    {busy ? "Procesando…" : "Aprobar"}
                  </button>
                  <button
                    className="dash-btn dash-btnGhost"
                    onClick={() => decide(selected.id, "rechazada")}
                    disabled={busy}
                  >
                    {busy ? "Procesando…" : "Rechazar"}
                  </button>
                </div>
              )}

              <div className="dash-row" style={{ marginTop: 12 }}>
                <button className="dash-btn dash-btnSoft" onClick={() => setSelected(null)} disabled={busy}>
                  Cerrar detalle
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function List({ rows, onOpen, isAdmin }) {
  if (!rows || rows.length === 0) return <div className="dash-empty">Sin registros.</div>;

  return (
    <div className="dash-list" style={{ marginTop: 10 }}>
      {rows.map((s) => (
        <div key={s.id} className="dash-listRow">
          <div>
            <div className="dash-listMain">
              {isAdmin ? (
                <>
                  <strong>{s.profile?.email || s.profiles?.email || "—"}</strong>{" "}
                  <span style={{ opacity: 0.9 }}>· {s.payload?.contacto?.empresa || "—"}</span>
                  <span style={{ opacity: 0.85 }}> · {s.status}</span>
                </>
              ) : (
                <>
                  <strong>{s.status}</strong>{" "}
                  <span style={{ opacity: 0.85 }}>· {s.payload?.contacto?.empresa || "—"}</span>
                </>
              )}
            </div>
            <div className="dash-listSub">
              {fmtDT(s.created_at)}
              {s.admin_note ? ` · ${s.admin_note}` : ""}
            </div>
          </div>

          <div className="dash-listRight" style={{ display: "flex", gap: 10 }}>
            <button className={statusPillClass(s.status)} onClick={() => onOpen(s)}>
              Ver
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="dash-info">
      <div className="dash-infoLabel">{label}</div>
      <div className="dash-infoValue">{String(value ?? "—")}</div>
    </div>
  );
}
