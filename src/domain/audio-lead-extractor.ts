/**
 * Extractor semántico de leads a partir de notas de voz transcritas (M02 / D18).
 *
 * Dominio puro: sin dependencias de OpenAI, Groq, Drizzle ni Supabase.
 * Diseñado con tolerancia al dialecto inmobiliario dominicano y latino
 * para prellenar prospectos con confirmación de 1 clic (Human-in-the-Loop).
 */

import { OPERATION_TYPES } from "./catalogs.ts";

export type OperationType = (typeof OPERATION_TYPES)[number];

export type DatosLeadExtraidos = {
  fullName: string | null;
  phone: string | null;
  zoneInterest: string | null;
  projectInterestText: string | null;
  operationType: OperationType;
  budgetMinCents: number | null;
  budgetMaxCents: number | null;
  currency: "USD" | "DOP";
  sugerenciaActividad: string | null;
  confianza: number; // 0.0 a 1.0
  notasResumen: string;
};

const ZONAS_CATALOGO = [
  "Cap Cana",
  "Punta Cana",
  "Bávaro",
  "Las Terrenas",
  "Samaná",
  "Piantini",
  "Naco",
  "Bella Vista",
  "Serrallés",
  "La Julia",
  "Gazcue",
  "Santo Domingo",
  "Downtown Punta Cana",
  "Cana Rock",
  "Jarabacoa",
  "Constanza",
  "Santiago",
  "Puerto Plata",
  "Sosúa",
  "Cabarete",
  "Juan Dolio",
  "La Romana",
  "Casa de Campo",
];

const PROYECTOS_CONOCIDOS = [
  "Cana Rock",
  "Serena Village",
  "Palma Real",
  "Atlantida",
  "Crisfer",
  "River Island",
  "Larimar City",
  "Moon Garden",
  "Punta Palmera",
];

export function extraerDatosDeTranscripcion(texto: string): DatosLeadExtraidos {
  const t = (texto || "").trim();
  if (!t) {
    return {
      fullName: null,
      phone: null,
      zoneInterest: null,
      projectInterestText: null,
      operationType: "sale",
      budgetMinCents: null,
      budgetMaxCents: null,
      currency: "USD",
      sugerenciaActividad: null,
      confianza: 0,
      notasResumen: "",
    };
  }

  let camposIdentificados = 0;
  const totalCamposEsperados = 5;

  // 1. Extracción de Nombre
  let fullName: string | null = null;
  const matchPrefijo = t.match(/(?:habl[ée]\s+con|cliente\s+|con\s+|tengo\s+a\s+|prospecto\s+|se\s+llama\s+)(.+)/i);
  const textoParaNombre = matchPrefijo?.[1] ?? t;

  const stopWords = new Set([
    "al", "a", "en", "con", "de", "del", "busca", "buscando", "quiere", "queriendo",
    "interesa", "interesado", "interesada", "tiene", "para", "presupuesto", "quedamos",
    "favor", "llamar", "llamarlo", "llamarla", "y", "o", "un", "una", "el", "la", "los", "las", "por",
    "le", "les", "me", "se", "nos", "que", "es", "este", "esta", "apartamento", "villa", "casa"
  ]);

  const palabras = textoParaNombre.split(/\s+/);
  const tokensNombre: string[] = [];
  for (const palabra of palabras) {
    const limpia = palabra.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ]/g, "");
    if (!limpia) continue;
    if (stopWords.has(limpia.toLowerCase())) break;
    tokensNombre.push(limpia.charAt(0).toUpperCase() + limpia.slice(1).toLowerCase());
    if (tokensNombre.length >= 3) break;
  }

  if (tokensNombre.length >= 2) {
    fullName = tokensNombre.join(" ");
    camposIdentificados++;
  } else if (tokensNombre.length === 1 && matchPrefijo && tokensNombre[0]) {
    fullName = tokensNombre[0];
    camposIdentificados++;
  }

  // 2. Extracción de Teléfono
  let phone: string | null = null;
  const matchTelefono = t.match(/(?:\+?1[-.\s]?)?\(?(?:809|829|849)\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{1,3}[-.\s]?\d{6,14}/);
  if (matchTelefono) {
    phone = matchTelefono[0].replace(/[\s().-]/g, "");
    if (!phone.startsWith("+") && phone.length === 10) {
      phone = `+1${phone}`;
    }
    camposIdentificados++;
  }

  // 3. Extracción de Zona o Proyecto de Interés
  let zoneInterest: string | null = null;
  for (const zona of ZONAS_CATALOGO) {
    const regex = new RegExp(`\\b${zona}\\b`, "i");
    if (regex.test(t)) {
      zoneInterest = zona;
      camposIdentificados++;
      break;
    }
  }

  let projectInterestText: string | null = null;
  for (const proj of PROYECTOS_CONOCIDOS) {
    const regex = new RegExp(`\\b${proj}\\b`, "i");
    if (regex.test(t)) {
      projectInterestText = proj;
      break;
    }
  }

  // 4. Tipo de Operación (Venta / Alquiler)
  let operationType: OperationType = "sale";
  if (/\b(?:alquiler|renta|alquilar|rent)\b/i.test(t)) {
    operationType = "rent";
  }

  // 5. Moneda
  let currency: "USD" | "DOP" = "USD";
  if (/\b(?:pesos|dop|rd\$)\b/i.test(t)) {
    currency = "DOP";
  }

  // 6. Presupuesto (en centavos)
  let budgetMinCents: number | null = null;
  let budgetMaxCents: number | null = null;

  // Rango: "entre X y Y mil [dólares]"
  const matchRangoMil = t.match(/entre\s+(\d+(?:[.,]\d+)?)\s*(?:mil)?\s*y\s*(\d+(?:[.,]\d+)?)\s*mil\b/i);
  if (matchRangoMil && matchRangoMil[1] && matchRangoMil[2]) {
    const minVal = parseFloat(matchRangoMil[1].replace(",", "."));
    const maxVal = parseFloat(matchRangoMil[2].replace(",", "."));
    budgetMinCents = Math.round(minVal * 1000 * 100);
    budgetMaxCents = Math.round(maxVal * 1000 * 100);
    camposIdentificados++;
  } else {
    // Monto con "mil": "140 mil", "unos 200 mil"
    const matchMil = t.match(/(?:unos|presupuesto(?: de)?|tiene)?\s*(\d+(?:[.,]\d+)?)\s*mil\b/i);
    if (matchMil && matchMil[1]) {
      const val = parseFloat(matchMil[1].replace(",", "."));
      const cents = Math.round(val * 1000 * 100);
      budgetMinCents = cents;
      budgetMaxCents = cents;
      camposIdentificados++;
    } else {
      // Monto directo con número: "presupuesto 1500 dólares", "presupuesto 2500"
      const matchDirecto = t.match(/presupuesto\s*(?:de\s*)?(?:us\$|\$)?\s*(\d{3,7})/i);
      if (matchDirecto && matchDirecto[1]) {
        const val = parseInt(matchDirecto[1], 10);
        const cents = val * 100;
        budgetMinCents = cents;
        budgetMaxCents = cents;
        camposIdentificados++;
      }
    }
  }

  // 7. Próxima Actividad Sugerida
  let sugerenciaActividad: string | null = null;
  const matchQuedamos = t.match(/(?:quedamos en|hay que|debo|favor|toca)\s+([^.,;]+)/i);
  if (matchQuedamos && matchQuedamos[1]) {
    sugerenciaActividad = matchQuedamos[1].trim();
    sugerenciaActividad = sugerenciaActividad.charAt(0).toUpperCase() + sugerenciaActividad.slice(1);
    camposIdentificados++;
  } else {
    const matchAccion = t.match(/(?:llamar|enviar brochure|agendar visita|dar seguimiento|cotizar)\s+([^.,;]+)/i);
    if (matchAccion && matchAccion[0]) {
      sugerenciaActividad = matchAccion[0].trim();
      sugerenciaActividad = sugerenciaActividad.charAt(0).toUpperCase() + sugerenciaActividad.slice(1);
      camposIdentificados++;
    }
  }

  const confianza = Math.min(1.0, Math.round((camposIdentificados / totalCamposEsperados) * 100) / 100);

  return {
    fullName,
    phone,
    zoneInterest,
    projectInterestText,
    operationType,
    budgetMinCents,
    budgetMaxCents,
    currency,
    sugerenciaActividad,
    confianza,
    notasResumen: t,
  };
}
