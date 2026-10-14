# Expediente de evolución · Auditoría y doble aprobación (maker-checker)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026) · G4 Plataforma · D21 + D03 + D12 · 2026-10-14.
> Reglas: misma tecnología primero; copiar/portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído, commit fijado, cabecera de procedencia); AGPL/GPL solo como servicio aparte o referencia. Nada se incrusta.
> Diseño transversal: `G4-00-arquitectura-centralizacion.md`. La aprobación es el **mecanismo único** para descuentos, reversos, cancelaciones, cambios de precio, cambios de permisos críticos, parámetros de PLAFT y propuestas del asistente.

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 2 | `auditar(tx, actor, …)` en la misma transacción del cambio (`infrastructure/audit.ts`); 11 acciones (`catalogs.ts:AUDIT_ACTIONS`); 17 casos de uso auditan. Historial por entidad en contactos y negocio (`_ui/historial.tsx`). **Sin pantalla global de auditoría**: el recurso `audit_log` existe en permisos, pero `modulos.ts` no tiene módulo. |
| Datos reales y reglas de negocio | 2 | `audit_log` guarda `previous_value/new_value` como texto JSON, `ip_address` y `user_agent` **nunca se llenan** (comentario `ponytail` en `audit.ts`). No es inmutable: RLS activada (`0001_enable_rls_public_tables.sql:19`) pero ni `REVOKE UPDATE/DELETE` ni trigger; además la app corre con un rol que ignora RLS (I00 §7: sesión `postgres` superusuario/BYPASSRLS). |
| Diseño y componentes | 1 | Solo la lista cronológica `.activity-log`. |
| Experiencia de uso | 1 | No se puede buscar «quién cambió esto» sin conocer la ficha; no hay filtros, exportación ni comparación antes/después. |
| Calidad | 3 | `audit.test.ts`; auditoría dentro de transacción verificada por tipo. La doble aprobación **no existe**: M03 y M22 la describen en ficha (`M22:178`, M03 REQ-03-04, decisión #47 (1)) pero no hay código. |

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **La auditoría puede reescribirse**: nada en la BD impide `UPDATE`/`DELETE` sobre `audit_log` (grep de `audit_log` en `drizzle/*.sql`: solo CREATE, FKs, índices y RLS). Con el rol actual (superusuario) un error o un actor malicioso con acceso a BD borra el rastro. Depende del trabajo de roles SQL de D11/D16 (`crm_app` sin BYPASSRLS, I00 §7).
2. **No se captura IP ni agente** (`audit.ts`, decisión consciente por acoplamiento a `Request`): para PLAFT y disputas de comisión hace falta «desde dónde». Se resuelve pasando un `ContextoPeticion` desde el route handler, no leyendo `headers()` dentro del helper.
3. **Auditoría de lectura inexistente** (A19.3): ver KYC, estados de cuenta o exportar la cartera no deja rastro. Hoy `export` de comisiones tampoco audita (inventario D21: «El CSV no se genera en servidor ni deja registro» en reportes; en comisiones sí es servidor pero no hay acción `exportar` en `AUDIT_ACTIONS`).
4. **Vocabulario de acciones corto**: no hay `exportar`, `aprobar`, `rechazar`, `anular`, `leer`, `importar`, `login`/`logout`. `entity_type` es enum cerrado (`ENTITY_TYPES`); M22 ya necesita `payment`, `payment_plan`, `payment_void_request`.
5. **`previous_value/new_value` pueden contener PII** (contactos, teléfonos) y se conservan sin política de retención ni enmascarado; en PLAFT esos datos se conservan 10 años (A18.7, fuente secundaria), en el resto no hay plazo definido.
6. **No hay maker-checker reutilizable**: M22 modela su propia `payment_void_requests` (`M22:178`), M03 describe «propuesta separada del efecto» para el asistente, comisiones pasan `pending→approved→paid` por una sola persona (`domain/comision-estado.ts`, decisión #36), y los permisos los cambia un solo admin. Cuatro mecanismos distintos = cuatro maneras de equivocarse.
7. **Pérdida de prueba**: las propuestas del asistente caducan a los 7 días (#47 (1)); si no hay un lugar común no hay quien las barra ni quien avise.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| AUD-01 | Pantalla global de auditoría: filtros (usuario, entidad, acción, fecha, correlación), diferencia antes/después legible, exportación CSV en servidor con auditoría de la exportación | ESENCIAL | A19.1 | solo por ficha |
| AUD-02 | Inmutabilidad en BD: roles SQL separados, `REVOKE UPDATE, DELETE`, trigger que rechaza modificación, y **sello diario** (hash encadenado del día guardado en `audit_seal`, verificable) | ESENCIAL | A19.1, A18.7 | ausente |
| AUD-03 | Contexto de petición (IP, agente, `correlationId`) en cada registro | ESENCIAL | A19.1 | `ponytail` |
| AUD-04 | Auditoría de **lectura** de datos sensibles (KYC, estado de cuenta, precio real) con muestreo configurable y sin PII en el registro | IMPORTANTE | A19.3 | ausente |
| AUD-05 | Vocabulario ampliado (`exportar, importar, aprobar, rechazar, anular, leer, login`) y entidades nuevas, con candado de CI | ESENCIAL | A19 | 11 acciones |
| AUD-06 | Enmascarado de PII en `previous/new_value` por entidad (lista blanca de campos auditables) | IMPORTANTE | A18.9 | texto completo |
| AUD-07 | Retención por tipo (10 años PLAFT; 24 meses el resto; configurable) y bloqueo de borrado/purga | IMPORTANTE | A18.7 | sin política |
| APR-01 | `approval_requests` genérica + `approval_policies` por tipo de acción (quién puede pedir, quién puede aprobar, umbral, caducidad) | ESENCIAL | A19.2 | cuatro mecanismos |
| APR-02 | Regla de autor distinto (`CHECK resolved_by <> requested_by`), motivo obligatorio, un nivel, caducidad parametrizable (7 días, #47) | ESENCIAL | A19.2 | solo en ficha M22 |
| APR-03 | Ejecutor registrado por tipo: al aprobar se ejecuta el comando guardado en la misma transacción, **revalidando precondiciones**; si cambió la revisión de la entidad queda `obsoleta` | ESENCIAL | A19.2 | ausente |
| APR-04 | Bandeja «Por aprobar» y «Mis solicitudes» (admin / solicitante) con SLA y alerta de caducidad | ESENCIAL | A19.2 | ausente |
| APR-05 | Catálogo inicial de tipos: anular pago, reverso de comisión, descuento sobre lista, cambio de precio público, cancelación de reserva/contrato, permisos críticos, propuesta del asistente, parámetros PLAFT, reprogramar cuota | ESENCIAL | A19.2, A4.4 | ausente |
| APR-06 | Excepción firmada: si solo hay un admin, quién aprueba (suplente designado, nunca el solicitante) | IMPORTANTE | A19.2 | ausente |

## 4. Open source que aporta (verificado)
No existe una pieza OSS de maker-checker que encaje con un modelo de permisos propio y RLS: es **lógica de dominio nuestra** (≈ 300 líneas + tablas). Lo que sí se aprovecha:
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **jsondiffpatch** | `benjamine/jsondiffpatch` @ `a60db8a232`, npm 0.7.6 (modificado 2026-05-14) | MIT (npm) | TS | `diff()` + formatter HTML/anotado para la vista antes/después | **APP** (solo lectura de diferencias en servidor o cliente) | Se lee `previous_value/new_value` ya existentes; no cambia el modelo | S |
| microdiff | npm `microdiff` 1.6.0 (modificado 2026-08-02) | MIT (npm) | TS, sin dependencias | alternativa mínima de diff plano | APP (alternativa) | Más pequeña; sin formateador visual | S |
| pgaudit | `pgaudit/pgaudit` @ `1276f0b0d4` | Licencia PostgreSQL (LICENSE leído) | extensión C de PostgreSQL | auditoría de sentencias a nivel servidor | **REF** | Complemento de infraestructura (D16), no sustituye al registro de negocio; instalación en PG15 local de Windows **NO VERIFICADA** | M (D16) |
| supa_audit | `supabase/supa_audit` (archivado, último push 2024-01-03) | Apache-2.0 | SQL/plpgsql | trigger genérico `record_version/old_record_version` | **REF** (ideas) | Repositorio archivado; no se adopta | — |
| Standard Webhooks / `node:crypto` | — | — | — | `sha256` para sello diario y `payload_hash` de aprobaciones | APP (nativo) | Sin dependencia | S |

Qué adaptamos: el diff visual (jsondiffpatch) y el patrón de trigger de supa_audit como idea para el bloqueo de modificación. Qué no: ningún motor externo de aprobaciones (Camunda, Activiti, etc. son BPM pesados, **no evaluados** por exceso de alcance). Riesgo: el diff de jsondiffpatch puede mostrar campos sensibles; se alimenta solo del registro ya enmascarado (AUD-06).

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Línea de tiempo de cambios con diff por campo | `data-table.tsx` + `Sheet` + formateador jsondiffpatch | `/configuracion?tab=auditoria` y ficha de entidad (`Historial` ampliado) |
| Bandeja de aprobación (tarjeta con «Aprobar / Rechazar», motivo obligatorio, resumen del efecto) | `Card` + `Dialog` + `Badge` de caducidad | `/aprobaciones` (módulo nuevo con recurso `approvals`) y chip en el header |
| «Pendiente de aprobación» en el módulo de origen | `Badge` y deshabilitado el botón de efecto | Negocios, Cobros, Comisiones, Propiedades |
| Verificador de integridad | botón «Verificar sellos» con resultado en `Sheet` | pestaña Auditoría |

## 6. Comunicación con el resto (centralización)
Emite `SolicitudAprobacionCreada`, `SolicitudAprobada`, `SolicitudRechazada`, `SolicitudCaducada` (→ Notificaciones, ejecutor), `AuditoriaSelladaDia`. Consume `PermisosCambiados`, `PagoAnulado`, etc. **solo para notificar**; el registro de auditoría se escribe síncrono. Puertos: `Auditoria`, `EjecutorAprobacion` (cada módulo registra el suyo: `application/aprobaciones/ejecutores.ts`), `BusPort`. Datos compartidos: `approval_requests` (consumida por Negocios, Cobros, Comisiones, Propiedades, Asistente IA, Cumplimiento). Recomendación D03: M22 abandona `payment_void_requests` propia y usa la genérica **antes** de pasar a READY (su ficha aún no tiene código; evita migración doble).

## 7. Lotes asignables
Fichas nuevas: `G11-auditoria-avanzada` y `G12-aprobaciones` (D01/D03, revisión D12). Los lotes de esquema tocan `schema.ts`/`drizzle/` (coordinar con `EN-CURSO.md`).
| Lote | Entrega verificable | Archivos permitidos | Ficha | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| AUD-L1 | Ampliar `AUDIT_ACTIONS`/`ENTITY_TYPES` + etiquetas en `Historial`; candado: toda acción usada en un `registrar()` está en el catálogo | `src/domain/catalogs.ts`, `src/app/(crm)/_ui/historial.tsx`, `src/infrastructure/vocabulario.test.ts` | G11 | Haiku | D14 | — |
| AUD-L2 | `ContextoPeticion` (IP, agente, correlationId) pasado desde route handlers a `Auditoria.registrar`; prueba con doble | `src/application/compartido/auditoria.ts`, `src/infrastructure/audit.ts`, `src/infrastructure/http.ts` | G11 | Sonnet | D12 | — |
| AUD-L3 | Caso de uso `consultarAuditoria` (paginado, filtros, `requireScope(audit_log, view)`) + `GET /api/auditoria/export` en servidor con `generarCsv` y registro de la exportación | `src/application/auditoria/**`, `src/infrastructure/db/repos/auditoria.ts`, `src/app/api/auditoria/**` | G11 | Sonnet | D12 | AUD-L1 |
| AUD-L4 | Pestaña Auditoría con filtros, diff (jsondiffpatch) y seis estados | `src/app/(crm)/configuracion/_auditoria.tsx`, `configuracion/page.tsx` (rama) | G11 | Sonnet | D05+D07 | AUD-L3 |
| AUD-L5 | Migración: roles SQL, `REVOKE UPDATE, DELETE` en `audit_log`, trigger de rechazo, tabla `audit_seal` (RLS); prueba en BD real | `drizzle/0006_*`, `scripts/test-db/**` | G11 + D11 | Sonnet | D11+D12 | trabajo de roles SQL (I00 §7) |
| AUD-L6 | Job diario de sello (hash encadenado) y botón verificar | `src/application/auditoria/sellos.ts`, `src/infrastructure/integraciones/bus/tareas/sello-auditoria.ts` | G11 | Sonnet | D12 | AUD-L5 + BUS-L10 |
| AUD-L7 | Lista blanca de campos auditables por entidad (enmascarado de PII) | `src/domain/auditoria-campos.ts` (+test) | G11 | Haiku | D12 | AUD-L1 |
| APR-L1 | Dominio puro `aprobaciones.ts`: estados, transiciones, caducidad, autor distinto, política; tabla de verdad probada | `src/domain/aprobaciones.ts` (+test) | G12 | Haiku | D14 | — |
| APR-L2 | Migración `approval_requests`, `approval_policies` (RLS, CHECK autor distinto, UNIQUE de ejecución) | `schema.ts`, `drizzle/0006_*`, `scripts/test-db/**` | G12 + D11 | Sonnet | D11+D12 | APR-L1 |
| APR-L3 | Casos de uso `solicitar/aprobar/rechazar/cancelar/caducar` + registro de ejecutores + revalidación `obsoleta`; pruebas de concurrencia (dos aprobadores) | `src/application/aprobaciones/**`, `src/infrastructure/db/repos/aprobaciones.ts` | G12 | Sonnet | D12 | APR-L2 |
| APR-L4 | Rutas `api/aprobaciones/**` con `requireScope`, `reaches` y candado de CI | `src/app/api/aprobaciones/**` | G12 | Sonnet | D12 | APR-L3 |
| APR-L5 | Bandeja y chip del header; barrido de caducidad programado | `src/app/(crm)/aprobaciones/**`, `_ui/crm-header.tsx` (solo el chip) | G12 | Sonnet | D05+D07 | APR-L4 |
| APR-L6 | Primer ejecutor real: propuestas del asistente en Negocios (#47 (1)) | `src/application/pipeline/**` (solo ejecutor), `negocios/**` (solo badge) | M03 + G12 | Sonnet | D12 | APR-L5 |

## 8. No verificado
Que el rol de la aplicación pueda separarse en `crm_app`/migrador en el Postgres local sin romper `drizzle-kit migrate` (D11/D16); instalación de pgaudit en PG15 de Windows; el plazo de conservación de 10 años y las obligaciones de PLAFT proceden de fuentes secundarias del catálogo D21 (A18) y deben confirmarse con el abogado; no se evaluaron motores BPM (Camunda y similares) por desproporcionados.
