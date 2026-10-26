import { reaches, type Actor, type PermissionScope } from "../../domain/rbac.ts";
import { fechaSantoDomingo } from "../../domain/zona-horaria.ts";
import type { CatalogosNegocios, CursorNegocios, FichaNegocio, FilaNegocio, FiltrosNegocios, LecturaPipeline, OrdenNegocios, ResumenEtapaNegocio } from "./puertos.ts";

export type NegocioLecturaMemoria = FichaNegocio & { deletedAt?: Date | null; ventaRegistrada?: boolean };
export function lecturaPipelineEnMemoria(datos: NegocioLecturaMemoria[], catalogos: CatalogosNegocios): LecturaPipeline {
  function visibles(actor: Actor, scope: PermissionScope, f: FiltrosNegocios) {
    return datos.filter(({ negocio: n, propiedades, deletedAt, ventaRegistrada }) => {
      if (deletedAt || !reaches(actor, scope, n.brokerId)) return false;
      if (f.historicasSinUnidad && (n.stageKind !== "won" || n.operationType !== "sale" || ventaRegistrada)) return false;
      if (f.projectId !== undefined && !propiedades.some(p => p.projectId === f.projectId)) return false;
      if (f.brokerId !== undefined && n.brokerId !== f.brokerId) return false;
      if (f.stageId !== undefined && n.stageId !== f.stageId) return false;
      if (f.resultado !== undefined && n.stageKind !== f.resultado) return false;
      if (f.moneda !== undefined && n.currency !== f.moneda) return false;
      if (f.montoMin !== undefined && (n.amountCents == null || n.amountCents < f.montoMin)) return false;
      if (f.montoMax !== undefined && (n.amountCents == null || n.amountCents > f.montoMax)) return false;
      const fecha = f.campoFecha === "expectedCloseDate" ? n.expectedCloseDate
        : f.campoFecha === "closedAt" ? n.closedAt && fechaSantoDomingo(n.closedAt) : fechaSantoDomingo(n.createdAt);
      if ((f.desde || f.hasta) && !fecha) return false;
      return !(f.desde && fecha! < f.desde || f.hasta && fecha! > f.hasta);
    });
  }
  function valor(n: FilaNegocio, orden: OrdenNegocios) {
    return orden.campo === "createdAt" ? n.createdAt.toISOString() : orden.campo === "id" ? n.id : n.amountCents ?? -1;
  }
  function comparar(a: string | number, b: string | number) { return a < b ? -1 : a > b ? 1 : 0; }
  return {
    async listar(actor, scope, filtros, orden, cursor: CursorNegocios | null, limite) {
      const signo = orden.direccion === "asc" ? 1 : -1;
      return visibles(actor, scope, filtros).map(n => n.negocio)
        .sort((a, b) => signo * (comparar(valor(a, orden), valor(b, orden)) || a.id - b.id))
        .filter(n => !cursor || signo * (comparar(valor(n, orden), cursor.valor) || n.id - cursor.id) > 0).slice(0, limite);
    },
    async resumir(actor, scope, filtros) {
      const grupos = new Map<string, ResumenEtapaNegocio>();
      for (const { negocio: n } of visibles(actor, scope, filtros)) {
        const key = `${n.stageId}:${n.currency}`;
        const r = grupos.get(key) ?? { stageId: n.stageId, kind: n.stageKind, currency: n.currency, count: 0, amountCents: 0 };
        r.count++; r.amountCents! += n.amountCents ?? 0;
        grupos.set(key, r);
      }
      return [...grupos.values()].sort((a, b) => a.stageId - b.stageId || a.currency.localeCompare(b.currency));
    },
    async ficha(actor, scope, id) { return visibles(actor, scope, {}).find(n => n.negocio.id === id); },
    async catalogos() { return catalogos; },
  };
}
