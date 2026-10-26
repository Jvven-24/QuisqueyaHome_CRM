import test from "node:test";
import assert from "node:assert/strict";
import {
  crearPlantillaMensaje,
  actualizarPlantillaMensaje,
  prepararYDespacharMensaje,
  despacharMensajeAuditado,
} from "./casos-de-uso.ts";
import type {
  RepositorioComunicaciones,
  ProveedorDespachoCanal,
  PlantillaMensaje,
  MensajeADespachar,
  ResultadoDespacho,
  EstadoCanal,
  AuditoriaDespachos,
  RegistroDespacho,
} from "./puertos.ts";
import type { Actor } from "../../domain/rbac.ts";

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

const admin: Actor = { userId: 7, roleSlug: "admin", permissions: [] };

class AuditoriaDespachosEspia implements AuditoriaDespachos {
  public registros: { actor: Actor; registro: RegistroDespacho }[] = [];
  private readonly falla: boolean;
  constructor(falla = false) { this.falla = falla; }
  async registrar(actor: Actor, registro: RegistroDespacho): Promise<void> {
    if (this.falla) throw new Error("select * from audit_log where password = 'x'");
    this.registros.push({ actor, registro });
  }
}

test("despacharMensajeAuditado: registra quién, canal, destinatario enmascarado y resultado, sin el cuerpo", async () => {
  const proveedor = new ProveedorDespachoEspia();
  const auditoria = new AuditoriaDespachosEspia();
  const { resultado, auditado } = await despacharMensajeAuditado({ proveedor, auditoria }, admin, {
    canal: "whatsapp",
    destinatario: "+1 809 555 0142",
    cuerpoOPlantilla: "Mensaje privado para {nombre}",
    variables: { nombre: "Ana" },
  });

  assert.equal(resultado.ok, true);
  assert.equal(auditado, true);
  assert.equal(auditoria.registros.length, 1);
  const { actor, registro } = auditoria.registros[0]!;
  assert.equal(actor.userId, 7);
  assert.equal(registro.canal, "whatsapp");
  assert.equal(registro.destinatarioEnmascarado, "***142");
  assert.equal(registro.ok, true);
  assert.equal(registro.mensajeId, "msg_test_123");
  assert.equal(registro.error, null);
  const serializado = JSON.stringify(registro);
  assert.ok(!serializado.includes("809 555"), "el teléfono completo no se guarda");
  assert.ok(!serializado.includes("privado"), "el cuerpo no se guarda");
});

test("despacharMensajeAuditado: un resultado fallido del proveedor también queda registrado", async () => {
  const proveedor: ProveedorDespachoCanal = {
    despachar: async (m) => ({ ok: false, canal: m.canal, error: "Canal sin configurar", enviadoAt: new Date() }),
  };
  const auditoria = new AuditoriaDespachosEspia();
  const { resultado, auditado } = await despacharMensajeAuditado({ proveedor, auditoria }, admin, {
    canal: "email", destinatario: "ana@example.com", cuerpoOPlantilla: "Hola",
  });
  assert.equal(resultado.ok, false);
  assert.equal(auditado, true);
  assert.equal(auditoria.registros[0]!.registro.ok, false);
  assert.equal(auditoria.registros[0]!.registro.error, "Canal sin configurar");
  assert.equal(auditoria.registros[0]!.registro.destinatarioEnmascarado, "a***@example.com");
});

test("despacharMensajeAuditado: si el proveedor lanza, se registra el fallo y se propaga el error original", async () => {
  const proveedor: ProveedorDespachoCanal = { despachar: async () => { throw new Error("boom"); } };
  const auditoria = new AuditoriaDespachosEspia();
  await assert.rejects(
    () => despacharMensajeAuditado({ proveedor, auditoria }, admin, { canal: "telegram", destinatario: "@alguien", cuerpoOPlantilla: "Hola" }),
    /boom/,
  );
  assert.equal(auditoria.registros.length, 1);
  assert.equal(auditoria.registros[0]!.registro.ok, false);
  assert.equal(auditoria.registros[0]!.registro.error, "boom");
});

test("despacharMensajeAuditado: si falla la auditoría el envío no se oculta ni se vuelve a intentar", async () => {
  const proveedor = new ProveedorDespachoEspia();
  const original = console.error;
  const avisos: unknown[][] = [];
  console.error = (...args: unknown[]) => { avisos.push(args); };
  try {
    const { resultado, auditado } = await despacharMensajeAuditado(
      { proveedor, auditoria: new AuditoriaDespachosEspia(true) }, admin,
      { canal: "telegram", destinatario: "@alguien", cuerpoOPlantilla: "Hola" },
    );
    assert.equal(resultado.ok, true);
    assert.equal(auditado, false);
    assert.equal(proveedor.despachados.length, 1);
    assert.ok(!JSON.stringify(avisos).includes("audit_log"), "el log no arrastra el SQL del fallo");
  } finally {
    console.error = original;
  }
});
