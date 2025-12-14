// src/components/Navbar.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/images/logo-plinius.png";
import crowdlinkLogo from "../assets/images/crowdlink-logo.png";
import "../assets/css/navbar.css";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // "nosotros" | null
  const hoverTimerRef = useRef(null);
  const navRef = useRef(null);
  const location = useLocation();

  // Cierra menú al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [location.pathname]);

  // Cierra dropdown al hacer click fuera
  useEffect(() => {
    const onDocClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const isActive = (path) => location.pathname === path;

  const openByHover = (id) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setOpenMenu(id);
  };
  const closeByHover = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setOpenMenu(null), 140);
  };
  const cancelClose = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  };

  return (
    <nav className="navbar" ref={navRef}>
      <div className="navbar-container">
        {/* Bloque logo + tagline */}
        <div className="navbar-left">
          <Link to="/" className="navbar-logo" aria-label="Plinius inicio">
            <img src={logo} alt="Plinius Logo" className="logo-image" />
          </Link>
          <span className="navbar-tagline">
            Somos una plataforma de crédito privado
          </span>
        </div>

        {/* Botón móvil */}
        <button
          className={`hamburger ${mobileOpen ? "is-active" : ""}`}
          aria-label="Abrir menú"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        {/* Links principales */}
        <ul className={`navbar-links ${mobileOpen ? "open" : ""}`}>
          {/* Inicio */}
          <li className="nav-item">
            <Link
              to="/"
              className={`nav-link ${isActive("/") ? "active" : ""}`}
            >
              Inicio
            </Link>
          </li>

          {/* Nosotros (dropdown) */}
          <li
            className={`nav-item dropdown ${
              openMenu === "nosotros" ? "open" : ""
            }`}
            onMouseEnter={() => openByHover("nosotros")}
            onMouseLeave={closeByHover}
            onFocus={() => openByHover("nosotros")}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) closeByHover();
            }}
          >
            <button
              type="button"
              className="nav-link dropdown-toggle"
              aria-haspopup="true"
              aria-expanded={openMenu === "nosotros"}
              onClick={() =>
                setOpenMenu((prev) => (prev === "nosotros" ? null : "nosotros"))
              }
            >
              Nosotros <span className="caret" />
            </button>

            {openMenu === "nosotros" && (
              <ul
                className="dropdown-menu"
                role="menu"
                onMouseEnter={cancelClose}
                onMouseLeave={closeByHover}
              >
                <li role="none">
                  <Link
                    to="/sobre-plinius"
                    role="menuitem"
                    className="dropdown-item"
                  >
                    Sobre Plinius
                  </Link>
                </li>
                <li role="none">
                  <Link
                    to="/productos"
                    role="menuitem"
                    className="dropdown-item"
                  >
                    Productos
                    <span className="dropdown-sub">
                      Crédito simple, arrendamiento y revolvente
                    </span>
                  </Link>
                </li>
                <li role="none">
                  <Link
                    to="/enfoque"
                    role="menuitem"
                    className="dropdown-item"
                  >
                    Enfoque y criterios de crédito
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* Inversionistas */}
          <li className="nav-item">
            <Link
              to="/inversionistas"
              className={`nav-link ${
                isActive("/inversionistas") ? "active" : ""
              }`}
            >
              Inversionistas
            </Link>
          </li>

          {/* Simulador */}
          <li className="nav-item">
            <Link
              to="/simulador"
              className={`nav-link ${
                isActive("/simulador") ? "active" : ""
              }`}
            >
              Simulador
            </Link>
          </li>

          {/* Solicitud */}
          <li className="nav-item">
            <Link
              to="/solicitud"
              className={`nav-link ${
                isActive("/solicitud") ? "active" : ""
              }`}
            >
              Solicitud
            </Link>
          </li>

          {/* Ingresar */}
          <li className="nav-item">
            <Link
              to="/login"
              className={`nav-link ${isActive("/login") ? "active" : ""}`}
            >
              Ingresar
            </Link>
          </li>
        </ul>

        {/* Pill Crowdlink – discreto, sólo desktop */}
        
      </div>
    </nav>
  );
};

export default Navbar;
