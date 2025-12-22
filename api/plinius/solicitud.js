cat > api/plinius/solicitud.js <<'EOF'
import { Resend } from "resend";

export default async function handler(req, res) {
  // CORS opcional (si te llega a bloquear navegador)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const body = req.body || {};

    // honeypot anti-bot
    if (body.website && String(body.website).trim().length > 0) {
      return res.status(200).json({ ok: true });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.PLINIUS_FROM; // ej: "Plinius <no-reply@plinius.mx>"
    const toAdmin = process.env.PLINIUS_TO || "luis@plinius.mx";

    if (!apiKey) return res.status(500).json({ ok: false, error: "Falta RESEND_API_KEY" });
    if (!from) return res.status(500).json({ ok: false, error: "Falta PLINIUS_FROM" });

    const c = body.contacto || {};
    const empresa = String(c.empresa || "").trim();
    const nombre = String(c.nombre || "").trim();
    const email = String(c.email || "").trim();
    const telefono = String(c.telefono || "").trim();

    if (empresa.length < 2) return res.status(400).json({ ok: false, error: "Empresa requerida" });
    if (nombre.length < 2) return res.status(400).json({ ok: false, error: "Nombre requerido" });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ ok: false, error: "Email inválido" });
    if (telefono.length < 8) return res.status(400).json({ ok: false, error: "Teléfono inválido" });

    const resend = new Resend(apiKey);

    const subject = `Solicitud Plinius: ${empresa} · ${body.monto || ""} · ${body.plazo || ""}m`;

    // correo admin (siempre a Luis)
    await resend.emails.send({
      from,
      to: toAdmin,
      subject,
      html: `<pre style="font-family:Arial;white-space:pre-wrap">${escapeHtml(
        JSON.stringify(body, null, 2)
      )}</pre>`,
      replyTo: email
    });

    // confirmación al usuario
    await resend.emails.send({
      from,
      to: email,
      subject: "Plinius — Tu solicitud fue recibida",
      html: `<div style="font-family:Arial">
        Hola ${escapeHtml(nombre)}.<br/><br/>
        Recibimos tu solicitud. Te damos respuesta en <b>24 a 48 horas</b>.<br/><br/>
        — Plinius
      </div>`
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Error enviando solicitud" });
  }
}

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
EOF
