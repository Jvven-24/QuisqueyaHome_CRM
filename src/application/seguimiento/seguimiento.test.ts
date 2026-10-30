import assert from "node:assert/strict";
import { test } from "node:test";
import { ValidationError } from "../../domain/errors.ts";
import { decidirAtribucion, dentroDeVentana, type Atribucion, type Toque } from "./atribucion.ts";
import { atribuirLead, crearEnlace, origenParaCaptura, resolverClic, resolverToques } from "./casos-de-uso.ts";
import { ALFABETO, CODIGO_RE, extraerCodigoDeTexto, generarCodigo, marcaWhatsApp, normalizarCodigo } from "./codigo.ts";
import { construirDestino, CrearEnlaceInput, esRastreador, textoWhatsApp, urlCorta, validarDestinoPortal } from "./enlaces.ts";
import type { Enlace, EnlaceConConteos, NuevoEnlace, RepoSeguimiento } from "./puertos.ts";

const PORTAL = "https://portal.quisqueyahome.example";
const T0 = new Date("2026-10-01T12:00:00Z");
const dia = (n: number) => new Date(T0.getTime() + n * 86400_000);

class Memoria implements RepoSeguimiento {
  enlaces: Enlace[] = []; clics: { linkId: number; visitorId: string; esBot: boolean; en: Date }[] = [];
  atrib = new Map<number, Atribucion>(); contactos = new Map<number, number>();
  async insertarEnlace(d: NuevoEnlace, code: string) {
    if (this.enlaces.some((e) => e.code === code)) return "codigo-repetido" as const;
    const e: Enlace = { ...d, code, id: this.enlaces.length + 1, isActive: true, createdAt: T0 };
    this.enlaces.push(e); return e;
  }
  async enlacePorCodigo(c: string) { return this.enlaces.find((e) => e.code === c) ?? null; }
  async enlacePorAdId(a: string) { return this.enlaces.find((e) => e.adId === a && e.isActive) ?? null; }
  async listarEnlaces(): Promise<EnlaceConConteos[]> { return this.enlaces.map((e) => ({ ...e, clics: 0, visitantes: 0, leads: 0 })); }
  async cambiarActivo(id: number, a: boolean) { const e = this.enlaces.find((x) => x.id === id); if (e) e.isActive = a; return Boolean(e); }
  async registrarClic(c: { linkId: number; visitorId: string; esBot: boolean; en: Date }) { this.clics.push(c); }
  async clicsDeVisitante(v: string, desde: Date) {
    return this.clics.filter((c) => c.visitorId === v && !c.esBot && c.en >= desde).map((c) => ({ enlace: this.enlaces.find((e) => e.id === c.linkId)!, en: c.en }));
  }
  async atribucionDeContacto(c: number) { const l = [...this.contactos].find(([, cc]) => cc === c)?.[0]; return l ? this.atrib.get(l) ?? null : null; }
  async guardarAtribucion(leadId: number, a: Atribucion) {
    const previa = this.atrib.get(leadId);
    this.atrib.set(leadId, { first: previa?.first ?? a.first, last: a.last });
  }
}
const base = { name: "Video torre", destination: "portal" as const, videoUrl: "https://facebook.com/watch/?v=123", campaign: "Torre Naco", portalPath: "/proyectos/torre" };
async function conEnlace(repo: Memoria, extra: Record<string, unknown> = {}, cod = "abc2345") {
  return crearEnlace(repo, { ...base, ...extra }, { origenPortal: PORTAL, creadoPor: 1, codigo: () => cod });
}

test("código: alfabeto sin caracteres ambiguos, sin sesgo y extracción desde el texto de WhatsApp", () => {
  for (let i = 0; i < 200; i++) assert.match(generarCodigo(), CODIGO_RE);
  assert.ok(![..."01ilo"].some((c) => ALFABETO.includes(c)));
  // Bytes ≥ 248 (el resto de 256 % 31) se descartan para no sesgar; se piden más hasta completar.
  const lotes = [new Uint8Array(16).fill(255), Uint8Array.from({ length: 16 }, (_, i) => i)]; let n = 0;
  assert.equal(generarCodigo(() => lotes[n++ % 2]!), [...ALFABETO].slice(0, 7).join(""));
  assert.equal(normalizarCodigo(" ABC2345 "), "abc2345");
  assert.equal(normalizarCodigo("abc2340"), null);
  assert.equal(extraerCodigoDeTexto("Hola, vi su video y quiero información. [QH-ABC2345]"), "abc2345");
  assert.equal(extraerCodigoDeTexto("hola QH-abc234 corto"), null);
  assert.equal(extraerCodigoDeTexto("sin código"), null);
  assert.equal(marcaWhatsApp("abc2345"), "[QH-abc2345]");
});

test("enlaces: valores por defecto, validación y texto de WhatsApp con el código", async () => {
  const repo = new Memoria();
  const e = await conEnlace(repo);
  assert.equal(e.utmSource, "facebook"); assert.equal(e.utmMedium, "video"); assert.equal(e.utmCampaign, "torre-naco");
  assert.equal(urlCorta("https://crm.example/", e.code), "https://crm.example/v/abc2345");
  await assert.rejects(conEnlace(repo, { name: "" }), ValidationError);
  await assert.rejects(conEnlace(repo, { destination: "whatsapp" }), /número de WhatsApp/);
  await assert.rejects(conEnlace(repo, { adId: "abc" }), /solo dígitos/);
  await assert.rejects(conEnlace(repo, { videoUrl: "javascript:alert(1)" }), ValidationError);
  const w = CrearEnlaceInput.parse({ name: "x", destination: "whatsapp", whatsappPhone: "+1 (809) 555-0100" });
  assert.equal(w.whatsappPhone, "18095550100");
  assert.equal(textoWhatsApp({ code: "abc2345", whatsappText: null }), "Hola, vi su video y quiero información. [QH-abc2345]");
  assert.equal(textoWhatsApp({ code: "abc2345", whatsappText: "Quiero precios" }), "Quiero precios [QH-abc2345]");
  assert.equal(textoWhatsApp({ code: "abc2345", whatsappText: "Hola {codigo} gracias" }), "Hola [QH-abc2345] gracias");
});

test("código repetido: reintenta con otro; si siempre choca, falla con mensaje claro", async () => {
  const repo = new Memoria();
  await conEnlace(repo, {}, "abc2345");
  const secuencia = ["abc2345", "abc2345", "xyz9876"]; let i = 0;
  const e = await crearEnlace(repo, base, { origenPortal: PORTAL, creadoPor: 1, codigo: () => secuencia[i++]! });
  assert.equal(e.code, "xyz9876");
  await assert.rejects(crearEnlace(repo, base, { origenPortal: PORTAL, creadoPor: 1, codigo: () => "abc2345" }), /código único/);
});

test("destino del portal: solo el dominio propio (sin redirección abierta)", () => {
  assert.equal(validarDestinoPortal("/proyectos/torre", PORTAL), "/proyectos/torre");
  assert.equal(validarDestinoPortal(`${PORTAL}/p?x=1`, PORTAL), "/p?x=1");
  assert.equal(validarDestinoPortal(undefined, PORTAL), "/");
  for (const malo of ["https://evil.example/x", "//evil.example", "/\\evil.example", "javascript:alert(1)"]) assert.throws(() => validarDestinoPortal(malo, PORTAL), malo);
  assert.throws(() => validarDestinoPortal("/x", ""), /PORTAL_PUBLIC_URL/);
});

test("construirDestino: portal lleva utm_* + qh_c + qh_v; WhatsApp lleva el código en el texto", async () => {
  const repo = new Memoria();
  const p = await conEnlace(repo, { utmContent: "reel-1" });
  const url = new URL(construirDestino(p, { origenPortal: PORTAL, visitorId: "v-1" }));
  assert.equal(url.origin, PORTAL); assert.equal(url.pathname, "/proyectos/torre");
  assert.deepEqual(Object.fromEntries(url.searchParams), { utm_source: "facebook", utm_medium: "video", utm_campaign: "torre-naco", utm_content: "reel-1", qh_c: "abc2345", qh_v: "v-1" });
  const w = await crearEnlace(repo, { name: "WA", destination: "whatsapp", whatsappPhone: "18095550100" }, { origenPortal: "", creadoPor: 1, codigo: () => "wa23456" });
  const wa = new URL(construirDestino(w, { origenPortal: "", visitorId: "v-1" }));
  assert.equal(wa.origin + wa.pathname, "https://wa.me/18095550100");
  assert.match(wa.searchParams.get("text")!, /\[QH-wa23456\]$/);
});

test("clic: registra, crea visitante, ignora bots, desactivado o inexistente → null", async () => {
  const repo = new Memoria(); await conEnlace(repo);
  const a = (await resolverClic(repo, { codigo: "ABC2345", visitorId: null, referrer: "https://l.facebook.com/", userAgent: "Mozilla/5.0 iPhone", origenPortal: PORTAL, ahora: T0 }))!;
  assert.ok(a.nuevoVisitante); assert.match(a.visitorId, /^[0-9a-f-]{36}$/); assert.match(a.destino, /qh_v=/);
  const b = (await resolverClic(repo, { codigo: "abc2345", visitorId: a.visitorId, referrer: null, userAgent: "Mozilla/5.0", origenPortal: PORTAL, ahora: dia(1) }))!;
  assert.ok(!b.nuevoVisitante); assert.equal(b.visitorId, a.visitorId);
  await resolverClic(repo, { codigo: "abc2345", visitorId: null, referrer: null, userAgent: "facebookexternalhit/1.1", origenPortal: PORTAL });
  assert.deepEqual(repo.clics.map((c) => c.esBot), [false, false, true]);
  assert.ok(esRastreador(null) && esRastreador("WhatsApp/2.23") && !esRastreador("Mozilla/5.0 (iPhone) Safari"));
  assert.equal(await resolverClic(repo, { codigo: "zzzzzzz", visitorId: null, referrer: null, userAgent: "x", origenPortal: PORTAL }), null);
  assert.equal(await resolverClic(repo, { codigo: "no valido", visitorId: null, referrer: null, userAgent: "x", origenPortal: PORTAL }), null);
  await repo.cambiarActivo(1, false);
  assert.equal(await resolverClic(repo, { codigo: "abc2345", visitorId: null, referrer: null, userAgent: "x", origenPortal: PORTAL }), null);
  assert.equal(repo.clics.length, 3, "un enlace desactivado no registra clics");
});

test("atribución first/last: el primer toque no se pierde y el último gana", () => {
  const t = (en: Date, code: string, extra: Partial<Toque> = {}): Toque => ({ linkId: 1, code, videoUrl: null, campaign: null, utmSource: "facebook", utmMedium: "video", utmCampaign: null, utmContent: null, adId: null, creativeId: null, canal: "portal", via: "clic_visitante", en, ...extra });
  assert.equal(decidirAtribucion({ clics: [] }), null);
  const solo = decidirAtribucion({ clics: [t(dia(1), "a"), t(dia(3), "b"), t(dia(2), "c")] })!;
  assert.equal(solo.first.code, "a"); assert.equal(solo.last.code, "b");
  const previa: Atribucion = { first: t(dia(-5), "vieja"), last: t(dia(-2), "media") };
  const conPrevia = decidirAtribucion({ previa, clics: [t(dia(1), "a")], directo: null })!;
  assert.equal(conPrevia.first.code, "vieja"); assert.equal(conPrevia.last.code, "a");
  const directo = decidirAtribucion({ previa, clics: [t(dia(1), "a")], directo: t(dia(2), "wa", { via: "codigo_whatsapp", canal: "whatsapp" }) })!;
  assert.equal(directo.first.code, "vieja"); assert.equal(directo.last.code, "wa");
  const sinClics = decidirAtribucion({ previa, clics: [] })!;
  assert.equal(sinClics.last.code, "media");
  assert.ok(dentroDeVentana(new Date(T0.getTime() - 29 * 86400_000), T0) && !dentroDeVentana(new Date(T0.getTime() - 31 * 86400_000), T0) && !dentroDeVentana(dia(1), T0));
});

test("WhatsApp: el código del mensaje liga el lead al video; sin código no hay atribución inventada", async () => {
  const repo = new Memoria(); await conEnlace(repo, { videoTitle: "Torre" });
  const toques = await resolverToques(repo, { canal: "whatsapp", codigo: extraerCodigoDeTexto("Hola [QH-abc2345]") }, dia(1));
  assert.equal(toques.directo?.via, "codigo_whatsapp"); assert.equal(toques.directo?.canal, "whatsapp");
  repo.contactos.set(10, 5);
  const a = (await atribuirLead(repo, { leadId: 10, contactId: 5, toques }))!;
  assert.equal(a.first.code, "abc2345"); assert.equal(repo.atrib.get(10)?.last.videoUrl, base.videoUrl);
  assert.deepEqual(origenParaCaptura(toques), { sourceVideoUrl: base.videoUrl, campaign: "Torre Naco", utmSource: "facebook", utmMedium: "video", utmCampaign: "torre-naco" });
  const nada = await resolverToques(repo, { canal: "whatsapp", codigo: null }, dia(1));
  assert.equal(nada.directo, null); assert.equal(await atribuirLead(repo, { leadId: 11, contactId: 6, toques: nada }), null);
});

test("portal: clic en un video y después otro; first=primero, last=último; fuera de 30 días no cuenta", async () => {
  const repo = new Memoria();
  await conEnlace(repo, {}, "abc2345"); await conEnlace(repo, { name: "Otro video", campaign: "Casa Playa" }, "bcd3456");
  await resolverClic(repo, { codigo: "abc2345", visitorId: null, referrer: null, userAgent: "Mozilla", origenPortal: PORTAL, ahora: dia(0) });
  const v = repo.clics[0]!.visitorId;
  await resolverClic(repo, { codigo: "bcd3456", visitorId: v, referrer: null, userAgent: "Mozilla", origenPortal: PORTAL, ahora: dia(5) });
  const toques = await resolverToques(repo, { canal: "portal", visitorId: v }, dia(6));
  const a = (await atribuirLead(repo, { leadId: 1, contactId: 1, toques }))!;
  assert.equal(a.first.code, "abc2345"); assert.equal(a.last.code, "bcd3456");
  const tarde = await resolverToques(repo, { canal: "portal", visitorId: v }, dia(40));
  assert.equal(tarde.clics.length, 0);
});

test("Meta Lead Ads: un anuncio con enlace propio se liga; uno desconocido queda como utm facebook/lead_ads", async () => {
  const repo = new Memoria(); await conEnlace(repo, { adId: "120000000001" });
  const ligado = await resolverToques(repo, { canal: "meta_lead_ads", adId: "120000000001" }, dia(1));
  assert.equal(ligado.directo?.code, "abc2345"); assert.equal(ligado.directo?.via, "meta_form");
  const suelto = await resolverToques(repo, { canal: "meta_lead_ads", adId: "999999", utm: { source: "facebook", medium: "lead_ads" } }, dia(1));
  assert.equal(suelto.directo?.linkId, null); assert.equal(suelto.directo?.adId, "999999");
});

test("enriquecer con Meta Ads: completa creativo y campaña; si falla, el enlace se crea igual", async () => {
  const repo = new Memoria();
  const e = await crearEnlace(repo, { ...base, campaign: undefined, adId: "120000000001" }, { origenPortal: PORTAL, creadoPor: 1, codigo: () => "abc2345", enriquecer: async () => ({ creativeId: "777777", adName: "Anuncio A", campaign: "Campaña Meta" }) });
  assert.equal(e.creativeId, "777777"); assert.equal(e.adName, "Anuncio A"); assert.equal(e.campaign, "Campaña Meta");
  const f = await crearEnlace(repo, { ...base, adId: "120000000002" }, { origenPortal: PORTAL, creadoPor: 1, codigo: () => "bcd3456", enriquecer: async () => { throw new Error("boom"); } });
  assert.equal(f.creativeId, null);
});

// ---------- Correcciones de la revisión cruzada ----------
test("destino del portal: caracteres de control y espacios no convierten «/\\n/host» en redirección externa", () => {
  for (const mala of ["/\n/evil.example", "/\t/evil.example", "/\r\n/evil.example", "/ /evil.example", "/\u0000/evil.example", "//evil.example", "/\\evil.example"]) {
    assert.throws(() => validarDestinoPortal(mala, PORTAL), /no es válida/, JSON.stringify(mala));
  }
  const l = { code: "abc2345", destination: "portal" as const, portalPath: "/proyectos/torre", whatsappPhone: null, whatsappText: null, utmSource: "facebook", utmMedium: "video", utmCampaign: null, utmContent: null, utmTerm: null, adId: null, creativeId: null };
  assert.ok(construirDestino(l, { origenPortal: PORTAL, visitorId: "v" }).startsWith(`${PORTAL}/proyectos/torre?`));
  // Aunque una fila vieja de la base de datos trajera una ruta peligrosa, el destino final se comprueba contra el origen.
  assert.throws(() => construirDestino({ ...l, portalPath: "/\n/evil.example" }, { origenPortal: PORTAL, visitorId: "v" }));
});

test("último toque: un clic antiguo no hace retroceder el último toque ya registrado", () => {
  const toque = (n: number, code: string): Toque => ({ linkId: 1, code, videoUrl: null, campaign: null, utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, adId: null, creativeId: null, canal: "portal", via: "clic_visitante", en: dia(n) });
  const previa: Atribucion = { first: toque(-30, "primero"), last: toque(20, "reciente") };
  const r = decidirAtribucion({ previa, clics: [toque(15, "viejo")] })!;
  assert.equal(r.last.code, "reciente");
  assert.equal(r.first.code, "primero");
  assert.equal(decidirAtribucion({ previa, clics: [toque(25, "nuevo")] })!.last.code, "nuevo");
  assert.equal(decidirAtribucion({ previa, clics: [toque(15, "viejo")], directo: toque(22, "directo") })!.last.code, "directo");
});

test("clic: si falla el registro de analítica la persona llega igual a su destino", async () => {
  const repo = new Memoria();
  await crearEnlace(repo, { name: "Video", destination: "portal", portalPath: "/p" }, { origenPortal: PORTAL, creadoPor: 1 });
  repo.registrarClic = async () => { throw new Error("base de datos caída"); };
  const r = await resolverClic(repo, { codigo: repo.enlaces[0]!.code, visitorId: null, referrer: null, userAgent: "Mozilla/5.0", origenPortal: PORTAL, ahora: T0 });
  assert.ok(r && r.destino.startsWith(`${PORTAL}/p?`));
});
