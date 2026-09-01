# Entornos, base de datos y respaldos (T8)

Lo que está definido y lo que falta por decidir. Cuando algo no está resuelto lo
dice explícitamente en vez de inventar un procedimiento que nadie ha probado.

## 1. Entornos

| Entorno | Para qué | Base de datos | Aplicación |
|---|---|---|---|
| **Desarrollo** | Trabajo diario en la máquina de cada quien | Proyecto de Supabase de desarrollo | `npm run dev` en local |
| **Staging** | Verificar un cambio antes de que lo vea el cliente | Proyecto de Supabase aparte | VPS de Hostinger — [PENDIENTE] |
| **Producción** | El CRM que usa Quisqueya Home | Proyecto de Supabase de producción | VPS de Hostinger — [PENDIENTE] |

**Un proyecto de Supabase por entorno, no un esquema por entorno.** Compartir
proyecto significa compartir usuarios de Supabase Auth: una prueba en staging
crearía sesiones en la misma base que producción.

Cada entorno tiene su propio `.env` con las tres variables de
[`.env.example`](../.env.example). Ninguna credencial se comitea.

## 2. Poner en marcha una base de datos desde cero

```bash
cp .env.example .env.local     # y rellenar los tres valores
npm run db:migrate             # aplica drizzle/ sobre la base
npm run db:seed                # roles, permisos, etapas, motivos y canales
```

`db:seed` es idempotente: correrlo dos veces no duplica nada y **reafirma la
matriz de permisos**. Si alguien la cambió a mano en la base, la siguiente
corrida la devuelve a lo que dice `db/seed.sql`, que es lo que se revisó en el
PR. Es deliberado: la matriz de permisos es la seguridad del sistema.

### Primer usuario

Supabase Auth y la tabla `users` son dos cosas distintas, y el CRM exige las dos
(ver `src/infrastructure/auth/actor.ts`). Para dar de alta a alguien:

1. Crear el usuario en Supabase → Authentication → Users. Anotar su UUID.
2. Insertar la fila en `users` con ese UUID en `auth_user_id` y el `role_id` que
   corresponda.

Existir solo en Supabase Auth no da acceso: sin fila en `users`, o con la fila
inactiva o en la papelera, no hay sesión utilizable. Un usuario dado de baja en
el CRM no entra por conservar su credencial de Supabase.

[PENDIENTE: la pantalla de gestión de usuarios es M13, fase F2. Hasta entonces
las altas se hacen así, a mano.]

## 3. Cambios de esquema

El esquema está congelado (§18.1 de `MAPEO_FRONTEND_CRM.md`): todo cambio va en
su propio PR, con su migración generada, revisado aparte.

```bash
# 1. editar src/infrastructure/db/schema.ts
npm run db:generate   # escribe la migración en drizzle/
npm run typecheck
# 2. revisar el SQL generado a mano antes de comitear
# 3. PR aparte, solo con el cambio de esquema y su migración
```

Nunca editar una migración ya aplicada en producción: se genera otra encima. Y
nunca generar dos migraciones en dos ramas a la vez — los conflictos en el
journal de Drizzle son caros de resolver.

## 4. Respaldos y restauración

Criterio de terminado #10 (§16): *existe respaldo y una restauración probada*.
No basta con que el respaldo corra; hay que haber restaurado uno.

**Respaldo automático:** lo hace Supabase. En el plan gratuito son diarios con
retención corta; en plan de pago son diarios con retención mayor y recuperación
a un punto en el tiempo. Verificar en Project Settings → Database → Backups qué
retención aplica al proyecto de producción, y subirla si la del plan actual no
cubre el tiempo que el negocio necesita para darse cuenta de un borrado.

**Respaldo manual antes de cualquier migración en producción:**

```bash
pg_dump "$DATABASE_URL_DIRECTO" --clean --if-exists -f respaldo_$(date +%F).sql
```

Usar la conexión directa (puerto 5432), no el pooler (6543): `pg_dump` abre una
sesión larga y el pooler en modo transacción no la sostiene.

**Restauración:**

```bash
psql "$DATABASE_URL_DIRECTO" -f respaldo_2026-09-01.sql
```

**La prueba de restauración** se hace contra un proyecto de Supabase vacío, no
contra staging ni producción: se restaura un respaldo real, se corre la
aplicación contra él y se comprueba que se puede iniciar sesión y leer datos.
Hasta que eso se haga una vez, el criterio #10 no está cumplido.

[PENDIENTE: ejecutar la prueba de restauración. Requiere un proyecto de Supabase
de producción con datos, que todavía no existe.]

## 5. Despliegue de la aplicación

[PENDIENTE — bloqueo abierto.] El mecanismo de despliegue hacia el VPS de
Hostinger no está decidido; el usuario lo está definiendo en otra sesión
(decisión #12 de `docs/contexto/decisiones.md`).

Lo que sí condiciona la decisión, y conviene tener presente al tomarla:

- La aplicación es Next.js con componentes de servidor y middleware: necesita un
  proceso Node corriendo (`npm run build && npm start`), no un servidor de
  archivos estáticos.
- Necesita las tres variables de entorno del paso 2 en el proceso, no en el
  repositorio.
- `npm run db:migrate` tiene que correr **antes** de arrancar la versión nueva,
  y contra la conexión directa, no el pooler.
- Conviene que el despliegue sea reversible: poder volver a la versión anterior
  sin restaurar la base de datos. Eso implica que las migraciones sean
  compatibles hacia atrás — añadir columnas antes de usarlas, borrarlas en un
  despliegue posterior.

## 6. Monitoreo

[PENDIENTE.] Depende del mecanismo de despliegue del punto 5. Lo mínimo que
tiene que existir antes de la entrega: que alguien se entere de que la
aplicación se cayó sin que lo reporte el cliente, y de que un respaldo falló.
