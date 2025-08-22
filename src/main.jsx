// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import Terms from "./pages/Terms.jsx";
import Productos from "./pages/Productos.jsx";

function AlianzaCrowdlink() {
  return (
    <div className="app-container">
      <h1 style={{ padding: 24 }}>Alianza Crowdlink</h1>
      <p style={{ padding: "0 24px 24px", color: "#aeb4bf" }}>
        Muy pronto: detalles de la integración operativa, originación y fondeo.
      </p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/terminos" element={<Terms />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/alianza-crowdlink" element={<AlianzaCrowdlink />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
