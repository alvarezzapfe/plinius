const { z } = require("zod");

const solicitudSchema = z.object({
  producto: z.enum(["simple", "arrendamiento", "revolvente"]),
  conGarantia: z.boolean(),
  plazo: z.number().int().min(6).max(120),

  monto: z.number().positive(),
  ventasMensuales: z.number().nonnegative().optional(),
  ebitdaMensual: z.number().nonnegative().optional(),

  tasaEstimada: z.number().min(0).max(100).optional(),
  pago: z.number().nonnegative().optional(),
  dscr: z.number().nonnegative().optional(),

  uso: z.string().min(3).max(800),
  industria: z.string().max(80).optional().or(z.literal("")),
  antiguedadAnios: z.number().int().min(0).max(99).optional(),
  estado: z.string().max(60).optional().or(z.literal("")),

  contacto: z.object({
    empresa: z.string().min(2).max(160),
    rfc: z.string().max(13).optional().or(z.literal("")),
    nombre: z.string().min(2).max(120),
    email: z.string().email().max(120),
    telefono: z.string().min(8).max(30),
  }),

  website: z.string().optional().or(z.literal("")),
  createdAt: z.string().optional(),
});

module.exports = { solicitudSchema };
