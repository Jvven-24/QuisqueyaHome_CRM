import { extraerDatosDeTranscripcion } from "../../domain/audio-lead-extractor.ts";
import type { PropuestaLeadAudio, ProveedorTranscripcionAudio } from "./puertos.ts";

export async function procesarNotaDeVozLead(
  input: {
    textoDirecto?: string;
    audioBuffer?: Buffer;
    audioMime?: string;
  },
  transcriptor?: ProveedorTranscripcionAudio,
): Promise<PropuestaLeadAudio> {
  let textoFinal = (input.textoDirecto || "").trim();

  if (!textoFinal && input.audioBuffer && transcriptor) {
    textoFinal = await transcriptor.transcribir(input.audioBuffer, input.audioMime || "audio/ogg");
  }

  const datosLead = extraerDatosDeTranscripcion(textoFinal);

  return {
    transcripcion: textoFinal,
    leadSugerido: datosLead,
    requiereConfirmacionHumana: true,
  };
}
