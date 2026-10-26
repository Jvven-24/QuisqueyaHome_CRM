import test from "node:test";
import assert from "node:assert/strict";
import { procesarNotaDeVozLead } from "./casos-de-uso.ts";
import type { ProveedorTranscripcionAudio } from "./puertos.ts";

test("procesarNotaDeVozLead: procesa texto directo y propone HITL", async () => {
  const nota = "Cliente María Gómez busca alquiler amueblado en Santo Domingo Piantini presupuesto 1500 dólares";
  const propuesta = await procesarNotaDeVozLead({ textoDirecto: nota });

  assert.equal(propuesta.transcripcion, nota);
  assert.equal(propuesta.requiereConfirmacionHumana, true);
  assert.equal(propuesta.leadSugerido.fullName, "María Gómez");
  assert.equal(propuesta.leadSugerido.operationType, "rent");
});

test("procesarNotaDeVozLead: delega audio al proveedor de transcripción", async () => {
  const mockTranscriptor: ProveedorTranscripcionAudio = {
    async transcribir() {
      return "Hablé con Carlos Peña, le interesa Bávaro con 140 mil dólares";
    },
  };

  const bufferSimulado = Buffer.from("audio-data");
  const propuesta = await procesarNotaDeVozLead(
    { audioBuffer: bufferSimulado, audioMime: "audio/ogg" },
    mockTranscriptor,
  );

  assert.equal(propuesta.transcripcion, "Hablé con Carlos Peña, le interesa Bávaro con 140 mil dólares");
  assert.equal(propuesta.leadSugerido.fullName, "Carlos Peña");
  assert.equal(propuesta.leadSugerido.zoneInterest, "Bávaro");
  assert.equal(propuesta.requiereConfirmacionHumana, true);
});
