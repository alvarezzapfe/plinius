// api/plinius/solicitud.js
import { Resend } from "resend";
import { z } from "zod";

const Email = z.string().trim().email().max(254);
const Phone = z.string().trim().min(8).max(18);

const SolicitudSchema = z.object({
  producto: z.enum(["simple", "arrendamiento", "revolvente"]),
  conGarantia: z.boolean(),
  plazo: z.number().int().min(6).max(120),
  monto: z.number().int().min(100000).max(100000000),
  ventasMensuales: z.number().int().min(0).max(200000000),
  ebitdaMensual: z.number().int().min(0).max(50000000),

  tasaEstimada: z.number().min(0).max(100).optional(),
  pago: z.number().min(0).max(100000000).optional(),
  dscr: z.number().min(0).max(100).optional(),

  objetivo: z.object({
    uso: z.array(z.string().max(40)).min(1).max(8),
    perfil: z.array(z.string().max(40)).max(10).default([]),
    timing: z.string().max(40).default("normal"),
  }),

  contacto: z.object({
    empresa: z.string().trim().min(2).max(120),
    rfc: z.string().trim().max(13).optional().default(""),
    nombre: z.string().trim().min(2).max(80),
    email: Email,
    telefono: Phone,
  }),

  website: z.string().optional().default(""),
  createdAt: z.string().optional(),
});

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeText(s = "", max = 600) {
  // quita control chars + limita
  const cleaned = String(s)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

  // neutraliza ángulos para que no se “vea” como HTML
  return cleaned.replace(/[<>]/g, "");
}

export default async function handler(req, res) {
  // CORS básico
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");

  if (req.method === "OPTIONS") return res.end();
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });

  try {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.PLINIUS_FROM; // Ej: "Plinius <no-reply@plinius.mx>"
    const toAdmin = process.env.PLINIUS_TO || "luis@plinius.mx";

    if (!apiKey) return json(res, 500, { ok: false, error: "Falta RESEND_API_KEY" });
    if (!from) return json(res, 500, { ok: false, error: "Falta PLINIUS_FROM" });

    const raw = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

    // honeypot anti-bot
    if (raw.website && String(raw.website).trim().length > 0) {
      return json(res, 200, { ok: true });
    }

    // Validación fuerte
    const parsed = SolicitudSchema.parse(raw);

    // Sanitiza campos “humanos” (defensa extra)
    parsed.contacto.empresa = sanitizeText(parsed.contacto.empresa, 120);
    parsed.contacto.nombre = sanitizeText(parsed.contacto.nombre, 80);
    parsed.contacto.rfc = sanitizeText((parsed.contacto.rfc || "").toUpperCase(), 13);
    parsed.contacto.telefono = sanitizeText(parsed.contacto.telefono, 18);

    // Construye resumen
    const usoLabels = parsed.objetivo.uso.join(", ");
    const subject = `Solicitud Plinius: ${parsed.contacto.empresa} · ${parsed.monto} · ${parsed.plazo}m`;

    const resend = new Resend(apiKey);

    // Admin (a Luis)
    await resend.emails.send({
      from,
      to: toAdmin,
      subject,
      replyTo: parsed.contacto.email, // para que Luis responda directo al solicitante
      text:
`Solicitud Plinius

Empresa: ${parsed.contacto.empresa}
RFC: ${parsed.contacto.rfc || "-"}
Contacto: ${parsed.contacto.nombre}
Email: ${parsed.contacto.email}
Tel: ${parsed.contacto.telefono}

Producto: ${parsed.producto}
Garantía: ${parsed.conGarantia ? "Sí" : "No"}
Plazo: ${parsed.plazo} meses
Monto: ${parsed.monto}
Ventas mensuales: ${parsed.ventasMensuales}
EBITDA mensual: ${parsed.ebitdaMensual}

Objetivo (uso): ${usoLabels}
Perfil: ${parsed.objetivo.perfil.join(", ") || "-"}
Urgencia: ${parsed.objetivo.timing}

Meta (indicativo):
Tasa estimada: ${parsed.tasaEstimada ?? "-"}
Pago: ${parsed.pago ?? "-"}
DSCR: ${parsed.dscr ?? "-"}
`,
      html: `
<div style="font-family:Arial, sans-serif; color:#111; line-height:1.5">
  <h2 style="margin:0 0 8px 0">Solicitud Plinius</h2>
  <div style="margin:0 0 12px 0; color:#444">Resumen</div>
  <pre style="background:#f6f7f9; padding:12px; border-radius:10px; white-space:pre-wrap; word-break:break-word; border:1px solid #e7e9ee">
${escapeHtml(JSON.stringify(parsed, null, 2))}
  </pre>
</div>`.trim(),
    });

    // Confirmación al usuario (✅ sí se puede y no es complejo)
    await resend.emails.send({
      from,
      to: parsed.contacto.email,
      subject: "Plinius — Recibimos tu solicitud",
      replyTo: toAdmin, // que respondan a Luis
      text:
`Hola ${parsed.contacto.nombre},

Recibimos tu solicitud y ya la estamos revisando.
Te respondemos lo antes posible (normalmente 24–48 horas).

— Plinius
`,
      html: `
<div style="font-family:Arial, sans-serif; color:#111; line-height:1.6">
  <div style="font-weight:800; font-size:18px; margin-bottom:6px">Plinius</div>
  <div style="font-size:16px; margin-bottom:10px">Hola ${escapeHtml(parsed.contacto.nombre)},</div>
  <div style="margin-bottom:10px">Recibimos tu solicitud y ya la estamos revisando.</div>
  <div style="margin-bottom:14px">Te respondemos lo antes posible (normalmente <b>24–48 horas</b>).</div>
  <div style="color:#666; font-size:13px">Si quieres acelerar, responde este correo con estados financieros o ventas de los últimos 12 meses.</div>
</div>`.trim(),
    });

    return json(res, 200, { ok: true });
  } catch (err) {
    // Zod error
    if (err?.name === "ZodError") {
      return json(res, 400, { ok: false, error: "Payload inválido", issues: err.issues });
    }
    console.error(err);
    return json(res, 500, { ok: false, error: "Error enviando solicitud" });
  }
}
