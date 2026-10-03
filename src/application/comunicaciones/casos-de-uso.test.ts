import test from "node:test";
import assert from "node:assert/strict";
import {
  crearPlantillaMensaje,
  actualizarPlantillaMensaje,
  prepararYDespacharMensaje,
} from "./casos-de-uso.ts";
import type {
  RepositorioComunicaciones,
  ProveedorDespachoCanal,
  PlantillaMensaje,
  MensajeADespachar,
  ResultadoDespacho,
  EstadoCanal,
} from "./puertos.ts";

class RepositorioComunicacionesFalso implements RepositorioComunicaciones {
  public plantillas: PlantillaMensaje[] = [];
  private nextId = 1;

  async listarPlantillas(canal?: string, category?: string): Promise<PlantillaMensaje[]> {
    return this.plantillas.filter((p) => {
      if (canal && p.channel !== canal) return false;
      if (category && p.category !== category) return false;
      return true;
    });
  }

  async obtenerPlantillaPorId(id: number): Promise<PlantillaMensaje | null> {
    return this.plantillas.find((p) => p.id === id) ?? null;
  }

  async crearPlantilla(
    datos: Omit<PlantillaMensaje, "id" | "createdAt" | "updatedAt">,
  ): Promise<PlantillaMensaje> {
    const item: PlantillaMensaje = {
      id: this.nextId++,
      ...datos,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.plantillas.push(item);
    return item;
  }

  async actualizarPlantilla(
    id: number,
    datos: Partial<Omit<PlantillaMensaje, "id" | "createdAt" | "updatedAt">>,
  ): Promise<PlantillaMensaje> {
    const idx = this.plantillas.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("No existe");
    const previa = this.plantillas[idx]!;
    const actualizada: PlantillaMensaje = {
      ...previa,
      ...datos,
      updatedAt: new Date(),
    };
    this.plantillas[idx] = actualizada;
    return actualizada;
  }

  async obtenerEstadosCanales(): Promise<EstadoCanal[]> {
    return [
      {
        canal: "telegram",
        activo: true,
        configurado: true,
        detalles: { costoPorMensajeUSD: 0 },
      },
      {
        canal: "whatsapp",
        activo: false,
        configurado: false,
        detalles: { costoPorMensajeUSD: 0.05 },
      },
    ];
  }
}

class ProveedorDespachoEspia implements ProveedorDespachoCanal {
  public despachados: MensajeADespachar[] = [];

  async despachar(mensaje: MensajeADespachar): Promise<ResultadoDespacho> {
    this.despachados.push(mensaje);
    return {
      ok: true,
      canal: mensaje.canal,
      mensajeId: "msg_test_123",
      enviadoAt: new Date(),
    };
  }
}

test("crearPlantillaMensaje: extrae variables automáticamente y guarda", async () => {
  const repo = new RepositorioComunicacionesFalso();
  const creada = await crearPlantillaMensaje(repo, {
    name: "Bienvenida Lead",
    category: "Prospección",
    channel: "telegram",
    body: "Hola {nombre}, bienvenido a {proyecto}. Tu broker asignado es {broker}.",
  });

  assert.equal(creada.name, "Bienvenida Lead");
  assert.equal(creada.channel, "telegram");
  assert.deepEqual(creada.variables, ["nombre", "proyecto", "broker"]);
  assert.equal(repo.plantillas.length, 1);
});

test("crearPlantillaMensaje: rechaza nombre o cuerpo vacío", async () => {
  const repo = new RepositorioComunicacionesFalso();
  await assert.rejects(
    () =>
      crearPlantillaMensaje(repo, {
        name: "",
        channel: "telegram",
        body: "Hola",
      }),
    /El nombre de la plantilla es obligatorio/,
  );

  await assert.rejects(
    () =>
      crearPlantillaMensaje(repo, {
        name: "Test",
        channel: "telegram",
        body: "   ",
      }),
    /El cuerpo de la plantilla es obligatorio/,
  );
});

test("prepararYDespacharMensaje: interpola variables y despacha por el canal", async () => {
  const espia = new ProveedorDespachoEspia();
  const res = await prepararYDespacharMensaje(espia, {
    canal: "telegram",
    destinatario: "@inversionista_rd",
    cuerpoOPlantilla: "Hola {nombre}, tenemos la unidad {unidad} lista en {proyecto}.",
    variables: {
      nombre: "María Soto",
      unidad: "302-B",
      proyecto: "Cap Cana Luxury Lofts",
    },
  });

  assert.ok(res.ok);
  assert.equal(res.canal, "telegram");
  assert.equal(espia.despachados.length, 1);
  assert.equal(
    espia.despachados[0]!.mensaje,
    "Hola María Soto, tenemos la unidad 302-B lista en Cap Cana Luxury Lofts.",
  );
});

test("actualizarPlantillaMensaje: actualiza y recalcula variables al cambiar el cuerpo", async () => {
  const repo = new RepositorioComunicacionesFalso();
  const creada = await crearPlantillaMensaje(repo, {
    name: "Cita",
    channel: "whatsapp",
    body: "Cita para {nombre}.",
  });

  const actualizada = await actualizarPlantillaMensaje(repo, creada.id, {
    body: "Cita para {nombre} en fecha {fecha_cita} con {broker}.",
  });

  assert.deepEqual(actualizada.variables, ["nombre", "fecha_cita", "broker"]);
});
