/**
 * M10 / M13 · Academy — Casos de uso de escritura (solicitudes de revisión,
 * decisiones administrativas, revocaciones, creación de cursos y matrículas en Moodle).
 *
 * Cumple la regla firmada Q-C1-03:
 * - Ningún broker puede autoaprobarse (`actor.userId !== solicitud.brokerId`).
 * - Toda firma criptográfica SHA-256 se calcula en servidor con `node:crypto`
 *   a partir de la evidencia real leída desde Moodle.
 */

import { createHash } from "node:crypto";
import { ForbiddenError, NotFoundError, ValidationError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import type {
  CrearCursoLmsInput,
  CursoLms,
  PuertoAprendizaje,
} from "../aprendizaje/puertos.ts";
import type {
  ConstanciaAcademy,
  RepositorioAcademy,
  SolicitudRevisionAcademy,
} from "./puertos.ts";

export async function solicitarRevisionCursoAcademy(
  repo: RepositorioAcademy,
  lms: PuertoAprendizaje,
  actor: Actor,
  input: {
    courseCode: string;
    brokerId?: number;
  },
): Promise<SolicitudRevisionAcademy> {
  const targetBrokerId = input.brokerId ?? actor.userId;
  if (actor.roleSlug !== "admin" && targetBrokerId !== actor.userId) {
    throw new ForbiddenError("Solo puedes solicitar revisión para tu propio expediente formativo.");
  }

  const codigoLimpio = input.courseCode.trim();
  if (!codigoLimpio) {
    throw new ValidationError("El código del curso es obligatorio.");
  }

  const [perfil, cursosLms] = await Promise.all([
    repo.obtenerPerfilActor(targetBrokerId),
    lms.listarCursos(),
  ]);

  const curso = cursosLms.find(
    (c) => c.codigo.toUpperCase() === codigoLimpio.toUpperCase() || String(c.id) === codigoLimpio,
  );
  if (!curso) {
    throw new NotFoundError(`Curso "${codigoLimpio}" no encontrado en Quisqueya Academy LMS.`);
  }

  const evidencia = await lms.obtenerEvidencia(
    targetBrokerId,
    curso.id,
    perfil?.moodleUserId ?? undefined,
  );

  const moodleCourseId = typeof curso.id === "number" ? curso.id : Number(curso.id) || 0;
  const progressPercent = evidencia?.progresoPorcentaje ?? 0;
  const gradePercent =
    evidencia?.calificacion !== undefined ? Math.round(evidencia.calificacion) : null;
  const sincronizadoEnIso = (evidencia?.sincronizadoEn ?? new Date()).toISOString();

  const payloadEvidencia: Record<string, unknown> = {
    brokerId: targetBrokerId,
    moodleUserId: evidencia?.moodleUserId ?? perfil?.moodleUserId ?? null,
    courseCode: curso.codigo,
    courseName: curso.nombre,
    moodleCourseId,
    progressPercent,
    gradePercent,
    notaMinima: evidencia?.notaMinima ?? curso.notaMinima ?? 80,
    completadoMoodle: evidencia?.completado ?? false,
    actividadesCompletadas: evidencia?.actividadesCompletadas ?? 0,
    actividadesTotales: evidencia?.actividadesTotales ?? 0,
    sincronizadoEn: sincronizadoEnIso,
    origen: evidencia?.origen ?? "moodle_local",
  };

  const evidenceHash = createHash("sha256")
    .update(JSON.stringify(payloadEvidencia))
    .digest("hex");

  return repo.crearSolicitudRevision(actor, {
    brokerId: targetBrokerId,
    courseCode: curso.codigo,
    courseName: curso.nombre,
    moodleCourseId,
    progressPercent,
    gradePercent,
    evidenceHash,
    evidencePayload: payloadEvidencia,
  });
}

export async function decidirRevisionCursoAcademy(
  repo: RepositorioAcademy,
  actor: Actor,
  input: {
    solicitudId: number;
    decision: "aprobado" | "rechazado";
    motivo: string;
  },
): Promise<{
  solicitud: SolicitudRevisionAcademy;
  constancia: ConstanciaAcademy | null;
}> {
  if (actor.roleSlug !== "admin") {
    throw new ForbiddenError("Solo un Administrador puede aprobar o rechazar solicitudes de certificación.");
  }

  const motivoLimpio = input.motivo.trim();
  if (motivoLimpio.length < 3) {
    throw new ValidationError("Debes indicar un motivo o dictamen de al menos 3 caracteres.");
  }

  return repo.decidirSolicitudRevision(actor, {
    solicitudId: input.solicitudId,
    decision: input.decision,
    motivo: motivoLimpio,
  });
}

export async function revocarConstanciaAcademy(
  repo: RepositorioAcademy,
  actor: Actor,
  input: {
    constanciaId: number;
    motivo: string;
  },
): Promise<ConstanciaAcademy> {
  if (actor.roleSlug !== "admin") {
    throw new ForbiddenError("Solo un Administrador puede revocar constancias de Academy.");
  }

  const motivoLimpio = input.motivo.trim();
  if (motivoLimpio.length < 3) {
    throw new ValidationError("El motivo de revocación debe tener al menos 3 caracteres.");
  }

  return repo.revocarConstancia(actor, {
    constanciaId: input.constanciaId,
    motivo: motivoLimpio,
  });
}

export async function crearCursoAdminAcademy(
  lms: PuertoAprendizaje,
  actor: Actor,
  input: CrearCursoLmsInput,
): Promise<CursoLms> {
  if (actor.roleSlug !== "admin") {
    throw new ForbiddenError("Solo un Administrador puede crear cursos en Quisqueya Academy.");
  }

  const nombre = input.nombre.trim();
  const codigo = input.codigo
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "-");
  const resumen = input.resumen.trim();
  const notaMinima = Math.min(100, Math.max(1, Math.round(input.notaMinima)));

  if (nombre.length < 4) {
    throw new ValidationError("El nombre del curso debe tener al menos 4 caracteres.");
  }
  if (codigo.length < 3) {
    throw new ValidationError("El código corto del curso debe tener al menos 3 caracteres.");
  }
  if (resumen.length < 10) {
    throw new ValidationError("El resumen del curso debe tener al menos 10 caracteres.");
  }

  return lms.crearCurso({
    nombre,
    codigo,
    resumen,
    categoriaId: input.categoriaId ?? 1,
    categoriaNombre: input.categoriaNombre,
    notaMinima,
  });
}

export async function matricularUsuariosAdminAcademy(
  repo: RepositorioAcademy,
  lms: PuertoAprendizaje,
  actor: Actor,
  input: {
    cursoId: number;
    modo: "rol" | "persona";
    roleSlug?: string;
    userIds?: number[];
    rolCurso?: "student" | "editingteacher";
  },
): Promise<{
  matriculados: number;
  usuarios: Array<{ userId: number; fullName: string; moodleUserId: number; rolCurso: string }>;
}> {
  if (actor.roleSlug !== "admin") {
    throw new ForbiddenError("Solo un Administrador puede matricular usuarios en cursos de Academy.");
  }

  if (!Number.isInteger(input.cursoId) || input.cursoId <= 0) {
    throw new ValidationError("El identificador del curso de Moodle es inválido.");
  }

  const todosUsuarios = await repo.listarUsuariosCrm(
    input.modo === "rol" ? input.roleSlug : undefined,
  );

  const seleccionados =
    input.modo === "persona"
      ? todosUsuarios.filter((u) => (input.userIds ?? []).includes(u.id))
      : todosUsuarios;

  if (seleccionados.length === 0) {
    throw new ValidationError("No se encontraron usuarios activos para matricular con el criterio elegido.");
  }

  const matriculasMoodle: Array<{
    moodleUserId: number;
    rolCurso: "student" | "editingteacher";
  }> = [];
  const detalleUsuarios: Array<{
    userId: number;
    fullName: string;
    moodleUserId: number;
    rolCurso: string;
  }> = [];

  for (const u of seleccionados) {
    const sync = await lms.asegurarUsuario({
      localUserId: u.id,
      email: u.email || `user.${u.id}@quisqueyahome.do`,
      fullName: u.fullName,
      roleSlug: u.roleSlug,
      externalIdActual: u.moodleUserId ? String(u.moodleUserId) : null,
    });

    await repo.guardarVinculoMoodle(u.id, sync.moodleUserId);

    const rolCurso: "student" | "editingteacher" =
      input.rolCurso ?? (u.roleSlug === "admin" ? "editingteacher" : "student");

    matriculasMoodle.push({
      moodleUserId: sync.moodleUserId,
      rolCurso,
    });
    detalleUsuarios.push({
      userId: u.id,
      fullName: u.fullName,
      moodleUserId: sync.moodleUserId,
      rolCurso,
    });
  }

  const res = await lms.matricularUsuarios(input.cursoId, matriculasMoodle);

  return {
    matriculados: res.matriculados,
    usuarios: detalleUsuarios,
  };
}
