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
  const [openMenu, setOpenMenu] = useState(null);

  const [session, setSession] = useState(null);
  const isAuthed = !!session?.user;

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

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

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data?.session || null);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => setSession(s));

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const openByHover = (id) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setOpenMenu(id);
  };
  const closeByHover = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setOpenMenu(null), 120);
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

  const dropdownId = useMemo(() => "plinius-dd-nosotros", []);

  return (
    <nav className={`snav2 ${mobileOpen ? "is-mobile-open" : ""}`} ref={navRef}>
      <div className="snav2__inner">
        {/* Left brand */}
        <div className="snav2__left">
          <Link to="/" className="snav2__brand" aria-label="Plinius inicio" onClick={() => setMobileOpen(false)}>
            <img src={logo} alt="Plinius" className="snav2__logo" draggable="false" />
          </Link>
        </div>

        {/* Right links */}
        <div className="snav2__right">
          <ul className={`snav2__links ${mobileOpen ? "open" : ""}`} id="navLinks" role="menubar">
            {/* INICIO */}
            <li role="none">
              <Link
                to="/"
                role="menuitem"
                className={`snav2__link ${isActive("/") ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                Inicio
              </Link>
            </li>

            {/* NOSOTROS (dropdown) */}
            <li
              className={`snav2__dd ${openMenu === "nosotros" ? "open" : ""}`}
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
                className="snav2__link snav2__toggle"
                aria-haspopup="true"
                aria-expanded={openMenu === "nosotros"}
                aria-controls={dropdownId}
                onClick={() => setOpenMenu((p) => (p === "nosotros" ? null : "nosotros"))}
              >
                Nosotros <span className="snav2__caret" aria-hidden="true" />
              </button>

              <div className="snav2__bridge" aria-hidden="true" />

              {openMenu === "nosotros" && (
                <div
                  className="snav2__menu"
                  id={dropdownId}
                  role="menu"
                  onMouseEnter={cancelClose}
                  onMouseLeave={closeByHover}
                >
                  <Link
                    to="/sobre-plinius"
                    role="menuitem"
                    className="snav2__menuItem"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sobre Plinius
                    <span className="snav2__menuSub">Visión, misión y estructura</span>
                  </Link>

                  

                  <Link
                    to="/equipo"
                    role="menuitem"
                    className="snav2__menuItem"
                    onClick={() => setMobileOpen(false)}
                  >
                    Equipo
                    <span className="snav2__menuSub">Experiencia, gobierno y roles</span>
                  </Link>
                </div>
              )}
            </li>

            {/* TRACK RECORD 
            <li role="none">
              <Link
                to="/track-record"
                role="menuitem"
                className={`snav2__link ${isActive("/track-record") ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                Track Record
              </Link>
            </li>
            */}

            {/* SOLICITUD 
            <li role="none">
              <Link
                to="/solicitud"
                role="menuitem"
                className={`snav2__link ${isActive("/solicitud") ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                Solicitud
              </Link>
            </li>

            */}

            {/* AUTH CTA */}
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className={`snav2__link snav2__cta ${
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
                {isAuthed ? "Dashboard" : "Ingresar"}
              </button>
            </li>

            {/* SIGN OUT */}
            {isAuthed && (
              <li role="none">
                <button type="button" role="menuitem" className="snav2__link snav2__danger" onClick={signOut}>
                  Salir
                </button>
              </li>
            )}
          </ul>

          {/* BURGER */}
          <button
            className={`snav2__burger ${mobileOpen ? "is-active" : ""}`}
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
      </div>

      {/* BACKDROP */}
      <button
        type="button"
        className={`snav2__backdrop ${mobileOpen ? "open" : ""}`}
        aria-label="Cerrar menú"
        onClick={() => setMobileOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
