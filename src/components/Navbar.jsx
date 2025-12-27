// src/components/Navbar.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/images/logo-plinius.png";
import "../assets/css/navbar.css";
import { supabase } from "../lib/supabaseClient";

const Navbar = () => {
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // "nosotros" | null
  const hoverTimerRef = useRef(null);
  const navRef = useRef(null);
  const location = useLocation();

  // Auth
  const [session, setSession] = useState(null);
  const isAuthed = !!session?.user;

  // ✅ Cierra menú al cambiar de ruta O hash
  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [location.pathname, location.hash]);

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

  // Sesión Supabase (para cambiar Ingresar -> Dashboard)
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

  const onAuthCtaClick = async () => {
    if (!isAuthed) {
      nav("/ingresar?registro=0");
      return;
    }
    nav("/dashboard");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    nav("/ingresar?registro=0");
  };

  return (
    <nav className="navbar" ref={navRef}>
      <div className="navbar-container">
        {/* Bloque logo + tagline */}
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
            <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
              Inicio
            </Link>
          </li>

          {/* Nosotros (dropdown) */}
          <li
            className={`nav-item dropdown ${openMenu === "nosotros" ? "open" : ""}`}
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
                  {/* ✅ ahora apunta a sección en Home */}
                  <Link to="/#sobre-plinius" role="menuitem" className="dropdown-item">
                    Sobre Plinius
                  </Link>
                </li>

                <li role="none">
                  {/* Si NO tienes ruta /productos, cámbialo también a /#productos */}
                  <Link to="/productos" role="menuitem" className="dropdown-item">
                    Productos
                    <span className="dropdown-sub">
                      Crédito simple, arrendamiento y revolvente
                    </span>
                  </Link>
                </li>

                <li role="none">
                  {/* ✅ ahora apunta a sección en Home */}
                  <Link to="/#enfoque" role="menuitem" className="dropdown-item">
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
              className={`nav-link ${isActive("/inversionistas") ? "active" : ""}`}
            >
              Inversionistas
            </Link>
          </li>

          {/* Simulador */}
          <li className="nav-item">
            <Link
              to="/simulador"
              className={`nav-link ${isActive("/simulador") ? "active" : ""}`}
            >
              Simulador
            </Link>
          </li>

          {/* Solicitud */}
          <li className="nav-item">
            <Link
              to="/solicitud"
              className={`nav-link ${isActive("/solicitud") ? "active" : ""}`}
            >
              Solicitud
            </Link>
          </li>

          {/* CTA auth: Ingresar -> Dashboard */}
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link nav-link-btn ${
                isAuthed
                  ? isActive("/dashboard") ? "active" : ""
                  : isActive("/ingresar") ? "active" : ""
              }`}
              onClick={onAuthCtaClick}
            >
              {isAuthed ? "Dashboard" : "Ingresar"}
            </button>
          </li>

          {/* Salir (si hay sesión) */}
          {isAuthed && (
            <li className="nav-item">
              <button
                type="button"
                className="nav-link nav-link-btn"
                onClick={signOut}
              >
                Salir
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
