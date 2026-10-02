/**
 * Pruebas de R3.4 sin base de datos: CRUD, alcance, avance y compensación de
 * Storage. Referencias: `src/application/README.md` §4,
 * `docs/R_ANALISIS_Y_PLAN.md` §7 y decisiones #32, #33 y #41.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { almacenamientoEnMemoria } from "../testing/almacenamiento-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import {
  borrarFase,
  borrarFoto,
  borrarProyecto,
  borrarUnidad,
  crearFases,
  crearProyecto,
  crearUnidad,
  editarFase,
  editarProyecto,
  editarUnidad,
  subirFotos,
} from "./casos-de-uso.ts";
import { proyectosEnMemoria } from "./en-memoria.ts";
import type { Fase, Foto, Proyecto, Unidad } from "./puertos.ts";

const broker: Actor = {
  userId: 5,
  roleSlug: "broker",
  permissions: [],
};

const proyecto = (cambios: Partial<Proyecto> = {}): Proyecto => ({
  id: 1,
  name: "Proyecto",
  slug: "proyecto",
  zone: null,
  projectType: "residential",
  operationType: "sale",
  developer: null,
  description: null,
  startDate: null,
  estimatedDeliveryDate: null,
  progressPercent: 0,
  currency: "USD",
  internalPriceCents: null,
  publicRangeMinCents: null,
  publicRangeMaxCents: null,
  brokerId: 5,
  videoUrl: null,
  isPublished: false,
  isActive: true,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  createdBy: 5,
  updatedBy: 5,
  deletedAt: null,
  ...cambios,
});

const fase = (cambios: Partial<Fase> = {}): Fase => ({
  id: 1,
  projectId: 1,
  position: 1,
  title: "Cimientos",
  period: null,
  status: "pending",
  progressPercent: 20,
  statusDate: null,
  videoUrl: null,
  publicNote: null,
  responsibleId: null,
  isPublished: false,
  publishedAt: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  createdBy: 5,
  updatedBy: 5,
  ...cambios,
});

const unidad = (cambios: Partial<Unidad> = {}): Unidad => ({
  id: 1,
  projectId: 1,
  code: "A-1",
  unitType: null,
  bedrooms: null,
  bathrooms: null,
  builtAreaM2: null,
  yardAreaM2: null,
  floorLevel: null,
  operationType: "sale",
  pricePeriod: "one_time",
  currency: "USD",
  realPriceCents: 100,
  publicRangeMinCents: null,
  publicRangeMaxCents: null,
  status: "available",
  brokerId: 5,
  internalNotes: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  createdBy: 5,
  updatedBy: 5,
  deletedAt: null,
  ...cambios,
});

function montar(
  iniciales: {
    proyectos?: readonly Proyecto[];
    unidades?: readonly Unidad[];
    fases?: readonly Fase[];
    fotos?: readonly Foto[];
    fallarAlCrearFotoCon?: Error;
  } = {},
) {
  const proyectos = proyectosEnMemoria(iniciales);
  const auditoria = auditoriaEnMemoria();
  const unidadDeTrabajo = unidadDeTrabajoEnMemoria(
    { proyectos, auditoria },
    [proyectos, auditoria],
  );
  return {
    proyectos,
    auditoria,
    unidad: unidadDeTrabajo,
    deps: { proyectos, unidad: unidadDeTrabajo },
  };
}

const entradaUnidad = (projectId: number) => ({
  projectId,
  code: "A-1",
  unitType: null,
  bedrooms: null,
  bathrooms: null,
  builtAreaM2: null,
  operationType: "sale",
  pricePeriod: "one_time",
  realPriceCents: 100,
  publicRangeMinCents: null,
  publicRangeMaxCents: null,
  status: "available",
  createdBy: 5,
  updatedBy: 5,
});

test("proyectos y unidades: alta, edición, borrado y auditoría", async () => {
  const { deps, proyectos, auditoria } = montar();
  const creado = await crearProyecto(deps, broker, {
    name: "Nuevo",
    slug: "nuevo",
    createdBy: 5,
    updatedBy: 5,
  });
  const editado = await editarProyecto(deps, broker, "all", creado.id, {
    name: "Editado",
  });
  await borrarProyecto(deps, broker, "all", creado.id);
  const proyectoVisible = proyecto({ id: 2 });
  const montado = montar({ proyectos: [proyectoVisible] });
  const unidadCreada = await crearUnidad(
    montado.deps,
    broker,
    "own",
    entradaUnidad(2),
  );
  await editarUnidad(montado.deps, broker, "own", 2, unidadCreada.id, {
    code: "A-2",
    updatedBy: 5,
  });
  await borrarUnidad(montado.deps, broker, "own", 2, unidadCreada.id);
  assert.equal(editado.name, "Editado");
  assert.notEqual(proyectos.proyectos[0]!.deletedAt, null);
  assert.equal(auditoria.registros.length, 3);
  assert.equal(montado.proyectos.unidades[0]!.deletedAt !== null, true);
  assert.equal(montado.auditoria.registros.length, 3);
});

test("fases: recalcula avance al crear, editar y borrar", async () => {
  const { deps, proyectos } = montar({ proyectos: [proyecto()] });
  const creadas = await crearFases(deps, broker, "own", 1, false, "Primera");
  assert.equal(proyectos.proyectos[0]!.progressPercent, 0);
  await editarFase(deps, broker, "own", 1, creadas[0]!.id, {
    progressPercent: 80,
    updatedBy: 5,
  });
  assert.equal(proyectos.proyectos[0]!.progressPercent, 80);
  await borrarFase(deps, broker, "own", 1, creadas[0]!.id);
  assert.equal(proyectos.proyectos[0]!.progressPercent, 0);
});

test("fotos: compensa exactamente las subidas y conserva el error del INSERT", async () => {
  const errorOriginal = new Error("fallo original del INSERT");
  const { deps } = montar({
    proyectos: [proyecto()],
    fases: [fase()],
    fallarAlCrearFotoCon: errorOriginal,
  });
  const almacenamiento = almacenamientoEnMemoria();
  const rutasBorradas: readonly string[][] = [];
  const almacenamientoConRegistro = {
    ...almacenamiento,
    borrar: async (rutas: readonly string[]) => {
      (rutasBorradas as string[][]).push([...rutas]);
      await almacenamiento.borrar(rutas);
    },
  };
  await assert.rejects(
    subirFotos(
      { ...deps, almacenamiento: almacenamientoConRegistro },
      broker,
      "own",
      {
        projectId: 1,
        faseId: 1,
        actorId: 5,
        archivos: [
          {
            contenido: new Blob(["x"], { type: "image/jpeg" }),
            tipoMime: "image/jpeg",
            nombreVisible: "../../otro/sitio/x.jpg",
            sizeBytes: 1,
          },
        ],
      },
    ),
    (error) => error === errorOriginal,
  );
  assert.equal(rutasBorradas.length, 1);
  assert.equal(rutasBorradas[0]!.length, 1);
  assert.match(rutasBorradas[0]![0]!, /^proyecto-1\/fase-1\/[^/]+\.jpg$/);
  assert.equal(almacenamiento.objetos.size, 0);
});

test("fotos: el nombre visible nunca decide la ruta del bucket", async () => {
  const { deps, proyectos } = montar({
    proyectos: [proyecto()],
    fases: [fase()],
  });
  const almacenamiento = almacenamientoEnMemoria();
  const fotos = await subirFotos(
    { ...deps, almacenamiento },
    broker,
    "own",
    {
      projectId: 1,
      faseId: 1,
      actorId: 5,
      archivos: [
        {
          contenido: new Blob(["x"], { type: "image/jpeg" }),
          tipoMime: "image/jpeg",
          nombreVisible: "../../otro/sitio/x.jpg",
          sizeBytes: 1,
        },
      ],
    },
  );
  const ruta = fotos[0]!.url;
  assert.match(ruta, /^proyecto-1\/fase-1\/[^/]+\.jpg$/);
  assert.equal(fotos[0]!.name, "../../otro/sitio/x.jpg");
  assert.equal(almacenamiento.objetos.get(ruta)!.nombreVisible, "../../otro/sitio/x.jpg");
  assert.equal(proyectos.proyectos[0]!.progressPercent, 0);
});

test("alcance own: proyecto ajeno no escribe ni audita fases, fotos ni unidades", async () => {
  const { deps, proyectos, auditoria } = montar({
    proyectos: [proyecto({ brokerId: 99 })],
    fases: [fase()],
    unidades: [unidad()],
  });
  const fotoStorage = almacenamientoEnMemoria();
  const entrada = entradaUnidad(1);
  await assert.rejects(
    crearUnidad(deps, broker, "own", entrada),
    NotFoundError,
  );
  await assert.rejects(
    crearFases(deps, broker, "own", 1, false, "No"),
    NotFoundError,
  );
  await assert.rejects(
    subirFotos(
      { ...deps, almacenamiento: fotoStorage },
      broker,
      "own",
      {
        projectId: 1,
        faseId: 1,
        actorId: 5,
        archivos: [],
      },
    ),
    NotFoundError,
  );
  await assert.rejects(
    editarUnidad(deps, broker, "own", 1, 1, { code: "B-1", updatedBy: 5 }),
    NotFoundError,
  );
  await assert.rejects(
    borrarUnidad(deps, broker, "own", 1, 1),
    NotFoundError,
  );
  await assert.rejects(
    editarFase(deps, broker, "own", 1, 1, { title: "No", updatedBy: 5 }),
    NotFoundError,
  );
  await assert.rejects(
    borrarFase(deps, broker, "own", 1, 1),
    NotFoundError,
  );
  await assert.rejects(
    borrarFoto(deps, broker, "own", 1, 1, 1),
    NotFoundError,
  );
  assert.equal(proyectos.fases.length, 1);
  assert.equal(proyectos.unidades.length, 1);
  assert.equal(proyectos.proyectos[0]!.deletedAt, null);
  assert.equal(auditoria.registros.length, 0);
  assert.equal(fotoStorage.objetos.size, 0);
});
