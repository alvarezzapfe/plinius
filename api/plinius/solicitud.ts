cat > api/plinius/solicitud.ts <<'EOF'
import { Resend } from "resend";
import { z } from "zod";

const BodySchema = z.object({
  producto: z.enum(["simple", "arrendamiento", "revolvente"]),
  conGarantia: z.boolean(),
  plazo: z.number().int().min(6).max(120),
  monto: z.number().min(100_000),
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
    telefono: z.string().min(8),
  }),
});

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export default async function handler(req: any, res: any) {
  // CORS
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

    // body puede venir string u objeto
    let rawBody: any = req.body;
    if (typeof rawBody === "string") {
      try { rawBody = JSON.parse(rawBody); } catch {}
    }

    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Payload inválido", issues: parsed.error.issues });
    }

    const payload = parsed.data;

    // honeypot anti-bot
    if (payload.website && payload.website.trim().length > 0) {
      return res.status(200).json({ ok: true });
    }

    const { contacto } = payload;
    const subject =
      `Solicitud Plinius: ${contacto.empresa} · ${payload.monto.toLocaleString("es-MX")} · ${payload.plazo}m`;

    const resend = new Resend(apiKey);

    // Admin (siempre a Luis)
    await resend.emails.send({
      from,
      to: toAdmin,
      subject,
      replyTo: contacto.email,
      html: `
        <div style="font-family:Arial, sans-serif; line-height:1.45">
          <h2 style="margin:0 0 10px 0">Nueva solicitud recibida</h2>
          <p style="margin:0 0 12px 0"><b>Empresa:</b> ${escapeHtml(contacto.empresa)}</p>
          <p style="margin:0 0 12px 0"><b>Contacto:</b> ${escapeHtml(contacto.nombre)} · ${escapeHtml(contacto.email)} · ${escapeHtml(contacto.telefono)}</p>
          <hr style="border:none;border-top:1px solid #ddd;margin:14px 0"/>
          <pre style="white-space:pre-wrap;background:#0b0d10;color:#dfe4eb;padding:12px;border-radius:10px;overflow:auto">
${escapeHtml(JSON.stringify(payload, null, 2))}
          </pre>
        </div>
      `,
    });

    // Confirmación al usuario
    await resend.emails.send({
      from,
      to: contacto.email,
      subject: "Plinius — Tu solicitud fue recibida",
      html: `
        <div style="font-family:Arial, sans-serif; line-height:1.45">
          <p>Hola ${escapeHtml(contacto.nombre)},</p>
          <p>Recibimos tu solicitud. Te daremos respuesta en <b>24 a 48 horas</b>.</p>
          <p style="color:#666;font-size:12px;margin-top:14px">Este correo es confirmación de recepción y no representa una oferta vinculante.</p>
        </div>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("SOLICITUD_ERROR:", err?.message || err);
    return res.status(500).json({ ok: false, error: "FUNCTION_INVOCATION_FAILED" });
  }
}
EOF
