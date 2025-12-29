// src/pages/Dashboard.jsx
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

const cleanText = (s, max = 140) =>
  String(s ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const cleanRFC = (s) =>
  String(s ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9&Ñ]/g, "")
    .slice(0, 13);

const cleanPhone = (s) => String(s ?? "").replace(/[^\d+]/g, "").slice(0, 18);

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

/* =======================
   Component
======================= */
export default function Dashboard() {
  const nav = useNavigate();

  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);
  const user = session?.user;

  const [profile, setProfile] = useState(null);

  // ✅ ADMIN: por bandera en profiles o por email específico (fallback)
  const isAdmin = useMemo(() => {
    const email = String(profile?.email || user?.email || "").toLowerCase();
    return !!profile?.is_admin || email === "luis@plinius.mx";
  }, [profile?.is_admin, profile?.email, user?.email]);

  // Tabs
  const [tab, setTab] = useState("resumen"); // resumen | perfil | docs | tesoreria | inversiones

  // KPIs (solicitudes)
  const [mineSolicitudes, setMineSolicitudes] = useState([]);
  const pendingCount = useMemo(
    () => mineSolicitudes.filter((s) => s.status === "pendiente").length,
    [mineSolicitudes]
  );

  // Tesorería
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState([]);

  // Perfil editable
  const [edit, setEdit] = useState({
    empresa: "",
    rfc: "",
    telefono: "",
    puesto: "",
    industria: "",
    ciudad: "",
    estado: "",
    sitio_web: "",
    ventas_mensuales: "",
    ebitda_mensual: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Docs
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [docsMsg, setDocsMsg] = useState("");

  // Depósito intent (tesorería)
  const [depAmount, setDepAmount] = useState("");
  const [depRef, setDepRef] = useState("");
  const [depMsg, setDepMsg] = useState("");
  const [busyDep, setBusyDep] = useState(false);

  // =========================
  // INVERSIONES: estados
  // =========================
  const [invBalance, setInvBalance] = useState(0);
  const [invLedger, setInvLedger] = useState([]);
  const [myInvRequests, setMyInvRequests] = useState([]);

  // Form solicitud inversión
  const [invAmount, setInvAmount] = useState("");
  const [invRef, setInvRef] = useState("");
  const [invNote, setInvNote] = useState("");
  const [invMsg, setInvMsg] = useState("");
  const [busyInv, setBusyInv] = useState(false);

  // Admin: pendientes
  const [pendingInvRequests, setPendingInvRequests] = useState([]);
  const [adminInvMsg, setAdminInvMsg] = useState("");
  const [busyApprove, setBusyApprove] = useState(false);

  // KPIs inversiones (calculados desde ledger)
  const invSummary = useMemo(() => {
    let invested = 0; // invest - redeem
    let pnl = 0; // yield acumulado
    for (const r of invLedger) {
      const amt = Number(r.amount || 0);
      if (r.status !== "aplicado") continue;
      if (r.type === "invest") invested += amt;
      if (r.type === "redeem") invested -= amt;
      if (r.type === "yield") pnl += amt;
      if (r.type === "adjust") pnl += amt;
    }
    const yieldPct = invested > 0 ? (pnl / invested) * 100 : 0;
    return {
      invested: Math.max(0, invested),
      pnl,
      yieldPct,
      positions: 0, // MVP
    };
  }, [invLedger]);

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
    await supabase.auth.signOut();
    nav("/ingresar?registro=0");
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
      setEdit({
        empresa: data?.empresa || "",
        rfc: data?.rfc || "",
        telefono: data?.telefono || "",
        puesto: data?.puesto || "",
        industria: data?.industria || "",
        ciudad: data?.ciudad || "",
        estado: data?.estado || "",
        sitio_web: data?.sitio_web || "",
        ventas_mensuales: data?.ventas_mensuales ?? "",
        ebitda_mensual: data?.ebitda_mensual ?? "",
      });
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

    const { data, error } = await q;
    console.log("loadSolicitudes", { isAdmin, rows: data?.length, error });

    setMineSolicitudes(data || []);
  }, [user?.id, isAdmin]);

  useEffect(() => {
    if (!user?.id) return;
    loadSolicitudes();
  }, [user?.id, isAdmin, loadSolicitudes]);

  // =========================
  // Load treasury
  // =========================
  const loadTreasury = useCallback(async () => {
    if (!user?.id) return;

    const { data: balRows, error: balErr } = await supabase
      .from("v_treasury_balance")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (balErr) console.log("v_treasury_balance err", balErr);
    setBalance(Number(balRows?.balance || 0));

    const { data: ledRows, error: ledErr } = await supabase
      .from("treasury_ledger")
      .select("id,type,amount,status,reference,note,created_at,applied_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(120);

    if (ledErr) console.log("treasury_ledger err", ledErr);
    setLedger(ledRows || []);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    loadTreasury();
  }, [user?.id, loadTreasury]);

  // =========================
  // Save profile
  // =========================
  const saveProfile = async () => {
    if (!user?.id || savingProfile) return;

    setSavingProfile(true);
    setProfileMsg("");

    try {
      const payload = {
        empresa: cleanText(edit.empresa, 140) || null,
        rfc: cleanRFC(edit.rfc) || null,
        telefono: cleanPhone(edit.telefono) || null,
        puesto: cleanText(edit.puesto, 80) || null,
        industria: cleanText(edit.industria, 80) || null,
        ciudad: cleanText(edit.ciudad, 80) || null,
        estado: cleanText(edit.estado, 80) || null,
        sitio_web: cleanText(edit.sitio_web, 120) || null,
        ventas_mensuales:
          edit.ventas_mensuales === "" || edit.ventas_mensuales === null
            ? null
            : Number(edit.ventas_mensuales),
        ebitda_mensual:
          edit.ebitda_mensual === "" || edit.ebitda_mensual === null
            ? null
            : Number(edit.ebitda_mensual),
      };

      if (!Number.isFinite(payload.ventas_mensuales ?? 0)) payload.ventas_mensuales = null;
      if (!Number.isFinite(payload.ebitda_mensual ?? 0)) payload.ebitda_mensual = null;

      const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
      if (error) throw error;

      setProfileMsg("✅ Perfil actualizado");

      const { data } = await supabase
        .from("profiles")
        .select(
          "id,email,is_admin,nombres,apellido_paterno,apellido_materno,empresa,rfc,telefono,puesto,industria,ciudad,estado,sitio_web,ventas_mensuales,ebitda_mensual,created_at,updated_at"
        )
        .eq("id", user.id)
        .single();

      setProfile(data || null);
    } catch (e) {
      setProfileMsg(`Error: ${e?.message || "No se pudo guardar"}`);
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg(""), 3500);
    }
  };

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
  // Tesorería: depósito intent
  // =========================
  const createDepositIntent = async () => {
    if (!user?.id || busyDep) return;

    const amt = Number(depAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setDepMsg("Pon un monto válido.");
      return;
    }

    setBusyDep(true);
    setDepMsg("");

    try {
      const ref = cleanText(depRef, 80) || null;

      const { error } = await supabase.from("treasury_ledger").insert({
        user_id: user.id,
        type: "deposit_intent",
        amount: amt,
        status: "pendiente",
        reference: ref,
        note: "Registro de depósito (pendiente de conciliación)",
      });
      if (error) throw error;

      setDepMsg("✅ Depósito registrado. Queda pendiente de conciliación.");
      setDepAmount("");
      setDepRef("");
      await loadTreasury();
    } catch (e) {
      setDepMsg(`Error: ${e?.message || "No se pudo registrar"}`);
    } finally {
      setBusyDep(false);
      setTimeout(() => setDepMsg(""), 4500);
    }
  };

  // =========================
  // INVERSIONES: load + create request + approve/reject
  // Admin ve todo ledger y todas requests
  // =========================
  const loadInvestments = useCallback(async () => {
    if (!user?.id) return;

    // saldo (personal)
    const { data: balRow, error: balErr } = await supabase
      .from("v_invest_balance")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();
    if (balErr) console.log("v_invest_balance err", balErr);
    setInvBalance(Number(balRow?.balance || 0));

    // ledger
    let ledQ = supabase
      .from("investment_ledger")
      .select("id,type,amount,status,reference,note,created_at,applied_at,request_id,user_id")
      .order("created_at", { ascending: false })
      .limit(120);

    if (!isAdmin) ledQ = ledQ.eq("user_id", user.id);

    const { data: ledRows, error: ledErr } = await ledQ;
    console.log("loadInvestments ledger", { isAdmin, rows: ledRows?.length, ledErr });
    setInvLedger(ledRows || []);

    // requests (mías para user normal, todas para admin)
    let reqQ = supabase
      .from("investment_requests")
      .select("id,amount,status,reference,note,created_at,decided_at,decided_by,user_id")
      .order("created_at", { ascending: false })
      .limit(200);

    if (!isAdmin) reqQ = reqQ.eq("user_id", user.id);

    const { data: reqRows, error: reqErr } = await reqQ;
    console.log("loadInvestments requests", { isAdmin, rows: reqRows?.length, reqErr });
    setMyInvRequests(reqRows || []);

    // admin: pendientes globales (con join)
    if (isAdmin) {
      const { data: pendRows, error: pendErr } = await supabase
  .from("investment_requests")
  .select("id,user_id,amount,status,reference,note,created_at")
  .eq("status", "pendiente")
  .order("created_at", { ascending: true })
  .limit(200);

if (pendErr) console.log("pending requests err", pendErr);

      setPendingInvRequests(pendRows || []);
    } else {
      setPendingInvRequests([]);
    }
  }, [user?.id, isAdmin]);

  useEffect(() => {
    if (!user?.id) return;
    loadInvestments();
  }, [user?.id, isAdmin, loadInvestments]);

  const createInvestmentRequest = async () => {
    if (!user?.id || busyInv) return;

    const amt = Number(invAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setInvMsg("Pon un monto válido.");
      return;
    }

    setBusyInv(true);
    setInvMsg("");

    try {
      const ref = cleanText(invRef, 80) || null;
      const note = cleanText(invNote, 160) || "Solicitud de inversión";

      const { error } = await supabase.from("investment_requests").insert({
        user_id: user.id,
        amount: amt,
        currency: "MXN",
        reference: ref,
        note,
        status: "pendiente",
      });

      if (error) throw error;

      setInvMsg("✅ Solicitud enviada. Queda pendiente de aprobación.");
      setInvAmount("");
      setInvRef("");
      setInvNote("");
      await loadInvestments();
    } catch (e) {
      setInvMsg(`Error: ${e?.message || "No se pudo crear la solicitud"}`);
    } finally {
      setBusyInv(false);
      setTimeout(() => setInvMsg(""), 4500);
    }
  };

  const approveInvestment = async (requestId) => {
  if (!isAdmin || busyApprove) return;
  setBusyApprove(true);
  setAdminInvMsg("");

  try {
    // ✅ DEBUG: confirma sesión y UID
    const { data: s } = await supabase.auth.getSession();
    console.log("SESSION", {
      hasSession: !!s?.session,
      uid: s?.session?.user?.id,
      email: s?.session?.user?.email,
      isAdmin,
      requestId,
    });

    const { error } = await supabase.rpc("approve_investment_request", {
      p_request_id: requestId,
    });
    if (error) throw error;

    setAdminInvMsg("✅ Aprobado y aplicado a ledger.");
    await loadInvestments();
  } catch (e) {
    console.log("approveInvestment ERROR", e);
    setAdminInvMsg(
      `Error: ${e?.message || "No se pudo aprobar"}`
      + (e?.details ? ` | details: ${e.details}` : "")
      + (e?.hint ? ` | hint: ${e.hint}` : "")
      + (e?.code ? ` | code: ${e.code}` : "")
    );
  } finally {
    setBusyApprove(false);
    setTimeout(() => setAdminInvMsg(""), 4500);
  }
};


  const rejectInvestment = async (requestId) => {
    if (!isAdmin || busyApprove) return;

    // eslint-disable-next-line no-restricted-globals
    const reason = prompt("Motivo de rechazo (opcional):") || null;

    setBusyApprove(true);
    setAdminInvMsg("");

    try {
      const { error } = await supabase.rpc("reject_investment_request", {
        p_request_id: requestId,
        p_reason: reason,
      });
      if (error) throw error;

      setAdminInvMsg("✅ Rechazado.");
      await loadInvestments();
    } catch (e) {
      setAdminInvMsg(`Error: ${e?.message || "No se pudo rechazar"}`);
    } finally {
      setBusyApprove(false);
      setTimeout(() => setAdminInvMsg(""), 4500);
    }
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
                className={`dash-navItem ${tab === "perfil" ? "is-active" : ""}`}
                onClick={() => setTab("perfil")}
              >
                <span className="dash-navIcon">☺</span>
                <span className="dash-navLabel">Perfil</span>
                <span />
              </button>

              <button
                className={`dash-navItem ${tab === "docs" ? "is-active" : ""}`}
                onClick={() => setTab("docs")}
              >
                <span className="dash-navIcon">⧉</span>
                <span className="dash-navLabel">Documentos</span>
                <span />
              </button>

              <button
                className={`dash-navItem ${tab === "tesoreria" ? "is-active" : ""}`}
                onClick={() => setTab("tesoreria")}
              >
                <span className="dash-navIcon">$</span>
                <span className="dash-navLabel">Tesorería</span>
                <span />
              </button>

              <button
                className={`dash-navItem ${tab === "inversiones" ? "is-active" : ""}`}
                onClick={() => setTab("inversiones")}
              >
                <span className="dash-navIcon">⬈</span>
                <span className="dash-navLabel">Inversiones</span>
                <span className="dash-navMeta">
                  {myInvRequests.filter((r) => r.status === "pendiente").length}
                </span>
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

            {isAdmin && (
              <>
                <div className="dash-navDivider" />
                <div className="dash-navSection">
                  <div className="dash-navSectionTitle">Admin</div>

                  <button className="dash-navItem" onClick={() => setTab("inversiones")}>
                    <span className="dash-navIcon">✓</span>
                    <span className="dash-navLabel">Aprobar inversiones</span>
                    <span className="dash-navMeta">{pendingInvRequests.length}</span>
                  </button>
                </div>
              </>
            )}
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
                  {tab === "resumen"
                    ? "Resumen"
                    : tab === "perfil"
                    ? "Perfil"
                    : tab === "docs"
                    ? "Documentos"
                    : tab === "tesoreria"
                    ? "Tesorería"
                    : "Inversiones"}
                </h1>
                <p className="dash-sub">
                  {tab === "resumen"
                    ? "Tu actividad y estado general."
                    : tab === "perfil"
                    ? "Edita tu información (sin cambiar nombre/correo)."
                    : tab === "docs"
                    ? "Sube y administra tus documentos."
                    : tab === "tesoreria"
                    ? "Registra depósitos y consulta tu saldo (conciliación por Plinius)."
                    : isAdmin
                    ? "Aprobación de inversiones + portafolio global."
                    : "Solicita inversión y consulta tu portafolio."}
                </p>
              </div>

              <div className="dash-headRight">
                <div className="dash-headActions">
                  <button className="dash-btn dash-btnSoft" onClick={loadSolicitudes}>
                    Refresh
                  </button>
                  <button className="dash-btn dash-btnSoft" onClick={loadTreasury}>
                    Refresh tesorería
                  </button>
                  <button className="dash-btn dash-btnSoft" onClick={loadInvestments}>
                    Refresh inversiones
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
                <div className="dash-kpis">
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
                    <div className="dash-kpiLabel">Saldo tesorería</div>
                    <div className="dash-kpiValue">{pesos(balance)}</div>
                    <div className="dash-kpiSub">Aplicado</div>
                  </div>

                  <div className="dash-kpiCard">
                    <div className="dash-kpiLabel">Saldo inversión</div>
                    <div className="dash-kpiValue">{pesos(invBalance)}</div>
                    <div className="dash-kpiSub">Mi saldo</div>
                  </div>
                </div>

                <div className="dash-panel">
                  <div className="dash-panelTitleRow">
                    <div className="dash-panelTitle">Acciones rápidas</div>
                    <div className="dash-chip">MVP</div>
                  </div>

                  <ul className="dash-modList">
                    <li>Completa perfil (empresa/RFC/teléfono).</li>
                    <li>Sube documentos (edo cuenta / estados financieros).</li>
                    <li>Registra depósitos en Tesorería si aplica.</li>
                    <li>En Inversiones: solicita inversión y espera aprobación.</li>
                  </ul>

                  <div className="dash-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="dash-btn dash-btnPrimary" onClick={() => setTab("perfil")}>
                      Completar perfil
                    </button>
                    <button className="dash-btn dash-btnSoft" onClick={() => setTab("docs")}>
                      Subir docs
                    </button>
                    <button className="dash-btn dash-btnSoft" onClick={() => setTab("inversiones")}>
                      Ir a inversiones
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* PERFIL */}
            {tab === "perfil" && (
              <div className="dash-panel">
                <div className="dash-panelTitleRow">
                  <div className="dash-panelTitle">Información editable</div>
                  {profileMsg ? <div className="dash-miniNote">{profileMsg}</div> : null}
                </div>

                <div className="dash-formGrid">
                  <Field label="Nombre (no editable)">
                    <input value={`${profile?.nombres || ""} ${profile?.apellido_paterno || ""}`} disabled />
                  </Field>

                  <Field label="Correo (no editable)">
                    <input value={profile?.email || user?.email || ""} disabled />
                  </Field>

                  <Field label="Empresa">
                    <input
                      value={edit.empresa}
                      onChange={(e) => setEdit((s) => ({ ...s, empresa: e.target.value }))}
                      placeholder="Ej. Atlas Logística Integrada"
                    />
                  </Field>

                  <Field label="RFC">
                    <input
                      value={edit.rfc}
                      onChange={(e) => setEdit((s) => ({ ...s, rfc: cleanRFC(e.target.value) }))}
                      placeholder="Ej. ALA010203XX0"
                    />
                  </Field>

                  <Field label="Teléfono">
                    <input
                      value={edit.telefono}
                      onChange={(e) => setEdit((s) => ({ ...s, telefono: e.target.value }))}
                      onBlur={() => setEdit((s) => ({ ...s, telefono: cleanPhone(s.telefono) }))}
                      placeholder="55 1234 5678"
                    />
                  </Field>

                  <Field label="Puesto">
                    <input value={edit.puesto} onChange={(e) => setEdit((s) => ({ ...s, puesto: e.target.value }))} />
                  </Field>

                  <Field label="Industria">
                    <input
                      value={edit.industria}
                      onChange={(e) => setEdit((s) => ({ ...s, industria: e.target.value }))}
                    />
                  </Field>

                  <Field label="Ciudad">
                    <input value={edit.ciudad} onChange={(e) => setEdit((s) => ({ ...s, ciudad: e.target.value }))} />
                  </Field>

                  <Field label="Estado">
                    <input value={edit.estado} onChange={(e) => setEdit((s) => ({ ...s, estado: e.target.value }))} />
                  </Field>

                  <Field label="Sitio web">
                    <input
                      value={edit.sitio_web}
                      onChange={(e) => setEdit((s) => ({ ...s, sitio_web: e.target.value }))}
                      placeholder="https://"
                    />
                  </Field>

                  <Field label="Ventas mensuales (MXN)">
                    <input
                      inputMode="numeric"
                      value={String(edit.ventas_mensuales ?? "")}
                      onChange={(e) => setEdit((s) => ({ ...s, ventas_mensuales: e.target.value }))}
                      placeholder="Ej. 1800000"
                    />
                  </Field>

                  <Field label="EBITDA mensual (MXN)">
                    <input
                      inputMode="numeric"
                      value={String(edit.ebitda_mensual ?? "")}
                      onChange={(e) => setEdit((s) => ({ ...s, ebitda_mensual: e.target.value }))}
                      placeholder="Ej. 150000"
                    />
                  </Field>
                </div>

                <div className="dash-row" style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="dash-btn dash-btnPrimary" onClick={saveProfile} disabled={savingProfile}>
                    {savingProfile ? "Guardando…" : "Guardar perfil"}
                  </button>
                  <button className="dash-btn dash-btnSoft" onClick={() => nav("/solicitud")}>
                    Crear solicitud
                  </button>
                </div>
              </div>
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

            {/* TESORERIA */}
            {tab === "tesoreria" && (
              <>
                <div className="dash-panel">
                  <div className="dash-panelTitleRow">
                    <div className="dash-panelTitle">Saldo</div>
                    <div className="dash-chip">Conciliado</div>
                  </div>
                  <div className="dash-balance">{pesos(balance)}</div>
                  <div className="dash-sideHint">
                    El saldo muestra movimientos <strong>aplicados</strong>. Depósitos quedan <strong>pendientes</strong>{" "}
                    hasta conciliación.
                  </div>
                </div>

                <div className="dash-panel">
                  <div className="dash-panelTitleRow">
                    <div className="dash-panelTitle">Registrar depósito</div>
                    {depMsg ? <div className="dash-miniNote">{depMsg}</div> : null}
                  </div>

                  <div className="dash-formGrid" style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
                    <Field label="Monto (MXN)">
                      <input
                        inputMode="numeric"
                        value={depAmount}
                        onChange={(e) => setDepAmount(e.target.value)}
                        placeholder="Ej. 50000"
                      />
                    </Field>
                    <Field label="Referencia SPEI (opcional)">
                      <input value={depRef} onChange={(e) => setDepRef(e.target.value)} placeholder="Ej. 1234567890" />
                    </Field>
                  </div>

                  <div className="dash-row" style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="dash-btn dash-btnPrimary" onClick={createDepositIntent} disabled={busyDep}>
                      {busyDep ? "Registrando…" : "Registrar depósito"}
                    </button>
                    <button className="dash-btn dash-btnSoft" onClick={loadTreasury} disabled={busyDep}>
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="dash-panel">
                  <div className="dash-panelTitleRow">
                    <div className="dash-panelTitle">Movimientos</div>
                    <div className="dash-chip">{ledger.length}</div>
                  </div>

                  {ledger.length === 0 ? (
                    <div className="dash-empty" style={{ marginTop: 10 }}>
                      Sin movimientos aún.
                    </div>
                  ) : (
                    <div className="dash-list" style={{ marginTop: 10 }}>
                      {ledger.map((r) => (
                        <div key={r.id} className="dash-listRow">
                          <div>
                            <div className="dash-listMain">
                              <strong>{r.type === "deposit_intent" ? "Depósito" : "Ajuste"}</strong>{" "}
                              <span style={{ opacity: 0.9 }}>· {pesos(Number(r.amount || 0))}</span>
                              <span className={`dash-status ${r.status}`}>{r.status}</span>
                            </div>
                            <div className="dash-listSub">
                              {fmtDT(r.created_at)}
                              {r.reference ? ` · Ref: ${r.reference}` : ""}
                              {r.applied_at ? ` · Aplicado: ${fmtDT(r.applied_at)}` : ""}
                            </div>
                          </div>

                          <div className="dash-listRight">
                            <button className="dash-btn dash-btnSoft" onClick={() => {}}>
                              Ver
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* INVERSIONES */}
            {tab === "inversiones" && (
              <>
                <div className="dash-kpis">
                  <div className="dash-kpiCard">
                    <div className="dash-kpiLabel">Saldo inversión</div>
                    <div className="dash-kpiValue">{pesos(invBalance)}</div>
                    <div className="dash-kpiSub">Mi saldo</div>
                  </div>

                  <div className="dash-kpiCard">
                    <div className="dash-kpiLabel">Invertido</div>
                    <div className="dash-kpiValue">{pesos(invSummary.invested)}</div>
                    <div className="dash-kpiSub">Neto</div>
                  </div>

                  <div className="dash-kpiCard">
                    <div className="dash-kpiLabel">Rendimiento</div>
                    <div className="dash-kpiValue">{pesos(invSummary.pnl)}</div>
                    <div className="dash-kpiSub">Yield + ajustes</div>
                  </div>

                  <div className="dash-kpiCard">
                    <div className="dash-kpiLabel">Yield %</div>
                    <div className="dash-kpiValue">{invSummary.yieldPct.toFixed(2)}%</div>
                    <div className="dash-kpiSub">Estimado</div>
                  </div>
                </div>

                {/* Usuario: Solicitar inversión */}
                {!isAdmin && (
                  <div className="dash-panel">
                    <div className="dash-panelTitleRow">
                      <div className="dash-panelTitle">Solicitar inversión</div>
                      {invMsg ? (
                        <div className="dash-miniNote">{invMsg}</div>
                      ) : (
                        <div className="dash-chip">Pendiente aprobación</div>
                      )}
                    </div>

                    <div className="dash-formGrid" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
                      <Field label="Monto (MXN)">
                        <input
                          inputMode="numeric"
                          value={invAmount}
                          onChange={(e) => setInvAmount(e.target.value)}
                          placeholder="Ej. 250000"
                        />
                      </Field>

                      <Field label="Referencia SPEI / folio (opcional)">
                        <input value={invRef} onChange={(e) => setInvRef(e.target.value)} placeholder="Ej. 1234567890" />
                      </Field>

                      <Field label="Nota (opcional)">
                        <input value={invNote} onChange={(e) => setInvNote(e.target.value)} placeholder="Ej. Aporte diciembre" />
                      </Field>
                    </div>

                    <div className="dash-row" style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button className="dash-btn dash-btnPrimary" onClick={createInvestmentRequest} disabled={busyInv}>
                        {busyInv ? "Enviando…" : "Enviar solicitud"}
                      </button>
                      <button className="dash-btn dash-btnSoft" onClick={loadInvestments} disabled={busyInv}>
                        Refresh
                      </button>
                    </div>
                  </div>
                )}

                {/* Admin: Aprobar inversiones */}
                {isAdmin && (
                  <div className="dash-panel dash-adminPanel">
                    <div className="dash-panelTitleRow">
                      <div className="dash-panelTitle">Aprobación de inversiones</div>
                      {adminInvMsg ? <div className="dash-miniNote">{adminInvMsg}</div> : <div className="dash-chip">Pendientes</div>}
                    </div>

                    {pendingInvRequests.length === 0 ? (
                      <div className="dash-empty">No hay solicitudes pendientes.</div>
                    ) : (
                      <div className="dash-list" style={{ marginTop: 10 }}>
                        {pendingInvRequests.map((r) => {
                          const p = r.profiles || {};
                          const who =
                            (p?.empresa || "").trim() ||
                            `${(p?.nombres || "").trim()} ${(p?.apellido_paterno || "").trim()}`.trim() ||
                            (p?.email || "").trim() ||
                            r.user_id;

                          return (
                            <div key={r.id} className="dash-listRow">
                              <div>
                                <div className="dash-listMain">
                                  <strong>{who}</strong>{" "}
                                  <span style={{ opacity: 0.9 }}>· {pesos(Number(r.amount || 0))}</span>
                                  <span className="dash-status pendiente">pendiente</span>
                                </div>
                                <div className="dash-listSub">
                                  {fmtDT(r.created_at)}
                                  {r.reference ? ` · Ref: ${r.reference}` : ""}
                                  {r.note ? ` · ${r.note}` : ""}
                                </div>
                              </div>

                              <div className="dash-listRight" style={{ gap: 8 }}>
                                <button
                                  className="dash-btn dash-btnPrimary"
                                  onClick={() => approveInvestment(r.id)}
                                  disabled={busyApprove}
                                  title="Aprueba y aplica al ledger"
                                >
                                  Aprobar
                                </button>
                                <button
                                  className="dash-btn dash-btnGhost"
                                  onClick={() => rejectInvestment(r.id)}
                                  disabled={busyApprove}
                                >
                                  Rechazar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Requests */}
                <div className="dash-panel">
                  <div className="dash-panelTitleRow">
                    <div className="dash-panelTitle">{isAdmin ? "Solicitudes (global)" : "Mis solicitudes"}</div>
                    <div className="dash-chip">{myInvRequests.length}</div>
                  </div>

                  {myInvRequests.length === 0 ? (
                    <div className="dash-empty">Aún no hay solicitudes.</div>
                  ) : (
                    <div className="dash-list" style={{ marginTop: 10 }}>
                      {myInvRequests.map((r) => (
                        <div key={r.id} className="dash-listRow">
                          <div>
                            <div className="dash-listMain">
                              <strong>Solicitud</strong>{" "}
                              <span style={{ opacity: 0.9 }}>· {pesos(Number(r.amount || 0))}</span>
                              <span className={`dash-status ${r.status}`}>{r.status}</span>
                            </div>
                            <div className="dash-listSub">
                              {fmtDT(r.created_at)}
                              {r.reference ? ` · Ref: ${r.reference}` : ""}
                              {r.decided_at ? ` · Decidido: ${fmtDT(r.decided_at)}` : ""}
                            </div>
                          </div>

                          <div className="dash-listRight">
                            <button className="dash-btn dash-btnSoft" onClick={() => {}}>
                              Ver
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ledger */}
                <div className="dash-panel">
                  <div className="dash-panelTitleRow">
                    <div className="dash-panelTitle">{isAdmin ? "Movimientos (global)" : "Movimientos de inversión"}</div>
                    <div className="dash-chip">{invLedger.length}</div>
                  </div>

                  {invLedger.length === 0 ? (
                    <div className="dash-empty">Sin movimientos aún.</div>
                  ) : (
                    <div className="dash-list" style={{ marginTop: 10 }}>
                      {invLedger.map((r) => (
                        <div key={r.id} className="dash-listRow">
                          <div>
                            <div className="dash-listMain">
                              <strong>
                                {r.type === "invest"
                                  ? "Inversión"
                                  : r.type === "redeem"
                                  ? "Retiro"
                                  : r.type === "yield"
                                  ? "Rendimiento"
                                  : "Ajuste"}
                              </strong>{" "}
                              <span style={{ opacity: 0.9 }}>· {pesos(Number(r.amount || 0))}</span>
                              <span className={`dash-status ${r.status}`}>{r.status}</span>
                            </div>
                            <div className="dash-listSub">
                              {fmtDT(r.created_at)}
                              {r.reference ? ` · Ref: ${r.reference}` : ""}
                              {r.applied_at ? ` · Aplicado: ${fmtDT(r.applied_at)}` : ""}
                            </div>
                          </div>

                          <div className="dash-listRight">
                            <button className="dash-btn dash-btnSoft" onClick={() => {}}>
                              Ver
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="dash-field">
      <span className="dash-fieldLabel">{label}</span>
      <div className="dash-fieldInput">{children}</div>
    </label>
  );
}
