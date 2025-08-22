// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Páginas principales
import App from "./App.jsx";
import Terms from "./pages/Terms.jsx";
import Productos from "./pages/Productos.jsx";

// Páginas nuevas
import Equipo from "./pages/Equipo.jsx";
import SobrePlinius from "./pages/SobrePlinius.jsx";
import Enfoque from "./pages/Enfoque.jsx";
import Simulador from "./pages/Simulador.jsx";

// Stub rápido (si luego quieres página dedicada)
function AlianzaCrowdlink() {
  return (
    <div className="app-container">
      <main className="section" style={{ padding: "72px 16px" }}>
        <div className="p-wrap">
          <h1 style={{ marginTop: 0 }}>Alianza Crowdlink</h1>
          <p style={{ color: "#aeb4bf" }}>
            Muy pronto: detalles de la integración operativa, originación y
            fondeo.
          </p>
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/simulador" element={<Simulador />} />
        <Route path="/sobre-plinius" element={<SobrePlinius />} />
        <Route path="/equipo" element={<Equipo />} />
        <Route path="/enfoque" element={<Enfoque />} />
        <Route path="/alianza-crowdlink" element={<AlianzaCrowdlink />} />
        <Route path="/terminos" element={<Terms />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
