# D21 + D16 · Moodle local para Quisqueya Academy (expediente práctico)

**Fecha de consulta:** 2026-10-14 · **Perfil:** D21 (investigación) + D16 (despliegue local) · **Riesgo:** R3 · **Autonomía:** A1
**Alcance:** solo documentación oficial y archivos locales. No se descargó ni se instaló nada, no se ejecutó ningún comando en el equipo y no se leyó `.env`.
**Revisión independiente pendiente:** D03 (arquitectura) y D12 (seguridad/licencias). Este expediente **no** aprueba su propio trabajo ni cierra ningún gate de I02.

**Contexto leído para no repetir:** `.viltrum/vre-os/spec/integraciones/I02-moodle.md` (DRAFT), `.viltrum/crm-ux/D21-academy-opensource.md` (score provisional 78/100, citaba "PostgreSQL 15 mínimo para 5.1"), `.viltrum/vre-os/spec/modulos/M13-academy.md`, `src/application/academy/puertos.ts` (hoy solo `RepositorioAcademy` y `isCertified` derivado; no existe `AprendizajePort`). Regla firmada que rige todo lo de abajo: **el Admin aprueba en el CRM; el progreso de Moodle es evidencia, nunca certificación** (Q-C1-03).

Convención de fuentes: `[F#]` remite a la tabla del Anexo A. Lo que **no** pude verificar en fuente oficial va marcado **NO VERIFICADO** o **ESTIMACIÓN**.

---

## 0. Resumen ejecutivo

| Decisión | Recomendación | Motivo (con fuente) |
|---|---|---|
| Versión | **Moodle 5.3 LTS** (tag `MOODLE_503`, publicado 2026-10-05; seguridad hasta 2029-10-01) [F1][F2] | Es la LTS vigente; 5.2 y 5.1 se acaban antes. 5.3.0 tiene solo 9 días: fijar el tag exacto y revisar 5.3.1 antes de datos reales. |
| Hallazgo crítico | **El PostgreSQL 15 local NO sirve para 5.2 ni 5.3.** 5.3 exige PostgreSQL **17**; 5.2 exige **16**; solo 5.1 y anteriores aceptan 15 [F2][F3][F4] | Contradice la nota previa de D21 ("PostgreSQL 15 mínimo para 5.1"): ese dato era de 5.1, no de la LTS actual. |
| Base de datos | **Segundo clúster PostgreSQL 17 dedicado a Moodle en el puerto 9332**, junto al 15 del CRM (el 5432 no se toca) | I02 §7 ya pedía "PostgreSQL y almacenamiento propios". |
| Ruta | **B (nativa en Windows)**: PHP 8.4 NTS x64 + Caddy + PG17 + Programador de tareas | RAM libre ≈3 GB y motor Docker caído; ver §2.3. |
| RAM estimada ruta B | **≈0,7–1,2 GB** en reposo/PoC (ESTIMACIÓN propia, no medida) | Ruta A (Docker) ≈2,5–3,5 GB: no cabe con holgura (ESTIMACIÓN). |
| Plan de respaldo si no se quiere PG17 | **Moodle 4.5 LTS** sobre el PG15 existente (PG ≥13, PHP 8.1–8.3) [F5]; seguridad solo hasta 2027-10-04 [F1] | Camino con cero infraestructura nueva de BD, pero con horizonte de un año. |
| SSO | `auth_userkey` es el único camino directo "CRM → URL de un solo uso", **pero declara soporte 4.5–5.0** [F20][F21]; probarlo en 5.3 o descartarlo en la PoC | Alternativa: `auth_oidc` (GPLv3) contra Supabase OAuth 2.1 server (beta) [F22][F23]. |
| Eventos Moodle → CRM | **Reconciliación por polling** (outbox/cron del CRM). `local_webhooks` solo como acelerador opcional | No hay webhooks nativos en lo leído; el plugin no reintenta [F24][F25]. |
| Certificados Moodle | **No adoptar `mod_customcert` en el primer corte** (GPL-3.0, activo, pero la aprobación vive en el CRM) [F26][F27] | Puede añadirse después como PDF cosmético sin valor de aprobación. |

---

## 1. Versión de Moodle a fijar

### 1.1 Ramas y soporte (fecha de consulta 2026-10-14) [F1]

| Rama | Lanzamiento | Soporte general hasta | Seguridad hasta | Estado |
|---|---|---|---|---|
| **5.3 (LTS)** | 2026-10-05 | 2027-10-04 | **2029-10-01** | Estable actual |
| 5.2 | 2026-04-20 | 2027-04-19 | 2027-10-04 | Estable actual |
| 5.1 | 2025-10-06 | 2026-10-05 (terminó) | 2027-04-19 | Solo seguridad |
| 4.5 (LTS) | 2024-10-07 | 2025-10-06 (terminó) | 2027-10-04 | Solo seguridad |
| 5.0 / 4.4 / 4.1 | — | terminado | terminado | Fuera de soporte |

Puntos publicados: 5.2.4 y 5.1.8 (2026-10-05), 4.5.15 (2026-10-05); 5.2.5 y 5.1.9 programados 2026-12-07 [F1]. La página de descargas lista el paquete `moodle-5.3.zip` (150,4 MB) y `moodle-5.3.tgz` (93,5 MB) con tag `MOODLE_503`, y una compilación semanal de la rama `MOODLE_503_STABLE`; **no muestra un número de punto 5.3.x** [F6]. Fijar el tag/zip (no la rama semanal) y anotar su SHA-256 al descargar (D16, en la fase de instalación).

### 1.2 Requisitos exactos de 5.3 [F2][F7]

- **PHP:** mínimo **8.3.0**; soportado 8.4.x; solo 64 bits. **PHP 8.5 y posteriores no figuran como soportados** (ver trampa abajo).
- **Extensión obligatoria destacada en las notas de versión:** `sodium`. Ajuste obligatorio: `max_input_vars` ≥ **5000**.
- **Extensiones (página PHP de MoodleDocs, 5.3):** obligatorias `ctype, curl, dom, gd, iconv, intl, json, mbstring, pcre, simplexml, spl, xml, zip` más el driver de BD (`pgsql`); recomendadas `openssl, soap, sodium, tokenizer` [F7].
- **Ajustes PHP:** `memory_limit` ≥ 96M (recomendado 128M), `session.save_handler=files`, `session.auto_start=off`, `file_uploads=on`, directorio temporal escribible [F7].
- **PostgreSQL:** mínimo **17** (subido en 5.3). Otras: MySQL 8.4, MariaDB 11.4, SQL Server 2019; Oracle ya no soportado [F2].
- **Actualización desde:** Moodle 4.4 o superior [F2][F8].
- **Mínimos de PostgreSQL por rama:** 4.5 → 13 [F5]; 5.1 → 15 [F4]; 5.2 → 16 [F3]; 5.3 → 17 [F2].
- Soporte de ramas de PostgreSQL: 15 llega a EOL el 2027-11-11; 16 el 2028-11-09; **17 el 2029-11-08**; 18 el 2030-11-14 [F9]. PG17 cubre bien el horizonte de seguridad de Moodle 5.3 (2029-10).

### 1.3 Cambio de estructura `public/` (desde 5.1) [F4][F8][F10][F11]

- Desde 5.1, todo lo accesible por web vive en `public/`; `config.php`, `admin/cli` y demás código sensible quedan **fuera**. El servidor web debe apuntar a `public/` (MoodleDocs lo califica de requisito de seguridad) [F8].
- Comprobado en el árbol `MOODLE_503_STABLE`: raíz con `admin/cli`, `bin`, `lib`, `public`, `scripts`, `config-dist.php`, `index.php`, `composer.json` [F10]. Por tanto **el cron y los scripts CLI se invocan con `admin/cli/...` en la raíz** (no en `public/`).
- El instalador CLI escribe `config.php` en la raíz del proyecto (fuera de `public/`), fija `dirroot` en `<raíz>/public` y el dataroot por defecto en `<raíz>/moodledata` [F12]. **Se debe pasar `--dataroot` explícito fuera de la carpeta del código y del repositorio.**
- Plugins de terceros: tras 5.1 se instalan bajo `public/` (la página de actualización lo exige al migrar) [F13].
- **Router (`r.php`):** las notas de 5.1 dicen "muy recomendado, no obligatorio" [F4]; la página de configuración del router para 5.3 dice que aún no es estrictamente obligatorio pero Moodle HQ pretende hacerlo obligatorio en futuras estables [F14]. **Configurarlo desde el día 1.** Ejemplos oficiales: Apache (`FallbackResource /r.php`), Nginx (`try_files $uri /r.php$is_args$args`), IIS (`web.config` sin probar por Moodle HQ). **Caddy no está documentado por Moodle** [F14] (ver configuración propuesta en §2.2, marcada como inferida).
- Caso especial: el contenedor comunitario `erseco/alpine-moodle` auto-detecta `/public` [F15]; `moodlehq/moodle-docker` **no** menciona 5.1 ni `public` en su README ni en su `config.docker-template.php` [F16][F17] (NO VERIFICADO que funcione sin ajustes con 5.3).

### 1.4 Trampa de PHP en Windows (importante)

La página oficial de descargas de PHP para Windows (`windows.php.net/download` redirige a php.net) hoy ofrece **solo PHP 8.5.11** (NTS y TS, VS17) [F18]. **Moodle 5.3 no declara soporte para 8.5** [F2][F7]. Usar 8.5 sería salirse de lo soportado. Los zips 8.4 y 8.3 siguen en `downloads.php.net/~windows/releases/`: `php-8.4.26-nts-Win32-vs17-x64.zip` (33 MB) y `php-8.3.35-nts-Win32-vs16-x64.zip` (32 MB) [F19]. **Recomendación: PHP 8.4 NTS x64** (PHP 8.4: soporte activo hasta 2026-12-31 y seguridad hasta 2028-12-31; 8.3 solo seguridad, hasta 2027-12-31) [F20b]. Requiere el redistribuible Visual C++ x64 (2015–2022) [F18]. Nota: el soporte de seguridad de PHP 8.4 termina un año antes que el de Moodle 5.3 LTS; habrá que migrar a PHP 8.5 cuando Moodle lo declare (revisión anual, D16).

---

## 2. Dos rutas de instalación local

### 2.1 Comparativa rápida

| Criterio | A · Docker | B · Nativa Windows |
|---|---|---|
| Estado hoy | Motor de Docker Desktop **no arranca** (`docs/contexto/decisiones.md` línea ~293). Requiere WSL 2 ≥ 2.1.5, virtualización en BIOS y ≥ 8 GB de RAM [F21b] | Sin bloqueo previo: solo descargar PHP, Caddy y PG17 |
| Imagen mantenida | `moodlehq/moodle-docker` + `moodlehq/moodle-php-apache` (Moodle HQ; "para desarrolladores y testers", sin aviso de producción pero tampoco apta como despliegue estable) [F16][F22b]; o `erseco/alpine-moodle` (no oficial, MIT, sigue 5.3 LTS, PHP 8.4, puerto 8080) [F15] | No aplica |
| Bitnami | **Descartado.** Catálogo público movido el 2025-08-28; versiones antiguas a `bitnamilegacy` "sin más actualizaciones ni soporte", `bitnamisecure` solo con la etiqueta `latest` y para desarrollo; producción = pago. El borrado de `docker.io/bitnami` se pospuso al 2025-09-29 [F23b] | — |
| BD | `postgres:17` por defecto en moodle-docker (`MOODLE_DOCKER_DB_VERSION`, sin volumen definido en el YAML) [F24b] | PG17 como clúster nativo en 9332 |
| RAM estimada | **≈2,5–3,5 GB** (VM de WSL2 + Docker Desktop + Apache/PHP + PG17) — ESTIMACIÓN | **≈0,7–1,2 GB** (php-cgi x2–3 ≈ 0,3–0,6 GB, PG17 con `shared_buffers` ~128 MB ≈ 0,2–0,3 GB, Caddy ≈ 0,05 GB, cron puntual) — ESTIMACIÓN |
| Riesgo principal | No cabe en ≈3 GB libres con holgura; motor caído; moodle-docker trae credenciales por defecto públicas y `host` de BD fijo `db`; dependencia de que el README siga la estructura `public/` | `php-cgi` en Windows atiende de forma limitada en concurrencia; Caddy+router sin receta oficial; mantenimiento manual de parches |
| Reproducibilidad | Alta (si el motor funciona) | Media: documentar versiones y hashes en un script de D16 |
| Recomendación | Segunda opción solo si se arregla Docker y hay RAM | **Primera opción** |

Mínimos de hardware que da Moodle: 512 MB RAM mínimo, ≥1 GB recomendado; ~200 MB de código y "5 GB realista" de disco [F25b].

### 2.2 Ruta B · Nativa en Windows — pasos exactos

Directorio base propuesto (fuera del repo y **fuera de OneDrive**): `C:\RUN\moodle\`. Puertos (rango permitido 9300–9399): web `9380`, FastCGI `9381`, PostgreSQL `9332`. Todo enlazado a `127.0.0.1`. Ningún secreto va al repositorio: contraseñas por variable de entorno o archivo fuera del repo; el CRM las lee solo desde `src/infrastructure/env.ts` (I02 §7).

**Paso 0 · Prerrequisitos (descargas que D16 hará con aprobación aparte):**
1. Redistribuible Visual C++ x64 2015–2022 [F18].
2. PHP 8.4.x NTS x64 (zip `php-8.4.26-nts-Win32-vs17-x64.zip`, o el último 8.4.x de `downloads.php.net/~windows/releases/`) → `C:\RUN\moodle\php\` [F19].
3. Moodle `moodle-5.3.zip` (o `git clone -b MOODLE_503_STABLE`) → `C:\RUN\moodle\moodle\` [F6][F8]. MoodleDocs advierte contra obtenerlo de otras fuentes [F8].
4. PostgreSQL 17.x (binarios Windows x86-64 "para usuarios expertos" de EDB, o instalador) → `C:\RUN\moodle\pg17\` [F26b]. (NO VERIFICADO si el archivo de EDB es un zip; la página solo lo llama "binaries".)
5. Caddy para Windows (descarga oficial en caddyserver.com; **no consultada** por este expediente; verificar versión y hash).

**Paso 1 · PHP.**
1. Copiar `php.ini-development` a `php.ini` (el archivo trae las extensiones de Windows comentadas) [F27].
2. Descomentar: `extension_dir = "ext"` y `extension=` para `curl, fileinfo, gd, intl, mbstring, exif (después de mbstring), openssl, pdo_pgsql, pgsql, soap, sodium, zip`, y `zend_extension=opcache` [F27]. En Windows `sodium` viene incluido pero hay que habilitarlo [F28]. `ctype, dom, iconv, json, pcre, simplexml, spl, xml` figuran como obligatorias para Moodle [F7]; **verificarlas con `php -m`** (no comprobé si son internas en el zip de Windows).
3. Ajustes: `max_input_vars = 5000` (en el archivo viene comentado a 1000) [F27][F2], `memory_limit = 256M` (mínimo 96M, recomendado 128M [F7]), `date.timezone = "America/Santo_Domingo"` (MoodleDocs pide fijar `date.timezone` [F29]), `post_max_size`/`upload_max_filesize` según el material del curso, OPcache activo (`opcache.memory_consumption=128` por defecto) [F27].
4. Comprobar: `php.exe -c C:\RUN\moodle\php\php.ini -v` y `-m`. MoodleDocs recuerda que la versión de PHP de línea de comandos puede diferir de la del servidor web [F30].

**Paso 2 · PostgreSQL 17 dedicado (puerto 9332).**
1. `initdb` con UTF-8 y autenticación por contraseña [F31]:
   ```
   C:\RUN\moodle\pg17\bin\initdb.exe -D C:\RUN\moodle\pgdata -U postgres -E UTF8 ^
     --auth-local=scram-sha-256 --auth-host=scram-sha-256 --pwfile=C:\RUN\moodle\secrets\pg-super.txt
   ```
   (`--pwfile` fuera del repo; elegir la configuración regional según `initdb` y verificar con `\l` que Encoding/Collation sean los esperados [F32].)
2. En `postgresql.conf` del nuevo clúster: `port = 9332`, `listen_addresses = '127.0.0.1'`. En `pg_hba.conf`: `host moodle moodleuser 127.0.0.1/32 scram-sha-256` (MoodleDocs muestra el formato con método `password`; el método fuerte `scram-sha-256` es decisión de D12) [F32].
3. Arrancar: `pg_ctl start -D C:\RUN\moodle\pgdata -l C:\RUN\moodle\pg.log -o "-p 9332"`. Alternativa como servicio de Windows: `pg_ctl register -N "PG17-moodle" -D C:\RUN\moodle\pgdata -S demand -o "-p 9332"` [F33]. Para la PoC basta el arranque manual desde un script.
4. Crear usuario y base propios (SQL de MoodleDocs) [F32]:
   ```sql
   CREATE USER moodleuser WITH PASSWORD '<secreto-fuera-del-repo>';
   CREATE DATABASE moodle WITH OWNER moodleuser ENCODING 'UTF8' TEMPLATE template0;
   ```
5. MoodleDocs pide un usuario de BD dedicado con permisos mínimos, no el superusuario [F34].

**Paso 3 · Servidor web (Caddy + php-cgi).**
1. Arrancar PHP FastCGI: `C:\RUN\moodle\php\php-cgi.exe -b 127.0.0.1:9381 -c C:\RUN\moodle\php\php.ini`. Riesgo: en Windows un proceso `php-cgi` atiende una petición a la vez (conocimiento general, **NO VERIFICADO en fuente oficial**); si hay lentitud, lanzar 2–3 instancias (9381–9383) y balancear en Caddy. NTS es la compilación para FastCGI/CLI; TS es para el módulo de Apache [F18].
2. `Caddyfile` propuesto (adaptado de la sintaxis oficial de `php_fastcgi` con `root` y `file_server`, y su subdirectiva `try_files`) [F35]:
   ```
   {
       admin off
   }
   http://127.0.0.1:9380 {
       bind 127.0.0.1
       root * C:/RUN/moodle/moodle/public
       php_fastcgi 127.0.0.1:9381 {
           try_files {path} {path}/index.php /r.php
       }
       file_server
   }
   ```
   **INFERIDO**: Moodle no documenta Caddy [F14]; el fallback a `/r.php` imita el `FallbackResource /r.php` de Apache. Validar con las dos pruebas oficiales: una ruta falsa debe mostrar la página 404 estilizada de Moodle, y `/course/<id>/manage` debe abrir la administración del curso [F14].
3. Alternativa con documentación oficial de Moodle: Apache 2 es el servidor "más probado y popular" en Windows según MoodleDocs; IIS 7/8 también soportado [F36]. Apache en 9380 con `DocumentRoot` en `public/` y `FallbackResource /r.php` [F14].
4. Prueba de humo sin Caddy: servidor integrado de PHP (`php -S 127.0.0.1:9380 -t C:\RUN\moodle\moodle\public`). PHP lo declara **solo para desarrollo/demos, un proceso, sin workers en Windows** [F37]; sin router no resuelve `r.php`.

**Paso 4 · `moodledata`.** Crear `C:\RUN\moodle\moodledata` fuera de la raíz web y del repo; solo el usuario que corre PHP debe poder escribir; el código no debe ser escribible por el servidor en producción [F38]. No usar carpetas sincronizadas por OneDrive (decisión D16, no de MoodleDocs).

**Paso 5 · Instalación por CLI no interactiva** (`install.php`; las opciones salen del código fuente de 5.3 [F12]; MoodleDocs recomienda el instalador CLI y avisa de escapar caracteres especiales con barra invertida [F38][F39]):
```
set MOODLE_DBPASS=<secreto-fuera-del-repo>
set MOODLE_ADMINPASS=<secreto-fuera-del-repo>
C:\RUN\moodle\php\php.exe -c C:\RUN\moodle\php\php.ini C:\RUN\moodle\moodle\admin\cli\install.php ^
  --non-interactive --agree-license ^
  --lang=en --wwwroot=http://127.0.0.1:9380 --dataroot=C:\RUN\moodle\moodledata ^
  --dbtype=pgsql --dbhost=127.0.0.1 --dbport=9332 --dbname=moodle --dbuser=moodleuser --dbpass=%MOODLE_DBPASS% --prefix=mdl_ ^
  --fullname="Quisqueya Academy (PoC)" --shortname=QHA-POC ^
  --adminuser=moodleadmin --adminpass=%MOODLE_ADMINPASS% --adminemail=admin@example.test --supportemail=admin@example.test
```
- Opciones confirmadas en `install.php` de 5.3: `--non-interactive`, `--agree-license`, `--lang`, `--wwwroot`, `--dataroot`, `--dbtype` (claves `mysqli, auroramysql, mariadb, pgsql, sqlsrv`), `--dbhost`, `--dbname`, `--dbuser`, `--dbpass`, `--dbport`, `--prefix` (por defecto `mdl_`), `--fullname`, `--shortname`, `--summary`, `--adminuser` (por defecto `admin`), `--adminpass`, `--adminemail`, `--supportemail`, `--noreplyemail`, `--sitepreset`, `--skip-database`, `--allow-unstable` [F12].
- `--wwwroot` debe ser exactamente la URL con la que se accede; usar siempre `127.0.0.1:9380` (o siempre `localhost`), no ambas. NO VERIFICADO: comportamiento de Moodle ante otro nombre de host.
- `--lang=en` a propósito: el paquete de idioma `es` se añade después desde la administración (NO VERIFICADO si el instalador CLI lo descarga solo).
- La política de contraseñas por defecto de Moodle puede rechazar la clave de admin; si lo hace, ajustar la clave (NO VERIFICADO el detalle de la política en 5.3).
- Alternativa documentada si se interrumpe: copiar `config-dist.php` a `config.php`, rellenarlo y relanzar [F39].
- Tras instalar, en `config.php` (antes de `require_once(__DIR__ . '/lib/setup.php')`): `$CFG->routerconfigured = true;` **solo cuando el paso 3 esté verificado** (la bandera solo oculta el aviso) [F14]. Para un sandbox sin correo saliente, `$CFG->noemailever = true` (ajuste documentado en `config-dist.php`; no consultado aquí).

**Paso 6 · Cron con el Programador de tareas** (Moodle recomienda ejecutar cron **cada minuto**; en Windows, una tarea del Programador que ejecute el PHP CLI) [F40]:
```
schtasks /create /sc minute /mo 1 /tn "Moodle cron QHA" ^
  /tr "C:\RUN\moodle\php\php.exe -c C:\RUN\moodle\php\php.ini C:\RUN\moodle\moodle\admin\cli\cron.php" ^
  /ru "%USERDOMAIN%\%USERNAME%"
```
(sintaxis `schtasks /create /sc minute /mo <n> /tn /tr /ru` [F41]). Opcional: `admin\cli\adhoc_task.php --execute --keep-alive=59` para tareas ad hoc más rápidas [F40]. Comprobar con `admin\cli\checks.php` y *Administración > Informes > Estado del sistema* [F40][F14]. Probar la tarea a mano antes de programarla [F40].

**Paso 7 · Uso del PostgreSQL 15 existente (solo si se baja a 4.5 LTS o 5.1).**
- Misma receta SQL del paso 2.4 pero en el servidor 5432: `CREATE USER moodleuser ...; CREATE DATABASE moodle WITH OWNER moodleuser ...;` y una línea `host moodle moodleuser 127.0.0.1/32 <método>` en `pg_hba.conf`; **sin ningún `GRANT` sobre las bases del CRM**. Se necesita la contraseña de superusuario (no consultada). `--dbport=5432`.
- Versiones válidas: 4.5 LTS (PG ≥13, PHP 8.1–8.3, seguridad hasta 2027-10-04) [F5][F1][F7]; 5.1 (PG ≥15, PHP 8.2–8.4, seguridad hasta 2027-04-19) [F4][F1]. 5.1 se descarta por su corta vida. PG15 llega a EOL el 2027-11-11 [F9].

### 2.3 Ruta A · Docker — pasos exactos (si el motor se repara)

1. Reparar Docker Desktop: WSL 2 ≥ 2.1.5, virtualización en BIOS, ≥ 8 GB de RAM; en Windows Home solo contenedores Linux [F21b].
2. **A1 · `moodlehq/moodle-docker`** [F16][F24b]: es un entorno de pruebas/desarrollo.
   ```
   git clone -b MOODLE_503_STABLE https://github.com/moodle/moodle.git moodle
   export MOODLE_DOCKER_WWWROOT=./moodle
   export MOODLE_DOCKER_DB=pgsql          # imagen postgres:17 por defecto
   export MOODLE_DOCKER_PHP_VERSION=8.4   # por defecto 8.3
   export MOODLE_DOCKER_WEB_PORT=127.0.0.1:9380
   cp config.docker-template.php $MOODLE_DOCKER_WWWROOT/config.php
   bin/moodle-docker-compose up -d && bin/moodle-docker-wait-for-db
   bin/moodle-docker-compose exec webserver php admin/cli/install_database.php --agree-license ...
   ```
   Limitaciones: el YAML de la BD no define volumen persistente (los datos sobreviven a `stop`, no a `down`); la contraseña de BD por defecto es pública en el repo; el host de BD es `db` fijo; el README no cubre cron ni `public/` [F16][F17][F24b]. No sirve tal cual para "RUN".
3. **A2 · `erseco/alpine-moodle`** (no oficial, MIT; `latest` = 5.3 LTS, PHP 8.4; `DB_TYPE=pgsql`, `DB_HOST`, `DB_PORT`, `MOODLE_USERNAME`, `MOODLE_PASSWORD`; escucha en 8080; auto-detecta `/public`) [F15]. Sin fecha de release visible y sin releases publicadas en la página: D12 debe revisar procedencia antes de usarla (NO VERIFICADO).
4. Para ambas, la BD es un contenedor `postgres:17` (no se puede reutilizar el PG15 del host: no cumple el mínimo). El `install.php` del paso 5 de la ruta B se ejecuta dentro del contenedor web.

### 2.4 Veredicto de ruta

**Ruta B.** Motivos: (1) el motor Docker no arranca hoy y el bloqueo no es del proyecto; (2) la RAM libre habitual (≈3 GB) no deja holgura para WSL2 + Docker Desktop + PHP + PG17 (ESTIMACIÓN); (3) la única imagen "oficial" es de desarrollo y Bitnami ya no ofrece versiones fijas gratis [F23b]; (4) cada pieza de la ruta B es un binario con versión y hash fijables. Reabrir A cuando exista un VPS (hoy fuera de alcance de I02 §7).

---

## 3. Web services necesarios (existen en el árbol `MOODLE_503_STABLE`)

Todas las funciones están declaradas en los `db/services.php` de 5.3 [F42][F43][F44]. "Desde" es la etiqueta `@since` del código fuente cuando la tiene; "—" = no encontré etiqueta.

| Necesidad | Función (nombre exacto) | Desde | Tipo | Capacidad(es) que exige | Notas relevantes |
|---|---|---|---|---|---|
| Crear usuario | `core_user_create_users` | 2.2 [F45] | write | `moodle/user:create` | Obligatorios `username, firstname, lastname, email`; `auth` por defecto `manual`; exige `password` o `createpassword`; **no** acepta `suspended`; `mnet` y `webservice` no admitidos como `auth`; errores `invalid_parameter_exception`: usuario existente, email existente (salvo `allowaccountssameemail`), `auth` inválido. Parámetro `idnumber` disponible |
| Buscar usuario | `core_user_get_users_by_field` | 2.4 [F45] | read | `moodle/user:viewdetails`, `viewhiddendetails`, `moodle/course:useremail`, `moodle/user:update` | `field` ∈ `id, idnumber, username, email`; `values[]`. Vacío si el campo no es visible al llamante |
| Buscar usuarios (alterna) | `core_user_get_users` | — | read | mismas | Búsqueda por criterios; no usar como clave de unión |
| Actualizar/suspender usuario | `core_user_update_users` | 2.2 [F45] | write | `moodle/user:update` | Acepta `suspended`; los fallos vuelven como **warnings**, no como excepción (`invaliduserid`, `useremailduplicate`, etc.) |
| Listar cursos | `core_course_get_courses` | 2.2 (parámetros 2.3) [F46] | read | `moodle/course:view` (+ `update`, `viewhiddencourses` para campos extra) | Entrada: `options[ids][]` |
| Buscar curso por campo | `core_course_get_courses_by_field` | — | read | ninguna | Campos `id, shortname, idnumber, category` (según su descripción) |
| Crear curso | `core_course_create_courses` | 2.2 [F46] | write | `moodle/course:create`, `moodle/course:visibility` | `fullname, shortname, categoryid` obligatorios; `enablecompletion`, `idnumber`, `format`. **No usar en producción del CRM**: los cursos se publican por Admin/backup |
| Contenido de curso | `core_course_get_contents` | — | read | `moodle/course:update`, `viewhiddencourses` | Opcional |
| Matricular | `enrol_manual_enrol_users` | 2.2 [F47] | write | `enrol/manual:enrol` | `enrolments[]`: `roleid, userid, courseid` obligatorios; `timestart, timeend, suspend` opcionales (**`suspend=1` suspende la matrícula**). Errores: `manualpluginnotinstalled`, `wsusercannotassign`, `wsnoinstance`, `wscannotenrol`. Usa transacción delegada: un error revierte la llamada |
| Dar de baja | `enrol_manual_unenrol_users` | — (clase 2.2) [F47] | write | `enrol/manual:unenrol` | `enrolments[]`: `userid, courseid`. Errores: `wsnoinstance`, `wscannotunenrol` |
| Matriculados | `core_enrol_get_enrolled_users` | — | read | `moodle/user:viewdetails`, `moodle/site:accessallgroups`, etc. | Para reconciliar |
| Cursos de un usuario | `core_enrol_get_users_courses` | — | read | `moodle/course:viewparticipants` | Para reconciliar |
| Finalización de curso | `core_completion_get_course_completion_status` | 2.9 [F48] | read | `report/completion:view` | `courseid`, `userid` → `completionstatus{completed, aggregation, completions[]}`. Errores: `cannotviewreport`, `accessdenied`, `notenroled`/`usernotenroled`, **`nocriteriaset`** (curso sin criterios de finalización) |
| Finalización por actividad | `core_completion_get_activities_completion_status` | 2.9 [F48] | read | `report/progress:view` (si consulta a otro usuario) | `statuses[]` con `cmid, modname, state, timecompleted, isoverallcomplete…`; no devuelve actividades no visibles al usuario |
| Notas | `gradereport_user_get_grade_items` | 3.2 [F49] | read | `gradereport/user:view` y `moodle/grade:viewall` (para ver a otros) | `courseid`, `userid`, `groupid` → `usergrades[].gradeitems[]` (`graderaw`, `gradeformatted`, `grademin`, `grademax`, `percentageformatted`, `status`…). Errores: `notingroup`, `nopermissiontoviewgrades` |
| Cohortes | `core_cohort_create_cohorts` / `core_cohort_add_cohort_members` / `core_cohort_delete_cohort_members` | 2.5 [F50] | write | `moodle/cohort:manage` / `moodle/cohort:assign` | `add` identifica por `cohorttype{id|idnumber}` y `usertype{id|username}`; duplicados y faltantes vuelven como warnings. `core_cohort_search_cohorts`: sin etiqueta de versión en el código |
| Diagnóstico | `core_webservice_get_site_info` | — | read | — | Verifica token y funciones permitidas (no consultada su definición; declarada en el core) |

**Nota de versiones:** "Desde" dice cuándo existió la función, no su estabilidad en 5.3. 5.3 depreca las clases antiguas `external_*` [F2]; las funciones de arriba ya están definidas con clases del core de 5.3 [F42], pero **la existencia documental no sustituye la prueba en la instancia fijada** (I02 §9).

### 3.1 Cómo habilitar (UI; el instalador no crea tokens) [F51]

1. *Administración del sitio > Funciones avanzadas > Habilitar servicios web*.
2. *Servidor > Servicios web > Gestionar protocolos*: habilitar **REST**.
3. Crear un **rol técnico** (nivel sistema) con las capacidades mínimas de la tabla: `webservice/rest:use`, `moodle/webservice:createtoken`, `moodle/user:create`, `moodle/user:update`, `moodle/user:viewdetails`, `moodle/course:view`, `moodle/course:viewparticipants`, `moodle/course:viewhiddencourses`, `enrol/manual:enrol`, `enrol/manual:unenrol`, `report/completion:view`, `report/progress:view`, `gradereport/user:view`, `moodle/grade:viewall`, `moodle/site:accessallgroups`, `moodle/cohort:manage`, `moodle/cohort:assign`. (Lista derivada de las capacidades que cada función exige en el código [F42][F43][F44]; ajustar en la PoC quitando lo que sobre. Retirar `moodle/course:create` y los permisos de cohortes si no se usan.)
4. Crear un **usuario técnico** (no administrador) `svc_crm_academy` con ese rol. MoodleDocs: la forma de crear token para un administrador es solo *Gestionar tokens*; con un usuario técnico se evita [F51].
5. *Servicios web > Servicio externo > Añadir servicio personalizado*: nombre `crm_academy`, **Habilitado**, **Solo usuarios autorizados**; *Añadir funciones*: solo las del §3; *Usuarios autorizados*: añadir `svc_crm_academy` con **restricción de IP `127.0.0.1`** y **validez** definida [F51].
6. *Gestionar tokens > Añadir*: token para ese usuario y servicio. El token se guarda **solo** en el entorno del servidor del CRM (`src/infrastructure/env.ts`); jamás al navegador ni al repositorio (reglas de I02 §3 y AGENTS.md).

### 3.2 Formato de llamada REST y errores [F52]

- Endpoint: `http://127.0.0.1:9380/webservice/rest/server.php` (la ruta pública no cambia con `public/`; NO VERIFICADO con la instalación 5.3 real).
- Parámetros (GET o POST combinados): `wstoken`, `wsfunction`, `moodlewsrestformat=json`; el resto son los argumentos de la función. **Si falta `moodlewsrestformat` o no es `json`/`xml`, responde XML** [F52]. Recomendación: usar **POST** con `Content-Type: application/x-www-form-urlencoded`, para no dejar el token en URLs/logs (práctica general; la página de seguridad de MoodleDocs consultada no dice nada del tema).
- Arrays: convención de Moodle `users[0][username]=...` (convención de Moodle; no figura en las páginas leídas).
  ```
  curl -s -X POST http://127.0.0.1:9380/webservice/rest/server.php ^
    -d wstoken=%WSTOKEN% -d wsfunction=core_user_get_users_by_field ^
    -d moodlewsrestformat=json -d field=idnumber -d "values[0]=crm:broker:1001"
  ```
- Éxito: JSON de los valores devueltos. **Error:** un objeto `{"exception":"<clase>","errorcode":"<código>","message":"<texto>"}`; `debuginfo` solo con depuración activa [F52]. Ejemplos de lang strings: `invalidtoken` → "Invalid token - token not found"; `accessexception` → "Access control exception"; `servicenotavailable` → "Web service is not available. (It doesn't exist or might be disabled.)"; `usernotallowed` → usuario no autorizado en el servicio [F53]. Los fallos de validación propios (`invalid_parameter_exception`, `moodle_exception`) llegan con su `errorcode`; **las advertencias de `update_users`, `add_cohort_members` etc. llegan con HTTP 200 dentro de `warnings`** y el adaptador debe tratarlas como error de negocio.
- Todas las respuestas incluyen `Access-Control-Allow-Origin: *` y cabeceras sin caché [F52]: **no exponer el endpoint al navegador**; solo el servidor del CRM (BFF/worker) lo llama.
- Reglas de mapeo recomendadas (D03/D11 deciden): `idnumber` de Moodle = clave estable del CRM (por ejemplo `crm:broker:<users.id>`), `username` sintético (`broker-<id>`), y **buscar por `idnumber` antes de crear** (el correo no es clave de unión, I02 §4). Matrícula idempotente: buscar con `core_enrol_get_enrolled_users`/`core_enrol_get_users_courses` antes de `enrol_manual_enrol_users`. NO VERIFICADO si repetir una matrícula idéntica actualiza o duplica; probarlo en la PoC.
- **Baja efectiva (S4 de M13):** `enrol_manual_enrol_users` con `suspend=1` (o `enrol_manual_unenrol_users`) + `core_user_update_users` con `suspended=1`. Matar sesiones ya abiertas solo existe como script CLI (`admin/cli/kill_all_sessions.php --run`, con `--for-users` desde 5.2) [F54]; no encontré función web service equivalente. La suspensión de la sesión LMS ya abierta sigue siendo remota y eventual: coherente con S4.
- Moodle 5.3 anuncia un "servidor OAuth 2 para servicios web enrutados" y mejoras en `token.php` [F2]; la documentación de desarrollo consultada no los detalla [F55]. **No usarlos en el primer corte** (tecnología nueva sin documentación leída).

---

## 4. SSO / lanzamiento seguro y eventos salientes

### 4.1 Opciones de lanzamiento (CRM → curso)

| Opción | Cómo funciona | Licencia | Mantenimiento / compatibilidad | Veredicto |
|---|---|---|---|---|
| **`auth_userkey`** (Catalyst IT) | El servidor del CRM llama el servicio `auth_userkey_request_login_url` (campo de mapeo: username, email, idnumber o id) y recibe una URL de login **con clave que caduca**; opción de restringir por IP; el usuario entra sin contraseña [F21]. Requiere REST, token del servicio "User key authentication web service" y capacidad `auth/userkey:generatekey` [F21] | Cabecera de `version.php`: **GNU GPL v3 or later** [F56]; el repositorio en GitHub no declara licencia (`license: null`) [F57] | Rama activa `MOODLE_405_STABLE` (último push 2026-09-03), 90 estrellas, no archivado [F57]; `$plugin->supported = [405, 500]` y la ficha del directorio lista **2.9 a 5.0**, última versión 2025-08-24, 2 445 instalaciones [F20][F56]. **No declara 5.1/5.2/5.3** | **Candidato principal pero NO VERIFICADO en 5.3** (además en 5.1+ el plugin debe vivir bajo `public/auth/userkey` [F13]). La PoC debe: instalar, generar URL, usarla una vez, comprobar caducidad, reuso (no está documentado si la clave es de un solo uso [F21]) y restricción de IP. Si falla en 5.3, escribir un plugin local propio mínimo o pasar a OIDC |
| **`auth_oidc`** (Enovation/Microsoft) | OpenID Connect con proveedores configurables, no solo Azure/Entra [F22] | GPLv3 con copyright de Microsoft y restricción de marcas [F22] | Ficha lista **3.9 a 5.2**, última versión 2026-09-02, 10 272 instalaciones [F22] (no lista 5.3 aún) | Segunda opción. Requiere que el CRM sea proveedor OIDC. **Supabase Auth** ofrece un servidor OAuth 2.1/OIDC (`/oauth/authorize`, `/oauth/token`, `/oauth/userinfo`, JWKS), con consola de consentimiento propia, **en beta pública**; autoalojable [F23]. Que Moodle acepte ese emisor es **NO VERIFICADO** (D21 previo ya lo marcó) |
| LTI 1.3 con el CRM como plataforma | Requiere implementar el rol de plataforma LTI en el CRM [D21 previo, F58] | — | — | Fuera del primer corte |
| Token móvil / `login/token.php` | No documentado para este uso en las páginas leídas [F59] | — | — | **Descartado** (diseñado para la app móvil) |

**Reglas de seguridad propias del lanzamiento** (de I02/M13, no de las fuentes): el CRM comprueba asignación activa + rol + broker propio **antes** de pedir la URL; nunca se persiste ni se loguea la URL/clave; vida de la clave del orden de segundos o pocos minutos (valor a fijar en la PoC); la URL solo se devuelve al navegador del propio broker; usar `wantsurl` para aterrizar en el curso asignado [F21]; el correo no es clave.

### 4.2 Eventos Moodle → CRM

- **No hay webhooks nativos** en lo leído: la búsqueda de documentación y tracker no mostró soporte en el core ni hoja de ruta (ausencia de evidencia, no prueba de ausencia) [F25]. La nota de versión 5.3 tampoco los menciona [F2].
- **`local_webhooks`** (Valentin Popov): intercepta todos los eventos de Moodle y envía POST JSON con una frase secreta; ficha del directorio: soporte **3.2 a 5.3**, última versión 2026-10-02, 816 instalaciones; licencia GPLv3 según su README (la ficha no la declara) [F24][F60]. Limitaciones reportadas por el mantenedor: **no reintenta** si falla, no filtra por curso, y la ficha deja sin responder si la frase va en cabecera o en el cuerpo [F25]. **No debe ser fuente de verdad**; solo acelerador opcional que dispare una reconciliación.
- **`logstore_xapi`**: envía eventos por lotes y tarea programada a un LRS (xAPI); ficha 4.1 a 5.2, última versión 2026-07-21, licencia no declarada en la ficha [F61]. Aplaza hasta que haya necesidad de LRS (D21 previo ya posponía xAPI).
- **Recomendación (coherente con I02 §5):** reconciliación por **polling** desde un worker del CRM con idempotencia: por cada asignación activa, llamar `core_completion_get_course_completion_status`, `core_completion_get_activities_completion_status` y `gradereport_user_get_grade_items`; guardar un resumen mínimo con `synced_at`, origen e ID externo en `academy_evidence`; `UNKNOWN` si la llamada falla o `nocriteriaset`. Nunca derivar `aprobado` de esos datos.

---

## 5. Plugin de certificados (`mod_customcert`)

- **Licencia:** GPL-3.0 según GitHub; la cabecera de `version.php` dice "GNU GPL v3 or later" [F26][F27b]. Mantenedor: Mark Nelson; 113 estrellas, no archivado, último push 2026-10-14 [F26].
- **Compatibilidad:** la ficha del directorio lista **2.9 a 5.3** (5.0, 5.1, 5.2 y 5.3 soportadas), última versión 2026-10-11, 32 169 instalaciones; `version.php` actual: release **5.3.2**, requiere Moodle 5.3 (`2026100500`), madurez estable [F27][F27b].
- **Qué hace:** PDF dinámico configurable por navegador, elementos arrastrables, código único por certificado emitido, página "Verify certificate" y capacidad `mod/customcert:verifycertificate`; ajuste "permitir que cualquiera verifique" [F62]. Se emite al cumplir restricciones de acceso (p. ej., completar otra actividad) [F62].
- **Conveniencia:** **No en el primer corte.** M13 y I02 exigen que el certificado sea una constancia **CRM** emitida por decisión Admin; un PDF de Moodle que se genera al completar actividades produciría, por diseño, exactamente el "certificado falso por progreso" que los CA-01/CA-06 prohíben, y duplicaría la fuente de verdad de verificación. Si más adelante se quiere un PDF con la marca del curso, usarlo solo como **material descargable de cortesía** con texto "constancia de finalización de contenido, no certificación", o emitirlo manualmente tras la aprobación del Admin. Requisitos si se adopta: ficha/extensión de I02 con licencia, API y export (I02 §9 precondición 2).

---

## 6. Lista de comprobación "Moodle local listo"

Marcar solo con evidencia observada por D14/D16 (capturas, logs, salidas). Nada de esto está ejecutado todavía.

**Entorno**
- [ ] `php -v` = 8.4.x NTS x64 y `php -m` incluye `ctype curl dom gd iconv intl json mbstring pcre pgsql simplexml sodium spl xml zip`; `max_input_vars` = 5000 (comprobar con `php -i`); `memory_limit` ≥ 128M.
- [ ] PG17 escucha **solo** en `127.0.0.1:9332`; el PG15 del CRM sigue intacto en 5432; base `moodle` y rol `moodleuser` sin acceso a bases del CRM.
- [ ] `http://127.0.0.1:9380` responde con el instalador completado; el servidor sirve desde `public/`; `config.php` y `moodledata` fuera de la raíz web [F8][F12].
- [ ] *Servidor > Entorno* sin errores bloqueantes; ruta falsa devuelve 404 de Moodle y `/course/<id>/manage` abre (router) [F14]; `admin\cli\checks.php` sin fallos críticos [F14][F40].
- [ ] `config.php` y dataroot no están en OneDrive ni en el repo; ningún secreto en `git status`.

**Cron**
- [ ] Tarea `Moodle cron QHA` creada, se ejecuta cada minuto y *Estado del sistema* no marca cron atrasado [F40][F41].
- [ ] Una tarea programada y una ad hoc se ejecutaron (`admin\cli\scheduled_task.php --list`) [F54].

**Respaldo y restauración** (MoodleDocs: código, `moodledata` y base de datos; modo mantenimiento durante la copia) [F13][F54]
- [ ] `admin\cli\maintenance.php --enable` → `pg_dump -Fc -p 9332 -U moodleuser moodle > moodle.dump` + copia de `moodledata` + copia de `config.php` y del código fijado → `--disable` (formato de `pg_dump` y `robocopy` son práctica estándar, no consultados aquí).
- [ ] **Restauración ensayada** en un directorio/BD nuevos (`moodle_restore`): `pg_restore`, `moodledata` copiado, `config.php` apuntado, `admin\cli\purge_caches.php`, el login funciona y el curso y las matrículas están intactos [F54]. Registrar tiempos.
- [ ] Respaldo de curso `.mbz` guardado como fixture del curso sintético (curso exportable/restaurable: D21 previo, Fase 1 "Salida") [F63].

**Servicios web**
- [ ] Servicio `crm_academy` con solo las funciones del §3; usuario técnico no administrador; IP `127.0.0.1`; token fuera del repo.
- [ ] `core_webservice_get_site_info` devuelve el usuario técnico y la versión 5.3.x.
- [ ] Un error de token (`invalidtoken`) y un error de permiso (`accessexception`/`nopermissions`) producen JSON con `exception`/`errorcode` como espera el adaptador [F52][F53].

**Datos sintéticos (2 brokers, 1 curso)**
- [ ] Curso `QHA-DEMO-01` creado por Admin (UI o restauración `.mbz`) con **finalización habilitada y criterios definidos** (sin criterios, `core_completion_get_course_completion_status` devuelve `nocriteriaset`) [F48]. No encontré una función web service para fijar criterios de finalización en lo leído → configurar por UI y empaquetar.
- [ ] Brokers `broker-a` y `broker-b` creados con `core_user_create_users` (`idnumber` = `crm:broker:<id>`, correos `@example.test`), **sin datos reales** (Q-C1-05 pendiente) [F45].
- [ ] Matrícula de A en el curso (`enrol_manual_enrol_users`, `roleid` de estudiante) y B **sin** matricular; B no ve el curso; A no consulta el progreso de B por el servicio con el token de un usuario sin la capacidad.
- [ ] Progreso: A completa una actividad → `core_completion_get_activities_completion_status` lo refleja; A completa el curso → `core_completion_get_course_completion_status.completed = true`; `gradereport_user_get_grade_items` devuelve nota. **El CRM sigue sin certificar** (CA-01).
- [ ] Baja: `suspend=1` / `enrol_manual_unenrol_users` + `suspended=1`; el lanzamiento desde el CRM se bloquea de inmediato; medir cuánto tarda en caer la sesión Moodle abierta (S4); `kill_all_sessions.php --for-users` como remedio manual [F54].
- [ ] Repetir la matrícula y la sincronización no duplica datos (idempotencia).
- [ ] SSO/lanzamiento (si se adopta `auth_userkey`): URL de un solo uso, caducidad, restricción de IP y reuso probados en 5.3.
- [ ] Moodle caído: el CRM marca evidencia `UNKNOWN` con `synced_at`; no cambia estados de aprobación.

**Seguridad (D12)**
- [ ] Sin puertos expuestos fuera de loopback; ningún secreto en logs; token y claves de lanzamiento ausentes de auditoría/outbox (M13 S6).
- [ ] Revisar `Access-Control-Allow-Origin: *` del REST de Moodle: el endpoint no es alcanzable desde el navegador del usuario [F52].
- [ ] Licencias de cada plugin adoptado revisadas por D12 (§7).

---

## 7. Licencias (resumen para D12)

| Componente | Licencia observada | Fuente |
|---|---|---|
| Moodle LMS | GPL (texto `COPYING.txt` del repo; declaración `or-later` pendiente de confirmar por versión, como ya anotó D21) | [F10][D21 previo] |
| `auth_userkey` | Cabecera "GPL v3 or later"; repo sin licencia declarada en GitHub | [F56][F57] |
| `auth_oidc` | GPLv3, © Microsoft, marcas restringidas | [F22] |
| `mod_customcert` | GPL-3.0 (GitHub) / cabecera GPL v3 or later | [F26][F27b] |
| `local_webhooks` | GPLv3 (README) | [F60] |
| `logstore_xapi` | No declarada en la ficha | [F61] |
| `erseco/alpine-moodle` | MIT (la imagen; Moodle dentro sigue GPL) | [F15] |
| PHP, PostgreSQL, Caddy | No revisadas en este expediente | — |

La integración propuesta es **por protocolo (REST/launch)**, sin modificar ni embeber código GPL en el CRM; esto no es dictamen jurídico (igual que en D21 previo).

---

## 8. Riesgos abiertos y siguientes pasos

| # | Riesgo / hueco | Dueño | Acción |
|---|---|---|---|
| 1 | PG15 local no cumple 5.2/5.3 (§1.2) | D16/D03 | Decidir: clúster PG17 en 9332 (recomendado) o bajar a 4.5 LTS sobre PG15 |
| 2 | `auth_userkey` sin soporte declarado ≥5.1 | D03/D19/D12 | PoC corta de 1 h en 5.3; plan B: plugin local mínimo u OIDC |
| 3 | Caddy + router sin receta oficial | D16 | Probar las dos verificaciones del §2.2 paso 3; alternativa Apache |
| 4 | `php-cgi` en Windows y concurrencia | D16/D15 | Medir con 2 brokers; subir instancias si hace falta |
| 5 | 5.3.0 recién publicada | D03/D16 | Fijar el tag y subir a 5.3.1 cuando salga; no usar datos reales |
| 6 | Criterios de finalización no configurables por WS | D19 | Mantener curso como `.mbz` versionado |
| 7 | Revocación de sesión LMS abierta (S4) | D12/D16 | Documentar SLA medido, no prometido |
| 8 | PHP 8.4 seguridad termina 2028-12 vs Moodle 2029-10 | D16 | Revisión anual de PHP |
| 9 | Q-C1-05 (PII real hacia LMS) | Wilber | Mantener solo sintéticos |

**Despacho:** este expediente es entrada para completar I02 (versión exacta, funciones, identidad) rumbo a READY; **no** autoriza código ni instalación. Cualquier descarga/instalación requiere la aprobación explícita de Wilber y tarea D16 con `TAREA.md`.

---

## Anexo A · Fuentes

| Ref | URL | Qué se tomó |
|---|---|---|
| F1 | https://moodledev.io/general/releases | Tabla de ramas, fechas y soporte; 5.3 LTS |
| F2 | https://moodledev.io/general/releases/5.3 | Requisitos 5.3: PHP 8.3–8.4, PG 17, MariaDB 11.4, sodium, `max_input_vars`; novedades |
| F3 | https://moodledev.io/general/releases/5.2 | PG 16, PHP 8.3–8.4 |
| F4 | https://moodledev.io/general/releases/5.1 | PG 15, PHP 8.2–8.4, directorio `/public`, router |
| F5 | https://moodledev.io/general/releases/4.5 | PG 13, PHP 8.1–8.3 |
| F6 | https://download.moodle.org/releases/latest/ | Paquetes 5.3 y tag `MOODLE_503` |
| F7 | https://docs.moodle.org/503/en/PHP | Tabla PHP por versión, extensiones, ajustes, notas Windows |
| F8 | https://docs.moodle.org/503/en/Installing_Moodle | Pasos de instalación, `public/`, moodledata, hardware |
| F9 | https://www.postgresql.org/support/versioning/ | Fechas EOL de PG 15–18 |
| F10 | https://github.com/moodle/moodle/tree/MOODLE_503_STABLE | Árbol: `public/`, `admin/cli` en la raíz |
| F11 | https://docs.moodle.org/501/en/Upgrade | Cambios de estructura (5.1) |
| F12 | https://raw.githubusercontent.com/moodle/moodle/MOODLE_503_STABLE/admin/cli/install.php | Opciones del instalador CLI, `dirroot`, `config.php` en la raíz |
| F13 | https://docs.moodle.org/503/en/Upgrade | Plugins en `public/`, copias antes de actualizar |
| F14 | https://docs.moodle.org/503/en/Configuring_the_Router | Router: Apache/Nginx/IIS, `routerconfigured`, pruebas |
| F15 | https://github.com/erseco/alpine-moodle | Imagen no oficial: MIT, 5.3 LTS, variables, `/public` |
| F16 | https://github.com/moodlehq/moodle-docker | README: propósito, variables, comandos |
| F17 | https://raw.githubusercontent.com/moodlehq/moodle-docker/main/config.docker-template.php | `config.php` de plantilla (sin `public`/router; host `db` fijo) |
| F18 | https://www.php.net/downloads.php?os=windows | Windows: solo PHP 8.5.11; NTS/TS; VC++ |
| F19 | https://downloads.php.net/~windows/releases/ | `php-8.4.26-nts-Win32-vs17-x64.zip`, `php-8.3.35-nts-Win32-vs16-x64.zip` |
| F20 | https://marketplace.moodle.com/plugins/auth_userkey | Ficha: 2.9–5.0, 2025-08-24, 2 445 instalaciones |
| F20b | https://www.php.net/supported-versions.php | Soporte de PHP 8.3/8.4/8.5 |
| F21 | https://github.com/catalyst/moodle-auth_userkey | README: flujo `auth_userkey_request_login_url`, IP, caducidad |
| F21b | https://docs.docker.com/desktop/setup/install/windows-install/ | Requisitos Docker Desktop en Windows |
| F22 | https://marketplace.moodle.com/plugins/auth_oidc | Ficha `auth_oidc` |
| F22b | https://hub.docker.com/r/moodlehq/moodle-php-apache | Imagen de entorno PHP/Apache para desarrollo |
| F23 | https://supabase.com/docs/guides/auth/oauth-server | Servidor OAuth 2.1/OIDC de Supabase (beta pública) |
| F23b | https://github.com/bitnami/containers/issues/83267 | Cambios Bitnami: `bitnamilegacy`, `bitnamisecure` |
| F24 | https://marketplace.moodle.com/plugins/local_webhooks | Ficha `local_webhooks` |
| F24b | https://raw.githubusercontent.com/moodlehq/moodle-docker/main/db.pgsql.yml | `postgres:17` por defecto, sin volumen |
| F25 | https://moodle.org/plugins/local_webhooks | Comentarios: sin reintentos, sin filtro por curso; búsqueda sin webhooks nativos |
| F25b | https://docs.moodle.org/503/en/Installing_Moodle | Hardware mínimo (misma página que F8) |
| F26 | https://api.github.com/repos/mdjnelson/moodle-mod_customcert | Licencia GPL-3.0, actividad |
| F26b | https://www.enterprisedb.com/download-postgresql-binaries | Binarios PG 17.11 / 18.6 |
| F27 | https://raw.githubusercontent.com/php/php-src/PHP-8.4/php.ini-development | Extensiones de Windows y opcache en `php.ini` |
| F27b | https://raw.githubusercontent.com/mdjnelson/moodle-mod_customcert/master/version.php | Release 5.3.2, requiere 5.3, cabecera GPL |
| F28 | https://www.php.net/manual/en/sodium.installation.php | `sodium` incluido en Windows pero hay que habilitarlo |
| F29 | https://docs.moodle.org/503/en/Installing_Moodle | `date.timezone` (misma página que F8) |
| F30 | https://docs.moodle.org/503/en/Cron | PHP CLI puede diferir del web; cron |
| F31 | https://www.postgresql.org/docs/17/app-initdb.html | Opciones de `initdb` |
| F32 | https://docs.moodle.org/503/en/PostgreSQL | SQL de usuario y base, `pg_hba.conf`, `\l` |
| F33 | https://www.postgresql.org/docs/17/app-pg-ctl.html | `pg_ctl register`/`start` con `-o "-p"` |
| F34 | https://docs.moodle.org/503/en/Installing_Moodle | Usuario de BD con permisos mínimos |
| F35 | https://caddyserver.com/docs/caddyfile/directives/php_fastcgi | `php_fastcgi`, `root`, `try_files` |
| F36 | https://docs.moodle.org/503/en/Windows_installation | Apache recomendado, IIS soportado en Windows (página marcada como desactualizada) |
| F37 | https://www.php.net/manual/en/features.commandline.webserver.php | Servidor integrado: solo desarrollo, sin workers en Windows |
| F38 | https://docs.moodle.org/503/en/Installing_Moodle | `moodledata`, CLI recomendado, permisos |
| F39 | https://docs.moodle.org/503/en/Administration_via_command_line | Escapes, `config-dist.php`, scripts CLI |
| F40 | https://docs.moodle.org/503/en/Cron | Cron cada minuto, CLI, Windows Task Scheduler, ad hoc |
| F41 | https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/schtasks-create | Sintaxis `schtasks /create /sc minute /mo` |
| F42 | https://raw.githubusercontent.com/moodle/moodle/MOODLE_503_STABLE/public/lib/db/services.php | Definición de funciones core |
| F43 | https://raw.githubusercontent.com/moodle/moodle/MOODLE_503_STABLE/public/enrol/manual/db/services.php | `enrol_manual_*` |
| F44 | https://raw.githubusercontent.com/moodle/moodle/MOODLE_503_STABLE/public/grade/report/user/db/services.php | `gradereport_user_*` |
| F45 | https://raw.githubusercontent.com/moodle/moodle/MOODLE_503_STABLE/public/user/externallib.php | Parámetros, `@since` y errores de usuarios |
| F46 | https://raw.githubusercontent.com/moodle/moodle/MOODLE_503_STABLE/public/course/externallib.php | Cursos: parámetros y `@since` |
| F47 | https://raw.githubusercontent.com/moodle/moodle/MOODLE_503_STABLE/public/enrol/manual/externallib.php | Matrícula/baja: parámetros, errores, `suspend` |
| F48 | https://raw.githubusercontent.com/moodle/moodle/MOODLE_503_STABLE/public/completion/classes/external.php | Finalización: `@since 2.9`, errores |
| F49 | https://raw.githubusercontent.com/moodle/moodle/MOODLE_503_STABLE/public/grade/report/user/classes/external/user.php | Notas: `@since 3.2`, campos, permisos |
| F50 | https://raw.githubusercontent.com/moodle/moodle/MOODLE_503_STABLE/public/cohort/externallib.php | Cohortes: `@since 2.5` |
| F51 | https://docs.moodle.org/503/en/Using_web_services | Habilitar servicios web, protocolo, servicio, usuarios autorizados, tokens |
| F52 | https://raw.githubusercontent.com/moodle/moodle/MOODLE_503_STABLE/public/webservice/rest/locallib.php | `wstoken`/`wsfunction`/`moodlewsrestformat`, formato de error, cabeceras |
| F53 | https://raw.githubusercontent.com/moodle/moodle/MOODLE_503_STABLE/public/lang/en/webservice.php | Textos de `invalidtoken`, `accessexception`, `servicenotavailable`, `usernotallowed` |
| F54 | https://docs.moodle.org/503/en/Administration_via_command_line | `maintenance.php`, `kill_all_sessions.php`, `scheduled_task.php`, `purge_caches.php` |
| F55 | https://moodledev.io/docs/5.3/apis/subsystems/external/writing-a-service | Sin detalle de OAuth2/routing para servicios |
| F56 | https://raw.githubusercontent.com/catalyst/moodle-auth_userkey/MOODLE_405_STABLE/version.php | GPL v3+, `supported = [405, 500]`, versión 2025120301 |
| F57 | https://api.github.com/repos/catalyst/moodle-auth_userkey | Actividad, sin licencia en metadatos, ramas |
| F58 | https://moodledev.io/docs/5.3/apis/subsystems/external/security | Solo validación de contexto/capacidades en funciones |
| F59 | https://docs.moodle.org/503/en/Mobile_web_services | No documenta autologin/`token.php` para este uso |
| F60 | https://code.popov.link/moodle/local_webhooks/raw/branch/main/README.md | GPLv3, funciones, frase secreta |
| F61 | https://marketplace.moodle.com/plugins/logstore_xapi | Ficha `logstore_xapi` |
| F62 | https://docs.moodle.org/503/en/Custom_certificate_module | Elementos, verificación por código, restricciones de acceso |
| F63 | `.viltrum/crm-ux/D21-academy-opensource.md` §10 (local) | Pruebas de salida/restauración de la PoC |
| — | `.viltrum/vre-os/spec/integraciones/I02-moodle.md`, `.viltrum/vre-os/spec/modulos/M13-academy.md`, `src/application/academy/puertos.ts`, `docs/contexto/decisiones.md` (línea ~293: Docker Desktop no arranca) | Contexto local |

## Anexo B · Lo que NO pude verificar

- Número de punto exacto de 5.3 (la página de descargas solo muestra el tag `MOODLE_503`) y SHA-256 de cualquier paquete.
- Que `auth_userkey` funcione en 5.3 (el plugin declara hasta 5.0), que sus claves sean de un solo uso, y su comportamiento bajo `public/`.
- Que Moodle 5.3 acepte a Supabase Auth como emisor OIDC.
- Que `moodle-docker` o `erseco/alpine-moodle` funcionen sin ajustes con la estructura `public/` de 5.3.
- Si repetir `enrol_manual_enrol_users` es idempotente; `@since` de `unenrol_users`, `get_courses_by_field`, `core_cohort_search_cohorts` y funciones de ayuda.
- RAM real: las cifras de §0 y §2.1 son **estimaciones propias**, sin medición ni fuente.
- Receta de Caddy con `/r.php`, concurrencia de `php-cgi` en Windows, formato exacto (zip) de los binarios PG de EDB, política de contraseñas por defecto y descarga automática del paquete de idioma `es`.
- Inexistencia de webhooks nativos en el core de Moodle (solo ausencia de evidencia en lo consultado).
- Que las páginas web hayan sido resumidas por una herramienta de lectura: cifras y citas críticas (PostgreSQL 17 mínimo en 5.3, PHP 8.3–8.4, fechas de soporte) coinciden entre dos fuentes oficiales en el caso de PHP/versiones; el mínimo PG 17 de 5.3 proviene de una sola página de notas de versión y debe recontrastarse con `admin/environment` o el `environment.xml` de 5.3 al descargar el paquete.
