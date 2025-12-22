function esc(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function moneyMXN(n) {
  try {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(n) || 0);
  } catch {
    return `$${Number(n) || 0} MXN`;
  }
}

function subjectLine(p) {
  const empresa = p?.contacto?.empresa || "Solicitud";
  return `Solicitud Plinius: ${empresa} • ${moneyMXN(p.monto)} • ${p.plazo}m`;
}

function adminHtml(p) {
  const c = p.contacto || {};
  return `
  <div style="font-family:Arial,sans-serif;line-height:1.45">
    <h2>Nueva solicitud (Plinius)</h2>

    <p><b>Empresa:</b> ${esc(c.empresa)}</p>
    <p><b>Contacto:</b> ${esc(c.nombre)} (${esc(c.email)})</p>
    <p><b>Tel:</b> ${esc(c.telefono || "")}</p>
    ${c.rfc ? `<p><b>RFC:</b> ${esc(c.rfc)}</p>` : ""}

    <hr/>

    <p><b>Producto:</b> ${esc(p.producto)} | ${p.conGarantia ? "Con garantía" : "Sin garantía"} | ${esc(p.plazo)} meses</p>
    <p><b>Monto:</b> ${moneyMXN(p.monto)}</p>
    <p><b>Ventas mensuales:</b> ${moneyMXN(p.ventasMensuales || 0)}</p>
    <p><b>EBITDA mensual:</b> ${moneyMXN(p.ebitdaMensual || 0)}</p>

    <p><b>Tasa estimada:</b> ${p.tasaEstimada ?? ""}</p>
    <p><b>Pago:</b> ${p.pago ? moneyMXN(p.pago) : ""}</p>
    <p><b>DSCR:</b> ${p.dscr ? `${Number(p.dscr).toFixed(2)}x` : ""}</p>

    <hr/>

    <p><b>Uso del crédito:</b><br/>${esc(p.uso).replaceAll("\n", "<br/>")}</p>
    <p><b>Industria:</b> ${esc(p.industria || "")}</p>
    <p><b>Antigüedad:</b> ${p.antiguedadAnios ?? ""} años</p>
    <p><b>Estado:</b> ${esc(p.estado || "")}</p>

    <p style="margin-top:18px;font-size:12px;color:#666">
      createdAt: ${esc(p.createdAt || "")}
    </p>
  </div>`;
}

function userHtml(p) {
  const c = p.contacto || {};
  return `
  <div style="font-family:Arial,sans-serif;line-height:1.45">
    <h2>Tu solicitud fue recibida</h2>
    <p>Hola ${esc(c.nombre)},</p>
    <p>Recibimos tu solicitud para <b>${esc(c.empresa)}</b>.</p>
    <p>Te daremos respuesta en <b>24 a 48 horas</b>.</p>
    <p style="margin-top:18px">— Equipo Plinius</p>
  </div>`;
}

module.exports = { subjectLine, adminHtml, userHtml };
