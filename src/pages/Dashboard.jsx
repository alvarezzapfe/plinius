import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Dashboard() {
  const nav = useNavigate();
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) nav("/ingresar");
      else setSession(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (!s) nav("/ingresar");
      else setSession(s);
    });

    return () => sub?.subscription?.unsubscribe?.();
  }, [nav]);

  if (!session) return null;

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Bienvenido: {session.user.email}</p>
    </div>
  );
}
