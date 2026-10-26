# Entornos, base de datos y respaldos (T8)

Lo que está definido y lo que falta por decidir. Cuando algo no está resuelto lo
dice explícitamente en vez de inventar un procedimiento que nadie ha probado.

## 1. Entornos

| Entorno | Para qué | Base de datos | Aplicación |
|---|---|---|---|
| **Desarrollo** | Trabajo diario en la máquina de cada quien | Proyecto de Supabase en la nube — ver [`SUPABASE.md`](SUPABASE.md) | `npm run dev` |
| **Staging** | Verificar un cambio antes de que lo vea el cliente | Proyecto de Supabase en la nube | VPS de Hostinger — [PENDIENTE] |
| **Producción** | El CRM que usa Quisqueya Home | Proyecto de Supabase en la nube | VPS de Hostinger — [PENDIENTE] |

### Por qué la nube también en desarrollo

Se evaluó Supabase local (CLI sobre Docker) y **se descartó para este proyecto**:
exige Docker Desktop corriendo, y arrancarlo dio problemas en la máquina de
desarrollo. La ventaja que ofrecía —poder borrar y rehacer la base en un minuto,
sin cuota y sin internet— no compensa depender de una pieza que no arranca.

Un proyecto de Supabase en la nube en plan Free cubre desarrollo de sobra, y es
exactamente lo mismo que van a ser staging y producción, así que no hay
diferencias de entorno que perseguir después.

La configuración local sigue disponible por si algún día conviene: `npm run
db:up` y `supabase/config.toml` están en el repositorio, listos para usarse.

**Un proyecto de Supabase por entorno, nunca uno compartido.** Compartir
proyecto significa compartir usuarios de Supabase Auth: una prueba en staging
crearía sesiones en la misma base que producción.

Cada entorno tiene su propio `.env` con las tres variables de
[`.env.example`](../.env.example). Ninguna credencial se comitea.

## 2. Levantar la base de datos

### En local

Requisito: **Docker Desktop instalado y arrancado**. Es lo único que hace falta;
el CLI de Supabase se descarga solo con `npx` la primera vez.

```bash
cp .env.example .env
npm run db:up        # levanta Postgres, Auth y el panel (la 1ª vez tarda)
                     # imprime el `anon key` → pégalo en .env
npm run db:migrate   # aplica drizzle/
npm run db:seed      # roles, permisos, etapas, motivos y canales
```

La URL (`http://127.0.0.1:54321`) y la cadena de conexión
(`postgresql://postgres:postgres@127.0.0.1:54322/postgres`) son fijas, las define
`supabase/config.toml`. Para volver a verlas: `npm run db:status`.

| Qué | Dónde |
|---|---|
| Panel: ver tablas, datos y usuarios de Auth | http://127.0.0.1:54323 |
| Correos de prueba (recuperación de contraseña) | http://127.0.0.1:54324 |

**Empezar de cero** —después de romper algo, o al cambiar de rama con
migraciones distintas:

```bash
npm run db:reset     # borra la base, migra y siembra de nuevo
```

**Al terminar la jornada:** `npm run db:down` libera la memoria de los
contenedores.

#### Quién gobierna las migraciones

**Drizzle, no el CLI de Supabase.** Las migraciones viven en `drizzle/` y se
aplican con `npm run db:migrate`. `supabase/migrations/` queda vacío a
propósito, y el seed automático del CLI está apagado en `config.toml` — correría
antes de que existan las tablas.

Dos sistemas de migración sobre la misma base es la forma más fiable de que
alguien aplique la mitad de los cambios sin enterarse. El CLI de Supabase aquí
solo levanta los contenedores.

`realtime` y `storage` también están apagados en `config.toml`: no se usan
todavía y arrancan más rápido sin ellos. **Storage se vuelve a encender en M6**,
que es cuando entran las fotos de avance de obra.

### En la nube

Idéntico, quitando el `db:up`: se crea el proyecto en el panel de Supabase, se
copian las tres variables al `.env` de ese entorno y se corre `npm run db:migrate
&& npm run db:seed` contra él.

### El seed es idempotente y reafirma los permisos

Correrlo dos veces no duplica nada. Y **reafirma la matriz de permisos**: si
alguien la cambió a mano en la base, la siguiente corrida la devuelve a lo que
dice `db/seed.sql`, que es lo que se revisó en el PR. Es deliberado — la matriz
de permisos es la seguridad del sistema.

### Primer usuario

Supabase Auth y la tabla `users` son dos cosas distintas, y el CRM exige las dos
(ver `src/infrastructure/auth/actor.ts`). Para dar de alta a alguien:

1. Crear el usuario en el panel → Authentication → Users. Anotar su UUID.
   En local el panel es http://127.0.0.1:54323.
2. Insertar la fila en `users` con ese UUID en `auth_user_id` y el `role_id` que
   corresponda:

```sql
INSERT INTO users (role_id, auth_user_id, full_name, email, initials, job_title)
SELECT r.id, 'EL-UUID-DE-SUPABASE', 'Nombre Apellido', 'correo@ejemplo.com', 'NA', 'Administrador'
FROM roles r WHERE r.slug = 'admin';
```

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

Usar el **session pooler** (puerto 5432 en `aws-N-<region>.pooler.supabase.com`),
no el transaction pooler (6543): `pg_dump` abre una sesión larga y el modo
transacción no la sostiene.

Y no la conexión directa (`db.<ref>.supabase.co`): **solo tiene registro IPv6**.
En una red sin IPv6 fiable falla de forma intermitente — en la máquina de
desarrollo dio 1 conexión buena de cada 8. El session pooler responde por IPv4.

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

**Se hace al final, en una sola operación** (decisión #17 de
`docs/contexto/decisiones.md`): no se despliega nada al VPS hasta que el programa
esté terminado y funcionando. Entonces se hacen el despliegue y la migración
completos de una vez.

Mientras tanto el desarrollo corre contra el proyecto de Supabase en la nube y
`npm run dev` en local. **No hay staging ni producción, y es deliberado.**

### Lista de comprobación para ese día

Repasarla **antes** de reservar el tiempo, no durante. Los problemas de entorno
no aparecen hasta el primer despliegue, y aparecen todos juntos:

- La aplicación es Next.js con componentes de servidor y middleware: necesita un
  proceso Node corriendo (`npm run build && npm start`), no un servidor de
  archivos estáticos.
- Necesita las tres variables de entorno del paso 2 en el proceso, no en el
  repositorio.
- `npm run db:migrate` tiene que correr **antes** de arrancar la versión nueva.
- **Comprobar que el VPS tiene IPv6 antes de elegir la cadena de conexión.** La
  conexión directa de Supabase es solo IPv6; si el VPS no lo lleva, hay que usar
  el pooler. Ya pasó en la máquina de desarrollo: 1 conexión buena de cada 8.
- **Comprobar la versión de Node del VPS**: el proyecto exige `>=22.13.0`.
- **Comprobar la memoria disponible para `next build`**, que es la fase que más
  consume. Un VPS pequeño puede compilar bien y quedarse sin memoria al construir.
- Crear los proyectos de Supabase de staging y producción, y correr
  `db:migrate` + `db:seed` contra cada uno.
- **Probar una restauración de respaldo** (§4). Es lo que cierra el criterio de
  terminado #10, y hasta ese día no se puede cumplir.
- Conviene que el despliegue sea reversible: poder volver a la versión anterior
  sin restaurar la base de datos. Eso implica que las migraciones sean
  compatibles hacia atrás — añadir columnas antes de usarlas, borrarlas en un
  despliegue posterior.

## 6. Monitoreo

[PENDIENTE.] Depende del mecanismo de despliegue del punto 5. Lo mínimo que
tiene que existir antes de la entrega: que alguien se entere de que la
aplicación se cayó sin que lo reporte el cliente, y de que un respaldo falló.
