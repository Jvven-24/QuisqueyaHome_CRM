import type { Atribucion, Toque } from "./atribucion.ts";
import type { EnlaceDestino } from "./enlaces.ts";

export type Enlace = EnlaceDestino & {
  id: number; name: string; videoUrl: string | null; videoTitle: string | null; campaign: string | null;
  adName: string | null; isActive: boolean; createdAt: Date;
};
export type NuevoEnlace = Omit<Enlace, "id" | "createdAt" | "isActive" | "code"> & { createdBy: number };
export type EnlaceConConteos = Enlace & { clics: number; visitantes: number; leads: number };

export interface RepoSeguimiento {
  insertarEnlace(datos: NuevoEnlace, code: string): Promise<Enlace | "codigo-repetido">;
  enlacePorCodigo(code: string): Promise<Enlace | null>;
  enlacePorAdId(adId: string): Promise<Enlace | null>;
  listarEnlaces(): Promise<EnlaceConConteos[]>;
  cambiarActivo(id: number, activo: boolean): Promise<boolean>;
  registrarClic(c: { linkId: number; visitorId: string; referrer: string | null; userAgent: string | null; esBot: boolean; en: Date }): Promise<void>;
  /** Clics reales (no bots) del visitante desde `desde`, con su enlace. */
  clicsDeVisitante(visitorId: string, desde: Date): Promise<{ enlace: Enlace; en: Date }[]>;
  atribucionDeContacto(contactId: number): Promise<Atribucion | null>;
  guardarAtribucion(leadId: number, a: Atribucion): Promise<void>;
}

export type Senales = {
  codigo?: string | null; visitorId?: string | null; adId?: string | null; formId?: string | null;
  utm?: { source?: string | null; medium?: string | null; campaign?: string | null; content?: string | null } | null;
  canal: Toque["canal"];
};
