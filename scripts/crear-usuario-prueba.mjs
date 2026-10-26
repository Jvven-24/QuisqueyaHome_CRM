/**
 * Crea un usuario de prueba con rol fijo y lo enlaza con Moodle LMS local
 * mediante `external_refs` (`system = 'moodle'`), para verificar flujos de RBAC
 * y Quisqueya Academy de punta a punta (T2/T3/M13). Idempotente.
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

try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local es opcional
}
process.loadEnvFile(".env");

import postgres from "postgres";
import { databaseUrl, moodleConfig, testUserPassword } from "../src/infrastructure/env.ts";

const ROLES = {
  admin: {
    email: "admin.prueba@quisqueyahome.do",
    usernameMoodle: "admin.prueba",
    firstname: "Admin",
    lastname: "Quisqueya Home",
    fullName: "Admin de Prueba",
    initials: "AP",
    jobTitle: "Administrador",
    roleSlug: "admin",
  },
  asistente: {
    email: "asistente.prueba@quisqueyahome.do",
    usernameMoodle: "asistente.prueba",
    firstname: "Asistente",
    lastname: "Quisqueya Home",
    fullName: "Asistente de Prueba",
    initials: "AP",
    jobTitle: "Asistente",
    roleSlug: "assistant",
  },
  broker: {
    email: "broker.prueba@quisqueyahome.do",
    usernameMoodle: "broker.prueba",
    firstname: "Broker",
    lastname: "Punta Cana",
    fullName: "Broker de Prueba",
    initials: "BP",
    jobTitle: "Broker",
    roleSlug: "broker",
  },
};

async function llamarMoodleWs(baseUrl, token, wsfunction, params = {}) {
  const body = new URLSearchParams({
    wstoken: token,
    wsfunction,
    moodlewsrestformat: "json",
  });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      body.set(k, String(v));
    }
  }
  const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/webservice/rest/server.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(`Moodle HTTP ${res.status} en ${wsfunction}`);
  }
  const data = await res.json();
  if (data && typeof data === "object" && "exception" in data) {
    const msg = `${data.errorcode ?? "error"} - ${data.message ?? ""}`;
    if (wsfunction === "enrol_manual_enrol_users" && msg.includes("Message was not sent")) {
      return null;
    }
    throw new Error(`Moodle WS (${wsfunction}): ${msg}`);
  }
  return data;
}

async function asegurarUsuarioMoodle({ baseUrl, token, username, email, firstname, lastname, clave, idnumber }) {
  const porEmail = await llamarMoodleWs(baseUrl, token, "core_user_get_users_by_field", {
    field: "email",
    "values[0]": email,
  });
  let existente = Array.isArray(porEmail) && porEmail.length > 0 ? porEmail[0] : null;

  if (!existente) {
    const porUsername = await llamarMoodleWs(baseUrl, token, "core_user_get_users_by_field", {
      field: "username",
      "values[0]": username,
    });
    existente = Array.isArray(porUsername) && porUsername.length > 0 ? porUsername[0] : null;
  }

  if (existente && typeof existente.id === "number") {
    const updateParams = {
      "users[0][id]": existente.id,
      "users[0][firstname]": firstname,
      "users[0][lastname]": lastname,
      "users[0][email]": email,
      "users[0][idnumber]": idnumber,
    };
    if (clave) {
      updateParams["users[0][password]"] = clave;
    }
    await llamarMoodleWs(baseUrl, token, "core_user_update_users", updateParams);
    return Number(existente.id);
  }

  const creados = await llamarMoodleWs(baseUrl, token, "core_user_create_users", {
    "users[0][username]": username,
    "users[0][password]": clave,
    "users[0][firstname]": firstname,
    "users[0][lastname]": lastname,
    "users[0][email]": email,
    "users[0][auth]": "manual",
    "users[0][idnumber]": idnumber,
    "users[0][lang]": "en",
  });

  if (!Array.isArray(creados) || !creados[0]?.id) {
    throw new Error(`No se pudo crear el usuario en Moodle para ${email}`);
  }
  return Number(creados[0].id);
}

async function obtenerCursoInduccionId(baseUrl, token) {
  const res = await llamarMoodleWs(baseUrl, token, "core_course_get_courses_by_field", {
    field: "shortname",
    value: "QHA-IND-PC",
  });
  const cursos = res && Array.isArray(res.courses) ? res.courses : [];
  return cursos[0]?.id ? Number(cursos[0].id) : null;
}

async function enlazarEnExternalRefs(sql, localUserId, moodleUserId) {
  await sql`
    insert into external_refs (entity_type, local_id, system, external_id, version, synced_at)
    values ('user', ${localUserId}, 'moodle', ${String(moodleUserId)}, 1, now())
    on conflict (entity_type, local_id, system)
    do update set external_id = excluded.external_id, version = external_refs.version + 1, synced_at = now()
  `;
}

async function sincronizarMoodleYProyectos(sql, u, datos, cursoInduccionId, moodle) {
  if (datos.roleSlug === "broker") {
    await sql`
      insert into broker_profiles (user_id, specialty, level, handles_rentals)
      values (${u.id}, 'Inversión Turística CONFOTUR · Punta Cana', 'senior', false)
      on conflict (user_id) do update
      set specialty = coalesce(broker_profiles.specialty, excluded.specialty)
    `;

    // Asegurar proyectos de Punta Cana / Cap Cana asignados al broker en el CRM.
    await sql`
      update projects
      set broker_id = ${u.id}
      where slug in ('vre-olea-at-cap-cana', 'vre-araya-punta-cana', 'vre-demo-palma-punta-cana')
        and deleted_at is null
    `;
  }

  if (!moodle.token) {
    return { moodleUserId: null, enrolledCourseId: null };
  }

  const moodleUserId = await asegurarUsuarioMoodle({
    baseUrl: moodle.url,
    token: moodle.token,
    username: datos.usernameMoodle,
    email: datos.email,
    firstname: datos.firstname,
    lastname: datos.lastname,
    clave: datos.password,
    idnumber: `CRM-USER-${u.id}`,
  });

  await enlazarEnExternalRefs(sql, u.id, moodleUserId);

  if (cursoInduccionId) {
    // Moodle roles estándar: 5 = student, 3 = editingteacher, 1 = manager
    const roleIdCurso = datos.roleSlug === "admin" ? 3 : 5;
    await llamarMoodleWs(moodle.url, moodle.token, "enrol_manual_enrol_users", {
      "enrolments[0][roleid]": roleIdCurso,
      "enrolments[0][userid]": moodleUserId,
      "enrolments[0][courseid]": cursoInduccionId,
    });
  }

  if (datos.roleSlug === "admin") {
    try {
      await llamarMoodleWs(moodle.url, moodle.token, "core_role_assign_roles", {
        "assignments[0][roleid]": 1,
        "assignments[0][userid]": moodleUserId,
        "assignments[0][contextlevel]": "system",
        "assignments[0][instanceid]": 0,
      });
    } catch {
      // Si el rol de sistema ya está asignado o no aplica, la matrícula editingteacher ya está activa.
    }
  }

  return { moodleUserId, enrolledCourseId: cursoInduccionId };
}

async function crearUsuario(sql, nombre, datos, cursoInduccionId, moodle) {
  const { email, password: clave, fullName, initials, jobTitle, roleSlug } = datos;
  const [tieneGoTrue] = await sql`
    select 1 as ok
    from information_schema.columns
    where table_schema = 'auth' and table_name = 'users' and column_name = 'instance_id'
  `;

  const [existente] = await sql`select id from auth.users where email = ${email}`;
  let uid = existente?.id;

  if (tieneGoTrue) {
    if (!uid) {
      const [insertado] = await sql`
        insert into auth.users (
          instance_id, id, aud, role, email, encrypted_password,
          email_confirmed_at, created_at, updated_at,
          raw_app_meta_data, raw_user_meta_data,
          confirmation_token, email_change, email_change_token_new, recovery_token
        ) values (
          '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
          'authenticated', 'authenticated', ${email},
          extensions.crypt(${clave}, extensions.gen_salt('bf')),
          now(), now(), now(),
          '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
          '', '', '', ''
        ) returning id`;
      uid = insertado.id;
    }

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

    await sql`
      update auth.users
      set encrypted_password = extensions.crypt(${clave}, extensions.gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now())
      where id = ${uid}::uuid`;
  } else {
    if (!uid) {
      const [insertado] = await sql`
        insert into auth.users (id, email, created_at, updated_at)
        values (gen_random_uuid(), ${email}, now(), now())
        returning id`;
      uid = insertado.id;
    } else {
      await sql`
        update auth.users
        set updated_at = now()
        where id = ${uid}::uuid`;
    }
  }


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

  const vinculo = await sincronizarMoodleYProyectos(sql, u, datos, cursoInduccionId, moodle);

  const [{ total: proyectosAsignados }] = await sql`
    select count(*)::int as total
    from projects
    where broker_id = ${u.id} and deleted_at is null
  `;

  console.log(`${nombre} de prueba listo:`, {
    ...u,
    proyectosAsignados,
    moodleUserId: vinculo.moodleUserId,
    enrolledCourseId: vinculo.enrolledCourseId,
  });
}

async function sincronizarActoresBaseEvaluacion(sql, cursoInduccionId, moodle, clavesPorRol) {
  if (!moodle.token) return;
  const actoresBase = await sql`
    select u.id, u.full_name, u.email, r.slug as rol
    from users u
    join roles r on r.id = u.role_id
    where u.id in (1, 2) and u.deleted_at is null
    order by u.id
  `;
  for (const actor of actoresBase) {
    const partes = String(actor.full_name).trim().split(/\s+/);
    const firstname = partes[0] || "Usuario";
    const lastname = partes.slice(1).join(" ") || "Quisqueya Home";
    const username = String(actor.email).split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, ".");
    const clave = actor.rol === "admin" ? clavesPorRol.admin : clavesPorRol.broker;

    const moodleUserId = await asegurarUsuarioMoodle({
      baseUrl: moodle.url,
      token: moodle.token,
      username,
      email: actor.email,
      firstname,
      lastname,
      clave,
      idnumber: `CRM-USER-${actor.id}`,
    });

    await enlazarEnExternalRefs(sql, actor.id, moodleUserId);

    if (cursoInduccionId) {
      const roleIdCurso = actor.rol === "admin" ? 3 : 5;
      await llamarMoodleWs(moodle.url, moodle.token, "enrol_manual_enrol_users", {
        "enrolments[0][roleid]": roleIdCurso,
        "enrolments[0][userid]": moodleUserId,
        "enrolments[0][courseid]": cursoInduccionId,
      });
    }
  }
}

const [rolPedido] = process.argv.slice(2);

if (rolPedido && !ROLES[rolPedido]) {
  console.error(`Uso: node scripts/crear-usuario-prueba.mjs [${Object.keys(ROLES).join("|")}]`);
  console.error("Sin argumento, crea los tres.");
  process.exit(1);
}

const seleccionados = Object.entries(ROLES)
  .filter(([nombre]) => !rolPedido || rolPedido === nombre)
  .map(([nombre, datos]) => [nombre, { ...datos, password: testUserPassword(nombre) }]);
// Se validan todas las credenciales antes de abrir una conexión.
const sql = postgres(databaseUrl(), { prepare: false });
const moodle = moodleConfig();
const cursoInduccionId = moodle.token ? await obtenerCursoInduccionId(moodle.url, moodle.token) : null;

for (const [nombre, datos] of seleccionados) {
  if (rolPedido && rolPedido !== nombre) continue;
  await crearUsuario(sql, nombre, datos, cursoInduccionId, moodle);
}

await sincronizarActoresBaseEvaluacion(
  sql,
  cursoInduccionId,
  moodle,
  {
    admin: testUserPassword("admin"),
    broker: testUserPassword("broker"),
  },
);

await sql.end();
