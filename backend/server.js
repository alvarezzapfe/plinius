// backend/server.js (Node handler puro - sin express)
module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname;
    const method = (req.method || "GET").toUpperCase();

    // ---- Helpers
    const json = (status, obj) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(obj));
    };

    // ---- ROUTES
    if (path === "/api/health") {
      return json(200, { ok: true, source: "backend/server.js" });
    }

    if (path === "/api/plinius/solicitud" && method === "GET") {
      return json(200, { ok: true, hint: "Use POST /api/plinius/solicitud" });
    }

    if (path === "/api/plinius/solicitud" && method === "OPTIONS") {
      // (por si en algún punto haces CORS)
      res.statusCode = 200;
      return res.end();
    }

    if (path === "/api/plinius/solicitud" && method === "POST") {
      const body = await readJson(req);

      // honeypot anti-bot
      if (body.website && String(body.website).trim().length > 0) {
        return json(200, { ok: true });
      }

      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.PLINIUS_FROM; // "Plinius <no-reply@plinius.mx>"
      const toAdmin = process.env.PLINIUS_TO || "luis@plinius.mx";

      // OJO: /api/health no depende de esto; aquí sí
      if (!apiKey) return json(500, { ok: false, error: "Falta RESEND_API_KEY" });
      if (!from) return json(500, { ok: false, error: "Falta PLINIUS_FROM" });

      const c = body.contacto || {};
      const empresa = String(c.empresa || "").trim();
      const nombre = String(c.nombre || "").trim();
      const email = String(c.email || "").trim();
      const telefono = String(c.telefono || "").trim();

      if (empresa.length < 2) return json(400, { ok: false, error: "Empresa requerida" });
      if (nombre.length < 2) return json(400, { ok: false, error: "Nombre requerido" });
      if (!/^\S+@\S+\.\S+$/.test(email)) return json(400, { ok: false, error: "Email inválido" });
      if (telefono.length < 8) return json(400, { ok: false, error: "Teléfono inválido" });

      const subject = `Solicitud Plinius: ${empresa} · ${body.monto || ""} · ${body.plazo || ""}m`;

      const { Resend } = await loadResend();
      const resend = new Resend(apiKey);

      // Admin (siempre Luis)
      await resend.emails.send({
        from,
        to: toAdmin,
        subject,
        html: `<pre style="font-family:Arial;white-space:pre-wrap">${escapeHtml(
          JSON.stringify(body, null, 2)
        )}</pre>`,
        replyTo: email,
      });

      // Confirmación al usuario
      await resend.emails.send({
        from,
        to: email,
        subject: "Plinius — Tu solicitud fue recibida",
        html: `<div style="font-family:Arial">Hola ${escapeHtml(
          nombre
        )}. Recibimos tu solicitud. Respuesta en 24–48h.</div>`,
      });

      return json(200, { ok: true });
    }

    // fallback
    return json(404, { ok: false, error: "Not found" });
  } catch (e) {
    console.error("SERVERLESS ERROR:", e);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("A server error has occurred");
  }
};

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// evita broncas ESM/CJS con resend
async function loadResend() {
  try {
    const mod = require("resend");
    if (mod?.Resend) return mod;
    if (mod?.default?.Resend) return { Resend: mod.default.Resend };
    return mod;
  } catch {
    const mod = await import("resend");
    if (mod?.Resend) return mod;
    if (mod?.default?.Resend) return { Resend: mod.default.Resend };
    return mod;
  }
}

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
