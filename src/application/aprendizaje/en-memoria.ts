import type { CursoLms, EstadoLms, EvidenciaLms, PuertoAprendizaje } from "./puertos.ts";

export class AprendizajeEnMemoria implements PuertoAprendizaje {
  public cursos: CursoLms[] = [
    {
      id: "QHA-CONFOTUR-01",
      codigo: "QHA-CONFOTUR",
      nombre: "Ley 158-01 (Confotur) y Beneficios Fiscales",
      categoria: "Legal y Fiscal",
      resumen: "Marco regulatorio de exenciones fiscales para proyectos turísticos en RD.",
      urlLanzamiento: "http://127.0.0.1:9330/course/view.php?id=2",
    },
    {
      id: "QHA-RESERVAS-01",
      codigo: "QHA-RESERVAS",
      nombre: "Protocolo Operativo de Reservas y Separaciones",
      categoria: "Operaciones",
      resumen: "Procedimiento estándar para registro de apartados y bloqueo de unidades.",
      urlLanzamiento: "http://127.0.0.1:9330/course/view.php?id=3",
    },
    {
      id: "QHA-PLAFT-01",
      codigo: "QHA-PLAFT",
      nombre: "Prevención de Lavado de Activos (Ley 155-17)",
      categoria: "Cumplimiento",
      resumen: "Debida diligencia, sujetos obligados y formularios UAF en bienes raíces.",
      urlLanzamiento: "http://127.0.0.1:9330/course/view.php?id=4",
    },
  ];

  public evidencias: Map<string, EvidenciaLms> = new Map();
  public disponible = true;
  public version = "4.5.15 LTS (Build 20261005)";

  async comprobarSalud(): Promise<EstadoLms> {
    return {
      disponible: this.disponible,
      url: "http://127.0.0.1:9330",
      version: this.version,
      mensaje: this.disponible ? "Instancia de Quisqueya Academy activa en servidor local." : "Servicio no disponible",
    };
  }

  async listarCursos(): Promise<CursoLms[]> {
    if (!this.disponible) return [];
    return this.cursos;
  }

  async obtenerEvidencia(usuarioId: number, cursoId: string | number): Promise<EvidenciaLms | null> {
    if (!this.disponible) return null;
    const clave = `${usuarioId}:${cursoId}`;
    return this.evidencias.get(clave) ?? null;
  }
}
