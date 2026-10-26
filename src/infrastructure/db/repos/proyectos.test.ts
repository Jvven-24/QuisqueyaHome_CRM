import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { ConflictError, NotFoundError } from "../../../domain/errors.ts";
import type { DatosUnidad, RepositorioProyectos } from "../../../application/proyectos/puertos.ts";

test("M40 b1i2 adaptador: invocación directa con status no llega al SQL", async () => {
  const deps: Record<string, unknown> = {
    "drizzle-orm": { sql: () => ({}) }, "../../rbac-filter": {}, "../schema": {},
    "./compartido": {}, "../../../domain/slug": {}, "../../../domain/errors": { ConflictError, NotFoundError },
  };
  const code = ts.transpileModule(readFileSync(new URL("./proyectos.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports: Record<string, unknown> = {};
  runInNewContext(code, { exports, require: (name: string) => { assert.ok(Object.hasOwn(deps, name), name); return deps[name]; } });
  let accesosSql = 0;
  const ejecutor = new Proxy({}, { get() { accesosSql++; throw new Error("No debe acceder a SQL."); } });
  const fabrica = exports.repositorioProyectos as (ejecutor: unknown) => RepositorioProyectos;
  const repo = fabrica(ejecutor);
  for (const status of ["available", "sold", "reserved", "unavailable"]) {
    await assert.rejects(repo.actualizarUnidad(1, { status, updatedBy: 5 }), ConflictError);
  }
  for (const status of ["sold", "reserved", "unavailable"]) {
    await assert.rejects(repo.crearUnidad({ status } as DatosUnidad), ConflictError);
  }
  assert.equal(accesosSql, 0);
});

test("M40 b1i3d adaptador: conflicto de version lanza ConflictError y no-encontrado lanza NotFoundError", async () => {
  const deps: Record<string, unknown> = {
    "drizzle-orm": {
      and: (...args: unknown[]) => args,
      eq: (a: unknown, b: unknown) => ({ a, b }),
      isNull: (a: unknown) => ({ a }),
      like: (a: unknown, b: unknown) => ({ a, b }),
      or: (...args: unknown[]) => args,
      sql: () => ({}),
    },
    "../../rbac-filter": { visibleRows: () => ({}) },
    "../schema": {
      projects: { id: "projects.id" },
      units: { id: "units.id", rowVersion: "units.rowVersion", deletedAt: "units.deletedAt" },
      constructionPhases: {},
      files: {},
    },
    "./compartido": { auditoriaDrizzle: () => ({}) },
    "../../../domain/slug": { slugify: (s: string) => s },
    "../../../domain/errors": { ConflictError, NotFoundError },
  };
  const code = ts.transpileModule(readFileSync(new URL("./proyectos.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports: Record<string, unknown> = {};
  runInNewContext(code, { exports, require: (name: string) => { assert.ok(Object.hasOwn(deps, name), name); return deps[name]; } });
  const fabrica = exports.repositorioProyectos as (ejecutor: unknown) => RepositorioProyectos;

  const ejecutorConflicto = {
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => [],
        }),
      }),
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [{ id: 1, rowVersion: 2, deletedAt: null }],
        }),
      }),
    }),
  };

  const repo = fabrica(ejecutorConflicto);
  await assert.rejects(
    repo.actualizarUnidad(1, { code: "A-2", updatedBy: 5 }, 1),
    ConflictError,
  );
  await assert.rejects(
    repo.marcarUnidadBorrada(1, new Date(), 5, 1),
    ConflictError,
  );

  const ejecutorNotFound = {
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => [],
        }),
      }),
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [],
        }),
      }),
    }),
  };

  const repoNF = fabrica(ejecutorNotFound);
  await assert.rejects(
    repoNF.actualizarUnidad(1, { code: "A-2", updatedBy: 5 }, 1),
    NotFoundError,
  );
  await assert.rejects(
    repoNF.marcarUnidadBorrada(1, new Date(), 5, 1),
    NotFoundError,
  );
});
