# G4-00 · Arquitectura de centralización: cómo se comunican TODOS los módulos

> D21 + D03 + D12 · 2026-10-14 · Programa «cada módulo a nivel avanzado». Completa `ARQ-VRE-002-integraciones.md` (no la sustituye) y asume `I00-outbox-base.md` (DRAFT).
> Evidencia base: `outbox/worker.ts:7-11,38-39,55-58`, `outbox/repositorio.ts:28`, `outbox/registro.ts` (corrección en curso), `schema.ts:1153-1177`, `D12-D14-revision-M22` B-01/B-02, `D12-D14-revision-I04` B-03.

## 1. Regla de oro

Un módulo **nunca llama a otro módulo para producir un efecto lateral**. Tres canales, y solo tres:

| Canal | Úsalo para | Garantía | Ejemplo |
|---|---|---|---|
| **Consulta síncrona** por puerto de `src/application/**` | leer un dato ajeno o un veredicto | sin efectos; el alcance (`visibleRows`) lo aplica el dueño del dato | Cobros lee el negocio; Negocios pregunta `CumplimientoPort.clienteApto()` antes de cerrar |
| **Comando en la misma transacción** (unidad de trabajo) | lo que debe ser atómico | todo o nada, auditado | cerrar venta + comisión + metas (hoy en `pipeline/cierre.ts`) |
| **Evento de dominio** por el bus | todo efecto que pueda ocurrir después y fallar sin tumbar al emisor | at-least-once, idempotente, ordenado por agregado, reintentable | notificar, indexar, espejar, facturar, publicar en el Portal, automatizar |

Auditoría **no** viaja por el bus: se escribe en la transacción del cambio (`infrastructure/audit.ts`), porque un rastro eventual no es rastro.

## 2. Diseño objetivo del bus

```
caso de uso ──tx──► dominio + audit_log + outbox(evento)          [libro de eventos, inmutable]
                                  │  mismo COMMIT
                                  ▼
                        suscripciones (catálogo en código)
                  ┌───────────────┼────────────────┬──────────────┐
                  ▼               ▼                ▼              ▼
          entrega(crm)    entrega(notif)    entrega(busqueda)  entrega(portal) …
          1 fila por (evento, consumidor): estado, intentos, siguiente_intento, clase_fallo
                  │ cada una: reclamar → manejador idempotente → confirmar | reintentar | DLQ(consumidor)
```

**Cambio clave respecto del código de hoy.** `registro.ts` (corrección en curso) hace «un tipo, un consumidor» y deja pendientes los tipos sin manejador: es el parche correcto, pero la fila de `outbox` guarda **un solo estado por evento**, así que no admite fan-out (un `PagoRegistrado` debe llegar a Facturación, Comisiones, Notificaciones, Cumplimiento y Búsqueda, cada uno con su ritmo y sus fallos). Objetivo:

1. `outbox` pasa a ser **libro de eventos** (inmutable) y el estado de entrega vive **por consumidor** (`outbox_entrega`, o los jobs de pg-boss, ver §6). Un fallo del consumidor A no toca a B.
2. **Un tipo sin consumidor jamás va a cola muerta**: queda `sin_consumidor` y es reproducible cuando un módulo registre su manejador (`reproducir(consumidor, desde)`). Una **versión de esquema** desconocida para un consumidor que sí existe pasa a `HUMAN_REQUIRED` (cuarentena visible, con botón de reintento tras desplegar), nunca a «muerto».
3. El `CHECK outbox_type_check` (`schema.ts:1175`) se sustituye por una regla de formato + un candado de CI («todo `emitir()` usa un tipo del catálogo `application/compartido/eventos.ts`, y todo tipo del catálogo tiene su esquema Zod `.strict()`»): añadir un evento deja de requerir una migración por tipo, que es lo que hoy ata el orden de lotes de M22 (B-01) y de I04.
4. Motor de entrega recomendado: **pg-boss 12.x (MIT) detrás de `BusPort`** (`G4-bus-eventos-integraciones.md` §4). Mientras se hace la PoC, la corrección en curso se queda y el contrato de manejador **no cambia**, de modo que los manejadores escritos hoy sirven mañana.

### Contrato del evento (v1, ampliando el sobre actual)

| Campo | Regla |
|---|---|
| `eventId` uuid, `idempotencyKey` | única; formato `Tipo:aggregateId[:episodio]` (`CuotaVencida:{id}:{episodio}`, ya fijado en M22) |
| `tipo` | PascalCase en español, pasado: hecho, no orden (`PagoRegistrado`, no `RegistrarPago`) |
| `schemaVersion` | entero; el consumidor declara las que soporta |
| `aggregateType` + `aggregateId` + `aggregateRevision` | orden por agregado: r2 espera a r1 (I00 §5) |
| `correlationId` / `causationId` | `causationId` = evento que lo provocó (corta bucles de automatizaciones, profundidad máx. 3) |
| `occurredAt`, `actorId` (o `sistema`) | quién y cuándo, en UTC |
| `payload` | **solo ids**, Zod `.strict()`; sin montos, nombres, teléfonos, cédula ni notas (regla ya vigente en M22/I03/I04). El consumidor lee el dato por puerto con SU permiso |

### Reintentos, idempotencia, orden

| Tema | Regla |
|---|---|
| Clases de fallo | `RETRYABLE` / `NON_RETRYABLE` / `HUMAN_REQUIRED` (ya en `politica.ts`); timeout con efecto desconocido = `HUMAN_REQUIRED` hasta reconciliar |
| Reintento | backoff exponencial con jitter, base 1 s, tope 60 s, 5 intentos (`POLITICA_OUTBOX`); `Retry-After` manda si es mayor; política **por consumidor** (el espejo a Twenty puede tolerar horas; una notificación no) |
| Idempotencia de entrega | `UNIQUE(eventId, consumidor)`; el manejador pasa `Idempotency-Key = eventId` a todo sistema externo; webhooks de entrada con `UNIQUE(system, accountId, eventId)` en `webhook_inbox` (existe, sin uso) |
| Orden | por `(consumidor, aggregateType, aggregateId)` (pg-boss: política `key_strict_fifo`); entre agregados no hay orden |
| Cola muerta | por consumidor, **reproducible** (redrive) con auditoría de quién y por qué; nunca se borra |
| Reproducción | un consumidor nuevo se pone al día leyendo el libro desde un punto; por eso el libro no se purga antes de 24 meses (excepto lo cubierto por PLAFT: 10 años) |

### Observabilidad

Panel **Configuración → Integraciones** (hoy tarjetas fijas, `_integraciones.tsx:20-29`) pasa a una fila por consumidor: pendientes, **edad del más antiguo**, en reintento, en cuarentena, en cola muerta, último éxito, p95 de latencia. `correlationId` se copia a logs y a `audit_log` para trazar un negocio de extremo a extremo. Umbral de edad superado ⇒ el bus emite `SaludBusDegradada` y el consumidor de Notificaciones avisa al admin. Seis estados UX en el panel. Métricas con OpenTelemetry (pg-boss lo trae).

## 3. Catálogo de eventos de dominio por módulo

Estado: **E** existe en código · **F** definido en ficha (REVIEW/DRAFT) · **P** propuesto aquí (necesita ficha). Payload siempre `{id, …ids}`.

| Módulo emisor | Evento | Estado | Consumidores |
|---|---|---|---|
| Leads | `LeadCreado` | E | espejo CRM, Notificaciones (asignación), Búsqueda, Automatizaciones |
| Leads | `LeadAsignado` | F (M01) | Notificaciones, Automatizaciones (SLA de primer contacto) |
| Leads | `LeadDescartado`, `LeadConvertido` | P | Búsqueda, Reportes (derivado), Automatizaciones |
| Contactos | `ContactoCreado`, `ContactoFusionado`, `ContactoActualizado` | P | Búsqueda, espejo CRM, Cumplimiento (re-evaluar KYC) |
| Negocios | `NegocioCambioEtapa` | E | espejo CRM, Notificaciones, Automatizaciones, Búsqueda |
| Negocios | `NegocioGanado` `{id, unitId}`, `NegocioPerdido` | P | Cobros (crear plan), Comisiones (devengo), Propiedades (disponibilidad), Metas, Cumplimiento, Portal |
| Propiedades | `UnidadPublicada`, `UnidadRetirada`, `DisponibilidadCambiada`, `PrecioPublicoCambiado` | F (I04) | Portal (`PortalPort`), Búsqueda |
| Avances | `AvanceObraPublicado` | P | Notificaciones (brokers), Comunicaciones (clientes), Portal |
| Cobros | `PagoRegistrado`, `PagoAnulado`, `CuotaVencida` | F (M22) | Facturación (I03), Comisiones (M10), Comunicaciones (M11), Cumplimiento, Notificaciones |
| Cobros | `CuotaPorVencer` (T-3 días) | P | Comunicaciones, Notificaciones |
| Facturación | `ComprobanteEmitido`, `ComprobanteRechazado` | F (I03) | Cobros (estado de cuenta), Notificaciones |
| Comisiones | `ComisionDevengada`, `ComisionRevertida`, `ComisionPagada` | F/P | Notificaciones (broker), Facturación (comprobante del broker) |
| Comunicaciones | `MensajeRecibido`, `MensajeEnviado`, `MensajeFallido` | P | Leads (nuevo lead por mensaje), Asistente IA (notas de voz), Notificaciones, Búsqueda |
| Academy | `BrokerAcademyAsignado` | F (I02) | Moodle (`AprendizajePort`) |
| Academy | `CertificacionAprobada`, `CapacitacionPLAFTCompletada` | P | Brokers (habilitación), Cumplimiento |
| Agenda/Tareas | `ActividadRegistrada` | E | espejo CRM, Notificaciones (recordatorios) |
| Agenda/Tareas | `ActividadVencida` (programado) | P | Notificaciones, Automatizaciones |
| Metas | `MetaFijada`, `MetaAlcanzada` | P | Notificaciones |
| Configuración | `UsuarioCreado`, `UsuarioDesactivado`, `PermisosCambiados` | P | Auditoría reforzada, Notificaciones (admin), Moodle (baja) |
| Aprobaciones | `SolicitudAprobacionCreada`, `SolicitudAprobada`, `SolicitudRechazada`, `SolicitudCaducada` | P | Notificaciones, ejecutor del comando aprobado |
| Cumplimiento | `KycCompletado`, `KycPorVencer`, `AlertaPlaftGenerada`, `OperacionSospechosaRegistrada` (restringido) | P | Notificaciones al oficial, Auditoría de lectura |
| Importación | `ImportacionCompletada` | P | Notificaciones, Búsqueda (reindexado por lotes) |
| Asistente IA | `NotaDeVozTranscrita`, `PropuestaIaCreada` | P | Leads/Aprobaciones (revisión humana), Notificaciones |
| Plataforma | `SaludBusDegradada`, `EntregaEnCuarentena` | P | Notificaciones al admin |

## 4. Consumidores transversales (los que «unen» todo)

| Consumidor | Suscrito a | Qué hace | Expediente |
|---|---|---|---|
| `crm` (espejo) | Lead*, Negocio*, Actividad* | `CrmPort` → Twenty/local | G4-bus-eventos-integraciones |
| `notificaciones` | casi todo, por **reglas de plantilla** | in-app / correo / push según preferencia | G4-notificaciones |
| `automatizaciones` | cualquiera, por regla del usuario | condiciones → acciones permitidas | G4-automatizaciones |
| `busqueda` | `*Creado/*Actualizado/*Fusionado/…` | mantiene `search_documents` | G4-busqueda-comandos |
| `cumplimiento` | `PagoRegistrado`, `NegocioGanado`, `ContactoActualizado` | monitoreo de transacciones y alertas | G4-cumplimiento-plaft |
| integraciones externas | según puerto | Portal, PSFE, Moodle, ERP | I02/I03/I04 + G4-bus |

## 5. Lo que NO se hace
Sin microservicios por módulo; sin event sourcing completo (el libro es de **notificación**, el estado sigue en tablas); sin que un consumidor escriba tablas de otro módulo (usa su caso de uso y su permiso de sistema); sin PII en payloads; sin eventos para lo que debe ser atómico.

## 6. Orden de construcción (resumen; detalle en los expedientes)
1. (en curso, otro agente) filtro por tipos con consumidor. 2. `eventos.ts` (catálogo + esquemas) y candado de CI. 3. Estado por consumidor + `sin_consumidor` reproducible. 4. PoC pg-boss detrás de `BusPort` (decisión D03/D12/Wilber). 5. Panel de salud. 6. Consumidores: notificaciones → búsqueda → automatizaciones.

## 7. No verificado
Que `pg-boss` envíe dentro de la transacción de Drizzle sin arrancar su supervisor en el proceso de Next (documentado en `docs/api/adapters.md`, **no probado aquí**); que el esquema `pgboss` pueda quedar fuera de PostgREST con los grants de este Postgres 15 local; carga real esperada (solo se midió 0 filas en `outbox`, I00 §7).
