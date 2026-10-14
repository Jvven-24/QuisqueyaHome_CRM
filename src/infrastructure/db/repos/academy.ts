/**
 * Adaptador Drizzle de Academy (`application/academy/puertos.ts`).
 */

import { and, eq, sql } from "drizzle-orm";
import type {
  ItemAcademy,
  ChecklistItemAcademy,
  RepositorioAcademy,
  ResumenProgresoAcademy,
  TipoContenidoAcademy,
} from "../../../application/academy/puertos";
import {
  academyItems,
  academyChecklistItems,
  academyProgress,
  academyChecklistProgress,
} from "../schema";
import type { Tx } from "./compartido";

export function repositorioAcademy(tx: Tx): RepositorioAcademy {
  return {
    async listarContenidos(userId: number, categoria?: string): Promise<ItemAcademy[]> {
      const items = await tx
        .select({
          id: academyItems.id,
          title: academyItems.title,
          itemType: academyItems.itemType,
          description: academyItems.description,
          durationMinutes: academyItems.durationMinutes,
          videoUrl: academyItems.videoUrl,
          position: academyItems.position,
          progressPercent: sql<number>`coalesce(${academyProgress.progressPercent}, 0)`,
          isCompleted: sql<boolean>`coalesce(${academyProgress.isCompleted}, false)`,
          completedAt: academyProgress.completedAt,
        })
        .from(academyItems)
        .leftJoin(
          academyProgress,
          and(
            eq(academyProgress.academyItemId, academyItems.id),
            eq(academyProgress.userId, userId),
          ),
        )
        .where(eq(academyItems.isActive, true))
        .orderBy(academyItems.position);

      const itemsConChecklist: ItemAcademy[] = [];

      for (const item of items) {
        let checklist: ChecklistItemAcademy[] = [];

        if (item.itemType === "checklist") {
          const pasos = await tx
            .select({
              id: academyChecklistItems.id,
              academyItemId: academyChecklistItems.academyItemId,
              position: academyChecklistItems.position,
              label: academyChecklistItems.label,
              isCompleted: sql<boolean>`coalesce(${academyChecklistProgress.isCompleted}, false)`,
            })
            .from(academyChecklistItems)
            .leftJoin(
              academyChecklistProgress,
              and(
                eq(academyChecklistProgress.checklistItemId, academyChecklistItems.id),
                eq(academyChecklistProgress.userId, userId),
              ),
            )
            .where(eq(academyChecklistItems.academyItemId, item.id))
            .orderBy(academyChecklistItems.position);

          checklist = pasos;
        }

        const cat = item.itemType === "session" ? "Sesión de formación" : item.itemType === "checklist" ? "Checklist operativo" : "Material de apoyo";
        if (categoria && cat.toLowerCase() !== categoria.toLowerCase()) continue;

        itemsConChecklist.push({
          id: item.id,
          title: item.title,
          itemType: item.itemType as TipoContenidoAcademy,
          description: item.description,
          durationMinutes: item.durationMinutes,
          videoUrl: item.videoUrl,
          position: item.position,
          category: cat,
          progressPercent: Number(item.progressPercent),
          isCompleted: Boolean(item.isCompleted),
          completedAt: item.completedAt,
          checklistItems: checklist,
        });
      }

      return itemsConChecklist;
    },

    async obtenerContenidoPorId(userId: number, itemId: number): Promise<ItemAcademy | null> {
      const [item] = await tx
        .select({
          id: academyItems.id,
          title: academyItems.title,
          itemType: academyItems.itemType,
          description: academyItems.description,
          durationMinutes: academyItems.durationMinutes,
          videoUrl: academyItems.videoUrl,
          position: academyItems.position,
          progressPercent: sql<number>`coalesce(${academyProgress.progressPercent}, 0)`,
          isCompleted: sql<boolean>`coalesce(${academyProgress.isCompleted}, false)`,
          completedAt: academyProgress.completedAt,
        })
        .from(academyItems)
        .leftJoin(
          academyProgress,
          and(
            eq(academyProgress.academyItemId, academyItems.id),
            eq(academyProgress.userId, userId),
          ),
        )
        .where(eq(academyItems.id, itemId))
        .limit(1);

      if (!item) return null;

      let checklist: ChecklistItemAcademy[] = [];
      if (item.itemType === "checklist") {
        checklist = await tx
          .select({
            id: academyChecklistItems.id,
            academyItemId: academyChecklistItems.academyItemId,
            position: academyChecklistItems.position,
            label: academyChecklistItems.label,
            isCompleted: sql<boolean>`coalesce(${academyChecklistProgress.isCompleted}, false)`,
          })
          .from(academyChecklistItems)
          .leftJoin(
            academyChecklistProgress,
            and(
              eq(academyChecklistProgress.checklistItemId, academyChecklistItems.id),
              eq(academyChecklistProgress.userId, userId),
            ),
          )
          .where(eq(academyChecklistItems.academyItemId, item.id))
          .orderBy(academyChecklistItems.position);
      }

      return {
        id: item.id,
        title: item.title,
        itemType: item.itemType as TipoContenidoAcademy,
        description: item.description,
        durationMinutes: item.durationMinutes,
        videoUrl: item.videoUrl,
        position: item.position,
        category: item.itemType === "session" ? "Sesión de formación" : item.itemType === "checklist" ? "Checklist operativo" : "Material de apoyo",
        progressPercent: Number(item.progressPercent),
        isCompleted: Boolean(item.isCompleted),
        completedAt: item.completedAt,
        checklistItems: checklist,
      };
    },

    async actualizarProgreso(
      userId: number,
      itemId: number,
      progressPercent: number,
      isCompleted: boolean,
    ): Promise<{ progressPercent: number; isCompleted: boolean }> {
      const percent = Math.min(100, Math.max(0, progressPercent));
      const completed = isCompleted || percent === 100;
      const completedAt = completed ? new Date() : null;

      await tx
        .insert(academyProgress)
        .values({
          userId,
          academyItemId: itemId,
          progressPercent: percent,
          isCompleted: completed,
          completedAt,
        })
        .onConflictDoUpdate({
          target: [academyProgress.userId, academyProgress.academyItemId],
          set: {
            progressPercent: percent,
            isCompleted: completed,
            completedAt,
          },
        });

      return { progressPercent: percent, isCompleted: completed };
    },

    async marcarPasoChecklist(
      userId: number,
      checklistItemId: number,
      isCompleted: boolean,
    ): Promise<boolean> {
      const [paso] = await tx
        .select({ academyItemId: academyChecklistItems.academyItemId })
        .from(academyChecklistItems)
        .where(eq(academyChecklistItems.id, checklistItemId))
        .limit(1);

      if (!paso) throw new Error("Paso de checklist no encontrado.");

      await tx
        .insert(academyChecklistProgress)
        .values({
          userId,
          checklistItemId,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        })
        .onConflictDoUpdate({
          target: [academyChecklistProgress.userId, academyChecklistProgress.checklistItemId],
          set: {
            isCompleted,
            completedAt: isCompleted ? new Date() : null,
          },
        });

      // Recalcular el porcentaje del item padre
      const todosLosPasos = await tx
        .select({ id: academyChecklistItems.id })
        .from(academyChecklistItems)
        .where(eq(academyChecklistItems.academyItemId, paso.academyItemId));

      const completados = await tx
        .select({ id: academyChecklistProgress.id })
        .from(academyChecklistProgress)
        .innerJoin(academyChecklistItems, eq(academyChecklistProgress.checklistItemId, academyChecklistItems.id))
        .where(
          and(
            eq(academyChecklistItems.academyItemId, paso.academyItemId),
            eq(academyChecklistProgress.userId, userId),
            eq(academyChecklistProgress.isCompleted, true),
          ),
        );

      const percent = Math.round((completados.length / (todosLosPasos.length || 1)) * 100);
      const terminado = completados.length === todosLosPasos.length && todosLosPasos.length > 0;

      await tx
        .insert(academyProgress)
        .values({
          userId,
          academyItemId: paso.academyItemId,
          progressPercent: percent,
          isCompleted: terminado,
          completedAt: terminado ? new Date() : null,
        })
        .onConflictDoUpdate({
          target: [academyProgress.userId, academyProgress.academyItemId],
          set: {
            progressPercent: percent,
            isCompleted: terminado,
            completedAt: terminado ? new Date() : null,
          },
        });

      return isCompleted;
    },

    async obtenerResumenProgreso(userId: number): Promise<ResumenProgresoAcademy> {
      const [cuenta] = await tx
        .select({
          total: sql<number>`count(*)::int`,
        })
        .from(academyItems)
        .where(eq(academyItems.isActive, true));

      const [completados] = await tx
        .select({
          total: sql<number>`count(*)::int`,
        })
        .from(academyProgress)
        .innerJoin(
          academyItems,
          and(
            eq(academyItems.id, academyProgress.academyItemId),
            eq(academyItems.isActive, true),
          ),
        )
        .where(
          and(
            eq(academyProgress.userId, userId),
            eq(academyProgress.isCompleted, true),
          ),
        );

      const totalItems = Number(cuenta?.total || 0);
      const completedItems = Number(completados?.total || 0);
      const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      return {
        totalItems,
        completedItems,
        percent,
      };
    },
  };
}

export function reposAcademy(tx: Tx): RepositorioAcademy {
  return repositorioAcademy(tx);
}

