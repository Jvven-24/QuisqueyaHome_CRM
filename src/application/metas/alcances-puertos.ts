/**
 * Puertos de las metas por alcance (proyecto/equipo), equipos y regla de
 * atribución. Igual que `puertos.ts`: aquí solo hay objetivos; lo logrado se
 * deriva de los negocios ganados con la atribución congelada al cierre.
 */
import type { Auditoria } from "../compartido/auditoria.ts";
import type { AlcanceMeta, ConfigAtribucion } from "../../domain/metas-alcances.ts";

export type MetaAlcance = {
  id: number;
  scopeType: AlcanceMeta;
  scopeId: number;
  year: number;
  month: number;
  targetDeals: number;
  targetAmountCents: number | null;
  currency: string;
};

export type Equipo = { id: number; name: string; slug: string; leaderId: number | null; isActive: boolean; memberIds: number[] };

export type ReglaAtribucion = {
  id: number;
  version: number;
  scope: string;
  rule: string;
  config: ConfigAtribucion;
  isActive: boolean;
  approvedBy: number | null;
  approvedAt: Date | null;
};

export interface RepositorioMetasAlcance {
  existeAlcance(scopeType: AlcanceMeta, scopeId: number): Promise<boolean>;
  fijarMetaAlcance(datos: Omit<MetaAlcance, "id"> & { actorId: number }): Promise<{ anterior: MetaAlcance | undefined; meta: MetaAlcance }>;
  eliminarMetaAlcance(id: number): Promise<MetaAlcance | undefined>;
  /** Usuarios de la lista que NO tienen perfil de broker. */
  noBrokers(userIds: readonly number[]): Promise<number[]>;
  buscarEquipo(id: number): Promise<Equipo | undefined>;
  existeSlugEquipo(slug: string, exceptoId?: number): Promise<boolean>;
  guardarEquipo(datos: { id?: number; name: string; slug: string; leaderId: number | null; memberIds: number[]; actorId: number }): Promise<Equipo>;
  versionesDeRegla(): Promise<number[]>;
  publicarRegla(datos: { version: number; scope: string; rule: string; config: ConfigAtribucion; actorId: number; cuando: Date }): Promise<{ anterior: ReglaAtribucion | undefined; regla: ReglaAtribucion }>;
}

export type ReposMetasAlcance = { alcances: RepositorioMetasAlcance; auditoria: Auditoria };
