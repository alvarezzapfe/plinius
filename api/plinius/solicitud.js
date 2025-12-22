import { Resend } from "resend";
import { z } from "zod";

export const config = { runtime: "nodejs" };

const BodySchema = z.object({
  producto: z.enum(["simple", "arrendamiento", "revolvente"]),
  conGarantia: z.boolean(),
  plazo: z.number().int().min(6).max(120),
  monto: z.number().min(100000),
  ventasMensuales: z.number().optional(),
  ebitdaMensual: z.number().optional(),
  tasaEstimada: z.number().optional(),
  pago: z.number().optional(),
  dscr: z.number().optional(),
  uso: z.string().max(800).optional().default(""),
  website: z.string().optional().default(""), // honeypot
  contacto: z.object({
    empresa: z.string().min(2),
    rfc: z.string().optional().default(""),
    nombre: z.string().min(2),
    email: z.string().email(),
    telefono: z.string().min(8)
  })
});

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export default async function handler(req, res) {
  // CORS (por si pega desde browser)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method Not Allowed" });

  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.PLINIUS_FROM; // Ej: "Plinius <no-reply@plinius.mx>"
    const toAdmin = process.env.PLINIUS_TO || "luis@plinius.mx";

    if (!apiKey) return res.status(500).json({ ok: false, error: "Falta RESEND_API_KEY" });
    if (!from) return res.status(500).json({ ok: false, error: "Falta PLINIUS_FROM" });

    // body puede venir objeto o string
    let raw = req.body;
    if (typeof raw === "string") {
      try { raw = JSON.parse(raw); } catch {}
    }

    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Payload inválido", issues: parsed.error.issues });
    }

    const payload = parsed.data;

    // honeypot
    if (payload.website && payload.website.trim().length > 0) {
      return res.status(200).json({ ok: true });
    }

    const c = payload.contacto;
    const subject = `Solicitud Plinius: ${c.empresa} · ${payload.monto.toLocaleString("es-MX")} · ${payload.plazo}m`;

    const resend = new Resend(apiKey);

    // Admin (Luis)
    await resend.emails.send({
      from,
      to: toAdmin,
      subject,
      replyTo: c.email,
      html: `<pre style="font-family:Arial;white-space:pre-wrap">${escapeHtml(
        JSON.stringify(payload, null, 2)
      )}</pre>`
    });

    // Usuario
    await resend.emails.send({
      from,
      to: c.email,
      subject: "Plinius — Tu solicitud fue recibida",
      html: `<div style="font-family:Arial">
        Hola ${escapeHtml(c.nombre)}.<br/><br/>
        Recibimos tu solicitud. Te damos respuesta en <b>24 a 48 horas</b>.<br/><br/>
        — Plinius
      </div>`
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("SOLICITUD_ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error enviando solicitud" });
  }
}