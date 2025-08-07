// src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/images/logo-plinius.png";
import "../assets/css/navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src={logo} alt="Plinius Logo" className="logo-image" />
        </Link>
        <ul className="navbar-links">
          <li>
            <Link to="/inicio">Inicio</Link>
          </li>
          <li>
            <Link to="/equipo">Equipo</Link>
          </li>
          <li>
            <Link to="/login">Ingreso</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
