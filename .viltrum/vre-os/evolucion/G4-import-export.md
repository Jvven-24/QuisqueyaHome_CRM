# Expediente de evolución · Importación y exportación masiva

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026) · G4 Plataforma · D21 + D03 + D12 · 2026-10-14.
> Reglas: misma tecnología primero; copiar/portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído, commit fijado, cabecera de procedencia); AGPL/GPL solo como servicio aparte o referencia. Nada se incrusta.
> Diseño transversal: `G4-00-arquitectura-centralizacion.md`. La importación **no escribe tablas**: invoca los casos de uso de cada módulo, así hereda permisos, validación, auditoría y eventos.

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 1 | Exportación: CSV de comisiones en servidor (`api/comisiones/export`, `requireScope(commissions, export)`); CSV del embudo en el **cliente** (`reportes/vista.tsx:52-64`). Importación: ninguna. |
| Datos reales y reglas de negocio | 2 | `domain/csv.ts` genera CSV seguro (BOM UTF-8, RFC 4180, neutraliza `=+-@`). `leads.externalId` con índice parcial único permite idempotencia por origen (`schema.ts`). Normalización de teléfono solo RD. |
| Diseño y componentes | 1 | Botón «Exportar» suelto; sin asistente. |
| Experiencia de uso | 1 | Los contactos de la cartera actual (Excel/hojas de los brokers, WhatsApp) solo pueden entrar uno a uno. |
| Calidad | 3 | `csv.test.ts` cubre escape y fórmulas. Sin pruebas de importación (no existe). |

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **La acción `import` existe y no la usa nadie** (`catalogs.ts:19-26`; inventario D21 §2). Cuando se construya, debe ser el único permiso que habilita la importación, con alcance (`own` = todo lo importado queda asignado al actor).
2. **El CSV de Reportes se arma en el navegador** (`reportes/vista.tsx:52`): contradice la decisión #37 («exportar es texto generado en el servidor» para que el filtro de permisos viva donde vive la consulta) y no deja auditoría. Hoy exporta solo el embudo agregado; en cuanto exporte filas, es una fuga sin rastro.
3. **Teléfonos no dominicanos se pierden al importar**: `normalizarTelefono` devuelve `phone: null` para cualquier número fuera de 809/829/849 (`domain/telefono.ts:25-45`); la decisión #19 descartó `libphonenumber-js`. Importar una lista de compradores de la diáspora (NY, Madrid, San Juan) sin cambiarlo dejaría el 100 % sin clave de deduplicación. Requiere una decisión nueva (entrada numerada; el archivo solo se amplía).
4. **Excel en español no es el CSV del estándar**: separador `;`, decimal `,`, codificación Windows-1252, fechas `dd/mm/aaaa`, montos «US$ 1,200.00»; un lector ingenuo corrompe acentos y cifras. La exportación del CRM sí usa BOM UTF-8; la importación debe detectar delimitador y codificación.
5. **Riesgos propios de importar**: archivos enormes (zip-bomb en `.xlsx`), fórmulas y macros (`.xlsm`), `externalId` repetido, filas a medias si el servidor muere, importar dos veces el mismo archivo, y que una importación asigne cartera de otro broker.
6. **Sin deshacer**: una importación mala (columnas cruzadas) obliga a borrar contacto por contacto (papelera con límite de 30 por tipo, `configuracion/page.tsx:128-133`).

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| IMP-01 | Asistente de importación en 5 pasos: subir → detectar formato → **mapear columnas** (sugerencia por nombre es/en, mapeo guardado) → validar fila a fila → vista previa → confirmar | ESENCIAL | A1.1 | ausente |
| IMP-02 | Entidades: contactos, leads, unidades de un proyecto, plantillas de mensaje; luego cuotas históricas (Cobros) y catálogo de documentos | ESENCIAL | A1, A3, A7 | ausente |
| IMP-03 | Validación con los **mismos esquemas Zod** de los casos de uso de creación; informe de errores descargable (fila, columna, motivo) | ESENCIAL | A1 | ausente |
| IMP-04 | Deduplicación configurable (omitir / actualizar vacíos / crear de todos modos) por teléfono E.164, correo y similitud de nombre (`pg_trgm`) | ESENCIAL | A1.5 | ausente |
| IMP-05 | Ejecución por lotes en segundo plano con progreso, reanudable, idempotente por (hash de archivo, hash de fila) | ESENCIAL | A21.3 | ausente |
| IMP-06 | **Deshacer por lote** (24 h): baja lógica de lo creado por esa importación, auditada | IMPORTANTE | A19 | ausente |
| IMP-07 | Alcance: con `import:own` todo queda asignado al actor; con `import:all` se puede mapear responsable por correo | ESENCIAL | A21.2 | ausente |
| IMP-08 | Exportación en servidor para cada listado (mismos filtros y `visibleRows`), CSV y XLSX, con auditoría `exportar` (filtros, cantidad, formato) | ESENCIAL | A13, A19 | solo comisiones |
| IMP-09 | Exportaciones grandes como trabajo en segundo plano con enlace de descarga que caduca (archivo en `AlmacenamientoPort`) | IMPORTANTE | A21.3 | ausente |
| IMP-10 | Plantillas descargables de importación (con ejemplos y columnas obligatorias) | IMPORTANTE | A1.1 | ausente |
| IMP-11 | Exportación completa de los datos de un contacto (derecho de acceso) y respaldo de configuración | DESEABLE | A18.9 | ausente |
| IMP-12 | Importar contactos de una hoja de Google/Meta Lead Ads vía CSV, con campos de campaña (UTM) hacia `lead_sources` | DESEABLE | A11 | ausente |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **Papa Parse** | `mholt/PapaParse` @ `e78dddce47`, npm (modificado 2026-08-24) | MIT | JS/TS | `Papa.parse(file|string, { header, skipEmptyLines, delimiter: "" (autodetección), worker, step })`; `Papa.unparse` | **APP** | Detecta delimitador `;` vs `,`; modo `step` para archivos grandes; funciona en servidor con `string` | S |
| **read-excel-file** | npm `read-excel-file` 9.3.12 (modificado 2026-10-07) | MIT | TS | lectura de `.xlsx` a filas con esquema opcional | **APP** | Solo valores (no ejecuta macros); reemplaza a SheetJS. Límite de tamaño propio | S |
| **write-excel-file** | npm `write-excel-file` 4.1.1 (modificado 2026-06-08) | MIT | TS | `.xlsx` con tipos de celda y formato | **APP** | Para IMP-08; `exceljs` (MIT) queda fuera: sin publicar desde 2024-12-20 | S |
| react-spreadsheet-import | `UgnisSoftware/react-spreadsheet-import` @ `e95d22e58a`, 4.7.1 | MIT | React 18+ con **Chakra UI v2** (`@chakra-ui/react`, `chakra-react-select`, `chakra-ui-steps`) y `xlsx-ugnis` | Flujo subir → seleccionar hoja → mapear columnas → validar → resultado; **modelo de campos con validadores (`required`, `unique`, `regex`) y mapeo automático por nombre** | **REF** (+ PORT del *modelo* de campos y de la lógica de mapeo, nunca de la UI) | Trae un sistema de diseño entero (Chakra) que choca con shadcn/Tailwind v4 y suma peso; además depende de una copia propia de SheetJS. Se porta la idea (campos declarativos + coincidencia de encabezados) con cabecera de procedencia y se construye la UI con `Dialog`, `Table` y `Stepper` propios | M |
| libphonenumber-js | npm 1.13.15 (modificado 2026-10-08) | MIT | TS | `parsePhoneNumberWithError(texto, "DO")` → E.164, país, validez | **APP** (requiere decisión nueva) | Resuelve el punto crítico 3. Contradice la decisión #19 (peso): usar la variante `min` (`libphonenumber-js/min`) | S |
| pg-boss (G4-bus) | 12.38.0 | MIT | TS | lotes de importación y exportación como trabajos con reintento | APP | Mismo motor del bus | S |
| `pg_trgm` | contrib de PostgreSQL | Licencia PostgreSQL | SQL | `similarity(nombre_a, nombre_b)` para duplicados probables | APP | Comparte la migración de SRCH-L1 | S |

Qué adaptamos: Papa Parse y read-excel-file para leer, write-excel-file para escribir, el modelo de campos de react-spreadsheet-import como idea. Qué no: la UI de Chakra. Riesgos: tamaños (límite duro 5 MB y 10 000 filas por archivo en v1); XLSX comprimido: limitar bytes descomprimidos; riesgo de «inyección de fórmula» al reexportar (ya neutralizado en `domain/csv.ts`, replicar en XLSX tratando todo como texto).

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Asistente en pasos con barra de progreso | `Dialog` grande o página `/importar/[entidad]` + `Tabs` deshabilitadas + `Progress` (añadir a `components/ui`) | Contactos, Leads, Propiedades |
| Mapeo de columnas (columna del archivo → campo) con vista previa de 5 filas | `Select` + `Table` | paso 3 |
| Vista previa con filas válidas / con advertencia / con error y filtro | `data-table.tsx` + `Badge` | paso 4 |
| Resultado: creadas / actualizadas / omitidas / con error y botón «Deshacer» y «Descargar errores» | `Card` + `Button` | paso 5 |
| Botón «Exportar» con menú (CSV, XLSX) y aviso de filtros aplicados | `DropdownMenu` existente | cada listado |

## 6. Comunicación con el resto (centralización)
**Emite**: `ImportacionIniciada`, `ImportacionCompletada` `{id, entidad}`, `ExportacionGenerada` `{id, entidad}` (→ Notificaciones, Auditoría reforzada) y, por fila creada, los eventos normales de cada módulo (`LeadCreado`, `ContactoCreado`) con `causationId` = id del lote → **Búsqueda** reindexa, **Automatizaciones** pueden reaccionar (se aplica un límite para no disparar 5 000 SLA a la vez: bandera `origen = importacion` en el sobre). **Consume**: nada de dominio. **Puertos**: casos de uso `crearContacto`, `crearLead`, `crearUnidad`; `AlmacenamientoPort` (archivo original y errores); `ProgramadorPort`/`BusPort`. **Datos compartidos**: `import_batches` (entidad, archivo hash, actor, estado, contadores, `puede_deshacer_hasta`) e `import_rows` (fila, estado, id creado, error) con RLS y retención de 90 días.

## 7. Lotes asignables
Ficha nueva: `G09-importacion-exportacion` (D01/D03; D12 por carga de archivos). El lote IMP-L1 es una decisión previa de Wilber/D03 (teléfonos).
| Lote | Entrega verificable | Archivos permitidos | Ficha | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| IMP-L1 | **Decisión** (entrada nueva en `decisiones.md`) que sustituye a #19 para números no dominicanos + `normalizarTelefono` con `libphonenumber-js/min` (RD sigue igual) y casos NY/Madrid/PR | `src/domain/telefono.ts` (+test), `package.json` | decisión de Wilber | Sonnet | D03+D14 | decisión |
| IMP-L2 | Exportación de Reportes a servidor: `GET /api/reportes/export` con `requireScope(reports, export)` y auditoría `exportar`; el botón la llama | `src/app/api/reportes/export/route.ts`, `reportes/vista.tsx` (solo el handler), `src/domain/catalogs.ts` (acción `exportar`) | hallazgo | Sonnet | D12 | AUD-L1 |
| IMP-L3 | Dominio puro de importación: definición declarativa de campos por entidad, coincidencia de encabezados es/en, normalización de fechas/montos/teléfonos, validación; tabla de casos con CSV real de ejemplo | `src/domain/importacion.ts` (+test) | G09 | Sonnet | D14 | IMP-L1 |
| IMP-L4 | Lectura de archivos en servidor: CSV (Papa Parse, autodetección de delimitador y de codificación con respaldo `windows-1252`) y XLSX (read-excel-file) con límites de tamaño/filas; pruebas con archivos hostiles (zip-bomb, `.xlsm`, BOM) | `src/infrastructure/importacion/lectores.ts` (+test), `package.json` | G09 | Sonnet | D12 | IMP-L3 |
| IMP-L5 | Migración `import_batches`, `import_rows` (RLS, UNIQUE de idempotencia) | `schema.ts`, `drizzle/0006_*`, `scripts/test-db/**` | G09 + D11 | Sonnet | D11+D12 | IMP-L3 |
| IMP-L6 | Casos de uso `previsualizarImportacion` y `confirmarImportacion` (alcance `import`, mismos esquemas de creación, deduplicación configurable) para **contactos** | `src/application/importacion/**`, `src/infrastructure/db/repos/importacion.ts` | G09 | Sonnet | D12 | IMP-L4, L5 |
| IMP-L7 | Rutas `api/importaciones/**` (subida con límite, `requireScope(<recurso>, "import")`) y candado de CI que exige el permiso `import` | `src/app/api/importaciones/**`, `src/infrastructure/seguridad.test.ts` | G09 | Sonnet | D12 | IMP-L6 |
| IMP-L8 | Ejecución por lotes con `BusPort` (progreso, reanudar, idempotencia por hash) y evento `origen=importacion` | `src/infrastructure/integraciones/bus/tareas/importar.ts` | G09 + G10 | Sonnet | D14 | BUS-L10 |
| IMP-L9 | Asistente de 5 pasos (UI) para contactos con seis estados | `src/app/(crm)/contactos/importar/**` | G09 | Sonnet | D05+D07 | IMP-L7 |
| IMP-L10 | Deshacer por lote | `src/application/importacion/deshacer.ts` | G09 | Sonnet | D12 | IMP-L8 |
| IMP-L11 | Extender a leads y unidades; plantillas descargables | `src/application/importacion/**`, `leads/importar/**`, `propiedades/[slug]/importar/**` | G09 | Sonnet | D14 | IMP-L9 |
| IMP-L12 | Exportación CSV/XLSX en servidor para contactos, leads, negocios, unidades (filtros del listado) con auditoría | `src/application/exportacion/**`, `src/app/api/<modulo>/export/route.ts` | G09 | Sonnet | D12 | IMP-L2 |
| IMP-L13 | Exportaciones grandes en segundo plano con enlace que caduca | `src/application/exportacion/trabajos.ts` | G09 | Sonnet | D12 | BUS-L10 |

## 8. No verificado
Que `libphonenumber-js` en variante `min` resuelva países sin metadatos completos (solo hay lectura de README previa, no prueba); comportamiento de `read-excel-file` con hojas de más de 10 000 filas y límites de memoria; si react-spreadsheet-import 4.x funciona con React 19 (no se ejecutó); el volumen y formato reales de las hojas de los brokers de Quisqueya (se necesitan 2–3 muestras anonimizadas); licencia de `Progress`/`Stepper` de shadcn (ya en el ecosistema MIT; no releída).
