import { z } from "zod";
import { ConflictError, NotFoundError, ValidationError } from "../../domain/errors.ts";
import { requireScope, reaches, type Actor } from "../../domain/rbac.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { ReposLeads } from "./puertos.ts";
const amount = z.number({ error: "Indica un importe numérico." }).int("Usa centavos enteros.").nonnegative("El importe no puede ser negativo.").max(Number.MAX_SAFE_INTEGER, "Importe fuera de rango.").nullable();
export const QualificationInput = z.object({ budgetMinCents: amount, budgetMaxCents: amount, currency: z.string().regex(/^[A-Z]{3}$/, "Indica una moneda de tres letras."), projectInterestText: z.string().trim().max(500).nullable(), zoneInterest: z.string().trim().max(200).nullable(), operationType: z.enum(["sale", "rent"]).nullable() }).strict().refine(v => v.budgetMinCents === null || v.budgetMaxCents === null || v.budgetMinCents <= v.budgetMaxCents, { message: "El máximo no puede ser menor al mínimo.", path: ["budgetMaxCents"] });
export type QualificationData = z.infer<typeof QualificationInput>;
export async function qualifyLead(deps: {
    unidad: UnidadDeTrabajo<ReposLeads>;
}, actor: Actor, id: number, input: unknown) {
    const scope = requireScope(actor, "leads", "edit");
    const view = requireScope(actor, "leads", "view");
    const parsed = QualificationInput.safeParse(input);
    if (!parsed.success)
        throw new ValidationError("Revisa la calificación.", Object.fromEntries(parsed.error.issues.map(i => [i.path.join("."), i.message])));
    return deps.unidad.ejecutar(async ({ leads, auditoria }) => {
        const before = await leads.buscarLeadParaConversion(id, actor, scope);
        if (!before || !reaches(actor, view, before.brokerId))
            throw new NotFoundError();
        if (before.status === "converted" || before.status === "discarded")
            throw new ConflictError("La calificación no se modifica en leads convertidos o descartados.");
        const after = await leads.actualizarCalificacion(id, parsed.data, actor.userId);
        await auditoria.registrar(actor, { accion: "editar", entidad: "lead", entidadId: id, antes: before, despues: after });
        return after;
    });
}

/** Conversión exacta desde el formulario: evita redondear dinero con coma flotante. */
export function parseCurrencyCents(raw:string):number|null {
 const value=raw.trim();if(!value)return null;
 if(!/^\d{1,14}(?:\.\d{1,2})?$/.test(value))return NaN;
 const [whole,fraction=""]=value.split(".");
 const cents=BigInt(whole!)*100n+BigInt(fraction.padEnd(2,"0"));
 return cents>BigInt(Number.MAX_SAFE_INTEGER)?NaN:Number(cents);
}
