# D16 · Instalación local de Moodle 4.5 LTS (nativo en Windows) · 2026-10-14

**Perfil:** D16 DevOps · **Riesgo:** R3 · **Autorización:** decisión #48 (`docs/contexto/decisiones.md`, 14-oct-2026).
**Insumos:** `.viltrum/research/D21-moodle-local-integracion-2026-10-14.md`, `.viltrum/vre-os/spec/integraciones/I02-moodle.md`.
**Revisión independiente pendiente:** D12 (seguridad). Este documento no aprueba su propio trabajo ni cierra ningún gate de I02.
**Sin secretos:** URL, token y contraseñas viven solo en `D:\ViltrumTEK\Quisqueya_Home\moodle-local\CREDENCIALES.local.txt` (ACL solo del usuario) y en `.env.local` del CRM (`MOODLE_URL`, `MOODLE_TOKEN`; ignorado por git, comprobado con `git check-ignore`).

## 1. Versiones y sumas verificadas

| Componente | Versión exacta | Fuente | SHA256 (verificado contra el publicado) |
|---|---|---|---|
| Moodle | **4.5.15 (Build 20261005)**, `version` 2024100715.00, rama `stable405` (última 4.5.x publicada) | https://download.moodle.org/download.php/direct/stable405/moodle-4.5.15.zip | `b039082a57034f1984ac3690fe8ded8856cafc6c6f87b4d0181f52d4929786a6` (coincide con `.zip.sha256` de download.moodle.org) |
| PHP | **8.3.35 NTS x64** (VS16) | https://downloads.php.net/~windows/releases/ (redirección oficial de windows.php.net) | `25a8e2ac9ff30f1d768d1447c09a600617fa6e6082729f6e95f008b59c91fe45` (coincide con `sha256sum.txt` de windows.php.net) |
| PostgreSQL | 15.8 (el servicio existente `postgresql-x64-15`, sin cambios) | ya instalado | — |

Solo se descargaron esos dos paquetes (más un zip semanal `moodle-latest-405.zip`, build 4.5.14+ del 2026-10-02, con SHA256 `d3732bb2…06f8ac` verificado, que se descartó y borró en favor del release exacto 4.5.15). No se descargó nada más (sin Caddy, Apache, plugins ni VC++; PHP arrancó sin necesitar redistribuible adicional).

## 2. Rutas, puertos y servicios

Base: `D:\ViltrumTEK\Quisqueya_Home\moodle-local\` (D: existía; no se usó la ruta C: de reserva).

| Qué | Dónde |
|---|---|
| Descargas | `…\_descargas\` (los dos zip) |
| PHP | `…\php83\` (`php.ini` desde `php.ini-development`) |
| Código Moodle (4.5, sin `public/`) | `…\moodle\` (`config.php` incluido; contiene la clave de BD, no se versiona) |
| Datos (fuera del webroot) | `…\moodledata\` |
| Scripts de operación | `…\iniciar-moodle.ps1`, `…\detener-moodle.ps1`, `…\scripts\01-configurar-ws.php`, `…\scripts\02-curso-sintetico.php` |
| Respaldos | `…\respaldos\moodle-2026-10-14.dump` |
| Logs del servidor web | `…\logs\web.out.log`, `web.err.log` |

- **Web:** servidor integrado de PHP (`php -S 127.0.0.1:9330 -t …\moodle`), solo loopback, puerto **9330**. `wwwroot = http://127.0.0.1:9330`. Un proceso, sin workers (es lo pedido; solo desarrollo/PoC).
- **Base de datos:** PostgreSQL 15 en `127.0.0.1:5432`; base **`moodle`** (UTF8, owner `moodle`, collation `Spanish_Spain.1252`), rol **`moodle`** (LOGIN, sin SUPERUSER/CREATEDB/CREATEROLE). No se tocaron `quisqueyahome_crm`, `dgii_demo` ni otras bases. Para crearlos se usó la conexión de `DATABASE_URL` del `.env` del CRM, leída por script sin imprimirla (ese rol es superusuario).
- **Cron:** tarea de Windows `QuisqueyaMoodleCron`, cada minuto, usuario `wilbe` (solo con sesión iniciada), ejecuta `php.exe -c php.ini admin\cli\cron.php --keep-alive=0`. Ejecución comprobada (Moodle registró ejecuciones de tareas programadas cada minuto en `mdl_task_log`). Nota: sin `--keep-alive=0` cada corrida se queda hasta ~3 min sondeando y Windows reporta `0x800710E0`/`0x41301` ("ya en ejecución") porque ignora instancias solapadas; se corrigió.
- **Idioma:** instalado en **inglés (`--lang=en`)**: el paquete `es` no viene en el zip y bajarlo era una tercera descarga no autorizada. Pendiente: instalar `es` desde Administración si se autoriza.

## 3. php.ini aplicado

Extensiones activadas: `pgsql, pdo_pgsql, intl, sodium, curl, mbstring, openssl, gd, zip, soap, fileinfo, exif` (todas con dll). `dom, xml, simplexml, ctype, iconv, json, tokenizer` ya vienen compiladas (`php -m`). `max_input_vars=5000`, `memory_limit=256M`, `date.timezone=America/Santo_Domingo`, `opcache` activado (`opcache.enable=1`, `enable_cli=0`, 128 MB). `extension_dir="ext"`.

## 4. Servicio web y rol técnico

Configurado con `scripts\01-configurar-ws.php` (idempotente): `enablewebservices=1`, protocolo **REST** habilitado.

**Servicio externo** `quisqueya_crm` (habilitado, solo usuarios autorizados, sin descargas ni subidas). **17/17 funciones** existen en 4.5.15 y están añadidas:
`core_webservice_get_site_info, core_user_create_users, core_user_get_users_by_field, core_user_update_users, core_course_get_courses, core_course_get_courses_by_field, core_course_create_courses, core_enrol_get_users_courses, core_enrol_get_enrolled_users, enrol_manual_enrol_users, enrol_manual_unenrol_users, core_completion_get_course_completion_status, core_completion_get_activities_completion_status, gradereport_user_get_grade_items, core_cohort_create_cohorts, core_cohort_add_cohort_members, core_cohort_get_cohorts`.

**Usuario técnico** `crm_integracion` (id 3, no administrador, auth manual) con el rol de sistema `crmintegracion` ("Integracion CRM Quisqueya"). Autorizado en el servicio con **restricción de IP 127.0.0.1** (tanto en la autorización del usuario como en el token; sin caducidad, a decidir por D12). Token permanente de 32 caracteres, guardado solo en `CREDENCIALES.local.txt` y `.env.local`.

**Capacidades del rol (todas CAP_ALLOW a nivel de sistema, 24):**
`webservice/rest:use`; usuarios: `moodle/user:create`, `moodle/user:update`, `moodle/user:viewdetails`, `moodle/user:viewhiddendetails`, `moodle/user:viewalldetails`, `moodle/site:viewuseridentity`, `moodle/course:useremail`, `moodle/site:accessallgroups`; cursos: `moodle/course:view`, `moodle/course:viewhiddencourses`, `moodle/course:viewparticipants`, `moodle/course:create`, `moodle/course:visibility`; matrícula: `enrol/manual:enrol`, `enrol/manual:unenrol`, `moodle/role:assign` (la matriz "puede asignar" del rol solo permite **Student**); finalización y notas: `report/completion:view`, `report/progress:view`, `gradereport/user:view`, `moodle/grade:viewall`; cohortes: `moodle/cohort:manage`, `moodle/cohort:assign`, `moodle/cohort:view`.
Hallazgo: `core_user_get_users_by_field` devuelve `[]` si el rol no tiene `moodle/user:viewalldetails` (username/idnumber) y `moodle/site:viewuseridentity`; no figuran en la capacidad declarada por la función. El expediente D21 no las listaba. Ya incluidas.
Recomendación a D12/D03: `moodle/course:create`, `moodle/course:visibility` y los permisos de cohortes no son necesarios si el CRM no crea cursos/cohortes (D21 §3: no usar `core_course_create_courses` en producción); `moodle/user:update` y `viewalldetails` son amplios para un rol de sistema. Quitarlos antes de datos reales. No se incluyó `moodle/webservice:createtoken` (el token lo genera un administrador).

## 5. Datos sintéticos

- Curso **"Inducción de brokers Quisqueya"** (`QH-IND-101`, id 2) con `enablecompletion=1` y 2 páginas ("Bienvenida y cultura Quisqueya Home", "Proceso comercial y uso del CRM"), cada una con finalización automática "ver la página"; criterios de finalización del curso: ambas actividades, agregación TODAS (2 criterios).
- Brokers sintéticos creados **por web service** (`core_user_create_users`): `broker.a@quisqueya.local` (id 4, `idnumber crm:broker:sintetico-a`) y `broker.b@quisqueya.local` (id 5, `crm:broker:sintetico-b`), matriculados como Student con enrol manual (`enrol_manual_enrol_users`, probado). Cohorte sintética `QH-BROKERS-SINT` con `broker.a`.
- Ningún dato real.

## 6. Pruebas (token omitido)

Todas contra `http://127.0.0.1:9330/webservice/rest/server.php` con el token leído del archivo en el propio comando.

| Prueba | Resultado |
|---|---|
| `core_webservice_get_site_info` | `sitename` = "Quisqueya Academy (local)"; `release` = "4.5.15 (Build: 20261005)"; `userid` = 3 (`crm_integracion`); 17 funciones disponibles: las 17 listadas arriba |
| `core_course_get_courses_by_field` shortname=QH-IND-101 | 1 curso, id 2, `visible=1`, `enrollmentmethods=["manual"]` |
| `core_enrol_get_enrolled_users` courseid=2 | **2 usuarios** (broker.a y broker.b, rol student) |
| `core_enrol_get_users_courses` userid=4 | curso 2, `enablecompletion=true`, `completionhascriteria=true`, `progress=0` |
| `core_course_get_courses` ids=[2] | OK |
| `core_user_get_users_by_field` field=idnumber (2 valores) | 2 usuarios con username, email e idnumber |
| `core_completion_get_course_completion_status` (curso 2, usuario 4) | `completed=false`, aggregation 1, 2 criterios de actividad ("Viewing the page"), sin `nocriteriaset` |
| `core_completion_get_activities_completion_status` | 2 actividades, `state=0`, `isoverallcomplete=false` |
| `gradereport_user_get_grade_items` | ítem de curso, nota `-` (sin calificaciones) |
| `core_cohort_create_cohorts` / `add_cohort_members` / `get_cohorts` | OK, `warnings:[]` |
| `core_user_update_users` (suspended=0) | `warnings:[]` |
| **Negativa: token inválido** | `{"exception":"core\\exception\\moodle_exception","errorcode":"invalidtoken","message":"Invalid token - token not found"}` |
| **Negativa: función no autorizada** (`core_user_delete_users`) | `errorcode: accessexception` ("Access control exception") |

No probado en esta pasada: `enrol_manual_unenrol_users` y `core_course_create_courses` (existen, están en el servicio; no se ejecutaron para no alterar los datos), progreso real de un alumno (nadie ha completado actividades), restricción de IP desde otra dirección (solo hay loopback), `auth_userkey`/SSO, router `r.php` (no aplica en 4.5).

## 7. Respaldo y restauración

`pg_dump` de PostgreSQL 15 (`C:\Program Files\PostgreSQL\15\bin`): `respaldos\moodle-2026-10-14.dump` (formato custom, 1,8 MB, 5 079 entradas). **Restauración ensayada** en una base temporal `moodle_restore_test` (creada y luego borrada): 2 usuarios matriculados, 1 curso, 5 usuarios; sin errores.

Respaldar (con conexión de un rol que pueda leer `moodle`, p. ej. el propietario):
```
php admin\cli\maintenance.php --enable
pg_dump -Fc -h 127.0.0.1 -p 5432 -U moodle -d moodle -f respaldos\moodle-AAAA-MM-DD.dump
robocopy moodledata respaldos\moodledata-AAAA-MM-DD /MIR      (y copiar moodle\config.php)
php admin\cli\maintenance.php --disable
```
Restaurar en una base nueva: `createdb -U <superusuario> -O moodle -E UTF8 -T template0 moodle_restore`, luego `pg_restore -d moodle_restore --no-owner --role=moodle respaldos\moodle-AAAA-MM-DD.dump`; copiar `moodledata`, apuntar `config.php` (`dbname`, `dataroot`) y ejecutar `php admin\cli\purge_caches.php`. **Pendiente:** ensayo de restauración completa de `moodledata` + `config.php` con login funcionando (solo se ensayó la base).

## 8. Arrancar y parar

- Arrancar: `powershell -ExecutionPolicy Bypass -File D:\ViltrumTEK\Quisqueya_Home\moodle-local\iniciar-moodle.ps1` (segundo plano, PID en `moodle-web.pid`).
- Parar: `…\detener-moodle.ps1`.
- No arranca solo con el sistema: tras reiniciar Windows hay que ejecutar `iniciar-moodle.ps1` (PostgreSQL sí es servicio de Windows). La tarea de cron sí persiste, pero requiere sesión iniciada.
- Estado al cerrar: servidor corriendo (PID 81688 escuchando en 127.0.0.1:9330).
- Admin de Moodle: usuario `admin` (clave en `CREDENCIALES.local.txt`).

## 9. Uso de recursos medido (`Get-Process`)

Proceso php del servidor web (reposo, tras las pruebas): **WorkingSet ≈ 79 MB, memoria privada ≈ 19 MB**. Proceso php de cron en ejecución: ≈ 54 MB de WorkingSet (~44 MB privados) durante el sondeo. PostgreSQL 15 ya estaba corriendo para el CRM (sin proceso nuevo). Total adicional de Moodle ≈ 80–150 MB (muy por debajo de la estimación de 0,7–1,2 GB del expediente D21, que incluía PG17 y Caddy). `moodledata` = 3 MB; RAM libre del equipo al inicio ≈ 4,5 GB de 23 GB.

## 10. Desviaciones y pendientes

1. **Servidor integrado de PHP**: un solo hilo; pedir páginas que llamen a Moodle por loopback (p. ej. algunas tareas) puede bloquear. Solo para PoC/desarrollo (PHP lo declara así). Producción requiere Apache/Caddy/IIS + php-cgi.
2. **Moodle 5.3 LTS exige PostgreSQL 17** (5.2 exige 16). Esta instalación (4.5.15 sobre PG15) tiene soporte de seguridad **solo hasta 2027-10-04**. Ruta de actualización futura: levantar un clúster PostgreSQL 17 dedicado (puerto 9332 según D21), restaurar el `pg_dump` + `moodledata`, y actualizar 4.5 → 5.3 (se permite desde 4.4+) con PHP 8.3/8.4 (8.3.35 es el mínimo de 5.3), moviendo el servidor web a la carpeta `public/` y configurando el router `r.php`. D3/D16 deben decidirlo antes de 2027-10.
3. PHP 8.3 recibe solo parches de seguridad hasta 2027-12-31; Moodle 4.5 cubre PHP 8.1–8.3.
4. Sin correo saliente configurado; no se fijó `noemailever`. Sin HTTPS (loopback, HTTP). Revisar con Administración > Informes > Estado del sistema.
5. Idioma `es` sin instalar (inglés).
6. Capacidades del rol técnico a reducir (ver §4) y fijar caducidad del token (D12).
7. `auth_userkey`/SSO, webhooks y certificados: no tocados (fuera de alcance; D21 §4–5).
8. Ensayo completo de restauración (`moodledata` + `config.php`) y reinicio del equipo (autoarranque del servidor web) pendientes.
9. Revisión independiente de otro proveedor pendiente (decisión #48): D12 sobre exposición (solo loopback), rol técnico y manejo de credenciales.
