/**
 * M10 · Academy — Rutas de formación por etapa.
 *
 * Una ruta agrupa los cursos cuya categoría de Moodle coincide con una de las
 * categorías de la ruta. No hay códigos de curso fijos aquí: un admin crea los
 * cursos en Moodle con su categoría y la ruta se llena sola. Por eso la ruta
 * sigue funcionando cuando cambian los cursos.
 *
 * Un curso cuenta como completado solo con una constancia que acredite
 * formación (vigente o por vencer); una constancia vencida no cuenta.
 */

import {
  constanciaAcreditaFormacion,
  estadoVigenciaConstancia,
  type EstadoVigenciaConstancia,
} from "./academy-vigencia.ts";

export type EtapaRutaFormacion = "onboarding" | "producto" | "normativa" | "tecnicas_venta";

export type RutaFormacion = {
  id: EtapaRutaFormacion;
  nombre: string;
  descripcion: string;
  categorias: readonly string[];
};

export const RUTAS_FORMACION: readonly RutaFormacion[] = [
  {
    id: "onboarding",
    nombre: "Onboarding",
    descripcion: "Primeros pasos para integrarte al equipo y a la plataforma.",
    categorias: ["Onboarding"],
  },
  {
    id: "producto",
    nombre: "Producto",
    descripcion: "Proyectos, unidades y propuesta de valor que debes dominar.",
    categorias: ["Producto"],
  },
  {
    id: "normativa",
    nombre: "Normativa",
    descripcion: "Marco legal, requisitos y cumplimiento para operar.",
    categorias: ["Normativa"],
  },
  {
    id: "tecnicas_venta",
    nombre: "Técnicas de venta",
    descripcion: "Captación, negociación y cierre con clientes.",
    categorias: ["Técnicas de venta", "Tecnicas de venta"],
  },
];

export type CursoParaRuta = { codigo: string; nombre: string; categoria: string };
export type ConstanciaParaRuta = { courseCode: string; status: "vigente" | "revocada"; issuedAt: Date };

export type ProgresoRutaFormacion = {
  ruta: RutaFormacion;
  total: number;
  completados: number;
  porcentaje: number;
  cursos: Array<CursoParaRuta & { estado: EstadoVigenciaConstancia | "sin_constancia" }>;
};

function normalizarCategoria(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
}

/** Cursos de una ruta según la categoría de Moodle. Sin coincidencia, la lista va vacía. */
export function cursosDeRuta(ruta: RutaFormacion, cursos: readonly CursoParaRuta[]): CursoParaRuta[] {
  const categoriasRuta = new Set(ruta.categorias.map(normalizarCategoria));
  return cursos.filter((curso) => categoriasRuta.has(normalizarCategoria(curso.categoria)));
}

/** Progreso de cada ruta para un broker, a partir de sus cursos y sus constancias. */
export function progresoRutasFormacion(
  cursos: readonly CursoParaRuta[],
  constancias: readonly ConstanciaParaRuta[],
  ahora: Date,
): ProgresoRutaFormacion[] {
  return RUTAS_FORMACION.map((ruta) => {
    const cursosRuta = cursosDeRuta(ruta, cursos).map((curso) => {
      const constancia = constancias
        .filter((c) => c.courseCode === curso.codigo)
        .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime())[0];
      const estado = constancia
        ? estadoVigenciaConstancia(constancia, ahora)
        : ("sin_constancia" as const);
      return { ...curso, estado };
    });
    const completados = cursosRuta.filter(
      (curso) => curso.estado !== "sin_constancia" && constanciaAcreditaFormacion(curso.estado),
    ).length;
    const total = cursosRuta.length;
    return {
      ruta,
      total,
      completados,
      porcentaje: total === 0 ? 0 : Math.round((completados / total) * 100),
      cursos: cursosRuta,
    };
  });
}
