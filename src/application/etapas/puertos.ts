import type { StageKind } from "../../domain/catalogs.ts";
import type { Auditoria } from "../compartido/auditoria.ts";

export type Etapa = {
  id: number; slug: string; name: string; position: number; kind: StageKind;
  defaultProbability: number | null; isActive: boolean; createdAt: Date; updatedAt: Date;
};
/** El slug permanece inmutable incluso al renombrar o mover una etapa. */
export type CambiosEtapa = {
  name?: string; position?: number; kind?: StageKind;
  defaultProbability?: number | null; isActive?: boolean; slug?: never;
};
export type NuevaEtapa = Pick<Etapa, "slug" | "name" | "position" | "kind" | "defaultProbability" | "isActive">;
export interface RepositorioEtapas {
  bloquearCatalogo(): Promise<void>;
  listar(): Promise<Etapa[]>;
  buscar(id: number): Promise<Etapa | undefined>;
  estaEnUso(id: number): Promise<boolean>;
  crear(datos: NuevaEtapa): Promise<Etapa>;
  actualizar(id: number, cambios: CambiosEtapa): Promise<Etapa>;
}
export type ReposEtapas = { etapas: RepositorioEtapas; auditoria: Auditoria };
