// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "../assets/css/dashboard.css";

/* =======================
   Helpers
======================= */
const ADMIN_EMAIL_FALLBACK = "luis@plinius.mx";

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

// ===== Helpers extra SPEI/STP =====
const maskClabe = (clabe = "") => {
  const s = String(clabe || "").replace(/\s+/g, "");
  if (!s) return "—";
  if (s.length < 8) return s;
  const parts = [];
  for (let i = 0; i < s.length; i += 4) parts.push(s.slice(i, i + 4));
  return parts.join(" ").trim();
};

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

// Referencia numérica SPEI (7 dígitos)
const makeNumericRef7 = (seed = "") => {
  const s = String(seed || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 10_000_000).toString().padStart(7, "0");
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

  // Tabs (sin inversiones)
  const [tab, setTab] = useState("resumen"); // resumen | perfil | docs | tesoreria

  // KPIs (solicitudes)
  const [mineSolicitudes, setMineSolicitudes] = useState([]);
  const pendingCount = useMemo(
    () => mineSolicitudes.filter((s) => s.status === "pendiente").length,
    [mineSolicitudes]
  );

  // Tesorería
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState([]);
  const [treasuryOk, setTreasuryOk] = useState(true);

  // Tesorería: cuenta SPEI (STP)
  const [treasuryAccount, setTreasuryAccount] = useState(null);
  const [acctMsg, setAcctMsg] = useState("");
  const [busyAcct, setBusyAcct] = useState(false);

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

    setTreasuryOk(true);

    // 0) Cuenta SPEI (STP)
    const { data: acctRow, error: acctErr } = await supabase
      .from("treasury_accounts")
      .select("bank_name,clabe,beneficiary,account_label,created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (acctErr) {
      console.log("treasury_accounts err", acctErr);
      if (acctErr?.status === 404) {
        setTreasuryOk(false);
        setTreasuryAccount(null);
        setBalance(0);
        setLedger([]);
        return;
      }
    }
    setTreasuryAccount(acctRow || null);

    // balance (view)
    const { data: balRows, error: balErr } = await supabase
      .from("v_treasury_balance")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (balErr) {
      console.log("v_treasury_balance err", balErr);
      if (balErr?.status === 404) {
        setTreasuryOk(false);
        setBalance(0);
        setLedger([]);
        return;
      }
    }
    setBalance(Number(balRows?.balance || 0));

    // ledger
    const { data: ledRows, error: ledErr } = await supabase
      .from("treasury_ledger")
      .select("id,type,amount,status,reference,note,created_at,applied_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(120);

    if (ledErr) {
      console.log("treasury_ledger err", ledErr);
      if (ledErr?.status === 404) {
        setTreasuryOk(false);
        setLedger([]);
        return;
      }
    }
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
      const ref = cleanText(depRef, 80) || makeNumericRef7(`${user.id}:${Date.now()}`);

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

  // Provisonar/obtener CLABE STP (Edge Function)
  const provisionStpClabe = async () => {
    if (!user?.id || busyAcct) return;

    setBusyAcct(true);
    setAcctMsg("");

    try {
      const { data, error } = await supabase.functions.invoke("stp-provision-clabe", {
        body: { purpose: "treasury" },
      });
      if (error) throw error;

      console.log("stp-provision-clabe", data);
      setAcctMsg("✅ Cuenta SPEI creada/actualizada.");
      await loadTreasury();
    } catch (e) {
      setAcctMsg(`Error: ${e?.message || "No se pudo crear la cuenta SPEI"}`);
    } finally {
      setBusyAcct(false);
      setTimeout(() => setAcctMsg(""), 4500);
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

              {/* Si ya no vas a tener /creditos, puedes borrar este botón */}
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
                  {tab === "resumen"
                    ? "Resumen"
                    : tab === "perfil"
                    ? "Perfil"
                    : tab === "docs"
                    ? "Documentos"
                    : "Tesorería"}
                </h1>
                <p className="dash-sub">
                  {tab === "resumen"
                    ? "Tu actividad y estado general."
                    : tab === "perfil"
                    ? "Edita tu información (sin cambiar nombre/correo)."
                    : tab === "docs"
                    ? "Sube y administra tus documentos."
                    : "Tu cuenta SPEI (STP), depósitos y conciliación."}
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
                    <div className="dash-kpiSub">{treasuryOk ? "Aplicado" : "No disponible"}</div>
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
                    <li>En Tesorería: solicita tu CLABE STP y registra depósitos.</li>
                    <li>Da seguimiento a tus solicitudes de crédito.</li>
                  </ul>

                  <div className="dash-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="dash-btn dash-btnPrimary" onClick={() => setTab("perfil")}>
                      Completar perfil
                    </button>
                    <button className="dash-btn dash-btnSoft" onClick={() => setTab("docs")}>
                      Subir docs
                    </button>
                    <button className="dash-btn dash-btnSoft" onClick={() => setTab("tesoreria")}>
                      Ir a tesorería
                    </button>
                    <button className="dash-btn dash-btnSoft" onClick={() => nav("/solicitudes")}>
                      Ver solicitudes
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
                {!treasuryOk ? (
                  <div className="dash-panel">
                    <div className="dash-panelTitleRow">
                      <div className="dash-panelTitle">Tesorería</div>
                      <div className="dash-chip">No disponible</div>
                    </div>
                    <div className="dash-sideHint">
                      No encuentro <strong>treasury_accounts</strong> / <strong>v_treasury_balance</strong> /{" "}
                      <strong>treasury_ledger</strong> en este entorno (404). Si ya existen en tu SQL local, te falta
                      crearlas en <strong>producción</strong> o exponerlas en el esquema.
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="dash-panel">
                      <div className="dash-panelTitleRow">
                        <div className="dash-panelTitle">Cuenta SPEI (STP)</div>
                        <div className="dash-chip">Fondeo</div>
                      </div>

                      {acctMsg ? <div className="dash-miniNote">{acctMsg}</div> : null}

                      {!treasuryAccount?.clabe ? (
                        <>
                          <div className="dash-sideHint">
                            Aún no tienes una CLABE asignada. Presiona el botón para solicitar tu{" "}
                            <strong>CLABE STP</strong>.
                          </div>
                          <div className="dash-row" style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <button className="dash-btn dash-btnPrimary" onClick={provisionStpClabe} disabled={busyAcct}>
                              {busyAcct ? "Creando…" : "Solicitar CLABE STP"}
                            </button>
                            <button className="dash-btn dash-btnSoft" onClick={loadTreasury} disabled={busyAcct}>
                              Refresh
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="dash-list" style={{ marginTop: 10 }}>
                            <div className="dash-listRow">
                              <div>
                                <div className="dash-listMain">
                                  <strong>Beneficiario</strong>
                                </div>
                                <div className="dash-listSub">{treasuryAccount.beneficiary || "—"}</div>
                              </div>
                              <div className="dash-listRight">
                                <button
                                  className="dash-btn dash-btnSoft"
                                  onClick={async () => {
                                    const ok = await copyText(treasuryAccount.beneficiary || "");
                                    setAcctMsg(ok ? "✅ Beneficiario copiado" : "No se pudo copiar");
                                    setTimeout(() => setAcctMsg(""), 2000);
                                  }}
                                >
                                  Copiar
                                </button>
                              </div>
                            </div>

                            <div className="dash-listRow">
                              <div>
                                <div className="dash-listMain">
                                  <strong>CLABE</strong>{" "}
                                  <span style={{ opacity: 0.8 }}>({treasuryAccount.bank_name || "STP"})</span>
                                </div>
                                <div className="dash-listSub" style={{ fontSize: 16, letterSpacing: 0.6 }}>
                                  {maskClabe(treasuryAccount.clabe)}
                                </div>
                              </div>
                              <div className="dash-listRight" style={{ display: "flex", gap: 10 }}>
                                <button
                                  className="dash-btn dash-btnPrimary"
                                  onClick={async () => {
                                    const ok = await copyText(treasuryAccount.clabe || "");
                                    setAcctMsg(ok ? "✅ CLABE copiada" : "No se pudo copiar");
                                    setTimeout(() => setAcctMsg(""), 2000);
                                  }}
                                >
                                  Copiar CLABE
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="dash-sideHint" style={{ marginTop: 10 }}>
                            Envía tu SPEI a esta CLABE. Para ayudar a conciliar, usa una{" "}
                            <strong>Referencia numérica</strong> (7 dígitos) o el <strong>Concepto</strong> con tu
                            identificador.
                          </div>
                        </>
                      )}
                    </div>

                    <div className="dash-panel">
                      <div className="dash-panelTitleRow">
                        <div className="dash-panelTitle">Saldo</div>
                        <div className="dash-chip">Conciliado</div>
                      </div>
                      <div className="dash-balance">{pesos(balance)}</div>
                      <div className="dash-sideHint">
                        El saldo muestra movimientos <strong>aplicados</strong>. Depósitos quedan{" "}
                        <strong>pendientes</strong> hasta conciliación.
                      </div>
                    </div>

                    <div className="dash-panel">
                      <div className="dash-panelTitleRow">
                        <div className="dash-panelTitle">Registrar depósito (pre-conciliación)</div>
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
                        <Field label="Referencia numérica SPEI (7 dígitos) (opcional)">
                          <input
                            value={depRef}
                            onChange={(e) => setDepRef(e.target.value)}
                            placeholder="Si lo dejas vacío, genero una automáticamente"
                          />
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

                      <div className="dash-sideHint" style={{ marginTop: 10 }}>
                        Este registro no mueve dinero: solo crea un “intent” para facilitar la conciliación cuando llegue
                        el abono SPEI. Lo ideal es que el webhook STP aplique el depósito automáticamente.
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
