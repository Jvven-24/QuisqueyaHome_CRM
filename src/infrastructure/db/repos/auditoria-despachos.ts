/**
 * Rastro de despachos de Comunicaciones en `audit_log` (sin tabla nueva).
 * `entity_type = "user"`, `entity_id` = quien envió: el despacho es libre
 * (no cuelga de un contacto ni de una plantilla concreta). El destinatario va
 * enmascarado y el cuerpo del mensaje no se guarda.
 */

import type { AuditoriaDespachos } from "../../../application/comunicaciones/puertos";
import { auditar } from "../../audit";
import { transaction } from "../client";

export function auditoriaDespachosDrizzle(): AuditoriaDespachos {
  return {
    registrar: (actor, registro) =>
      transaction((tx) =>
        auditar(tx, actor, {
          accion: "enviar",
          entidad: "user",
          entidadId: actor.userId,
          despues: {
            canal: registro.canal,
            destinatario: registro.destinatarioEnmascarado,
            ok: registro.ok,
            mensajeId: registro.mensajeId,
            error: registro.error,
            enviadoAt: registro.enviadoAt.toISOString(),
          },
        }),
      ),
  };
}
