# Expediente de evolución · Academy (G3)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Autor: D21 + D03 + D05 (subagente Sonnet), solo documentos. **No aprueba su propio trabajo**; revisión independiente pendiente (D03/D12/D14 y otro proveedor, decisión #48).
> Reglas: misma tecnología primero; copiar/portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído); **Moodle y sus plugins son GPL: servicio aparte (RUN) por REST, nunca se copia ni se incrusta su código**. Nada se incrusta en nuestra interfaz.
> Regla firmada (Q-C1-03, PLAN-INTEGRAL §4): el progreso de Moodle es **evidencia**; **la certificación la aprueba un Admin en el CRM**. No se instala `mod_customcert` en el primer corte.
> Fuentes: `spec/modulos/M13-academy.md` (DRAFT), `spec/integraciones/I02-moodle.md` (DRAFT), `specs/002-m13-certificacion-local/{spec,CORE-0}.md`, `D21-moodle-local-integracion-2026-10-14.md`, `.viltrum/crm-ux/D21-academy-opensource.md`, código citado y la instancia local (lectura de archivos y un `GET /` al puerto 9330; no se leyó ninguna credencial). Hermanos: `G3-brokers.md`, `G3-metas.md`, `G3-inicio.md`, `G3-reportes.md`.

## 0. Hechos de la instancia Moodle local (verificados el 14-oct)
- Responde HTTP 200 en `http://127.0.0.1:9330/` (sitio «qacademy»); `D:\ViltrumTEK\Quisqueya_Home\moodle-local\moodle\version.php`: **`4.5.15 (Build: 20261005)`**, rama `405`. El commit más reciente de `MOODLE_405_STABLE` es `215f44380bdc` («Moodle release 4.5.15», 2026-10-03, API de GitHub).
- Los 12 web services que necesita el adaptador **existen en los `db/services.php` de esa instalación**: `core_user_create_users`, `core_user_get_users_by_field`, `core_user_update_users`, `core_course_get_courses_by_field`, `enrol_manual_enrol_users`, `enrol_manual_unenrol_users`, `core_enrol_get_enrolled_users`, `core_completion_get_course_completion_status`, `core_completion_get_activities_completion_status`, `gradereport_user_get_grade_items`, `core_badges_get_user_badges`, `core_webservice_get_site_info`. (Que existan en el código no prueba que el servicio esté habilitado ni que la llamada funcione: eso es la PoC viva.)
- Actividades nativas presentes: `scorm`, `h5pactivity`, `quiz`, `lesson`, `lti`, `forum`, `workshop`; carpeta `badges/` presente. **No hay** `mod_customcert`, `auth_userkey` ni `local_webhooks` (directorios `local/` y `auth/` sin ellos).
- Divergencia a resolver: el expediente D21 del 14-oct recomendaba 5.3 LTS con PostgreSQL 17; PLAN-INTEGRAL §4 y la decisión de Wilber fijaron **4.5 LTS sobre PG 15**. Soporte de seguridad de 4.5: hasta 2027-10-04 (D21 §1.1); subir a 5.3 exige clúster PG 17 y es tarea D16 aparte.

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 2 | Catálogo propio con filtros, búsqueda, progreso y checklists (`academy/vista.tsx`, `application/academy/**`); `GET /api/academy`, `PUT /api/academy/[id]/progreso`, `PUT /api/academy/checklist/[id]`. Sin programas, matrícula, evidencia, revisión ni constancia. `AprendizajePort` no existe (grep: `Moodle` solo aparece en `configuracion/_integraciones.tsx`) |
| Datos reales y reglas de negocio | 1 | Progreso **autodeclarado** por el broker (`PUT …/progreso` con solo `academy:view`, `progreso/route.ts:23`); cuatro tablas (`schema.ts:959-1040`); el modelo de decisión de M13 §3 y §6 no está en `schema.ts` |
| Diseño y componentes | 3 | Tarjetas, filtros y anillo de progreso coherentes con el CRM; clases utilitarias sueltas; panel «Requisitos de cumplimiento» estático (`vista.tsx`) |
| Experiencia de uso | 2 | Un solo recorrido (leer → marcar). Sin «Continuar» a un curso real, sin solicitud de revisión ni constancia, sin vista de administración |
| Calidad | 2 | `application/academy/casos-de-uso.test.ts`, `api/academy/route.test.ts`; sin `error.tsx`/`loading.tsx` de módulo; sin auditoría en el adaptador (D21 academy §3) |

**Objetivo: 4** — cursos reales en Moodle, matrícula y evidencia sincronizadas, revisión y aprobación Admin en el CRM, constancia verificable, vigencia y requisito por proyecto.

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **La corrección CORE-0 (retirar la autocertificación) está en el árbol pero sin commit.** `git status` marca modificados `academy/vista.tsx`, `application/academy/{casos-de-uso.test,en-memoria,puertos}.ts` y `repos/academy.ts`; las pruebas ya exigen que `isCertified` no exista (`casos-de-uso.test.ts:26,57,97,106`). Hasta el commit y la revisión de otro proveedor, el riesgo de «Broker Certificado» falso sigue en `develop`.
2. **El banner «Los cambios locales se sincronizarán al recuperar la red» es falso** (`academy/vista.tsx:249`): no hay cola de escritura sin conexión.
3. **El porcentaje puede salir mal.** `obtenerResumenProgreso` (`repos/academy.ts:262-290`) cuenta como denominador los contenidos **activos** pero como numerador todas las filas de progreso completadas del usuario, sin unirlas a contenidos activos: desactivar un contenido ya completado puede dar más de 100 % o distorsionar el avance.
4. **Panel «Requisitos de cumplimiento» estático** (`vista.tsx:503-518`): «Ley 158-01 (Confotur) — Obligatorio / Protocolo de Reservas — Operativo / Prevención Lavado Activos — Legal RD» son textos fijos que aparentan estado de cumplimiento sin dato detrás.
5. **Escritura de progreso con permiso de lectura** (`academy:view`, `app/api/academy/[id]/progreso/route.ts:23` y `checklist/[id]/route.ts:22`): válido mientras el progreso sea «autodeclarado», pero no puede alimentar nunca una decisión de aprobación (M13 S2).
6. **No hay configuración de Moodle fuera del repositorio**: `src/infrastructure/env.ts` no declara `MOODLE_URL` ni `MOODLE_TOKEN` (el subagente D16 solo los escribe en `.env.local`); el adaptador debe leer únicamente de `env.ts` y el token jamás llegar al navegador (CORS abierto de Moodle: `Access-Control-Allow-Origin: *`, D21 Moodle §3.2).
7. **M13 e I02 siguen DRAFT**: ningún lote de código con Moodle puede despacharse sin ficha READY (AGENTS.md). Q-C1-05 (datos personales reales hacia el LMS) sigue abierta: solo datos sintéticos.
8. **Criterios de finalización**: `core_completion_get_course_completion_status` responde `nocriteriaset` si el curso no los tiene y no hay web service para fijarlos; el curso `QHA-DEMO-01` debe versionarse como `.mbz` (D21 Moodle §3 y §8 riesgo 6).
9. **Pestaña Moodle de Configuración es maqueta** (`_integraciones.tsx`): tarjeta fija; no muestra versión, salud ni última sincronización reales.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| ACA-01 | `AprendizajePort` + doble en memoria + suite de contrato (alta/baja de usuario, matrícula, evidencia, cursos, salud) | ESENCIAL | A16 | No existe |
| ACA-02 | **Programas** del CRM (ID estable + versión) mapeados a cursos de Moodle por `idnumber` en `external_refs` | ESENCIAL | A16.1 | No existe |
| ACA-03 | **Asignación y matrícula** por broker, por nivel o por proyecto; baja con suspensión en Moodle; eventos `BrokerAcademyAsignado` / `BrokerAccesoRevocado` | ESENCIAL | A16.2 | No existe |
| ACA-04 | **Evidencia** (finalización por actividad, nota, intentos) leída por sondeo, con `synced_at` y estado `UNKNOWN` si Moodle falla | ESENCIAL | A16.1 | No existe |
| ACA-05 | **Solicitud de revisión** del broker y **cola de revisión** del Admin con aprobar / rechazar / revocar, motivo, versión y autoprohibición | ESENCIAL | A16.1, A19.2 | No existe |
| ACA-06 | **Constancia CRM** verificable (ID opaco, estado vigente/revocado) en PDF con QR; la consulta siempre contra el CRM | ESENCIAL | A16.1 | No existe |
| ACA-07 | **Conocimiento por proyecto como requisito** para ver o vender inventario del proyecto | IMPORTANTE | A16.3, A10.5 | No existe |
| ACA-08 | **Lanzamiento a Moodle** desde el CRM: primero enlace al curso (el broker entra con su usuario); luego SSO de un solo uso (`auth_userkey`) si pasa la PoC en 4.5 | IMPORTANTE | A16.2 | No existe |
| ACA-09 | **Vigencia y renovación** (p. ej. capacitación PLAFT anual) con recordatorios y bloqueo opcional | IMPORTANTE | A16.4 | No existe |
| ACA-10 | **Panel de cobertura** del administrador: quién falta, atascados, tiempo de revisión, tasa de aprobación, por curso y versión | IMPORTANTE | A13.4 | No existe |
| ACA-11 | **Insignias** nativas de Moodle reflejadas en el perfil del broker (lectura de `core_badges_get_user_badges`); no sustituyen la constancia | DESEABLE | A10.4 | No existe |
| ACA-12 | Checklists operativos propios conservados para el **onboarding** del broker (no se rehace en Moodle) | IMPORTANTE | A10.5 | Existe |
| ACA-13 | Corregir banner falso, porcentaje y panel estático; progreso histórico etiquetado `legacy_local` | ESENCIAL | — | Defectos |
| ACA-14 | Lo educativo pesado (SCORM, H5P, cuestionarios, foros) **no se reconstruye**: vive en Moodle | — | — | Nativo en Moodle |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje con nuestro stack | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **Moodle LMS 4.5 LTS** | `moodle/moodle`, rama `MOODLE_405_STABLE`, commit `215f44380bdc` («4.5.15», 2026-10-03); instalado `4.5.15 (Build 20261005)` | GPLv3 (D21 Moodle §7) | PHP + PostgreSQL | Web services REST (`/webservice/rest/server.php`, 12 funciones verificadas en disco); actividades `mod_scorm`, `mod_h5pactivity`, `mod_quiz`, `mod_lesson`; insignias nativas | RUN | Por protocolo REST, sin copiar código. Seguridad hasta 2027-10-04 | M (adaptador) |
| **Cliente REST propio sobre `fetch`** | — (código propio, ~150 líneas) | Propia | TS | `POST application/x-www-form-urlencoded` con `wstoken`, `wsfunction`, `moodlewsrestformat=json`; aplanado de arreglos `users[0][username]`; trata `{exception,errorcode}` y los `warnings` con HTTP 200 como error | PORT de la idea | Total; token solo en servidor | S |
| `moodle-webservice` (npm 1.8.1) | `IHAVENOARMS/moodle-webservice`, publicado 2023-06 (2 estrellas) | MIT | TS, depende de `request` (obsoleta) y `node-fetch` 2 | Tabla de nombres de funciones y función de aplanado | **REF, no dependencia** | Sin mantenimiento desde 2023 y con dependencias obsoletas | — |
| `node-moodle` (npm 1.0.0) | sin repo declarado | MIT | JS | Igual | **RECHAZADO** | Sin tipos ni repositorio | — |
| **auth_userkey** (Catalyst) | plugin Moodle; `$plugin->supported=[405,500]` (D21 Moodle §4.1) | GPL v3+ en cabecera; el repositorio GitHub no declara licencia | PHP | `auth_userkey_request_login_url` → URL de login con clave que caduca | RUN (plugin en Moodle) | **Compatible con 4.5**; reuso/caducidad no documentados: PoC de 1 h antes de adoptar | S |
| **local_webhooks** | directorio de plugins, soporte 3.2–5.3, última 2026-10-02 | GPLv3 (README) | PHP | Aviso de eventos Moodle → CRM | RUN opcional | No reintenta ni filtra; solo acelerador que dispara una reconciliación | S |
| **mod_customcert** | plugin Moodle | GPL-3.0 | PHP | PDF dinámico y verificación de código | **No en el primer corte** | Duplicaría la verificación y produciría «certificado por progreso» prohibido por CA-01 | — |
| **block_xp («Level up!»)** | `FMCorz/moodle-block_xp` (161 estrellas, push 2026-10-03) | **Sin licencia en el repositorio y no declarada en la ficha del directorio** | PHP | Puntos y tabla de posiciones dentro de Moodle | **NO USAR** hasta leer su licencia | La versión gratuita da tabla individual; equipos/exportación son de pago (XP+) | — |
| **scorm-again** | `jcputney/scorm-again`, npm `3.4.6` (2026-10-08; 354 estrellas) | MIT (LICENSE leído, © 2020 Jonathan Putney) | JS, Node ≥20.19 | Runtime SCORM 1.2/2004 para reproducir paquetes | **No necesario** | Moodle ya reproduce SCORM; solo si Wilber exigiera SCORM dentro del CRM, lo que contradice «nada se incrusta» | — |
| **@xapi/xapi** | npm `3.0.3` (2026-04-27) | MIT | TS | Cliente xAPI para un futuro LRS (`logstore_xapi`) | REF diferido | Sin necesidad hoy | — |
| **@react-pdf/renderer** | npm `4.9.0` (gitHead `2c0b6d4a5d9d`) | MIT | React 19 | Constancia PDF y plantilla de verificación | APP | Total (ya prevista para cotizaciones) | M |
| **qrcode** | npm `1.5.4` (gitHead `3848ed2c17de`, 2024-08-05) | MIT | Node | QR con la URL de verificación en la constancia | APP | Total | S |
| **Frappe Learning** | `frappe/lms` | AGPLv3 | Python/Vue | Alternativa a Moodle con certificados | REF | Segunda PoC solo si Moodle falla | — |
| **Trophy UI kit** | `trophyso/ui` (MIT en la página del repositorio) | MIT | shadcn + Tailwind v4 | Lista de logros / insignias en el perfil | PORT (patrón visual) | Estilo propio; solo lectura de insignias | S |

Qué adaptamos: un cliente REST propio (decisión justificada: los dos clientes npm están abandonados), PDF y QR de la constancia, y patrones visuales de logros. Qué no: `mod_customcert`, `block_xp`, SCORM dentro del CRM.

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Separar «progreso educativo» de «revisión administrativa» | Tarjeta de curso con dos indicadores y estado (`En curso`, `Pendiente`, `Rechazado`, `Aprobado`, `Revocado`) | `/academy` › Mis cursos |
| Cola de revisión | `DataTable` + `Sheet` con evidencia, procedencia y `synced_at`; botones Aprobar/Rechazar/Revocar con `Dialog` y motivo | `/academy/revisiones` (solo Admin) |
| Constancia | Tarjeta con ID opaco, curso/versión, estado y botón PDF; página de verificación (autenticada, M13 S3) | `/academy` › Mis constancias |
| Cobertura | `ChartCard` + Recharts (barras apiladas por estado de revisión) | Panel del administrador |
| Estados de Moodle | `EstadoIntegracion` con «Moodle no disponible: se muestra la última evidencia» | Cabecera del módulo |
| Seis estados y móvil | Los seis estados de M13 §4; pestañas desplazables 320/390 y hoja inferior | Todo |
| Honestidad | Eliminar el panel estático y el banner falso; el vacío no insinúa 100 % | Todo |

## 6. Comunicación con el resto (centralización)
**Emite** (M13/I02; ampliar `TIPOS_EVENTO_CRM` y CHECK; el worker reclama solo tipos con consumidor): `BrokerAcademyAsignado{id}`, `BrokerAccesoRevocado{id}`, `RevisionAcademySolicitada{id}`, `ConstanciaAprobada{id}`, `ConstanciaRevocada{id}`.
| Consumidor | Qué hace |
|---|---|
| `AprendizajePort` (adaptador Moodle) | `enrol_manual_enrol_users` / baja + `core_user_update_users suspended=1` |
| Brokers | Estado de formación y de onboarding; habilita o suspende inventario del proyecto |
| Propiedades (G2) | Visibilidad de unidades de un proyecto según constancia (ACA-07) |
| Inicio | «Mi formación», revisiones pendientes (admin), renovaciones próximas |
| Reportes | Cobertura y aprobación por curso |
| Comunicaciones | Aviso de asignación, resultado y vencimiento |

**Consume:** `BrokerAlta`, `BrokerDesactivado` (Brokers) → alta/baja en Moodle; `ProyectoAsignadoABroker` (si G2 lo crea) → curso del proyecto; evidencia de Moodle (por sondeo, no por webhook).
**Puertos:** `AprendizajePort` (nuevo), `RepositorioAcademy` (existente), `AlmacenamientoArchivos` (constancia), `GeneradorEstadoDeCuentaPdf` no; un `GeneradorConstanciaPdf` propio. **Datos nuevos (M13 §6, `.enableRLS()`, sin DELETE):** `academy_programs`, `academy_assignments`, `academy_evidence`, `academy_review_requests`, `academy_decisions` (inmutable), `academy_certificates`, `external_refs`. **Config:** `MOODLE_URL` y `MOODLE_TOKEN` solo en `src/infrastructure/env.ts`.

## 7. Lotes asignables
| Lote | Entrega verificable | Archivos permitidos | Ficha que lo habilita | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| ACA-0 | Commit de CORE-0; arreglar banner falso, porcentaje (join con contenidos activos) y panel estático; centinelas en prueba | `src/app/(crm)/academy/vista.tsx`, `src/infrastructure/db/repos/academy.ts`, `src/application/academy/casos-de-uso.test.ts`, `src/app/api/academy/route.test.ts` | **M13-CORE-0 (VERIFIED)** + hallazgos | Haiku | D14 + otro proveedor | Commit del árbol actual |
| ACA-1 | Variables `MOODLE_*` en `env.ts`, validación Zod, ausencia en el cliente; prueba de que el token no llega a respuestas | `src/infrastructure/env.ts`, `.env.example` (solo nombres), `src/infrastructure/credenciales-prueba.test.ts` | I02 → READY (D03/D12) | Haiku | D12 | — |
| ACA-2 | `AprendizajePort` + doble + suite de contrato (idempotencia, `UNKNOWN`, baja efectiva) | `src/application/academy/aprendizaje.ts`, `en-memoria-aprendizaje.ts`, `aprendizaje.test.ts` | I02-A (READY) | Sonnet | D12 + D14 | ACA-1 |
| ACA-3 | Adaptador Moodle HTTP: POST form, aplanado, errores con `warnings`, timeouts y reintento acotado; prueba con servidor falso | `src/infrastructure/integraciones/moodle/{cliente,adaptador}.ts`, `…test.ts`, `src/infrastructure/contenedor/academy.ts` | I02-B (READY) | Sonnet | D12 | ACA-2 |
| ACA-4 | **PoC viva** contra `127.0.0.1:9330` con curso `QHA-DEMO-01` (.mbz versionado) y dos brokers sintéticos: `get_site_info`, alta, matrícula, evidencia, baja, `auth_userkey` | `.viltrum/vre-os/evidencia/E2/academy/**` (informe y capturas); sin código | I02 + D16 | Sonnet (D16 + D14) | otro proveedor | ACA-3 |
| ACA-5 | Esquema, migración y RLS del modelo de decisión (M13 §6) con rollback ensayado y migración de datos `legacy_local` | `src/infrastructure/db/schema.ts`, `src/domain/catalogs.ts`, `drizzle/00NN_academy_certificacion.sql`, `drizzle/meta/*`, `db/seed.sql`, `scripts/seed/catalog.ts`, `src/infrastructure/db/seed-invariantes.test.ts` | M13 → READY (D11/D12) | Sonnet | D11 + D12 | ACA-0 |
| ACA-6 | Casos de uso de decisión (aprobar, rechazar, revocar) con S1 (autoprohibición), S2 (predicado) y concurrencia | `src/application/academy/{decisiones,puertos}.ts`, `decisiones.test.ts`, `en-memoria.ts` | M13 READY | Sonnet | D12 + D14 | ACA-5 |
| ACA-7 | Repositorio Drizzle + pruebas `test:db` de concurrencia (dos administradores) | `src/infrastructure/db/repos/academy-decisiones.ts`, `scripts/test-db/academy.ts`, `scripts/test-db/run.mjs` | M13 READY | Sonnet | D11 | ACA-6 |
| ACA-8 | Sincronización: consumidor de `BrokerAcademyAsignado`/`Revocado` y worker de sondeo de evidencia con `synced_at` | `src/application/academy/sincronizacion.ts`, `…test.ts`, `src/infrastructure/integraciones/moodle/sondeo.ts` | I02-C (READY) + I00 | Sonnet | D12 + D14 | ACA-3, ACA-7, lote del worker |
| ACA-9 | Rutas API (Zod, `requireFullScope`, 404 uniforme, candados `seguridad-rutas-id` y `precios-respuestas`) | `src/app/api/academy/{cursos,expedientes,solicitudes,revisiones,constancias}/**`, `src/application/academy/entrada.ts`, `src/infrastructure/seguridad-rutas-id.test.ts` | M13 READY | Sonnet | D12 | ACA-6 |
| ACA-10 | UI del broker (Mis cursos / Catálogo / Mis constancias) y solicitud de revisión | `src/app/(crm)/academy/{page,vista,mis-cursos,constancias}.tsx`, `error.tsx`, `loading.tsx` | M13 READY | Haiku | D07 + D14 | ACA-9 |
| ACA-11 | UI del Admin `/academy/revisiones` (cola, detalle, decisión) | `src/app/(crm)/academy/revisiones/{page,vista}.tsx` | M13 READY | Haiku | D07 + D14 | ACA-9 |
| ACA-12 | Constancia PDF + QR + verificación autenticada | `src/infrastructure/pdf/constancia.tsx`, `src/app/api/academy/constancias/[id]/pdf/route.ts`, `package.json` (qrcode) | M13 READY | Haiku | D12 | ACA-9 |
| ACA-13 | Requisito por proyecto (consumidor de `ConstanciaAprobada/Revocada`) y bloqueo de inventario | `src/application/academy/requisitos.ts`, `…test.ts` + gancho en la ficha de Propiedades (G2) | M13 + ficha Propiedades (G2) | Sonnet | D12 | ACA-6 |
| ACA-14 | Vigencia y renovación con recordatorios | `src/application/academy/vigencia.ts`, `…test.ts` | **M13b (nueva)** | Sonnet | D14 | ACA-6 |
| ACA-15 | Panel de cobertura (Admin) y pestaña «Formación» en Reportes | `src/application/academy/cobertura.ts`, `…test.ts`, `src/app/(crm)/academy/cobertura.tsx` | M13 + M12 | Haiku | D14 | ACA-8 |
| ACA-16 | Reflejo de insignias nativas y SSO `auth_userkey` si la PoC lo aprobó | `src/infrastructure/integraciones/moodle/{insignias,sso}.ts`, `…test.ts` | I02-D + resultado de ACA-4 | Sonnet | D12 | ACA-4, ACA-8 |

Cada lote ≤ 45 min en worktree aislado, con `gitnexus_impact` sobre los símbolos tocados y `gitnexus_detect_changes` antes del commit del orquestador. **Ninguna decisión de aprobación se calcula desde el progreso de Moodle** (CA-01).

## 8. No verificado
- Que los 12 web services estén habilitados y funcionen en la instancia (solo se verificó que existen en su código); la política de la contraseña del administrador y la creación del rol técnico `svc_crm_academy` las hace D16 y no se leyeron.
- Licencia de `auth_userkey` (cabecera GPL v3+, repositorio sin licencia declarada) y de `block_xp` (no declarada): D12 debe leerla antes de instalar.
- Reuso/caducidad exacta de la clave de `auth_userkey`; comportamiento al repetir una matrícula idéntica; velocidad con la concurrencia de `php-cgi` en Windows.
- Formato Open Badges de Moodle 4.5: la página de documentación solo lo declara como 2.0 sin más detalle.
- Qué conserva Moodle al exportar (portabilidad semántica) y la retención de datos personales (Q-C1-05 pendiente).
- No se confirmó si el árbol contiene ya el commit de CORE-0 (`git status` lo marca sin commit el 14-oct).
