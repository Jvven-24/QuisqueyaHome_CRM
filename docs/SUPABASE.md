# Configurar Supabase — guía de una sola sesión

Todo lo necesario para pasar de "no hay base de datos" a "el CRM tiene sus 29
tablas, sus permisos sembrados y un usuario que puede entrar".

Está escrito para hacerse de una sentada, en una sesión aparte. No hace falta
haber leído nada más. Al final hay un bloque para arrancar esa sesión con Claude.

**Carpeta de trabajo:**
`D:\ViltrumTEK\Quisqueya_Home\QuisqueyaHome_CRM_clon-github`

---

## Antes de empezar: la regla de las claves

Los tres valores que vas a copiar van **al archivo `.env`**, nunca al chat.

`.env` está en `.gitignore`: no se sube a GitHub y no sale de tu máquina. Claude
puede correr las migraciones sin leer el archivo. Si pegas una clave en el chat,
queda en el historial de la conversación — y la contraseña de base de datos da
acceso total a los datos del cliente.

---

## 1. Crear el proyecto

En https://supabase.com/dashboard → **New project**.

| Campo | Qué poner |
|---|---|
| **Name** | `quisqueya-home-crm-dev` |
| **Database Password** | La que genera Supabase. **Guárdala en tu gestor de contraseñas ahora mismo** — no se puede volver a ver, y sin ella no hay migraciones |
| **Region** | **East US (North Virginia)** — la más cercana a República Dominicana |
| **Plan** | Free está bien para desarrollo |

Aprovisionar tarda unos dos minutos. Mientras tanto puedes seguir leyendo.

> **Nota:** este es el proyecto de **desarrollo**. Staging y producción llevan
> cada uno el suyo, y se crean cuando se resuelva el despliegue al VPS
> (`docs/DESPLIEGUE.md` §5). Compartir un proyecto entre entornos significa
> compartir los usuarios de Auth: una prueba en staging crearía sesiones en la
> misma base que producción.

---

## 2. Sacar los tres valores

El panel de Supabase ha cambiado varias veces de sitio estas cosas. La ruta que
funciona siempre es el botón **Connect**, arriba del todo, junto al nombre del
proyecto.

### 2.1 · `DATABASE_URL` — la cadena de conexión

1. Botón verde **Connect** (arriba, en la barra del proyecto).
2. Pestaña **Connection String** → tipo **Direct connection**.
3. Copia la cadena. Se parece a esto:

```
postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijkl.supabase.co:5432/postgres
```

4. **Reemplaza `[YOUR-PASSWORD]`** (corchetes incluidos) por la contraseña del
   paso 1.

**Usa "Session pooler", no "Direct connection".**

La conexión directa (`db.<ref>.supabase.co`) **solo tiene registro IPv6**. Si tu
red no lleva IPv6 bien, falla de forma intermitente y desconcertante: aquí dio 1
conexión buena de cada 8, con `ENOTFOUND` en las otras siete. El *session
pooler* (`aws-N-<region>.pooler.supabase.com:5432`) responde por IPv4 y aguanta
igual las sesiones largas de `drizzle-kit migrate` y `pg_dump`.

El *transaction pooler* (puerto 6543) también existe y escala mejor, pero no
sostiene sesiones largas. Con 3–10 usuarios internos la diferencia no se nota, y
una sola variable para todo evita que la aplicación y las migraciones apunten a
sitios distintos.

> Si tu contraseña tiene caracteres raros (`@`, `#`, `/`, `:`), hay que
> codificarlos para URL. La forma fácil de evitarlo: en **Project Settings →
> Database → Reset database password**, generar una nueva y dejar que Supabase la
> genere él.

### 2.2 · `NEXT_PUBLIC_SUPABASE_URL` — la URL del proyecto

Misma ventana **Connect** → pestaña **App Frameworks** → elige **Next.js**. Te
muestra directamente las dos variables que faltan.

O por la ruta larga: **Project Settings** (el engranaje, abajo a la izquierda) →
**Data API** → campo **Project URL**.

Se parece a `https://abcdefghijkl.supabase.co`.

> **Cuidado:** tiene que ser solo eso, sin nada después del `.co`. Si copias la
> URL desde la pestaña **API** de Connect en vez de **App Frameworks**, a veces
> trae `/rest/v1/` pegado al final — con eso el login siempre falla con "Correo
> o contraseña incorrectos" aunque la contraseña esté bien, porque el cliente
> nunca llega a la ruta de autenticación real.

### 2.3 · `NEXT_PUBLIC_SUPABASE_ANON_KEY` — la clave pública

**Project Settings → API Keys.**

Según cuándo se creó el proyecto verás una cosa o la otra — **las dos sirven**:

- **`anon` / `public`** — una cadena larguísima que empieza por `eyJ...`
- **Publishable key** — empieza por `sb_publishable_...`

Copia la que tengas. Si aparecen las dos, usa la **publishable**.

**No copies la `service_role` ni la `secret`.** Esas saltan todos los permisos y
no deben salir del servidor. El CRM no las usa: la seguridad la da el RBAC de
`src/domain/rbac.ts`, no la clave.

---

## 3. Rellenar el `.env`

Abre `D:\ViltrumTEK\Quisqueya_Home\QuisqueyaHome_CRM_clon-github\.env`
(ya existe, vacío) y déjalo así, sin comillas y sin espacios alrededor del `=`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
DATABASE_URL=postgresql://postgres.abcdefghijkl:TU_CONTRASENA@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

---

## 4. Crear las tablas y sembrar los catálogos

```bash
cd "D:\ViltrumTEK\Quisqueya_Home\QuisqueyaHome_CRM_clon-github"
npm install
npm run db:migrate
npm run db:seed
```

`db:migrate` crea las 29 tablas. `db:seed` siembra 3 roles, la matriz de
permisos completa, 7 etapas del pipeline, 7 motivos de pérdida y 8 canales de
captación.

El seed es **idempotente**: correrlo dos veces no duplica nada. Además reafirma
la matriz de permisos — si alguien la cambia a mano en la base, la siguiente
corrida la devuelve a lo que dice `db/seed.sql`. Es a propósito: esa matriz es la
seguridad del sistema.

### Comprobar que quedó bien

En el panel de Supabase → **Table Editor** deberías ver las 29 tablas. Y en el
**SQL Editor**:

```sql
SELECT r.slug AS rol, count(*) AS permisos
FROM permissions p JOIN roles r ON r.id = p.role_id
GROUP BY r.slug ORDER BY r.slug;
```

Esperado: `admin` 126, `assistant` 35, `broker` 22.

---

## 5. Crear tu usuario

Supabase Auth y la tabla `users` del CRM son dos cosas distintas, y hacen falta
las dos. Existir solo en Supabase Auth **no da acceso**: sin fila activa en
`users`, el CRM te trata como si no hubiera sesión. Es deliberado — así alguien
dado de baja no entra por conservar su credencial.

**Paso 1 — en Supabase Auth.** Panel → **Authentication → Users → Add user →
Create new user**. Pon tu correo y una contraseña. Marca **Auto Confirm User**
(si no, hay que confirmar por correo). Copia el **UUID** que aparece en la lista.

**Paso 2 — en la tabla `users`.** Panel → **SQL Editor**, y ejecuta esto
cambiando las tres primeras líneas:

```sql
INSERT INTO users (role_id, auth_user_id, full_name, email, initials, job_title)
SELECT r.id,
       'PEGA-AQUI-EL-UUID',
       'Tu Nombre',
       'tu@correo.com',
       'TN',
       'Administrador'
FROM roles r WHERE r.slug = 'admin';
```

Comprobar:

```sql
SELECT u.full_name, u.email, r.slug AS rol, u.auth_user_id IS NOT NULL AS enlazado
FROM users u JOIN roles r ON r.id = u.role_id;
```

`enlazado` tiene que decir `true`. Si dice `false`, el UUID no se pegó bien y el
login no va a funcionar.

---

## 6. Probar que entra

```bash
npm run dev
```

Abre http://localhost:3000 — debe mandarte a `/login`. Entra con el correo y la
contraseña del paso 5.

Si funciona, verás el shell del CRM con los 15 módulos en la navegación y tu rol
en la cabecera. Cada módulo dirá "pendiente de construir" — es correcto, las
vistas son de F1 en adelante.

**Eso cierra T1 y T2**, que son las dos capas de F0 que estaban esperando esto.

### Si algo falla

| Síntoma | Causa casi segura |
|---|---|
| `Falta la variable de entorno …` | El `.env` no está en la raíz del proyecto, o la variable quedó vacía |
| `password authentication failed` | La contraseña en `DATABASE_URL` está mal, o quedó el `[YOUR-PASSWORD]` sin reemplazar |
| `ENOTFOUND` o `EAI_AGAIN` intermitente contra `db.<ref>.supabase.co` | Estás usando *Direct connection*, que es solo IPv6. Cambia a *Session pooler* |
| `ENOTFOUND` / `fetch failed` contra `<ref>.supabase.co` | Tu servidor DNS no resuelve el subdominio del proyecto. Ver abajo |
| El login dice "Correo o contraseña incorrectos" con datos buenos | 1) El usuario no está confirmado en Supabase Auth (faltó *Auto Confirm User*), o 2) `NEXT_PUBLIC_SUPABASE_URL` tiene `/rest/v1/` de más al final — ver nota en el paso 2.2 |
| Entra, pero rebota a `/login` una y otra vez | Falta la fila en `users`, o su `auth_user_id` no coincide con el UUID |
| La navegación aparece vacía | Los permisos no se sembraron: vuelve a correr `npm run db:seed` |

### Si el DNS no resuelve tu proyecto

Síntoma: `npm run db:migrate` funciona pero el login falla con `fetch failed`, y
esto devuelve `EAI_AGAIN`:

```bash
node -e "require('dns').promises.lookup('TU-REF.supabase.co').then(r=>console.log(r)).catch(e=>console.log(e.code))"
```

Comprueba si es tu resolvedor comparándolo con uno público:

```powershell
Resolve-DnsName -Name TU-REF.supabase.co -Server 1.1.1.1
```

Si 1.1.1.1 lo resuelve y tu red no, el problema es el DNS de tu router. La
solución es poner un DNS público en el adaptador de red de Windows:

**Configuración → Red e Internet → Wi-Fi → Propiedades del hardware →
Asignación de servidor DNS → Editar → Manual → IPv4 activado**

- DNS preferido: `1.1.1.1`
- DNS alternativo: `8.8.8.8`

Guardar y después `ipconfig /flushdns`. No cambia nada más de tu conexión: solo
a quién le pregunta tu equipo por las direcciones.

---

## 7. Cómo arrancar la sesión con Claude

Pega esto:

> Ya configuré Supabase en la nube siguiendo `docs/SUPABASE.md` y el `.env` está
> lleno. Trabaja desde
> `D:\ViltrumTEK\Quisqueya_Home\QuisqueyaHome_CRM_clon-github`, rama `dev/jvven`.
> Verifica que la migración y los seeds quedaron bien aplicados, comprueba el
> login de punta a punta, y escribe la prueba que cierra el criterio de terminado
> #1 (un broker no alcanza datos de otro broker, verificado en servidor). Después
> actualiza `docs/F0_ESTADO.md` y el PR #11.

Si te quedaste atascado en algún paso, dile en cuál y qué mensaje salió — no
hace falta que le pases claves para eso.

---

## Lo que sigue después de esto

Con Supabase funcionando, de F0 solo queda **T8**: el despliegue al VPS de
Hostinger, que sigue bloqueado por una decisión tuya (ver `docs/DESPLIEGUE.md`
§5), más los entornos de staging y producción y la prueba de restauración de
respaldo.

Todo lo demás de F0 —T1, T2, T3, T4, T7— queda cerrado, y F1 puede empezar por
M1 Contactos.
