// src/App.jsx
import React from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./assets/css/theme.css";
import Plogo from "./assets/images/logo2-plinius.png";

const App = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <img
            src={Plogo} // Usa la importación directamente
            alt="Logo Plinius"
            className="hero-logo"
          />
          <h1 className="hero-title">Próximamente</h1>
          <p className="hero-subtitle">
            Una forma de financiar el crecimiento de las PyMes en México.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
