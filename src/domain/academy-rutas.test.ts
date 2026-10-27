/**
 * Pruebas de rutas de formación de Academy. Sin base de datos: `npm test`
 * las corre con el runner de Node.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cursosDeRuta,
  progresoRutasFormacion,
  RUTAS_FORMACION,
  type CursoParaRuta,
} from "./academy-rutas.ts";

const ahora = new Date("2026-06-01T00:00:00.000Z");
const cursos: CursoParaRuta[] = [
  { codigo: "ONB-1", nombre: "Bienvenida", categoria: "Onboarding" },
  { codigo: "ONB-2", nombre: "Sistema", categoria: "Onboarding" },
  { codigo: "VTA-1", nombre: "Cierre", categoria: "Técnicas de venta" },
  { codigo: "PRD-1", nombre: "Proyectos", categoria: "Producto" },
];

test("cada curso cae en la ruta de su categoría, ignorando tildes y mayúsculas", () => {
  const rutaVenta = RUTAS_FORMACION.find((r) => r.id === "tecnicas_venta")!;
  const sinTilde: CursoParaRuta[] = [{ codigo: "X", nombre: "x", categoria: "TECNICAS DE VENTA" }];
  assert.deepEqual(cursosDeRuta(rutaVenta, cursos).map((c) => c.codigo), ["VTA-1"]);
  assert.deepEqual(cursosDeRuta(rutaVenta, sinTilde).map((c) => c.codigo), ["X"]);
});

test("una categoría sin ruta no aparece en ninguna", () => {
  const otra: CursoParaRuta[] = [{ codigo: "Z", nombre: "z", categoria: "Otra" }];
  const todas = progresoRutasFormacion(otra, [], ahora);
  assert.ok(todas.every((p) => p.total === 0 && p.porcentaje === 0));
});

test("un curso completa su ruta solo con constancia que acredite formación", () => {
  const constancias = [
    // Vigente: cuenta.
    { courseCode: "ONB-1", status: "vigente" as const, issuedAt: new Date("2026-03-01T00:00:00.000Z") },
    // Revocada: no cuenta.
    { courseCode: "ONB-2", status: "revocada" as const, issuedAt: new Date("2026-03-01T00:00:00.000Z") },
    // Emitida hace más de 12 meses: vencida, no cuenta.
    { courseCode: "PRD-1", status: "vigente" as const, issuedAt: new Date("2024-01-01T00:00:00.000Z") },
  ];
  const progreso = progresoRutasFormacion(cursos, constancias, ahora);
  const onboarding = progreso.find((p) => p.ruta.id === "onboarding")!;
  assert.equal(onboarding.total, 2);
  assert.equal(onboarding.completados, 1);
  assert.equal(onboarding.porcentaje, 50);
  const producto = progreso.find((p) => p.ruta.id === "producto")!;
  assert.equal(producto.completados, 0);
  assert.equal(producto.cursos[0]!.estado, "vencida");
});

test("sin constancias el progreso es cero y cada curso queda sin_constancia", () => {
  const onboarding = progresoRutasFormacion(cursos, [], ahora).find((p) => p.ruta.id === "onboarding")!;
  assert.equal(onboarding.completados, 0);
  assert.ok(onboarding.cursos.every((c) => c.estado === "sin_constancia"));
});
