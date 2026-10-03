import { z } from "zod";
import { procesarNotaDeVozLead } from "@/application/ai/casos-de-uso";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { errorResponse, parseInput } from "@/infrastructure/http";

const TranscribirAudioInput = z.object({
  texto: z.string().optional(),
  audioBase64: z.string().optional(),
  audioMime: z.string().optional().default("audio/ogg"),
});

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    requireScope(actor, "leads", "create");

    const cuerpo = await request.json().catch(() => ({}));
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
