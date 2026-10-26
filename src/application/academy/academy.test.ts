import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { ForbiddenError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { AprendizajeEnMemoria } from "../aprendizaje/en-memoria.ts";
import {
  crearCursoAdminAcademy,
  decidirRevisionCursoAcademy,
  matricularUsuariosAdminAcademy,
  revocarConstanciaAcademy,
  solicitarRevisionCursoAcademy,
} from "./comandos.ts";
import type {
  ConstanciaAcademy,
  ItemAcademy,
  PerfilActorAcademy,
  RepositorioAcademy,
  ResumenProgresoAcademy,
  SolicitudRevisionAcademy,
  UsuarioCrmAcademy,
} from "./puertos.ts";

class RepositorioAcademyEnMemoria implements RepositorioAcademy {
  public solicitudes: SolicitudRevisionAcademy[] = [];
  public constancias: ConstanciaAcademy[] = [];
  public vinculosMoodle: Map<number, number> = new Map();
  public usuarios: UsuarioCrmAcademy[] = [
    {
      id: 1,
      fullName: "Admin de Prueba",
      email: "admin.prueba@quisqueyahome.do",
      roleSlug: "admin",
      moodleUserId: 6,
      proyectosCount: 0,
    },
    {
      id: 2,
      fullName: "Broker de Prueba",
      email: "broker.prueba@quisqueyahome.do",
      roleSlug: "broker",
      moodleUserId: 8,
      proyectosCount: 3,
    },
  ];

  async listarContenidos(): Promise<ItemAcademy[]> {
    return [];
  }
  async obtenerContenidoPorId(): Promise<ItemAcademy | null> {
    return null;
  }
  async actualizarProgreso(_u: number, _i: number, progressPercent: number, isCompleted: boolean) {
    return { progressPercent, isCompleted };
  }
  async marcarPasoChecklist(_u: number, _c: number, isCompleted: boolean) {
    return isCompleted;
  }
  async obtenerResumenProgreso(): Promise<ResumenProgresoAcademy> {
    return { totalItems: 0, completedItems: 0, percent: 0 };
  }
  async obtenerPerfilActor(userId: number): Promise<PerfilActorAcademy | null> {
    const u = this.usuarios.find((x) => x.id === userId);
    if (!u) return null;
    return {
      userId: u.id,
      fullName: u.fullName,
      email: u.email,
      roleSlug: u.roleSlug,
      moodleUserId: u.moodleUserId,
      proyectosAsignados:
        u.roleSlug === "broker"
          ? [{ id: 1, name: "Olea at Cap Cana", zone: "Cap Cana" }]
          : [],
    };
  }
  async listarUsuariosCrm(filtroRol?: string): Promise<UsuarioCrmAcademy[]> {
    return this.usuarios.filter((u) => !filtroRol || u.roleSlug === filtroRol);
  }
  async guardarVinculoMoodle(localUserId: number, moodleUserId: number): Promise<void> {
    this.vinculosMoodle.set(localUserId, moodleUserId);
  }
  async listarSolicitudesRevision(brokerIdFiltro?: number): Promise<SolicitudRevisionAcademy[]> {
    return this.solicitudes.filter(
      (s) => brokerIdFiltro === undefined || s.brokerId === brokerIdFiltro,
    );
  }
  async obtenerSolicitudRevisionPorId(id: number): Promise<SolicitudRevisionAcademy | null> {
    return this.solicitudes.find((s) => s.id === id) ?? null;
  }
  async crearSolicitudRevision(
    _actor: Actor,
    datos: {
      brokerId: number;
      courseCode: string;
      courseName: string;
      moodleCourseId: number;
      progressPercent: number;
      gradePercent: number | null;
      evidenceHash: string;
      evidencePayload: Record<string, unknown>;
    },
  ): Promise<SolicitudRevisionAcademy> {
    const u = this.usuarios.find((x) => x.id === datos.brokerId);
    const nueva: SolicitudRevisionAcademy = {
      id: this.solicitudes.length + 1,
      publicId: `00000000-0000-4000-8000-${String(this.solicitudes.length + 1).padStart(12, "0")}`,
      brokerId: datos.brokerId,
      brokerNombre: u?.fullName ?? "Broker",
      brokerEmail: u?.email ?? "broker@quisqueyahome.do",
      courseCode: datos.courseCode,
      courseName: datos.courseName,
      moodleCourseId: datos.moodleCourseId,
      progressPercent: datos.progressPercent,
      gradePercent: datos.gradePercent,
      evidenceHash: datos.evidenceHash,
      evidencePayload: datos.evidencePayload,
      status: "pendiente",
      decisionBy: null,
      decisionByNombre: null,
      decisionReason: null,
      decidedAt: null,
      createdAt: new Date(),
    };
    this.solicitudes.push(nueva);
    return nueva;
  }
  async decidirSolicitudRevision(
    actor: Actor,
    datos: {
      solicitudId: number;
      decision: "aprobado" | "rechazado";
      motivo: string;
    },
  ) {
    const sol = this.solicitudes.find((s) => s.id === datos.solicitudId);
    if (!sol) throw new Error("Solicitud no encontrada");
    if (actor.userId === sol.brokerId) {
      throw new ForbiddenError(
        "Regla Q-C1-03: ningún usuario puede aprobar o decidir su propia solicitud de certificación.",
      );
    }
    sol.status = datos.decision;
    sol.decisionBy = actor.userId;
    sol.decisionByNombre = "Admin de Prueba";
    sol.decisionReason = datos.motivo;
    sol.decidedAt = new Date();

    let constancia: ConstanciaAcademy | null = null;
    if (datos.decision === "aprobado") {
      const snapshot = {
        solicitudPublicId: sol.publicId,
        brokerId: sol.brokerId,
        courseCode: sol.courseCode,
        evidenceHash: sol.evidenceHash,
        approvedBy: actor.userId,
      };
      const hash = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
      constancia = {
        id: this.constancias.length + 1,
        publicId: `11111111-1111-4111-8111-${String(this.constancias.length + 1).padStart(12, "0")}`,
        reviewRequestId: sol.id,
        brokerId: sol.brokerId,
        brokerNombre: sol.brokerNombre,
        brokerEmail: sol.brokerEmail,
        courseCode: sol.courseCode,
        courseName: sol.courseName,
        verificationCode: `QHA-2026-000${sol.id}-${hash.slice(0, 6).toUpperCase()}`,
        cryptographicHash: hash,
        evidenceSnapshot: snapshot,
        approvedBy: actor.userId,
        approvedByNombre: "Admin de Prueba",
        status: "vigente",
        revokedBy: null,
        revokedReason: null,
        revokedAt: null,
        issuedAt: new Date(),
      };
      this.constancias.push(constancia);
    }
    return { solicitud: sol, constancia };
  }
  async revocarConstancia(
    actor: Actor,
    datos: { constanciaId: number; motivo: string },
  ): Promise<ConstanciaAcademy> {
    const cert = this.constancias.find((c) => c.id === datos.constanciaId);
    if (!cert) throw new Error("Constancia no encontrada");
    if (actor.userId === cert.brokerId) {
      throw new ForbiddenError("Regla Q-C1-03: prohibido autogestionar constancias.");
    }
    cert.status = "revocada";
    cert.revokedBy = actor.userId;
    cert.revokedReason = datos.motivo;
    cert.revokedAt = new Date();
    return cert;
  }
  async listarConstancias(brokerIdFiltro?: number): Promise<ConstanciaAcademy[]> {
    return this.constancias.filter(
      (c) => brokerIdFiltro === undefined || c.brokerId === brokerIdFiltro,
    );
  }
}

const actorAdmin: Actor = {
  userId: 1,
  roleSlug: "admin",
  permissions: [
    { resource: "academy", action: "view", scope: "all" },
    { resource: "academy", action: "edit", scope: "all" },
  ],
};

const actorBroker: Actor = {
  userId: 2,
  roleSlug: "broker",
  permissions: [{ resource: "academy", action: "view", scope: "own" }],
};

test("Academy Q-C1-03: broker solicita revisión con hash SHA-256 de evidencia Moodle y admin distinto aprueba y emite constancia", async () => {
  const repo = new RepositorioAcademyEnMemoria();
  const lms = new AprendizajeEnMemoria();

  const curso = await crearCursoAdminAcademy(lms, actorAdmin, {
    nombre: "Inducción Quisqueya Home — Asesor inmobiliario en Punta Cana",
    codigo: "QHA-IND-PC",
    resumen: "Programa oficial de inducción comercial y legal CONFOTUR en Punta Cana.",
    categoriaId: 1,
    notaMinima: 80,
  });

  lms.evidencias.set(`2:${curso.id}`, {
    usuarioId: 2,
    moodleUserId: 8,
    cursoId: curso.id,
    cursoCodigo: "QHA-IND-PC",
    completado: true,
    calificacion: 90,
    notaMinima: 80,
    progresoPorcentaje: 100,
    actividadesCompletadas: 6,
    actividadesTotales: 6,
    sincronizadoEn: new Date("2026-10-18T07:00:00Z"),
    origen: "moodle_local",
  });

  const solicitud = await solicitarRevisionCursoAcademy(repo, lms, actorBroker, {
    courseCode: "QHA-IND-PC",
  });

  assert.equal(solicitud.brokerId, 2);
  assert.equal(solicitud.progressPercent, 100);
  assert.equal(solicitud.gradePercent, 90);
  assert.equal(solicitud.evidenceHash.length, 64);

  // Un broker no puede aprobar solicitudes
  await assert.rejects(
    () =>
      decidirRevisionCursoAcademy(repo, actorBroker, {
        solicitudId: solicitud.id,
        decision: "aprobado",
        motivo: "Intento de autoaprobación por broker",
      }),
    ForbiddenError,
  );

  // Un admin tampoco puede autoaprobarse si la solicitud fuera suya (Q-C1-03)
  const solicitudPropiaAdmin = await solicitarRevisionCursoAcademy(repo, lms, actorAdmin, {
    courseCode: "QHA-IND-PC",
  });
  await assert.rejects(
    () =>
      decidirRevisionCursoAcademy(repo, actorAdmin, {
        solicitudId: solicitudPropiaAdmin.id,
        decision: "aprobado",
        motivo: "Intento de autoaprobación por el mismo admin",
      }),
    ForbiddenError,
  );

  // Un admin distinto aprueba la solicitud del broker y se emite constancia con firma SHA-256
  const decision = await decidirRevisionCursoAcademy(repo, actorAdmin, {
    solicitudId: solicitud.id,
    decision: "aprobado",
    motivo: "Aprobado con 90 % en el cuestionario de Moodle y 6/6 actividades completadas.",
  });

  assert.equal(decision.solicitud.status, "aprobado");
  assert.ok(decision.constancia);
  assert.equal(decision.constancia.cryptographicHash.length, 64);
  assert.match(decision.constancia.verificationCode, /^QHA-2026-/);

  // El admin puede revocar la constancia con motivo auditado
  const revocada = await revocarConstanciaAcademy(repo, actorAdmin, {
    constanciaId: decision.constancia.id,
    motivo: "Actualización anual de normativa PLAFT.",
  });
  assert.equal(revocada.status, "revocada");
});

test("Academy UI-066: matricularUsuariosAdminAcademy sincroniza usuarios por rol y guarda vínculo en external_refs", async () => {
  const repo = new RepositorioAcademyEnMemoria();
  const lms = new AprendizajeEnMemoria();

  const res = await matricularUsuariosAdminAcademy(repo, lms, actorAdmin, {
    cursoId: 3,
    modo: "rol",
    roleSlug: "broker",
    rolCurso: "student",
  });

  assert.equal(res.matriculados, 1);
  assert.equal(res.usuarios[0]?.userId, 2);
  assert.equal(repo.vinculosMoodle.get(2), 8);
});
