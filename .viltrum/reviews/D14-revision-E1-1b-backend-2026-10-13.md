# D14 · Revisión independiente del backend de Negocios (b1 + b2)

Revisor: **Antigravity (D14 QA / D12 Seguridad)**. Proveedor independiente (regla P4).
Productor: **Codex (D10 / D11)**.
Fecha: **2026-10-13** (America/Santo_Domingo).
Ficha: `.viltrum/vre-os/spec/modulos/M03-negocios.md` (READY; CA-04, 05, 06, 07, 08, 09, 11, 12, 20, 21, 28, 29; Decisión #47).

## Resumen ejecutivo (5 líneas)
Se ejecutó la revisión técnica y de seguridad independiente del backend de Negocios (b1 consultas de lectura + b2 cierre y persistencia).
Los cinco comandos de verificación (`typecheck`, `lint`, `test`, `test:db`, `spec:check`) fueron reproducidos de forma autónoma con salida exit 0 y conteos idénticos a los del productor.
Las mutaciones obligatorias (`test:db:mutation:venta-unica` y `negocios-join`) fallaron de manera exacta y controlada (exit 1), dejando la base y el árbol de desarrollo íntegros.
Se comprobó la estricta contención de campos financieros restringidos (CA-11), la venta única durable con normalización de código, el manejo de datos históricos (S-303-H), la atomicidad con outbox y la ausencia de DELETE físico.
El entregable cumple cabalmente la especificación M03 y las decisiones de arquitectura sin hallazgos bloqueantes P0 ni P1.

## Tabla de hallazgos

| ID | Severidad | Evidencia (archivo:línea) | Descripción / Corrección pedida | Dueño |
|---|---|---|---|---|
| H-E1-01 | P3 | `src/infrastructure/audit.ts:74-75` | Nota preventiva heredada: `audit_log` serializa snapshots antes/después completos en JSON. Notas o comentarios de pérdida con PII quedan en la bitácora de auditoría. Saneamiento general de auditoría o política de redacción corresponde a hardening transversal. | D12 |
| H-E1-02 | P3 | `scripts/test-db/run.mjs:22` | El script `test:db:mutation:negocios-join` se ejecuta pasando argumento `--mutation=negocios-join`, pero no tiene alias explícito individual en `package.json` como sí lo tiene `test:db:mutation:venta-unica`. Se recomienda agregar `"test:db:mutation:negocios-join": "node scripts/test-db/run.mjs --mutation=negocios-join"` a `package.json` para ergonomía de CI. | D10/D16 |

*Nota:* No existen hallazgos P0 ni P1 abiertos en el alcance de b1 + b2. La observación residual de b1 sobre la ruta PATCH `/api/pipeline/[id]` devolviendo el objeto sin filtrar fue corregida satisfactoriamente en b2 mediante `dtoMutacionNegocio` y validaciones estrictas de campo.

---

## Verificación de los 9 puntos

### 1. Reproducción de comandos obligatorios
- `npm run typecheck`: **Exit 0**. `tsc --noEmit` completó sin errores de tipado.
- `npm run lint`: **Exit 0**. `eslint .` completó sin advertencias ni fallos.
- `npm test`: **Exit 0**. 542 pruebas ejecutadas, 542 aprobadas, 0 fallidas (duración 3521 ms). Cifra idéntica a la documentada por Codex.
- `npm run test:db`: **Exit 0**. 143 pruebas de base de datos ejecutadas, 143 aprobadas, 0 fallidas (duración 7626 ms). Ensayo poblado validado con copia de 184 negocios, 0 ventas con unidad concreta en el legado histórico, aviso S-303-H verificado, consulta de los 15 IDs legados validada, base temporal eliminada, `DEV COUNTS PASS` y `DEV HASHES PASS` en todas las tablas y columnas públicas de desarrollo antes y después. Cifra idéntica a la documentada por Codex.
- `npm run spec:check`: **Exit 0**. 6 fichas inspeccionadas, 0 bloqueos detectados.
- **Resultado:** **CONFIRMADO**.

### 2. Mutación (CA-29)
- `npm run test:db:mutation:venta-unica`: **Exit 1 esperado**. 143 pruebas ejecutadas, 142 pass, 1 fail específico. Falló exactamente `# Subtest: DB cierre UNIQUE unitId durable rechaza INSERT directo aunque el negocio se archive (CA-29)` con error `Missing expected rejection (ERR_ASSERTION)`. Destino temporal eliminado, desarrollo intacto (`DEV COUNTS PASS` y `DEV HASHES PASS`).
- `node scripts/test-db/run.mjs --mutation=negocios-join`: **Exit 1 esperado**. 143 pruebas ejecutadas, 142 pass, 1 fail específico. Falló exactamente `# Subtest: DB negocios 184 negocios (176 seed + 8 sintéticos rollback): N:M, USD/DOP y bordes inclusivos`, observando la inflación esperada de conteos (4 → 8 en DOP y 5 → 9 en USD) e importes debido a la multiplicación N:M de deals con intereses múltiples por cambio de `EXISTS` a `JOIN`. Destino temporal eliminado, desarrollo intacto (`DEV COUNTS PASS` y `DEV HASHES PASS`).
- `npm run test:db:guards`: **Exit 0**. 4 pruebas de guardas de mutación ejecutadas y aprobadas (verificación de sitio único y conservación de visibleRows).
- Estado del árbol: `git status` limpio respecto a los comandos de prueba; ninguna alteración de archivos por parte de la revisión.
- **Resultado:** **CONFIRMADO**.

### 3. Fuga de campos restringidos (CA-11)
- **SELECT en base de datos:** En `src/infrastructure/db/repos/pipeline-lectura.ts:32-48`, la proyección SQL de deals no selecciona `realPriceCents`. `amountCents` solo se incluye si `camposNegocios(actor).monto` es verdadero (admin o broker); para asistente queda omitido del SELECT. `commissionBasisPoints` y `totalCommissionCents` solo se incluyen si `camposNegocios(actor).comision` es verdadero (`admin && scopeFor(actor, "commissions", "view") !== "none"`); para broker y asistente se omiten completamente. En la consulta de `intereses` (`pipeline-lectura.ts:77-79`), `realPriceCents` solo se proyecta condicionalmente para admin con permiso `unit_real_price:view`. En `proyectosDisponibles` (`:97`), únicamente se consultan `id`, `name`, `unitId` y `unitCode`.
- **DTOs de mutación:** En `src/application/pipeline/dto.ts:6-22`, `dtoMutacionNegocio` aplica la whitelist de `camposNegocios(actor)` sin usar spread de la entidad. `realPriceCents` no figura en el DTO; `commissionBasisPoints` solo se transfiere a administradores con alcance sobre comisiones; el asistente no recibe ni monto ni comisión. `dtoMutacionPropiedad` devuelve únicamente `{ id, projectId, unitId, isPrimary }`, sin campos financieros.
- **Respuestas de API (`src/app/api/pipeline/**`):**
  - `PATCH /api/pipeline/[id]`: responde `{ ok: true, negocio: dtoMutacionNegocio(actor, negocio) }` (`route.ts:51`). Además, `casos-de-uso.ts:241-242` rechaza en servidor con 403 `ForbiddenError("Campo restringido.")` si un broker o asistente envía `commissionBasisPoints`, o si un asistente envía `amountCents`.
  - `PATCH /api/pipeline/[id]/etapa`: responde `{ ok: true, deal: dtoMutacionNegocio(actor, deal) }` (`etapa/route.ts:40`).
  - `POST /api/pipeline/[id]/propiedades`: responde `{ ok: true, propiedad: dtoMutacionPropiedad(actor, propiedad) }` (`propiedades/route.ts:45`).
  - `PATCH /api/pipeline/[id]/propiedades/[propId]`: responde `{ ok: true, propiedad: dtoMutacionPropiedad(actor, propiedad) }` (`[propId]/route.ts:33`).
  - `DELETE /api/pipeline/[id]/propiedades/[propId]`: responde `{ ok: true }` (`[propId]/route.ts:51`).
- **Manejo de errores:** `errorResponse` (`src/infrastructure/http.ts:53-74`) no expone filas de base de datos ni datos internos.
- **Auditoría y Outbox:** `auditLog` no se consulta en los DTOs de lectura de Negocios ni en respuestas HTTP. El outbox emite únicamente `{ id: dealId, stageId: etapaDestino.id }`, sin datos financieros.
- **Resultado:** **CONFIRMADO**.

### 4. Venta única (CA-08)
- **Definición de esquema y migración:** En `src/infrastructure/db/schema.ts:758-769` y migraciones `drizzle/0004_cierre_venta_unica.sql` / `0005_identidad_venta_durable.sql`:
  - `unit_sales` tiene RLS habilitado (`.enableRLS()`).
  - Restricción de unicidad de unidad: `UNIQUE(unit_id)` (`unit_sales_unit_unq`).
  - Restricción de unicidad de negocio: `UNIQUE(deal_id)` (`unit_sales_deal_unq`).
  - Identidad durable de venta: `UNIQUE(project_id, unit_code_normalized)` (`unit_sales_identity_unq`).
  - CHECK de código normalizado: `length(btrim(unitCodeNormalized)) > 0 and unitCodeNormalized = upper(btrim(unitCodeNormalized))`.
  - Claves foráneas hacia `units`, `deals`, `projects` y `users` configuradas con `ON DELETE RESTRICT ON UPDATE RESTRICT` (sin borrado en cascada).
- **Normalización de código:** La función pura de dominio `normalizarCodigoUnidad` (`src/domain/unidades.ts:4-9`) aplica normalización Unicode NFKC, supresión de marcas diacríticas, trim, mayúsculas y colapso de secuencias de espacios/guiones/rayas a un solo `-`. Códigos como `"a 101"`, `"A-101"` y `" á 101 "` convergen de forma idéntica a `"A-101"`. Se verificó en prueba DB (`scripts/test-db/cierre.ts:117-136`) que un segundo intento de venta con formato variante o tras archivar la unidad previa es rechazado por conflicto 409 y por la restricción `23505` en base de datos.
- **Concurrencia real:** La prueba de carrera (`scripts/test-db/cierre.ts:51-83` y `:161-186`) sincroniza dos conexiones reales con backends PostgreSQL independientes (`assert.equal(new Set(pids).size, 2)`). Comprueba que exactamente una transacción gana el cierre y registra la venta, comisiones, metas y outbox, mientras que la otra recibe 409 ConflictError sin efectos parciales del perdedor.
- **Resultado:** **CONFIRMADO**.

### 5. Datos históricos (S-303-H)
- **Migración 0004:** El bloque de preflight en `drizzle/0004_cierre_venta_unica.sql:4-11` contabiliza los negocios ganados de venta sin unidad principal concreta y emite `RAISE NOTICE 'S-303-H: % ventas historicas sin unidad; conservadas sin fila en unit_sales'`. El `INSERT` subsiguiente incluye la cláusula `WHERE s.kind='won' AND d.operation_type='sale' AND p.unit_id IS NOT NULL;`, evitando inventar unidades o registros de venta espurios para los 15 negocios legados.
- **Consulta de legado:** La función `consultarVentasHistoricasSinUnidad` (`src/application/pipeline/consultas.ts:100` y `scripts/test-db/migracion-poblada.mjs:89-94`) devuelve exactamente los IDs `1000000` a `1000014` de forma paginada y ordenada.
- **Preservación:** En el ensayo poblado se verificó que las 23 tablas públicas copiadas conservan sus conteos y huellas SHA256 de todas las columnas originales antes y después de aplicar la migración.
- **Resultado:** **CONFIRMADO**.

### 6. Transacción y outbox (CA-20/21)
- **Idempotencia de etapa:** En `src/application/pipeline/casos-de-uso.ts:71`, si `deal.stageId === etapaDestino.id`, la función retorna inmediatamente el negocio sin registrar historial ni emitir eventos.
- **Transacción atómica:** Tanto en `cerrarNegocioGanado` (`src/application/pipeline/cierre.ts:219`) como en el cambio de etapa simple (`casos-de-uso.ts:182`), la emisión del evento `{ tipo: "NegocioCambioEtapa", aggregateId: dealId, payload: { id: dealId, stageId: etapaDestino.id } }` ocurre dentro de la misma unidad de trabajo / transacción SQL.
- **Rollback ante fallo:** La prueba en `scripts/test-db/cierre.ts:94-109` comprueba que un fallo forzado en la emisión del outbox revierte íntegramente la venta en `unit_sales`, comisiones, metas, historial de etapas, auditoría y el estado de la unidad.
- **Aislamiento externo:** Durante la transacción no se realiza ninguna llamada HTTP ni interacción con servicios externos; el evento se persiste en la tabla local `outbox` para su posterior procesamiento desacoplado.
- **Resultado:** **CONFIRMADO**.

### 7. Pérdida y baja lógica (CA-07/09)
- **Motivo y comentario de pérdida:** En `src/application/pipeline/casos-de-uso.ts:149-154`, la transición a `lost` exige un motivo válido y activo mediante `pipeline.motivoPerdidaActivo(entrada.lossReasonId)` y un comentario no vacío (`entrada.lossComment?.trim()`), arrojando 409 `ConflictError` ante omisiones. La base de datos garantiza la regla con la restricción CHECK `deals_loss_comment_required`.
- **Ausencia de borrado físico:** En `src/application/pipeline/casos-de-uso.ts:358-380` y `src/infrastructure/db/repos/pipeline.ts:417`, la retirada de un interés de propiedad (`quitarPropiedad` / `eliminarPropiedad`) realiza un `UPDATE` sobre `deal_properties` fijando `deleted_at`, `deleted_by`, `deletion_reason` y desmarcando `is_primary`. De igual manera, negocios y contactos operan con borrado lógico (`deletedAt`). No existe ninguna sentencia `DELETE` física sobre deals, contactos ni intereses en la lógica de negocio.
- **Resultado:** **CONFIRMADO**.

### 8. Arquitectura y seguridad (CA-04, CA-28)
- **Aislamiento de capas:** La capa de aplicación (`src/application/pipeline/**`) no importa Drizzle, Postgres ni componentes de framework/Next.js; interactúa exclusivamente mediante abstracciones de dominio y puertos tipados.
- **Control de acceso en servidor:** Todas las rutas en `src/app/api/pipeline/**` llaman a `requireActor()` y `requireScope()` antes de procesar datos o acceder a la base de datos.
- **Validación con Zod:** Toda entrada en la API se valida mediante esquemas estrictos (`.strict()`) en `src/application/pipeline/entrada.ts`, rechazando coerción de strings a booleanos, identificadores fuera del rango entero de PostgreSQL, importes inseguros o claves no reconocidas.
- **Protección de ID ajeno:** El acceso a negocios ajenos o inexistentes devuelve consistentemente 404 `NotFoundError` sin filtrar detalles sobre la existencia del recurso (`casos-de-uso.ts:59-63`, `reaches` y `visibleRows`).
- **Higiene de credenciales:** La búsqueda textual en los archivos nuevos y modificados de b1/b2 arrojó cero cadenas `postgres://`, cero contraseñas literales y cero referencias a `service_role`.
- **Resultado:** **CONFIRMADO**.

### 9. Cambios fuera de alcance
- Se revisó el listado completo de archivos modificados y no rastreados (`git status` y `git diff --name-only`).
- Los archivos ajenos a Negocios corresponden estrictamente a:
  1. Cambios visuales y de shell del 9 de octubre: `src/app/tokens.css`, `src/app/globals.css`, login, menús de encabezado/barra lateral y vistas en desarrollo de otros módulos (`academy`, `comisiones`, `comunicaciones`, `leads`, `propiedades`).
  2. Actualizaciones del marco de gobernanza Viltrum: `.viltrum/os/**` (departamentos D00-D22, sops, registros) y especificaciones en `.viltrum/vre-os/spec/`.
  3. Modificaciones previas de `academy` y `scripts/spec/**`.
- Los archivos propios del frente Negocios corresponden estrictamente al alcance b1 + b2: `src/application/pipeline/**`, `src/infrastructure/db/repos/pipeline*`, `src/infrastructure/contenedor/pipeline.ts`, `src/app/api/pipeline/**`, `src/app/(crm)/negocios/**`, `drizzle/0004*`, `drizzle/0005*`, `scripts/test-db/**` y `src/domain/unidades*`.
- **Resultado:** **CONFIRMADO**.

---

VEREDICTO: APROBADO
