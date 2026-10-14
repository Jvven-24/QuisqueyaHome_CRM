# Expediente de evolución · Búsqueda global y paleta de comandos

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026) · G4 Plataforma · D21 + D03 + D12 · 2026-10-14.
> Reglas: misma tecnología primero; copiar/portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído, commit fijado, cabecera de procedencia); AGPL/GPL solo como servicio aparte o referencia. Nada se incrusta.
> Diseño transversal: `G4-00-arquitectura-centralizacion.md` (el índice de búsqueda lo mantiene un consumidor del bus).

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 1 | `command-palette.tsx` (400 líneas): atajo ⌘/Ctrl+K, filtra **5 acciones fijas** (`QUICK_ACTIONS`) y los módulos visibles (`MODULOS`) por subcadena. No busca ningún registro. |
| Datos reales y reglas de negocio | 1 | Cada módulo tiene su propio filtro: contactos usa `ILIKE %q%` sobre nombre, teléfono, correo (`repos/contactos.ts:127-130`), sin índice trigram, sin tolerancia a acentos, y sin escapar `%`/`_` del texto del usuario. No hay extensiones (`pg_trgm`, `unaccent`) en `drizzle/` ni en `src` (grep: 0). |
| Diseño y componentes | 2 | Visual cuidado (modal propio con flechas/Enter/Esc), pero reimplementa a mano lo que `cmdk` ya resuelve (agrupación, foco, ARIA, filtrado). `role="dialog"` manual sin trampa de foco. |
| Experiencia de uso | 1 | El texto del campo promete «prospecto» (`placeholder`) y no lo cumple: promesa falsa. Sin recientes, sin acciones contextuales, sin atajos tipo `g l`. |
| Calidad | 1 | Sin pruebas de la paleta. Sin pruebas de búsqueda con alcance. |

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **La caja de búsqueda del header promete «Buscar en el CRM…» y solo navega** (`crm-header.tsx:139-155` abre `CommandPalette`). Un broker que escribe el nombre de un cliente no obtiene nada: la función más usada de cualquier CRM no existe.
2. **`ILIKE '%q%'` con entrada de usuario sin escapar** (`repos/contactos.ts:127-130`): `%` y `_` actúan como comodines; con una tabla grande es un barrido secuencial. No es inyección SQL (Drizzle parametriza), es costo y resultados raros. Con miles de contactos de la diáspora, "José" no encuentra "Jose".
3. **Cuando exista búsqueda global, el riesgo principal es de permisos**: un índice transversal que no aplique `visibleRows`/`reaches` por tipo mostraría al broker clientes ajenos o precios reales. El índice no debe contener campos restringidos (`real_price_cents`, KYC) y el filtro debe ir en SQL, no en memoria (regla de `domain/rbac.ts`).
4. **Teléfonos de la diáspora no se normalizan**: `normalizarTelefono` (`domain/telefono.ts:25-45`) solo reconoce RD (+1 con área 809/829/849); cualquier otro número queda con `phone = null` y solo se conserva `phoneDisplay`. La decisión #19 descartó `libphonenumber-js` por tamaño; el Plan integral (§1, A1) lo vuelve a elegir para deduplicar por E.164. Mientras no exista una decisión nueva (entrada numerada en `decisiones.md`, que solo se amplía) que sustituya a la #19 para números no dominicanos, un comprador de Nueva York, Madrid o San Juan no se encuentra por teléfono ni se deduplica. Es prerrequisito de SRCH-03 y de la importación (G4-import-export).
5. **Sin extensiones de Postgres declaradas**: `CREATE EXTENSION pg_trgm/unaccent` no está en ninguna migración; en Supabase y en PG15 local debe verificarse que están disponibles antes de depender de ellas.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| SRCH-01 | Búsqueda global por registros (leads, contactos, negocios, proyectos, unidades, brokers, tareas, plantillas) con resultados agrupados y respetando alcance y papelera | ESENCIAL | A21.3 | ausente |
| SRCH-02 | Tolerancia a acentos y a errores de escritura (`unaccent`, `pg_trgm`), prefijos mientras se escribe, español dominicano (config `spanish`) | ESENCIAL | A21.3 | `ILIKE` |
| SRCH-03 | Búsqueda por teléfono (E.164/parcial), correo, código de unidad, número de contrato y de comprobante (cuando existan) | ESENCIAL | A1, A7 | solo contactos |
| SRCH-04 | Operadores en el campo: `lead:`, `negocio:`, `@broker`, `#proyecto`, `estado:` | IMPORTANTE | A21.3 | ausente |
| SRCH-05 | Paleta con **acciones contextuales** según pantalla y permisos («Crear lead», «Registrar pago de este negocio», «Reasignar»), recientes y favoritos del usuario | ESENCIAL | A21.3 | 5 acciones fijas |
| SRCH-06 | Atajos de teclado globales (`g l` ir a Leads, `c` crear, `/` buscar) listados en una ayuda `?` | IMPORTANTE | A21.3 | `atajo` en datos, sin uso real |
| SRCH-07 | Índice `search_documents` mantenido por el bus (consumidor `busqueda`) + reconstrucción completa programada | ESENCIAL | A21.3 | ausente |
| SRCH-08 | Búsqueda semántica opcional (preguntas en lenguaje natural sobre notas) con `pgvector` | DESEABLE | A21.3 | ausente |
| SRCH-09 | Medición: términos sin resultado y latencia (para decidir si hace falta un motor externo) | IMPORTANTE | A21.3 | ausente |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **cmdk** | `dip/cmdk` (antes `pacocoursey/cmdk`, redirige) @ `dd2250ed60`, npm 1.1.1 (modificado 2025-08-27) | MIT (npm y API) | React, peer `react ^18 \|\| ^19` | `Command`, `Command.Input`, `Command.List`, `Command.Group`, `Command.Item`, filtrado/ordenamiento propio, accesibilidad | **APP** (vía el componente shadcn `command`) | Es la base del componente `Command` de shadcn/ui, que el proyecto ya usa para el resto de `components/ui`. Último commit hace ~12 meses pero API estable y soporte React 19 declarado | S |
| **PostgreSQL FTS + `pg_trgm` + `unaccent`** | contrib de PostgreSQL | Licencia PostgreSQL | SQL | `to_tsvector('spanish', unaccent(…))`, `websearch_to_tsquery`, índice GIN; `similarity()`/`%` con GIN `gin_trgm_ops` para typeahead y errores de tecleo | **APP** (nativo) | Misma BD, sin servicio nuevo, filtro de alcance en el mismo SQL; es la decisión ya tomada en `MAPA-SISTEMAS-OSS.md` §3 (E2.7). Disponibilidad de las extensiones **NO VERIFICADA** en este Postgres | M |
| Meilisearch | `meilisearch/meilisearch` @ `731937cf52` | **MIT + BUSL-1.1** (`LICENSE`: partes Enterprise bajo `LICENSE-EE`) | Rust, servicio aparte | tipografía tolerante, facetas | **REF/diferido** | Segundo almacén que sincronizar y proteger (alcance por documento); núcleo MIT usable, **evitar funciones EE**. Solo si se mide: > ~100 000 documentos, p95 > 300 ms o quejas de relevancia (SRCH-09) | M-L |
| Typesense | `typesense/typesense` (rama `v31`) | **GPL-3.0** (API de GitHub; LICENSE no leído en esta sesión) | C++, servicio aparte | — | **DESCARTADO** | Copyleft fuerte; no aporta sobre Postgres a esta escala | — |
| ParadeDB | `paradedb/paradedb` (rama main, activo 2026-10-14) | **AGPL-3.0** (API) | extensión de Postgres | BM25 en Postgres | **DESCARTADO** | AGPL; además requiere instalar extensión | — |
| pgvector | `pgvector/pgvector` | Licencia PostgreSQL (según su repo; **LICENSE no leído en esta sesión**) | extensión | vectores y distancia coseno | REF (SRCH-08) | Solo para la fase semántica | M |

Qué adaptamos: cmdk como motor de la paleta (con `shouldFilter={false}` porque el filtrado real lo hace el servidor para registros) y FTS+trigram como motor de búsqueda. Qué no: motores externos hasta que SRCH-09 muestre necesidad (principio ya firmado: «la propia arquitectura pide no meter sistemas porque otro proyecto los usa»). Riesgo: mantenimiento de cmdk (un solo mantenedor, ritmo lento) → mitigado por encapsularlo en `components/ui/command.tsx`.

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Paleta ⌘K con grupos (Recientes · Acciones · Registros · Módulos) y vista previa lateral | shadcn `command` (cmdk) dentro de `Dialog` de `components/ui/dialog.tsx` | `crm-header.tsx` |
| Resultado de registro con tipo, estado, responsable, resaltado del término | `Badge` + icono de módulo (`icon-resolver.tsx`) | paleta |
| Acciones contextuales por ruta | registro `acciones.ts` por módulo (cada módulo declara las suyas con el permiso que exige) | `src/app/(crm)/**` |
| Estados: vacío con sugerencia, cargando (skeleton), error con reintento, sin permiso | `estados.tsx` existente | paleta |

## 6. Comunicación con el resto (centralización)
**Consume** del bus `*Creado`, `*Actualizado`, `ContactoFusionado`, `UnidadPublicada/Retirada`, `ImportacionCompletada` y eliminaciones lógicas (papelera) para mantener `search_documents`; no emite eventos de dominio (solo métrica `BusquedaSinResultado`). **Puertos**: `BuscadorPort` (`buscar(actor, consulta, filtros)`) en `application/busqueda/`; cada módulo aporta un `IndexadorDeEntidad` (qué campos indexa, dueño, proyecto, recurso/permiso que exige). Datos compartidos: `search_documents(entity_type, entity_id, owner_id, project_id, resource, title, subtitle, body_tsv, deleted_at)`; el SQL de lectura une el filtro de `visibleRows` por tipo — **el índice nunca guarda precio real ni KYC**.

## 7. Lotes asignables
Ficha nueva: `G06-busqueda-global` (D01/D03; revisión D12 por exposición de datos). Esquema: `search_documents` requiere migración (D11) y verificar las extensiones.
| Lote | Entrega verificable | Archivos permitidos | Ficha | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| SRCH-L1 | Verificar y declarar extensiones: migración `CREATE EXTENSION IF NOT EXISTS pg_trgm, unaccent`; prueba en BD que las consulta | `drizzle/0006_*`, `scripts/test-db/**` | G06 + D11 | Sonnet | D11 | — |
| SRCH-L2 | Normalizador puro de consulta (acentos, teléfono E.164, operadores `lead:`/`@`/`#`), con tabla de casos | `src/domain/busqueda.ts` (+test) | G06 | Haiku | D14 | — |
| SRCH-L3 | Tabla `search_documents` (RLS, GIN tsvector + GIN trigram) + repo de lectura con filtro de alcance por tipo; prueba de aislamiento (broker A no ve lo de B) | `schema.ts`, `src/infrastructure/db/repos/busqueda.ts`, `scripts/test-db/busqueda.ts` | G06 + D11 | Sonnet | D12 | SRCH-L1 |
| SRCH-L4 | Indexadores de entidad (contactos, leads, negocios, proyectos, unidades) + consumidor del bus + reconstrucción completa | `src/application/busqueda/**`, `src/infrastructure/integraciones/busqueda/**` | G06 + G10 | Sonnet | D12 | SRCH-L3 + BUS-L4 |
| SRCH-L5 | Caso de uso `buscarGlobal` + `GET /api/busqueda` (`requireScope` por tipo, límite 20, sin PII en logs, tamaño de consulta ≤ 100) y candado de CI | `src/application/busqueda/**`, `src/app/api/busqueda/route.ts` | G06 | Sonnet | D12 | SRCH-L4 |
| SRCH-L6 | `components/ui/command.tsx` (shadcn sobre cmdk) | `src/components/ui/command.tsx`, `package.json` (solo `cmdk`) | — | Haiku | D05 | — |
| SRCH-L7 | Paleta nueva: grupos, recientes (localStorage con try/catch), registros desde `/api/busqueda`, seis estados, accesibilidad | `src/app/(crm)/_ui/command-palette.tsx`, `crm-header.tsx` | G06 | Sonnet | D05+D07 | SRCH-L5, L6 |
| SRCH-L8 | Registro de acciones por módulo con permisos (`acciones.ts`) y atajos `g`+letra con ayuda `?` | `src/app/(crm)/acciones.ts`, `_ui/atajos.tsx` | G06 | Sonnet | D05 | SRCH-L7 |
| SRCH-L9 | Reemplazar el `ILIKE` de contactos por `unaccent`+trigram (mismo contrato), escapando comodines | `src/infrastructure/db/repos/contactos.ts` | M01/contactos | Sonnet | D14 | SRCH-L1 |
| SRCH-L10 | Métrica de «sin resultado» y p95 en el panel de salud | `src/application/busqueda/metricas.ts`, panel de Integraciones | G06 | Haiku | D14 | SRCH-L5 |

## 8. No verificado
Disponibilidad de `pg_trgm`/`unaccent` en el Postgres 15 local y en el proyecto Supabase; rendimiento de FTS+trigram con el volumen real de contactos de la diáspora (no se midió); LICENSE de Typesense, ParadeDB y pgvector (solo campo de API de GitHub o conocimiento general; se descartan o no se adoptan, por eso no bloquean); relevancia del español dominicano con la configuración `spanish` de Postgres.
