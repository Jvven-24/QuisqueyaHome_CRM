import { NotFoundError } from "../../domain/errors.ts";
import { requireScope, reaches } from "../../domain/rbac.ts";
import type { Actor } from "../../domain/rbac.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { ReposContactos } from "./puertos.ts";
export async function exportContactData(deps: {
    unidad: UnidadDeTrabajo<ReposContactos>;
}, actor: Actor, id: number) {
    const viewScope = requireScope(actor, "contacts", "view");
    const exportScope = requireScope(actor, "contacts", "export");
    return deps.unidad.ejecutar(async ({ contactos, auditoria }) => {
        const row = await contactos.buscarVisible(actor, viewScope, id);
        if (!row || !reaches(actor, exportScope, row.brokerId))
            throw new NotFoundError();
        const data = { nombre: row.fullName, telefono: row.phone, telefonoOriginal: row.phoneDisplay, correo: row.email, pais: row.country, ciudad: row.city, notas: row.notes, ultimaInteraccion: row.lastInteractionAt, consentimiento: { fechaRegistrada: row.consentAt, fuenteRegistrada: row.consentSource, evidenciaPorCanal: "No disponible" }, fechaAlta: row.createdAt };
        await auditoria.registrar(actor, { accion: "exportar", entidad: "contact", entidadId: id, despues: { formato: "json", campos: Object.keys(data) } });
        return data;
    });
}
