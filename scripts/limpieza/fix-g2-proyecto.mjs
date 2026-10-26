import postgres from "postgres";
import { pathToFileURL } from "node:url";

export function destinoLocal(cadena) {
  const url = new URL(cadena);
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw new Error("La limpieza solo admite PostgreSQL local.");
  return { host: url.hostname, puerto: url.port || "5432", base: decodeURIComponent(url.pathname.slice(1)) };
}
export function esProyectoQA(fila) {
  return fila.slug === "script-alert-1-script" && fila.name.trim() === "<script>alert(1)</script>" && fila.deleted_at == null;
}
export async function limpiar(sql, actorId, aplicar = false) {
  return sql.begin(async tx => {
    const [actor] = await tx`select id from users where id = ${actorId} and is_active = true and deleted_at is null`;
    if (!actor) throw new Error("El actor de auditoría no está activo.");
    const filas = await tx`select id, slug, name, deleted_at from projects where slug = 'script-alert-1-script' and deleted_at is null for update`;
    const candidatas = filas.filter(esProyectoQA);
    if (candidatas.length !== filas.length || candidatas.length > 1) throw new Error("El registro no coincide exactamente con la fixture de QA.");
    if (!aplicar) return { encontradas: candidatas.length, borradas: 0, modo: "simulación" };
    for (const fila of candidatas) {
      const [vinculos] = await tx`select (exists(select 1 from units where project_id = ${fila.id} and deleted_at is null) or exists(select 1 from deal_properties where project_id = ${fila.id} and deleted_at is null) or exists(select 1 from construction_phases where project_id = ${fila.id})) as presentes`;
      if (vinculos.presentes) throw new Error("El proyecto tiene datos vinculados; requiere revisión del dueño de datos.");
      const [borrado] = await tx`update projects set deleted_at = now(), updated_at = now(), updated_by = ${actorId} where id = ${fila.id} and slug = 'script-alert-1-script' and trim(name) = '<script>alert(1)</script>' and deleted_at is null returning id, slug, deleted_at`;
      if (borrado) await tx`insert into audit_log (user_id, action, entity_type, entity_id, previous_value, new_value) values (${actorId}, 'eliminar', 'project', ${borrado.id}, ${JSON.stringify({ id: fila.id, slug: fila.slug, deletedAt: null })}, ${JSON.stringify({ id: borrado.id, slug: borrado.slug, deletedAt: borrado.deleted_at })})`;
    }
    return { encontradas: candidatas.length, borradas: candidatas.length, modo: "aplicado" };
  });
}
async function main() {
  // Credencial solo en memoria: no se lee .env ni se imprime URL o error del proveedor.
  const conexion = process.env.DATABASE_URL;
  const actorId = Number(process.argv.find(arg => arg.startsWith("--actor-id="))?.slice("--actor-id=".length));
  if (!conexion || !Number.isSafeInteger(actorId) || actorId <= 0) throw new Error("Falta conexión en el entorno de ejecución o el argumento de actor de auditoría.");
  destinoLocal(conexion);
  const sql = postgres(conexion, { prepare: false, max: 1, connect_timeout: 5 });
  try { console.log(JSON.stringify(await limpiar(sql, actorId, process.argv.includes("--apply")))); }
  finally { await sql.end({ timeout: 5 }); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { console.error("Limpieza no ejecutada. Comprueba configuración local, actor y coincidencia exacta del registro. No se muestran detalles de conexión."); process.exitCode = 1; });
}
