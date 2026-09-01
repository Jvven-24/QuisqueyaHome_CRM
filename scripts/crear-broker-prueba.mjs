/**
 * Crea el broker de prueba que verifica T2 y T3 de punta a punta. Idempotente.
 *
 * El usuario se inserta directamente en `auth.users` en vez de por `signUp`,
 * por dos razones:
 *
 *  - Supabase rechaza los dominios de prueba (`.test`, `example.com`) con
 *    `email_address_invalid`, y usar un dominio real le mandaría un correo de
 *    confirmación a alguien que no tiene nada que ver.
 *  - `signUp` deja el usuario sin confirmar, y confirmarlo requiere buzón o la
 *    clave `service_role`, que a propósito no está en el `.env`.
 *
 * La contraseña se cifra con bcrypt vía `pgcrypto`, que es exactamente lo que
 * hace GoTrue. Esto es una fixture de desarrollo: no se corre en producción.
 */

process.loadEnvFile(".env");
import postgres from "postgres";

const EMAIL = "broker.prueba@quisqueyahome.do";
const PASS = "PruebaBroker2026!";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

const [existente] = await sql`select id from auth.users where email = ${EMAIL}`;

const uid =
  existente?.id ??
  (
    await sql`
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        confirmation_token, email_change, email_change_token_new, recovery_token
      ) values (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
        'authenticated', 'authenticated', ${EMAIL},
        extensions.crypt(${PASS}, extensions.gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
        '', '', '', ''
      ) returning id`
  )[0].id;

// GoTrue exige una identidad para el proveedor `email`; sin ella el inicio de
// sesión con contraseña falla aunque el usuario exista.
await sql`
  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), ${uid}::uuid,
    jsonb_build_object('sub', ${uid}::text, 'email', ${EMAIL}::text, 'email_verified', true),
    'email', ${uid}::text, now(), now(), now()
  )
  on conflict (provider_id, provider) do nothing`;

// Por si ya existía con otra contraseña o sin confirmar.
await sql`
  update auth.users
  set encrypted_password = extensions.crypt(${PASS}, extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now())
  where id = ${uid}::uuid`;

await sql`
  insert into users (role_id, auth_user_id, full_name, email, initials, job_title)
  select r.id, ${uid}::text, 'Broker de Prueba', ${EMAIL}, 'BP', 'Broker'
  from roles r
  where r.slug = 'broker'
    and not exists (select 1 from users u where u.email = ${EMAIL})`;

await sql`
  update users
  set auth_user_id = ${uid}::text, is_active = true, deleted_at = null,
      role_id = (select id from roles where slug = 'broker')
  where email = ${EMAIL}`;

const [u] = await sql`
  select u.id, u.full_name, r.slug as rol,
    (select count(*)::int from permissions p where p.role_id = u.role_id) as permisos
  from users u join roles r on r.id = u.role_id
  where u.email = ${EMAIL}`;

console.log("broker de prueba listo:", u);
console.log("credenciales:", EMAIL, "/", PASS);
await sql.end();
