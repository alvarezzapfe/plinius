// src/pages/SolicitudDetalle.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";

export default function SolicitudDetalle() {
  const { id } = useParams();

  return (
    <div style={{ padding: 24, color: "#e5e7eb", background: "#020617", minHeight: "100vh" }}>
      <h1 style={{ marginTop: 0 }}>SolicitudDetalle</h1>
      <p>ID: <strong>{id}</strong></p>
      <Link to="/solicitudes" style={{ color: "#d7ff00" }}>← Volver a Solicitudes</Link>
    </div>
  );
}
