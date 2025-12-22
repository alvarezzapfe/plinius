const { Resend } = require("resend");

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.PLINIUS_FROM; // ej: Plinius <no-reply@plinius.mx>
    const toAdmin = process.env.PLINIUS_TO || "luis@plinius.mx";

    if (!apiKey) return res.status(500).json({ ok: false, error: "Falta RESEND_API_KEY" });
    if (!from) return res.status(500).json({ ok: false, error: "Falta PLINIUS_FROM" });

    const payload = req.body || {};
    const contacto = payload.contacto || {};

    // honeypot anti-bot
    if (payload.website && String(payload.website).trim().length > 0) {
      return res.status(200).json({ ok: true });
    }

    const resend = new Resend(apiKey);

    const subject = `Solicitud Plinius: ${contacto.empresa || "Empresa"} · ${payload.monto || ""} · ${payload.plazo || ""}m`;

    await resend.emails.send({
      from,
      to: toAdmin,
      subject,
      html: `<pre style="font-family:Arial;white-space:pre-wrap">${escapeHtml(
        JSON.stringify(payload, null, 2)
      )}</pre>`,
      replyTo: contacto.email,
    });

    // confirmación al usuario
    if (contacto.email) {
      await resend.emails.send({
        from,
        to: contacto.email,
        subject: "Plinius — Tu solicitud fue recibida",
        html: `<div style="font-family:Arial">Hola ${escapeHtml(
          contacto.nombre || ""
        )}. Recibimos tu solicitud. Respuesta en 24–48h.</div>`,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Error enviando solicitud" });
  }
};

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
