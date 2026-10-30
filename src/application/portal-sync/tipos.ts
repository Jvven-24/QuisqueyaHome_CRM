/** Capa Portal ↔ CRM. El CRM es la fuente de verdad del inventario: el portal solo recibe la proyección pública. */

export type EstadoUnidadPublico = "available" | "reserved" | "unavailable";

export type UnidadPublica = {
  code: string;
  unitType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  builtAreaM2: number | null;
  floorLevel: number | null;
  tower: string | null;
  status: EstadoUnidadPublico;
  /** Solo el rango público. Nunca el precio real ni notas internas. */
  publicPriceMinCents: number | null;
  publicPriceMaxCents: number | null;
};

export type ProyectoPublico = {
  slug: string;
  name: string;
  zone: string | null;
  projectType: string;
  operationType: string;
  developer: string | null;
  description: string | null;
  estimatedDeliveryDate: string | null;
  progressPercent: number;
  currency: string;
  publicRangeMinCents: number | null;
  publicRangeMaxCents: number | null;
  videoUrl: string | null;
  units: UnidadPublica[];
};

/** Lo que el portal dice tener de origen CRM: slug + huella del contenido que recibió. */
export type EntradaPortal = { slug: string; huella: string };

export type FuenteProyectos = { proyectosPublicables(): Promise<ProyectoPublico[]> };

/** Adaptador hacia el portal (HTTP en producción, memoria en pruebas). Las tres operaciones son idempotentes. */
export type PuertoPortal = {
  listar(): Promise<EntradaPortal[]>;
  publicar(proyecto: ProyectoPublico, huella: string): Promise<void>;
  retirar(slug: string): Promise<void>;
};

export type Accion = { tipo: "crear" | "actualizar" | "retirar" | "sin_cambios"; slug: string };

export type ResultadoSync = {
  simulacro: boolean;
  creados: number;
  actualizados: number;
  retirados: number;
  sinCambios: number;
  errores: { slug: string; error: string }[];
  acciones: Accion[];
};
