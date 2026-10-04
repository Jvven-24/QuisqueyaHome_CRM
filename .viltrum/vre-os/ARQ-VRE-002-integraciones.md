# ARQ-VRE-002 · Arquitectura de conexiones: cómo conviven módulos de distintos proveedores

> Autor: D00 (Claude, base del programa). Revisión: **D03 + Wilber** (decisión estructural). Estado: PROPUESTA.
> Base real: `src/application/README.md`, `src/infrastructure/arquitectura.test.ts`, `src/infrastructure/contenedor/`,
> `src/infrastructure/comunicaciones/proveedor-despacho.ts`. Doctrina: P1 (bajo acoplamiento), P2 (nada hardcodeado),
> Blueprint §10–§13, §37–§40, §61. Decisión vigente: #43.

## 1. La idea en una frase

**Cada proveedor (Twenty, WhatsApp, mapas, almacenamiento, IA…) entra por un enchufe propio (puerto) que diseñamos
nosotros; el CRM solo conoce el enchufe, nunca al proveedor.** Cambiar de proveedor = cambiar un adaptador y una línea
de configuración. El código copiado de proyectos open source (OpenProperty, Prolink) no es un "proveedor": se convierte
en módulo nativo nuestro con la misma receta que `contactos`.

```
 NAVEGADOR (React · shadcn · Recharts · MapLibre solo para pintar)
     │  solo habla con nuestras rutas/acciones de servidor
     ▼
 BFF = src/app/api/* y server actions  ── auth, tenant, alcance (requireScope / visibleRows)
     │
     ▼
 APLICACIÓN  src/application/<modulo>/   casos de uso + PUERTOS (interfaces)
     │                                    no importa infraestructura (arquitectura.test.ts)
     ▼
 CONTENEDOR  src/infrastructure/contenedor/<modulo>.ts   elige el adaptador según configuración
     │
     ├── db/repos/*                → PostgreSQL local (fuente de verdad hoy)
     ├── integraciones/twenty/     → Twenty (motor CRM detrás)          ← CrmPort
     ├── integraciones/mensajeria/ → WhatsApp / Telegram                 ← MensajeriaPort (ya existe: proveedor-despacho)
     ├── integraciones/almacen/    → disco local / S3-R2                 ← AlmacenamientoPort (ya existe)
     ├── integraciones/ia/         → modelo de IA                        ← AsistentePort
     └── outbox + worker           → sincroniza hacia fuera con reintentos
```

## 2. Las seis piezas

### 2.1 Puertos por capacidad (no por proveedor)
El puerto se nombra por lo que hace, en español y con tipos del dominio: `CrmPort`, `MensajeriaPort`,
`AlmacenamientoPort`, `AsistentePort`, `GeocodificacionPort`. Vive en `application/<modulo>/puertos.ts` o en
`application/compartido/` si lo usan varios módulos. **Nunca** expone tipos del proveedor (nada de `TwentyPerson`).

```ts
// application/compartido/crm.ts (forma, no implementación)
export interface CrmPort {
  reflejarContacto(c: ContactoDominio): Promise<RefExterna>;
  reflejarNegocio(n: NegocioDominio): Promise<RefExterna>;
  registrarActividad(a: ActividadDominio): Promise<RefExterna>;
  salud(): Promise<EstadoIntegracion>;
}
```

### 2.2 Adaptadores aislados
Un directorio por proveedor: `src/infrastructure/integraciones/<proveedor>/` con `adaptador.ts`, `mapeo.ts`
(dominio ↔ proveedor), `cliente.ts` (HTTP con timeout) y sus pruebas. Regla P1 verificable: **el SDK o la URL de un
proveedor solo aparece dentro de su carpeta** → se añade a `arquitectura.test.ts`.

Cada puerto tiene además un **adaptador nulo/local** (`integraciones/<capacidad>/local.ts`) para que el CRM funcione
completo sin el proveedor (desarrollo, pruebas, caída del proveedor).

### 2.3 Selección por configuración (P2)
El contenedor decide qué adaptador inyectar leyendo **una** fuente: `src/infrastructure/env.ts`
(p. ej. `CRM_MOTOR=local|twenty`, `MENSAJERIA=telegram|whatsapp|ninguna`). Ningún `if (proveedor === "twenty")` fuera
del contenedor. Los secretos de cada proveedor también salen solo de `env.ts`.

### 2.4 Fuente de verdad única por entidad + tabla de referencias externas
| Entidad | Dueño hoy | Dueño objetivo | Réplica |
|---|---|---|---|
| Contacto, lead, negocio, actividad | PostgreSQL local | **por decidir tras PoC** (Twenty o local) | la otra parte, reconstruible |
| Proyecto, torre, unidad, precio, disponibilidad | PostgreSQL local | PostgreSQL local | Twenty (solo referencia) |
| Reserva, plan de pagos, comisión | PostgreSQL local | PostgreSQL local | Twenty (estado espejo) |
| Rentas: contrato, cargo, ledger, mantenimiento | PostgreSQL local (módulo portado) | PostgreSQL local | — |
| Archivos binarios | disco/S3 | S3/R2 | metadatos en BD |
| Analítica, búsqueda | derivado | derivado | reconstruible |

Tabla nueva `external_refs(entity_type, local_id, system, external_id, version, synced_at)` con única
`(entity_type, local_id, system)` y `(system, external_id)`. **Nunca** se enlaza por nombre o email.

### 2.5 Salida: outbox transaccional + worker
Toda escritura que deba llegar a un proveedor se hace en la **misma transacción** que el cambio de dominio:
`UPDATE dominio` + `INSERT outbox(event_id, event_type, version, aggregate_id, correlation_id, payload, idempotency_key)`.
Un worker lee el outbox, llama al puerto, marca enviado; reintento con backoff + jitter, clasificación
`RETRYABLE | NON_RETRYABLE | HUMAN_REQUIRED`, y tras el máximo pasa a `outbox_dead` (DLQ) visible en Configuración.
Si Twenty está caído, **el CRM sigue funcionando**: solo se acumula el outbox.

Eventos base (sobre de BP §37): `LeadCreado`, `LeadCalificado`, `NegocioCambioEtapa`, `ActividadRegistrada`,
`UnidadCambioDisponibilidad`, `ReservaConfirmada`, `ReservaExpirada`, `PagoRegistrado`, `ComisionDevengada`,
`ContratoRentaCreado`, `CargoRentaVencido`.

### 2.6 Entrada: webhooks verificados → comando de dominio
`src/app/api/webhooks/<proveedor>/route.ts` solo: verifica firma/token → normaliza al tipo del dominio → comprueba
idempotencia (`webhook_inbox` con id del evento) → llama a un caso de uso. **Ninguna regla de negocio en el
controlador** (el patrón ya existe en el webhook de leads, F05–F06).

## 3. Cómo encaja cada pieza del programa

| Pieza | Tipo | Dónde vive | Puerto |
|---|---|---|---|
| Twenty | proveedor externo (RUN) | `integraciones/twenty/` | `CrmPort` |
| WhatsApp / Telegram | proveedor externo | `integraciones/mensajeria/` (ya existe `proveedor-despacho`) | `MensajeriaPort` |
| Almacenamiento | proveedor externo | `integraciones/almacen/` (ya existe puerto) | `AlmacenamientoPort` |
| IA | proveedor externo | `integraciones/ia/` | `AsistentePort` (registro de ejecución, BP §51) |
| OpenProperty (rentas) | código portado (PORT) | `application/rentas/` + `db/repos/rentas.ts` | repositorio propio, como cualquier módulo |
| Prolink (cotizaciones, facturas) | código portado (PORT) | `application/cotizaciones/` … | repositorio propio |
| MapLibre | librería de render | solo en vistas (`app/(crm)/**`) con datos de nuestra API | ninguno (no es fuente de datos) |
| shadcn/Recharts | librería de UI | `components/ui/` | ninguno |

Código portado lleva cabecera de procedencia (repo, SHA, licencia, archivos origen) y su registro en
`docs/open-source/UPSTREAM.md`; nunca se mezcla con merges automáticos del upstream (BP §63).

## 4. Garantías comprobables (para que no se degrade con el tiempo)

Se añaden a `arquitectura.test.ts` / `seguridad.test.ts`, igual que las guardas actuales:
1. `app/` y `application/` no importan nada de `infrastructure/integraciones/**`.
2. El nombre/URL/SDK de cada proveedor solo aparece en su carpeta de `integraciones/`.
3. Toda tabla nueva (`outbox`, `outbox_dead`, `external_refs`, `webhook_inbox`) con RLS.
4. Toda ruta `api/webhooks/*` verifica firma antes de leer el cuerpo.
5. Cada puerto tiene una **suite de contrato** que corre contra el doble en memoria y contra el adaptador
   (con el proveedor simulado); un adaptador nuevo no entra si no pasa la misma suite.
6. Catálogo de fallos por adaptador (BP §61): timeout, 401, 403, 404, 409, 429, 5xx, payload inválido, evento
   duplicado, fuera de orden → comportamiento definido y probado.

## 5. Orden de implementación

1. **Base de integración** (D19 · Codex Sol, después de que D11 cierre su migración para no chocar en `schema.ts`):
   tablas `outbox`, `outbox_dead`, `external_refs`, `webhook_inbox`; worker; `CrmPort` + adaptador local;
   guardas 1–5. Sin Twenty vivo.
2. **TwentyAdapter** (D19 · Codex Sol) contra Twenty local en `:9320`, pruebas de contrato y modo espejo
   (local sigue siendo dueño). Revisión D12.
3. **Rentas** como módulo nativo portado (W4b).
4. PoC de propiedad en Twenty (si conviene) → ensayo de migración → **aprobación de Wilber**.

## 6. Qué no se hace
- Microservicios por módulo, event sourcing completo, varios CRMs vivos compartiendo tablas, sincronización
  bidireccional de todo, frontend llamando a Twenty, fork del core de Twenty (BP §8).
