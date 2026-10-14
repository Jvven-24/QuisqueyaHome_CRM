# Plan integral · CRM Quisqueya Home completo (14-oct-2026)

> D00 (Claude Opus) a petición de Wilber: «analiza todas las funciones que va a tener según los CRM inmobiliarios, el enlace con el portal web y las aplicaciones open source que se van a adaptar (Moodle para Academy, contabilidad…) y déjalo lo más terminado posible».
> Decisiones del día: #48 (subagentes Claude producen; Moodle nativo local; Claude cierra Negocios c1a) y, en el chat, **FacturacionV3 no se usa**.
> Este plan **no sustituye** al mandato `M-20261004-VRE.md` ni al mapa `MAPA-SISTEMAS-OSS.md`: los completa con lo que faltaba (catálogo funcional de referencia, capa financiera y fiscal RD, enlace real con el Portal, Moodle verificado) y fija el orden.

## 0. Fuentes (todas del 14-oct, con evidencia archivo:línea o URL)

| Expediente | Qué aporta |
|---|---|
| `research/D21-inventario-funcional-crm-2026-10-14.md` (Haiku) | Estado real de los 17 módulos del código |
| `research/D21-catalogo-crm-inmobiliario-y-contabilidad-rd-2026-10-14.md` (Sonnet) | 126 capacidades de referencia en 21 dominios; e-CF, ITBIS, retenciones, PLAFT; licencias contables |
| `research/D19-enlace-portal-crm-2026-10-14.md` (Haiku) | Contrato real Portal ↔ CRM y huecos |
| `research/D21-moodle-local-integracion-2026-10-14.md` (Sonnet) | Versiones, instalación nativa, 18 web services, SSO |
| `research/D21-facturacionv3-como-capa-fiscal-2026-10-14.md` (Haiku) | Por qué FacturacionV3 no sirve como capa fiscal (descartada por Wilber) |

## 1. Diagnóstico en una tabla

Madurez verificada en código hoy → qué le falta para ser un CRM inmobiliario completo → quién lo cubre.

| Dominio (catálogo A.x) | Módulo CRM | Hoy | Falta (esencial primero) | Lo cubre |
|---|---|---|---|---|
| A1 Captación y leads | Leads | REAL | reglas de distribución y titularidad de leads de brokers externos; importación masiva; dedup E.164 | propio + libphonenumber-js |
| A2 Nurturing | Comunicaciones | PARCIAL | bandeja unificada, historial por contacto, plantillas Meta | runtime propio (YCloud/Meta) detrás de `MensajeriaPort` |
| A3 Inventario | Propiedades, Avances | REAL | listas de precios versionadas; estado legal (Confotur, fiduciaria, permisos); bandera «publicar en el portal» por unidad | propio |
| A4 Cotizaciones y planes de pago | — (API Confotur sin UI) | AUSENTE | cotización formal PDF; plan 10/40/50; reglas | react-pdf + GoRules Zen |
| A5 Reservas | Negocios (cierre con unidad única) | PARCIAL | apartado con caducidad; concurrencia (100 → 1) | propio |
| A6 Contratos | — | AUSENTE | contrato ligado a fiduciaria; cesión; rescisión | propio (sin firma digital, decisión 4-oct) |
| **A7 Cobros y estado de cuenta** | — | **AUSENTE** | cronograma de cuotas, imputación de pagos, estado de cuenta, mora, USD/DOP con tasa congelada | **propio (subauxiliar comercial)** |
| A8 Comisiones | Comisiones, Metas | REAL | devengo por cobro, reversa, retenciones ISR/ITBIS, documento fiscal del broker | propio + `FacturacionPort` |
| A9/A10 Portales cliente y broker | — | AUSENTE | Client Room (pagos, documentos, avance) y portal del broker | propio + Papermark (E3) |
| A11 Marketing y ROI | Reportes | REAL sin gasto | gasto por campaña y ROI por canal | propio |
| A12 Agenda | Agenda, Tareas | PARCIAL | editar/cancelar; zonas horarias de la diáspora | Schedule-X + ical |
| A13 Reportes | Inicio, Reportes | REAL | widgets por rol | propio (Recharts) |
| A14 Rentas | — | AUSENTE | contratos, cobros mensuales, mantenimiento | OpenProperty (PORT) |
| A15 Postventa | — | AUSENTE | entrega, acta, lista de detalles, escrituración | propio |
| **A16 Formación** | Academy | REAL (consumo local) | cursos reales, matrícula, evidencia, aprobación Admin, certificado | **Moodle (RUN) detrás de `AprendizajePort`** |
| A18 PLAFT (Ley 155-17) | — | AUSENTE | debida diligencia, matriz de riesgo, reporte a la UAF | propio (el negocio es sujeto obligado) |
| A19 Auditoría | `audit_log` | REAL | doble aprobación de descuentos, cancelaciones y reversos | propio |
| **A20 Capa financiera** | — | **AUSENTE** | e-CF, libro mayor, 606/607/608/609, cuentas por fideicomiso | **ver §3** |

## 2. Arquitectura de enlace (sin cambiar ARQ-VRE-002)

El CRM es el **frente único** y la **fuente de verdad comercial**. Cada sistema externo vive aparte y se ve por un puerto de `src/application/**`, con adaptador en `src/infrastructure/integraciones/<sistema>/`, eventos por el outbox transaccional y un doble en memoria para las pruebas de contrato.

| Puerto | Sistema | Dirección | Mecanismo | Estado 14-oct |
|---|---|---|---|---|
| `CrmPort` | Twenty (espejo) | CRM → Twenty | outbox | adaptador local no-op; Twenty detenido |
| `MensajeriaPort` | runtime propio (YCloud/Meta) | ↔ | API + webhook firmado | despacho ya auditado (14-oct) |
| `AprendizajePort` | **Moodle 4.5 LTS local** | CRM → Moodle (alta/baja), Moodle → CRM (lectura) | REST `webservice/rest/server.php` + reconciliación por sondeo | instalación en curso (D16) |
| `FacturacionPort` | **PSFE autorizado con API** (por contratar) | CRM → emisor | outbox → emisión e-CF; el CRM guarda e-NCF, TrackId, estado | por especificar |
| `ContabilidadPort` | ERPNext (condicionado) o exportes al contador | CRM → libro | outbox | diferido (decisión del contador) |
| `PortalPort` (nuevo) | Portal web (Postgres propio) | CRM → Portal | outbox: `UnidadPublicada`, `UnidadRetirada`, `DisponibilidadCambiada` | ausente |
| webhook de leads | Portal → CRM | Portal → CRM | `POST /api/leads/externo` con token, idempotente por `externalId` | acuse corregido (`leadId`), falta HMAC y outbox del lado Portal |

Reglas que se mantienen: nada del sistema externo se incrusta en nuestra interfaz; los secretos solo en `env.ts`; los webhooks verifican firma antes de parsear; ningún sistema externo aprueba nada por el CRM (Moodle no certifica; el emisor no decide precios).

## 3. Capa financiera y fiscal (FacturacionV3 descartada)

Tres piezas con responsabilidades separadas, no un ERP que duplique el CRM:

1. **CRM = subauxiliar comercial.** Contratos, cronograma de cuotas, pagos imputados, estado de cuenta, mora, comisiones devengadas y retenciones calculadas. Es nuevo código propio (módulo **Cobros**), porque ningún sistema evaluado modela la preventa dominicana con plan 10/40/50 contra avance de obra.
2. **Emisión e-CF por un solo punto: proveedor PSFE autorizado con API**, detrás de `FacturacionPort`. Desde el **1-nov-2026** Grandes Locales y Medianos solo emiten e-CF (series B válidas hasta el 31-oct); Pequeños, Micro y No clasificados, prórroga hasta el **15-nov-2026** (nota DGII del 26-ago-2026). Construir firma XMLDSig, certificación y contingencia propias no cabe en ese plazo. El CRM nunca genera numeración fiscal.
3. **Libro mayor:** ERPNext (GPLv3, REST, multiempresa) **solo si el contador lo acepta**; si el contador usa su software, el CRM exporta subauxiliares y los formatos 606/607/608/609 y ERPNext no se despliega todavía. Descartados por licencia o alcance: Akaunting (BSL 1.1), Invoice Ninja (Elastic 2.0, sin partida doble), Frappe Books (archivado), Odoo (duplicaría el CRM; e-CF probablemente Enterprise).

Puntos fiscales a confirmar con el contador (inferencias, no norma específica): venta de inmueble **no sujeta** a ITBIS; corretaje gravado al 18 %; ISR 10 % a honorarios de personas físicas; retención de ITBIS 100 %/30 % y su dispensa si el proveedor es emisor electrónico (NG 02-2026).

## 4. Academy con Moodle

- **Versión:** Moodle **4.5 LTS** sobre el PostgreSQL 15 existente (base `moodle`, rol propio), PHP 8.3 NTS, servidor integrado en `127.0.0.1:9330`, cron por el Programador de tareas. Elegida porque Wilber pidió usar el PostgreSQL que ya corre; **5.3 LTS exige PostgreSQL 17** (y 5.2, 16). Seguridad de 4.5 hasta **oct-2027**: la actualización a 5.3 requiere un clúster PG17 y es una tarea D16 aparte.
- **Contrato:** `AprendizajePort` con `asegurarUsuario`, `matricular`, `suspender`, `leerEvidencia(curso, usuario)` (finalización por actividad, notas) y `listarCursos`. Funciones REST verificadas en el expediente. Errores: `{exception, errorcode, message}` y fallos silenciosos en `warnings` con HTTP 200, que el adaptador trata como error.
- **Regla firmada (Q-C1-03):** el progreso de Moodle es evidencia; **la certificación la aprueba un Admin en el CRM**. No se instala `mod_customcert` en el primer corte.
- **SSO:** fuera del primer corte (`auth_userkey` no declara soporte en 5.x; OIDC con Supabase sin verificar). El broker entra a Moodle con su usuario; el CRM muestra su avance.

## 5. Portal web

Repo vigente: `Documents/QuisqueyaHome PortalWeb` (`QHPortalWeb` es un enlace al mismo). Hoy el único enlace real es Portal → CRM por `/api/leads/externo`, y solo para clientes con sesión.

| Prioridad | Hueco | Lado |
|---|---|---|
| P0 | **Token del webhook escrito como valor por defecto en el código del Portal y presente en GitHub desde el 3-oct**: rotarlo y quitar el valor por defecto | Portal + Wilber |
| P0 | Acuse roto (`result.leadId`) | **CRM corregido 14-oct** (respuesta aditiva `leadId`) |
| P1 | Enviar origen, UTM, proyecto y unidad por código estable (el CRM ya los acepta) | Portal |
| P1 | Outbox y reintentos en el Portal; HMAC en lugar de token estático | Portal + CRM |
| P1 | Publicar o retirar una unidad desde el CRM (bandera en `units`, eventos por `PortalPort`) | CRM (ficha nueva) |
| P1 | Disponibilidad con un solo escritor (`units.status` del CRM) | CRM + Portal |

## 6. Orden de construcción

Cada frente: ficha `READY` → producción (subagente Sonnet) → revisión con comandos (Opus) → commit en `develop` sin push → revisión de otro proveedor pendiente (#48).

| # | Frente | Ficha | Estado 14-oct |
|---|---|---|---|
| 1 | Negocios c1a/c1b/c2 (tablero, lista, análisis, diálogos) | M03 READY | en curso |
| 2 | Correcciones de seguridad y enlace (despacho auditado, worker del outbox, acuse `leadId`, candado de rutas `[id]`) | hallazgos (no es función nueva) | hecho, en revisión final |
| 3 | Moodle local + `AprendizajePort` + adaptador + vista de evidencia y aprobación Admin | I02 + M13 → READY | instalación en curso |
| 4 | Leads (E1.2) | M01 (Codex la lleva a READY) | ficha en curso |
| 5 | **Cobros y estado de cuenta** (plan de pagos, cuotas, imputación, mora, USD/DOP) | nueva **M22-cobros** | por escribir |
| 6 | `FacturacionPort` con doble + adaptador PSFE cuando se elija proveedor | nueva **I03-facturacion-ecf** | por escribir; requiere elegir PSFE |
| 7 | Publicación de unidades y disponibilidad hacia el Portal | nueva **I04-portal** | por escribir |
| 8 | Propiedades, Brokers, Integraciones (E1.3–E1.5) | fichas E1.3a–E1.5a | en cola |
| 9 | Cotizaciones PDF + reservas con caducidad + contratos | fichas W4 | en cola |
| 10 | PLAFT, postventa, Client Room, Rentas | fichas nuevas | en cola |

## 7. Lo que necesita a Wilber

1. **Grupo DGII de cada RNC** (Quisqueya y cada proyecto o fideicomiso): define si el plazo e-CF es el 1-nov o el 15-nov.
2. **Proveedor PSFE con API** (o el Facturador Gratuito de la DGII como respaldo manual).
3. **Contador:** ¿lleva los libros en su software o en ERPNext?
4. **Rotar el token del webhook del Portal** (está en GitHub).
5. ¿El broker debe poder **despachar mensajes** desde Comunicaciones? Hoy, tras la corrección, solo admin y asistente.
6. Oficial de cumplimiento PLAFT y registro ante la UAF.
