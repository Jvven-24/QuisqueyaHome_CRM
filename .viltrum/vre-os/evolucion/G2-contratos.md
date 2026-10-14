# Expediente de evolución · Contratos de compraventa en plano (promesa, compraventa, adendas, cesión, rescisión)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Autor: D21+D03+D05, grupo G2, 14-oct-2026. Solo lectura de `src/` y web.
> Reglas: misma tecnología primero. Copiar o portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído, commit fijado, cabecera de procedencia). AGPL/GPL solo RUN o referencia.
> **Alcance.** Contratos de **venta** de unidades (A6.1–A6.6 del catálogo D21). Los contratos de **renta** son del módulo Rentas (`G2-rentas.md`). La firma electrónica ya tiene un estudio previo (`research/D21-firma-digital-oss-2026-10-04.md`) y Documenso está excluido por Wilber: aquí no se repite; se define el puerto y el sustituto manual. **Este expediente no es asesoría jurídica**: el texto de las cláusulas lo aprueba un abogado.
> Nombre de ficha propuesto: **M23-contratos** (el índice del Spec Pack no la lista: `FLUJO-PASADAS.md` termina en M21 y M22 es Cobros).

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 0 | No existe ruta, tabla ni caso de uso de contratos. El plan integral lo marca «AUSENTE» (`PLAN-INTEGRAL-2026-10-14.md` §1 fila A6) y M22 lo declara fuera de su alcance («contratos, cesión y rescisión (A6.5/A6.6) y por tanto la cancelación del plan», M22 §9). |
| Datos reales y reglas de negocio | 0 | El contacto solo guarda nombre, teléfono, correo, país, ciudad (`schema.ts:570-595`): faltan cédula o pasaporte, nacionalidad, estado civil, domicilio y fecha de nacimiento que un contrato dominicano exige. `ENTITY_TYPES` no tiene `contract` ni `document` (`catalogs.ts:61-80`). |
| Diseño y componentes | 0 | Sin interfaz. |
| Experiencia de uso | 0 | Sin flujo; el contrato se redacta fuera del sistema. |
| Calidad | 0 | Nada que probar. |

Objetivo de este programa: 4 en funciones y datos; la firma electrónica con validez legal queda fuera del objetivo hasta dictamen (ver §8).

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **Se puede «ganar» un negocio y vender la unidad sin ningún contrato.** `cerrarNegocioGanado` (`application/pipeline/cierre.ts`) sella el cierre, marca la unidad `sold` y crea la fila de `unit_sales` (`schema.ts:758-770`), y no existe en todo el sistema el concepto «contrato firmado». Reportes cuenta como venta lo que legalmente puede ser solo una reserva. Remedio: estado del contrato visible en el negocio y un reporte «ventas sin contrato firmado»; la regla de si la venta exige contrato firmada la decide Wilber.
2. **Faltan los datos de identidad del comprador** (cédula/pasaporte, nacionalidad, estado civil, domicilio, ocupación, fecha de nacimiento, y representante o beneficiario final en persona jurídica). No hay dónde guardarlos con control de acceso: `contacts` no los tiene y la auditoría hoy no registra lecturas (A19.3). Son datos personales sensibles que además necesita PLAFT (A18.2) y el Client Room; deben vivir en **una sola tabla restringida** (`party_identities`) compartida, no en cada módulo.
3. **Dependencia con el plan de pagos.** M22 reserva `payment_plans.status = 'cancelled'` para «el futuro módulo de contratos/rescisión» (M22 §5, nota de `payment_plans`). Una rescisión debe cancelar el plan y liquidar pagos mediante un puerto de M22 que **no existe todavía**; si Contratos nace antes, no hay cómo rescindir sin tocar tablas ajenas.
4. **El contrato debe congelar lo que se firmó**: precio (de la cotización aceptada), plan (cuotas con fechas), unidad (código, m², torre, piso), condiciones de Confotur y fiduciaria. Hoy cualquiera de esos datos se puede editar después (precio de unidad pisado, `casos-de-uso.ts:154`; estado libre); sin instantánea inmutable el PDF emitido no es reproducible.
5. **Fiduciaria y estado legal del proyecto sin modelo.** Para preventa, la Ley 189-11 y la guía de debida diligencia que cita el catálogo D21 (A6.4) ponen la protección del comprador en el fideicomiso. No hay tabla de fiduciarias ni vínculo proyecto–fiduciaria; el contrato no podría nombrarla ni la carta de instrucción tendría de dónde sacarla. (Propiedades PR-L10.)
6. **Sin firma legalmente verificada**: la decisión del 4-oct es no usar firma digital y Documenso está excluido. Hasta que un abogado valide un proveedor (el estudio D21 dice que LibreSign/OpenSign/DocuSeal son AGPL y su validez en RD no está determinada), el flujo debe ser **imprimir, firmar a mano y cargar el escaneado** con evidencia (fecha, firmantes, testigos, notario). Hacer pasar una imagen de firma por «firma electrónica» sería un riesgo.
7. **Texto jurídico en una plantilla editable por cualquiera es peligroso.** Cambiar una cláusula debe requerir revisión y aprobación y generar una versión nueva (A6.2); las versiones emitidas no se tocan.
8. **Numeración y confidencialidad del PDF**: el contrato no puede salir por un enlace sin autenticación (D-08: el comprador no entra al CRM); el mecanismo de entrega al comprador está sin definir y depende de Client Room (ver `G2-documentos-client-room.md`).

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| CT-01 | Plantillas de promesa de venta y de compraventa con cláusulas y **variables tipadas** (comprador, unidad, precio, plan, fiduciaria, Confotur, fechas), versionadas | ESENCIAL | A6.1 | No existe |
| CT-02 | Generación del contrato desde la cotización aceptada / la reserva / el negocio, con **instantánea inmutable** de lo firmado | ESENCIAL | A6.1 | No existe |
| CT-03 | Flujo de revisión: borrador → revisión legal → aprobado → emitido → firmado → vigente; con motivo, autor distinto del aprobador y rastro | ESENCIAL | A6.2, A19.2 | No existe |
| CT-04 | PDF del contrato (react-pdf) con importes en números y letras, tabla del plan, anexos, numeración de páginas y marca de versión | ESENCIAL | A6.1 | No existe |
| CT-05 | Registro de firma manual: carga del escaneado, fecha de firma, firmantes, testigos y notario; hash del archivo | ESENCIAL | A6.3 | No existe |
| CT-06 | **Vínculo con fiduciaria**: fiduciaria del proyecto, carta de instrucción generada del mismo dato, constancia de aportes y estado de cada cuota depositada | ESENCIAL | A6.4 | No existe |
| CT-07 | Adendas (cambio de unidad, de plan o de fechas) con aprobación y nueva instantánea | IMPORTANTE | A6.5 | No existe |
| CT-08 | **Cesión de derechos** entre compradores: nuevo titular, documentos, aprobación, traspaso del plan de pagos y del estado de cuenta (vía M22) | IMPORTANTE | A6.5 | No existe |
| CT-09 | **Rescisión/cancelación** con liquidación (devoluciones y retenciones según política), cancelación del plan y liberación de la unidad por la puerta única | IMPORTANTE | A6.6 | No existe |
| CT-10 | Estado del contrato visible en Negocios, Reservas, Cobros y Client Room; reporte «ventas sin contrato firmado» y «contratos por vencer firma» | ESENCIAL | A13.3 | No existe |
| CT-11 | Exportación a Word (.docx) del mismo contenido para que el abogado edite | IMPORTANTE | A6.2 | No existe |
| CT-12 | Puerto `FirmaPort` con doble y sin proveedor (se conecta LibreSign u otro solo tras dictamen) | DESEABLE | A6.3 | No existe |
| CT-13 | Alertas: contrato emitido sin firmar tras N días, documentos faltantes para firmar | IMPORTANTE | A17.2 | No existe |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| @react-pdf/renderer | `diegomura/react-pdf` @ `e7b14db1e53d`; npm `4.9.0` | MIT (`LICENSE` leído) | TypeScript/React | Render del contrato desde el JSON de cláusulas a PDF (CT-04), con la base de PDF de Cotizaciones | APP | Se mapea un modelo de bloques (título, párrafo numerado, lista, tabla) a componentes `Text/View`; **no** acepta HTML | M |
| Plate | `udecode/plate` @ `3e0b4742aaf1`; npm `platejs@53.3.15` (3-oct-2026) | MIT (`LICENSE` raíz leído; «salvo que un LICENSE dentro de un paquete diga otra cosa», **no revisé los paquetes**) | TypeScript, Slate, shadcn/ui | Editor de plantillas con chips de variable y nodos de cláusula numerada (CT-01); se construye sobre los mismos componentes shadcn que usa el CRM | APP | Encaje de diseño alto; peer React ≥18 | L |
| Tiptap | npm `@tiptap/core@3.32.0` (13-oct-2026) | MIT (registro npm; **algunas extensiones son de pago** según su modelo comercial, no verificado) | TypeScript, ProseMirror | Alternativa de editor si Plate complica el diseño | APP (alterno) | Requiere componer la barra a mano; revisar extensiones antes de usar | L |
| Puck | `puckeditor/puck` @ `574471f50b65`; npm `@puckeditor/core@0.23.0` | MIT (`LICENSE` leído) | TypeScript/React | **Evaluado y descartado**: es un constructor de páginas visuales, no un editor de texto legal numerado | REF | — | — |
| docxtemplater | npm `3.71.0` (21-sep-2026) | MIT (registro npm; los módulos de imágenes/tablas avanzados son de pago, no verificado qué incluye el núcleo) | JavaScript | Rellenar una plantilla .docx del abogado con las variables (CT-11) | APP | Funciona en servidor; bucle de cuotas con el núcleo | M |
| n2words | npm `6.3.0` | MIT (registro npm) | JavaScript | Importe en letras (CT-04) | APP | Español por confirmar | S |
| Accord Project (Cicero + markdown-template + Concerto) | `accordproject/*`; npm `@accordproject/cicero-core@3.0.0`, `markdown-template@2.0.0`, `concerto-core@5.1.0` (todos 6–11-oct-2026) | Apache-2.0 (registro npm) | TypeScript | Plantillas de contrato en Markdown con variables tipadas por modelo; **candidato de spike**, no de adopción | REF / spike | Añade el modelo Concerto (curva alta) para un beneficio que se logra con una tabla de variables propia | M–L |
| LibreSign / OpenSign / DocuSeal | ver `D21-firma-digital-oss-2026-10-04.md` | AGPLv3 (los tres; DocuSeal con términos adicionales) | PHP / Node | Firma electrónica | RUN tras `FirmaPort`, solo con dictamen | No se vuelve a evaluar aquí | — |
| signature_pad | npm `5.1.4` (31-jul-2026) | MIT (registro npm) | TypeScript | Capturar firma manuscrita en tableta para **actas y recibos** (no sustituye la firma legal del contrato) | APP | — | S |
| pdf-lib / @cantoo/pdf-lib | npm `pdf-lib@1.17.1` (nov-2021, sin mantenimiento) / `@cantoo/pdf-lib@2.11.1` (15-sep-2026) | MIT (registro npm) | TypeScript | Sellar páginas de un PDF ya emitido (numeración, marca «versión n») o unir anexos | APP (riesgo) | Preferir el fork activo; usar solo si react-pdf no alcanza | M |
| Handlebars | npm `4.7.10` | MIT (registro npm) | JavaScript | **No se recomienda** para plantillas editadas por usuarios (sustitución de código); se usa un interpolador propio con lista blanca de variables validada con Zod | REF | — | — |
| Documenso | — | — | — | Excluido por Wilber | — | — | — |

**Qué no adaptamos y riesgo.** No hay un generador de contratos inmobiliarios OSS permisivo para RD que se pueda portar; el valor está en el modelo de datos, la instantánea y el flujo de revisión (propios). El riesgo principal es jurídico, no técnico: el texto, la numeración y la suficiencia de la firma los define el abogado.

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Asistente «Generar contrato» desde la reserva/negocio: Datos del comprador · Unidad y precio · Plan · Cláusulas especiales · Revisión | `Tabs`-pasos, `Dialog`/página, `Select`, `Input`; resumen lateral con totales | `/contratos/nuevo` |
| Lista de contratos con semáforo de estado | `data-table.tsx`, `Badge` (`tone.ts`), filtros por proyecto, estado, antigüedad sin firma | `/contratos` |
| Detalle con línea de tiempo (versiones, revisiones, firma) y panel de documentos | `Sheet`/`Drawer`, `Tabs` (Resumen · Versiones · Documentos · Firma · Historial) | `/contratos/[id]` |
| Editor de plantillas (solo admin/legal) | Plate con barra mínima, chips de variable que muestran un valor de ejemplo, vista previa PDF | `/configuracion/plantillas-contrato` |
| Comparar versiones (diferencias de cláusulas) | Vista dividida de texto; se construye con un diff de bloques propio | detalle |
| Seis estados y móvil | Lectura y firma de carga en móvil; edición de plantillas solo escritorio | todo |
Los importes siempre con moneda; la vista previa del contrato muestra «BORRADOR» hasta que se apruebe; ninguna pantalla promete validez legal de la firma.

## 6. Comunicación con el resto (centralización)
- **Consume:** `CotizacionAceptada`/`ReservaConvertida` (precio y plan congelados), `ProyectoEstadoLegalCambiado` (fiduciaria, Confotur), `party_identities` (Contactos/Documentos), plantillas de plan y funciones de dinero de M22.
- **Emite (outbox, `OBX`):** `ContratoGenerado`, `ContratoAprobado`, `ContratoFirmado` (dispara Cobros: crear el plan si aún no existe, y Comisiones: devengo según A8.2), `ContratoRescindido` (Cobros cancela el plan, Reservas/Propiedades liberan la unidad vía `cambiarEstadoUnidad`, Comisiones revierte A8.3), `CesionAprobada` (Cobros traspasa el plan), `AdendaAprobada`.
- **Puertos:** `GeneradorPdfPort`, `AlmacenamientoArchivos` (PDF emitido inmutable con hash), `FirmaPort` (doble + manual), `DocumentosPort` (expediente), `ReglasPort` (cláusulas condicionales opcionales).
- **Tablas propuestas (ficha de datos nueva):** `contract_templates`, `contract_template_versions`, `contracts`, `contract_versions` (instantánea JSON + `file_id` del PDF + hash), `contract_parties`, `contract_events` (revisión, aprobación, firma, rescisión), `fiduciaries`, `project_fiduciaries`, `party_identities` (restringida; compartida con Documentos y PLAFT).
- **Permisos (propuesta):** recurso `contracts` (`view|create|edit|export`); aprobar requiere `edit:all` y autor distinto del solicitante (patrón #47); datos de identidad con permiso propio `party_identities:view` y auditoría de lectura.
- **Reglas firmadas:** nada se elimina (D-10); precio real y comisiones de terceros no aparecen en el contrato ni en su DTO (#47); el comprador no entra al CRM (D-08).

## 7. Lotes asignables
Todos requieren **ficha M23-contratos READY** (no existe), más una ficha de datos para `party_identities` y revisión legal del texto. `OBX` = cola de outbox filtrada por tipo. `PDF` = CP-L2.

| Lote | Entrega verificable | Archivos permitidos | Ficha | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| CT-L1 | Dominio puro: máquina de estados del contrato, interpolador de variables con lista blanca (rechaza variable desconocida y cualquier expresión), importe en letras; pruebas incluidas el intento de inyección `{{constructor}}` | `src/domain/contratos.ts`, `.test.ts` | M23 | Sonnet | Codex + D12 | — |
| CT-L2 | Esquema: tablas de plantillas, contratos, versiones, partes, eventos, fiduciarias; RLS; FK RESTRICT; migración aditiva | `schema.ts`, `drizzle/00NN_*.sql`, `catalogs.ts` | M23 (datos) | Sonnet (D11) | D12 + D14 | CT-L1 |
| CT-L3 | `party_identities`: tabla, caso de uso con cifrado de columna o restricción por permiso, auditoría de lectura, sin exposición en listados | `schema.ts`, `src/application/identidades/**`, pruebas de centinela | M23d-identidad | Sonnet | D12 | CT-L2 |
| CT-L4 | Casos de uso `generarContrato`, `enviarARevision`, `aprobar` (autor distinto), `emitir` (instantánea + PDF + hash), `registrarFirma` | `src/application/contratos/**` | M23 | Sonnet | D12 + Codex | CT-L2, PDF |
| CT-L5 | PDF del contrato desde cláusulas (react-pdf) con importes en letras y tabla del plan; prueba de texto extraído | `src/infrastructure/pdf/contrato.tsx` | M23 | Sonnet | D14 | CT-L1, CP-L2 |
| CT-L6 | Rutas `api/contratos/**` (Zod estricto, alcance, `:id`), pruebas de seguridad y de que ningún DTO contiene precio real ni comisión | `src/app/api/contratos/**`, `seguridad-rutas-id.test.ts`, `precios-respuestas.test.ts` | M23 | Sonnet | D12 | CT-L4 |
| CT-L7 | Pantallas `/contratos` y detalle con seis estados | `src/app/(crm)/contratos/**`, `modulos.ts` | M23 | Sonnet | D07 + D14 | CT-L6 |
| CT-L8 | Editor de plantillas con Plate (spike de 45 min primero: ¿cabe en el diseño?) y vista previa | `src/app/(crm)/configuracion/plantillas-contrato/**` | M23b-plantillas | Sonnet | D07 + abogado | CT-L5 |
| CT-L9 | Carga de contrato firmado (escaneado) con evidencia, hash y estado «firmado»; evento `ContratoFirmado` | caso de uso, UI | M23 | Sonnet | D12 | CT-L7, DC-L3 |
| CT-L10 | Fiduciaria del proyecto + carta de instrucción en PDF + constancia de aportes (lectura de pagos de Cobros) | esquema, PDF, consulta | M23c-fiducia | Sonnet | D12 + abogado | CT-L5, M22-L8 |
| CT-L11 | Adenda y cesión (flujo, aprobación, nueva instantánea) con puerto hacia M22 para traspasar el plan | casos de uso, contrato de puerto | M23e | Sonnet | D12 + Codex | CT-L9, M22 (enmienda) |
| CT-L12 | Rescisión con liquidación, cancelación del plan y liberación de la unidad; prueba de extremo a extremo con dobles | casos de uso + pruebas | M23f | Sonnet | D12 + D14 | CT-L11, `UND` |
| CT-L13 | Exportación a Word con docxtemplater | `src/infrastructure/docx/**` | M23g | Sonnet | Codex | CT-L5 |
| CT-L14 | Estado del contrato en Negocios y reporte «ventas sin contrato firmado» | consultas de Negocios/Reportes (con ficha de ese módulo) | M03 / M12 (enmienda) | Haiku | D14 | CT-L9 |
| CT-L15 | `FirmaPort` con doble y adaptador manual (sin proveedor) | `src/application/compartido/firma.ts` | M23 / I05 | Haiku | D12 | CT-L9 |

## 8. No verificado
- **Validez jurídica** de la firma electrónica y de los formatos de contrato en República Dominicana (Ley 126-02 de comercio electrónico, requisitos notariales, legalización): no investigada; la decisión es de un abogado. El estudio D21 de firma digital tampoco la determina.
- El contenido legal mínimo de una promesa de venta de inmueble en plano en RD y las cláusulas exigibles por Ley 189-11 y Ley 158-01: no investigado.
- Licencias individuales de los paquetes de Plate y qué incluye el núcleo gratuito de docxtemplater y Tiptap.
- Soporte de español de `n2words` y su formato de moneda.
- Si Accord Project aporta algo sobre un interpolador propio (solo evaluado por su paquete npm, sin probarlo).
- Quién será el «revisor legal» (usuario, rol nuevo o externo): decisión de Wilber.
- Datos personales: retención y acceso (Ley de protección de datos de RD y RGPD para compradores de la UE) no investigados (el catálogo D21 A18.9 también lo deja sin investigar).
