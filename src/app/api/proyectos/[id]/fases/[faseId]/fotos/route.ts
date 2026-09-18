/**
 * M6 · Avances de obra — subida de fotos a Supabase Storage
 * (`docs/F3_ANALISIS_Y_PLAN.md` §3 hallazgo 3, decisión #33, issue #32).
 *
 * `multipart/form-data`, campo `foto` (uno o varios). Cada archivo se valida
 * (`domain/avance-obra.ts#validarFoto`: imagen, ≤ 10 MB) antes de subir nada.
 * `adminClient()` porque el bucket `avances-obra` es privado (decisión #33):
 * solo el servidor, ya autorizado por `requireScope`, puede escribir en él.
 *
 * Sin `SUPABASE_SERVICE_ROLE_KEY` (`infrastructure/env.ts`), `adminClient()`
 * lanza un error ya en español — se atrapa aquí y se traduce a 409 en vez de
 * dejarlo caer al 500 genérico de `errorResponse`, que lo cambiaría por
 * "Ocurrió un error inesperado" (mismo criterio que T8, hallazgo 3 de F3).
 *
 * La subida a Storage ocurre fuera de la transacción de Postgres (es una
 * llamada de red aparte, no se puede meter dentro de un `BEGIN`); si el
 * `INSERT` en `files` falla después de subir, se intenta borrar el objeto ya
 * subido — mejor esfuerzo, sin bloquear la respuesta de error por eso.
 *
 * El nombre del objeto en Storage sale del MIME ya validado
 * (`FOTO_MIME_EXTENSIONES`), nunca del nombre de archivo del cliente: ese
 * nombre solo se guarda como `files.name` (metadato), no como parte de la
 * ruta (revisión de calidad de M6).
 *
 * `content-length` se comprueba antes de `request.formData()`: sin este
 * límite, un cliente puede anunciar un body enorme y forzar a Next a
 * bufferizarlo entero antes de que `validarFoto` tenga oportunidad de
 * rechazar nada. El límite es 25 MB por subida (unas pocas fotos de ≤ 10 MB
 * cada una, que es el límite por foto de `domain/avance-obra.ts`).
 */

import { ConflictError, NotFoundError, ValidationError } from "@/domain/errors";
import { FOTO_MIME_EXTENSIONES, validarFoto } from "@/domain/avance-obra";
import { requireScope } from "@/domain/rbac";
import { adminClient } from "@/infrastructure/auth/supabase";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { getDb, transaction } from "@/infrastructure/db/client";
import { files } from "@/infrastructure/db/schema";
import { errorResponse } from "@/infrastructure/http";
import { faseVisible, idsDeRuta } from "../../_fase";

const BUCKET = "avances-obra";
const TAMANO_MAXIMO_SUBIDA_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request, { params }: { params: Promise<{ id: string; faseId: string }> }) {
  const listos: { path: string; archivo: File }[] = [];
  let admin: ReturnType<typeof adminClient> | undefined;

  try {
    const { id: idParam, faseId: faseIdParam } = await params;
    const [projectId, faseId] = idsDeRuta(idParam, faseIdParam);

    const actor = await requireActor();
    const scope = requireScope(actor, "construction_phases", "edit");

    const fase = await faseVisible(getDb(), actor, scope, projectId, faseId);
    if (!fase) throw new NotFoundError();

    const largoDeclarado = Number(request.headers.get("content-length") ?? "0");
    if (largoDeclarado > TAMANO_MAXIMO_SUBIDA_BYTES) {
      return Response.json({ error: "El total de las fotos no puede superar 25 MB por subida." }, { status: 413 });
    }

    const formData = await request.formData();
    const archivos = formData.getAll("foto").filter((valor): valor is File => valor instanceof File && valor.size > 0);
    if (archivos.length === 0) {
      throw new ValidationError("Selecciona al menos una foto.", { foto: "Selecciona al menos una foto." });
    }
    for (const archivo of archivos) {
      const error = validarFoto(archivo.type, archivo.size);
      if (error) throw new ValidationError(error, { foto: error });
    }

    try {
      admin = adminClient();
    } catch (error) {
      throw new ConflictError(error instanceof Error ? error.message : "No se pudo preparar la subida de fotos.");
    }

    for (const archivo of archivos) {
      // La extensión sale del MIME ya validado, no del nombre que manda el
      // cliente (comentario de arriba) — `validarFoto` ya garantizó que
      // `archivo.type` está en `FOTO_MIME_EXTENSIONES`.
      const path = `proyecto-${projectId}/fase-${faseId}/${crypto.randomUUID()}${FOTO_MIME_EXTENSIONES[archivo.type]}`;
      const { error } = await admin.storage.from(BUCKET).upload(path, archivo, { contentType: archivo.type });
      if (error) throw new ConflictError(`No se pudo subir "${archivo.name}": ${error.message}`);
      listos.push({ path, archivo });
    }

    const fotos = await transaction(async (tx) => {
      const insertadas = [];
      for (const { path, archivo } of listos) {
        const [fila] = await tx
          .insert(files)
          .values({
            entityType: "construction_phase",
            entityId: faseId,
            name: archivo.name,
            url: path,
            mimeType: archivo.type,
            sizeBytes: archivo.size,
            visibility: "public",
            uploadedBy: actor.userId,
          })
          .returning();
        await auditar(tx, actor, { accion: "crear", entidad: "file", entidadId: fila!.id, despues: fila });
        insertadas.push(fila!);
      }
      return insertadas;
    });

    return Response.json({ ok: true, fotos });
  } catch (error) {
    // Mejor esfuerzo: si el insert en `files` falló después de subir a
    // Storage, no dejar el objeto huérfano. Un fallo aquí no debe tapar el
    // error real que ya se va a responder.
    if (listos.length > 0 && admin) {
      await admin.storage
        .from(BUCKET)
        .remove(listos.map((l) => l.path))
        .catch(() => {});
    }
    return errorResponse(error);
  }
}
