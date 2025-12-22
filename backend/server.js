// backend/server.js
const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/api/plinius/solicitud", (req, res) => {
  res.status(200).json({ ok: true, hint: "Use POST /api/plinius/solicitud" });
});

app.options("/api/plinius/solicitud", (req, res) => res.status(200).end());

app.post("/api/plinius/solicitud", async (req, res) => {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.PLINIUS_FROM;
    const toAdmin = process.env.PLINIUS_TO || "luis@plinius.mx";

    if (!apiKey) return res.status(500).json({ ok: false, error: "Falta RESEND_API_KEY" });
    if (!from) return res.status(500).json({ ok: false, error: "Falta PLINIUS_FROM" });

    const payload = req.body || {};
    if (payload.website && String(payload.website).trim().length > 0) return res.status(200).json({ ok: true });

    const c = payload.contacto || {};
    const empresa = String(c.empresa || "").trim();
    const nombre = String(c.nombre || "").trim();
    const email = String(c.email || "").trim();
    const telefono = String(c.telefono || "").trim();

    if (empresa.length < 2) return res.status(400).json({ ok: false, error: "Empresa requerida" });
    if (nombre.length < 2) return res.status(400).json({ ok: false, error: "Nombre requerido" });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ ok: false, error: "Email inválido" });
    if (telefono.length < 8) return res.status(400).json({ ok: false, error: "Teléfono inválido" });

    const resend = new Resend(apiKey);
    const subject = `Solicitud Plinius: ${empresa} · ${payload.monto || ""} · ${payload.plazo || ""}m`;

    await resend.emails.send({
      from,
      to: toAdmin,
      subject,
      html: `<pre style="font-family:Arial;white-space:pre-wrap">${escapeHtml(
        JSON.stringify(payload, null, 2)
      )}</pre>`,
      replyTo: email
    });

    await resend.emails.send({
      from,
      to: email,
      subject: "Plinius — Tu solicitud fue recibida",
      html: `<div style="font-family:Arial">Hola ${escapeHtml(nombre)}. Recibimos tu solicitud. Respuesta en 24–48h.</div>`
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Error enviando solicitud" });
  }
});

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// 👇 Esto es CLAVE para @vercel/node (evita ciertos crashes)
module.exports = (req, res) => app(req, res);
