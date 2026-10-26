---
id: M40
nombre: Cadena transaccional inmobiliaria
estado: READY
candidatura: READY-condicionada (R2 APROBADO CON CONDICIONES, Antigravity D12, 2026-10-18)
nivel: L1
riesgo: R3
owner: D10
productor: D03
colaboracion: D11-modelo-de-datos
revisores: [D12, D14, Wilber]
fuente_de_verdad: PostgreSQL del CRM
depende_de: [M03, M04, M10, M22, G04, G05, G10, I00]
actualizado: 2026-10-18
tarea: T-TX-1018-R2
---

> **Compuerta D00 (2026-10-18).** R2 independiente (`reviews/M40-transaccion-D12-R2.md`): APROBADO CON CONDICIONES.
> READY habilita **solo** `b1a`, `b1b` (código puro) y `b1g` (PoC del libro en base sintética). `b1c` y toda DDL quedan
> bloqueadas hasta que Wilber decida Q40-01 (instalación única vs multiempresa) en `docs/contexto/decisiones.md`; `b2d` y
> todo movimiento de dinero, hasta que `b1g` pase con revisión independiente. H-R2-03 entra en el contrato de `b1c`.


# M40 · Cadena transaccional inmobiliaria

## 1. Propósito y usuarios

**Proteger el compromiso comercial de una unidad desde el hold hasta la liquidación de la comisión.**

Recorrido cubierto:

**Solicitar hold → pactar reserva → acordar plan → verificar cobro → aplicar dinero → conciliar → reconocer comisión → liquidar.**

También cubre caducidad, cambio de unidad, reestructuración, pago tardío, sobrepago, reverso, cancelación y reembolso.

La oportunidad comercial, la disponibilidad, la reserva, el dinero y la comisión conservan estados independientes. Mover una tarjeta, subir un comprobante o exportar una instrucción bancaria no acredita los demás hechos.

Esta ficha integra los contratos transaccionales de UI-040 a UI-047. Su aprobación deberá reconciliar M03/M22 y sus referencias, evitando dos especificaciones activas para el mismo comportamiento.

**Estado de entrega:** propuesta completa para revisión, con bloqueos explícitos. No constituye READY aprobado, implementación, prueba superada ni autorización de despliegue. La constitución exige ficha READY antes de construir y revisión independiente: `.specify/memory/constitution.md:12`, `:34`.

### Actores

| Actor | Trabajo principal |
|---|---|
| Broker/agente autorizado | Solicitar hold, preparar reserva, presentar evidencia, consultar su avance permitido |
| Coordinador comercial | Revisar condiciones, resolver disponibilidad, tramitar cambios |
| Finanzas | Verificar cobros, aplicar importes, conciliar, preparar liquidaciones |
| Legal | Revisar condiciones, cancelaciones y fundamento contractual |
| Aprobador independiente | Resolver excepciones, reembolsos y lotes según facultad |
| Auditor | Consultar trazabilidad con acceso restringido |
| Cliente | Consultar su estado de cuenta únicamente mediante acceso autorizado específico |
| Identidad de sistema | Procesar caducidad y eventos con facultades acotadas |

“Finanzas”, “Legal” y “Aprobador” son capacidades funcionales propuestas; **no se afirma que esos roles estén implementados**.

### Convención de evidencia

- **VERIFICADO EN ARCHIVO:** contenido inspeccionado del repositorio.
- **PROPUESTA:** contrato objetivo de esta ficha.
- **NO VERIFICADO:** comportamiento, dato o configuración no demostrado.
- Los CA son obligaciones futuras, sin ejecución funcional en R2. La verificación estructural se registra en `reviews/M40-respuesta-R1.md`.
- Los 184 negocios son una referencia de la tarea y de informes anteriores; **su cantidad y estado actuales son NO VERIFICADO**.

## 2. Estado actual y compatibilidad

| Evidencia verificada | Implicación |
|---|---|
| `src/infrastructure/db/schema.ts:21` declara una instalación sin `organization_id`; decisión #5 en `docs/contexto/decisiones.md:24` | El esquema actual no demuestra multiempresa |
| `schema.ts:362` contiene `payment_methods`; `:373` contiene `unit_inventory_states` | Reutilizar estos catálogos |
| `schema.ts:475` define `units`, con referencia al catálogo de inventario en `:492` | Conservar identidad de unidad; no crear otro inventario |
| `schema.ts:758` define `unit_sales`, con unicidad de unidad, negocio e identidad durable | Preservar estas barreras |
| `src/application/pipeline/cierre.ts:89` bloquea unidad; `:91` exige `available`; `:93` registra venta | El cierre todavía no consume una reserva propia |
| `cierre.ts:177` calcula; `:183` crea comisión `pending` | El cierre actual no distingue proyección y devengo |
| `src/domain/comision-estado.ts:19` permite `pending → approved → paid`, con `void` terminal | Máquina insuficiente para FL-07 |
| `src/application/comisiones/casos-de-uso.ts:47` cambia estado; `:55` asigna `paidAt` | Marcar pagada no exige aquí evidencia bancaria |
| `src/app/api/proyectos/[id]/unidades/route.ts:25` acepta `status`; `[unitId]/route.ts:24`, `:41` permiten editarlo | El PATCH conserva `units:edit` en `:65`, pero escribe `status` directamente; integrar antes de habilitar holds |
| `src/infrastructure/integraciones/outbox/worker.ts:14`, `:30` filtra tipos con consumidor; `repositorio.ts:30` aplica el filtro SQL | B-01 de la revisión de M22 está corregido en el código leído respecto a reclamar tipos desconocidos |
| `schema.ts:1155`, `:1175` limita el outbox a tres tipos comerciales | Los eventos financieros todavía requieren contrato y migración |
| `schema.ts:1137`, `:1157` usa IDs enteros en auditoría y agregado del outbox | Introducir UUID como PK sin adaptación rompería contratos existentes |

La revisión R1 atribuye al PATCH `projects:edit`; el código leído exige `units:edit` (`src/app/api/proyectos/[id]/unidades/[unitId]/route.ts:65`). Se corrige esa precisión, sin refutar el bypass de `status` observado en `:24` y `:41`.

La auditoría registra UI-040–045 y UI-047 como faltantes y UI-046 parcial: `.viltrum/vre-os/auditoria-2026-10-18/matriz-G3.md:58`, `:64`, `:70`, `:76`, `:82`, `:90`, `:96`, `:103`. No se localizaron las capacidades transaccionales nuevas en el código inspeccionado. Su existencia en otro entorno es **NO VERIFICADO**.

### Absorción de M03, M22 y expedientes

M03 figura **READY** en su cabecera actual, no REVIEW: `.viltrum/vre-os/spec/modulos/M03-negocios.md:4`. Su alcance excluye reservas financieras y planes: `:428`. Ampliarlo exige una enmienda explícita.

| Conflicto o hallazgo | Disposición propuesta en M40 |
|---|---|
| M22 exige venta cerrada como origen del plan, `M22-cobros.md:135` | Reserva como origen ordinario; enlace a venta durable para adopción del legado |
| M22 rechaza sobrepago, `:273`, `:332` | Conservar dinero confirmado como crédito no aplicado, conforme a la spec maestra `:1819` |
| M22 modifica aplicaciones al anular, `:141` | Compensaciones append-only; conservar aplicaciones originales |
| Cierre rechaza unidad reservada, `G2-reservas.md:19` | Admitir compromiso propio válido y consumirlo dentro de la transacción |
| Edición directa del estado, `G2-reservas.md:20` | Una sola autoridad para disponibilidad efectiva |
| Asistente con cambios efectivos y lectura financiera amplia | Conservar propuesta separada del efecto; no ampliar lectura por inferencia |
| Plantilla 10/40/50 presentada como existente | No activarla automáticamente; el cotizador leído usa 20/30/50 en `src/app/api/cotizador/confotur/route.ts:18` |
| Comisión exigible inferida del cierre | Sustituir por hito contractual y evidencia |
| Comisión pagada sin conciliación | Liquidación confirmada mediante evidencia; adaptación del PATCH antiguo obligatoria |

Los expedientes G2/G3 son insumos de evolución, no evidencia de construcción: `evolucion/G2-reservas.md:78`, `G3-cobros.md:93`, `G3-comisiones.md:97`.

## 3. Pantallas

### Navegación y presentación

Entrada funcional **Finanzas y Cobros**, con pestañas:

**Reservas · Cartera y Planes · Conciliación · Excepciones · Comisiones**.

Dentro de Comisiones: **Libro · Liquidaciones · Reglas**. Los accesos profundos conservan URLs de expediente; no se crea una entrada lateral por pantalla.

Base D04: `D04-arquitectura-ui.md:232`, `:265`, `:266`. La distribución definitiva del sidebar sigue pendiente en `:480`.

UI-040 se abre también desde Inventario/Negocios. `/comisiones` se conserva como acceso existente. Facturación UI-049 queda fuera de M40.

### Contenido por pantalla

| UI | Ruta/contexto | Campos y bloques | Acciones | Filtros |
|---|---|---|---|---|
| UI-040 | `/unidades/[id]/hold`; hoja desde inventario | Unidad/anexos, comprador, negocio, versión de precio, duración permitida, motivo, hora servidor, cupo | Solicitar, cancelar, pedir extensión | Propios activos, por vencer, expirados, rechazados |
| UI-041 | `/reservas/[id]`; pestaña Reservas | Titulares/representación, unidades, precio congelado, depósito, condiciones, pago/evidencia, documentos, historial | Preparar desde hold, presentar evidencia, enviar a revisión, confirmar, cambiar unidad, solicitar cancelación | Pendiente, verificación, confirmada, cancelación, excepción |
| UI-042 | `/reservas/[id]/plan`; `/cobros` | Total, moneda, calendario, aplicaciones, crédito, saldo, vencidos, versión y acuerdo | Simular, acordar, reestructurar, descargar estado, recordatorio autorizado | Proyecto, comprador, moneda, vencimiento, antigüedad |
| UI-043 | `/finanzas/conciliacion` | Movimiento original, bruto/comisión/neto, pagador, referencias, candidatos, evidencia, diferencia | Importar, revisar fila, emparejar, dividir aplicación, confirmar o abrir caso | Sin conciliar, duplicado, diferencia, FX, tardío, contracargo |
| UI-044 | `/finanzas/excepciones/[id]` | Caso, reserva, hechos monetarios, regla contractual, escenario, cuenta versionada, impacto en inventario/comisión | Solicitar, revisar legalmente, aprobar, instruir, consultar resultado | Pendiente legal, aprobada, enviada, parcial, desconocida, fallida |
| UI-045 | `/comisiones/reglas` | Base, exclusiones, tasa/importe, moneda, split, devengo, exigibilidad, retención, vigencia, versión | Simular, versionar, aprobar, asignar, retirar para futuro | Proyecto, acuerdo, broker, base, vigencia |
| UI-046 | `/comisiones` | Beneficiario, negocio, base permitida, importe, moneda, esperado/devengado/aprobado/exigible/pagado, ajuste, saldo | Explicar cálculo, aportar evidencia, tramitar aprobación, ajustar, preparar lote | Estado, moneda, proyecto, beneficiario, hito, disputa |
| UI-047 | `/comisiones/liquidaciones/[id]` | Líneas exigibles, documentos requeridos, cuenta enmascarada/version, retención, neto, aprobación y resultado por línea | Preparar, revisar, aprobar con MFA, exportar/instruir, conciliar | Pendiente, bloqueada, instruida, parcial, pagada, fallo |

La formalización se divide en tres pasos: unidad/titulares/condiciones; plan; atribución/evidencia. D04 propone esa segmentación en `:452`.

La UI explica por qué falta una condición. No oculta un requisito detrás de un botón deshabilitado sin motivo. Los errores aparecen en su campo y en un resumen enfocable.

### Seis estados obligatorios

| Estado | Comportamiento común |
|---|---|
| Carga | Esqueleto del bloque; al refrescar conserva contenido con fecha de actualización |
| Vacío | Explica ausencia y ofrece acción permitida, sin cifras inventadas |
| Error | Mantiene borrador, muestra correlación y permite reintento seguro |
| Sin conexión | Lectura permitida con antigüedad; solo borrador, sin prometer hold/pago/aprobación |
| Éxito | Confirma resultado persistido y referencia; muestra estado externo pendiente cuando aplique |
| Permiso insuficiente | Oculta campos restringidos y responde 403/404 sin filtrar existencia |

Adicionales:

- Hold: conflicto, expirado y cupo agotado.
- Reserva: condiciones desactualizadas o pago tardío.
- Plan: versión cambiada o suma inválida.
- Conciliación: duplicado, diferencia y revisión pendiente.
- Excepción: resultado externo desconocido.
- Comisión: falta de hito, evidencia o regla aprobada.
- Liquidación: cuenta modificada, MFA requerido, parcial o resultado desconocido.

### Móvil y accesibilidad

- 320/390: tarjetas, detalle en hoja inferior, filtros colapsados y acción contextual.
- 768/1440: tabla semántica y panel de detalle.
- Sin desplazamiento horizontal de página; tablas extensas con alternativa de tarjetas.
- Campos monetarios siempre incluyen moneda.
- Cuenta regresiva basada en hora servidor; no anuncia cada segundo al lector.
- Foco atrapado/restaurado en diálogos; navegación completa por teclado.
- Estados con texto/icono; color como apoyo.
- Acciones táctiles según contrato de diseño y accesibilidad.
- Confirmaciones muestran impacto, importe, moneda y destino enmascarado.
- IDs de componentes de galería y wireframes revisados: **NO VERIFICADO**, pendientes D05/D07.

## 4. Funciones (casos de uso)

### 4.1 Contrato por operación

Entradas Zod estrictas conforme a §6.1; clave idempotente y versión conforme a §6.4. Los permisos incluyen alcance resuelto por §6.2; `own/all` no concede ambos. Configuración contractual ausente bloquea el comando dependiente, conforme a §9.

| Caso de uso | Entrada validada | Regla | Salida / errores | Permiso | Evento outbox / idempotencia |
|---|---|---|---|---|---|
| Adquirir hold | Negocio, paquete, precios, motivo | Concesión, cupo, exclusividad, reloj tras locks | Hold; 404/409/422/429 | `holds:create:own/all` | `HoldCreado`; comando único |
| Extender/cancelar hold | ID, versión, motivo, aprobación si procede | Cupo y facultad; conservar historia | Versión; 404/409/422 | `holds:edit:own/all` | `HoldExtendido/HoldCancelado`; comando único |
| Expirar compromiso | Candidato, versión, identidad de sistema | Mismo orden de locks y reloj SQL que adquisición | Expirado o sin efecto si ya resuelto | `financial_jobs:edit:all`, acotado al job | `HoldExpirado/ReservaExpirada`; objeto+versión |
| Preparar/confirmar reserva | Hold, titulares, condiciones, evidencia, versión | Compromiso propio vigente, gate contractual/financiero | Reserva; 404/409/422 | `reservations:create/edit:own/all` según operación | `ReservaCreada/ReservaEnVerificacion/ReservaConfirmada`; comando único |
| Cambiar unidad/cancelar reserva | Paquete destino o fundamento, aprobación, versión | Origen/destino ordenados; cancelación sin devolución automática | Expediente; 404/409/422 | `reservations:edit:own/all` | `ReservaUnidadCambiada/CancelacionSolicitada/ReservaCancelada`; comando único |
| Simular/acordar/reestructurar plan | Calendario, acuerdo, plantilla, versión | Suma exacta, historia y crédito trasladado | Simulación o versión; 404/409/422 | `payment_plans:view/create/edit:own/all` según operación | Simulación sin evento; `PlanAcordado/PlanReestructurado`; mutación idempotente |
| Presentar/verificar pago | Origen, evidencia, importe, moneda, decisión | Presentación no confirma; verificador independiente | Pendiente o decisión; 404/409/422 | `payments:create:own/all`; verificación `payment_verifications:edit:all` | `PagoPresentado/PagoConfirmado/PagoRechazado`; comando/evento externo único |
| Aplicar pago | Pago, cuotas, importes, FX pactado | Bloquear padres; no sobreaplicar; conservar crédito | Aplicaciones/saldo; 404/409/422 | `payments:edit:all` | `PagoAplicado`; comando y líneas únicos |
| Reversar/registrar contracargo | Pago, importe, causa, evidencia | Lock del pago; saldo elegible común con reembolsos | Compensación; 404/409/422 | `payments:edit:all`, o identidad externa verificada | `PagoReversado/ContracargoRegistrado`; comando/evento único |
| Importar/conciliar extracto | Archivo privado, mapeo, correspondencia, versión | Dedupe de fila; bruto, comisión y neto separados | Lote/caso; 404/409/422/503 | `reconciliations:import/edit:all` según operación | `ExtractoImportado/ConciliacionResuelta`; lote/fila/comando únicos |
| Solicitar/aprobar/instruir reembolso | Pago, importe, destino/version, fundamento, decisión | Reserva de saldo bajo lock; aprobador distinto; MFA si corresponde | Solicitud/resultado pendiente; 403/404/409/422/503 | `refunds:create/edit:all`; aprobación `financial_approvals:edit:all` | `ReembolsoSolicitado/ReembolsoAprobado/ReembolsoInstruido/ReembolsoConfirmado`; clave externa estable |
| Versionar regla/acuerdo de comisión | Ámbito, base, fórmula, hitos, splits, evidencia | Sin modificar versiones usadas | Nueva versión; 403/404/409/422 | `commission_rules:create/edit:all` | `ReglaComisionVersionada`; comando único |
| Devengar/ajustar comisión | Hito/evento elegible o ajuste aprobado | Acuerdo congelado; compensación atribuible | Entrada/ajuste; 404/409/422 | Consumidor `financial_jobs:edit:all` acotado; ajuste `commission_entries:edit:all` | `ComisionDevengada/ComisionAjustada`; origen+hito o comando únicos |
| Preparar/aprobar/instruir/conciliar lote | Obligaciones, moneda, hash aprobado, evidencia por línea | Una inclusión activa; separación/MFA; pago tras conciliación | Lote parcial/conciliado; 403/404/409/422/503 | `payouts:create/edit:all`; aprobación `financial_approvals:edit:all` | `LiquidacionAprobada/LiquidacionInstruida/LiquidacionConciliada`; comando/línea y clave externa |
| Consultar/exportar expediente | Filtros, cursor, UUID, formato | Filtro relacional obligatorio y DTO por facultad | Lista/detalle/CSV/PDF; 403/404 | `recurso:view/export:own/all`, por capacidad | Lectura sin outbox; auditoría de exportación sensible |

Los eventos añadidos son PROPUESTA. §6.7 exige su registro compatible antes de emitirlos. La tabla no asigna nuevas facultades al asistente ni sustituye Q40-04. Las combinaciones exactas por rol se aprueban antes del seed.

### 4.2 Máquinas de estado

Los códigos técnicos siguientes son **PROPUESTA**. Viven en un catálogo tipado único; sus etiquetas traducibles no se duplican en componentes.

| Objeto | Estados y transiciones | Actor y condición | Evento outbox |
|---|---|---|---|
| Unidad | `por_confirmar → disponible`; `disponible → comprometida`; `comprometida → disponible`; `disponible/comprometida → vendida`; retiro según expediente | Inventario valida disponibilidad; compromiso efectivo deriva del registro activo; venta consume compromiso propio | `UnidadDisponibilidadCambiada` |
| Hold | Creación → `activo`; `activo → convertido/cancelado/expirado`; extensión conserva `activo` e incrementa versión | Solicitante autorizado; extensión con aprobación y cupo; caducidad por reloj servidor | `HoldCreado`, `HoldExtendido`, `HoldCancelado`, `HoldExpirado`, `HoldConvertido` |
| Reserva | `borrador → pendiente_pago → en_verificacion → confirmada`; estados previos pueden quedar `expirada`; `confirmada → cancelacion_solicitada → cancelada` o rechazo de solicitud | Coordinador/Finanzas/Legal según política; comprobante por sí solo no confirma | `ReservaCreada`, `ReservaEnVerificacion`, `ReservaConfirmada`, `ReservaExpirada`, `CancelacionSolicitada`, `ReservaCancelada` |
| Pago | `pendiente → confirmado/rechazado`; confirmado → `reversado_parcial/reversado_total/contracargo` mediante eventos | Finanzas independiente o evento externo verificado; original conservado | `PagoConfirmado`, `PagoRechazado`, `PagoReversado`, `ContracargoRegistrado` |
| Plan | `borrador → acordado_activo → completado`; reestructuración sustituye versión activa; cancelación conforme a expediente | Finanzas y acuerdo requerido; reverso puede reabrir saldo | `PlanAcordado`, `PlanReestructurado`, `PlanCompletado`, `PlanReabierto` |
| Comisión | `esperada → devengada → aprobada → exigible → pagada`; proyección puede retirarse antes de devengo; posteriores correcciones son ajustes | Hito contractual, revisión independiente, condición de pago, conciliación | `ComisionProyectada`, `ComisionDevengada`, `ComisionAprobada`, `ComisionExigible`, `ComisionAjustada`, `ComisionPagada` |
| Reembolso | `solicitado → aprobado → pendiente_ejecucion → enviado → confirmado`; rechazo, fallo o resultado desconocido explícitos | Solicitante distinto de aprobador; cuenta versionada; evidencia externa | `ReembolsoSolicitado`, `ReembolsoAprobado`, `ReembolsoInstruido`, `ReembolsoConfirmado` |
| Lote | `borrador → pendiente_aprobacion → aprobado → instruido → parcialmente_conciliado/conciliado`; cancelación antes de instrucción | Finanzas prepara; aprobador independiente; MFA; resultado por línea | `LiquidacionAprobada`, `LiquidacionInstruida`, `LiquidacionConciliada` |

Reglas adicionales:

- `aplicado` es una situación derivada del pago: sin aplicar, parcial o totalmente aplicado. No reemplaza su estado de confirmación.
- Una confirmación de reserva solo procede con compromisos propios vigentes y condiciones satisfechas.
- Si llega dinero después de perder el compromiso, se registra el hecho monetario y una excepción; no se recupera la unidad.
- La solicitud de cancelación no libera automáticamente inventario ni devuelve fondos.
- Perder o reabrir una oportunidad no cancela reserva, pago o comisión.
- Un contracargo puede originar revisión comercial y ajuste de comisión; no transforma automáticamente una unidad vendida en disponible.
- Los hitos parciales de comisión se representan como obligaciones separadas; un pago parcial no convierte toda la comisión en pagada.
- Las transiciones registran actor/fuente, versión anterior, evidencia, motivo y correlación.

Fundamento: spec maestra `:3869`, `:3903`, `:3917`, `:3926`, `:3934`, `:3963`.

## 5. Datos

### 5.1 Convenciones y decisión de aislamiento

Existe una contradicción bloqueante:

- Decisión #5: instalación única sin multiempresa, `docs/contexto/decisiones.md:24`.
- Spec maestra: tenant, UUID y FKs con tenant, `.viltrum/vre-os/fuentes/especificacion-maestra-v1.txt:4221`.

**No se resuelve añadiendo un tenant constante y declarando aislamiento.**

La propuesta compatible conserva PK internas enteras y añade `public_id uuid NOT NULL UNIQUE` en entidades expuestas. Ya existe ese patrón en `schema.ts:364`, `:375`. Requiere ADR aceptado frente al modelo lógico de UUID de la spec.

Antes de construir debe elegirse:

| Alternativa | Consecuencia obligatoria |
|---|---|
| Instalación única | Aceptar expresamente el alcance y la desviación de multiempresa; no presentar QA entre tenants como superado |
| Multiempresa | Prerrequisito de tenant real, pertenencias, contexto autorizado y FKs compuestas en padres y nuevas entidades; no basta modificar M40 |

Las tablas siguientes describen el núcleo compatible. Si se aprueba multiempresa, toda unicidad y relación empresarial incorpora el tenant correspondiente.

Convenciones propuestas:

- `serial/integer` para identidad interna compatible; UUID público no secuencial.
- `bigint({ mode: "bigint" })` para centavos.
- Moneda única de dominio: `USD | DOP`; escala contractual de dos decimales.
- API transporta centavos como cadenas enteras; cálculos sin conversión a `Number`.
- `date` para vencimiento civil; `timestamptz` para instantes.
- `row_version integer NOT NULL DEFAULT 1 CHECK > 0`.
- Autoría y fechas en filas mutables; hechos inmutables registran autor/fuente y fecha.
- FKs nuevas `RESTRICT`; ningún borrado en cascada de historia financiera.
- Índices sobre FKs usadas en consultas, bloqueos y filtros.
- Toda tabla nueva lleva `.enableRLS()`.
- `deleted_at` archiva borradores o configuración; no libera exclusividad ni elimina hechos contables.

#### Conversión monetaria canónica (H-m01)

PROPUESTA de helper único en `src/application/compartido/dinero.ts`, reutilizado por entradas/DTO nuevos y por el puente `b2l`. El dominio conserva `bigint`; JSON contiene cadenas decimales. Contrato Zod base para centavos no negativos:

```ts
const CentavosNoNegativos = z.string()
  .max(19)
  .regex(/^(0|[1-9]\d*)$/)
  .transform(BigInt)
  .pipe(z.bigint().min(0n).max(9223372036854775807n));
```

Es una especificación de contrato, sin implementación en esta entrega. Positivos refinan `> 0n`; ajustes usan el helper firmado común, rechazan `-0` y ceros iniciales y comprueban el rango PostgreSQL `[-9223372036854775808, 9223372036854775807]`. No se acepta exponente, fracción, espacio ni coerción desde `number`. Serialización explícita con `.toString()`; nunca JSON directo de `bigint`. [Zod documenta validación encadenada y transformaciones](https://zod.dev/api#transforms).

El legado mantiene `mode: "number"` en `commissions` (`schema.ts:918`, `:922`, `:932`, `:935`). El adaptador de adopción lee centavos originales como texto SQL y usa el helper; un valor ya convertido a `number` inseguro se rechaza y se relee, no se reconstruye. Un puente que deba conservar un DTO antiguo numérico verifica rango seguro antes de convertir y falla explícitamente fuera de él; ese DTO nunca entra en cálculos nuevos. `b2l` revisa cada consumidor afectado sin mezclar tipos en un mismo contrato. TX-45 cubre límites, rechazo de coerciones y un valor mayor que el entero seguro de JavaScript.

### 5.2 Tablas propuestas

Las columnas comunes anteriores se omiten en la tabla.

| Tabla | Columnas principales | Restricciones |
|---|---|---|
| `transaction_commands` | actor, operación, clave UUID, `request_hash`, estado, código HTTP, resultado mínimo, fecha de terminación | UNIQUE(actor, operación, clave); incluir tenant si aplica |
| `holds` | negocio FK, titular FK, estado, `expires_at`, versión de política, extensiones, motivo | Vencimiento posterior a creación; índices por titular/estado/vencimiento y negocio |
| `hold_units` | hold FK, unidad FK, proyecto/código normalizado congelados, versión de precio, importe, moneda, rol de componente | UNIQUE(hold, unidad); precio versionado aprobado |
| `reservations` | negocio FK, hold origen opcional, estado, moneda, total pactado, depósito requerido, versión/snapshot de condiciones, evidencia de confirmación | Importes no negativos; confirmación exige datos y evidencia completos |
| `reservation_parties` | reserva FK, contacto FK o referencia jurídica válida, rol, evidencia de representación | Titular/representante diferenciados; comprador validado antes de confirmar |
| `reservation_units` | reserva FK, unidad FK, proyecto/código congelados, precio pactado, moneda, rol | UNIQUE(reserva, unidad); suma de componentes y ajustes coincide con total |
| `inventory_commitments` | unidad FK, identidad durable, tipo, estado, vencimiento, dueño tipado, resolución | Un compromiso activo por unidad e identidad durable |
| `payment_plan_templates` | proyecto opcional, nombre, versión, estado, calendario tipado, aprobación | Unicidad de versión; distinguir globales con proyecto NULL; usada implica versionar |
| `payment_plans` | reserva FK o venta legacy FK, moneda, estado, versión activa | Exactamente un origen; UNIQUE de origen; versión activa pertenece al mismo plan |
| `payment_plan_versions` | plan FK, número, total, acuerdo/documento, versión anterior, estado | UNIQUE(plan, número); contenido inmutable tras acuerdo |
| `payment_installments` | versión FK, secuencia, concepto, vencimiento, importe, hito opcional | UNIQUE(versión, secuencia); importe positivo; suma exacta por versión |
| `payments` | reserva/venta legacy, pagador, medio de pago FK, conexión/proveedor, ID externo, importe, moneda, estado, fechas | Importe positivo; UNIQUE(conexión, ID externo) cuando exista |
| `payment_events` | pago FK, conexión, ID de evento, tipo, hash, fecha efectiva, fuente | UNIQUE(conexión, evento externo); append-only |
| `payment_allocations` | pago FK, cuota FK, importe fuente, importe aplicado, monedas, tasa snapshot opcional, evento origen, reverso referenciado | Aplicaciones y compensaciones inmutables; dedupe por operación/línea |
| `allocation_carryforwards` | aplicación origen FK, cuota destino FK, versión destino, importe, compensación referenciada | Traslado de crédito entre calendarios; no constituye otro ingreso |
| `fx_rates` | base, cotizada, tasa `numeric(24,12)`, fuente, vigencia | Tasa positiva; monedas distintas; referencia histórica congelada |
| `bank_imports` | cuenta lógica, hash de archivo, formato/mapeo, autor, estado | Reimportación identificable; diagnóstico por fila |
| `bank_transactions` | importación/fila, cuenta, referencia, fechas, dirección, bruto, comisión, neto, moneda, hash | Movimiento original inmutable; UNIQUE(importación, fila) |
| `reconciliation_cases` | pago/movimiento/reserva relacionados, motivo, estado, responsable, decisión/evidencia | Al menos una referencia; resolución atribuible |
| `payment_reversals` | pago, importe, moneda, evento origen, motivo, referencia de compensación | Lock exclusivo del pago antes del agregado; límite compartido con reembolsos según §6.6 |
| `refunds` | pago, importe, moneda, beneficiario/version, aprobación, estado, clave de ejecución, referencia externa | Reserva de importe elegible bajo lock del pago; ejecución idempotente; destino ligado a aprobación |
| `commission_rules` | nombre, ámbito, versión activa | Catálogo administrable versionado |
| `commission_rule_versions` | regla, número, base, fórmula tipada, devengo, exigibilidad, reverso, vigencia, aprobación | UNIQUE(regla, versión); inmutable al usarse |
| `commission_agreements` | negocio/reserva, versión, regla congelada, base/exclusiones, fondo, condiciones, evidencia | UNIQUE(negocio, versión); una versión aplicable explícita |
| `commission_splits` | acuerdo, beneficiario, rol, participación exacta | Participaciones dentro del fondo aprobado; residual identificado |
| `commission_entries` | acuerdo, beneficiario, hito, evento origen, base, bruto, moneda, estado proyectado | UNIQUE(acuerdo, beneficiario, instancia de hito); importes congelados al devengar |
| `commission_events` | entrada, transición, evidencia, actor, fecha, evento origen | Append-only; sin doble transición por el mismo hecho |
| `commission_adjustments` | entrada, importe firmado, motivo, aprobación, reverso opcional | Compensaciones; no sobrescribir el original |
| `beneficiary_accounts` | beneficiario, referencia bancaria protegida, versión, verificador y fecha | Cambio exige reverificación; información excluida de DTO comercial |
| `payout_batches` | moneda, estado, aprobación, clave de ejecución, total neto | UNIQUE(clave de ejecución); total calculado desde líneas |
| `payout_lines` | lote, obligación/hito, bruto, retención, ajuste, neto, versión de cuenta, referencia externa | Una línea activa por obligación exigible; neto exacto |
| `legacy_commission_links` | comisión antigua, rol de beneficiario, entrada nueva opcional, estado de migración, evidencia | UNIQUE(comisión antigua, rol) |
| `financial_approval_requests` | objeto tipado, solicitante, versión/hash del contenido, decisión, aprobador, caducidad | Autor distinto; cambio del contenido invalida aprobación |

`financial_approval_requests` es un contrato lógico: D11 debe decidir si reutiliza una capacidad de aprobación existente que satisfaga estas invariantes. No se crea otro motor de aprobaciones por defecto.

Las referencias a personas jurídicas, versiones de precio, concesiones, documentos e hitos requieren contratos reales de sus módulos. Su disponibilidad efectiva es **NO VERIFICADO**; no se sustituyen por IDs sin FK ni JSON libre.

### 5.3 Compromisos e identidad durable

No usar `owner_record_id` polimórfico sin integridad referencial.

Propuesta:

- `kind=hold`: solo `hold_id`; FK compuesta `(hold_id, unit_id)` a `hold_units`.
- `kind=reservation`: solo `reservation_unit_id`; FK compuesta a la misma unidad.
- `kind=sale`: solo `unit_sale_id`; FK compuesta a la misma unidad.
- CHECK de combinación exclusiva; vencimiento obligatorio para hold.
- Añadir UNIQUE compuestos auxiliares necesarios para esas FKs, sin retirar los UNIQUE existentes de `unit_sales`.

Índices:

```sql
UNIQUE (unit_id)
WHERE status = 'active'

UNIQUE (project_id, unit_code_normalized)
WHERE status = 'active'
```

Con multiempresa aprobado, ambos incluyen `tenant_id`.

El predicado no contiene `now()` ni excluye filas por `deleted_at`. La vigencia se resuelve dentro de la transacción. PostgreSQL admite [unicidad parcial](https://www.postgresql.org/docs/current/indexes-partial.html); su documentación exige funciones inmutables en definiciones de índice, incompatible con un predicado dependiente del reloj: [CREATE INDEX](https://www.postgresql.org/docs/15/sql-createindex.html).

Transferir hold a reserva cierra el compromiso anterior y crea el nuevo en el mismo commit. Un control diferido verifica correspondencia completa entre dueño vigente y unidades comprometidas.

Cambiar código/proyecto, borrar y recrear una unidad no permite eludir su identidad durable. Se conserva `normalizarCodigoUnidad`, `src/domain/unidades.ts:4`, y la protección de `unit_sales`.

### 5.4 Dinero, libro y aplicaciones

**Dinero comercial:** centavos enteros con moneda.  
**Ledger:** `NUMERIC` exacto, con moneda de cuenta y escala validada.

El adaptador convierte `"12345"` centavos a decimal exacto, sin pasar por float. Para USD/DOP rechaza fracciones inferiores al centavo antes de cualquier coerción que pudiera redondearlas.

El PORT del libro debe conservar:

- Cuentas con moneda.
- Movimientos con clave idempotente y origen.
- Entradas balanceadas por movimiento y moneda.
- Referencias a compensaciones.
- Imposibilidad de alterar importes contabilizados.
- Misma conexión/transacción que el hecho de negocio.

Los nombres físicos y restricciones internas del PORT son **NO VERIFICADO**, pendientes de PoC. La documentación de [Dinero.js](https://www.dinerojs.com/core-concepts/amount) trabaja con unidades monetarias menores; el adaptador debe demostrar que usa un calculador compatible con el rango BigInt requerido.

Invariantes:

1. `Σ cuotas = total de la versión acordada`.
2. Depósito ya pagado se aplica a una obligación del plan; no se suma otra vez al total.
3. `Σ aplicaciones netas en moneda fuente ≤ pago confirmado neto elegible`.
4. `Σ aplicaciones netas a cuota ≤ importe de cuota`.
5. El sobrepago permanece como crédito no aplicado.
6. Conversión exige tasa pactada congelada, dirección base/cotizada y criterio de redondeo.
7. El redondeo residual de cuotas se asigna a la última cuota según política aprobada.
8. Reparto de comisión utiliza orden determinista de beneficiarios; el residual queda explicado.
9. Reverso y reembolso no descuentan dos veces el mismo hecho monetario.
10. Comisiones del procesador se registran separadas del pago del comprador.
11. Saldos en USD y DOP se presentan separados; la tasa de reporte no modifica contratos.

Las sumas entre filas no se implementan como CHECK ordinario. Procedimientos/controles SQL bloquean el padre antes de modificar hijos y verifican agregados al commit. El protocolo debe proteger también operaciones SQL directas autorizadas.

### 5.5 Reestructuración sin duplicar deuda

Cada nueva versión conserva el total contractual y un calendario que suma ese total. Las versiones anteriores quedan históricas.

Las aplicaciones originales permanecen vinculadas a sus cuotas originales. `allocation_carryforwards` reconoce qué parte de ese crédito se imputa al calendario nuevo:

- No crea pago, ingreso ni segundo movimiento monetario.
- No puede trasladar más que la aplicación neta de origen.
- No puede exceder la cuota destino.
- La consulta vigente cuenta aplicaciones directas de la versión activa más créditos trasladados; no suma saldos de versiones antiguas.
- Un reverso de aplicación origen genera compensaciones de sus créditos trasladados bajo los mismos bloqueos.
- Cambiar moneda o total requiere modificación contractual aprobada; no se trata como simple redistribución de fechas.

La política contractual para distribuir un reverso sobre el calendario vigente queda en Q40-06; no se inventan fechas ni penalidades.

### 5.6 RLS, permisos SQL y auditoría

El patrón actual declara RLS sin políticas públicas para tablas leídas por Drizzle: `docs/contexto/flujo-de-trabajo.md:173`. Eso no demuestra aislamiento del servidor.

Propuesta mínima:

- RLS habilitado en todas las tablas nuevas.
- Ningún acceso directo del navegador a tablas financieras.
- Revocar permisos innecesarios a `anon` y `authenticated`.
- Verificar rol SQL efectivo del servidor y worker; no asumir que RLS protege a un propietario o rol con bypass.
- Roles de ejecución acotados; prohibir modificación/borrado/truncado de hechos contabilizados.
- Vistas con `security_invoker=true`; funciones privilegiadas fuera de esquemas expuestos y con permisos explícitos.
- Si se aprueba multiempresa, políticas con contexto de pertenencia real y FKs de tenant.
- Nunca usar `created_by` como sustituto de titularidad comercial, beneficiario o pertenencia.

Deuda observada en R1 y recontrastada en archivo: `commissions` termina sin `.enableRLS()` en `src/infrastructure/db/schema.ts:953`. Eso no demuestra el estado de RLS en la base ejecutándose. D11 debe contrastar esquema/migraciones/rol SQL en su inventario y corregir la divergencia en su despacho de datos antes de incorporar el puente financiero; no se declara protegida por inferencia.

[Supabase distingue GRANT y RLS](https://supabase.com/docs/guides/database/postgres/row-level-security); la protección debe probarse por operación y rol.

Auditoría:

- Actor de sesión o identidad de sistema.
- Acción, objeto, versión, motivo, evidencia opaca y correlación.
- Valores anteriores/posteriores depurados.
- Sin documentos completos, datos bancarios completos ni secretos.
- Registro en la misma transacción del efecto.
- Protección append-only también mediante permisos SQL.

### 5.7 Migración y backfill

1. **Inventariar antes de DDL:** migraciones, conteos, huellas por tabla, relaciones, monedas y anomalías. Confirmar o corregir documentalmente la referencia de 184 negocios.
2. Usar migraciones nuevas posteriores al último número disponible. No editar `0004` ni `0005`; no reservar `0006` sin coordinación.
3. Añadir tablas/columnas sin cambiar IDs, importes ni estados originales.
4. Backfill de compromisos de venta únicamente desde filas reales de `unit_sales`, con procedencia.
5. Ganados sin venta durable: conservarlos y abrir saneamiento; no inventar unidad, reserva, plan ni deuda.
6. Preservar comisiones antiguas mediante enlaces/snapshot de procedencia. No recalcular con reglas nuevas.
7. `pending` antiguo no prueba devengo; `approved` no prueba exigibilidad; `paid` no prueba conciliación.
8. Mostrar estados heredados con procedencia y advertencia “evidencia no verificada” cuando corresponda. Una apertura contable requiere validación financiera.
9. Leer centavos heredados como texto/BigInt; detectar moneda desconocida, negativos y desbordamientos.
10. Adaptar cierre y edición de unidades antes de activar holds. Cada escritor debe respetar la misma barrera.
11. Una autoridad de escritura por operación migrada. La API antigua delega en el servicio nuevo o rechaza la mutación; no mantiene un segundo camino.
12. Ensayar migrador oficial sobre copia aislada poblada y control sintético; cotejar huellas, huérfanos, exclusividad y sumas.
13. Corte gradual con bandera de activación auditada. Lecturas existentes siguen disponibles durante expansión.
14. Antes de hechos nuevos puede revertirse la activación. Después, correcciones hacia delante; no eliminar tablas ni restaurar una copia que provoque reenvíos financieros.

**Venta cancelada:** `unit_sales` protege una venta durable única por unidad. M40 no borra esa fila para permitir reventa. La rescisión posterior a venta y una eventual nueva venta requieren ADR y modelo histórico aprobado; hasta resolverlo, la unidad no se presenta como disponible.

## 6. Integraciones y puertos

### 6.0 Límites y contratos propios

#### Responsabilidades

| Componente | Responsabilidad | Depende de | Expone | Desconoce |
|---|---|---|---|---|
| Compromisos | Proteger exclusividad de inventario | Identidad de unidad, autorización efectiva | Adquirir, transferir, liberar, consumir | Banco, comisión, interfaz |
| Reservas | Conservar condiciones pactadas | Compromisos, evidencia contractual | Crear, confirmar, modificar, cancelar | SDK de pagos, transporte |
| Planes | Representar obligaciones de cobro | Reserva, acuerdo versionado | Simular, acordar, reestructurar | Conciliación bancaria |
| Cobros | Reconocer hechos monetarios | Evidencia verificada, libro | Confirmar, aplicar, compensar | Presentación, reglas comerciales de comisión |
| Conciliación | Explicar correspondencia financiera | Cobros, movimientos bancarios | Proponer correspondencia, resolver diferencias | Disponibilidad como decisión propia |
| Comisiones | Reconocer obligaciones al beneficiario | Acuerdo congelado, hechos elegibles | Proyectar, devengar, hacer exigible, ajustar | Pasarela concreta |
| Liquidaciones | Ejecutar obligaciones exigibles | Comisiones, cuentas verificadas | Preparar, aprobar, instruir, conciliar | Captación, Kanban |

Dependencias sin ciclo propuesto:

```text
API / consultas / interfaz → aplicación → dominio
                                   ↓ puertos
                             adaptadores SQL / externos

Reservas → Compromisos
Planes → referencia de Reserva
Cobros → referencia de obligación + Libro
Conciliación → Cobros
Comisiones ← hechos elegibles mediante consumidor idempotente
Liquidaciones → Comisiones
```

Esquema textual de diseño; no acredita una validación Archify.

#### Contratos propios

| Puerto | Necesidad del negocio | Adaptador propuesto |
|---|---|---|
| `UnidadTransaccionalPort` | Ejecutar repositorios, libro, auditoría y outbox atómicamente | Drizzle/PostgreSQL |
| `CompromisosPort` | Bloquear recursos, resolver vigencia, adquirir paquete | Repositorio SQL |
| `PrecioAprobadoPort` | Resolver versión, vigencia y condiciones autorizadas | Catálogo/versiones del CRM |
| `ConcesionesPort` | Verificar derechos efectivos en el instante del comando | Autorización del CRM |
| `LibroPort` | Registrar movimientos balanceados, idempotentes, compensatorios | PORT de pgledger sujeto a PoC |
| `DineroPort` | Repartir y redondear importes exactos | Dinero.js con aritmética entera |
| `SeleccionReglasPort` | Seleccionar versión aplicable con explicación | ZEN |
| `ProveedorPagosPort` | Verificar eventos, consultar operación, ejecutar devolución | Proveedor todavía por definir |
| `ExtractosPort` | Interpretar filas con diagnóstico | Papa Parse |
| `TrabajosPort` | Programar ejecución durable | pg-boss sujeto a PoC |
| `EvidenciasPort` | Resolver acceso a documento privado aprobado | Almacenamiento existente |
| `AutenticacionReforzadaPort` | Acreditar MFA vigente para operaciones privilegiadas | Adaptador de identidad |
| `EventosFinancierosPort` | Registrar evento y entregas pendientes | Outbox existente ampliado |

Dominio y aplicación no importan Dinero.js, ZEN, pg-boss, clientes bancarios ni Drizzle. La composición selecciona adaptadores; la configuración nueva se declara exclusivamente en `src/infrastructure/env.ts`.

La selección procede del expediente D21: `D21-ensamblaje-oss.md:41`, `:42`, `:103`, `:171`. **No acredita instalación ni integración.** El repositorio de [pgledger](https://github.com/pgr0ss/pgledger) documenta un libro de doble partida sobre PostgreSQL; la PoC debe demostrar su adaptación al CRM.

#### PoC bloqueantes

1. **Ledger:** misma conexión y transacción que el cobro; rollback conjunto; escala USD/DOP; concurrencia; idempotencia; compensaciones; permisos SQL; prohibición de alterar entradas.
2. **Cola:** dos workers, caída entre envío y confirmación, redrive, duplicados y entrega a varios consumidores.
3. **Dinero/reglas:** BigInt, reparto exacto, redondeo negativo, selección determinista y sustitución por un falso.

Si la PoC del ledger falla, no se confirma dinero con una actualización provisional seguida de contabilización asíncrona. La alternativa vuelve a D21/D03. Holds y borradores pueden avanzar solo mediante ficha aprobada cuyo alcance excluya dinero.

### 6.1 Convenciones API y Zod

Rutas Next.js bajo `src/app/api/**`; sin importaciones directas de tablas desde route handlers.

Para cada ruta autenticada:

1. `requireActor`.
2. `requireScope` o `requireFullScope` antes de tocar datos.
3. Resolver ID público y alcance con `visibleRows`/`reaches`.
4. Validación Zod estricta.
5. Entrada campo por campo.
6. Caso de uso transaccional.
7. DTO autorizado.

Fuentes existentes: `src/domain/rbac.ts:93`, `:114`; `src/infrastructure/rbac-filter.ts:48`; patrón de ruta en `src/app/api/comisiones/[id]/route.ts:41`.

Tipos de entrada propuestos:

| Tipo | Validación |
|---|---|
| ID público | UUID |
| `expectedVersion` | Entero positivo |
| Centavos positivos | Cadena decimal canónica, sin exponente ni fracción; rango de `bigint` PostgreSQL |
| Ajuste firmado | Cadena entera canónica con signo permitido y motivo |
| Moneda | Enum central USD/DOP |
| Fecha civil | Fecha real ISO, no solo regex |
| Motivo | Texto recortado no vacío; límite técnico explícito en esquema |
| Cuotas | Secuencias únicas, importes positivos, vencimientos válidos, límite configurado |
| Referencias de evidencia | UUID de objeto accesible y apto para el propósito |
| Líneas de aplicación | Sin duplicados; moneda/tasa y suma verificadas en servidor |

Cliente y servidor usan el mismo esquema de forma; el dominio revalida invariantes; la base impone restricciones persistentes.

Códigos:

- `201`: recurso o comando persistido.
- `200`: consulta o acción concluida sobre recurso existente.
- `202`: evidencia/comando externo recibido de forma durable, pendiente de procesamiento.
- `400`: JSON o cabecera malformados.
- `401/403`: sesión o acción no permitida.
- `404`: recurso inexistente o fuera de alcance.
- `409`: versión, compromiso o idempotencia en conflicto.
- `422`: condición de negocio incumplida, con errores por campo.
- `429`: cuota o protección antiacaparamiento.
- `503`: dependencia temporalmente no disponible.

Error: `{code, message, field_errors?, retryable, correlation_id}`. No incluir SQL ni identidad del comprador que ocupa una unidad.

### 6.2 Matriz única de facultades

Recursos nuevos propuestos: `holds`, `reservations`, `payment_plans`, `payments`, `payment_verifications`, `reconciliations`, `financial_approvals`, `refunds`, `commission_rules`, `commission_entries`, `payouts`, `financial_jobs`.

Se conservan las acciones centrales existentes `view/create/edit/import/export`; no se inventa una acción que el RBAC no admita. Catálogo actual: `src/domain/catalogs.ts:19`, `:36`.

| Capacidad | Broker | Asistente | Coordinador | Finanzas | Legal/aprobador | Auditor |
|---|---|---|---|---|---|---|
| Hold | Crear/ver propios con concesión | Proponer; sin efecto directo | Gestionar según concesión | Según permiso | Extensión excepcional si facultado | Leer autorizado |
| Reserva | Preparar/ver propias | Proponer | Gestionar | Verificar condición financiera | Revisar condición contractual | Leer |
| Plan/saldo detallado | Solo DTO expresamente autorizado | Sin ampliación automática | Según permiso | Crear/consultar | Lectura necesaria | Leer |
| Evidencia de pago | Presentar en expediente propio | Proponer carga autorizada | Presentar | Revisar | Lectura necesaria | Leer restringido |
| Confirmar/aplicar pago | No | No | No por ser coordinador | Permiso específico; sin autoverificación | Segundo control cuando corresponda | No |
| Conciliar/importar banco | No | No | No | Sí, según alcance | Segundo control | Leer |
| Reembolso | Solicitar si autorizado | Proponer | Solicitar | Preparar | Aprobar independientemente | Leer |
| Comisión propia | Solo su importe/condiciones aceptadas | Sin lectura financiera nueva | Según permiso | Libro autorizado | Aprobar según facultad | Leer |
| Reglas/splits de terceros | No | No | No por defecto | Según permiso | Según facultad | Leer autorizado |
| Liquidación | Consultar su resultado | No | No | Preparar/instruir según permiso | Aprobar con MFA | Leer |
| Exportación | DTO propio autorizado | Sin concesión implícita | Según permiso | Permiso `export` específico | Según permiso | Según permiso |

El rol administrador no elimina separación de funciones. La decisión #47 conserva propuestas del asistente, autor distinto, un nivel y caducidad a siete días: `docs/contexto/decisiones.md:311`.

La identidad de sistema no recibe acceso humano general: invoca casos de uso acotados y registra su identidad. No se expone una ruta de barrido masivo sin permiso.

#### Alcance relacional obligatorio (H-M04)

No se añade `broker_id` duplicado a los hechos financieros. Se centraliza la relación autorizada en adaptadores nuevos de `src/infrastructure/rbac-filter.ts`: `visibleHolds`, `visibleReservas`, `visiblePlanes` y `visiblePagos`. Son PROPUESTA; hoy solo existen los filtros por columna (`rbac-filter.ts:23`, `:48`).

| Entidad | Camino obligatorio al responsable autorizado |
|---|---|
| Hold | `holds.deal_id → deals.id → visibleRows(actor, scope, deals.brokerId, deals.deletedAt)`; titular y concesión se comprueban además para mutar |
| Reserva | `reservations.deal_id → deals`, con el mismo filtro central |
| Plan | Origen exclusivo: reserva → negocio, o `unit_sales.deal_id → deals` en legado |
| Pago | Su origen exclusivo reserva/venta → negocio; una referencia a pagador no concede lectura |
| Cuotas, aplicaciones, reversos y reembolsos | EXISTS del padre plan/pago autorizado; sin consulta independiente que omita el padre |

Los helpers producen JOIN/EXISTS con aliases explícitos y reutilizan `visibleRows`; ningún repositorio redacta su propio filtro por broker. Operan en listas, detalle por UUID, agregados, RSC, CSV/PDF y lectura previa a mutación. El detalle se relee con ese predicado dentro de la transacción; `reaches` usa la misma relación ya autorizada. Origen faltante, ambiguo o inaccesible devuelve 404 sin revelar existencia. Un `own` sobre una entidad sin responsable directo nunca se degrada a `all`.

`all` solo amplía el universo permitido por ese recurso; no elimina permiso de acción, pertenencia aprobada en Q40-01 ni restricciones del DTO. `team` conserva la semántica segura vigente de G04, sin inventar equipos. La atribución histórica del beneficiario no sustituye al responsable del negocio; la consulta de comisión propia requiere la facultad específica de §6.2. Q40-04 sigue pendiente y no se habilita una lectura financiera por inferencia.

Prerrequisito: `b1j` revisada antes de consultas o comandos `b2a`–`b2h`. TX-43 y las guardas por ID deben demostrar dos brokers en la misma instalación, `own/team/none`, relaciones legacy, listas/totales/exportación y endpoints anidados. RLS por sí sola no acredita este filtro del servidor.

### 6.3 Rutas propuestas

Todas las mutaciones de usuario requieren `Idempotency-Key`; las que alteran un recurso requieren versión esperada.

| Ruta | Entrada principal | Permiso | Resultado/evento |
|---|---|---|---|
| `POST /api/holds` | negocio, unidades/anexos, versiones de precio, motivo | `holds:create:own/all` + concesión | 201, `HoldCreado` |
| `POST /api/holds/[id]/extensiones` | duración solicitada, motivo, aprobación, versión | `holds:edit` + facultad de extensión | 200, `HoldExtendido` |
| `POST /api/holds/[id]/cancelacion` | motivo, versión | `holds:edit` sobre dueño autorizado | 200, `HoldCancelado` |
| `POST /api/reservas` | hold, titulares, condiciones, importes, evidencia | `reservations:create` | 201, `ReservaCreada` |
| `POST /api/reservas/[id]/confirmacion` | evidencia, versión de condiciones y recurso | `reservations:edit` + gate financiero/legal | 200, `ReservaConfirmada` |
| `POST /api/reservas/[id]/cambio-unidad` | paquete destino, precios, aprobación, versión | `reservations:edit` | 200, modificación versionada |
| `POST /api/reservas/[id]/cancelaciones` | motivo, fundamento, escenario | `reservations:edit` | 201, expediente |
| `POST /api/cobros/planes` | reserva, plantilla/version, calendario, acuerdo | `payment_plans:create` | 201, `PlanAcordado` si firmado |
| `POST /api/cobros/planes/[id]/reestructuraciones` | calendario, acuerdo, versión | `payment_plans:edit` | 201, `PlanReestructurado` |
| `POST /api/cobros/pagos` | origen, pagador, medio de pago, importe, moneda, evidencia | `payments:create` | 201 pendiente; sin cobro confirmado |
| `POST /api/cobros/pagos/[id]/verificacion` | evidencia, decisión, motivo, versión | `payment_verifications:edit` | 200, confirmación/rechazo |
| `POST /api/cobros/pagos/[id]/aplicaciones` | cuotas/importes, tasa pactada si aplica | `payments:edit` | 201, aplicación |
| `POST /api/cobros/pagos/[id]/reversos` | importe, causa, evidencia/aprobación | `payments:edit` + control requerido | 201, compensación |
| `POST /api/finanzas/extractos` | archivo privado y mapeo aprobado | `reconciliations:import` | 202, lote con diagnóstico |
| `POST /api/finanzas/conciliaciones/[id]/resoluciones` | correspondencias, decisión, evidencia, versión | `reconciliations:edit` | 200, resolución |
| `POST /api/finanzas/reembolsos` | pago, importe, cuenta/version, fundamento | `refunds:create` | 201 solicitado |
| `POST /api/finanzas/aprobaciones/[id]/resolucion` | decisión, motivo, hash/versión | `financial_approvals:edit:all` | 200, decisión única |
| `POST /api/finanzas/reembolsos/[id]/ejecucion` | versión y prueba MFA cuando corresponda | `refunds:edit` | 202, instrucción durable |
| `POST /api/comisiones/reglas` | ámbito, fórmula tipada, hitos, vigencia | `commission_rules:create:all` | 201 borrador |
| `POST /api/comisiones/reglas/[id]/versiones` | nueva versión y evidencia | `commission_rules:edit:all` | 201 versión |
| `POST /api/comisiones/entradas/[id]/ajustes` | importe firmado, motivo, aprobación | `commission_entries:edit` | 201 ajuste |
| `POST /api/comisiones/liquidaciones` | obligaciones exigibles de una moneda | `payouts:create` | 201 lote |
| `POST /api/comisiones/liquidaciones/[id]/ejecucion` | versión aprobada y MFA | `payouts:edit` | 202 instrucción |
| `POST /api/comisiones/liquidaciones/[id]/conciliacion` | referencias y evidencia por línea | `payouts:edit` | 200 parcial/conciliado |
| `POST /api/webhooks/pagos/[conexion]` | bytes originales, firma y evento | Adaptador público expresamente registrado | 202 tras inbox durable |

Consultas bajo las mismas raíces: colecciones con cursor, límite y orden estable; detalle por UUID; estado de cuenta; exportación autorizada. Agregados, listas, CSV y PDF usan el mismo universo autorizado.

La ruta webhook no usa un permiso de usuario ficticio. Se declara como excepción pública protegida en la guarda existente, con firma/identidad, protección de replay y conexión resuelta por servidor. El payload no elige tenant ni credenciales.

Proveedor, formato de firma y límites de archivos son **NO VERIFICADO**: bloquean habilitar ese adaptador, no autorizan una ruta sin protección.

### 6.4 Idempotencia

- Clave UUID por intención; reintento conserva clave y contenido.
- Hash calculado en servidor sobre entrada canónica, operación y recurso.
- UNIQUE por actor, operación y clave; tenant si aplica.
- Duplicado concurrente espera el resultado del primero.
- Mismo hash devuelve código y resultado mínimo originales.
- Hash distinto responde 409.
- El replay revalida permisos actuales antes de devolver referencias.
- Eventos externos usan dedupe independiente por conexión/evento y conexión/pago.
- ID de evento repetido con hash distinto abre conflicto; no sobrescribe evidencia.
- Resultados, efectos, auditoría y outbox se confirman juntos.
- Un UNIQUE dentro de una transacción abortada exige rollback/savepoint y recuperación; no se continúa usando una transacción fallida.
- Conflictos de negocio persistibles conservan su resultado idempotente; fallos transitorios sin commit permiten reintento seguro.
- Las claves financieras no se reciclan al vencer una caché. Retención de resultado/tombstone se decide en Q40-09.

### 6.5 FL-04: transacción de hold y reserva

Orden común de bloqueo obligatorio para la implementación propuesta:

**comando → advisory lock de cupo cuando aplique → autorización/concesión estable → negocios por ID ASC → unidades por ID ASC → compromisos → reserva/plan → pagos por ID ASC → cuotas por ID ASC → cuentas del libro por ID ASC → proyecciones comerciales heredadas.**

Todos los escritores respetan este orden, incluido cierre, cambio de unidad, jobs y edición administrativa. Cada grupo de filas se bloquea en orden ascendente de su PK inmutable. Las proyecciones heredadas (metas, perfil, comisión) se actualizan después de adquirir los recursos transaccionales; no pueden adquirir luego una guardia de cupo. `b1i` inventaría también locks implícitos de UPDATE/FK/triggers y revisa el protocolo completo. PostgreSQL documenta [orden consistente y advisory locks transaccionales](https://www.postgresql.org/docs/15/explicit-locking.html#ADVISORY-LOCKS).

**Guardia de cupo (H-B01):** `CompromisosPort` expone la exclusión por titular; el adaptador usa `SELECT pg_advisory_xact_lock(:namespace_hold_quota, :titular_id)` en la misma conexión/transacción. D11 registra un namespace entero exclusivo y único antes del despacho; el titular es el ID interno entero, no un hash UUID truncado. Si Q40-01 adopta multiempresa, se revisa el espacio de claves para representar pertenencia sin colisiones. Se libera al commit/rollback. Quedan prohibidos `pg_advisory_lock` de sesión y cualquier `FOR UPDATE`/UPDATE de `users` o `broker_profiles` para contar o serializar holds. La guardia no modifica esas filas. Adquisición/extensión del mismo titular comparten clave; una reducción de cupo no toma la guardia tardíamente. La concesión usa su recurso propio de autorización, no el perfil comercial como mutex.

El cierre leído bloquea negocio (`cierre.ts:66`), unidad (`:89`) y actualiza perfil (`:168`; adaptador `repos/pipeline.ts:292`). `b1i` debe demostrar con TX-40 que hold y cierre no forman el ciclo unidad/perfil; declarar el advisory lock no sustituye esa prueba.

Secuencia:

1. Autenticar y comprobar permiso de acción.
2. Abrir unidad transaccional y adquirir/consultar el comando idempotente.
3. Para adquirir o extender holds, adquirir el advisory lock transaccional independiente del titular. Bloquear solo unidades no protege el cupo entre unidades diferentes.
4. Resolver/revalidar concesión y política efectiva; serializar con revocación.
5. Bloquear negocios, el paquete completo de unidades/anexos, sus compromisos y la reserva afectada, según el orden anterior. Descubrir referencias antes; releerlas bajo lock y abortar/reintentar si cambiaron, sin adquirir un recurso anterior fuera de orden.
6. **Después de que hayan retornado las adquisiciones de locks**, ejecutar una consulta SQL separada `SELECT clock_timestamp() AS effective_at` en esa misma transacción. Conservar esa muestra para resolver vigencia y calcular la nueva expiración. No evaluarla en el SELECT que todavía espera el lock. Si queda otra espera antes de decidir vigencia, volver a muestrear después. Se prohíben reloj cliente, `new Date()` previo al await, `now()`, `CURRENT_TIMESTAMP`, `transaction_timestamp()` y `statement_timestamp()` para decidir caducidad.
7. Resolver compromisos con `expires_at <= hora efectiva`; conservar historia y evento.
8. Comprobar venta durable y compromiso vigente.
9. Revalidar precio aprobado, versión de condiciones, ámbito, cuota y facultades.
10. Crear hold o transferir compromiso a reserva. El paquete se adquiere completo o no se adquiere.
11. Escribir resultado idempotente, auditoría y outbox.
12. Commit; solo entonces comunicar éxito.
13. Notificaciones y proyecciones externas se actualizan después mediante entregas durables.

Las operaciones que solo reducen cupo no adquieren tardíamente la guardia del titular después de otros bloqueos. El job selecciona candidatos y ejecuta el mismo comando; no introduce otro orden de locks.

**Cambio de unidad (H-M01):** reunir origen, destino y anexos, eliminar IDs duplicados y bloquear la unión por ID interno ascendente: `SELECT id FROM units WHERE id = ANY(:unit_ids) ORDER BY id ASC FOR UPDATE`. Se conserva esa secuencia aunque el usuario pase origen/destino en orden inverso. Las PK de ordenación no se modifican. Releer venta/compromiso de ambas partes bajo lock; si el destino falla, rollback conserva íntegramente el origen. TX-41 enfrenta swaps cruzados con dos conexiones y barreras.

**Reloj SQL (H-B02):** `expires_at <= effective_at` significa expirado; igualdad también vence. El adaptador de `CompromisosPort` obtiene `effective_at` exclusivamente con `clock_timestamp()` después de los locks, incluyendo el cierre que consume reserva propia, extensiones y jobs. No acepta un timestamp del llamador como autoridad. [PostgreSQL 15 distingue reloj real y tiempo de transacción](https://www.postgresql.org/docs/15/functions-datetime.html#FUNCTIONS-DATETIME-CURRENT). TX-04 fuerza BEGIN antes de la expiración y desbloqueo después: debe adquirir el recurso vencido, sin falso 409.

**Barrera de activación (H-B03):** `b1i` completa y revisada es prerrequisito bloqueante absoluto de `b2a` y `b2b`; mientras falte un escritor, no se despachan ni habilitan. El PATCH existente elimina la asignación arbitraria `cambios.status` (`route.ts:41`): cualquier transición de disponibilidad delega en `CompromisosPort` dentro de la misma transacción, con versión y locks. Si hay venta durable o compromiso activo ajeno, devuelve 409; un compromiso vencido solo se resuelve por el protocolo de caducidad. Creación, borrado lógico, edición de identidad, importadores/feed, cierre y jobs aplican la misma barrera. No se libera una venta durable por cambiar `units.status`. D00 exige inventario de escritores y TX-01/04/09/30/32/40/41 antes de liberar la dependencia.

La limpieza periódica no decide disponibilidad por sí sola: cada adquisición resuelve vigencia bajo bloqueo. Fundamento directo: spec maestra `:3836`, `:3861`.

### 6.6 Cobro, reverso y liquidación

**Confirmar/aplicar cobro:**

1. Verificar evidencia y autoridad; verificar origen externo antes de efectos.
2. Adquirir dedupe y bloqueos pertinentes.
3. Releer versión, estado, importe y moneda.
4. Reconocer hecho monetario y libro.
5. Aplicar solo hasta obligación elegible; resto como crédito.
6. Si no existe compromiso válido, abrir excepción sin adquirir inventario.
7. Guardar auditoría, resultado y eventos en el mismo commit.

**Reverso:**

- Referencia hecho original.
- Antes de consultar sumas o mutar hijos ejecuta `SELECT id FROM payments WHERE id = :payment_id FOR UPDATE`; varios pagos se bloquean por ID ASC. Adquiere antes los padres/planes del orden común, sin locks tardíos en sentido inverso.
- Bajo ese lock relee importe confirmado, reversos/contracargos y reembolsos con importe reservado/ejecutado. Comprueba el saldo elegible común, nunca sumas leídas antes de esperar. Confirmación, aplicación, reverso, solicitud/aprobación/ejecución de reembolso y su consumidor externo comparten este protocolo.
- Registra la compensación y los agregados del límite en la misma transacción. SQL directo autorizado usa el mismo procedimiento/trigger de bloqueo de padre; no basta un CHECK por fila.
- Registra movimiento compensatorio y deshace aplicaciones mediante entradas relacionadas.
- Reabre saldos derivados.
- Genera hechos para revisión/ajuste de comisión.
- Conserva pago, aplicación, conciliación y comisión anteriores.

**Reembolso (H-M02):** reservar importe elegible al aceptar la solicitud bajo el mismo `FOR UPDATE` del pago; revalidar al aprobar e instruir. Solicitudes no terminales con importe reservado cuentan contra el saldo aunque la transferencia esté pendiente o su resultado sea desconocido. Rechazo/cancelación comprobados liberan la reserva bajo ese lock. No hay red dentro de la transacción: se persiste instrucción idempotente/outbox, se ejecuta fuera y se confirma por inbox bajo el mismo lock. Un timeout no libera importe ni permite una segunda devolución. Si un reverso corresponde a un reembolso ya registrado, se enlaza el mismo hecho compensatorio y no se descuenta otra vez. Si hay contracargo externo incompatible con una devolución en curso, se conserva como evidencia y se abre excepción de conciliación, sin fingir saldo disponible. Q40-06 debe aprobar su resolución.

TX-42 prueba dos reversos parciales de 60.000 sobre pago de 100.000 centavos (una aceptación y un 409), dos reembolsos y la carrera mixta reverso/reembolso. El consumo más reservas pendientes no puede superar 100.000; un callback repetido no agrega otro consumo.

**Liquidación:**

- Selecciona únicamente obligaciones exigibles.
- Bloquea inclusiones activas para evitar doble lote.
- Congela líneas, cuentas verificadas, retenciones y hash aprobado.
- Cambiar importe, beneficiario, cuenta o retención invalida aprobación.
- Preparación, aprobación y ejecución respetan separación y MFA.
- Instrucción externa utiliza clave estable.
- Timeout deja resultado desconocido; consultar antes de reenviar.
- Exportación de archivo no marca pagado.
- Confirmación bancaria por línea permite lote parcialmente conciliado.
- Una obligación entra en “pagada” cuando se acredita su conciliación.

### 6.7 Outbox y ejecución externa

Ampliar el outbox mediante contrato compatible de I00:

- `aggregate_type`, `aggregate_version`, versión de esquema diferenciada.
- Contexto de tenant si se adopta.
- `outbox_deliveries`: evento, consumidor, estado, intentos, disponibilidad y error controlado.
- UNIQUE(evento, consumidor).
- Inbox del consumidor con dedupe equivalente.

`sent_at` actual no basta para representar entrega a varios destinos. Las filas históricas conservan su semántica comercial; no se reinterpretan como entrega financiera.

| Familia | Destino |
|---|---|
| Holds/reservas | Proyección autorizada de inventario, continuidad comercial, notificación permitida |
| Pago confirmado/reversado | Proyección de cartera, consumidor de comisiones, integración fiscal si existe |
| Comisión devengada/ajustada | Proyección financiera, bandeja del beneficiario |
| Lote/reembolso instruido | Adaptador de ejecución autorizado |
| Resultado externo | Inbox → comando financiero → nuevos eventos |

El payload general contiene referencias, versión y correlación; no documentos, cuentas completas ni datos personales innecesarios.

pg-boss ejecuta trabajos; PostgreSQL conserva autoridad de negocio. No sustituye al outbox ni a la idempotencia del efecto. Entrega al menos una vez, reintentos acotados, DLQ operable y redrive con permisos.

**Prerrequisito (H-M05):** I00 actualizado y aprobado, más `b1f` integrada y revisada antes de cualquier emisor nuevo, incluidos holds/reservas y jobs. `b1f` amplía `ENTITY_TYPES` y `AUDIT_ACTIONS` (`src/domain/catalogs.ts:61`, `:99`), el contrato `TIPOS_EVENTO_CRM` de `src/application/compartido/crm.ts` y su unión con el registro financiero único `eventos-financieros.ts`. Una migración explícita modifica `outbox_type_check` (`schema.ts:1175`) conservando los tres tipos históricos. `b2i` usa ese registro; no lo redefine en paralelo. Auditoría `entity_type/action` no tiene aquí un CHECK SQL demostrado: se requiere compatibilidad de tipado/validación; el aborto SQL confirmado corresponde al CHECK de `event_type`.

El registro enumera entidad, acción, tipo/versión y consumidor para cada transición emisora de §4.1/4.2; incluye también expiración, cambio de unidad, extracto, aplicación y reglas. No se habilita un emisor sin entrada compatible en catálogo, validadores, migración y consumidor aprobado. No se retira el CHECK ni se sustituye por texto libre. TX-44 inserta cada tipo nuevo más los históricos y rechaza un tipo desconocido; TX-28 exige rollback si falla auditoría/outbox. El filtro de tipos con consumidor se conserva y prueba con TX-29.

## 7. Métricas y reportes que alimenta

### Configuración única

| CFG | Tratamiento |
|---|---|
| 053–056 | Duración, cupo, extensión y autoridad sobre inventario externo |
| 057–060 | Depósito, gate de confirmación, pago tardío y cancelación |
| 061–064 | Plantilla, orden de aplicación, redondeo y mora |
| 065–068 | Revisión manual, devolución, FX y recordatorios |
| 069–076 | Base, tasa, devengo, exigibilidad, split, retención, reverso y ancla |

Fuentes: spec maestra `:3060`, `:3138`, `:3215`.

Los valores de piloto de la spec son propuestas, no políticas firmadas. No activar plantillas, depósitos, retenciones, mora o splits por copiar ejemplos.

Cada configuración efectiva guarda versión, ámbito y procedencia. Catálogo inactivo permanece referenciable en historia, pero no elegible para nuevas operaciones. Configuración crítica ausente devuelve 422 y genera señal operativa.

Se reutilizan `payment_methods` y `unit_inventory_states`. Motivos, tipos de excepción y plantillas administrables tienen fuente única en datos/configuración. Estados técnicos pertenecen al catálogo central tipado.

### Métricas

Por moneda y universo autorizado:

- Compromisos activos y próximos a vencer.
- Conflictos y caducidades resueltos.
- Reservas pendientes/confirmadas.
- Total contractual, aplicado, crédito y saldo.
- Cartera vencida por fecha civil.
- Diferencias sin conciliar.
- Reembolsos pendientes/desconocidos.
- Comisión esperada, devengada, exigible y pagada por separado.
- Obligaciones en lote, instruidas y conciliadas.
- Antigüedad del outbox por consumidor.

Cada cifra abre su lista explicativa. No sumar precio vendido, depósito y cobro como si fueran el mismo ingreso.

Un episodio de mora se abre cuando una cuota vigente pasa a vencida con saldo positivo; se cierra al quedar cubierta. Reverso que la reabre genera un episodio nuevo, con dedupe por cuota/episodio. Recordatorios se suspenden sobre importes pendientes de conciliación según política.

### Requisitos no funcionales

La spec propone 50 sesiones concurrentes, lecturas p95 <700 ms y hold p95 <1,5 s, sujetos a entorno y prueba: `:6294`, `:6298`, `:6304`.

Consecuencias propuestas:

- Transacciones breves, sin llamadas de red.
- Índices de compromiso y consultas paginadas.
- Importación/exportación y trabajos largos asíncronos.
- Métricas de espera de locks, errores y latencia.
- Pruebas con dataset documentado.
- Cero duplicación financiera o doble compromiso aunque empeore la latencia.

Disponibilidad propuesta 99,5 %, RPO ≤1 h y RTO ≤4 h son objetivos documentales, **NO VERIFICADO**: `:6308`.

Retención por clase, hardware, carga real y SLA aceptado: **NO VERIFICADO**.

Las respuestas financieras usan caché privada o `no-store`; no se aplica caché CDN pública a expedientes. La disponibilidad cacheada informa, nunca confirma.

## 8. Criterios de aceptación (verificables)

### 8.1 Escenarios y prueba exigida

| CA | Escenario y resultado exigido | Evidencia futura / QA |
|---|---|---|
| TX-01 | Dos solicitudes válidas, claves distintas, misma unidad libre: una 201 y otra 409; un compromiso | PostgreSQL con dos conexiones y barrera |
| TX-02 | 100 solicitudes autorizadas: máximo un compromiso; conflictos controlados | Carga reproducible; QA-006 |
| TX-03 | Unidad+parqueo compiten con otra solicitud por parqueo: paquete completo o rollback | BD; QA-007 |
| TX-04 | BEGIN antes de expirar, desbloqueo después: `clock_timestamp()` separado tras adquirir locks decide expirado; sin falso 409, también con reloj cliente atrasado | BD; QA-008 |
| TX-05 | Job detenido: adquirir resuelve compromiso vencido correctamente | BD/API |
| TX-06 | Un cupo disponible y dos unidades distintas para el mismo titular: solo una adquisición adicional | BD; guardia de cupo |
| TX-07 | Concesión revocada con sesión vigente: nueva operación denegada | API/BD; QA-003 |
| TX-08 | Misma clave simultánea y mismo contenido: mismo recurso/resultado, un efecto; hash diferente: 409 | API/BD; QA-010 |
| TX-09 | Comprobante o redirect sin confirmación: no reserva confirmada ni unidad vendida | Contrato/E2E |
| TX-10 | Pago tardío después de otra reserva: hecho financiero y excepción; nuevo dueño intacto | BD/API; QA-009 |
| TX-11 | Total 10.001 centavos, tres cuotas iguales con residual final: 3.333, 3.333, 3.335 | Unidad/BD; QA-011 |
| TX-12 | Cuota 1.000, pago confirmado 1.200: aplicación 1.000 y crédito 200; sin sobreimputación | Unidad/BD; QA-011 |
| TX-13 | Reverso parcial 300 de esa aplicación: cuota pendiente 300; original conservado | BD/libro |
| TX-14 | Pago DOP 6.210,00, tasa pactada 62,10 DOP/USD: USD 100,00 exactos; cambio posterior de tasa no altera resultado | Unidad/BD; QA-012 |
| TX-15 | Tasa de referencia 58,00 para ese mismo USD 100,00: diferencial informativo DOP 410,00, separado del contrato | Unidad |
| TX-16 | Reestructurar conserva pagos y suma del calendario nuevo; no duplica deuda; reverso de origen ajusta créditos trasladados | BD |
| TX-17 | Diez eventos del mismo pago: un hecho contable y aplicaciones únicas; evento repetido con otro hash se rechaza | Inbox/API; QA-010 |
| TX-18 | Reverso/contracargo no borra movimientos ni libera otra unidad automáticamente | BD; QA-011/013 |
| TX-19 | Comisión esperada no seleccionable para lote; hito repetido no duplica devengo | Unidad/BD |
| TX-20 | Cambiar regla no modifica historia; cancelación parcial genera ajuste referenciado | BD; QA-013 |
| TX-21 | Solicitante se autoaprueba o cambia cuenta después: rechazo/invalida aprobación | API/BD; QA-014 |
| TX-22 | Dos lotes incluyen misma obligación: solo uno adquiere inclusión activa | BD |
| TX-23 | Timeout de ejecución y reintento: una instrucción; exportación sola no marca pagado | Adaptador falso/contrato |
| TX-24 | Lote bruto 10.000, retención sintética 1.000, ajuste −200: neto 8.800; suma de líneas igual al lote | Unidad/BD, sin afirmar tasa fiscal |
| TX-25 | Broker/asistente sin facultad no reciben cuenta completa, splits ajenos ni referencias internas por RSC/API/CSV/PDF; dato permitido enmascarado | `datos-financieros-respuestas.test.ts`: centinelas sintéticos por rol y contrato de exportación |
| TX-26 | Asistente propone; ninguna mutación efectiva antes de aprobación independiente; caducidad exacta | Reloj/roles |
| TX-27 | Ruta autenticada sin permiso responde 403; ID fuera de alcance responde 404 mediante filtro relacional; guardas detectan ausencia de permiso/RLS | Route Handlers y `seguridad.test.ts` (escaneo esquema/migraciones); prueba BD aislada de GRANT/RLS como `anon`/`authenticated` si esos roles existen; no atribuir denegación del servidor a Data API; QA-001/002 |
| TX-28 | Fallo de libro, auditoría u outbox: rollback del efecto completo | Fallos inyectados |
| TX-29 | Dos consumidores reciben un evento; caída de uno no pierde entrega del otro; evento sin consumidor queda intacto | Outbox real |
| TX-30 | PATCH, feed, alta/borrado o cambio de identidad intentan reabrir venta/compromiso: 409 sin mutación; cierre consume solo compromiso propio vigente | API/BD; QA-019; gate obligatorio b1i antes de b2a/b2b |
| TX-31 | Broker revocado conserva obligación legítima y atribución; pierde nuevas facultades | E2E/BD; QA-022 |
| TX-32 | Migración repetida sobre copia poblada: sin pérdidas, duplicados ni importes recalculados | Migrador y manifiesto |
| TX-33 | Restauración conserva dedupe y no reenvía instrucción ejecutada | Entorno aislado; QA-035 |
| TX-34 | Sin red: no hold/reserva/pago/aprobación prometidos; solo borrador | E2E; QA-028 |
| TX-35 | Ocho pantallas, seis estados, teclado y 320/390/768/1440 | Capturas y revisión D07/D14; QA-031/032 |
| TX-36 | 429/500/timeout/revocación de proveedor: reintentos controlados y resultado legible | Contrato; QA-033 |
| TX-37 | Configuración archivada y obligación bajo retención: historia conservada | BD; QA-037/038 |
| TX-38 | Desactivar integración auxiliar no impide lectura ni operaciones locales autorizadas | Puerto fallando; QA-039 |
| TX-39 | Carga objetivo: percentiles, espera de locks y saturación medidos | D15/D14; QA-036 |
| TX-40 | Hold/extensión y cierre del mismo broker compiten por unidad: sin ciclo unidad/perfil, sin `40P01`; cupo exacto; advisory lock liberado tras commit/rollback | PostgreSQL, dos conexiones/barreras; guarda prohíbe mutex en users/perfil |
| TX-41 | Swaps cruzados A→B y B→A, incluidos anexos: ID ASC en ambos, sin deadlock; fallo conserva origen | PostgreSQL con barrera y oráculo independiente |
| TX-42 | Pago de 100.000; dos reversos de 60.000: una aceptación y un 409; repetir con reembolsos y carrera mixta; pendiente/desconocido reserva saldo; callback duplicado no descuenta otra vez | PostgreSQL dos conexiones; quitar lock del pago debe hacer caer el oráculo |
| TX-43 | Brokers A/B misma instalación: own/team no leen ni mutan expediente ajeno, tampoco por hijo, legado, RSC, totales, CSV/PDF; none denegado | Contrato API/consultas y `seguridad-rutas-id.test.ts`; mutar filtro relacional hace fallar |
| TX-44 | Cada evento financiero registrado y los tres tipos históricos se insertan con auditoría en transacción; tipo desconocido es rechazado; sin consumidor no se reclama | PostgreSQL migrado, registro completo y TX-28/29 |
| TX-45 | Centavos `9007199254740993` conservan exactitud por texto/BigInt/API; límites PostgreSQL válidos; exceso, fracción, exponente, espacios, ceros iniciales y number se rechazan | Unidad/contrato de helper y puente legacy b2l; sin cálculo con number |

QA-002 y pruebas entre empresas quedan condicionadas al ADR de aislamiento; no se marcan N/A ni verdes por asumir una única empresa.

### 8.2 Oráculos y verificación independiente

Consultas de control independientes de la consulta de pantalla deben comprobar:

- Ningún grupo de compromisos activos tiene cardinalidad >1 por unidad/identidad.
- Suma de cuotas por versión igual al total.
- Aplicaciones netas dentro de pago y cuota.
- Crédito igual al confirmado elegible menos consumo neto.
- Un movimiento balanceado por hecho contable único.
- Saldos de comisión separados por beneficiario, moneda y exigibilidad.
- Una inclusión activa por obligación liquidable.
- Importes y relaciones heredados iguales al manifiesto previo.

Los dobles prueban dominio y contratos; PostgreSQL real prueba locks, índices, triggers y rollback.

D14 de otro proveedor realizará mutaciones controladas en copia aislada: retirar índice, orden de unidades, muestreo tardío del reloj, lock de pago/cuota/plan, guardia de cupo, filtro relacional, dedupe o filtro outbox. Debe observar que falla la prueba correspondiente y restaurar antes de continuar. El productor no certifica sus propias garantías.

Validación futura por el orquestador/revisor: `typecheck`, `lint`, `npm test`, `test:db`, `spec:check` y build en entorno permitido, además del flujo UI. **En R2 solo se ejecuta `spec:check`; la salida real está en `reviews/M40-respuesta-R1.md`. Las pruebas funcionales, BD y UI son NO VERIFICADO.**

## 9. Fuera de alcance y preguntas abiertas

### Fuera de alcance

- Facturación UI-049, cálculo fiscal o asesoría legal no pactados.
- Reventa tras rescindir una venta durable sin ADR histórico aceptado (Q40-11).
- Introducir multiempresa, nuevos roles efectivos, cuentas bancarias, proveedor de pagos o reglas contractuales por inferencia.
- Recalcular importes/estados heredados o convertir los 184 negocios de referencia en reservas financieras ficticias.
- Implementación, migración, activación o despliegue mediante esta tarea documental; ningún permiso de archivo de §10 es un despacho vigente.

### Decisiones para Wilber, con D01 y responsables del dato

| ID | Decisión pendiente | Qué bloquea |
|---|---|---|
| Q40-01 | Instalación única frente a multiempresa; identificadores internos/públicos | Modelo definitivo, RLS y QA entre empresas |
| Q40-02 | Duración/cupo/extensión de holds y autoridad sobre inventario externo | Activación UI-040 |
| Q40-03 | Depósito, confirmación, vencimiento de reserva y condiciones contractuales | Confirmación y expiración operativas |
| Q40-04 | Facultades de Finanzas/Legal/aprobadores y visibilidad del asistente/broker | Permisos y DTO definitivos |
| Q40-05 | Plantillas comerciales; relación con cotizador; mora y penalidades | Activación de planes y cargos |
| Q40-06 | FX contractual, aplicación, crédito, reestructuración y reversos de calendario | Operaciones dependientes de esas políticas |
| Q40-07 | Base, ancla, hitos, splits y exigibilidad de comisión | Devengo y liquidación |
| Q40-08 | Retenciones/documentación fiscal y reverificación bancaria | Pagos reales a beneficiarios |
| Q40-09 | Retención por clase, claves idempotentes, auditoría y evidencia | Purga, almacenamiento y aceptación operativa |
| Q40-10 | Banco/pasarela/cuentas receptoras y separación fiduciaria | Adaptadores y conciliación real |
| Q40-11 | Rescisión de venta registrada y posible reventa de unidad | Liberación posterior a venta durable |
| Q40-12 | Validación de legado y apertura contable | Migración financiera efectiva |

Sin política crítica aprobada, el comando dependiente devuelve configuración pendiente; no usa un respaldo monetario silencioso.

## 10. Rebanadas

### 10.1 Reglas de despacho

- Máximo 45 minutos por tarea; dividir si excede.
- Una rebanada, archivos permitidos y CA explícitos.
- Revisor de otro proveedor.
- Sin commit/push/dev/build por productores.
- Coordinación previa de `schema.ts`, migraciones, pipeline y comisiones con EN-CURSO.
- El despacho documental R2 solo autoriza M40 y su respuesta; no autoriza editar EN-CURSO, el índice ni reclamar código.
- Un solo escritor D11 para `schema.ts`, migraciones, snapshots y journal. Dependencia estricta `b1c → b1d → b1e → b1f`; cada una termina, se revisa y se integra antes de la siguiente. Backfill b1h, DDL de b2i y cualquier otra migración esperan ese mismo turno exclusivo. Worktrees aislados no eliminan este conflicto.
- b2c y b2d componen por separado en `contenedor/planes.ts` y `contenedor/pagos.ts`. b2g usa `contenedor/comisiones-transaccion.ts`, sin reclamar `contenedor/comisiones.ts` vigente. El puente legacy b2l se coordina por separado y en secuencia con el frente G3.
- c1i no es despachable hasta entrega de D05 y liberación explícita de `modulos.ts` y shell en EN-CURSO; D00 relee el tablero antes de emitir rutas exactas.
- Ninguna rebanada de código se despacha mientras la ficha siga REVIEW.
- Las migraciones se generan y numeran por D00/D11 antes del despacho; su ruta exacta se añade a TAREA.md. Un marcador de migración no es permiso para editar todo `drizzle/`.

Rutas nuevas de esta tabla son propuestas. Las extensiones `.test.ts` corresponden a pruebas del componente nombrado.

### 10.2 Datos y dominio

| Rebanada | Contenido | Archivos permitidos | CA / dependencia |
|---|---|---|---|
| a0 | Resolver ADR, alcance y reconciliación documental | M40; M03/M22 e I00 solo mediante despacho documental explícito | Bloqueos Q40 |
| b1a | Tipos monetarios, redondeo y helper de entrada | `src/domain/transaccion/dinero.ts`, `dinero.test.ts`; `src/application/compartido/dinero.ts`, `dinero.test.ts` | TX-11/14/15/24/45; dividir dominio/entrada |
| b1b | Máquinas e invariantes puras | `src/domain/transaccion/estados.ts`, `estados.test.ts`, `invariantes.ts`, `invariantes.test.ts` | TX-09/18/19 |
| b1c | Compromisos y reservas, esquema | `src/infrastructure/db/schema.ts`; migración exacta asignada; snapshot exacto asignado | TX-01/03/04/30 |
| b1d | Planes, pagos y aplicaciones, esquema | `schema.ts`; migración/snapshot exactos asignados | TX-11–18 |
| b1e | Comisiones y liquidaciones, esquema | `schema.ts`; migración/snapshot exactos asignados | TX-19–24 |
| b1f | Catálogos, permisos y CHECK outbox compatible | `src/domain/catalogs.ts`, `src/application/compartido/crm.ts`, `src/application/compartido/eventos-financieros.ts`; `scripts/seed/catalog.ts`, `src/infrastructure/db/seed-invariantes.test.ts`; `schema.ts`, migración/snapshot/journal exactos asignados | Después de b1e; TX-25–29/44; antes de cualquier emisor b1i/b2a–b2i/job; dividir contrato/DDL secuencialmente |
| b1g | PoC PORT ledger | `src/infrastructure/integraciones/ledger/pgledger.ts`, `pgledger.test.ts`; SQL exacto de PoC asignado | TX-28; resultado independiente |
| b1h | Backfill y adopción legacy | Script y prueba exactos asignados bajo `scripts/test-db/`; migración exacta asignada | TX-32 |
| b1i | Integrar cierre y escritores de unidad | `src/application/pipeline/cierre.ts`, `puertos.ts`; `src/infrastructure/db/repos/pipeline.ts`; `src/application/compromisos/puertos.ts`, `src/infrastructure/db/repos/compromisos.ts`, `src/infrastructure/contenedor/compromisos.ts`; casos de uso de proyectos y dos rutas de unidades citadas en §2 | Tras b1c/b1f/b1j; TX-01/04/09/30/32/40/41; prerrequisito absoluto de b2a/b2b; dividir por escritor |
| b1j | Alcance relacional central | `src/infrastructure/rbac-filter.ts`, `rbac-filter.test.ts`; `src/infrastructure/seguridad-rutas-id.test.ts` | Tras esquema de padres; TX-43; antes de b2a–b2h; coordinar prueba compartida con q1 |

b1i se divide en tareas separadas de cierre, edición de unidad y cada escritor descubierto. La TAREA de cada una nombra casos de uso, adaptador, ruta y pruebas exactos; esta tabla no autoriza carpetas. No activa ni despacha holds/reservas hasta integrar cada camino y superar la revisión de locks. La aceptación de b1f y b1j también es obligatoria; b1i no las sustituye.

Para evitar dependencia circular con b2a, b1i crea primero el contrato y adaptador mínimo de `CompromisosPort` para proteger escritores existentes, leer ventas/compromisos y resolver caducidad bajo lock; no expone todavía adquisición de holds. b2a amplía esos mismos archivos únicamente después de la entrega e integración de b1i, con un nuevo despacho exacto y secuencial. Su prueba BD puede sembrar compromisos sintéticos en copia aislada sin habilitar el comando nuevo.

### 10.3 Aplicación, adaptadores y API

Para cada capacidad siguiente, los archivos de aplicación permitidos son exactamente:

`puertos.ts`, `casos-de-uso.ts`, `en-memoria.ts`, `casos-de-uso.test.ts`, `entrada.ts`, `dto.ts`, `consultas.ts`, `consultas.test.ts`

dentro de su directorio indicado. Cada despacho selecciona solo los que necesita.

| Rebanada | Directorio de aplicación | Adaptador/composición | API permitida |
|---|---|---|---|
| b2a · Hold | `src/application/compromisos/` | `repos/compromisos.ts`, `contenedor/compromisos.ts` | `api/holds/route.ts`, `[id]/extensiones/route.ts`, `[id]/cancelacion/route.ts` |
| b2b · Reserva | `src/application/reservas/` | `repos/reservas.ts`, `contenedor/reservas.ts` | `api/reservas/route.ts`, `[id]/confirmacion/route.ts`, `[id]/cambio-unidad/route.ts`, `[id]/cancelaciones/route.ts` |
| b2c · Plan | `src/application/cobros/planes/` | `repos/planes-pago.ts`, `contenedor/planes.ts` | `api/cobros/planes/route.ts`, `[id]/reestructuraciones/route.ts` |
| b2d · Pago/aplicación | `src/application/cobros/pagos/` | `repos/pagos.ts`, `contenedor/pagos.ts` | `api/cobros/pagos/route.ts`, `[id]/verificacion/route.ts`, `[id]/aplicaciones/route.ts`, `[id]/reversos/route.ts` |
| b2e · Conciliación | `src/application/conciliacion/` | `repos/conciliacion.ts`, `contenedor/conciliacion.ts` | `api/finanzas/extractos/route.ts`, `conciliaciones/[id]/resoluciones/route.ts` |
| b2f · Excepciones | `src/application/excepciones-financieras/` | `repos/excepciones-financieras.ts`, `contenedor/excepciones-financieras.ts` | `api/finanzas/reembolsos/route.ts`, `[id]/ejecucion/route.ts`, `aprobaciones/[id]/resolucion/route.ts` |
| b2g · Comisión | `src/application/comisiones/transaccion/` | `repos/comisiones-transaccion.ts`, `contenedor/comisiones-transaccion.ts` | `api/comisiones/reglas/route.ts`, `[id]/versiones/route.ts`, `entradas/[id]/ajustes/route.ts` |
| b2h · Liquidación | `src/application/liquidaciones/` | `repos/liquidaciones.ts`, `contenedor/liquidaciones.ts` | `api/comisiones/liquidaciones/route.ts`, `[id]/ejecucion/route.ts`, `[id]/conciliacion/route.ts` |

Todas las filas b2a–b2h esperan b1f y b1j; b2a/b2b esperan además b1i completa. Las capacidades monetarias esperan PoC del libro e I00 aprobados.

Los adaptadores `repos/` se ubican bajo `src/infrastructure/db/`; la composición bajo `src/infrastructure/`. Las rutas se ubican bajo `src/app/`.

Cada fila se divide en: caso de uso puro, repositorio, API y pruebas BD. No asignar la fila completa como una tarea de 45 minutos.

Rebanadas transversales:

| Rebanada | Archivos permitidos | Condición |
|---|---|---|
| b2i · Outbox | Registro `eventos-financieros.ts` ya integrado por b1f (solo lectura salvo despacho secuencial); `src/infrastructure/integraciones/outbox/worker.ts`, `repositorio.ts`, `registro.ts`; pruebas correspondientes; esquema/migración exactos | Después de b1f; I00 aprobado; turno exclusivo D11 para DDL; TX-28/29/44 |
| b2j · Dinero/reglas/colas | Adaptadores y pruebas exactos en `integraciones/dinero/`, `reglas/`, `colas/` | Artefactos y licencias fijados |
| b2k · Webhook | `src/app/api/webhooks/pagos/[conexion]/route.ts`; adaptador del proveedor exacto; prueba; `src/infrastructure/seguridad.test.ts` | Contrato/firma del proveedor verificados |
| b2l · Compatibilidad | `src/app/api/comisiones/[id]/route.ts`; `src/application/comisiones/casos-de-uso.ts`; pruebas existentes afectadas | Sin vía antigua para marcar pagado sin control |

b2j requiere TAREA.md con cada archivo nombrado; no autoriza editar carpetas completas.

### 10.4 Vistas y QA

| Rebanada | Archivos permitidos | CA |
|---|---|---|
| c1a · Hold | `src/app/(crm)/unidades/[id]/hold/page.tsx`, `vista.tsx`, `loading.tsx`, `error.tsx` | TX-01/04/34/35 |
| c1b · Reserva | `src/app/(crm)/reservas/[id]/page.tsx`, `vista.tsx`, `pasos.tsx`, `loading.tsx`, `error.tsx` | TX-09/10/35 |
| c1c · Cartera/plan | `src/app/(crm)/cobros/page.tsx`, `vista.tsx`, `loading.tsx`, `error.tsx`; `reservas/[id]/plan/page.tsx`, `vista.tsx` | TX-11–16/35 |
| c1d · Conciliación | `src/app/(crm)/finanzas/conciliacion/page.tsx`, `vista.tsx`, `loading.tsx`, `error.tsx` | TX-17/35 |
| c1e · Excepciones | `src/app/(crm)/finanzas/excepciones/[id]/page.tsx`, `vista.tsx`, `loading.tsx`, `error.tsx` | TX-21/23/35 |
| c1f · Reglas | `src/app/(crm)/comisiones/reglas/page.tsx`, `vista.tsx`, `loading.tsx`, `error.tsx` | TX-19/20/35 |
| c1g · Libro | `src/app/(crm)/comisiones/page.tsx`, `vista.tsx`; consulta actual solo si despacho la incluye | TX-19/20/25/35 |
| c1h · Liquidación | `src/app/(crm)/comisiones/liquidaciones/[id]/page.tsx`, `vista.tsx`, `loading.tsx`, `error.tsx` | TX-21–24/35 |
| c1i · Navegación | `src/app/(crm)/modulos.ts`; archivo exacto del shell autorizado por D00 | BLOQUEADA hasta entrega D05 y liberación explícita de modulos.ts/shell; navegación y rol |
| q1 · Guardas | `src/infrastructure/seguridad.test.ts`, `seguridad-rutas-id.test.ts`, `precios-respuestas.test.ts`, `arquitectura.test.ts`; nuevo `src/infrastructure/datos-financieros-respuestas.test.ts` | TX-25–30/43; centinelas de cuentas/splits ajenos en RSC/API/CSV/PDF; serializar con b1j |
| q2 · BD | Pruebas exactas por capacidad bajo `scripts/test-db/`; registro en `run.mjs` | Concurrencia, migración y oráculos |
| q3 · E2E | Propuesta: `playwright.config.ts`, `e2e/transaccion.spec.ts`, `e2e/transaccion-permisos.spec.ts` | TX-34–39 |

Runner E2E, dependencia y configuración efectiva son **NO VERIFICADO**. D14 fija y revisa esa rebanada antes de despacho. Capturas y evidencia se entregan al orquestador bajo el frente M40.

## 11. Decisiones arquitectónicas y riesgos

### ADR propuestos, pendientes de aceptación humana

| ADR | Contexto y alternativas | Propuesta | Consecuencia y reversibilidad |
|---|---|---|---|
| ADR-M40-01 · Topología | Ampliar monolito frente a separar servicios financieros | Monolito modular con puertos; atomicidad local | Menos fronteras operativas; extracción futura mediante contratos |
| ADR-M40-02 · Aislamiento | Decisión #5 frente a spec multiempresa | Resolver alcance antes de DDL | Decisión difícil de revertir; exige revisión humana |
| ADR-M40-03 · Identidad | PK UUID frente a IDs internos existentes | Conservar internos, UUID público | Preserva auditoría/outbox; migración de PK sería posterior explícita |
| ADR-M40-04 · Libro | PORT pgledger frente a servicio externo | PORT sujeto a PoC, misma transacción | Acoplamiento SQL aislado; salida por exportación de cuentas/movimientos |
| ADR-M40-05 · Historia | Sobrescritura frente a hechos compensatorios | Append-only financiero y auditoría atribuible | Mayor retención; errores se corrigen por compensación |
| ADR-M40-06 · Dinero | Float/numeric general frente a centavos y adaptador exacto | Centavos BigInt; NUMERIC en libro | USD/DOP escala 2; ampliación de monedas exige contrato |
| ADR-M40-07 · Tiempo | Reloj inicial frente a `clock_timestamp()` separado tras locks | Instantes UTC; vencimientos civiles Santo Domingo | Conserva decisiones #13/#14; pruebas de bordes obligatorias |
| ADR-M40-08 · Cancelación de venta | Borrar venta durable frente a rescisión histórica | Conservar venta; definir nuevo ciclo explícito | No habilita reventa mientras no se acepte modelo |

No se introduce otro idioma base: español conforme al producto; documentos ES/EN usan contenido aprobado. No se crean traducciones legales por inferencia.

### Riesgos y deuda

- **P0 de integridad:** activar holds antes de integrar cierre y edición de unidades.
- **P0 financiero:** permitir el PATCH antiguo `paid` sobre obligaciones nuevas.
- **P0 de especificación:** declarar multiempresa resuelto sin contexto y FKs reales.
- **P1:** entrega outbox a varios consumidores sin estado independiente.
- **P1:** atribuir conciliación o devengo a estados legacy.
- **P1:** activar reglas fiscales o comerciales sin aprobación.
- **P1:** asumir inmutabilidad por tener RLS habilitado.
- **P1:** liberar una venta durable mediante borrado lógico.

No se declara deuda aceptada. Coste de remediación y capacidad operativa: **NO VERIFICADO**.

## 12. Tratamiento de los bloqueantes de M22

Referencia: `.viltrum/reviews/D12-D14-revision-M22-2026-10-14.md:40`.

| Hallazgo | Tratamiento en M40 | Estado |
|---|---|---|
| B-01 · Worker | Filtro observado en código; preservar prueba y exigir antes de emisión | Corregido en archivo respecto al filtro; ejecución NO VERIFICADO |
| B-02 · Destinos/I00 | Entregas por consumidor y prerequisito I00 | Diseño propuesto; revisión pendiente |
| B-03 · Carrera de idempotencia | Comando único, espera/relectura, hash y recuperación de conflicto SQL | Diseño propuesto |
| B-04 · Asistente efectivo | Propuesta separada del efecto, conforme #47 | Conservado; implementación pendiente |
| B-05 · Visibilidad | Sin ampliación automática; Q40-04 | Abierto |
| B-06 · Permisos | Tabla única incluye exportación e identidad de sistema | Propuesto; seed pendiente |
| B-07 · Plantilla | Corregido hecho 20/30/50; ninguna plantilla nueva automática | Decisión comercial abierta |
| B-08 · Oráculos | Cifras exactas y episodios de mora definidos | Propuesto |
| B-09 · Asignación | CA vinculados a rebanadas y QA transversal | Propuesto |

La revisión independiente debe reexaminar estas disposiciones. M40 no cierra hallazgos causados por sus autores ni cambia por sí sola el estado de M22.

## 13. Respuesta a la revisión R1

Revisión completa: `reviews/M40-transaccion-D12.md`. Las respuestas son correcciones documentales propuestas para R2; solo el revisor independiente puede cerrar los hallazgos.

| Hallazgo | Cambio hecho (sección) o refutación | Prueba exigida |
|---|---|---|
| H-B01 | §6.5: advisory lock transaccional por titular con namespace propio; prohibido usar users/perfil como mutex; cierre incluido en inventario de locks | TX-06/40 |
| H-B02 | §6.5: consulta separada de `clock_timestamp()` después de adquirir locks; caducidad con igualdad; nueva muestra si hay otra espera | TX-04/05 |
| H-B03 | §6.5 y §10.1–10.3: b1i completa es dependencia bloqueante de b2a/b2b; PATCH delega en CompromisosPort y rechaza reapertura indebida | TX-01/09/30/40; precisión del permiso en §2 |
| H-M01 | §6.5: unión de origen/destino/anexos por ID ASC con `ORDER BY id ASC FOR UPDATE`; rollback del origen | TX-41 |
| H-M02 | §5.2 y §6.6: pago `FOR UPDATE` antes de sumas; saldo común, reserva de reembolso pendiente y callbacks bajo el mismo lock | TX-13/18/42 |
| H-M03 | §10: b1c→b1d→b1e→b1f secuenciales, un escritor D11; contenedores planes/pagos/comisiones-transaccion separados; navegación bloqueada por D05 | Revisión D00 de dependencias y archivos antes de despacho |
| H-M04 | §6.2: helpers relacionales centrales reutilizan visibleRows vía negocio; cubren padres/hijos y legado; b1j previa | TX-27/43 y guardas por ID |
| H-M05 | §6.7 y b1f: catálogos de entidad/acción, TIPOS_EVENTO_CRM, registro financiero y migración de outbox_type_check antes de emisores | TX-28/29/44; sin afirmar CHECK SQL de auditoría no demostrado |
| H-m01 | §5.1: helper Zod decimal→BigInt, rango PostgreSQL y DTO string; puente legacy explícito y lectura exacta desde texto | TX-45; b1a/b2l |
| H-m02 | §8 TX-27: separación Route Handlers, guardas estáticas y permisos/RLS de roles SQL; Data API no acredita denegación de servidor | TX-27/43 |
| H-m03 | §8 TX-25 y §10 q1: nueva suite datos-financieros-respuestas.test.ts con centinelas sintéticos por rol/canal | TX-25; RSC/API/CSV/PDF |
| Formato pedido en T-TX-1018-R2 | §1–§9 reordenadas según plantilla: pantallas, funciones, datos, puertos, métricas, CA y fuera de alcance/preguntas; estado REVIEW | spec:check sin escribir índice; sin UNKNOWN en §8 |

## Handoff

**Productor R2:** Codex, perfil D03. Se conserva el insumo D11 de la propuesta R1; no se abrió subagente ni se obtuvo revisión D11 independiente en R2. Ese insumo no constituye aprobación.

**Revisores requeridos:** D12 y D14 de otro proveedor. Wilber revisa las decisiones irreversibles, conforme al perfil D03 y al riesgo R3.

Antes de promover esta ficha a READY:

1. D01/Wilber resuelven Q40-01 y las políticas necesarias para el alcance que se vaya a construir.
2. D11 consolida esquema, relaciones, restricciones agregadas, permisos SQL y migración sobre datos inventariados.
3. D12 revisa separación de funciones, RLS/GRANT, DTO, webhook, cuentas bancarias, ledger e inmutabilidad.
4. D14 valida oráculos, cobertura y viabilidad de pruebas; fija runner E2E y evidencia.
5. D05/D07 aportan componentes, wireframes y revisión de estados/accesibilidad.
6. D00 reconcilia M03/M22/I00, actualiza índice y despacha archivos concretos, evitando reservas vigentes.
7. Las PoC fijan artefacto, licencia y resultado antes de adoptar proveedores.
8. Wilber acepta los ADR aplicables. Ningún perfil aprueba su propio diseño.

**Verificación realizada en R2:** lectura completa de perfil, tarea y revisión D12; contraste de plantilla, checker y código citado para locks, RBAC, status, catálogos y outbox; consulta de documentación primaria PostgreSQL/Zod y skill Postgres. La comprobación estructural del Spec Pack se registra con salida y código en `reviews/M40-respuesta-R1.md`. CA funcionales, concurrencia real, permisos SQL efectivos, datos actuales, migración y UI: **NO VERIFICADO**. No se editó código, no se consultaron datos ni configuración secreta. No se usó git, remoto, dev ni build. GitNexus no disponible en las herramientas de esta sesión; impacto de grafo NO VERIFICADO; no se modificaron símbolos de código.

**Revisión de seguridad documental:** los cambios introducen contratos de cierre seguro, alcance relacional, serialización monetaria y preservación de secretos, sin afirmar su implementación. Persisten en el código leído el PATCH de estado (`src/app/api/proyectos/[id]/unidades/[unitId]/route.ts:41`), el reloj anterior al lock (`src/application/pipeline/cierre.ts:88`) y el orden unidad/perfil (`:89`, `:168`); sus escenarios y mitigaciones se entregan a b1i. No se observaron credenciales reales en las salidas revisadas ni se añadieron secretos. No se alteraron permisos, RLS, rutas ni guardas existentes.

**Resultado entregado:** M40 permanece REVIEW/L1 para revisión R2 por D12 de otro proveedor, con D14 y aceptación humana de decisiones R3. Las respuestas R1 no cierran hallazgos ni gate y no autorizan despacho de código. D00 actualiza índice/tablero y registra aceptación cuando corresponda; no están entre los archivos autorizados de esta tarea.
