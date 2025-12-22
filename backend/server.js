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

app.post("/api/plinius/solicitud", async (req, res) => {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.PLINIUS_FROM;           // ej: Plinius <no-reply@plinius.mx>
    const toAdmin = process.env.PLINIUS_TO || "luis@plinius.mx";

    if (!apiKey) return res.status(500).json({ ok: false, error: "Falta RESEND_API_KEY" });
    if (!from) return res.status(500).json({ ok: false, error: "Falta PLINIUS_FROM" });

    const payload = req.body || {};

    // honeypot anti-bot
    if (payload.website && String(payload.website).trim().length > 0) {
      return res.status(200).json({ ok: true });
    }

    const contacto = payload.contacto || {};
    const subject = `Solicitud Plinius: ${contacto.empresa || "Empresa"} · ${payload.monto || ""} · ${payload.plazo || ""}m`;

    const resend = new Resend(apiKey);

    // correo admin (siempre a Luis)
    await resend.emails.send({
      from,
      to: toAdmin,
      subject,
      html: `<pre style="font-family:Arial;white-space:pre-wrap">${escapeHtml(JSON.stringify(payload, null, 2))}</pre>`,
      replyTo: contacto.email
    });

    // confirmación al usuario
    if (contacto.email) {
      await resend.emails.send({
        from,
        to: contacto.email,
        subject: "Plinius — Tu solicitud fue recibida",
        html: `<div style="font-family:Arial">Hola ${escapeHtml(contacto.nombre || "")}. Recibimos tu solicitud. Respuesta en 24–48h.</div>`
      });
    }

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

// Para Vercel serverless:
module.exports = app;
