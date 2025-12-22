const express = require("express");
const { Resend } = require("resend");

const { solicitudSchema } = require("./plinius/solicitud.schema");
const { subjectLine, adminHtml, userHtml } = require("./plinius/templates");

const app = express();
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

const resend = new Resend(process.env.RESEND_API_KEY);

app.post("/api/plinius/solicitud", async (req, res) => {
  try {
    const parsed = solicitudSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: "Datos inválidos",
        details: parsed.error.flatten(),
      });
    }

    const payload = parsed.data;

    // Honeypot anti-bot
    if (payload.website && payload.website.trim().length > 0) {
      return res.json({ ok: true });
    }

    const from = process.env.PLINIUS_FROM;
    const to = process.env.PLINIUS_TO || "luis@plinius.mx";

    if (!process.env.RESEND_API_KEY) return res.status(500).json({ ok: false, error: "Falta RESEND_API_KEY" });
    if (!from) return res.status(500).json({ ok: false, error: "Falta PLINIUS_FROM" });

    // 1) Admin a Luis SIEMPRE
    await resend.emails.send({
      from,
      to,
      subject: subjectLine(payload),
      html: adminHtml(payload),
      replyTo: payload.contacto.email,
    });

    // 2) Confirmación al usuario
    await resend.emails.send({
      from,
      to: payload.contacto.email,
      subject: "Plinius — Tu solicitud fue recibida",
      html: userHtml(payload),
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Error enviando solicitud" });
  }
});

module.exports = app;
