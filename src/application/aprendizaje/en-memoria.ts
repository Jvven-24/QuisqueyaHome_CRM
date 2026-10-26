import type {
  CategoriaLms,
  CrearCursoLmsInput,
  CursoLms,
  EstadoLms,
  EvidenciaLms,
  ProgresoPersonaCursoLms,
  PuertoAprendizaje,
  UsuarioMoodleSyncInput,
} from "./puertos.ts";

export class AprendizajeEnMemoria implements PuertoAprendizaje {
  public categorias: CategoriaLms[] = [
    { id: 1, codigo: "QHA-CAT-COMERCIAL", nombre: "Formación Comercial e Inmobiliaria" },
    { id: 2, codigo: "QHA-CAT-LEGAL", nombre: "Marco Legal y Cumplimiento (CONFOTUR / PLAFT)" },
    { id: 3, codigo: "QHA-CAT-PROYECTOS", nombre: "Proyectos y Producto Inmobiliario" },
  ];

  public cursos: CursoLms[] = [
    {
      id: "QHA-CONFOTUR-01",
      codigo: "QHA-CONFOTUR",
      nombre: "Ley 158-01 (Confotur) y Beneficios Fiscales",
      categoria: "Legal y Fiscal",
      categoriaId: 2,
      notaMinima: 80,
      resumen: "Marco regulatorio de exenciones fiscales para proyectos turísticos en RD.",
      urlLanzamiento: "http://127.0.0.1:9330/course/view.php?id=2",
      urlEdicion: "http://127.0.0.1:9330/course/edit.php?id=2",
    },
    {
      id: "QHA-RESERVAS-01",
      codigo: "QHA-RESERVAS",
      nombre: "Protocolo Operativo de Reservas y Separaciones",
      categoria: "Operaciones",
      categoriaId: 1,
      notaMinima: 80,
      resumen: "Procedimiento estándar para registro de apartados y bloqueo de unidades.",
      urlLanzamiento: "http://127.0.0.1:9330/course/view.php?id=3",
      urlEdicion: "http://127.0.0.1:9330/course/edit.php?id=3",
    },
    {
      id: "QHA-PLAFT-01",
      codigo: "QHA-PLAFT",
      nombre: "Prevención de Lavado de Activos (Ley 155-17)",
      categoria: "Cumplimiento",
      categoriaId: 2,
      notaMinima: 80,
      resumen: "Debida diligencia, sujetos obligados y formularios UAF en bienes raíces.",
      urlLanzamiento: "http://127.0.0.1:9330/course/view.php?id=4",
      urlEdicion: "http://127.0.0.1:9330/course/edit.php?id=4",
    },
  ];

  public evidencias: Map<string, EvidenciaLms> = new Map();
  public matriculasPorCurso: Map<number, ProgresoPersonaCursoLms[]> = new Map();
  public usuariosMoodle: Map<number, { moodleUserId: number; email: string; fullName: string }> = new Map();
  public disponible = true;
  public version = "4.5.15 LTS (Build 20261005)";

  async comprobarSalud(): Promise<EstadoLms> {
    return {
      disponible: this.disponible,
      url: "http://127.0.0.1:9330",
      urlCrearCurso: "http://127.0.0.1:9330/course/edit.php?category=1",
      urlGestionCursos: "http://127.0.0.1:9330/course/management.php",
      version: this.version,
      mensaje: this.disponible ? "Instancia de Quisqueya Academy activa en servidor local." : "Servicio no disponible",
    };
  }

  async listarCategorias(): Promise<CategoriaLms[]> {
    if (!this.disponible) return [];
    return this.categorias;
  }

  async listarCursos(): Promise<CursoLms[]> {
    if (!this.disponible) return [];
    return this.cursos;
  }

  async listarCursosUsuario(moodleUserId: number): Promise<CursoLms[]> {
    if (!this.disponible || moodleUserId <= 0) return [];
    return this.cursos;
  }

  async crearCurso(input: CrearCursoLmsInput): Promise<CursoLms> {
    if (!this.disponible) {
      throw new Error("LMS no disponible para crear cursos.");
    }
    const nuevoId = this.cursos.length + 10;
    const cat = this.categorias.find((c) => c.id === input.categoriaId);
    const nuevo: CursoLms = {
      id: nuevoId,
      codigo: input.codigo,
      nombre: input.nombre,
      categoria: input.categoriaNombre || cat?.nombre || "Formación Comercial e Inmobiliaria",
      categoriaId: input.categoriaId ?? 1,
      notaMinima: input.notaMinima,
      resumen: input.resumen,
      urlLanzamiento: `http://127.0.0.1:9330/course/view.php?id=${nuevoId}`,
      urlEdicion: `http://127.0.0.1:9330/course/edit.php?id=${nuevoId}`,
    };
    this.cursos.push(nuevo);
    return nuevo;
  }

  async asegurarUsuario(input: UsuarioMoodleSyncInput): Promise<{ moodleUserId: number }> {
    if (!this.disponible) {
      throw new Error("LMS no disponible para sincronizar usuario.");
    }
    if (input.externalIdActual && Number.isFinite(Number(input.externalIdActual))) {
      const id = Number(input.externalIdActual);
      this.usuariosMoodle.set(id, { moodleUserId: id, email: input.email, fullName: input.fullName });
      return { moodleUserId: id };
    }
    const id = 1000 + input.localUserId;
    this.usuariosMoodle.set(id, { moodleUserId: id, email: input.email, fullName: input.fullName });
    return { moodleUserId: id };
  }

  async matricularUsuarios(
    cursoId: number,
    matriculas: Array<{ moodleUserId: number; rolCurso: "student" | "editingteacher" }>,
  ): Promise<{ matriculados: number }> {
    if (!this.disponible) {
      throw new Error("LMS no disponible para matricular usuarios.");
    }
    const lista = this.matriculasPorCurso.get(cursoId) ?? [];
    for (const m of matriculas) {
      const u = this.usuariosMoodle.get(m.moodleUserId);
      const existente = lista.find((p) => p.moodleUserId === m.moodleUserId);
      if (!existente) {
        lista.push({
          moodleUserId: m.moodleUserId,
          email: u?.email ?? `user.${m.moodleUserId}@quisqueyahome.do`,
          nombreCompleto: u?.fullName ?? `Usuario ${m.moodleUserId}`,
          rolCurso: m.rolCurso,
          progresoPorcentaje: 0,
          calificacion: null,
          completado: false,
          actividadesCompletadas: 0,
          actividadesTotales: 6,
          ultimoAcceso: null,
        });
      }
    }
    this.matriculasPorCurso.set(cursoId, lista);
    return { matriculados: matriculas.length };
  }

  async listarProgresoCurso(cursoId: number): Promise<ProgresoPersonaCursoLms[]> {
    if (!this.disponible) return [];
    return this.matriculasPorCurso.get(cursoId) ?? [];
  }

  async obtenerEvidencia(
    usuarioId: number,
    cursoId: string | number,
    moodleUserId?: number,
  ): Promise<EvidenciaLms | null> {
    if (!this.disponible) return null;
    const clave = `${usuarioId}:${cursoId}`;
    const directa = this.evidencias.get(clave);
    if (directa) return directa;
    if (moodleUserId !== undefined) {
      return this.evidencias.get(`${moodleUserId}:${cursoId}`) ?? null;
    }
    return null;
  }
}
