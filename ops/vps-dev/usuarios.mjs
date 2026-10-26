// Usuarios de prueba del stack qh-dev: crea/actualiza admin y broker en GoTrue (API admin) y enlaza su fila de `users`.
// Se ejecuta DENTRO del contenedor `app` (comparte red con el proxy: auth en http://localhost:54331):
//   docker compose -p qh-dev exec -T -e QH_TEST_ADMIN_PASSWORD -e QH_TEST_BROKER_PASSWORD app node ops/vps-dev/usuarios.mjs
// Las contraseñas viven en /opt/qh-dev/.env; este script nunca las imprime.
import postgres from "postgres";

const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const USUARIOS = [
  { email: "admin.prueba@quisqueyahome.do", nombre: "Admin de Prueba", iniciales: "AP", cargo: "Administrador",
    rol: "admin", clave: process.env.QH_TEST_ADMIN_PASSWORD },
  { email: "broker.prueba@quisqueyahome.do", nombre: "Broker de Prueba", iniciales: "BP", cargo: "Broker",
    rol: "broker", clave: process.env.QH_TEST_BROKER_PASSWORD },
];

const sql = postgres(process.env.DATABASE_URL, { prepare: false });
const lista = (await (await fetch(`${base}/admin/users?per_page=1000`, { headers: H })).json()).users ?? [];
for (const u of USUARIOS) {
  if (!u.clave) throw new Error(`falta la contraseña de ${u.rol} en el entorno`);
  let cuenta = lista.find((x) => x.email === u.email);
  const cuerpo = JSON.stringify({ email: u.email, password: u.clave, email_confirm: true });
  const r = cuenta
    ? await fetch(`${base}/admin/users/${cuenta.id}`, { method: "PUT", headers: H, body: cuerpo })
    : await fetch(`${base}/admin/users`, { method: "POST", headers: H, body: cuerpo });
  if (!r.ok) throw new Error(`auth ${u.rol}: HTTP ${r.status}`);
  cuenta = cuenta ?? (await r.json());
  await sql`insert into users (role_id, auth_user_id, full_name, email, initials, job_title)
    select r.id, ${cuenta.id}, ${u.nombre}, ${u.email}, ${u.iniciales}, ${u.cargo} from roles r
    where r.slug = ${u.rol} and not exists (select 1 from users x where x.email = ${u.email})`;
  await sql`update users set auth_user_id = ${cuenta.id}, is_active = true, deleted_at = null,
    role_id = (select id from roles where slug = ${u.rol}) where email = ${u.email}`;
  const [f] = await sql`select u.id, r.slug as rol from users u join roles r on r.id = u.role_id where u.email = ${u.email}`;
  console.log(`${u.rol} listo`, f);
}
await sql.end();
