import type {
  RepositorioAcademy,
  ItemAcademy,
  ResumenProgresoAcademy,
} from "./puertos.ts";

export async function listarContenidosAcademy(
  repo: RepositorioAcademy,
  userId: number,
  categoria?: string,
): Promise<ItemAcademy[]> {
  return repo.listarContenidos(userId, categoria);
}

export async function obtenerDetalleContenido(
  repo: RepositorioAcademy,
  userId: number,
  itemId: number,
): Promise<ItemAcademy> {
  const item = await repo.obtenerContenidoPorId(userId, itemId);
  if (!item) throw new Error("Contenido de Academy no encontrado.");
  return item;
}

export async function completarContenidoAcademy(
  repo: RepositorioAcademy,
  userId: number,
  itemId: number,
  progressPercent = 100,
  isCompleted = true,
): Promise<{ progressPercent: number; isCompleted: boolean }> {
  return repo.actualizarProgreso(userId, itemId, progressPercent, isCompleted);
}

export async function marcarPasoChecklist(
  repo: RepositorioAcademy,
  userId: number,
  checklistItemId: number,
  isCompleted: boolean,
): Promise<boolean> {
  return repo.marcarPasoChecklist(userId, checklistItemId, isCompleted);
}

export async function obtenerResumenProgresoBroker(
  repo: RepositorioAcademy,
  userId: number,
): Promise<ResumenProgresoAcademy> {
  return repo.obtenerResumenProgreso(userId);
}
