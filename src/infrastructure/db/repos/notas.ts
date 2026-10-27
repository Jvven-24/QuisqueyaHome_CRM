import { and, desc, eq, isNull } from "drizzle-orm";
import type { Actor } from "../../../domain/rbac";
import { requireScope } from "../../../domain/rbac";
import type { ContextoNota, ReferenciaNota, RepositorioNotas, ReposNotas } from "../../../application/actividades/notas";
import { activities, deals, leads, users } from "../schema";
import { visibleRows } from "../../rbac-filter";
import type { Db } from "../client";
import { auditoriaDrizzle, type Tx } from "./compartido";

export function repositorioNotas(tx: Pick<Tx | Db, "select" | "insert" | "update">): RepositorioNotas {
  const columnas = { id: activities.id, title: activities.title, description: activities.description, createdBy: activities.createdBy, author: users.fullName, createdAt: activities.createdAt, updatedAt: activities.updatedAt };
  const filtro = (ref: ReferenciaNota) => and(eq(activities.activityType, "note"), isNull(activities.deletedAt), ref.leadId !== null ? eq(activities.leadId, ref.leadId) : eq(activities.dealId, ref.dealId!));
  async function listar(ref: ReferenciaNota, id?: number) {
    const consulta = tx.select(columnas).from(activities).leftJoin(users, eq(users.id, activities.createdBy))
      .where(and(filtro(ref), id === undefined ? undefined : eq(activities.id, id))).orderBy(desc(activities.createdAt), desc(activities.id));
    return id === undefined ? consulta : consulta.for("update", { of: activities });
  }
  return {
    async contextoVisible(actor: Actor, contexto: ContextoNota) {
      const tabla = contexto.entidad === "lead" ? leads : deals;
      const alcance = requireScope(actor, contexto.entidad === "lead" ? "leads" : "deals", "view");
      const [fila] = await tx.select({ id: tabla.id, contactId: tabla.contactId }).from(tabla)
        .where(and(eq(tabla.id, contexto.entidadId), visibleRows(actor, alcance, tabla.brokerId, tabla.deletedAt))).limit(1);
      return fila ? { contactId: fila.contactId, leadId: contexto.entidad === "lead" ? fila.id : null, dealId: contexto.entidad === "deal" ? fila.id : null } : undefined;
    },
    listar,
    async buscar(ref, id) { return (await listar(ref, id))[0]; },
    async crear(ref, texto, actorId) {
      const [fila] = await tx.insert(activities).values({ activityType: "note", title: "Nota", description: texto, contactId: ref.contactId, leadId: ref.leadId, dealId: ref.dealId, assigneeId: actorId, status: "completed", completedAt: new Date(), createdBy: actorId, updatedBy: actorId }).returning();
      return { ...fila!, author: null };
    },
    async editar(id, texto, actorId) {
      const [fila] = await tx.update(activities).set({ description: texto, updatedBy: actorId }).where(and(eq(activities.id, id), isNull(activities.deletedAt))).returning();
      return { ...fila!, author: null };
    },
    async borrar(id, actorId) { await tx.update(activities).set({ deletedAt: new Date(), updatedBy: actorId }).where(eq(activities.id, id)); },
  };
}
export function reposNotas(tx: Tx): ReposNotas { return { notas: repositorioNotas(tx), auditoria: auditoriaDrizzle(tx) }; }
