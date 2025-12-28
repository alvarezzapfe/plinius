// src/pages/CreditoDetalle.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabaseClient";
import "../assets/css/theme.css"; // o tu css que aplique

const pesos = (x, max = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: max,
  }).format(Number.isFinite(x) ? x : 0);

export default function CreditoDetalle() {
  const nav = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState(null);
  const [err, setErr] = useState("");
  const [session, setSession] = useState(null);

  // ✅ Si el id es "123" lo convertimos a number para .eq('id', 123)
  // ✅ Si es algo tipo "abc-123", lo dejamos string
  const idValue = useMemo(() => {
    const s = String(id ?? "").trim();
    if (!s) return null;
    return /^[0-9]+$/.test(s) ? Number(s) : s;
  }, [id]);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setSession(data?.session || null);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => {
      setSession(s || null);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      setErr("");
      setRow(null);
      setLoading(true);

      if (idValue === null) {
        setErr("ID inválido en la URL.");
        setLoading(false);
        return;
      }

      // ✅ Importante: esto NO redirige. Si falla, mostramos error.
      const { data, error } = await supabase
        .from("creditos")
        .select("*")
        .eq("id", idValue)
        .maybeSingle();

      if (!alive) return;

      if (error) {
        // Típico: RLS bloquea SELECT a usuarios no-auth o no autorizados
        setErr(`No pude cargar el crédito. ${error.message}`);
        setLoading(false);
        return;
      }

      if (!data) {
        setErr("Crédito no encontrado (o no tienes permisos para verlo).");
        setLoading(false);
        return;
      }

      setRow(data);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [idValue]);

  return (
    <div className="app-container">
      <Navbar />

      <main className="section" style={{ paddingTop: 96 }}>
        <div className="section-inner">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0 }}>Detalle del crédito</h2>
              <p style={{ marginTop: 6, color: "rgba(203,213,245,0.9)" }}>
                ID: <strong>{String(id ?? "")}</strong>
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-outline" onClick={() => nav(-1)}>
                Volver
              </button>
              <Link className="btn btn-outline btn-accentOutline" to="/inversionistas">
                Inversionistas
              </Link>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            {loading ? (
              <div className="dash-miniNote">Cargando crédito…</div>
            ) : err ? (
              <div className="dash-miniNote">
                <strong>Error:</strong> {err}
                {!session ? (
                  <div style={{ marginTop: 10 }}>
                    <Link to="/ingresar" className="btn btn-neon">
                      Iniciar sesión
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="dash-panel">
                <div className="dash-panelTitle">Resumen</div>

                <div className="dash-profileGrid" style={{ marginTop: 10 }}>
                  <Mini label="Estado" value={row.estado ?? "—"} />
                  <Mini label="Producto" value={row.producto ?? "—"} />
                  <Mini label="Tasa" value={`${Number(row.tasa_anual || 0).toFixed(2)}%`} />
                  <Mini label="Plazo" value={`${row.plazo_meses ?? "—"} meses`} />
                  <Mini label="Objetivo" value={pesos(Number(row.monto_objetivo || 0))} />
                  <Mini label="Recaudado" value={pesos(Number(row.monto_recaudado || 0))} />
                  <Mini label="Tag" value={row.tag ?? "—"} />
                  <Mini label="Creado" value={row.created_at ? new Date(row.created_at).toLocaleString("es-MX") : "—"} />
                </div>

                {/* Aquí luego metemos “invertir”, “ticket”, docs, etc. */}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
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
