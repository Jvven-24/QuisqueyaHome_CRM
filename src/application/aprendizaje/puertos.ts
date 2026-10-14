/**
 * Puertos de integración con LMS externo (Moodle 4.5 LTS / AprendizajePort).
 * Sigue la regla firmada Q-C1-03: Moodle es dueño de la evidencia educativa;
 * el CRM es el único que aprueba y emite la certificación.
 */

export type CursoLms = {
  id: string | number;
  codigo: string;
  nombre: string;
  categoria: string;
  resumen?: string;
  urlLanzamiento?: string;
};

export type EvidenciaLms = {
  usuarioId: number;
  cursoId: string | number;
  completado: boolean;
  calificacion?: number;
  progresoPorcentaje: number;
  sincronizadoEn: Date;
  origen: "moodle_local" | "legacy_local";
};

export type EstadoLms = {
  disponible: boolean;
  url: string;
  version: string;
  mensaje?: string;
};

export interface PuertoAprendizaje {
  comprobarSalud(): Promise<EstadoLms>;
  listarCursos(): Promise<CursoLms[]>;
  obtenerEvidencia(usuarioId: number, cursoId: string | number): Promise<EvidenciaLms | null>;
}
