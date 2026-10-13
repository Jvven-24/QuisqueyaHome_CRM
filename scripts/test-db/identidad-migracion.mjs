import { normalizarCodigoUnidad } from '../../src/domain/unidades.ts';

/** Preparar en la MISMA sesión que Drizzle migrate (postgres max:1, session pool).
 * Reanudable: TRUNCATE solo del mapa temporal, nunca tablas de producto.
 * No imprime códigos ni datos personales. Escritores suspendidos durante el switch.
 */
export async function prepararIdentidadesDeVenta(connection) {
  await connection`create temp table if not exists qh_sale_identity_backfill
    (unit_id integer primary key, project_id integer not null, code_normalized text not null)`;
  await connection`truncate qh_sale_identity_backfill`;
  const [exists] = await connection`select to_regclass('units') is not null as exists`;
  if (!exists.exists) return;
  const units = await connection`select id, project_id, code from units`;
  for (let offset = 0; offset < units.length; offset += 200) {
    const rows = units.slice(offset, offset + 200).map(u => ({ unit_id: u.id, project_id: u.project_id, code_normalized: normalizarCodigoUnidad(u.code) }));
    await connection`insert into qh_sale_identity_backfill ${connection(rows)}`;
  }
}
