import type { DatosLeadExtraidos } from "../../domain/audio-lead-extractor.ts";

export type ProveedorTranscripcionAudio = {
  transcribir(audioBuffer: Buffer, mimeType: string): Promise<string>;
};

export type PropuestaLeadAudio = {
  transcripcion: string;
  leadSugerido: DatosLeadExtraidos;
  requiereConfirmacionHumana: boolean;
};
