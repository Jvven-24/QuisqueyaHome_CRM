/** Analítica de origen de leads: agrupa por video, fuente y campaña; embudo, conversión y Speed To Lead. Sin E/S. */

/** Objetivo de Speed To Lead: primer contacto en los primeros 5 minutos. */
export const UMBRAL_STL_MINUTOS = 5;
export const SIN_DATO = { video: "Sin video identificado", fuente: "Sin fuente", campana: "Sin campaña" } as const;

export type FilaOrigen = {
  leadId: number; receivedAt: Date; firstContactedAt: Date | null; status: string;
  /** Qué enlace de seguimiento lo originó (null = origen conocido solo por UTM/campos del lead). */
  linkId: number | null; linkName: string | null; videoUrl: string | null; videoTitle: string | null;
  campaign: string | null; utmSource: string | null; utmMedium: string | null; adId: string | null;
  atribuido: boolean;
};
export type ClicsEnlace = { linkId: number; nombre: string; clics: number; visitantes: number };

export type Grupo = { clave: string; etiqueta: string; leads: number; contactados: number; convertidos: number; descartados: number; conversion: number; stlMedianaMin: number | null; stlEnMetaPct: number | null; clics: number | null; visitantes: number | null };
export type Analitica = {
  resumen: { leads: number; contactados: number; convertidos: number; descartados: number; conversion: number; sinAtribucion: number; stlMedianaMin: number | null; stlEnMetaPct: number | null; clics: number; visitantes: number };
  embudo: { etapa: string; valor: number; detalle: string }[];
  porVideo: Grupo[]; porFuente: Grupo[]; porCampana: Grupo[];
  porDia: { dia: string; leads: number }[];
};

export const minutosHastaContacto = (f: Pick<FilaOrigen, "receivedAt" | "firstContactedAt">): number | null => {
  if (!f.firstContactedAt) return null;
  const min = (f.firstContactedAt.getTime() - f.receivedAt.getTime()) / 60000;
  return min >= 0 ? min : null; // un contacto «anterior» a la recepción es un dato corrupto: no cuenta
};
export function mediana(v: number[]): number | null {
  if (v.length === 0) return null;
  const s = [...v].sort((a, b) => a - b); const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}
const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 1000) / 10);
const contactado = (f: FilaOrigen) => f.firstContactedAt != null || f.status === "contacted" || f.status === "converted";

function agrupar(filas: FilaOrigen[], clave: (f: FilaOrigen) => { k: string; e: string }, clics?: Map<string, { clics: number; visitantes: number }>): Grupo[] {
  const m = new Map<string, { e: string; filas: FilaOrigen[] }>();
  for (const f of filas) { const { k, e } = clave(f); const g = m.get(k) ?? { e, filas: [] }; g.filas.push(f); m.set(k, g); }
  // Un video con clics pero sin leads también aparece: ahí está la fuga que más interesa ver.
  for (const k of clics?.keys() ?? []) if (!m.has(k)) m.set(k, { e: k, filas: [] });
  return [...m].map(([k, g]): Grupo => {
    const stl = g.filas.map(minutosHastaContacto).filter((x): x is number => x != null);
    const conv = g.filas.filter((f) => f.status === "converted").length;
    const c = clics?.get(k);
    return {
      clave: k, etiqueta: g.e, leads: g.filas.length, contactados: g.filas.filter(contactado).length, convertidos: conv,
      descartados: g.filas.filter((f) => f.status === "discarded").length, conversion: pct(conv, g.filas.length),
      stlMedianaMin: mediana(stl), stlEnMetaPct: stl.length ? pct(stl.filter((x) => x <= UMBRAL_STL_MINUTOS).length, stl.length) : null,
      clics: c ? c.clics : null, visitantes: c ? c.visitantes : null,
    };
  }).sort((a, b) => b.leads - a.leads || (b.clics ?? 0) - (a.clics ?? 0) || a.etiqueta.localeCompare(b.etiqueta, "es"));
}

/** Los días del CRM son de República Dominicana (UTC−4, sin horario de verano). */
export const DESFASE_RD_MS = 4 * 3600 * 1000;
const DIA_MS = 86400000;
const dia = (d: Date) => new Date(d.getTime() - DESFASE_RD_MS).toISOString().slice(0, 10);
/** Inicio (00:00 hora RD) del día que contiene `d`. */
const inicioDia = (d: Date) => new Date(Math.floor((d.getTime() - DESFASE_RD_MS) / DIA_MS) * DIA_MS + DESFASE_RD_MS);

export function analizar(filas: FilaOrigen[], clics: ClicsEnlace[], rango: { desde: Date; hasta: Date }): Analitica {
  const stl = filas.map(minutosHastaContacto).filter((x): x is number => x != null);
  const conv = filas.filter((f) => f.status === "converted").length;
  const contactados = filas.filter(contactado).length;
  const totalClics = clics.reduce((a, c) => a + c.clics, 0);
  const totalVis = clics.reduce((a, c) => a + c.visitantes, 0);
  const porClave = new Map(clics.map((c) => [`enlace:${c.linkId}`, { clics: c.clics, visitantes: c.visitantes }]));
  const nombreEnlace = new Map(clics.map((c) => [`enlace:${c.linkId}`, c.nombre]));

  const porVideo = agrupar(filas, (f) => f.linkId != null ? { k: `enlace:${f.linkId}`, e: f.linkName ?? f.videoTitle ?? f.videoUrl ?? `Enlace ${f.linkId}` } : f.videoUrl ? { k: `url:${f.videoUrl}`, e: f.videoTitle ?? f.videoUrl } : { k: "sin-video", e: SIN_DATO.video }, porClave)
    .map((g) => ({ ...g, etiqueta: nombreEnlace.get(g.clave) ?? g.etiqueta }));
  const porFuente = agrupar(filas, (f) => { const s = f.utmSource?.trim().toLowerCase(); if (!s) return { k: "sin-fuente", e: SIN_DATO.fuente }; const m = f.utmMedium?.trim().toLowerCase(); return { k: `${s}/${m ?? ""}`, e: m ? `${s} · ${m}` : s }; });
  const porCampana = agrupar(filas, (f) => { const c = f.campaign?.trim(); return c ? { k: c.toLowerCase(), e: c } : { k: "sin-campana", e: SIN_DATO.campana }; });

  const dias = new Map<string, number>();
  for (let t = inicioDia(rango.desde).getTime(); t <= rango.hasta.getTime() && dias.size < 400; t += DIA_MS) dias.set(dia(new Date(t)), 0);
  for (const f of filas) { const k = dia(f.receivedAt); if (dias.has(k)) dias.set(k, dias.get(k)! + 1); }

  return {
    resumen: { leads: filas.length, contactados, convertidos: conv, descartados: filas.filter((f) => f.status === "discarded").length, conversion: pct(conv, filas.length), sinAtribucion: filas.filter((f) => !f.atribuido).length, stlMedianaMin: mediana(stl), stlEnMetaPct: stl.length ? pct(stl.filter((x) => x <= UMBRAL_STL_MINUTOS).length, stl.length) : null, clics: totalClics, visitantes: totalVis },
    embudo: [
      { etapa: "Visitantes", valor: totalVis, detalle: `${totalClics} clics en enlaces` },
      { etapa: "Leads", valor: filas.length, detalle: totalVis ? `${pct(filas.length, totalVis)} % de los visitantes` : "Sin clics registrados" },
      { etapa: "Contactados", valor: contactados, detalle: `${pct(contactados, filas.length)} % de los leads` },
      { etapa: "Convertidos", valor: conv, detalle: `${pct(conv, filas.length)} % de los leads` },
    ],
    porVideo, porFuente, porCampana,
    porDia: [...dias].map(([d, leads]) => ({ dia: d, leads })),
  };
}

/** Filtros de la URL → rango (días completos, hora RD). Sin fechas: últimos 30 días. Nunca más de un año. */
export function rangoDeFiltros(p: { desde?: string; hasta?: string }, ahora: Date): { desde: Date; hasta: Date } {
  const f = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) ? new Date(Date.parse(`${s}T00:00:00.000Z`) + DESFASE_RD_MS) : null);
  const fin = (d: Date) => new Date(d.getTime() + DIA_MS - 1);
  const hasta0 = f(p.hasta);
  let hasta = hasta0 ? fin(hasta0) : ahora;
  let desde = f(p.desde) ?? new Date(inicioDia(hasta).getTime() - 29 * DIA_MS);
  if (desde > hasta) { const d = desde; desde = inicioDia(hasta); hasta = fin(inicioDia(d)); }
  const tope = new Date(inicioDia(hasta).getTime() - 365 * DIA_MS);
  if (desde < tope) desde = tope;
  return { desde, hasta };
}

export function formatoMinutos(min: number | null): string {
  if (min == null) return "—";
  if (min < 1) return "< 1 min";
  if (min < 60) return `${Math.round(min)} min`;
  if (min < 1440) return `${Math.round((min / 60) * 10) / 10} h`;
  return `${Math.round((min / 1440) * 10) / 10} d`;
}
