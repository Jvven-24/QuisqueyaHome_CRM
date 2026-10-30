import assert from "node:assert/strict";
import { test } from "node:test";
import { analizar, formatoMinutos, mediana, minutosHastaContacto, rangoDeFiltros, UMBRAL_STL_MINUTOS, type ClicsEnlace, type FilaOrigen } from "./analitica.ts";

const t = (iso: string) => new Date(iso);
let n = 0;
const fila = (o: Partial<FilaOrigen> & { recibido: string; contacto?: string | null }): FilaOrigen => ({
  leadId: ++n, receivedAt: t(o.recibido), firstContactedAt: o.contacto ? t(o.contacto) : null, status: "new", linkId: null, linkName: null, videoUrl: null, videoTitle: null,
  campaign: null, utmSource: null, utmMedium: null, adId: null, atribuido: false, ...o,
});
const rango = { desde: t("2026-10-01T04:00:00Z"), hasta: t("2026-10-04T03:59:59Z") };
const clics: ClicsEnlace[] = [{ linkId: 1, nombre: "Video torre", clics: 40, visitantes: 30 }, { linkId: 2, nombre: "Video playa", clics: 10, visitantes: 9 }, { linkId: 3, nombre: "Sin leads", clics: 5, visitantes: 5 }];
const filas: FilaOrigen[] = [
  fila({ recibido: "2026-10-01T15:00:00Z", contacto: "2026-10-01T15:03:00Z", status: "converted", linkId: 1, linkName: "Video torre", utmSource: "facebook", utmMedium: "video", campaign: "Torre", atribuido: true }),
  fila({ recibido: "2026-10-01T16:00:00Z", contacto: "2026-10-01T16:30:00Z", status: "contacted", linkId: 1, linkName: "Video torre", utmSource: "facebook", utmMedium: "video", campaign: "Torre", atribuido: true }),
  fila({ recibido: "2026-10-02T10:00:00Z", status: "new", linkId: 2, linkName: "Video playa", utmSource: "Facebook", utmMedium: "video", campaign: "Playa", atribuido: true }),
  fila({ recibido: "2026-10-03T01:00:00Z", contacto: "2026-10-03T01:01:00Z", status: "discarded", utmSource: "whatsapp", utmMedium: "inbound" }), // 21:00 del 2-oct en RD
  fila({ recibido: "2026-10-03T12:00:00Z", status: "new", videoUrl: "https://youtube.com/watch?v=1", videoTitle: "YT" }),
];

test("resumen: conversión, contactados y Speed To Lead (mediana y % dentro de la meta)", () => {
  const a = analizar(filas, clics, rango);
  assert.equal(a.resumen.leads, 5); assert.equal(a.resumen.convertidos, 1); assert.equal(a.resumen.conversion, 20);
  assert.equal(a.resumen.contactados, 3); assert.equal(a.resumen.descartados, 1); assert.equal(a.resumen.sinAtribucion, 2);
  assert.equal(a.resumen.stlMedianaMin, 3); // 3, 30 y 1 min
  assert.equal(a.resumen.stlEnMetaPct, 66.7); assert.equal(UMBRAL_STL_MINUTOS, 5);
  assert.equal(a.resumen.clics, 55); assert.equal(a.resumen.visitantes, 44);
});

test("por video: enlace con clics aunque no tenga leads, normalización de fuente y campaña sin dato", () => {
  const a = analizar(filas, clics, rango);
  const torre = a.porVideo.find((g) => g.etiqueta === "Video torre")!;
  assert.deepEqual([torre.leads, torre.convertidos, torre.conversion, torre.clics, torre.visitantes, torre.stlMedianaMin], [2, 1, 50, 40, 30, 16.5]);
  assert.ok(a.porVideo.some((g) => g.etiqueta === "Sin leads" && g.leads === 0 && g.clics === 5), "la fuga (clics sin leads) se ve");
  assert.ok(a.porVideo.some((g) => g.etiqueta === "YT" && g.clics === null));
  assert.ok(a.porVideo.some((g) => g.etiqueta === "Sin video identificado"));
  assert.equal(a.porFuente.find((g) => g.clave === "facebook/video")!.leads, 3, "Facebook y facebook son la misma fuente");
  assert.ok(a.porFuente.some((g) => g.etiqueta === "whatsapp · inbound"));
  assert.equal(a.porCampana.find((g) => g.etiqueta === "Sin campaña")!.leads, 2);
  assert.deepEqual(a.porVideo.map((g) => g.leads), [...a.porVideo.map((g) => g.leads)].sort((x, y) => y - x));
});

test("embudo y serie diaria en hora de República Dominicana", () => {
  const a = analizar(filas, clics, rango);
  assert.deepEqual(a.embudo.map((e) => [e.etapa, e.valor]), [["Visitantes", 44], ["Leads", 5], ["Contactados", 3], ["Convertidos", 1]]);
  assert.deepEqual(a.porDia, [{ dia: "2026-10-01", leads: 2 }, { dia: "2026-10-02", leads: 2 }, { dia: "2026-10-03", leads: 1 }]);
  const vacio = analizar([], [], rango);
  assert.equal(vacio.resumen.conversion, 0); assert.equal(vacio.resumen.stlMedianaMin, null); assert.equal(vacio.porVideo.length, 0);
});

test("Speed To Lead ignora contactos anteriores a la recepción y formatea tiempos", () => {
  assert.equal(minutosHastaContacto(fila({ recibido: "2026-10-01T10:00:00Z", contacto: "2026-10-01T09:00:00Z" })), null);
  assert.equal(mediana([]), null); assert.equal(mediana([5, 1, 3, 9]), 4);
  assert.deepEqual([null, 0.2, 7, 90, 3000].map((m) => formatoMinutos(m)), ["—", "< 1 min", "7 min", "1.5 h", "2.1 d"]);
});

test("filtros de fecha: por defecto 30 días, valores inválidos ignorados, orden corregido y tope de un año", () => {
  const ahora = t("2026-10-30T18:00:00Z");
  const def = rangoDeFiltros({}, ahora);
  assert.equal(def.hasta.getTime(), ahora.getTime()); assert.equal(def.desde.toISOString(), "2026-10-01T04:00:00.000Z");
  const r = rangoDeFiltros({ desde: "2026-10-05", hasta: "2026-10-07" }, ahora);
  assert.equal(r.desde.toISOString(), "2026-10-05T04:00:00.000Z"); assert.equal(r.hasta.toISOString(), "2026-10-08T03:59:59.999Z");
  const invertido = rangoDeFiltros({ desde: "2026-10-09", hasta: "2026-10-07" }, ahora);
  assert.ok(invertido.desde < invertido.hasta);
  assert.equal(rangoDeFiltros({ desde: "no-fecha", hasta: "2026-13-45" }, ahora).hasta.getTime(), ahora.getTime());
  const largo = rangoDeFiltros({ desde: "2020-01-01", hasta: "2026-10-07" }, ahora);
  assert.ok(largo.hasta.getTime() - largo.desde.getTime() <= 367 * 86400000);
});

test("sin alcance sobre los clics no se inventa la etapa de visitantes en cero; los sin contactar se cuentan aparte", () => {
  const f = (id: number, extra: Partial<FilaOrigen> = {}): FilaOrigen => ({ leadId: id, receivedAt: new Date("2026-10-01T15:00:00Z"), firstContactedAt: null, status: "new", linkId: 1, linkName: "A", videoTitle: null, videoUrl: null, campaign: "c", utmSource: "facebook", utmMedium: "video", adId: null, atribuido: true, ...extra });
  const filas = [f(1, { firstContactedAt: new Date("2026-10-01T15:01:00Z"), status: "contacted" }), f(2), f(3, { atribuido: false, linkId: null })];
  const rango = { desde: new Date("2026-10-01T04:00:00Z"), hasta: new Date("2026-10-02T03:59:59Z") };
  const parcial = analizar(filas, null, rango);
  assert.deepEqual(parcial.embudo.map((e) => e.etapa), ["Leads", "Contactados", "Convertidos"]);
  assert.equal(parcial.resumen.sinContactar, 2);
  assert.equal(parcial.resumen.stlEnMetaPct, 100, "100 % de los contactados… pero hay 2 sin contactar a la vista");
  const total = analizar(filas, [{ linkId: 1, nombre: "A", clics: 4, visitantes: 3 }], rango);
  assert.deepEqual(total.embudo.map((e) => e.etapa), ["Visitantes", "Leads", "Contactados", "Convertidos"]);
  assert.match(total.embudo[1]!.detalle, /2 con enlace/);
});
