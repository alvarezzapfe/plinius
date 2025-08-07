// src/components/Footer.jsx
import React from "react";
import logo from "../assets/images/logo-plinius.png";
import "../assets/css/footer.css";

const Footer = () => {
  return (
    <footer className="footer-section">
      <div className="footer-top">
        <img src={logo} alt="Logo Plinius" className="footer-logo" />
        <hr className="footer-divider" />
        <p className="footer-title">
          Infraestructura en Finanzas AI, S.A.P.I. de C.V. ( &copy;{" "}
          {new Date().getFullYear()}. Plinius es una marca registrada)
        </p>
      </div>

      <div className="footer-container">
        <div className="footer-column">
          <h5>Contacto</h5>
          <p>Teléfono: (55) 5551609091</p>
          <p>Email: contacto@crowdlink.mx</p>
          <p>
            Torre Esmeralda III, Blvd. Manuel Ávila Camacho 32,
            <br />
            Sky Lobby B, Col. Lomas de Chapultepec I Sección,
            <br />
            Miguel Hidalgo, CDMX 11000
          </p>
        </div>

        <div className="footer-column">
          <h5>Enlaces</h5>
          <a href="#" className="footer-link">
            Inicio
          </a>
          <p></p>
          <a href="#modelo" className="footer-link">
            Modelo
          </a>
          <p></p>
          <a href="#simulador" className="footer-link">
            Simulador
          </a>
          <p></p>
          <a href="#solicitud" className="footer-link">
            Solicitud
          </a>
        </div>

        <div className="footer-column">
          <h5>Alianzas</h5>
          <a
            href="https://www.crowdlink.mx"
            target="_blank"
            rel="noreferrer"
            className="footer-link"
          >
            Crowdlink
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          &copy; {new Date().getFullYear()} Plinius. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
