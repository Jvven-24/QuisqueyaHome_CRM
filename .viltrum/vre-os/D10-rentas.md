# D10 · Rentas · T-W4b-D10

Fecha: 2026-10-04. Productor: Codex, perfil D10. Revisor requerido: D12, otro proveedor.

**Estado: construcción bloqueada por entradas del perfil; módulo no implementado ni aprobado.**
Se completó la inspección del contrato y la verificación del estado base. Este
informe no acredita funcionamiento de Rentas, cierre de issue, fase ni gate.

## Mandato y alcance

Se leyó completo `.viltrum/dispatch/20261004T205251Z-D10-codex/PERFIL.md`
y después `TAREA.md`. Se aplicó la skill `viltrum-backend` incluida en el
perfil y se consultó `gitnexus-impact-analysis`.

Clasificación con `.viltrum/os/core/routing.md`: módulo nuevo de CRM/ERP,
riesgo R3 por datos personales y registros contables de pagos. El despacho
autoriza expresamente escribir esquema, aplicación, infraestructura, rutas,
seed y vista en los archivos enumerados. Se reconoce esa autorización y
la excepción al congelamiento histórico de SOLID; no se está solicitando
una nueva autorización comercial.

C1 figura activo en `.viltrum/commercial.md`. El mandato del programa
registra Rentas aprobado el 4-oct y el levantamiento del congelamiento.
`docs/R_RELEVO.md` conserva instrucciones del 2-oct; se da precedencia al
despacho específico para alcance, comandos y prohibición de git/dev/build.

**Único archivo creado por esta entrega:** `.viltrum/vre-os/D10-rentas.md`.
No se editaron archivos de aplicación, esquema, migraciones, permisos, seed
ni pruebas. No se ejecutaron git, dev, build, migraciones, seed sobre una base,
despliegues ni acciones de producción. No se abrieron subagentes.

## Entradas inspeccionadas y bloqueo explícito

El perfil, en su método D10, exige literalmente:

> **Bloqueante:** sin contratos de módulo de D03 no implemento — un endpoint que inventa su propio límite es deuda desde el día uno. Sin modelo de datos de D11 no implemento contra una tabla que todavía no existe de forma estable. Si falta cualquiera de los dos, escalo en vez de improvisar.

Referencia: `PERFIL.md:322` y párrafo siguiente, sección
`.viltrum/os/departments/D10-backend/AGENTS.md` incorporada al perfil.
La skill local `.viltrum/os/skills/viltrum-backend/SKILL.md` ordena
«Aplicar entradas y gates del procedimiento al alcance real»; el procedimiento
identifica como entradas los contratos D03 y el modelo/políticas D11.

| Entrada | Evidencia observada | Resultado |
|---|---|---|
| Autorización de construcción | `TAREA.md`, decisiones #43/#44 citadas por el despacho; C1 activo y mandato del programa | Autorización reconocida; no es el bloqueo |
| Contratos D03 | `.viltrum/departments/D03-architecture.md`: estado pendiente, «Evidencia y handoff pendientes» | No hay handoff acreditado en el worktree |
| Arquitectura indicada por la tarea | `ARQ-VRE-002-integraciones.md:3`, repositorio principal: «Estado: PROPUESTA»; §3 sitúa Rentas como módulo nativo detrás de su repositorio | Patrón disponible; revisión D03/G2 vigente no verificada |
| Modelo estable D11 de Rentas | `.viltrum/departments/D11-data.md`: pendiente; búsqueda en artefactos `vre-os/` no localizó un handoff D11 de Rentas | Entrada faltante en los artefactos inspeccionados |
| D11 disponible en repositorio principal | `D11-datos-seed.md` corresponde a T-W1-D11: campañas, zonas, inventario, métodos de pago y seed | No modela contratos, depósitos, ledger ni mantenimiento de Rentas |
| Plan D21 | `D21-rentas-porte.md`, repositorio principal, leído completo | Investigación y mapeo disponibles; no sustituyen el handoff D11 exigido |
| Fuente upstream y procedencia | D21 declara repo/SHA/MIT y puntos de inicio 501/584 | Código y rangos de líneas no verificados directamente en esta ejecución |

Los documentos D21, ARQ y D05 no estaban en este worktree. Se encontraron y
leyeron **sin modificarlos** en
`C:/Users/wilbe/Documents/QuisqueyaHome_CRM/.viltrum/vre-os/`.
También se consultaron `src/application/README.md`, `docs/DESIGN.md`, contexto,
RBAC, filtro SQL, auditoría/unidad de trabajo, rutas existentes y guardas del seed.

Se pidió asincrónicamente la ubicación de los handoffs y de la copia upstream.
Al redactar este informe no había respuesta recibida. No se interpretó el
silencio como aprobación ni como dispensa de las entradas bloqueantes.

## Tablas: inventario del alcance pendiente

La búsqueda en `schema.ts` y en las rutas/aplicación del worktree no encontró
tablas ni módulo de Rentas. Journal Drizzle inspeccionado: entradas 0000–0003;
no se generó una migración nueva.

| Pieza solicitada | Fuente de requisito | Estado de esta entrega |
|---|---|---|
| Contratos, unidad → `units`, inquilino y propietario → `contacts` | TAREA §1; D21 propone `rent_leases` | Pendiente de modelo D11; no creada |
| Cargos mensuales y pagos con método existente | TAREA §1; D21 propone `rent_charges`, `rent_payments` | No creados |
| Depósitos | TAREA §1 | D21 solo propone un monto en el contrato; ledger/ciclo de depósito sin definición estable |
| Mantenimiento y proveedores | TAREA §1; D21 propone `rent_work_orders`, `rent_vendors` | No creados |
| Catálogos de estado de contrato y tipo de cargo en tabla | TAREA §1 | D21 deja abierta tabla o enum; prevalece la exigencia de tabla de TAREA |
| RLS, UUID público, borrado lógico, centavos USD/DOP | TAREA §1 y checklist §6 | Requisitos identificados, sin implementación nueva |
| Exclusividad de intervalos activos por unidad | TAREA §1 | Constraint y semántica temporal pendientes de D11; sin prueba ejecutada |

`payment_methods` y `unit_inventory_states` ya existen en el esquema con
RLS y UUID público. `units` y `contacts` ya tienen responsable (`broker_id`)
y borrado lógico. Se conserva el patrón `visibleRows`; no se introduce un
filtro de responsable propio.

## Casos de uso, consultas y vista pendientes

| Operación | Control que debe cerrar el contrato/handoff | Implementación/prueba |
|---|---|---|
| `crearContrato` | Alcance del contrato y de unidad/inquilino/propietario; exclusividad temporal; transacción y auditoría | No implementada |
| `generarCargosMensuales` | Clave natural que distinga periodo y tipo; fecha de vencimiento; reintento/concurrencia sin duplicación | No implementada |
| `registrarPago` | Alcance heredado del contrato; moneda; sobrepago; clave durable y conflicto de payload; actualización atómica del saldo | No implementada |
| `aplicarMora` | Catálogo de cargo; base/fecha de cálculo; cargo único por regla acordada; conciliación con pagos concurrentes | No implementada |
| `renovarContrato` | Límites del periodo; relación con contrato anterior; exclusividad y efecto de reintento | No implementada |
| `abrirOrdenMantenimiento` / `cerrarOrden` | Pertenencia de unidad y proveedor; transición válida; costo/moneda; auditoría | No implementadas |
| Estado de cuenta, mora, ocupación e ingresos por mes | Alcance SQL; moneda separada; denominador de ocupación; zona horaria; límites de listado | No implementadas |
| Contratos · Cobros · Mantenimiento · Proveedores | ModuleTabs, chart existente, tarjetas móviles, Drawer, seis estados y menú Operaciones sin badge | No implementada ni recorrida |

El seed base define 15 cierres (`FUNNEL.contracts`, `scripts/seed/catalog.ts`)
y marca vendidas las unidades de esos cierres (`generator.ts:116`). La guarda
`generator.ts:196–197` exige exactamente un negocio ganado por unidad vendida.
**Lectura estática, no conteo de la base:** D11 debe acordar cómo generar ≈60
contratos sobre ese inventario: por ejemplo, periodos históricos sucesivos, si
eso satisface el contrato temporal. No se alteran cierres ni estados para
alcanzar un volumen sin acuerdo de modelo.

## Procedencia del porte

**Archivos portados: ninguno.** No se escribieron cabeceras con líneas inventadas.

D21 declara `clawnify/OpenProperty`, SHA
`a493028ad12ba969990ee916fbc8cd2a98807a2d`, licencia MIT, y cita
`src/server/index.ts:501` para cargos y `:584` para pagos. Esas son
afirmaciones del expediente D21, no verificaciones independientes de esta entrega.

Los intentos de abrir por web los tres recursos raw (`src/server/index.ts`,
`src/server/schema.sql`, `LICENSE`) en ese SHA devolvieron `Cache miss`.
El intento adicional con `Invoke-WebRequest`, limitado a 15 s y sin imprimir
detalles del error, devolvió:

```text
Fuente upstream no accesible por HTTP.
```

La búsqueda por nombre de archivo no localizó `schema.sql` en Documents ni
E:/VILTRUM. Eso no demuestra que no exista otra copia temporal. D21 debe
entregar fuente accesible y rangos exactos, incluyendo aviso de copyright y
licencia, antes de acreditar un porte. No se presenta una reimplementación
independiente como código portado.

## Impacto GitNexus

Se consultó `query` para permiso/alcance/filtro/esquema/seed y `impact`
upstream antes de cualquier posible edición:

| Objetivo | Resultado observado |
|---|---|
| `CrmSidebarMenu` | LOW, 0 dependientes directos, 0 procesos/módulos identificados |
| `catalogs.ts` | CRITICAL, 41 importadores directos, 0 procesos/módulos identificados; incluye RBAC, esquema, auditoría y vistas |
| `schema.ts` | Resolvió al esquema del prototipo; resultado LOW descartado por objetivo incorrecto |
| `src/infrastructure/db/schema.ts` y `File:src/infrastructure/db/schema.ts` | Target not found; impacto del esquema real **no verificado** |

Se comunicó el riesgo CRITICAL al usuario. No se modificó ningún símbolo.
No hubo aviso de índice obsoleto en los resultados. No se ejecutó
`detect_changes`: no se realiza commit y el despacho prohíbe git; además el
índice consultado corresponde al repositorio principal, no acredita un diff
de este worktree.

## Pruebas

**Estas corridas verifican el estado base, sin cambios de código de Rentas.**
No son pruebas de aceptación del módulo solicitado.

### TypeScript

Comando equivalente de Windows: `npx.cmd tsc --noEmit --incremental false`.
Resultado observado: **exit 0; salida vacía**. No hubo errores de `.next/types`
que excluir ni se editó la configuración de TypeScript.

### Lint

Comando: `npm.cmd run lint`. Resultado observado: **exit 0; 0 errores y
12 advertencias preexistentes**. No se modificaron esos archivos.
Salida real:

```text
> quisqueya-home-crm@0.1.0 lint
> eslint .
C:\Users\wilbe\Documents\.viltrum-worktrees\QuisqueyaHome_CRM\20261004T205251Z-D10-codex\scripts\seed\generator.ts
  42:155  warning  '_position' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\wilbe\Documents\.viltrum-worktrees\QuisqueyaHome_CRM\20261004T205251Z-D10-codex\scripts\seed_local_crm.mjs
  41:9  warning  'adminId' is assigned a value but never used      @typescript-eslint/no-unused-vars
  57:9  warning  'assistantId' is assigned a value but never used  @typescript-eslint/no-unused-vars
  86:9  warning  'p4' is assigned a value but never used           @typescript-eslint/no-unused-vars

C:\Users\wilbe\Documents\.viltrum-worktrees\QuisqueyaHome_CRM\20261004T205251Z-D10-codex\src\app\(crm)\_ui\crm-header.tsx
  38:3  warning  'etiquetaRol' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\wilbe\Documents\.viltrum-worktrees\QuisqueyaHome_CRM\20261004T205251Z-D10-codex\src\app\(crm)\_ui\crm-sidebar-menu.tsx
  6:21  warning  'ChevronRight' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\wilbe\Documents\.viltrum-worktrees\QuisqueyaHome_CRM\20261004T205251Z-D10-codex\src\app\(crm)\comisiones\vista.tsx
   12:39  warning  'DollarSign' is defined but never used                                                                                                @typescript-eslint/no-unused-vars
  300:5   warning  React Hook useMemo has missing dependencies: 'cambiarEstado' and 'editarReparto'. Either include them or remove the dependency array  react-hooks/exhaustive-deps

C:\Users\wilbe\Documents\.viltrum-worktrees\QuisqueyaHome_CRM\20261004T205251Z-D10-codex\src\app\(crm)\leads\vista.tsx
  57:7  warning  'TONO_ESTADO' is assigned a value but never used  @typescript-eslint/no-unused-vars

C:\Users\wilbe\Documents\.viltrum-worktrees\QuisqueyaHome_CRM\20261004T205251Z-D10-codex\src\app\(crm)\propiedades\vista.tsx
  11:22  warning  'Building2' is defined but never used  @typescript-eslint/no-unused-vars
  11:54  warning  'Sparkles' is defined but never used   @typescript-eslint/no-unused-vars

C:\Users\wilbe\Documents\.viltrum-worktrees\QuisqueyaHome_CRM\20261004T205251Z-D10-codex\src\app\login\page.tsx
  17:11  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

✖ 12 problems (0 errors, 12 warnings)
```

### Suite completa

Comando equivalente de Windows: `npm.cmd test`. Resultado observado: **exit 0**.
Extracto literal de la salida real de esa corrida:

```text
> quisqueya-home-crm@0.1.0 test
> node --test "src/**/*.test.ts"

✔ toda tabla creada en una migración tiene RLS activado (66.2708ms)
✔ toda ruta de la API comprueba permisos en servidor, salvo las públicas declaradas (90.7266ms)
✔ ARQ-3: tablas de integración con RLS en esquema y migración (4.1134ms)
✔ ARQ-4: webhooks verifican firma antes de parsear el cuerpo (64.0331ms)
ℹ tests 499
ℹ suites 0
ℹ pass 499
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4999.6039
```

`npm test` incluye `seguridad.test.ts` y `arquitectura.test.ts`, según el
patrón de ejecución y sus archivos presentes. No se añadieron pruebas de
Rentas. Build/dev no ejecutados por prohibición expresa del despacho.
UI, migración aplicada, idempotencia/concurrencia en PostgreSQL, conteos
persistidos y seed de Rentas: **no ejecutados/no verificados**.

## Seguridad de esta entrega

Checklist de `docs/contexto/flujo-de-trabajo.md` §6 aplicado al único cambio,
este documento: no contiene credenciales ni cadenas de conexión; no crea
tablas, rutas, SQL ejecutable, cuentas ni escrituras contables. No se listaron
variables de entorno, `.env`, `printenv` ni `docker inspect`. No hubo secreto
detectado en las salidas de esta sesión. La referencia documental a un incidente
anterior de D11 no constituye un incidente nuevo de esta ejecución.

Bien: la aplicación base pasó las guardas automáticas existentes de RLS,
permisos y capas. **No se afirma una auditoría completa del código base ni
seguridad de un módulo de Rentas que todavía no existe.**

Riesgos concretos que debe resolver el siguiente handoff: pago duplicado por
reintento; sobrepago por carrera; doble ocupación de unidad; acceso cruzado a
contacto/unidad/orden por ID; mezcla USD/DOP en saldos/KPIs; depósito sin ciclo
contable; mora duplicada; periodos de renovación solapados. Son escenarios
de diseño pendientes, no vulnerabilidades observadas en código nuevo.

## Handoff

**D00/D03/D11/D21 para desbloquear; D12 de otro proveedor para revisión
independiente. D10 no aprueba su propia entrega.**

1. D03: entregar contrato de módulo/puertos vigente o evidencia de revisión
   de ARQ-VRE-002, con matriz recurso/acción/alcance, errores, límites y
   semántica temporal/monetaria de Rentas. La propuesta general no acredita G2.
2. D11: entregar modelo estable de contratos, catálogos en tabla, cargos,
   pagos, depósitos, proveedores y órdenes; restricciones de exclusividad,
   claves idempotentes y estrategia de concurrencia. El despacho ya permite
   editar `schema.ts`/Drizzle; falta la entrada técnica exigida por el perfil.
3. D21: facilitar la copia del upstream en el SHA indicado y las líneas
   exactas origen, licencia y aviso de copyright. No basta con dos líneas de inicio.
4. D00: incluir esos artefactos en el siguiente despacho/worktree para evitar
   depender de documentación no versionada disponible solo en el repositorio principal.
5. Retomar T-W4b-D10 desde sus cinco bloques; mantener límites de archivos,
   guardas del seed y prohibición de git/dev/build/mutaciones de bases reales.
6. D12/D14: revisar controles y ejecutar pruebas de bypass, alcance ajeno,
   reintento/carrera/rollback, divisas, exclusividad, seed y seis estados UI;
   completar build y capturas desde el entorno del revisor autorizado.

Commit base: **no verificado**, por prohibición de git. No se entrega parche
de implementación ni se declara la tarea completada. Las pruebas base en
verde no suplen los requisitos ausentes.
