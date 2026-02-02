// src/components/Finanzas360.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "../assets/css/finanzas360.css";

// ---------- helpers ----------
const pesos = (x) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(x) ? x : 0);

const pct = (x) =>
  new Intl.NumberFormat("es-MX", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(x) ? x : 0);

const fmtDT = (d) => (d ? new Date(d).toLocaleString("es-MX") : "—");

// permite números con signo y un solo punto
const cleanNumStr = (s) => {
  const raw = String(s ?? "").replace(/,/g, "").trim();
  if (!raw) return "";
  // deja solo dígitos, punto y signo
  let x = raw.replace(/[^\d.\-]/g, "");

  // solo un signo "-" al inicio
  x = x.replace(/(?!^)-/g, "");

  // solo un punto decimal
  const parts = x.split(".");
  if (parts.length <= 2) return x;
  return parts[0] + "." + parts.slice(1).join("");
};

const toNum = (s) => {
  const n = Number(cleanNumStr(s));
  return Number.isFinite(n) ? n : 0;
};

const safeRatio = (a, b) => (Number.isFinite(a) && Number.isFinite(b) && b !== 0 ? a / b : 0);

function makeEmptyYearBlock(years) {
  const blankIS = { net_sales: "", cogs: "", sga: "", ebitda: "", net_income: "" };
  const blankBS = { current_assets: "", fixed_assets: "", short_liab: "", long_liab: "", equity: "" };

  const income = {};
  const balance = {};
  (years || []).forEach((y) => {
    income[y] = { ...blankIS };
    balance[y] = { ...blankBS };
  });

  return { years: years || [], income, balance };
}

function downloadTextFile(filename, text, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function makeCSVRow(arr) {
  return arr
    .map((x) => {
      const s = String(x ?? "");
      const escaped = s.replaceAll('"', '""');
      return `"${escaped}"`;
    })
    .join(",");
}

function normalizeYears(years) {
  // asegura orden desc (último año primero)
  const ys = (years || []).map((y) => Number(y)).filter((y) => Number.isFinite(y));
  ys.sort((a, b) => b - a);
  return ys;
}

export default function Finanzas360({ user, years, finKey }) {
  const normYears = useMemo(() => normalizeYears(years), [years]);
  const lastY = useMemo(() => (normYears.length ? Math.max(...normYears) : new Date().getFullYear() - 1), [normYears]);

  const [finStep, setFinStep] = useState("is"); // is | bs | sim | resumen
  const [fin, setFin] = useState(() => makeEmptyYearBlock(normYears));
  const [finMsg, setFinMsg] = useState("");
  const [savingFin, setSavingFin] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const [sim, setSim] = useState({
    year: String(lastY),
    addDebt: "2000000",
    rate: "0.18",
    tenor: "3",
  });

  // autosave (local) con debounce
  const autosaveRef = useRef(null);

  // -------- local storage ----------
  const loadFinFromLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem(finKey);
      if (!raw) return false;
      const obj = JSON.parse(raw);
      if (!obj?.years?.length) return false;

      setFin((prev) => ({
        years: normYears,
        income: { ...prev.income, ...(obj.income || {}) },
        balance: { ...prev.balance, ...(obj.balance || {}) },
      }));

      if (obj?.sim) setSim((s) => ({ ...s, ...obj.sim, year: String(obj.sim.year ?? lastY) }));
      if (obj?.updated_at) setLastSavedAt(obj.updated_at);

      return true;
    } catch {
      return false;
    }
  }, [finKey, normYears, lastY]);

  const saveFinToLocal = useCallback(
    (payload) => {
      try {
        localStorage.setItem(finKey, JSON.stringify(payload));
        return true;
      } catch {
        return false;
      }
    },
    [finKey]
  );

  useEffect(() => {
    // si cambian years, re-sincroniza estructura sin perder datos
    setFin((prev) => ({
      years: normYears,
      income: { ...makeEmptyYearBlock(normYears).income, ...(prev.income || {}) },
      balance: { ...makeEmptyYearBlock(normYears).balance, ...(prev.balance || {}) },
    }));
    setSim((s) => ({ ...s, year: String(s.year || lastY) }));
  }, [normYears, lastY]);

  useEffect(() => {
    if (!user?.id) return;
    loadFinFromLocal(); // no bloquea
  }, [user?.id, loadFinFromLocal]);

  // autosave local cada vez que cambie fin/sim/step (solo local)
  useEffect(() => {
    if (!user?.id) return;

    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => {
      const payload = {
        version: 3,
        updated_at: new Date().toISOString(),
        years: normYears,
        income: fin.income,
        balance: fin.balance,
        sim,
      };
      const ok = saveFinToLocal(payload);
      if (ok) setLastSavedAt(payload.updated_at);
    }, 650);

    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
    };
  }, [fin.income, fin.balance, sim, user?.id, normYears, saveFinToLocal]);

  const resetFin = () => {
    setFin(makeEmptyYearBlock(normYears));
    setFinStep("is");
    setSim({ year: String(lastY), addDebt: "2000000", rate: "0.18", tenor: "3" });
    setFinMsg("✅ Listo. Puedes volver a capturar desde cero.");
    setTimeout(() => setFinMsg(""), 2600);
  };

  // =========================
  // Save (local + nube opcional)
  // =========================
  const saveFin = async () => {
    if (!user?.id || savingFin) return;
    setSavingFin(true);
    setFinMsg("");

    const payload = {
      version: 3,
      updated_at: new Date().toISOString(),
      years: normYears,
      income: fin.income,
      balance: fin.balance,
      sim,
    };

    const okLocal = saveFinToLocal(payload);
    if (okLocal) setLastSavedAt(payload.updated_at);

    // Nube: si quieres HISTORIAL, deja insert.
    // Si quieres 1 por usuario, usa upsert y crea unique index en user_id.
    try {
      const { error } = await supabase.from("financial_snapshots").insert({
        user_id: user.id,
        payload,
      });
      if (error) throw error;

      setFinMsg(okLocal ? "✅ Guardado (local + nube)." : "✅ Guardado (nube).");
    } catch (e) {
      setFinMsg(okLocal ? "✅ Guardado local (no pude guardar nube)." : `No se pudo guardar: ${e?.message || "error"}`);
    } finally {
      setSavingFin(false);
      setTimeout(() => setFinMsg(""), 3200);
    }
  };

  const loadFin = async () => {
    if (!user?.id) return;
    setFinMsg("");

    // 1) nube
    try {
      const { data, error } = await supabase
        .from("financial_snapshots")
        .select("payload,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data?.payload) {
        const p = data.payload;
        setFin((prev) => ({
          years: normYears,
          income: { ...prev.income, ...(p.income || {}) },
          balance: { ...prev.balance, ...(p.balance || {}) },
        }));
        if (p?.sim) setSim((s) => ({ ...s, ...p.sim, year: String(p.sim.year ?? lastY) }));
        setLastSavedAt(p?.updated_at || data.created_at);
        setFinMsg(`✅ Cargado desde nube (${fmtDT(data.created_at)})`);
        setTimeout(() => setFinMsg(""), 2800);
        return;
      }
    } catch {
      // ignore
    }

    // 2) local
    const ok = loadFinFromLocal();
    setFinMsg(ok ? "✅ Cargado desde tu navegador (local)." : "No encontré datos guardados aún.");
    setTimeout(() => setFinMsg(""), 2800);
  };

  // -------- setters ----------
  const setIS = (year, k, v) => {
    setFin((s) => ({
      ...s,
      income: { ...s.income, [year]: { ...s.income[year], [k]: v } },
    }));
  };

  const setBS = (year, k, v) => {
    setFin((s) => ({
      ...s,
      balance: { ...s.balance, [year]: { ...s.balance[year], [k]: v } },
    }));
  };

  // -------- derived ----------
  const finDerived = useMemo(() => {
    const out = {};
    normYears.forEach((y) => {
      const is = fin.income[y] || {};
      const bs = fin.balance[y] || {};

      const net_sales = toNum(is.net_sales);
      const cogs = toNum(is.cogs);
      const sga = toNum(is.sga);
      const ebitda = toNum(is.ebitda);
      const net_income = toNum(is.net_income);

      const gross_profit = net_sales - cogs;
      const gross_margin = safeRatio(gross_profit, net_sales);
      const ebitda_margin = safeRatio(ebitda, net_sales);
      const net_margin = safeRatio(net_income, net_sales);

      const ebitda_implied = net_sales - cogs - sga;
      const ebitda_delta = ebitda - ebitda_implied;

      const ca = toNum(bs.current_assets);
      const fa = toNum(bs.fixed_assets);
      const sl = toNum(bs.short_liab);
      const ll = toNum(bs.long_liab);
      const eq = toNum(bs.equity);

      const assets = ca + fa;
      const liab = sl + ll;
      const equity_implied = assets - liab;
      const equity_delta = eq - equity_implied;

      const debt = liab; // proxy simple (pasivo total)
      const debt_to_ebitda = safeRatio(debt, ebitda);
      const debt_to_equity = safeRatio(debt, eq);

      out[y] = {
        net_sales,
        cogs,
        sga,
        ebitda,
        net_income,
        gross_profit,
        gross_margin,
        ebitda_margin,
        net_margin,
        ebitda_implied,
        ebitda_delta,
        ca,
        fa,
        assets,
        sl,
        ll,
        liab,
        eq,
        equity_implied,
        equity_delta,
        debt,
        debt_to_ebitda,
        debt_to_equity,
      };
    });
    return out;
  }, [fin, normYears]);

  const simDerived = useMemo(() => {
    const y = Number(sim.year) || lastY;
    const base = finDerived[y] || {};
    const addDebt = toNum(sim.addDebt);
    const rate = Number(sim.rate);
    const tenor = Number(sim.tenor);

    const ebitda = base.ebitda || 0;
    const equity = base.eq || 0;
    const baseDebt = base.debt || 0;

    const newDebt = baseDebt + addDebt;
    const r = Number.isFinite(rate) ? rate : 0;
    const t = Number.isFinite(tenor) ? tenor : 0;

    const interestYear = addDebt * r;
    const debtToEbitda = safeRatio(newDebt, ebitda);
    const debtToEquity = safeRatio(newDebt, equity);
    const totalInterest = interestYear * t;

    return {
      year: y,
      addDebt,
      rate: r,
      tenor: t,
      baseDebt,
      newDebt,
      interestYear,
      totalInterest,
      debtToEbitda,
      debtToEquity,
    };
  }, [sim, lastY, finDerived]);

  // -------- bankability ----------
  const bankability = useMemo(() => {
    let score = 0;
    const todos = [];

    // completitud (50)
    let filled = 0;
    let total = 0;

    normYears.forEach((y) => {
      const is = fin.income[y] || {};
      const bs = fin.balance[y] || {};
      const isFields = ["net_sales", "cogs", "sga", "ebitda", "net_income"];
      const bsFields = ["current_assets", "fixed_assets", "short_liab", "long_liab", "equity"];

      isFields.forEach((k) => {
        total += 1;
        if (String(is[k] ?? "").trim() !== "") filled += 1;
      });
      bsFields.forEach((k) => {
        total += 1;
        if (String(bs[k] ?? "").trim() !== "") filled += 1;
      });
    });

    const completeness = total ? filled / total : 0;
    score += Math.round(50 * completeness);

    if (completeness < 0.9) todos.push("Completa los campos faltantes (ideal: 3 años completos).");

    // consistencia (30) — tolerancia: 1 peso
    let okEBITDA = 0;
    let okEQ = 0;

    normYears.forEach((y) => {
      const d = finDerived[y] || {};
      if (Math.abs(d.ebitda_delta || 0) <= 1) okEBITDA += 1;
      if (Math.abs(d.equity_delta || 0) <= 1) okEQ += 1;
    });

    const consistency = (okEBITDA + okEQ) / (2 * (normYears.length || 1));
    score += Math.round(30 * consistency);

    if (okEBITDA < normYears.length) todos.push("Revisa consistencia de EBITDA (Ventas - COGS - SG&A).");
    if (okEQ < normYears.length) todos.push("Revisa ecuación contable (Activos = Pasivos + Capital).");

    // señales rápidas (20) — año más reciente real
    const d = finDerived[lastY] || {};
    const ebitdaMargin = d.ebitda_margin || 0;
    const leverage = d.debt_to_ebitda || 0;

    if (ebitdaMargin >= 0.12) score += 10;
    else if (ebitdaMargin >= 0.06) score += 6;
    else {
      score += 2;
      todos.push("Mejora margen EBITDA o revisa clasificación COGS/SG&A.");
    }

    if (leverage > 0 && leverage <= 3) score += 10;
    else if (leverage > 0 && leverage <= 5) score += 6;
    else {
      score += 2;
      todos.push("Apalancamiento alto (proxy Deuda/EBITDA). Considera reducir pasivos o subir EBITDA.");
    }

    score = Math.max(0, Math.min(100, score));
    const badge = score >= 80 ? "ok" : score >= 60 ? "warn" : "bad";
    const label = score >= 80 ? "LISTO PARA BANCO" : score >= 60 ? "CASI LISTO" : "FALTA INFO";

    return { score, badge, label, todos: Array.from(new Set(todos)).slice(0, 5), lastY };
  }, [fin, finDerived, normYears, lastY]);

  // -------- export CSV ----------
  const exportCSV = useCallback(() => {
    const header = [
      "year",
      "net_sales",
      "cogs",
      "sga",
      "ebitda",
      "net_income",
      "current_assets",
      "fixed_assets",
      "short_liab",
      "long_liab",
      "equity",
      "assets",
      "liab",
      "gross_margin",
      "ebitda_margin",
      "net_margin",
      "debt_to_ebitda",
      "debt_to_equity",
      "ebitda_delta",
      "equity_delta",
    ];

    const rows = [makeCSVRow(header)];

    normYears.forEach((y) => {
      const is = fin.income[y] || {};
      const bs = fin.balance[y] || {};
      const d = finDerived[y] || {};
      rows.push(
        makeCSVRow([
          y,
          is.net_sales ?? "",
          is.cogs ?? "",
          is.sga ?? "",
          is.ebitda ?? "",
          is.net_income ?? "",
          bs.current_assets ?? "",
          bs.fixed_assets ?? "",
          bs.short_liab ?? "",
          bs.long_liab ?? "",
          bs.equity ?? "",
          d.assets ?? 0,
          d.liab ?? 0,
          d.gross_margin ?? 0,
          d.ebitda_margin ?? 0,
          d.net_margin ?? 0,
          d.debt_to_ebitda ?? 0,
          d.debt_to_equity ?? 0,
          d.ebitda_delta ?? 0,
          d.equity_delta ?? 0,
        ])
      );
    });

    downloadTextFile(`plinius_fin360_${user?.id || "anon"}.csv`, rows.join("\n"), "text/csv;charset=utf-8");
    setFinMsg("✅ Exportado CSV.");
    setTimeout(() => setFinMsg(""), 2200);
  }, [fin, finDerived, normYears, user?.id]);

  // -------- UI ----------
  return (
    <div className="fin360">
      <div className="dash-panel">
        <div className="fin360-top">
          <div className="fin360-titleWrap">
            <div className="dash-panelTitle">Finanzas 360</div>
            <div className="fin360-sub">Captura · Validación · Simulador · Insights accionables</div>
          </div>

          <div className="fin360-score">
            <div className={`fin360-scoreBadge ${bankability.badge}`}>
              <span className="fin360-scoreNum">{bankability.score}</span>
              <span className="fin360-scoreTxt">{bankability.label}</span>
            </div>
          </div>
        </div>

        <div className="fin360-actions">
          <div className="fin360-actionsLeft">
            <button className="dash-btn dash-btnSoft" onClick={loadFin}>
              Cargar
            </button>
            <button className="dash-btn dash-btnSoft" onClick={resetFin}>
              Rehacer
            </button>
            <button className="dash-btn dash-btnSoft" onClick={exportCSV}>
              Export CSV
            </button>

            <div className="fin360-savedAt" title={lastSavedAt ? `Último autosave: ${fmtDT(lastSavedAt)}` : ""}>
              {lastSavedAt ? `Auto-save: ${fmtDT(lastSavedAt)}` : "Auto-save: —"}
            </div>
          </div>

          <div className="fin360-actionsRight">
            {finMsg ? <div className="dash-miniNote">{finMsg}</div> : null}
            <button className="dash-btn dash-btnPrimary" onClick={saveFin} disabled={savingFin}>
              {savingFin ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>

        <div className="fin360-stepper">
          <button className={`fin360-step ${finStep === "is" ? "is-active" : ""}`} onClick={() => setFinStep("is")}>
            1) Resultados
          </button>
          <button className={`fin360-step ${finStep === "bs" ? "is-active" : ""}`} onClick={() => setFinStep("bs")}>
            2) Balance
          </button>
          <button className={`fin360-step ${finStep === "sim" ? "is-active" : ""}`} onClick={() => setFinStep("sim")}>
            3) Simulador
          </button>
          <button
            className={`fin360-step ${finStep === "resumen" ? "is-active" : ""}`}
            onClick={() => setFinStep("resumen")}
          >
            4) Resumen
          </button>
        </div>

        <div className="fin360-insights">
          <div className="fin360-insCard">
            <div className="fin360-insTitle">Qué te falta para “aprobar”</div>
            {bankability.todos.length === 0 ? (
              <div className="fin360-insOk">✅ Se ve sólido. Siguiente: conecta documentos y conciliación.</div>
            ) : (
              <ul className="fin360-insList">
                {bankability.todos.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="fin360-insCard">
            <div className="fin360-insTitle">Último año ({bankability.lastY})</div>
            <div className="fin360-kpis">
              <div className="fin360-kpi">
                <span>EBITDA margin</span>
                <strong>{pct(finDerived[bankability.lastY]?.ebitda_margin || 0)}</strong>
              </div>
              <div className="fin360-kpi">
                <span>Deuda/EBITDA</span>
                <strong>{(finDerived[bankability.lastY]?.debt_to_ebitda || 0).toFixed(2)}x</strong>
              </div>
              <div className="fin360-kpi">
                <span>Ventas</span>
                <strong>{pesos(finDerived[bankability.lastY]?.net_sales || 0)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Step: IS */}
        {finStep === "is" && (
          <>
            <div className="fin360-hint">
              Captura 3 años. Si ya tienes EBITDA, úsalo tal cual. Validación: EBITDA implícito = Ventas − COGS − SG&A.
            </div>

            <div className="fin360-grid">
              <div className="fin360-gridScroll">
                <div className="fin360-gridInner" style={{ ["--fin-cols"]: normYears.length }}>
                  <div className="fin360-gridHead">
                    <div className="fin360-cell fin360-label">Concepto</div>
                    {normYears.map((y) => (
                      <div key={y} className="fin360-cell fin360-year">
                        {y}
                      </div>
                    ))}
                  </div>

                  <FinRowBig label="Ventas netas" years={normYears}>
                    {(y) => (
                      <BigInput value={fin.income[y]?.net_sales ?? ""} onChange={(v) => setIS(y, "net_sales", v)} placeholder="0" />
                    )}
                  </FinRowBig>

                  <FinRowBig label="COGS" years={normYears}>
                    {(y) => <BigInput value={fin.income[y]?.cogs ?? ""} onChange={(v) => setIS(y, "cogs", v)} placeholder="0" />}
                  </FinRowBig>

                  <FinRowBig label="SG&A" years={normYears}>
                    {(y) => <BigInput value={fin.income[y]?.sga ?? ""} onChange={(v) => setIS(y, "sga", v)} placeholder="0" />}
                  </FinRowBig>

                  <FinRowBig label="EBITDA" years={normYears} meta="(captura directo)">
                    {(y) => {
                      const delta = finDerived[y]?.ebitda_delta || 0;
                      const ok = Math.abs(delta) <= 1;
                      return (
                        <div className="fin360-stack">
                          <BigInput value={fin.income[y]?.ebitda ?? ""} onChange={(v) => setIS(y, "ebitda", v)} placeholder="0" />
                          <div className={`fin360-check ${ok ? "ok" : "warn"}`}>
                            Δ vs implícito: <strong>{pesos(delta)}</strong>
                          </div>
                        </div>
                      );
                    }}
                  </FinRowBig>

                  <FinRowBig label="Net income" years={normYears}>
                    {(y) => <BigInput value={fin.income[y]?.net_income ?? ""} onChange={(v) => setIS(y, "net_income", v)} placeholder="0" />}
                  </FinRowBig>
                </div>
              </div>
            </div>

            <div className="fin360-navBtns">
              <button className="dash-btn dash-btnPrimary" onClick={() => setFinStep("bs")}>
                Siguiente: Balance →
              </button>
              <button className="dash-btn dash-btnSoft" onClick={() => setFinStep("resumen")}>
                Ver resumen
              </button>
            </div>
          </>
        )}

        {/* Step: BS */}
        {finStep === "bs" && (
          <>
            <div className="fin360-hint">
              Captura Activo circulante y fijo; Pasivo corto y largo; Capital. Validación: <strong>Activos = Pasivos + Capital</strong>.
            </div>

            <div className="fin360-grid">
              <div className="fin360-gridScroll">
                <div className="fin360-gridInner" style={{ ["--fin-cols"]: normYears.length }}>
                  <div className="fin360-gridHead">
                    <div className="fin360-cell fin360-label">Concepto</div>
                    {normYears.map((y) => (
                      <div key={y} className="fin360-cell fin360-year">
                        {y}
                      </div>
                    ))}
                  </div>

                  <FinRowBig label="Activo circulante" years={normYears}>
                    {(y) => (
                      <BigInput value={fin.balance[y]?.current_assets ?? ""} onChange={(v) => setBS(y, "current_assets", v)} placeholder="0" />
                    )}
                  </FinRowBig>

                  <FinRowBig label="Activo fijo" years={normYears}>
                    {(y) => (
                      <BigInput value={fin.balance[y]?.fixed_assets ?? ""} onChange={(v) => setBS(y, "fixed_assets", v)} placeholder="0" />
                    )}
                  </FinRowBig>

                  <FinRowBig label="Pasivo corto plazo" years={normYears}>
                    {(y) => <BigInput value={fin.balance[y]?.short_liab ?? ""} onChange={(v) => setBS(y, "short_liab", v)} placeholder="0" />}
                  </FinRowBig>

                  <FinRowBig label="Pasivo largo plazo" years={normYears}>
                    {(y) => <BigInput value={fin.balance[y]?.long_liab ?? ""} onChange={(v) => setBS(y, "long_liab", v)} placeholder="0" />}
                  </FinRowBig>

                  <FinRowBig label="Capital contable" years={normYears} meta="(input)">
                    {(y) => {
                      const delta = finDerived[y]?.equity_delta || 0;
                      const ok = Math.abs(delta) <= 1;
                      return (
                        <div className="fin360-stack">
                          <BigInput value={fin.balance[y]?.equity ?? ""} onChange={(v) => setBS(y, "equity", v)} placeholder="0" />
                          <div className={`fin360-check ${ok ? "ok" : "warn"}`}>
                            Δ ecuación: <strong>{pesos(delta)}</strong>
                          </div>
                        </div>
                      );
                    }}
                  </FinRowBig>
                </div>
              </div>
            </div>

            <div className="fin360-navBtns">
              <button className="dash-btn dash-btnSoft" onClick={() => setFinStep("is")}>
                ← Regresar
              </button>
              <button className="dash-btn dash-btnPrimary" onClick={() => setFinStep("sim")}>
                Siguiente: Simulador →
              </button>
              <button className="dash-btn dash-btnSoft" onClick={() => setFinStep("resumen")}>
                Ver resumen
              </button>
            </div>
          </>
        )}

        {/* Step: SIM */}
        {finStep === "sim" && (
          <>
            <div className="fin360-sim">
              <div className="fin360-simLeft">
                <div className="fin360-blockTitle">Simulador de deuda</div>
                <div className="fin360-hint" style={{ marginTop: 10 }}>
                  Año base + deuda adicional → impacto en apalancamiento. Roadmap: amortización, DSCR, covenants, schedule.
                </div>

                <div className="fin360-simGrid">
                  <FieldBig label="Año base">
                    <select value={String(sim.year)} onChange={(e) => setSim((s) => ({ ...s, year: e.target.value }))}>
                      {normYears.map((y) => (
                        <option key={y} value={String(y)}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </FieldBig>

                  <FieldBig label="Deuda adicional (MXN)">
                    <input
                      inputMode="numeric"
                      value={sim.addDebt}
                      onChange={(e) => setSim((s) => ({ ...s, addDebt: cleanNumStr(e.target.value) }))}
                      placeholder="Ej. 2000000"
                    />
                  </FieldBig>

                  <FieldBig label="Tasa anual (0.18 = 18%)">
                    <input
                      inputMode="decimal"
                      value={sim.rate}
                      onChange={(e) => setSim((s) => ({ ...s, rate: cleanNumStr(e.target.value) }))}
                      placeholder="0.18"
                    />
                  </FieldBig>

                  <FieldBig label="Plazo (años)">
                    <input
                      inputMode="numeric"
                      value={sim.tenor}
                      onChange={(e) => setSim((s) => ({ ...s, tenor: cleanNumStr(e.target.value) }))}
                      placeholder="3"
                    />
                  </FieldBig>
                </div>

                <div className="fin360-slider">
                  <div className="fin360-sliderTop">
                    <span>Deuda adicional</span>
                    <strong>{pesos(simDerived.addDebt)}</strong>
                  </div>
                  <input
                    className="fin360-range"
                    type="range"
                    min="0"
                    max="50000000"
                    step="50000"
                    value={String(toNum(sim.addDebt))}
                    onChange={(e) => setSim((s) => ({ ...s, addDebt: String(e.target.value) }))}
                  />
                  <div className="fin360-sliderBot">
                    <span>0</span>
                    <span>50M</span>
                  </div>
                </div>
              </div>

              <div className="fin360-simRight">
                <MetricBig label="Deuda base (proxy pasivo total)" value={pesos(simDerived.baseDebt)} />
                <MetricBig label="Deuda proforma" value={pesos(simDerived.newDebt)} />
                <MetricBig
                  label="Interés anual (aprox.)"
                  value={pesos(simDerived.interestYear)}
                  sub={`${pct(simDerived.rate)} anual · ${simDerived.tenor || "—"} años`}
                />
                <MetricBig label="Deuda / EBITDA (proforma)" value={`${(simDerived.debtToEbitda || 0).toFixed(2)}x`} />
                <MetricBig label="Deuda / Capital (proforma)" value={`${(simDerived.debtToEquity || 0).toFixed(2)}x`} />
              </div>
            </div>

            <div className="fin360-navBtns">
              <button className="dash-btn dash-btnSoft" onClick={() => setFinStep("bs")}>
                ← Regresar
              </button>
              <button className="dash-btn dash-btnPrimary" onClick={() => setFinStep("resumen")}>
                Ver resumen →
              </button>
            </div>
          </>
        )}

        {/* Step: RESUMEN */}
        {finStep === "resumen" && (
          <>
            <div className="fin360-summary">
              {normYears.map((y) => {
                const d = finDerived[y] || {};
                const okEBITDA = Math.abs(d.ebitda_delta || 0) <= 1;
                const okEq = Math.abs(d.equity_delta || 0) <= 1;

                return (
                  <div key={y} className="fin360-sumCard">
                    <div className="fin360-sumHead">
                      <div className="fin360-sumYear">{y}</div>
                      <div className="fin360-badges">
                        <span className={`fin360-badge ${okEBITDA ? "ok" : "warn"}`}>EBITDA {okEBITDA ? "OK" : "Δ"}</span>
                        <span className={`fin360-badge ${okEq ? "ok" : "warn"}`}>Balance {okEq ? "OK" : "Δ"}</span>
                      </div>
                    </div>

                    <div className="fin360-sumGrid">
                      <SumRow label="Ventas" value={pesos(d.net_sales)} />
                      <SumRow label="EBITDA" value={pesos(d.ebitda)} />
                      <SumRow label="EBITDA margin" value={pct(d.ebitda_margin)} />
                      <SumRow label="Net income" value={pesos(d.net_income)} />
                      <SumRow label="Activos" value={pesos(d.assets)} />
                      <SumRow label="Pasivos" value={pesos(d.liab)} />
                      <SumRow label="Capital" value={pesos(d.eq)} />
                      <SumRow label="Deuda/EBITDA" value={`${(d.debt_to_ebitda || 0).toFixed(2)}x`} />
                    </div>

                    {!okEBITDA && (
                      <div className="fin360-warn">
                        EBITDA vs implícito: Δ <strong>{pesos(d.ebitda_delta)}</strong> (revisa COGS/SG&A o EBITDA)
                      </div>
                    )}
                    {!okEq && (
                      <div className="fin360-warn">
                        Ecuación contable: Δ <strong>{pesos(d.equity_delta)}</strong> (Activos − Pasivos ≠ Capital)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="fin360-navBtns">
              <button className="dash-btn dash-btnSoft" onClick={() => setFinStep("sim")}>
                ← Regresar
              </button>
              <button className="dash-btn dash-btnPrimary" onClick={saveFin} disabled={savingFin}>
                {savingFin ? "Guardando…" : "Guardar Finanzas 360"}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="dash-panel">
        <div className="dash-panelTitleRow">
          <div className="dash-panelTitle">Siguiente nivel (valor duro)</div>
          <div className="dash-chip">Roadmap</div>
        </div>
        <ul className="dash-modList">
          <li>
            <strong>DSCR + amortización real</strong> (schedule, intereses, principal, covenants).
          </li>
          <li>
            <strong>“Readiness pack”</strong>: export PDF/ZIP para banco (EF + ratios + checklist docs).
          </li>
          <li>
            <strong>Import</strong> desde Excel/CSV + mapeo automático de cuentas.
          </li>
          <li>
            <strong>Motor de insights</strong>: detectar outliers, márgenes raros, crecimiento, estacionalidad.
          </li>
        </ul>
      </div>
    </div>
  );
}

// ---------- UI pieces ----------
function FieldBig({ label, children }) {
  return (
    <label className="fin360-field">
      <span className="fin360-fieldLabel">{label}</span>
      <div className="fin360-fieldInput">{children}</div>
    </label>
  );
}

function MetricBig({ label, value, sub }) {
  return (
    <div className="fin360-metric">
      <div className="fin360-metricLabel">{label}</div>
      <div className="fin360-metricValue">{value}</div>
      {sub ? <div className="fin360-metricSub">{sub}</div> : null}
    </div>
  );
}

function SumRow({ label, value }) {
  return (
    <div className="fin360-sumRow">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FinRowBig({ label, years, meta, children }) {
  return (
    <div className="fin360-row">
      <div className="fin360-cell fin360-label">
        <div className="fin360-labelMain">{label}</div>
        {meta ? <div className="fin360-labelMeta">{meta}</div> : null}
      </div>
      {years.map((y) => (
        <div key={y} className="fin360-cell fin360-inputCell">
          {children(y)}
        </div>
      ))}
    </div>
  );
}

function BigInput({ value, onChange, placeholder }) {
  return (
    <input
      className="fin360-input"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(cleanNumStr(e.target.value))}
      placeholder={placeholder}
    />
  );
}
