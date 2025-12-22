// backend/server.js
const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();

// ---- Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

// ---- Health
app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, ts: new Date().toISOString() });
});

// ---- Debug helper (para confirmar que NO estás cayendo a index.html)
app.get("/api/plinius/solicitud", (req, res) => {
  res.status(200).json({
    ok: true,
    hint: "Use POST /api/plinius/solicitud",
  });
});

// ---- Preflight (no debería ser necesario same-origin, pero lo cubrimos)
app.options("/api/plinius/solicitud", (req, res) => {
  return res.status(200).end();
});

// ---- POST principal
app.post("/api/plinius/solicitud", async (req, res) => {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.PLINIUS_FROM; // Ej: "Plinius <no-reply@plinius.mx>"
    const toAdmin = process.env.PLINIUS_TO || "luis@plinius.mx";

    if (!apiKey) return res.status(500).json({ ok: false, error: "Falta RESEND_API_KEY" });
    if (!from) return res.status(500).json({ ok: false, error: "Falta PLINIUS_FROM" });

    const payload = req.body || {};

    // Honeypot anti-bot
    if (payload.website && String(payload.website).trim().length > 0) {
      return res.status(200).json({ ok: true });
    }

    // Validación mínima (MVP)
    const contacto = payload.contacto || {};
    const empresa = String(contacto.empresa || "").trim();
    const nombre = String(contacto.nombre || "").trim();
    const email = String(contacto.email || "").trim();
    const telefono = String(contacto.telefono || "").trim();

    if (empresa.length < 2) return res.status(400).json({ ok: false, error: "Empresa requerida" });
    if (nombre.length < 2) return res.status(400).json({ ok: false, error: "Nombre requerido" });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ ok: false, error: "Email inválido" });
    if (telefono.length < 8) return res.status(400).json({ ok: false, error: "Teléfono inválido" });

    const subject = `Solicitud Plinius: ${empresa} · ${payload.monto || ""} · ${payload.plazo || ""}m`;

    const resend = new Resend(apiKey);

    // Admin (siempre a Luis)
    await resend.emails.send({
      from,
      to: toAdmin,
      subject,
      html: adminHtml(payload),
      replyTo: email,
    });

    // Confirmación usuario
    await resend.emails.send({
      from,
      to: email,
      subject: "Plinius — Tu solicitud fue recibida",
      html: userHtml({ nombre }),
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Error /api/plinius/solicitud:", e);
    return res.status(500).json({ ok: false, error: "Error enviando solicitud" });
  }
});

// ---- Fallback explícito para /api
app.all("/api/(.*)", (req, res) => {
  return res.status(404).json({ ok: false, error: "API route not found" });
});

// ---- Helpers email
function adminHtml(payload) {
  return `
  <div style="font-family:Arial,sans-serif;line-height:1.45">
    <h2>Nueva solicitud (Plinius)</h2>
    <pre style="background:#0b0d10;color:#e8edf4;padding:14px;border-radius:10px;white-space:pre-wrap">${escapeHtml(
      JSON.stringify(payload, null, 2)
    )}</pre>
  </div>`;
}

function userHtml({ nombre }) {
  return `
  <div style="font-family:Arial,sans-serif;line-height:1.45">
    <h2>Tu solicitud fue recibida</h2>
    <p>Hola ${escapeHtml(nombre || "")},</p>
    <p>Recibimos tu solicitud. Te daremos respuesta en <b>24 a 48 horas</b>.</p>
    <p style="margin-top:18px">— Equipo Plinius</p>
  </div>`;
}

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// ✅ Vercel serverless export (correcto)
module.exports = app;

// ✅ Local dev (opcional): solo escucha si lo corres directo con node
if (require.main === module) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}
