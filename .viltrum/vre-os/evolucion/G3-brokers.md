# Expediente de evolución · Brokers (G3)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Autor: D21 + D03 + D05 (subagente Sonnet), solo documentos. **No aprueba su propio trabajo**; revisión independiente pendiente (decisión #48).
> Reglas: misma tecnología primero; copiar/portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído); AGPL/GPL/ELv2 solo como servicio aparte o referencia. Nada se incrusta; todo por puertos y outbox.
> Fuentes: código citado, `D21-catalogo-…-rd-2026-10-14.md` (A1.5, A8.6, A10, A13.4, A16.3, A18.8), `D21-inventario-funcional-crm-2026-10-14.md`, `tareas/T-E1-4a-ficha-brokers.md` (ficha M07 aún sin escribir). Hermanos: `G3-comisiones.md`, `G3-metas.md`, `G3-academy.md`, `G3-reportes.md`, `G3-inicio.md`. Los expedientes G1 (Leads) y G2 (Propiedades) son de otros agentes y se citan solo por nombre.

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 2 | `/brokers`: tarjetas con nivel, ventas del año, negocios activos y % de meta; «Asignar propiedades» (`PUT /api/brokers/[id]/proyectos`, `application/brokers/casos-de-uso.ts:19-62`); invitar reutiliza `FormularioUsuario` de Configuración. `/brokers/[id]`: solo lectura (proyectos, negocios abiertos, 6 metas). **Editar el perfil del broker no existe en su ficha** (`brokers/[id]/page.tsx:3-8`) |
| Datos reales y reglas de negocio | 2 | `broker_profiles` (`schema.ts:213-227`): `specialty`, `agencyId`, `handlesRentals`, `level`, `annualSalesCents`, `monthlyTargetDeals`. `agencyId` y `handlesRentals` **no se leen en ninguna pantalla** (`agencies` sin uso, inventario D21). Sin datos fiscales, KYC, contrato de corretaje, cuenta de pago, tipo interno/externo ni acuerdos de co-broking |
| Diseño y componentes | 2 | Clases del prototipo (`broker-card`, `level-scale`, `progress-line`) y `Modal` propio; la «escala de niveles» es decorativa (`brokers/vista.tsx:64-75`); no usa `DataTable`/`Sheet` |
| Experiencia de uso | 2 | Sin buscador ni filtros, sin vista tabla, sin comparar, sin acciones masivas, sin ficha con pestañas |
| Calidad | 2 | `brokers/casos-de-uso.test.ts` (177 líneas). Sin `error.tsx`/`loading.tsx` de módulo; `page.tsx` y `[id]/page.tsx` consultan BD directo con `getDb()`; `Vacio` sí existe |

**Objetivo: 4** — ficha 360° del broker (perfil, datos fiscales, KYC, rendimiento, comisiones, metas, formación), co-broking, onboarding con formación obligatoria y escritorio propio del broker.

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **Negocios del broker sin filtro de alcance.** `brokers/[id]/page.tsx:72-84` lista contactos, montos y etapas de los negocios del broker pedido sin `visibleRows` ni `can(actor,"deals","view")`; solo comprueba que el actor «alcanza» al broker (`reaches`, `:62`). Un rol personalizado con `brokers:view` y sin `deals:view` vería montos y nombres de contactos. Con los roles del seed no explota (admin/asistente/broker ya tienen `deals:view`), pero es una puerta abierta a la deriva de permisos.
2. **Nivel calculado con monedas mezcladas.** `annual_sales_cents` y `level` salen de `SUM(deals.amount_cents)` sin moneda (`repos/pipeline.ts:272-289`; `cierre-negocio.ts:104-127`): un cierre en DOP puede subir de nivel a un broker. Mismo hallazgo que en `G3-metas.md` punto 1.
3. **Umbrales de nivel provisionales.** Solo Senior = US$500 000 viene del prototipo; los otros tres cortes son inventados (`cierre-negocio.ts:76-103`) y están en una constante, no editables por el negocio.
4. **«Ventas del año» y «Negocios activos» se muestran con `formatearMonto(…, "USD")` fijo** (`brokers/vista.tsx`, `formato.ts:14-19`): un broker con ventas en DOP ve un número en dólares.
5. **Cero visibilidad del equipo para un broker.** `brokers:view:own` (`db/seed.sql:88`) hace que `/brokers` muestre solo su propia tarjeta; es coherente con la privacidad, pero impide cualquier ranking o comparación sin un permiso nuevo (`global_metrics` existe y no se usa, `catalogs.ts:52`).
6. **Sin `error.tsx`/`loading.tsx` y consultas fuera de `application`** (patrón repetido en Comisiones y Metas); las dos páginas hacen 4–5 consultas en paralelo sin paginación (todas las tarjetas a la vez).
7. **Datos sensibles futuros sin dueño**: RNC/cédula, cuenta bancaria y documentos KYC del broker externo no tienen tabla ni política de cifrado/minimización (A10.2, A18.8); `ENTITY_TYPES` no incluye `broker` (`catalogs.ts:61-90`).
8. **Anular lo que ya está asignado**: desactivar un broker (`PATCH /api/usuarios/[id]`) no revisa ni reasigna leads, negocios, comisiones pendientes ni matrícula de Moodle; el evento `BrokerAccesoRevocado` (M13/I02) aún no existe.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| BRK-01 | **Ficha 360° con pestañas**: Resumen · Rendimiento · Negocios · Comisiones · Metas · Formación · Documentos · Actividad; en hoja lateral y en página | ESENCIAL | A13.4 | Solo lectura básica |
| BRK-02 | **Edición del perfil** desde la ficha (especialidad, agencia, zonas, idiomas, rentas) con auditoría | ESENCIAL | A10.1 | Solo en Configuración › usuarios |
| BRK-03 | **Tipo de broker** (interno, externo con agencia, referidor) y alta de broker externo con **KYC**, contrato de corretaje y datos fiscales (RNC/cédula, cuenta de pago) | ESENCIAL | A10.2, A18.8 | No existe |
| BRK-04 | **Rendimiento** por broker: leads atendidos, tiempo al primer contacto, conversión, ventas, comisión devengada, cobrado de sus clientes, mora de sus compradores; comparado con el equipo (admin) | IMPORTANTE | A13.4 | Tres números |
| BRK-05 | **Co-broking**: acuerdos entre agencias (vigencia, reparto por defecto, documento firmado), participación del broker externo en un negocio (listing/selling/referido) | ESENCIAL | A8.6, A1.5 | No existe |
| BRK-06 | **Onboarding por checklist** (documentos, contrato, formación, primer curso, asignación de proyectos) con estado visible para admin y broker | IMPORTANTE | A10.5, A16.3 | No existe |
| BRK-07 | **Formación como requisito**: el broker solo opera inventario de un proyecto si tiene la constancia aprobada de ese proyecto (consume Academy) | IMPORTANTE | A10.5, A16.3 | No existe |
| BRK-08 | **Escritorio del broker** («Mi cuenta»): mi meta, mis comisiones (devengado/pagado/retenido), mis clientes con mora, mis cursos, mi kit de ventas | IMPORTANTE | A10.1, A10.4 | Parcial en Inicio |
| BRK-09 | **Kit de ventas y material** por proyecto con enlace rastreable (UTM por broker) | IMPORTANTE | A10.3 | No existe |
| BRK-10 | **Vistas y filtros**: tabla y tarjetas, búsqueda, filtros (nivel, agencia, tipo, estado de KYC y de formación), orden, acciones masivas (asignar proyectos, enviar mensaje) | IMPORTANTE | — | Solo tarjetas |
| BRK-11 | **Tabla de posiciones** opt-in con permiso `global_metrics` (ver `G3-metas.md` MET-10) | DESEABLE | A10.4 | No existe |
| BRK-12 | **Baja ordenada**: desactivar broker reasigna o marca para revisión leads, negocios, comisiones y matrícula; evento `BrokerDesactivado` | ESENCIAL | A21.2 | Sin cascada |
| BRK-13 | Niveles y umbrales editables (ver `G3-metas.md` MET-08) y explicación visible de cómo sube de nivel | IMPORTANTE | A10.4 | Constante |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **TanStack Table** | `TanStack/table`, npm `@tanstack/react-table@9.3.1` (push 2026-10-12; 28 489 estrellas); última 8.x: `8.21.3` (2025-04-14) | MIT | React ≥18 | Tabla del directorio de brokers con filtros facetados, ordenación y visibilidad de columnas; hoy `DataTable` propio (`src/components/ui/data-table.tsx`) ya cubre orden, paginación, acciones masivas y modo móvil | APP **condicional** | La v9 es una versión mayor reciente: **API no verificada**; solo si `DataTable` se queda corto (agrupar, fijar columnas, virtualizar) | M |
| **nuqs** | npm `2.10.2` (gitHead `07afd0f21219`, 2026-10-08) | MIT | Next 14.2+ | Filtros del directorio en la URL (compartibles) | APP | Total | S |
| **Trophy UI kit** | `trophyso/ui` (149 estrellas; fecha del último commit **no verificada**) | MIT | shadcn registry, Tailwind v4 | Patrón de `leaderboard-card` y `streak-badge` para BRK-11 | PORT (copiar con cabecera) | Estilo propio; solo con permiso `global_metrics` | S |
| **react-grid-layout** | npm `2.3.0` | MIT | React | Módulos reordenables del «Escritorio del broker» (BRK-08), compartiendo el registro de widgets de Inicio | APP | Ver `G3-inicio.md` | — |
| **@react-pdf/renderer** | npm `4.9.0` | MIT | React 19 | Contrato de corretaje y estado de cuenta del broker como PDF servidor | APP | Total | M |
| **RESO Data Dictionary** (recursos Member/Office) | `dd.reso.org` | **EULA de RESO, no libre** (no verificado como CC) | Estándar de datos | **Solo referencia** de nombres y campos del agente y la oficina | REF | No se copia texto ni esquema | — |
| **Ballerine** (KYC/KYB abierto) | `ballerine-io/ballerine` | MIT **y** Elastic License 2.0 (por defecto ELv2: prohíbe ofrecerlo como servicio alojado) | TS | Flujos de verificación de identidad | **RECHAZADO** | Licencia incompatible con revender el CRM; KYC de brokers será formulario + documentos propios | — |
| **OpenSanctions** | `opensanctions.org/licensing` | Datos CC BY-NC (uso comercial requiere licencia de pago) | API / datos | Cribado PEP y sanciones (A18.2/A18.8) | **RECHAZADO para uso gratuito** | Decisión de PLAFT (fuera de G3); mantener el hueco abierto | — |
| **Papermark** | AGPLv3 (+ `ee/`) | AGPLv3 | Next.js | Envío rastreado de contratos y kits | RUN aparte (E3) | Solo por `DocumentosPort`; no se copia código | L |

Qué adaptamos: tabla/filtros (propios, con `nuqs`), patrón visual de ranking (Trophy) y PDFs. Qué no: ningún KYC de terceros ni dataset de sanciones sin licencia comercial. Riesgo de licencia: ELv2 de Ballerine y CC BY-NC de OpenSanctions descartan su uso directo.

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Directorio con dos vistas | `DataTable` (tabla) + tarjetas actuales rediseñadas; selector de vista guardado en URL (`nuqs`) | `/brokers` |
| Ficha 360° | `Sheet` lateral (desktop) y página completa (móvil) con `Tabs` | `/brokers/[id]` y `?broker=ID` |
| Rendimiento | `ChartCard` + Recharts (barras apiladas del embudo del broker, línea de cierres, indicador contra el equipo) | Pestaña Rendimiento |
| Estados de onboarding | Lista de verificación con estados (pendiente, en revisión, aprobado, vencido) | Pestaña Resumen |
| Documentos | Lista con vigencia (caducidad de cédula/contrato) y alerta | Pestaña Documentos |
| Seis estados | `error.tsx`, `loading.tsx`, vacío con CTA «Invitar broker» y «sin resultados con estos filtros» | Todo |
| Móvil | Tarjetas apiladas 320/390; acciones en hoja inferior | Todo |

## 6. Comunicación con el resto (centralización)
**Consume:** `NegocioCambioEtapa` (cierre) → ventas y nivel; `ComisionDevengada/Pagada` → saldo del broker; `MetaFijada`, `MetaHito`; `PagoRegistrado` (mora de sus compradores); `ConstanciaAprobada/Revocada` (Academy) → habilita o suspende inventario del proyecto; `LeadCreado` y asignación (G1) → carga de trabajo y SLA.
**Emite** (ampliar `TIPOS_EVENTO_CRM` y CHECK; el worker reclama solo tipos con consumidor): `BrokerAlta{id}`, `BrokerNivelCambiado{id}`, `BrokerDesactivado{id}` (con `BrokerAccesoRevocado` para Moodle, ya definido en M13/I02), `AcuerdoCobrokingFirmado{id}`.
| Consumidor | Qué hace |
|---|---|
| Academy / Moodle (`AprendizajePort`) | Alta o baja de usuario y matrícula |
| Comisiones | Congela devengos; cambia esquema por nivel |
| Leads (G1) | Reasigna cola; reglas de distribución y titularidad |
| Propiedades (G2) | Visibilidad de inventario según constancia |
| Comunicaciones | Bienvenida, recordatorio de KYC vencido |
| Inicio / Reportes | Altas, KYC pendiente, productividad |

**Puertos:** `RepositorioBrokers` existente + consulta `ConsultasBrokers` en `application` (nueva), `AlmacenamientoArchivos` (documentos), `FacturacionPort` (datos fiscales del broker para E41/E31), `AprendizajePort`. **Datos nuevos (todos `.enableRLS()`, sin DELETE):** columnas aditivas en `broker_profiles` (tipo, estado de KYC, `onboarding_status`), `broker_fiscal_data` (RNC/cédula, tipo de contribuyente, país; **cuenta de pago cifrada o solo referencia**, decisión de D12), `broker_documents` (sobre `files`), `cobroking_agreements`. Añadir `broker` a `ENTITY_TYPES`.

## 7. Lotes asignables
| Lote | Entrega verificable | Archivos permitidos | Ficha que lo habilita | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| BRK-0 | Corregir el alcance de `[id]` (negocios con `visibleRows` y `can(deals)`), formato de moneda por fila, `error.tsx`/`loading.tsx` | `src/app/(crm)/brokers/[id]/page.tsx`, `src/app/(crm)/brokers/{vista,error,loading}.tsx`, `src/app/(crm)/brokers/brokers.test.ts` (nuevo) | Ninguna (corrección de hallazgo) | Sonnet | D12 + D14 | — |
| BRK-1 | Capa `application` de consultas de Brokers (directorio y ficha) con DTO por rol; sin `getDb()` en páginas | `src/application/brokers/{consultas,puertos,en-memoria}.ts`, `consultas.test.ts`, `src/infrastructure/db/repos/brokers.ts` | **M07 (E1.4a, por escribir)** | Sonnet | D14 | BRK-0 |
| BRK-2 | Directorio: tabla + tarjetas, búsqueda y filtros en URL (`nuqs`), acciones masivas | `src/app/(crm)/brokers/{page,vista,directorio}.tsx`, `package.json` (nuqs) | M07 READY | Haiku | D07 + D14 | BRK-1 |
| BRK-3 | Ficha 360° (hoja lateral y página): pestañas Resumen, Negocios, Metas | `src/app/(crm)/brokers/[id]/{page,ficha}.tsx` | M07 READY | Haiku | D07 | BRK-1 |
| BRK-4 | Edición del perfil con auditoría (`PATCH /api/brokers/[id]`, Zod, `requireScope`, filtro `:id`) | `src/app/api/brokers/[id]/route.ts`, `src/application/brokers/{casos-de-uso,entrada}.ts`, tests, `src/infrastructure/seguridad-rutas-id.test.ts` | M07 READY | Sonnet | D12 | BRK-1 |
| BRK-5 | Esquema: tipo de broker, estado de KYC, `broker_fiscal_data`, `broker_documents`, `cobroking_agreements`; RLS; `ENTITY_TYPES += broker`; decisión de cifrado | `schema.ts`, `src/domain/catalogs.ts`, `drizzle/00NN_brokers_avanzado.sql`, `drizzle/meta/*`, `db/seed.sql`, `scripts/seed/catalog.ts`, `src/infrastructure/db/seed-invariantes.test.ts` | M07 READY + D12 (datos sensibles) | Sonnet | D11 + D12 | BRK-1 |
| BRK-6 | Alta de broker externo con KYC (formulario + documentos) y flujo de revisión por admin | `src/application/brokers/kyc.ts`, `…test.ts`, `src/app/(crm)/brokers/kyc.tsx`, `src/app/api/brokers/[id]/kyc/route.ts` | M07 + **decisión PLAFT/UAF (Wilber)** | Sonnet | D12 | BRK-5 |
| BRK-7 | Rendimiento: consulta agregada y pestaña (conversión, SLA, comisión, mora) | `src/application/brokers/rendimiento.ts`, `…test.ts`, `src/infrastructure/db/repos/brokers-rendimiento.ts`, `src/app/(crm)/brokers/[id]/rendimiento.tsx` | M07 + M09 + M22 READY | Sonnet | D14 | BRK-3, G3-COM-5 |
| BRK-8 | Baja ordenada: cascada de reasignación y evento `BrokerDesactivado` / `BrokerAccesoRevocado` | `src/application/brokers/baja.ts`, `…test.ts`, `src/application/usuarios/casos-de-uso.ts` (solo el gancho) | M07 + I02 READY | Sonnet | D12 + D14 | BRK-5, lote del worker |
| BRK-9 | Co-broking: acuerdos y participación en negocio | `src/application/brokers/cobroking.ts`, `…test.ts`, `src/app/(crm)/brokers/acuerdos.tsx` | M07 + M09 (participantes) | Sonnet | D12 | BRK-5, G3-COM-3 |
| BRK-10 | Onboarding por checklist con formación obligatoria (consume Academy) | `src/application/brokers/onboarding.ts`, `…test.ts`, `src/app/(crm)/brokers/onboarding.tsx` | M07 + M13/I02 | Haiku | D14 | BRK-5, G3-ACA-8 |
| BRK-11 | Escritorio del broker («Mi cuenta») usando el registro de widgets de Inicio | `src/app/(crm)/inicio/widgets/mi-cuenta.tsx`, `src/application/brokers/mi-cuenta.ts`, `…test.ts` | M07 + M20 | Haiku | D07 | G3-INI-3, G3-COM-10 |
| BRK-12 | Kit de ventas con enlace rastreable por broker (UTM) | `src/application/brokers/kit.ts`, `src/app/(crm)/brokers/kit.tsx` | M07 + ficha Propiedades (G2) | Haiku | D14 | BRK-5 |

Todo lote exige `gitnexus_impact` sobre `asignarProyectosABroker`, `BrokerLevel`, `evaluarNivelBroker` y `PERMISSION_RESOURCES`, y `gitnexus_detect_changes` antes del commit.

## 8. No verificado
- La API de TanStack Table v9 frente a v8 (solo si se decide adoptarla).
- Fecha del último commit de `trophyso/ui`.
- Cifrado/minimización de la cuenta de pago del broker y qué datos puede guardar el CRM (decisión de D12; ley de protección de datos y RGPD **no investigados**, D21 A18.9).
- Qué exige la UAF/PLAFT a los brokers externos (fuentes secundarias en D21 A18; confirmar con el oficial de cumplimiento).
- La política comercial de niveles y los umbrales (provisionales).
- Titularidad de leads de brokers externos (A1.5): la define el expediente G1 (Leads); aquí solo se conecta.
- No se probó nada contra la base; las cifras de líneas salen del árbol del 14-oct.
