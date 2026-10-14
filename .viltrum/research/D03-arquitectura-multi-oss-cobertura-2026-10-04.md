# D03 · Arquitectura multi-OSS y medición de cobertura

**Fecha:** 2026-10-04  
**Perfil productor:** D03  
**Estado:** propuesta para revisión independiente D12 (seguridad y licencias), D14 (pruebas) y decisión humana. No aprueba gate ni cambia la fuente de verdad.  
**Ámbito:** M01–M15 de `.viltrum/commercial.md` y el inventario ampliado de `.viltrum/research/D21-catalogo-funcional-vre-2026-10-04.csv`, operación local y UI propia del CRM. El catálogo D21 es investigación inicial, no ampliación aprobada del C1.

## Decisión vigente y conflicto documental

La decisión #43 y `ARQ-VRE-002-integraciones.md` establecen PostgreSQL local como fuente canónica de contactos, leads, negocios y actividades; Twenty solo puede ser un espejo reconstruible hasta una PoC, ensayo de migración y aprobación humana. El Blueprint maestro §11 y §41 asigna esas entidades a Twenty. Para implementación actual prevalece la decisión posterior #43. El Blueprint conserva valor como diseño objetivo hipotético; sus tablas no autorizan transferir propiedad. Tampoco el expediente de alternativas D21 elige SuiteCRM: ese reemplazo es una hipótesis condicionada a brechas demostradas de Twenty.

## Límites por entidad y servicio

| Capacidad | Dueño de la entidad/acción hoy | Sistema externo y datos permitidos | Puerto/contrato propio | Condición de cambio |
|---|---|---|---|---|
| Contacto, lead, negocio, actividad comercial | PostgreSQL CRM | Twenty, espejo por ID; SuiteCRM solo candidato | `CrmPort` ampliado por casos de uso, `external_refs` | PoC de campos, roles y operaciones; migración reversible aprobada |
| Propiedad, unidad, disponibilidad, precio, reserva | PostgreSQL CRM | Referencia o proyección mínima en CRM externo | Repositorios de dominio; eventos de inventario | No ceder propiedad por instalar una suite |
| Broker, identidad y autorización | Identidad y política del CRM | Identificador vinculado en Moodle, CRM externo y demás servicios | `IdentidadPort`/provisión y política en BFF | SSO probado, revocación y alcance por rol |
| Curso, matrícula, progreso, evaluación, certificado | Moodle tras PoC; hasta entonces M10 no se declara implementado | CRM guarda ID externo y proyección autorizada de progreso | `AprendizajePort` | API por función y versión, permisos, reconciliación |
| Intención comercial, consentimiento, historial de conversación | PostgreSQL CRM | Runtime de mensajería posee entrega, identificadores de canal y estado técnico; Twenty solo espejo | `MensajeriaPort`, inbox de webhooks | Consentimiento, retención, correlación y canal verificados |
| Cita de broker | PostgreSQL CRM | Schedule-X solo renderiza; **Cal.diy** es candidato MIT para PoC local de reserva pública, sin aptitud productiva ni paridad API demostradas | `AgendaPort`, iCalendar RFC 5545 | Definir conflictos, cancelación y autoridad del calendario; evaluar alternativa si Cal.diy no cumple |
| Expediente/documento y acceso | PostgreSQL CRM | Almacén posee binario; Papermark, si se adopta, posee seguimiento de lectura del dossier | `DocumentosPort`, `AlmacenamientoPort` | Clasificación, permisos, caducidad y exportación probados |
| Comisión y regla dominicana | PostgreSQL CRM | ERPNext futuro posee asientos/facturas formales, no el cálculo comercial de origen | `FinanzasPort` | DGII/e-CF, conciliación y aprobación humana |
| Búsqueda y analítica | Datos canónicos por entidad | FTS/`pg_trgm` y proyecciones derivadas, reconstruibles | `BusquedaPort` o consulta BFF autorizada | Medición de necesidad antes de motor adicional |

Un servicio RUN conserva su propia base, procesos, configuración y licencia. `external_refs` enlaza exclusivamente IDs estables de cada lado; nombres, correos y teléfonos no son claves de unión. Cada dato replicado declara origen, versión y fecha de sincronización. Un adaptador PORT/APP tiene una evaluación de licencia distinta de RUN.

## Contratos, identidad y eventos

El navegador usa únicamente el BFF de Next.js. El BFF autentica, valida tenant y políticas contextuales, y llama casos de uso; estos dependen de puertos por capacidad, no de SDKs de proveedores. Los tokens de servicios permanecen en servidor y con el menor alcance posible. SSO OIDC es una opción a probar por proveedor y versión; no debe suponerse que compartir un correo crea identidad única. La provisión y revocación de cuentas, mapeo de IDs, roles y cambios de permisos forman parte del contrato. Una clave técnica única con privilegio administrador no sustituye los controles del CRM ni acredita aislamiento de broker.

Las escrituras locales publican eventos desde un outbox en la misma transacción. El worker reclama con lease y llama al servicio remoto fuera del lock de PostgreSQL; el resultado se finaliza condicionalmente. Reintentos conservan ID e idempotencia, con reconciliación para resultados inciertos. Webhooks entrantes verifican autenticidad, registran inbox/deduplicación y se transforman en comandos de dominio. No se habilita sincronización bidireccional genérica. Eventos mínimos por flujo: `LeadCreado`, `NegocioCambioEtapa`, `ActividadRegistrada`, `CitaProgramada/Cancelada`, `MatriculaCreada`, `ProgresoActualizado`, `CertificadoEmitido`, `MensajeEntregado/Fallido`, `DocumentoCompartido/Leido`, `ComisionDevengada`. Payloads y PII se minimizan y versionan.

Moodle documenta funciones de Web Services configurables por instancia y extensibles mediante funciones externas, no una garantía de que toda su interfaz pueda reconstruirse por API. Ver [External Services](https://moodledev.io/docs/5.0/apis/subsystems/external) y [Function Definitions](https://moodledev.io/docs/5.1/apis/subsystems/external/functions). Cada PoC debe inspeccionar las funciones habilitadas en la instancia fijada y probar operaciones con un usuario limitado.

La revisión D12 distingue [Cal.diy](https://github.com/calcom/cal.diy) de Cal.com: su [licencia MIT](https://github.com/calcom/cal.diy/blob/main/LICENSE) permite evaluar el código, pero el README recomienda uso personal no productivo y señala la retirada de capacidades de equipos, workflows y SSO. La reserva pública queda como hipótesis aspiracional hasta probar slots, booking, cancelación, conflictos, privacidad e identidad en una instancia local fijada. No se le atribuyen APIs o funciones de Cal.com por semejanza de nombre.

## UX unificada y cálculo de cobertura

Descargar, instalar o arrancar un OSS pone en funcionamiento su servidor y quizá su interfaz propia. No introduce automáticamente en Next.js sus acciones, vistas, permisos, traducciones, estados de error, eventos ni accesibilidad. La UI propia necesita flujos verticales completos: componente, ruta BFF, política, caso de uso, adaptador, persistencia/proyección, observabilidad y seis estados UX (carga, vacío, error, sin conexión, éxito, permiso insuficiente).

La unidad de cobertura es una **operación observable del usuario**, definida con: clave funcional estable del catálogo D21 (`key`), clasificación `contractual` o `aspiracional`, referencia de origen, actor/rol, verbo y objeto, precondiciones/reglas, resultado y estados, dueño de datos, versión del proveedor, endpoint o extensión exacta, evidencia positiva y negativa por API, y evidencia en nuestra UI. El ID de módulo C1 (`M01`–`M15`) es una referencia de alcance, **no** el ID de la función ni del módulo del Blueprint; no se mezclan ni se infiere correspondencia uno a uno por números iguales. Una ruta CRUD o una pantalla del proveedor no equivale a una función integrada. Las 522 operaciones OpenAPI capturadas de Twenty no son 522 funciones entregadas.

Cada operación se clasifica en `integrada y probada`, `API probada sin UI`, `requiere extensión`, `solo UI del proveedor`, `ausente` o `desconocida`. El CSV D21 contiene **61 filas contractuales C1** y **74 aspiracionales**, **135 filas de inventario inicial en total**. Son dos denominadores que se publican siempre por separado:

| Vista | Denominador inicial sin ponderar | Fórmula de cobertura entregada |
|---|---:|---|
| Contrato C1 | 61 funciones `contractual` | Funciones contractuales `integrada y probada` / 61 × 100 |
| Programa completo en estudio | 135 funciones `contractual` + `aspiracional` | Funciones del inventario total `integrada y probada` / 135 × 100 |

También se reporta el corte aspiracional separado (74) para que el porcentaje del programa no oculte el avance del contrato. Si D02 y el aprobador corrigen, fusionan o amplían filas, se versiona el catálogo y se recalculan ambos denominadores; nunca se cambia retrospectivamente el alcance C1 por sumar ideas D21. **135 no es alcance humano aprobado ni porcentaje final**. Ningún porcentaje se presenta como medido hasta revisar unicidad de claves, granularidad de las filas, pruebas y estados reales.

En una vista ponderada futura, la fórmula es `suma de pesos de operaciones integradas y probadas / suma de pesos de operaciones del mismo universo × 100`, aplicada por separado a C1 y al inventario completo. Los pesos se fijan antes de evaluar candidatos según valor/riesgo y se publica siempre el conteo sin ponderar. El potencial OSS se informa aparte: `API probada sin UI` y `requiere extensión` solo cuentan como potencial con esfuerzo y licencia explícitos, nunca como entrega. Lo desconocido queda en el denominador y se muestra como fracción propia. Toda fila conserva enlace a evidencia y al proveedor/versión evaluados.

El estudio D21 de sustitutos CRM queda como apéndice del catálogo multi-OSS. Primero se mide la brecha de Twenty y de los demás servicios por operación. Ninguna puntuación global elige arquitectura sin esa evidencia.

## PoC local y criterios de avance

1. Revisar las 61 operaciones C1 y las 74 aspiracionales del catálogo D21 con claves únicas, granularidad y trazabilidad al mandato; fijar pesos y pruebas de aceptación por ambos universos. Resolver contradicciones de etapas y roles antes de comparar proveedores. Esta revisión no amplía C1 por sí sola.
2. Fijar la versión de Twenty local y probar con datos sintéticos campos, etapas, tareas, actividad, workflow, permisos negativos, exportación e idempotencia. Corregir el outbox local antes de conectarlo. SuiteCRM se prueba solo si aparece una brecha decisiva.
3. Instalar Moodle aislado **localmente**, fijar versión y comprobar curso → matrícula → progreso → certificado por API y por broker, incluida revocación de acceso. Sin VPS ni nube.
4. Probar mensajería con datos sintéticos y transportes permitidos, consentimiento, reintento y reconciliación; comprobar si el runtime existente sirve al entorno local sin transmitir datos reales.
5. Probar agenda, documentos y finanzas por flujo acotado, en ese orden, con owner único, exportación y fallo del proveedor. ERPNext no recibe datos financieros reales hasta cerrar DGII/e-CF.
6. Construir una pantalla vertical en la UI propia por servicio, verificar seis estados, roles, accesibilidad, trazas y recuperación. Medir cobertura y recursos operativos; D12 revisa seguridad/licencias y D14 verifica de forma independiente.

La investigación aislada con datos sintéticos puede producir evidencia antes de marcar una ficha `READY`; la integración de código productivo exige contrato y revisiones vigentes. La PoC amplia de tres motores en dos jornadas del expediente D21 no es una estimación comprometida. Esta propuesta no ejecuta instalaciones, migraciones, despliegues ni cambios de propietario.
