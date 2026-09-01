/** Crea un broker de prueba para verificar T2/T3 de punta a punta. Idempotente. */
process.loadEnvFile(".env");
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const EMAIL = "broker.prueba@quisqueyahome.test";
const PASS = "PruebaBroker2026!";

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const { error } = await supa.auth.signUp({ email: EMAIL, password: PASS });
if (error && !/already registered/i.test(error.message)) throw error;

// Confirmar por SQL: el proyecto exige confirmación por correo y aquí no hay
// buzón. Es lo mismo que hace el botón "Auto Confirm User" del panel.
await sql`update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()) where email = ${EMAIL}`;

const [au] = await sql`select id from auth.users where email = ${EMAIL}`;

await sql`
  insert into users (role_id, auth_user_id, full_name, email, initials, job_title)
  select r.id, ${au.id}, 'Broker de Prueba', ${EMAIL}, 'BP', 'Broker'
  from roles r where r.slug = 'broker'
  on conflict do nothing`;
// `on conflict do nothing` no cubre el índice parcial de email; si ya existe,
// solo nos aseguramos de que apunte al auth user correcto y al rol broker.
await sql`
  update users set auth_user_id = ${au.id}, is_active = true, deleted_at = null,
    role_id = (select id from roles where slug = 'broker')
  where email = ${EMAIL}`;

const [u] = await sql`
  select u.id, u.full_name, r.slug rol,
    (select count(*)::int from permissions p where p.role_id = u.role_id) permisos
  from users u join roles r on r.id = u.role_id where u.email = ${EMAIL}`;
console.log("broker listo:", u);
await sql.end();
