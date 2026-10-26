/**
 * M6 · Avances de obra — cálculos puros (`docs/F3_ANALISIS_Y_PLAN.md` §3
 * hallazgo 2, §4.3, issue #32). Sin base de datos, se prueba con `node --test`.
 *
 * El resto del módulo (consultas, route handlers, Storage) vive en
 * `app/api/proyectos/[id]/fases/…` y en `app/(crm)/avances/`.
 */

import type { PhaseStatus } from "./catalogs.ts";

/**
 * `projects.progress_percent` es un caché del promedio de las fases (comentario
 * del propio esquema). Se recalcula completo en cada escritura de una fase, no
 * se ajusta de forma incremental: con 8 fases típicas, sumar y dividir de nuevo
 * es más barato de razonar que mantener un acumulador aparte, y no puede
 * desincronizarse.
 */
export function promedioAvance(porcentajes: readonly number[]): number {
  if (porcentajes.length === 0) return 0;
  const suma = porcentajes.reduce((total, valor) => total + valor, 0);
  return Math.round(suma / porcentajes.length);
}

/** Etiqueta en español de `construction_phases.status` (timeline y editor). */
export const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  pending: "Pendiente",
  in_progress: "En curso",
  completed: "Completado",
  delayed: "Retrasado",
};

/**
 * Plantilla de fases por defecto (issue #32, §4.3), portada tal cual del
 * prototipo (`referencia-prototipo/app/page.tsx`).
 *
 * ponytail: lista fija en vez de una tabla de plantillas configurable — el
 * número de fases ya es libre por proyecto (se pueden agregar o borrar una a
 * una), así que lo único que esta constante fija es el punto de partida.
 * Techo: si distintas constructoras necesitan plantillas propias, esto se
 * sube a una tabla `phase_templates`; hoy nadie lo pidió.
 */
export const FASES_ESTANDAR = [
  "Movimiento de tierra",
  "Cimientos",
  "Estructura",
  "Muros",
  "Instalaciones",
  "Terminaciones",
  "Áreas comunes",
  "Entrega",
] as const;

const TAMANO_MAXIMO_FOTO_BYTES = 10 * 1024 * 1024;

/**
 * Lista cerrada de MIME de imagen ráster permitidos para fotos de obra, con su
 * extensión de archivo. `image/svg+xml` queda fuera a propósito: un SVG puede
 * llevar `<script>` embebido, y `validarFoto` lo rechazaría igual que un PDF
 * si solo comprobara el prefijo `image/` (revisión de calidad de M6).
 *
 * También sirve para nombrar el objeto en Storage (`fotos/route.ts`): la
 * extensión sale de aquí, nunca del nombre de archivo que manda el cliente.
 */
export const FOTO_MIME_EXTENSIONES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/**
 * Valida una foto de obra antes de subirla a Storage: solo los MIME de
 * `FOTO_MIME_EXTENSIONES`, ≤ 10 MB (decisión #33). Devuelve el mensaje de
 * error en español, o `null` si la foto es válida — el route handler decide
 * qué hacer con el mensaje (400, `ValidationError`), esta función no conoce
 * HTTP.
 */
export function validarFoto(mimeType: string, sizeBytes: number): string | null {
  if (!(mimeType in FOTO_MIME_EXTENSIONES)) return "Solo se permiten imágenes JPEG, PNG, WEBP o GIF.";
  if (sizeBytes > TAMANO_MAXIMO_FOTO_BYTES) return "Cada foto debe pesar 10 MB o menos.";
  return null;
}

export interface RequisitoFase {
  id: string;
  titulo: string;
  cumplido: boolean;
  obligatorio: boolean;
  orientacion: string;
}

export interface EvaluacionAptitudFase {
  aptoPublicar: boolean;
  porcentajeCumplimiento: number;
  faltantesObligatorios: string[];
  alertasCoherencia: string[];
  requisitos: RequisitoFase[];
}

/**
 * Evalúa si una fase constructiva cumple las condiciones de calidad y
 * transparencia para publicarse en el portal del comprador o marcarse como
 * completada, devolviendo orientación explícita paso a paso.
 */
export function evaluarAptitudPublicacionFase(entrada: {
  status: PhaseStatus;
  progressPercent: number;
  publicNote: string | null | undefined;
  videoUrl: string | null | undefined;
  responsibleId: number | null | undefined;
  statusDate: string | null | undefined;
  cantidadFotos: number;
}): EvaluacionAptitudFase {
  const notaLimpia = (entrada.publicNote ?? "").trim();
  const videoLimpio = (entrada.videoUrl ?? "").trim();
  const tieneEvidenciaVisual = entrada.cantidadFotos > 0 || videoLimpio.length > 0;

  const requisitos: RequisitoFase[] = [
    {
      id: "evidencia_visual",
      titulo: "Evidencia visual de avance (fotografía o video categorizado)",
      cumplido: tieneEvidenciaVisual,
      obligatorio: true,
      orientacion: tieneEvidenciaVisual
        ? `Evidencia cargada (${entrada.cantidadFotos} foto${entrada.cantidadFotos === 1 ? "" : "s"}${videoLimpio ? " + video de inspección" : ""}).`
        : "Sube al menos 1 fotografía a la bóveda o vincula el URL del video de inspección de obra.",
    },
    {
      id: "nota_publica",
      titulo: "Nota pública para el comprador redactada (mín. 20 caracteres)",
      cumplido: notaLimpia.length >= 20,
      obligatorio: true,
      orientacion:
        notaLimpia.length >= 20
          ? "Nota ejecutiva lista para el portal de compradores."
          : "Redacta un resumen claro de los trabajos ejecutados en esta fase (mínimo 20 caracteres).",
    },
    {
      id: "responsable",
      titulo: "Ingeniero o supervisor responsable asignado",
      cumplido: Boolean(entrada.responsibleId),
      obligatorio: true,
      orientacion: entrada.responsibleId
        ? "Supervisor técnico asignado."
        : "Selecciona el ingeniero o supervisor responsable de certificar este avance.",
    },
    {
      id: "fecha_corte",
      titulo: "Fecha de corte de inspección registrada",
      cumplido: Boolean(entrada.statusDate && entrada.statusDate.trim().length > 0),
      obligatorio: false,
      orientacion:
        entrada.statusDate && entrada.statusDate.trim().length > 0
          ? `Fecha de corte: ${entrada.statusDate}`
          : "Recomendado: indica la fecha exacta de la inspección en obra.",
    },
  ];

  const alertasCoherencia: string[] = [];
  if (entrada.status === "completed" && entrada.progressPercent < 100) {
    alertasCoherencia.push(
      `El estado figura como «Completado», pero el porcentaje está en ${entrada.progressPercent}%. Ajusta el deslizador a 100% o cambia el estado a «En curso».`,
    );
  }
  if (entrada.status === "pending" && entrada.progressPercent > 0) {
    alertasCoherencia.push(
      `La fase tiene ${entrada.progressPercent}% de avance pero su estado sigue en «Pendiente». Cámbialo a «En curso» para reflejar la actividad real.`,
    );
  }
  if (entrada.progressPercent === 100 && entrada.status !== "completed") {
    alertasCoherencia.push(
      "El avance alcanzó el 100%, pero el estado aún no se ha marcado como «Completado».",
    );
  }

  const faltantesObligatorios = requisitos
    .filter((r) => r.obligatorio && !r.cumplido)
    .map((r) => r.orientacion);

  const cumplidosCount = requisitos.filter((r) => r.cumplido).length;
  const porcentajeCumplimiento = Math.round((cumplidosCount / requisitos.length) * 100);

  return {
    aptoPublicar: faltantesObligatorios.length === 0 && alertasCoherencia.length === 0,
    porcentajeCumplimiento,
    faltantesObligatorios,
    alertasCoherencia,
    requisitos,
  };
}

