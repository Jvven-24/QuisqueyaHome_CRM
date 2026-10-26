import { requireScope, reaches } from "@/domain/rbac";
import { NotFoundError } from "@/domain/errors";
import { exportContactData } from "@/application/contactos/privacidad";
import { requireActor } from "@/infrastructure/auth/actor";
import { contactosParaEscritura } from "@/infrastructure/contenedor/contactos";
import { errorResponse } from "@/infrastructure/http";
export async function GET(_request: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}) {
    try {
        const actor = await requireActor();
        const view = requireScope(actor, "contacts", "view");
        const exportScope = requireScope(actor, "contacts", "export");
        const { id } = await params;
        if (!/^[1-9]\d{0,9}$/.test(id) || Number(id) > 2147483647)
            throw new NotFoundError();
        const deps = contactosParaEscritura();
        const current = await deps.contactos.buscarVisible(actor, view, Number(id));
        if (!current || !reaches(actor, exportScope, current.brokerId))
            throw new NotFoundError();
        const data = await exportContactData(deps, actor, Number(id));
        return Response.json({ contacto: data, alcance: "Ficha de contacto. No incluye negocios, archivos ni comunicaciones.", exportadoEn: new Date().toISOString() }, { headers: { "cache-control": "no-store", "content-disposition": 'attachment; filename="datos-contacto.json"', "x-content-type-options": "nosniff" } });
    }
    catch (error) {
        return errorResponse(error);
    }
}
