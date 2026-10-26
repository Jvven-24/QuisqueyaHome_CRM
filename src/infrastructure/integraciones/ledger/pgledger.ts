/**
 * Adaptador de la PoC PORT: https://github.com/pgr0ss/pgledger
 * Commit 164eee9d542d3ce0f305466d6f21575157c597c6.
 * Núcleo SQL derivado de pgledger.sql:42-82,124-154,193-306; MIT,
 * Copyright (c) 2025 Paul Gross (LICENSE.pgledger). SQL en poc.sql.
 * Este adaptador TypeScript es propio y no se conecta al contenedor del CRM.
 */
import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { LibroPort, MovimientoLibro } from "../../../application/libro/puertos.ts";

/** Acepta Db o tx estructuralmente; el script demuestra su uso con tx real. */
type ConexionLibro = Pick<PostgresJsDatabase, "execute">;

export function decimalDesdeCentavos(centavos: string): string {
  if (typeof centavos !== "string" || !/^[1-9][0-9]*$/.test(centavos) ||
      BigInt(centavos) > 9223372036854775807n) {
    throw new Error("Centavos inválidos para el libro.");
  }
  const padded = centavos.padStart(3, "0");
  return `${padded.slice(0, -2)}.${padded.slice(-2)}`;
}

export function crearLibroPgledger(tx: ConexionLibro): LibroPort {
  return {
    async crearCuenta(nombre, moneda, permiteNegativo = false) {
      const rows = await tx.execute<{ id: string }>(sql`
        select ledger_poc.crear_cuenta(${nombre}, ${moneda}, ${permiteNegativo})::text as id
      `);
      return rows[0]!.id;
    },
    async registrar(m: MovimientoLibro) {
      const amount = decimalDesdeCentavos(m.centavos);
      const rows = await tx.execute<{ id: string }>(sql`
        select ledger_poc.registrar(${m.clave}::uuid, ${m.origen}::uuid,
          ${m.desde}::uuid, ${m.hasta}::uuid, ${m.moneda}, ${amount}::numeric,
          ${m.compensa ?? null}::uuid)::text as id
      `);
      return rows[0]!.id;
    },
  };
}
