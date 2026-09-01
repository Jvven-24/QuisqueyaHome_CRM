# F0 · Estado — qué quedó hecho y qué falta

Corte del **1 de septiembre de 2026**. Rama `dev/jvven`, seis commits
(`3d1bc06`…`ca67f00`), pendiente de PR contra `develop`.

Milestone F0 cierra el **20 de septiembre de 2026**.

---

## Hecho

| Capa | Estado | Dónde |
|---|---|---|
| **T0** Scaffold | ✅ Ya estaba | commit `3df2316` |
| **T1** Datos | 🟡 Todo escrito, falta aplicarlo | ver abajo |
| **T2** Auth | 🟡 Completo en código, sin probar contra la base | ver abajo |
| **T3** RBAC | ✅ **Terminado y probado** | `src/domain/rbac.ts`, `src/infrastructure/rbac-filter.ts`, 8 pruebas |
| **T4** Acceso a datos | ✅ Terminado | `src/infrastructure/db/client.ts`, `http.ts`, `src/domain/errors.ts` |
| **T7** Rutas | ✅ Terminado | `src/app/(crm)/` — 15 módulos + shell |
| **T8** Entorno | 🟡 Documentado, no ejecutado | `.env.example`, `docs/DESPLIEGUE.md` |

Verificación en verde: `npm run typecheck`, `npm run lint`, `npm test` (8/8) y
`npm run build` (22 rutas + middleware).

### Detalle

**T1 · Datos**
- 28 tablas portadas de `sqliteTable` a `pgTable` en `src/infrastructure/db/schema.ts`.
- Migración inicial generada: `drizzle/0000_thankful_senator_kelly.sql`, 582 líneas.
- Seeds en `db/seed.sql`: 3 roles, matriz de permisos completa de los tres roles,
  7 etapas del pipeline, 7 motivos de pérdida, 8 canales de captación. Idempotente.
- Los catálogos cerrados se movieron a `src/domain/catalogs.ts` para que la
  dependencia vaya de infraestructura a dominio y no al revés.
- Cinco cambios de tipo que no son sintaxis: `serial`, `boolean`,
  `timestamptz`/`date` en vez de texto ISO-8601, `bigint` en los `*_cents`,
  índices únicos parciales conservados. Justificados en `decisiones.md` #13–#14.

**T2 · Auth**
- `@supabase/ssr` con sesión en cookies: cliente de servidor y de navegador.
- Middleware privado por defecto — se listan las rutas públicas, no las privadas.
- Login, logout y recuperación de contraseña como route handlers.
- `actor.ts` cruza `auth.users` con `users` y sus permisos, una vez por petición.
  Sin fila activa en `users` no hay sesión utilizable.

**T3 · RBAC**
- `scopeFor` / `can` / `requireScope` / `reaches` / `stripRestrictedPrices` en el
  dominio, sin dependencias.
- `visibleRows` traduce el alcance a SQL en un único sitio.
- 8 pruebas con `node --test` sobre los `.ts` directamente, sin compilar ni
  instalar ningún framework.

**T4 · Acceso a datos**
- Una sola conexión, armada en la primera consulta y no al importar el módulo.
- `transaction()` como único camino para operaciones que tocan más de una tabla.
- Errores de dominio traducidos a HTTP en un solo lugar; validación con Zod.

**T7 · Rutas**
- 15 carpetas con los nombres exactos de `MAPEO_FRONTEND_CRM.md` §18, gobernadas
  por una sola lista (`modulos.ts`) que también dibuja la navegación.
- `.github/CODEOWNERS` actualizado a las rutas reales.
- Cada página es la plantilla del patrón de lectura para quien construya F1.

---

## Falta

### 1. Aplicar la base de datos — **bloqueado por credenciales**

No existe todavía un proyecto de Supabase. Cuando exista:

```bash
cp .env.example .env.local   # rellenar los tres valores
npm run db:migrate
npm run db:seed
```

Hasta entonces, la migración y los seeds están escritos y revisables pero no
aplicados. Es lo único que separa a T1 de estar terminado.

### 2. Probar el login de punta a punta — **bloqueado por lo anterior**

El código de T2 está completo, pero nadie ha iniciado sesión todavía. Falta:
crear el primer usuario en Supabase Auth, insertar su fila en `users` con el
`auth_user_id`, y comprobar que entra y que el shell muestra sus módulos. El
procedimiento está en `docs/DESPLIEGUE.md` §2.

### 3. La prueba que cierra el criterio #1

`MAPEO_FRONTEND_CRM.md` §16 exige demostrar que un usuario no autorizado no lee
datos ajenos. La lógica está probada en aislamiento (8 pruebas de T3), pero falta
la prueba de punta a punta: un broker pidiendo el negocio de otro broker y
recibiendo 404/403 desde el servidor. Necesita base de datos.

### 4. T8 · Entorno y despliegue — **bloqueado por decisión pendiente**

- Mecanismo de despliegue al VPS de Hostinger: sin decidir (`decisiones.md` #12).
- Entornos de staging y producción: no existen.
- Prueba de restauración de respaldo: no ejecutada. Sin ella, el criterio de
  terminado #10 no está cumplido.
- Monitoreo y alertas: sin definir.

El procedimiento y las condiciones que la decisión debe respetar están escritos
en `docs/DESPLIEGUE.md` §5.

### 5. Gestión de usuarios

Mientras M13 (fase F2) no exista, las altas se hacen a mano en Supabase + un
`INSERT` en `users`. Está documentado, pero es fricción real para el arranque.

### 6. Nada de F1

T5 (estados de interfaz) y T6 (auditoría) pertenecen a F1 y no se tocaron, igual
que M1, M2 y M3. Las carpetas de ruta existen con marcadores.

---

## Lo siguiente, en orden

1. Crear el proyecto de Supabase de desarrollo y aplicar migración + seeds.
2. Crear el primer usuario admin y verificar el login de punta a punta.
3. Escribir la prueba de punta a punta del criterio #1.
4. Decidir el mecanismo de despliegue y levantar staging.
5. Con eso F0 cierra, y F1 puede empezar por M1 Contactos.

Los pasos 1–3 desbloquean F1. El 4 no bloquea a nadie y puede ir en paralelo.

---

## Riesgo a vigilar

F0 cierra el 20 de septiembre y F1 el 18 de octubre. El código de F0 está hecho,
pero **los tres bloqueos que quedan no se resuelven escribiendo código**: hacen
falta una cuenta de Supabase, una decisión de despliegue y un VPS. Si esos tres
tardan, lo que se retrasa no es F0 — es todo lo que cuelga de él
(`MAPEO_FRONTEND_CRM.md` §19.1: «una fase F0 que se desborda arrastra todo lo
demás»). Conviene resolver el punto 1 esta semana.
