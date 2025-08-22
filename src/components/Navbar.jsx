// src/components/Navbar.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/images/logo-plinius.png";
import "../assets/css/navbar.css";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // 'nosotros' | 'quehacemos' | null
  const hoverTimerRef = useRef(null);
  const navRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [location.pathname]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const openByHover = (id) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setOpenMenu(id);
  };
  const closeByHover = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setOpenMenu(null), 150);
  };
  const cancelClose = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  };
  const toggleMenu = (id) => setOpenMenu((prev) => (prev === id ? null : id));
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar" ref={navRef}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" aria-label="Plinius inicio">
          <img src={logo} alt="Plinius Logo" className="logo-image" />
        </Link>

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
              onClick={() => toggleMenu("nosotros")}
            >
              Nosotros <span className="caret" />
            </button>

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
                <Link to="/equipo" role="menuitem" className="dropdown-item">
                  Equipo
                </Link>
              </li>
              <li role="none">
                <Link to="/enfoque" role="menuitem" className="dropdown-item">
                  Enfoque
                </Link>
              </li>
            </ul>
          </li>

          {/* Qué hacemos (dropdown) */}
          <li
            className={`nav-item dropdown ${
              openMenu === "quehacemos" ? "open" : ""
            }`}
            onMouseEnter={() => openByHover("quehacemos")}
            onMouseLeave={closeByHover}
            onFocus={() => openByHover("quehacemos")}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) closeByHover();
            }}
          >
            <button
              type="button"
              className="nav-link dropdown-toggle"
              aria-haspopup="true"
              aria-expanded={openMenu === "quehacemos"}
              onClick={() => toggleMenu("quehacemos")}
            >
              Qué hacemos <span className="caret" />
            </button>

            <ul
              className="dropdown-menu"
              role="menu"
              onMouseEnter={cancelClose}
              onMouseLeave={closeByHover}
            >
              <li role="none">
                <Link to="/productos" role="menuitem" className="dropdown-item">
                  Productos
                </Link>
              </li>
              <li role="none">
                <Link
                  to="/alianza-crowdlink"
                  role="menuitem"
                  className="dropdown-item"
                >
                  Alianza Crowdlink
                </Link>
              </li>
            </ul>
          </li>

          {/* Simulador (nuevo) */}
          <li className="nav-item">
            <Link
              to="/simulador"
              className={`nav-link ${isActive("/simulador") ? "active" : ""}`}
            >
              Simulador
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
      </div>
    </nav>
  );
};

export default Navbar;
