// src/pages/Ingresar.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../assets/css/ingresar.css";
import { supabase } from "../lib/supabaseClient";
import plogo from "../assets/images/plogo.png";

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export default function Ingresar() {
  const nav = useNavigate();
  const loc = useLocation();

  const startMode = useMemo(() => {
    const sp = new URLSearchParams(loc.search);
    return sp.get("registro") === "1" ? "registro" : "ingreso";
  }, [loc.search]);

  const [modo, setModo] = useState(startMode);

  useEffect(() => setModo(startMode), [startMode]);

  // ✅ si ya hay sesión, no muestres login
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data?.session) nav("/dashboard", { replace: true });
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => {
      if (s) nav("/dashboard", { replace: true });
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [nav]);

  return (
    <main className="ingSplit">
      {/* ========= LEFT (WHITE / INNOVATION) ========= */}
      <section className="ingLeft" aria-label="Plinius">
        <div className="ingLeft-bg" aria-hidden />
        <div className="ingLeft-geo" aria-hidden />
        <div className="ingLeft-inner">
          <div className="ingLeft-brandRow">
            <img src={plogo} alt="Plinius" className="ingLeft-logo" />
            <span className="ingLeft-wordmark">Plinius</span>
          </div>

          <h1 className="ingLeft-title">
            Plataforma de crédito empresarial
            <span className="ingLeft-accent"> con trazabilidad y decisión rápida</span>.
          </h1>

          <p className="ingLeft-sub">
            Panel 360° para solicitudes, documentos, validaciones, términos y seguimiento. Diseñado para operar rápido, con claridad.
          </p>

          <div className="ingLeft-kpis" aria-hidden="true">
            <div className="ingLeft-kpi">
              <div className="kpiNum">48h</div>
              <div className="kpiLbl">SLA objetivo</div>
            </div>
            <div className="ingLeft-kpi">
              <div className="kpiNum">1</div>
              <div className="kpiLbl">panel único</div>
            </div>
            <div className="ingLeft-kpi">
              <div className="kpiNum">360°</div>
              <div className="kpiLbl">visión completa</div>
            </div>
          </div>

          <ul className="ingLeft-points">
            <li>Onboarding limpio: checklist, OCR (si aplica), y carga de archivos ordenada.</li>
            <li>Validaciones y eventos: audit trail para cada paso.</li>
            <li>Términos comparables: estructura clara, sin letra chiquita.</li>
          </ul>

          <div className="ingLeft-foot" aria-hidden="true">
            <span className="ingLeft-pill">Security-first</span>
            <span className="ingLeft-pill">Cashflow-first</span>
            <span className="ingLeft-pill">Operational clarity</span>
          </div>
        </div>
      </section>

      {/* ========= CENTER DIVIDER (NEON BEAM) ========= */}
      <div className="ingDivider" aria-hidden="true">
        <span className="ingDivider-line" />
        <span className="ingDivider-beam" />
      </div>

      {/* ========= RIGHT (AUTH CARD) ========= */}
      <section className="ingRight" aria-label="Acceso">
        <div className="ing-bg" aria-hidden />
        <div className="ing-grid" aria-hidden />

        <div className="ing-shell">
          <section className="ing-card ing-card--light">
            <header className="ing-head">
              <div className="ing-pill">Plinius · Acceso</div>
              <h2 className="ing-title">
                {modo === "ingreso" ? "Ingresar a tu panel" : "Crear cuenta empresarial"}
              </h2>
              <p className="ing-sub">Administra tus créditos y arrendamientos desde un solo lugar.</p>
            </header>

            <nav className="ing-tabs ing-tabs--soft" role="tablist" aria-label="Cambiar modo">
              <button
                type="button"
                role="tab"
                aria-selected={modo === "ingreso"}
                className={`ing-tab ${modo === "ingreso" ? "is-active" : ""}`}
                onClick={() => setModo("ingreso")}
              >
                Ingresar
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={modo === "registro"}
                className={`ing-tab ${modo === "registro" ? "is-active" : ""}`}
                onClick={() => setModo("registro")}
              >
                Registro
              </button>
            </nav>

            <div className="ing-social">
              <GoogleButton
                onClick={async () => {
                  const redirectTo = `${window.location.origin}/dashboard`;
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo },
                  });
                  if (error) alert(error.message);
                }}
              />
            </div>

            <div className="ing-sep ing-sep--soft">
              <span>o con correo</span>
            </div>

            <div className="ing-form-shell">
              {modo === "ingreso" ? (
                <LoginForm onSuccess={() => nav("/dashboard", { replace: true })} />
              ) : (
                <SignupForm onSuccess={() => nav("/dashboard", { replace: true })} />
              )}
            </div>

            <p className="ing-terms">
              Al continuar aceptas los{" "}
              <Link className="ing-link ing-link--inline" to="/terminos">
                Términos y Condiciones
              </Link>
              .
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

function GoogleButton({ onClick }) {
  return (
    <button type="button" className="ing-gbtn ing-gbtn--soft" onClick={onClick}>
      <span className="ing-gicon" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path
            fill="#EA4335"
            d="M24 9.5c3.7 0 7 1.3 9.6 3.8l7.2-7.2C36.6 2.3 30.7 0 24 0 14.6 0 6.5 4.9 1.9 12.1l8.6 6.7C12.5 13.9 17.8 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.1 24.6c0-1.6-.1-2.7-.3-3.9H24v7.3h12.7c-.3 2-1.7 5-4.8 7.1l7.3 5.6c4.4-4 7-9.9 7-16.1z"
          />
          <path
            fill="#FBBC05"
            d="M10.5 28.9c-1-3-1-6.3 0-9.3l-8.6-6.7C-1 17.8-1 30.2 1.9 36l8.6-7.1z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.5 0 12-2.1 16-5.7l-7.3-5.6c-2 1.4-4.7 2.4-8.7 2.4-6.2 0-11.5-4.4-13.4-10.4l-8.6 7.1C6.5 43.1 14.6 48 24 48z"
          />
        </svg>
      </span>
      Continuar con Google
    </button>
  );
}

function LoginForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const valid = emailRx.test(email) && pass.length >= 8;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || loading) return;

    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });
      if (error) throw error;

      // ✅ asegura profile (si no existe) - no rompe si falla por RLS o tabla
      if (data?.user?.id) {
        try {
          await supabase.from("profiles").upsert(
            {
              id: data.user.id,
              email: (data.user.email || email.trim()).trim(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
        } catch {}
      }

      if (data?.session) onSuccess?.();
    } catch (err) {
      setErrorMsg(err?.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const forgot = async () => {
    if (loading) return;
    setErrorMsg("");
    setInfoMsg("");

    const em = email.trim();
    if (!emailRx.test(em)) {
      setErrorMsg("Escribe tu correo primero para enviarte el enlace de recuperación.");
      return;
    }

    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/recuperar`;
      const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo });
      if (error) throw error;

      setInfoMsg("✅ Te mandé un correo para recuperar tu contraseña (revisa spam/promociones).");
    } catch (e) {
      setErrorMsg(e?.message || "No pude enviar el correo de recuperación.");
    } finally {
      setLoading(false);
      setTimeout(() => setInfoMsg(""), 6500);
    }
  };

  return (
    <form className="ing-form ing-form--soft" onSubmit={submit}>
      <Field label="Correo empresarial">
        <input
          type="email"
          placeholder="tu@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={120}
          autoComplete="email"
        />
      </Field>

      <Field label="Contraseña">
        <div className="ing-pass">
          <input
            type={show ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            minLength={8}
            required
            maxLength={128}
            autoComplete="current-password"
          />
          <button type="button" className="ing-eye" onClick={() => setShow((s) => !s)}>
            {show ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </Field>

      <div className="ing-row">
        <button type="button" className="ing-linkBtn" onClick={forgot} disabled={loading}>
          Olvidé mi contraseña
        </button>
        <span className="ing-helpHint">Recibirás un enlace por correo</span>
      </div>

      {errorMsg && <p className="ing-error">{errorMsg}</p>}
      {infoMsg && <p className="ing-success">{infoMsg}</p>}

      <button type="submit" className="btn btn-neon w100" disabled={!valid || loading}>
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}

function SignupForm({ onSuccess }) {
  const [nombres, setNombres] = useState("");
  const [apPaterno, setApPaterno] = useState("");
  const [apMaterno, setApMaterno] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [rfc, setRfc] = useState("");

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [ok, setOk] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const rfcOk = (v) => {
    const t = (v || "").trim();
    if (!t) return true;
    return /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i.test(t);
  };

  const valid =
    nombres.trim().length >= 2 &&
    apPaterno.trim().length >= 2 &&
    emailRx.test(email) &&
    pass.length >= 8 &&
    ok &&
    rfcOk(rfc);

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || loading) return;

    setLoading(true);
    setErrorMsg("");
    setSuccess(false);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            nombres: nombres.trim(),
            apellido_paterno: apPaterno.trim(),
            apellido_materno: apMaterno.trim() || null,
            empresa: empresa.trim() || null,
            rfc: rfc.trim().toUpperCase() || null,
          },
        },
      });
      if (error) throw error;

      // ✅ crea/actualiza profile (si tabla/policies existen)
      if (data?.user?.id) {
        try {
          await supabase.from("profiles").upsert(
            {
              id: data.user.id,
              email: email.trim(),
              nombres: nombres.trim(),
              apellido_paterno: apPaterno.trim(),
              apellido_materno: apMaterno.trim() || null,
              empresa: empresa.trim() || null,
              rfc: rfc.trim().toUpperCase() || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
        } catch {}
      }

      setSuccess(true);
      if (data?.session) onSuccess?.();
    } catch (err) {
      setErrorMsg(err?.message || "Ocurrió un error. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="ing-form ing-form--soft" onSubmit={submit}>
      <div className="ing-grid2">
        <Field label="Nombre(s)">
          <input value={nombres} onChange={(e) => setNombres(e.target.value)} required maxLength={80} />
        </Field>
        <Field label="Apellido paterno">
          <input value={apPaterno} onChange={(e) => setApPaterno(e.target.value)} required maxLength={60} />
        </Field>
      </div>

      <Field label="Apellido materno (opcional)">
        <input value={apMaterno} onChange={(e) => setApMaterno(e.target.value)} maxLength={60} />
      </Field>

      <div className="ing-grid2">
        <Field label="Empresa (opcional)">
          <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} maxLength={140} />
        </Field>
        <Field label="RFC (opcional)">
          <input value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase())} maxLength={13} />
        </Field>
      </div>

      <Field label="Correo empresarial">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={120} />
      </Field>

      <Field label="Contraseña">
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} minLength={8} required maxLength={128} />
      </Field>

      {!rfcOk(rfc) && <p className="ing-error">RFC inválido (deja vacío si no lo tienes).</p>}

      <label className="ing-chk ing-chk--soft">
        <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />{" "}
        <span>
          Acepto los{" "}
          <Link className="ing-link ing-link--inline" to="/terminos">
            Términos y Condiciones
          </Link>
        </span>
      </label>

      {errorMsg && <p className="ing-error">{errorMsg}</p>}
      {success && <p className="ing-success">Cuenta creada. Ya puedes iniciar sesión ✅</p>}

      <button type="submit" className="btn btn-neon w100" disabled={!valid || loading}>
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="ing-field">
      <span className="ing-field__label">{label}</span>
      <div className="ing-field__input ing-field__input--soft">{children}</div>
    </label>
  );
}
