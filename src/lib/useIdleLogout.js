// src/lib/useIdleLogout.js
import { useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

export function useIdleLogout({ minutes = 10, enabled = true, onLogout }) {
  const timerRef = useRef(null);
  const key = "plinius_last_activity_ms";
  const maxMs = Math.max(1, minutes) * 60 * 1000;

  useEffect(() => {
    if (!enabled) return;

    const now = () => Date.now();

    const setLast = (t = now()) => {
      try {
        localStorage.setItem(key, String(t));
      } catch {}
    };

    const getLast = () => {
      try {
        const v = localStorage.getItem(key);
        const n = v ? Number(v) : NaN;
        return Number.isFinite(n) ? n : now();
      } catch {
        return now();
      }
    };

    const doLogout = async () => {
      try {
        await supabase.auth.signOut();
      } catch {}
      onLogout?.();
    };

    const schedule = () => {
      clearTimeout(timerRef.current);

      const last = getLast();
      const elapsed = now() - last;
      const remaining = maxMs - elapsed;

      if (!Number.isFinite(remaining) || remaining <= 0) {
        doLogout();
        return;
      }

      timerRef.current = setTimeout(() => {
        const last2 = getLast();
        const elapsed2 = now() - last2;
        if (elapsed2 >= maxMs) doLogout();
        else schedule();
      }, Math.min(remaining, 30_000));
    };

    const touch = () => {
      setLast(now());
      schedule();
    };

    // ✅ IMPORTANTE: cuando se habilita el timer, cuenta como actividad
    setLast(now());
    schedule();

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, touch, { passive: true }));

    const onStorage = (e) => {
      if (e.key === key) schedule();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      clearTimeout(timerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, touch));
      window.removeEventListener("storage", onStorage);
    };
  }, [minutes, enabled, onLogout, maxMs]);
}
