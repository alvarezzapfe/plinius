// src/components/AssistantBubble.jsx
import React, { useEffect, useRef, useState } from "react";
import "../assets/css/assistant.css";

const SYS_PROMPT =
  "Eres Asesor Plinius, experto en crédito y arrendamiento para PyMEs en México. " +
  "Responde de forma clara, ejecutiva y útil. Si te piden tasas exactas, explica que son indicativas y dependen de evaluación.";

export default function AssistantBubble() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState([
    {
      role: "assistant",
      content:
        "Hola, soy tu asesor Plinius. ¿En qué puedo ayudarte hoy? Puedo estimar pagos, explicar requisitos o comparar opciones.",
    },
  ]);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (open && endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [open, msgs]);

  const send = async () => {
    const value = text.trim();
    if (!value || busy) return;
    const next = [...msgs, { role: "user", content: value }];
    setMsgs(next);
    setText("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: SYS_PROMPT, messages: next }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const reply =
        (data && data.message) ||
        "Por ahora no pude conectarme. Compárteme monto, plazo e ingresos aproximados y te oriento.";
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Estoy temporalmente offline. Como guía: comparte monto, plazo, si hay garantía, EBITDA mensual y concentración de clientes.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <button
        className="abubble-btn"
        aria-label="Abrir asesor Plinius"
        onClick={() => setOpen((v) => !v)}
      >
        Asesor
      </button>

      {open && (
        <div className="abubble-panel" role="dialog" aria-modal="false">
          <header className="ab-head">
            <div>
              <h4>Asesor Plinius</h4>
              <p className="ab-sub">
                Consultas rápidas sobre crédito y arrendamiento
              </p>
            </div>
            <button
              className="ab-close"
              aria-label="Cerrar"
              onClick={() => setOpen(false)}
            >
              Cerrar
            </button>
          </header>

          <div className="ab-body">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`ab-msg ${
                  m.role === "user" ? "is-user" : "is-assistant"
                }`}
              >
                <div className="ab-bubble">{m.content}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <footer className="ab-foot">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKey}
              placeholder="Escribe tu consulta…"
              rows={1}
            />
            <button
              className="btn ab-send"
              onClick={send}
              disabled={busy || !text.trim()}
            >
              Enviar
            </button>
          </footer>

          <div className="ab-note">
            Respuestas indicativas. La oferta final depende de evaluación y
            políticas.
          </div>
        </div>
      )}
    </>
  );
}
