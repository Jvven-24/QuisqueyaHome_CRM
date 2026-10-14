---
id: I03
sistema: PSFE autorizado por la DGII con API (proveedor por elegir)
repo: no aplica (servicio comercial de terceros; el adaptador es código propio del CRM)
licencia: servicio comercial (SaaS); términos, tratamiento de datos y salida contractual por revisar al elegir proveedor
modo: RUN
puerto: FacturacionPort (propuesto; no existe hoy)
estado: REVIEW
riesgo: R3
owner: D19
revisores: [D11, D12, D14]
actualizado: 2026-10-14
---

# I03 · Facturación electrónica e-CF (DGII) detrás de `FacturacionPort`

**Nivel L1, estado REVIEW.** Esta ficha define el contrato neutral, el doble en memoria y los criterios para elegir proveedor. No elige proveedor, no autoriza código y no sustituye el criterio del contador. Nace del expediente D21 Parte B (`.viltrum/research/D21-catalogo-crm-inmobiliario-y-contabilidad-rd-2026-10-14.md`) y del plan integral (`PLAN-INTEGRAL-2026-10-14.md` §3). Dependencia dura: la ficha **M22-cobros** (`../modulos/M22-cobros.md`, REVIEW, `depende_de` incluye I03) emite `PagoRegistrado` y `PagoAnulado` con payload `{id, planId}` y clave `PagoRegistrado:{id}`; esos eventos son contrato de ficha, no código vigente. I03 lee el monto, la moneda y la tasa por `id` del pago, no desde el evento. Promoción a READY: ver precondiciones en §9.

## 1. Para qué lo usamos y para qué no

**Sí:** emitir comprobantes fiscales electrónicos (e-CF) por cobro y por comisión a través de **un solo punto de emisión**, un proveedor de servicios de facturación electrónica (PSFE) autorizado por la DGII que exponga API. Tipos en alcance inicial: **E31** (factura de crédito fiscal), **E32** (factura de consumo), **E33/E34** (nota de débito/crédito, solo contra el mismo adquiriente), **E41** (comprobante de compras, para pagar comisión a un broker sin RNC). E43, E44, E45, E46 y E47 quedan declarados en el tipo pero deshabilitados por configuración hasta que el contador los pida (fuente de los tipos: https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/TipoyEstructurae-CF.aspx).

**No:**
- El CRM **nunca genera numeración fiscal** ni firma XML. No construimos XMLDSig, certificación ante la DGII ni contingencia propia: no cabe en el plazo (D21 B.4).
- No es libro mayor, conciliación bancaria ni formatos 606/607/608/609. Eso es `ContabilidadPort` (diferido, decisión del contador).
- No decide qué es gravado, exento o retenible: el contador fija las reglas; el CRM las aplica por configuración versionada.
- No recibe ni aprueba e-CF emitidos por terceros (recepción y aprobación comercial). Queda fuera de esta ficha.
- FacturacionV3 está **descartada como emisor por decisión de Wilber (14-oct-2026)** y no se propone en ninguna parte de esta ficha.
- El Facturador Gratuito de la DGII es portal manual sin API hallada (D21 B.4): solo respaldo humano, ver riesgos en §10.

## 2. Fuente de verdad

| Dato | Dueño | Nota |
|---|---|---|
| Hecho económico (pago, anulación de pago, comisión devengada) | CRM, módulo que lo origina (M22 cobros, Comisiones) | La factura nunca es la fuente del pago. |
| Decisión de emitir y tipo de e-CF | CRM, por configuración fiscal aprobada por el contador | Pendiente §9 precondición 3. |
| **e-NCF, TrackId, estado ante la DGII, XML firmado** | **PSFE / DGII** | El CRM los **guarda como copia de lectura** y jamás los inventa. |
| Registro local del comprobante (`comprobantes_fiscales`) | CRM | Una fila por intento lógico de emisión, con clave de idempotencia propia (UUID). |
| Entidad fiscal emisora (RNC, razón social, grupo DGII, ambiente) | CRM, tabla de configuración administrada por Admin | Una por sociedad, SPV o fideicomiso con RNC propio (D21 A21.1 y B.1). |
| Certificados digitales | PSFE | El CRM no custodia P12 ni claves de firma. |

Regla de oro: **si CRM y PSFE discrepan sobre el estado de un comprobante, prevalece el PSFE/DGII** y el CRM concilia. Si discrepan sobre el monto de origen, prevalece el CRM y se corrige con E34/E33, nunca editando el comprobante emitido.

## 3. Contrato del puerto

Ubicación propuesta: `src/application/compartido/facturacion.ts` (tipos y puerto, sin importar infraestructura). Nombres en español, importes en centavos enteros como el resto del repo (`*Cents`). Ningún tipo del proveedor cruza el puerto.

```ts
export const TIPOS_ECF = ["E31","E32","E33","E34","E41","E43","E44","E45","E46","E47"] as const;
export type TipoEcf = typeof TIPOS_ECF[number];

export type EmisorFiscal = { entidadFiscalId: number; rnc: string; ambiente: "certificacion" | "produccion" };
export type ReceptorFiscal = {
  tipoIdentificacion: "rnc" | "cedula" | "pasaporte" | "ninguna";
  identificacion?: string;          // obligatoria en E31/E41 y en E32 desde el umbral que fije el contador
  nombre: string;
  pais?: string;
};
export type LineaFiscal = {
  descripcion: string; cantidad: number; precioUnitarioCents: number; descuentoCents: number;
  indicador: "gravado_18" | "exento" | "no_sujeto" | "no_facturable";   // la regla la fija el contador
  itbisCents: number;
};
export type RetencionFiscal = { concepto: "isr" | "itbis"; porcentaje: number; montoCents: number }; // E41 y casos aprobados
export type SolicitudComprobante = {
  claveIdempotencia: string;        // UUID del registro local; el PSFE debe tratarlo como referencia externa
  emisor: EmisorFiscal;
  tipo: TipoEcf;
  receptor: ReceptorFiscal;
  fechaEmision: string;             // fecha civil America/Santo_Domingo, no instante UTC
  moneda: "DOP" | "USD";
  tasaCambio?: number;              // congelada al emitir (A7.5)
  lineas: LineaFiscal[];
  retenciones?: RetencionFiscal[];
  referencia?: { eNcfModificado: string; fechaEmisionModificada: string; codigoModificacion: string }; // E33/E34
  formaPago?: string;
};

export type EstadoComprobante =
  | "SOLICITADO" | "ENVIANDO" | "EN_PROCESO" | "ACEPTADO" | "ACEPTADO_CONDICIONAL"
  | "RECHAZADO" | "CONTINGENCIA" | "INCIERTO" | "CANCELADO_LOCAL";

export type ResultadoEmision =
  | { estado: "ACEPTADO" | "ACEPTADO_CONDICIONAL"; eNcf: string; trackId: string; documento?: DocumentoRef; avisos?: string[] }
  | { estado: "EN_PROCESO" | "CONTINGENCIA"; trackId?: string; eNcf?: string }
  | { estado: "RECHAZADO"; codigo: string; mensajes: string[] };   // mensajes sanitizados

export type DocumentoRef = { urlRepresentacion?: string; xmlRef?: string };  // referencia opaca, nunca el XML en logs

export interface FacturacionPort {
  emitir(s: SolicitudComprobante): Promise<ResultadoEmision>;          // idempotente por claveIdempotencia
  consultar(ref: { entidadFiscalId: number; claveIdempotencia: string } | { entidadFiscalId: number; eNcf: string }): Promise<ResultadoEmision | { estado: "NO_ENCONTRADO" }>;
  obtenerDocumento(ref: { entidadFiscalId: number; eNcf: string }): Promise<DocumentoRef>;
  capacidades(): Promise<{ tipos: TipoEcf[]; ambiente: "certificacion" | "produccion"; consultaPorReferencia: boolean }>;
  salud(): Promise<"disponible" | "no_disponible">;
}

export type ClaseFalloFacturacion = "RETRYABLE" | "NON_RETRYABLE" | "HUMAN_REQUIRED";
export class FalloFacturacion extends Error { /* clase, retryAfterMs?, codigoControlado; sin mensaje del proveedor */ }
```

Reglas del contrato:
1. `emitir` con la misma `claveIdempotencia` **nunca crea un segundo e-NCF**: devuelve el resultado ya existente. Es requisito de elegibilidad del PSFE (§3.1) y condición de la suite de contrato del doble.
2. Un rechazo no es una excepción: es `RECHAZADO` con código. Un fallo de transporte es `FalloFacturacion`.
3. **Resultado incierto** (timeout, corte tras enviar): el adaptador lanza `FalloFacturacion("RETRYABLE")` marcado como incierto y el registro pasa a `INCIERTO`. Se resuelve con `consultar`, jamás con un segundo `emitir` sin haber consultado.
4. Correcciones fiscales: **E34** (nota de crédito) para anular/reducir, **E33** para aumentar. No existe operación "editar" ni "borrar" un e-CF aceptado.
5. Sin PII en errores, logs ni métricas; el XML y la representación impresa se guardan por referencia opaca.

### 3.1 Criterios para elegir PSFE (decisión de Wilber, con el contador)

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Figura como PSFE **autorizado y vigente** en la lista oficial de la DGII, con su RNC | Lista publicada en dgii.gov.do. El expediente D21 no pudo abrirla (B.1): verificar a mano. Alegra/Alanube e Infile aparecen citados en D21 sin verificación; no hay preferencia por ninguno. |
| 2 | Ha certificado al menos 5 emisores (requisito para ser PSFE, D21 B.1) | Documento del proveedor y consulta DGII |
| 3 | API REST con ambiente de **certificación/pruebas** separado | Documentación y credenciales de prueba |
| 4 | **Idempotencia por referencia externa** y consulta por esa referencia (criterio eliminatorio: sin esto el timeout incierto exige intervención humana siempre) | Prueba de contrato: dos `emitir` iguales, un solo e-NCF |
| 5 | **Asigna él la secuencia e-NCF** y devuelve e-NCF, TrackId, estado DGII, XML firmado y representación | Respuesta de sandbox |
| 6 | Soporta E31, E32, E33, E34 y E41; deseable E43/E47 | Catálogo del proveedor |
| 7 | **Multi-RNC** bajo un contrato (cada sociedad/fideicomiso con sus propias secuencias y certificado) | Contrato y sandbox con dos RNC |
| 8 | Maneja contingencia y reenvío ante caída de la DGII y lo informa en el estado | Documentación |
| 9 | Notificación firmada (webhook con HMAC) o consulta por sondeo documentada | Documentación |
| 10 | Precio por documento, límites de tasa, SLA y soporte en horario fiscal | Oferta comercial |
| 11 | Retención/exportación de XML y salida contractual (plan de salida, §10) | Cláusulas |
| 12 | Tratamiento de datos personales de compradores (Ley 172-13 **no fue investigada**, D21 B.5) | Revisión D12 y contador/abogado |

Hasta elegir, el único adaptador es el **doble en memoria** (§7).

## 4. Mapeo de datos y enlace por `external_refs`

| Dato nuestro | Campo del puerto | Observación |
|---|---|---|
| `entidades_fiscales` (nueva): RNC, razón social, grupo DGII, ambiente, alias de credencial | `EmisorFiscal` | Proyecto/fideicomiso → entidad fiscal (N:1). RNC emisor **por proyecto**, no global (D21 A21.1). |
| Pago (M22): monto, moneda, tasa congelada, fecha | `LineaFiscal`, `moneda`, `tasaCambio`, `fechaEmision` | Si la cuota lleva comprobante propio o recibo de anticipo es **pregunta abierta del contador** (D21 B.2). El puerto soporta ambas rutas. |
| Contacto comprador | `ReceptorFiscal` | **Hueco:** `contacts` y `broker_profiles` no tienen RNC/cédula en `schema.ts`. D11 debe añadir identificación fiscal (clasificada como PII) antes de READY. |
| Comisión devengada + retenciones | `LineaFiscal`, `retenciones` | Broker con RNC emite E31 hacia la agencia (recepción fuera de alcance); broker sin RNC: la agencia emite **E41**. ISR 10 % a persona física y retención de ITBIS 100 %/30 % son **inferencias a confirmar** (D21 B.2); NG 02-2026 dispensa retener si el proveedor es emisor electrónico. |
| Anulación de pago (M22) | `referencia` + tipo E34 | Solo contra el mismo adquiriente y sobre un original en estado ACEPTADO. |
| `comprobantes_fiscales` (nueva) | — | `id` serial (agregado del outbox), `public_ref uuid` único = `claveIdempotencia`, `entidad_fiscal_id`, `origen_tipo` (pago, comision, nota), `origen_id`, `tipo_ecf`, `estado`, `e_ncf`, `track_id`, `documento_ref`, `monto_total_cents`, `moneda`, `error_codigo`, `revision`, fechas. Único `(entidad_fiscal_id, e_ncf)` donde no sea nulo. Único parcial por `(origen_tipo, origen_id, tipo_ecf)` sin estado terminal fallido, que impide doble emisión por el mismo origen. |
| `external_refs` | `(entity_type='comprobante', local_id, system=<psfe>, external_id=eNcf)` | Enlace por ID; nunca por nombre ni monto. |

Montos y fechas: snapshot inmutable en el registro al solicitar; cambiar el origen después no altera lo solicitado. Fecha fiscal en `America/Santo_Domingo`.

## 5. Eventos

**Entrantes al módulo fiscal (desde dominio, en la misma transacción que el hecho económico):**
- `PagoRegistrado` (M22) → según la configuración fiscal del proyecto crea `comprobantes_fiscales` en `SOLICITADO` (E32 o E31 según receptor) y encola `ComprobanteSolicitado`.
- `PagoAnulado` (M22) → si existe comprobante ACEPTADO del pago, crea solicitud **E34** con `referencia`; si el original sigue `SOLICITADO` sin enviar, pasa a `CANCELADO_LOCAL`; si está `INCIERTO` o `EN_PROCESO`, la anulación espera a que concilie.
- `ComisionDevengada` (nombre ya listado en ARQ-VRE-002 §2.5) → E41 o recepción de E31 según el perfil fiscal del broker.

**Salientes por outbox hacia el PSFE:** destino `facturacion`, tipo `ComprobanteSolicitado`, agregado `comprobante`, con el contrato de I00 (`command_id`, revisión por agregado, claim con lease, envío fuera de transacción). Requiere ampliar el check de tipos de `outbox` (hoy solo `LeadCreado`, `NegocioCambioEtapa`, `ActividadRegistrada`) por migración de D11, y que I00 esté en READY.

**Entrada del estado final:** la DGII responde de forma asíncrona (TrackId). Dos vías, la que ofrezca el PSFE: (a) **sondeo** por un job que ejecuta `consultar` sobre `ENVIANDO`/`EN_PROCESO`/`INCIERTO`/`CONTINGENCIA` con backoff; (b) **webhook firmado** a `src/app/api/webhooks/facturacion/route.ts` que verifica firma antes de leer el cuerpo, deduplica en `webhook_inbox` y llama a un caso de uso (ARQ-VRE-002 §2.6). Ninguna vía acepta un estado sin comparar `claveIdempotencia`/`eNcf` con un registro local existente.

Evento interno resultante: `ComprobanteEmitido` / `ComprobanteRechazado` para notificaciones y para el estado de cuenta (A7.3). Sin PII en el payload.

## 6. Catálogo de fallos

| Situación | Clase | Comportamiento |
|---|---|---|
| **Rechazo DGII** (validación de datos, receptor inválido, secuencia, totales) | NON_RETRYABLE / HUMAN_REQUIRED | Estado `RECHAZADO` con código y mensajes sanitizados. Se corrige el dato de origen y se crea **otra** solicitud con clave nueva enlazada a la anterior; nunca se reenvía la misma. El e-NCF consumido no se reutiliza. |
| **Aceptado condicional** | HUMAN_REQUIRED | Se guarda como válido con aviso visible al contador. |
| **Contingencia / DGII caída** | RETRYABLE | Estado `CONTINGENCIA`; el job concilia hasta estado final. Las reglas de contingencia declarada están en el Reglamento 587-24, cap. IX (D21 B.1); el detalle operativo lo da el PSFE. |
| **Timeout o corte tras enviar (resultado incierto)** | RETRYABLE incierto | Estado `INCIERTO`. **Reconciliar con `consultar(claveIdempotencia)`. No reemitir.** Si el PSFE no encuentra la referencia tras la ventana acordada, `HUMAN_REQUIRED` y decisión humana registrada; solo entonces puede crearse una solicitud nueva. |
| 401 / 403 (credencial, RNC no habilitado en el PSFE, certificado vencido) | HUMAN_REQUIRED | Abrir circuito, alertar a Admin, no reintentar. No usar otra credencial como atajo. |
| 404 | NON_RETRYABLE | En `consultar`: `NO_ENCONTRADO`, no es éxito. En `emitir`: configuración errónea de RNC o endpoint. |
| 409 / duplicado | NON_RETRYABLE | Se interpreta como "ya existe": se consulta y se adopta el resultado existente. Si el contenido difiere, `HUMAN_REQUIRED`. |
| 422 / payload inválido | NON_RETRYABLE | Error de mapeo nuestro: no se envía; sube a Admin. |
| 429 / 5xx | RETRYABLE | Misma clave, backoff con jitter y `Retry-After` cuando exista, tope de intentos y luego DLQ visible. |
| Evento fuera de orden (p. ej. `PagoAnulado` antes de aceptar el original) | — | La anulación espera por revisión de agregado (I00): r2 no avanza antes que r1. |
| Estado recibido que no corresponde a ningún registro | — | Se guarda en `webhook_inbox` sin efecto y se alerta. |
| Salto de numeración, e-NCF repetido o fuera de rango | HUMAN_REQUIRED | Bloquear nuevas emisiones de esa entidad fiscal hasta revisión del contador. |
| Vencimiento del plazo e-CF sin emitir | HUMAN_REQUIRED | Alerta de cola envejecida y, solo si Wilber lo decide, emisión manual de respaldo (§10). |

Logs: correlación e identificadores locales, nunca RNC/cédula del comprador, XML ni respuesta bruta.

## 7. Despliegue

- **Proveedor:** servicio alojado por el PSFE. No se instala nada propio salvo el adaptador y el job de reconciliación (worker del outbox de I00).
- **Local (única fase autorizada):** `FACTURACION_MOTOR=local` usa el **doble en memoria** y un **servidor simulado de PSFE** en un puerto de la gama 9300–9399 (propuesto 9340, sin colisión con app 9301, Twenty 9320 y Moodle 9330), con datos sintéticos y RNC de prueba. El simulador reproduce la tabla de §6 (rechazo, contingencia, timeout con efecto, 429, 5xx, duplicado, orden). Sin VPS, nube, credenciales reales ni push.
- **Variables (solo en `src/infrastructure/env.ts`, nombres propuestos):** `FACTURACION_MOTOR` (`local` por defecto; cualquier otro valor sin adaptador implementado falla cerrado, como `crmMotor`), `FACTURACION_BASE_URL`, `FACTURACION_CREDENCIALES` (JSON indexado por alias de entidad fiscal, deny por defecto como `CRM_WEBHOOK_DESTINATIONS`), `FACTURACION_TIMEOUT_MS`. Ningún secreto en el repositorio ni en el navegador (decisión #39).
- **Ambientes:** `certificacion` y `produccion` por entidad fiscal; producción exige aprobación Admin explícita registrada en auditoría.
- **Versión:** fijar versión de la API del PSFE y esquema de la DGII en el adaptador.
- **Calendario (D21 B.1, nota DGII 26-ago-2026):** Grandes Locales y Medianos, solo e-CF desde el **1-nov-2026** (series B válidas hasta el 31-oct); Pequeños, Micro y No clasificados, prórroga automática hasta el **15-nov-2026**. A 14-oct faltan 17 y 32 días. El grupo de cada RNC **no consta en el repositorio**: es la primera pregunta para Wilber. Plazos y sanciones a confirmar con el contador.

## 8. Pantallas nuestras que lo representan

- **M22 Cobros / estado de cuenta** (`../modulos/M22-cobros.md`): columna de comprobante por cuota (e-NCF, estado, enlace al documento) y acción "reintentar consulta" para Admin.
- **Comisiones:** estado fiscal por comisión (E41/E31 pendiente, aceptado, rechazado) y documento descargable.
- **G10 Integraciones y salud:** semáforo del adaptador, cola `facturacion`, DLQ, comprobantes en `INCIERTO`/`CONTINGENCIA` con antigüedad. Acción de conciliar manual solo Admin.
- **Configuración · Entidades fiscales:** alta de RNC por proyecto/fideicomiso, grupo DGII, ambiente, tipos habilitados. Solo Admin con `requireFullScope`.
- **Broker:** ve su propio comprobante de comisión; nunca el de otro (`visibleRows`).

Seis estados UX (carga, vacío, error, sin conexión, éxito, permiso insuficiente) a 320/390/768/1440 se especifican en las fichas de esas pantallas; el estado "PSFE caído" no bloquea registrar el cobro.

## 9. Pruebas y criterios de aceptación

**Suite de contrato** que corre idéntica contra el doble en memoria y contra el adaptador HTTP simulado:
1. `emitir` repetido con la misma clave devuelve el mismo e-NCF y crea un solo registro.
2. Timeout tras efecto → `INCIERTO` → `consultar` → estado final correcto sin segundo `emitir`.
3. Rechazo no consume reintentos y deja `RECHAZADO` con código; el origen puede corregirse y emitir con clave nueva.
4. `PagoAnulado` produce E34 con `referencia` correcta y solo si el original está ACEPTADO.
5. Dos pagos distintos nunca comparten comprobante; el mismo pago nunca genera dos comprobantes del mismo tipo.
6. 401, 403, 404, 409, 422, 429, 5xx, contingencia y evento fuera de orden según §6.
7. Aislamiento multientidad: un pago del proyecto A nunca se emite con el RNC del proyecto B.
8. El payload y los logs no contienen identificación del comprador fuera de la solicitud al puerto.
9. Guardas de arquitectura: ningún import del proveedor fuera de `src/infrastructure/integraciones/facturacion/**`; toda tabla nueva con RLS (`.enableRLS()`); toda ruta `api/webhooks/facturacion` verifica firma antes de leer el cuerpo; toda ruta de lectura llama a `requireScope`.
10. Gate final: `typecheck`, `lint`, `test`, `test:db`, `spec:check` y `build` en worktree limpio, con revisión de otro proveedor.

### Precondiciones de READY

1. **Entrada de datos de Wilber:** grupo DGII de cada RNC (1-nov vs 15-nov-2026) y lista de entidades fiscales (Quisqueya y cada proyecto/fideicomiso).
2. **PSFE elegido** con los criterios de §3.1, o decisión escrita de avanzar solo con el doble y el simulador. Ambos caminos se documentan; el adaptador concreto no entra en READY sin proveedor.
3. **Criterio contable firmado por el contador:** cuota de preventa con comprobante propio o recibo de anticipo; quién factura la comisión; ITBIS del corretaje y de la comisión de venta de inmueble; retenciones y su dispensa por NG 02-2026; plazo de conservación del XML.
4. **M22-cobros promovida a READY** (hoy REVIEW) con los eventos `PagoRegistrado`/`PagoAnulado` y su idempotencia; I00 en READY (claim/lease, orden por agregado, tipos de evento ampliados).
5. D11 valida DDL de `entidades_fiscales` y `comprobantes_fiscales`, identificación fiscal de contacto y broker, RLS y retención; D12 aprueba minimización de PII, alcance de credenciales y revisión de rutas; D14 define las pruebas de §9.
6. Confirmar con la DGII o el PSFE el significado exacto de los estados y el comportamiento de contingencia. Hasta entonces las equivalencias de §3 son UNKNOWN.

### Lotes pequeños de implementación tras READY (no despachados)

| Lote | Entrega y prueba | Archivos permitidos propuestos | Revisor |
|---|---|---|---|
| I03-A | Puerto `FacturacionPort`, tipos, `FalloFacturacion` y doble en memoria con suite de contrato (puntos 1–5 y 7). | `src/application/compartido/facturacion.ts`, `src/application/compartido/facturacion.test.ts`, `src/application/facturacion/**` | D12 + D14 |
| I03-B | Esquema `entidades_fiscales`, `comprobantes_fiscales`, RLS, índices únicos y repositorio; migración con el migrador oficial. | `src/infrastructure/db/schema.ts` (solo estas tablas), `drizzle/**` generado, `src/infrastructure/db/repos/facturacion.ts` y pruebas | D11 + D12 |
| I03-C | Casos de uso que reaccionan a `PagoRegistrado`/`PagoAnulado`/comisión, emisión transaccional al outbox y job de conciliación. Requiere M22 e I00. | `src/application/facturacion/**`, `src/infrastructure/integraciones/outbox/**` (solo la ampliación de tipos), contenedor | D11 + D12 + D14 |
| I03-D | Simulador PSFE y adaptador HTTP genérico con timeout y errores tipados; mismas pruebas de contrato (puntos 2, 6, 8, 9). Adaptador del proveedor real solo tras elegirlo. | `src/infrastructure/integraciones/facturacion/**`, `src/infrastructure/contenedor/facturacion.ts`, `src/infrastructure/env.ts`, guardas de arquitectura | D12 + D14 |
| I03-E | Pantallas de §8 con seis estados y cuatro anchos; webhook firmado si el PSFE lo ofrece. | `src/app/(crm)/**` acotado por ficha, `src/app/api/facturacion/**`, `src/app/api/webhooks/facturacion/**`, evidencia `.viltrum/` | D07 + D12 + D14 |

Cada lote cita esta ficha solo después de READY, va a worktree aislado con `TAREA.md`, dura como máximo 45 minutos por agente y la revisa otro proveedor. Ningún lote activa producción ni hace push.

## 10. Riesgos, licencia y plan de salida

- **Plazo:** 17 días hasta el 1-nov-2026 para elegir, contratar, certificar y conectar. Riesgo de incumplir y de infracciones de la Ley 32-23 (art. 26, según Aviso 12-25). Mitigación: dos caminos en paralelo (PSFE con API; Facturador Gratuito de la DGII como respaldo manual con registro posterior del e-NCF en el CRM, decisión de Wilber y del contador).
- **Duplicación fiscal** por reintento ciego tras timeout: mitigada por clave de idempotencia, estado `INCIERTO` y regla de no reemitir.
- **Criterio fiscal inferido** (ITBIS del corretaje, retenciones, anticipos): no es norma específica; el contador decide. Una regla errónea genera notas de crédito masivas.
- **PII de compradores** (RNC, cédula, nombre) enviada a un tercero: minimización, contrato de tratamiento y Ley 172-13 sin investigar.
- **Dependencia de un solo PSFE y de sus certificados.** Salida: el contrato de §3 es neutral; cambiar de proveedor es cambiar el adaptador y la configuración. Los comprobantes ya emitidos conservan e-NCF, TrackId y referencia al XML en el CRM; exigir contractualmente la exportación de todos los XML antes de firmar. Cambiar de PSFE no reinicia secuencias del emisor: lo confirma el proveedor entrante.
- **Licencia:** no se incorpora código de terceros; el contrato comercial del PSFE se revisa antes de firmar.
- **Opciones descartadas:** firma XMLDSig y certificación propias (plazo), ERPNext como emisor (sin e-CF, D21 B.3) y Odoo (su módulo e-CF es probablemente Enterprise, no verificado, D21 B.3), FacturacionV3 (decisión de Wilber).

## Evidencia

- `.viltrum/research/D21-catalogo-crm-inmobiliario-y-contabilidad-rd-2026-10-14.md` Parte B (B.1 calendario y tipos, B.2 obligaciones, B.3 y B.4 recomendación, B.5 brechas) y Parte A (A7, A8, A20). Fuentes DGII citadas allí: [listados y calendario](https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/Listados-contribuyentes-obligados-implementar-facturacion-electronica.aspx), [tipos e-CF](https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/TipoyEstructurae-CF.aspx), [Facturador Gratuito](https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/facturador-gratuito.aspx), [nota del 26-ago-2026](https://dgii.gov.do/noticias/Paginas/DGII-informa-emision-exclusiva-de-facturas-electronicas-para-Grandes-Locales-y-Medianos-contribuyentes-desde-noviembre.aspx), [Aviso 12-25](https://ws945695e.dgii.gov.do/publicacionesOficiales/avisosInformativos/Documents/2025/12-25.pdf), [consulta técnica 17 de 2024 sobre ITBIS en transferencia de inmuebles](https://dgii.gov.do/legislacion/consultas/Consultas%20Tecnicas%202024/Agosto/Consulta%2017-ITBIS%20Transferencia%20inmobiliarias.pdf) y [KPMG sobre la NG 02-2026](https://kpmg.com/do/es/tendencias/flashes-fiscales/flash-fiscal-republica-dominicana-dgii-emite-norma-general-que-excluye-de-determinadas-retenciones-delitbis-a-emisores-electronicos.html) (fuente secundaria).
- `.viltrum/vre-os/PLAN-INTEGRAL-2026-10-14.md` §§2, 3, 6, 7 y `ARQ-VRE-002-integraciones.md` §§2.4–2.6 y 4.
- Código leído: `src/application/compartido/crm.ts` (patrón `FalloCrm`, `EventoCrm`), `src/infrastructure/db/schema.ts` (`outbox`, `external_refs`, `webhook_inbox`; ausencia de RNC/cédula en `contacts` y `broker_profiles`), `src/infrastructure/env.ts` (`crmMotor`, `CRM_WEBHOOK_DESTINATIONS`). Ficha hermana: `I00-outbox-base.md`.
- Pendiente de verificación (UNKNOWN): lista oficial de PSFE, textos de los avisos 06-26 y 14-26, estados exactos de la DGII, plazo de conservación del XML, Ley 172-13.
