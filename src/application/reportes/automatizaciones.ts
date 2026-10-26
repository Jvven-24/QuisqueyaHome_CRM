import { z } from "zod";

/** Contrato de borrador de UI; no representa una automatización activada. */
export const DISPARADORES = ["lead-meta", "lead-nuevo", "negocio-sin-accion", "cambio-etapa"] as const;
export const ACCIONES_FLUJO = ["asignar", "borrador-whatsapp", "crear-tarea", "avisar-supervisor"] as const;
export const FlujoBorrador = z.object({
  nombre: z.string().trim().min(1, "Escribe un nombre.").max(100),
  disparador: z.enum(DISPARADORES),
  condicion: z.string().trim().min(1, "Indica una condición verificable.").max(500),
  acciones: z.array(z.enum(ACCIONES_FLUJO)).min(1, "Elige al menos una acción.").max(4),
});
export type BorradorFlujo = z.infer<typeof FlujoBorrador>;
export const PLANTILLAS_FLUJO: readonly BorradorFlujo[] = [
  { nombre: "Bienvenida desde Meta", disparador: "lead-meta", condicion: "Contacto con consentimiento y responsable disponible", acciones: ["asignar", "borrador-whatsapp", "crear-tarea"] },
  { nombre: "Seguimiento sin próxima acción", disparador: "negocio-sin-accion", condicion: "Negocio abierto sin actividad pendiente", acciones: ["crear-tarea", "avisar-supervisor"] },
];
export const NOMBRES_DISPARADOR: Record<typeof DISPARADORES[number], string> = { "lead-meta": "Lead recibido desde Meta", "lead-nuevo": "Lead nuevo", "negocio-sin-accion": "Negocio sin próxima acción", "cambio-etapa": "Cambio de etapa" };
export const NOMBRES_ACCION: Record<typeof ACCIONES_FLUJO[number], string> = { asignar: "Asignar responsable", "borrador-whatsapp": "Preparar WhatsApp para revisión", "crear-tarea": "Crear tarea (plazo por configurar)", "avisar-supervisor": "Avisar al supervisor" };

export function validarFlujo(entrada: unknown): { ok: true; borrador: BorradorFlujo } | { ok: false; errores: string[] } {
  const r = FlujoBorrador.safeParse(entrada);
  return r.success ? { ok: true, borrador: r.data } : { ok: false, errores: r.error.issues.map((i) => i.message) };
}

export function resumenCalidad(faltanMontos: number, faltanProbabilidades: number) {
  return [
    { nombre: "Negocios sin monto en la proyección", valor: faltanMontos },
    { nombre: "Negocios sin probabilidad válida en la proyección", valor: faltanProbabilidades },
    { nombre: "Duplicados", valor: null },
    { nombre: "Leads sin responsable", valor: null },
  ];
}
