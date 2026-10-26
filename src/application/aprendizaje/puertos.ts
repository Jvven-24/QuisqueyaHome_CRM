/**
 * Puertos de integración con LMS externo (Moodle 4.5 LTS / AprendizajePort).
 * Sigue la regla firmada Q-C1-03: Moodle es dueño de la autoría, edición y evidencia
 * educativa; el CRM matricula usuarios, consulta estado de finalización por persona
 * y es el único que aprueba y emite la certificación.
 */

export type CategoriaLms = {
  id: number;
  codigo: string;
  nombre: string;
};

export type CursoLms = {
  id: string | number;
  codigo: string;
  nombre: string;
  categoria: string;
  categoriaId?: number;
  notaMinima?: number;
  resumen?: string;
  urlLanzamiento?: string;
  urlEdicion?: string;
};

export type EvidenciaLms = {
  usuarioId: number;
  moodleUserId?: number;
  cursoId: string | number;
  cursoCodigo?: string;
  completado: boolean;
  calificacion?: number;
  notaMinima?: number;
  progresoPorcentaje: number;
  actividadesCompletadas?: number;
  actividadesTotales?: number;
  sincronizadoEn: Date;
  origen: "moodle_local" | "legacy_local";
};

export type EstadoLms = {
  disponible: boolean;
  url: string;
  urlCrearCurso?: string;
  urlGestionCursos?: string;
  version: string;
  mensaje?: string;
};

export type CrearCursoLmsInput = {
  nombre: string;
  codigo: string;
  resumen: string;
  categoriaId?: number;
  categoriaNombre?: string;
  notaMinima: number;
};

export type UsuarioMoodleSyncInput = {
  localUserId: number;
  email: string;
  fullName: string;
  roleSlug: string;
  externalIdActual?: string | null;
};

export type ProgresoPersonaCursoLms = {
  moodleUserId: number;
  email: string;
  nombreCompleto: string;
  rolCurso: string;
  progresoPorcentaje: number;
  calificacion: number | null;
  completado: boolean;
  actividadesCompletadas: number;
  actividadesTotales: number;
  ultimoAcceso: string | null;
};

export interface PuertoAprendizaje {
  comprobarSalud(): Promise<EstadoLms>;
  listarCategorias(): Promise<CategoriaLms[]>;
  listarCursos(): Promise<CursoLms[]>;
  listarCursosUsuario(moodleUserId: number): Promise<CursoLms[]>;
  crearCurso(input: CrearCursoLmsInput): Promise<CursoLms>;
  asegurarUsuario(input: UsuarioMoodleSyncInput): Promise<{ moodleUserId: number }>;
  matricularUsuarios(
    cursoId: number,
    matriculas: Array<{ moodleUserId: number; rolCurso: "student" | "editingteacher" }>,
  ): Promise<{ matriculados: number }>;
  listarProgresoCurso(cursoId: number): Promise<ProgresoPersonaCursoLms[]>;
  obtenerEvidencia(
    usuarioId: number,
    cursoId: string | number,
    moodleUserId?: number,
  ): Promise<EvidenciaLms | null>;
}
