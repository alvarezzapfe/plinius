// src/pages/Recuperar.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabaseClient";

export default function Recuperar() {
  const nav = useNavigate();
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Si no hay sesión de recovery, manda a login
    supabase.auth.getSession().then(({ data }) => {
      if (!data?.session) {
        // Ojo: en recovery flow, supabase suele crear sesión temporal
        // Si no existe, igual deja que el usuario intente.
      }
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (pass1.length < 8) return setMsg("La contraseña debe tener mínimo 8 caracteres.");
    if (pass1 !== pass2) return setMsg("Las contraseñas no coinciden.");
    if (loading) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pass1 });
      if (error) throw error;

      setMsg("✅ Contraseña actualizada. Ya puedes ingresar.");
      setTimeout(() => nav("/ingresar?registro=0", { replace: true }), 900);
    } catch (e2) {
      setMsg(e2?.message || "No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 24 }}>
        <form onSubmit={submit} style={{ width: "100%", maxWidth: 420, background: "#fff", padding: 18, borderRadius: 14 }}>
          <h2 style={{ margin: 0, marginBottom: 10 }}>Recuperar contraseña</h2>
          <p style={{ marginTop: 0, opacity: 0.75 }}>Define tu nueva contraseña.</p>

          <label style={{ display: "grid", gap: 6, marginTop: 10 }}>
            <span>Nueva contraseña</span>
            <input value={pass1} onChange={(e) => setPass1(e.target.value)} type="password" minLength={8} required />
          </label>

          <label style={{ display: "grid", gap: 6, marginTop: 10 }}>
            <span>Confirmar contraseña</span>
            <input value={pass2} onChange={(e) => setPass2(e.target.value)} type="password" minLength={8} required />
          </label>

          {msg && <p style={{ marginTop: 10 }}>{msg}</p>}

          <button type="submit" disabled={loading} style={{ marginTop: 12, width: "100%", height: 38 }}>
            {loading ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
