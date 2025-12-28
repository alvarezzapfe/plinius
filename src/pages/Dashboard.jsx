// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "../assets/css/dashboard.css";

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

export default function Dashboard() {
  const nav = useNavigate();

  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);
  const user = session?.user;

  const [profile, setProfile] = useState(null);
  const isAdmin = !!profile?.is_admin;

  // ✅ agrega inversiones como tab interno
  const [tab, setTab] = useState("resumen"); // resumen | perfil | docs | tesoreria | inversiones

  // KPIs (solicitudes del usuario)
  const [mineSolicitudes, setMineSolicitudes] = useState([]);
  const pendingCount = useMemo(
    () => mineSolicitudes.filter((s) => s.status === "pendiente").length,
    [mineSolicitudes]
  );

  // Tesorería
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState([]);

  // ✅ Inversiones (MVP placeholder -> luego lo conectamos a Supabase)
  const [invSummary, setInvSummary] = useState({
    invested: 0,
    pnl: 0,
    yieldPct: 0,
    positions: 0,
  });
  const [invMovs, setInvMovs] = useState([]);

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

  // Depósito intent
  const [depAmount, setDepAmount] = useState("");
  const [depRef, setDepRef] = useState("");
  const [depMsg, setDepMsg] = useState("");
  const [busyDep, setBusyDep] = useState(false);

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

  const signOut = async () => {
    await supabase.auth.signOut();
    nav("/ingresar?registro=0");
  };

  // Load profile
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

  // Load solicitudes KPI
  const loadMineSolicitudes = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("solicitudes")
      .select("id,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(250);
    setMineSolicitudes(data || []);
  };

  useEffect(() => {
    if (!user?.id) return;
    loadMineSolicitudes();
  }, [user?.id]);

  // Load treasury
  const loadTreasury = async () => {
    if (!user?.id) return;

    const { data: balRows } = await supabase
      .from("v_treasury_balance")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();
    setBalance(Number(balRows?.balance || 0));

    const { data: ledRows } = await supabase
      .from("treasury_ledger")
      .select("id,type,amount,status,reference,note,created_at,applied_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(120);
    setLedger(ledRows || []);
  };

  useEffect(() => {
    if (!user?.id) return;
    loadTreasury();
  }, [user?.id]);

  // ✅ Load investments (MVP placeholder)
  // Luego lo conectamos a Supabase (inversiones / posiciones / movimientos)
  const loadInvestments = async () => {
    if (!user?.id) return;

    // Placeholder: por ahora en 0 para no romper UI.
    setInvSummary({
      invested: 0,
      pnl: 0,
      yieldPct: 0,
      positions: 0,
    });
    setInvMovs([]);
  };

  useEffect(() => {
    if (!user?.id) return;
    loadInvestments();
  }, [user?.id]);

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

  // Docs
  const listDocs = async () => {
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
  };

  useEffect(() => {
    if (!user?.id) return;
    listDocs();
  }, [user?.id]);

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

  // Deposito intent
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
          {/* Brand row */}
          <div className="dash-brandRow">
            <div className="dash-badge">Plinius · Panel</div>

            {/* ✅ Sign out mini (sidebar top right) */}
            <button className="dash-iconBtn" onClick={signOut} title="Cerrar sesión">
              ⎋
            </button>
          </div>

          {/* Home quick icon */}
          <div className="dash-quickRow">
            <button className="dash-quickIcon" onClick={() => nav("/")} title="Inicio">
              ⌂
            </button>
            <div className="dash-quickHint">Inicio</div>
          </div>

          {/* Profile mini */}
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

          {/* NAV SECTIONS */}
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

              {/* ✅ NUEVO: Inversiones (tab interno) */}
              <button
                className={`dash-navItem ${tab === "inversiones" ? "is-active" : ""}`}
                onClick={() => setTab("inversiones")}
                title="Portafolio"
              >
                <span className="dash-navIcon">⬈</span>
                <span className="dash-navLabel">Inversiones</span>
                <span className="dash-navMeta">MVP</span>
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

              {/* ⚠️ Nota: si no existe /creditos como ruta lista, esto 404.
                  Lo dejo tal cual porque me pediste no quitar nada. */}
              <button className="dash-navItem" onClick={() => nav("/creditos")}>
                <span className="dash-navIcon">▦</span>
                <span className="dash-navLabel">Créditos</span>
                <span />
              </button>
            </div>

            {/* ✅ NUEVO: header separado "Inversiones" (como Crédito) */}
            <div className="dash-navDivider" />

            <div className="dash-navSection">
              <div className="dash-navSectionTitle">Inversiones</div>

              <button
                className={`dash-navItem ${tab === "inversiones" ? "is-active" : ""}`}
                onClick={() => setTab("inversiones")}
              >
                <span className="dash-navIcon">⬈</span>
                <span className="dash-navLabel">Portafolio</span>
                <span className="dash-navMeta">MVP</span>
              </button>

              <button className="dash-navItem" onClick={() => nav("/inversionistas")} title="Landing Inversionistas">
                <span className="dash-navIcon">✦</span>
                <span className="dash-navLabel">Inversionistas</span>
                <span />
              </button>
            </div>
          </div>

          {/* Footer actions */}
          <div className="dash-sideFoot">
            <div className="dash-sideHint">
              Pendientes: <strong>{pendingCount}</strong> (límite 2)
            </div>

            <div className="dash-sideActions">
              <button className="dash-btn dash-btnSoft w100" onClick={() => nav("/solicitudes")}>
                Ver solicitudes
              </button>
              <button className="dash-btn dash-btnPrimary w100" onClick={() => nav("/solicitud")}>
                Nueva solicitud
              </button>

              {/* ✅ Sign out grande (sidebar) */}
              <button className="dash-btn dash-btnGhost w100" onClick={signOut}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <section className="dash-main">
          <div className="dash-mainInner">
            {/* ✅ Header geométrico */}
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
                    : "Portafolio, rendimientos y movimientos (MVP)."}
                </p>
              </div>

              <div className="dash-headRight">
                <div className="dash-headActions">
                  <button className="dash-btn dash-btnSoft" onClick={loadMineSolicitudes}>
                    Refresh
                  </button>
                  <button className="dash-btn dash-btnSoft" onClick={loadTreasury}>
                    Refresh tesorería
                  </button>
                  <button className="dash-btn dash-btnSoft" onClick={loadInvestments}>
                    Refresh inversiones
                  </button>
                </div>

                {/* ✅ Sign out extremo derecha superior */}
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
                    <div className="dash-kpiLabel">Estatus</div>
                    <div className="dash-kpiValue">{pendingCount >= 2 ? "En cola" : "Activo"}</div>
                    <div className="dash-kpiSub">Operación</div>
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
                    <li>Si usarás tesorería, registra un depósito con referencia.</li>
                    <li>Explora Inversiones (próximamente: posiciones y rendimientos).</li>
                  </ul>

                  <div className="dash-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="dash-btn dash-btnPrimary" onClick={() => setTab("perfil")}>
                      Completar perfil
                    </button>
                    <button className="dash-btn dash-btnSoft" onClick={() => setTab("docs")}>
                      Subir docs
                    </button>
                    <button className="dash-btn dash-btnSoft" onClick={() => nav("/solicitudes")}>
                      Ver solicitudes
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

                  <div className="dash-divider" />

                  <div className="dash-panelTitle">Instrucciones SPEI (Ve por Más)</div>
                  <ol className="dash-modList">
                    <li>En tu banca, elige <strong>Transferencia SPEI</strong>.</li>
                    <li>
                      Beneficiario: <strong>Infraestructura en Finanzas AI, S.A.P.I. de C.V.</strong>
                    </li>
                    <li>
                      Banco destino: <strong>Ve por Más (Bx+)</strong>
                    </li>
                    <li>
                      CLABE: <strong>[PEGA_TU_CLABE_AQUI]</strong>
                    </li>
                    <li>
                      Concepto sugerido:{" "}
                      <strong>PLINIUS TESORERIA · {profile?.email || user?.email || "tu_email"}</strong>
                    </li>
                    <li>Luego registra el depósito aquí (monto + referencia).</li>
                  </ol>
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

            {/* ✅ INVERSIONES */}
            {tab === "inversiones" && (
              <>
                <div className="dash-kpis">
                  <div className="dash-kpiCard">
                    <div className="dash-kpiLabel">Invertido</div>
                    <div className="dash-kpiValue">{pesos(invSummary.invested)}</div>
                    <div className="dash-kpiSub">Capital en posiciones</div>
                  </div>

                  <div className="dash-kpiCard">
                    <div className="dash-kpiLabel">Rendimiento</div>
                    <div className="dash-kpiValue">{pesos(invSummary.pnl)}</div>
                    <div className="dash-kpiSub">Acumulado</div>
                  </div>

                  <div className="dash-kpiCard">
                    <div className="dash-kpiLabel">Yield</div>
                    <div className="dash-kpiValue">{Number(invSummary.yieldPct || 0).toFixed(2)}%</div>
                    <div className="dash-kpiSub">Estimado</div>
                  </div>

                  <div className="dash-kpiCard">
                    <div className="dash-kpiLabel">Posiciones</div>
                    <div className="dash-kpiValue">{invSummary.positions}</div>
                    <div className="dash-kpiSub">Activas</div>
                  </div>
                </div>

                <div className="dash-panel">
                  <div className="dash-panelTitleRow">
                    <div className="dash-panelTitle">Portafolio (MVP)</div>
                    <div className="dash-chip">Próximamente</div>
                  </div>

                  <ul className="dash-modList">
                    <li>Posiciones por crédito / pool.</li>
                    <li>Intereses devengados y pagados.</li>
                    <li>Movimientos: aportes, retiros, intereses.</li>
                  </ul>

                  <div className="dash-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="dash-btn dash-btnPrimary" onClick={() => nav("/inversionistas")}>
                      Ver landing Inversionistas
                    </button>
                    <button className="dash-btn dash-btnSoft" onClick={loadInvestments}>
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="dash-panel">
                  <div className="dash-panelTitleRow">
                    <div className="dash-panelTitle">Movimientos de inversión</div>
                    <div className="dash-chip">{invMovs.length}</div>
                  </div>

                  {invMovs.length === 0 ? (
                    <div className="dash-empty" style={{ marginTop: 10 }}>
                      Aún no hay movimientos de inversión.
                    </div>
                  ) : (
                    <div className="dash-list" style={{ marginTop: 10 }}>
                      {invMovs.map((m) => (
                        <div key={m.id} className="dash-listRow">
                          <div>
                            <div className="dash-listMain">
                              <strong>{m.type || "Movimiento"}</strong>{" "}
                              <span style={{ opacity: 0.9 }}>· {pesos(Number(m.amount || 0))}</span>
                              {m.status ? <span className={`dash-status ${m.status}`}>{m.status}</span> : null}
                            </div>
                            <div className="dash-listSub">
                              {fmtDT(m.created_at)}
                              {m.reference ? ` · Ref: ${m.reference}` : ""}
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
