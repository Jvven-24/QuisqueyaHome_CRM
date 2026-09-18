/**
 * Crea un usuario de prueba con rol fijo, para verificar flujos de RBAC de
 * punta a punta (T2/T3). Reemplaza `crear-{admin,asistente,broker}-prueba.mjs`
 * (hallazgo del ponytail-audit: eran ~95% idénticos, solo cambiaban el
 * email/contraseña/rol). Idempotente.
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
 *
 * Uso: node scripts/crear-usuario-prueba.mjs [admin|asistente|broker]
 * Sin argumento, crea los tres.
 */

process.loadEnvFile(".env");
import postgres from "postgres";

const ROLES = {
  admin: {
    email: "admin.prueba@quisqueyahome.do",
    password: "PruebaAdmin2026!",
    fullName: "Admin de Prueba",
    initials: "AP",
    jobTitle: "Administrador",
    roleSlug: "admin",
  },
  asistente: {
    email: "asistente.prueba@quisqueyahome.do",
    password: "PruebaAsistente2026!",
    fullName: "Asistente de Prueba",
    initials: "AP",
    jobTitle: "Asistente",
    roleSlug: "assistant",
  },
  broker: {
    email: "broker.prueba@quisqueyahome.do",
    password: "PruebaBroker2026!",
    fullName: "Broker de Prueba",
    initials: "BP",
    jobTitle: "Broker",
    roleSlug: "broker",
  },
};

async function crearUsuario(sql, nombre, { email, password, fullName, initials, jobTitle, roleSlug }) {
  const [existente] = await sql`select id from auth.users where email = ${email}`;

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
          'authenticated', 'authenticated', ${email},
          extensions.crypt(${password}, extensions.gen_salt('bf')),
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
      jsonb_build_object('sub', ${uid}::text, 'email', ${email}::text, 'email_verified', true),
      'email', ${uid}::text, now(), now(), now()
    )
    on conflict (provider_id, provider) do nothing`;

  // Por si ya existía con otra contraseña o sin confirmar.
  await sql`
    update auth.users
    set encrypted_password = extensions.crypt(${password}, extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now())
    where id = ${uid}::uuid`;

  await sql`
    insert into users (role_id, auth_user_id, full_name, email, initials, job_title)
    select r.id, ${uid}::text, ${fullName}, ${email}, ${initials}, ${jobTitle}
    from roles r
    where r.slug = ${roleSlug}
      and not exists (select 1 from users u where u.email = ${email})`;

  await sql`
    update users
    set auth_user_id = ${uid}::text, is_active = true, deleted_at = null,
        role_id = (select id from roles where slug = ${roleSlug})
    where email = ${email}`;

  const [u] = await sql`
    select u.id, u.full_name, r.slug as rol,
      (select count(*)::int from permissions p where p.role_id = u.role_id) as permisos
    from users u join roles r on r.id = u.role_id
    where u.email = ${email}`;

  console.log(`${nombre} de prueba listo:`, u);
  console.log("credenciales:", email, "/", password);
}

const [rolPedido] = process.argv.slice(2);

if (rolPedido && !ROLES[rolPedido]) {
  console.error(`Uso: node scripts/crear-usuario-prueba.mjs [${Object.keys(ROLES).join("|")}]`);
  console.error("Sin argumento, crea los tres.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

for (const [nombre, datos] of Object.entries(ROLES)) {
  if (rolPedido && rolPedido !== nombre) continue;
  await crearUsuario(sql, nombre, datos);
}

await sql.end();
