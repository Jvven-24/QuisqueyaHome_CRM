import { z } from "zod";
import { procesarNotaDeVozLead } from "@/application/ai/casos-de-uso";
import { requireScope } from "@/domain/rbac";
import { demasiadasPeticiones, leerJsonLimitado, limiteAudio } from "@/infrastructure/limites";
import { requireActor } from "@/infrastructure/auth/actor";
import { errorResponse, parseInput } from "@/infrastructure/http";

const AUDIO_MIMES_PERMITIDOS = [
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-m4a",
] as const;

const TranscribirAudioInput = z
  .object({
    texto: z.string().trim().max(4000, "El texto transcrito no puede superar 4000 caracteres.").optional(),
    audioBase64: z
      .string()
      .max(14_000_000, "El archivo de audio excede el tamaño máximo permitido (10 MB).")
      .optional(),
    audioMime: z.enum(AUDIO_MIMES_PERMITIDOS).optional().default("audio/ogg"),
  })
  .refine((v) => Boolean((v.texto && v.texto.length > 0) || (v.audioBase64 && v.audioBase64.length > 0)), {
    message: "Envía el texto dictado o el audio de la nota de voz.",
  });

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    requireScope(actor, "leads", "create");

    const espera = limiteAudio.consumir(String(actor.userId));
    if (espera) return demasiadasPeticiones(espera);
    // ~15 MB de audio en base64 (+33 %).
    const cuerpo = await leerJsonLimitado(request, 20 * 1024 * 1024);
    if (cuerpo instanceof Response) return cuerpo;
    const datos = parseInput(TranscribirAudioInput, cuerpo);

    let audioBuffer: Buffer | undefined;
    if (datos.audioBase64) {
      audioBuffer = Buffer.from(datos.audioBase64, "base64");
    }

    const resultado = await procesarNotaDeVozLead({
      textoDirecto: datos.texto,
      audioBuffer,
      audioMime: datos.audioMime,
    });

    return Response.json({ ok: true, propuesta: resultado });
  } catch (error) {
    return errorResponse(error);
  }
}
