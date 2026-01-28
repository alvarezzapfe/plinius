// src/components/Navbar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/images/logo-plinius.png";
import "../assets/css/navbar.css";
import { supabase } from "../lib/supabaseClient";

const Navbar = () => {
  const nav = useNavigate();
  const location = useLocation();

  const navRef = useRef(null);
  const hoverTimerRef = useRef(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // "nosotros" | null

  // Auth
  const [session, setSession] = useState(null);
  const isAuthed = !!session?.user;

  const isActive = (path) => location.pathname === path;

  // ✅ Cierra menú al cambiar de ruta o hash
  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [location.pathname, location.hash]);

  // ✅ Cierra dropdown al hacer click fuera
  useEffect(() => {
    const onDocClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // ✅ Cierra con ESC
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // ✅ Sesión Supabase
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data?.session || null);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => {
      setSession(s);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Hover dropdown estable (sin flicker)
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

  const onAuthCtaClick = () => {
    if (!isAuthed) nav("/ingresar?registro=0");
    else nav("/dashboard");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    nav("/ingresar?registro=0");
  };

  // Para aria-controls único
  const dropdownId = useMemo(() => "plinius-dd-nosotros", []);

  return (
    <nav className={`navbar ${mobileOpen ? "is-mobile-open" : ""}`} ref={navRef}>
      <div className="navbar-container">
        {/* Left: logo + tagline */}
        <div className="navbar-left">
          <Link to="/" className="navbar-logo" aria-label="Plinius inicio">
            <img
              src={logo}
              alt="Plinius Logo"
              className="logo-image"
              draggable="false"
            />
          </Link>

          <span className="navbar-tagline">
            Plataforma para inversionistas de crédito privado
          </span>

          {/* Micro badge tech (opcional; se ve pro) */}
          <span className="nav-badge" aria-hidden="true">
            AI Credit Infra
          </span>
        </div>

        {/* Center: links */}
        <ul
          className={`navbar-links ${mobileOpen ? "open" : ""}`}
          id="navLinks"
          role="menubar"
        >
          <li className="nav-item" role="none">
            <Link
              to="/"
              role="menuitem"
              className={`nav-link ${isActive("/") ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              Inicio
            </Link>
          </li>

          {/* Nosotros (dropdown) */}
          <li
            className={`nav-item dropdown ${openMenu === "nosotros" ? "open" : ""}`}
            data-dropdown
            role="none"
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
              aria-controls={dropdownId}
              onClick={() =>
                setOpenMenu((prev) => (prev === "nosotros" ? null : "nosotros"))
              }
            >
              Nosotros <span className="caret" aria-hidden="true" />
            </button>

            <div className="dropdown-bridge" aria-hidden="true" />

            {openMenu === "nosotros" && (
              <ul
                className="dropdown-menu"
                id={dropdownId}
                role="menu"
                onMouseEnter={cancelClose}
                onMouseLeave={closeByHover}
              >
                <li role="none">
                  <Link
                    to="/#sobre-plinius"
                    role="menuitem"
                    className="dropdown-item"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="dropdown-title">Sobre Plinius</span>
                    <span className="dropdown-sub">Visión, equipo y misión</span>
                  </Link>
                </li>

                <li role="none">
                  <Link
                    to="/productos"
                    role="menuitem"
                    className="dropdown-item"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="dropdown-title">Productos</span>
                    <span className="dropdown-sub">
                      Crédito simple, arrendamiento y revolvente
                    </span>
                  </Link>
                </li>

                <li role="none">
                  <Link
                    to="/#enfoque"
                    role="menuitem"
                    className="dropdown-item"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="dropdown-title">Enfoque</span>
                    <span className="dropdown-sub">Criterios de crédito</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>

          <li className="nav-item" role="none">
            <Link
              to="/simulador"
              role="menuitem"
              className={`nav-link ${isActive("/simulador") ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              Simulador
            </Link>
          </li>

          <li className="nav-item" role="none">
            <Link
              to="/solicitud"
              role="menuitem"
              className={`nav-link ${isActive("/solicitud") ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              Solicitud
            </Link>
          </li>

          {/* Auth CTA */}
          <li className="nav-item" role="none">
            <button
              type="button"
              role="menuitem"
              className={`nav-link nav-link-btn nav-cta ${
                isAuthed
                  ? isActive("/dashboard")
                    ? "active"
                    : ""
                  : isActive("/ingresar")
                  ? "active"
                  : ""
              }`}
              onClick={onAuthCtaClick}
            >
              <span className="cta-glow" aria-hidden="true" />
              {isAuthed ? "Dashboard" : "Ingresar"}
            </button>
          </li>

          {/* Salir */}
          {isAuthed && (
            <li className="nav-item" role="none">
              <button
                type="button"
                role="menuitem"
                className="nav-link nav-link-btn nav-danger"
                onClick={signOut}
              >
                Salir
              </button>
            </li>
          )}
        </ul>

        {/* Right: hamburger */}
        <button
          className={`hamburger ${mobileOpen ? "is-active" : ""}`}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-controls="navLinks"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Backdrop mobile (cierra al click) */}
      <button
        type="button"
        className={`nav-backdrop ${mobileOpen ? "open" : ""}`}
        aria-label="Cerrar menú"
        onClick={() => setMobileOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
