---
id: M03
nombre: Negocios
estado: READY
riesgo: R3
owner: D10
revisores: [D02, D03, D12, D14]
fuente_de_verdad: PostgreSQL local
depende_de: [M01, M02, M04, M06, M10, G04, G05, G07, G08, G10, I01]
actualizado: 2026-10-13
---

# M03 · Negocios

Entrega T-E1-1a-R1, productor Codex como D01; contratos y límites descritos bajo el ámbito D03 que asigna la tarea. **Nivel L1 durante la edición; promoción documental a L2/READY condicionada a la corrida limpia de §10.** Clasificación: actualización acotada de requisitos de un módulo CRM/ERP existente, R3 por datos personales, cierre financiero e integraciones, conforme a `.viltrum/os/core/routing.md:36`. READY delimita el tramo de §9; no constituye revisión independiente, implementación aprobada ni aprobación de G0/G1/G2 o C1.

Mandato R1: incorporar la Decisión #47, responder Q-301/Q-302/Q-303 con esa fuente firmada y fijar para Q-304…Q-315 supuestos seguros y reversibles, sin convertirlos en bloqueos del tramo construible. Solo se escribe este archivo; sin código, git, datos, servicios ni configuración. Los identificadores técnicos `pipeline` se conservan en referencias y rutas; ningún texto de producto los empleará. Fuente del alcance: `.viltrum/dispatch/20261005T015642Z-D01-codex/TAREA.md`, §Qué hacer.

**Convención de evidencia:** HECHO = código/documento leído; DECISIÓN = declaración atribuida; PROPUESTA = contrato objetivo sometido a revisión; SUPUESTO = valor provisional autorizado por #47, con dueño/fecha/reversión en §9; UNKNOWN = no acreditado. Un comportamiento implementado no demuestra aceptación del cliente. §2 y sus referencias de código, expediente, GitNexus y web conservan la evidencia de T-E1-1a: no se repitieron esas consultas ni se certifica vigencia del runtime en R1. Se leyeron en R1 el perfil, tarea, constitución, ficha y decisiones #45/#46/#47, flujo, índice, referencias D01, doctrina y mapa OSS. Las pruebas de §8 son obligaciones futuras, no resultados de esta sesión. Las dependencias YAML son vínculos funcionales previstos; no se presupone su estado READY.

## 1. Propósito y usuarios

### Problema, proceso y medida de éxito

El equipo comercial necesita conservar el seguimiento de cada negociación sin encerrar a un contacto en un solo proyecto, perder oportunidades que vuelven meses después ni confundir una venta cerrada con una gestión que no se concretó. El cliente explica esos casos en el expediente del 25-08-2026, líneas 201–212. La frecuencia observada y una línea base de tiempo de trabajo son **UNKNOWN**; no se convierten los datos sembrados en métricas de adopción.

Proceso objetivo: contacto existente → negocio independiente con responsable y proyecto(s) de interés → actividad de contacto → presentación con próxima acción → preselección → negociación → venta cerrada con unidad concreta o negocio no concretado archivado. Catálogo real; saltos/retrocesos abiertos conservan la validación de destino bajo SUPUESTO S-304. Contacto y propiedad pueden participar en varias negociaciones abiertas; exclusividad al cerrar la venta (D-03/D-09 y #47). No se obliga a inventariar cada unidad antes de negociar: se elige o se crea la unidad al cerrar.

Resultados verificables: cero bajas físicas del negocio/contacto y de sus asociaciones; cero cambios efectivos del asistente antes de aprobación; cero filtraciones de campos restringidos; historial atribuible para cada mutación; una sola venta/comisión por cierre; lectura operativa local durante caída externa. El objetivo de productividad, su valor inicial, umbral y ventana de medición quedan en Q-315. No se promete fecha, coste ni mejora porcentual sin fuente.

| Actor | Trabajo principal | Alcance objetivo y límites |
|---|---|---|
| Administrador | Supervisar todos los negocios, distribuir trabajo, revisar propuestas del asistente, cerrar y consultar resultados | `deals:view:all` / `deals:edit:all` efectivos; precio de lista real, métricas globales y comisión de terceros. Cualquier administrador activo puede aprobar/rechazar con motivo en un solo nivel; nunca el autor de la propuesta (#47) |
| Broker | Priorizar su cartera, registrar seguimiento, presentar proyectos y conducir la negociación | `deals:view:own` / `deals:edit:own`, filtro por `brokerId`; ve y edita `amountCents` como monto comercial propio (#47). Selecciona o crea unidad concreta al cerrar dentro del proyecto autorizado, sin permiso de precio real. No accede a negocios ajenos del mismo contacto, métricas globales ni comisión de terceros; no aprueba propuestas |
| Asistente | Preparar cambios y seguimiento para aprobación, consultar la carga operativa autorizada | Lectura no financiera conforme al alcance efectivo, sin ampliarlo por #47 (SUPUESTO S-309, D12). Cada cambio permitido se propone sin efecto, incluidas notas/asociaciones/etapas; no aprueba ni se autoaprueba. Caduca a los 7 días. Lotes y documentos están en espera; no existen vías directas alternativas |
| Cliente final | Recibir la comunicación y enlaces autorizados por los módulos correspondientes | No entra al CRM ni obtiene acceso a la ficha interna, según D-08. No es un rol de esta pantalla |

### Fuentes y trazabilidad del requisito

`EXP` designa `C:/Users/wilbe/Documents/QuisqueyaHome PortalWeb/.viltrum/inputs/whatsapp-qa-seguridad/texto/Expediente_Sprint1_CRM_Quisqueya_Home.md`, leído directamente. Es una fuente documental atribuida a la sesión del 25-08-2026; no se consultó la grabación ni el Trello original.

| Requisito | Clasificación y fuente | Consecuencia / aceptación |
|---|---|---|
| REQ-03-01 Vocabulario Negocios / Presentación | DECISIÓN D-04, `EXP:1444`; Wilber, `docs/contexto/decisiones.md:301` | Todos los textos visibles, exportaciones y estados; CA-01 |
| REQ-03-02 Múltiples negocios por contacto y negociaciones por propiedad | DECISIÓN D-03/D-09, `EXP:1440`, `EXP:1461` | Independencia de cada trato; exclusividad solo al cierre; CA-03, CA-08 |
| REQ-03-03 Archivo lógico, motivo y comentario | DECISIÓN D-05/D-10, `EXP:1447`, `EXP:1464`; mandato de comentario en `.viltrum/dispatch/20261004T235540Z-D01-codex/TAREA.md:22` | Contacto recontactable, sin DELETE físico. El expediente admite comentario; la tarea exige motivo y comentario, por lo que esta ficha exige ambos; CA-07, CA-09 |
| REQ-03-04 Aprobar cada cambio del asistente | DECISIÓN D-06, `EXP:1450`, completada por #47 | Propuesta separada del efecto, un nivel admin y nueva autorización al aprobar; REQ-03-13, CA-10 |
| REQ-03-05 Precio real / métricas globales / comisión ajena restringidos | DECISIÓN D-07, `EXP:1453`, precisada por #47 | Monto comercial propio visible/editable al broker; precio real y comisión de terceros solo admin. SELECT/DTO/respuestas/exportación; REQ-03-14, CA-11 |
| REQ-03-06 Inventario por rangos y documentación enlazada | DECISIÓN D-01/D-02, `EXP:1431`, `EXP:1436`, completada por #47 | Proyecto/rango antes del cierre; elegir/crear unidad concreta al cerrar, sin alta anticipada de cada unidad; REQ-03-15, CA-12 |
| REQ-03-07 Cliente fuera del CRM | DECISIÓN D-08, `EXP:1457` | Ningún enlace interno compartido ni autenticación de comprador; CA-13 |
| REQ-03-08 Etapas editables y seguimiento transversal | DECISIÓN atribuida al Acta de Reunión 2 en `TAREA.md:26`; texto del acta **UNKNOWN** en esta sesión | Catálogo, nota y próxima acción en ficha. Semántica de reordenación Q-304; CI-301; CA-02, CA-14 |
| REQ-03-09 Rediseño completo y simple | DECISIÓN #46, Wilber 04-10-2026, `docs/contexto/decisiones.md:306` | Pantallas DS-1, divulgación progresiva, sin relleno ni cifras falsas; CA-15 a CA-19 |
| REQ-03-10 SQL fuera de página y datos reales | Mandato E1, `.viltrum/vre-os/PLAN-E1.md:23` | Consulta de aplicación mediante puerto, no Drizzle en aplicación; CA-04 |
| REQ-03-11 Integración local y outbox | ARQ aprobada, `.viltrum/vre-os/ARQ-VRE-002-integraciones.md:78`; `TAREA.md:44` | `NegocioCambioEtapa` transaccional, proveedor sustituible; CA-20 a CA-23 |
| REQ-03-12 Capacidades completas adicionales | PROPUESTA D05, `.viltrum/vre-os/design/DS-1-negocios-leads.md:87`, `:162` | Vistas guardadas, agrupación, selección múltiple, análisis, timeline y documentos; contratos pendientes en §9; CA-24 a CA-27 |
| REQ-03-13 Aprobación de un nivel y caducidad | **REQUISITO FIRMADO — Decisión #47**, Wilber De La Rosa, 2026-10-05, `docs/contexto/decisiones.md:311`; resuelve Q-301 y completa REQ-03-04/D-06 | Cualquier administrador aprueba/rechaza con motivo; autor distinto, sin autoaprobación ni escalamiento implícito; caduca a los 7 días. §4/§5, CA-10 |
| REQ-03-14 Monto comercial separado del precio real | **REQUISITO FIRMADO — Decisión #47**, Wilber, 2026-10-05, `docs/contexto/decisiones.md:311`; resuelve Q-302 y precisa REQ-03-05/D-07 | Broker ve/edita monto comercial de sus negocios; precio de lista real de unidad y comisión de terceros solo admin. Restricción en consulta, DTO y respuesta de mutación, §4/§5; CA-06/CA-11 |
| REQ-03-15 Unidad concreta y venta exclusiva | **REQUISITO FIRMADO — Decisión #47**, Wilber, 2026-10-05, `docs/contexto/decisiones.md:311`; resuelve Q-303 y completa REQ-03-02/06 | Broker elige o crea unidad al cerrar; ninguna venta sin unitId ni segunda venta de una unidad, incluso concurrente. Restricción única durable en BD y prueba concurrente, §5; CA-08/CA-12 |

Línea base CRM incorporada: auditoría por registro, permisos granulares, búsqueda, baja lógica y recuperación controlada, historial y reportes exportables (`.viltrum/os/departments/D01-discovery/reference/expected-capabilities.md:39`). Importación/exportación masiva se coordina con G08; no se presupone un importador de negocios disponible. La selección de campos/formato y validación masiva requieren Q-309. Esta ficha amplía capacidad, pero D02 fija prioridad y oleadas; los P0/P1 del diseño no se convierten aquí en prioridades comerciales definitivas.

## 2. Estado actual (AS-IS, del inventario P0)

### Evidencia heredada de T-E1-1a (citas de ruta, nomenclatura y datos de adorno verificadas contra código en R2; sin comprobación de runtime)

| Superficie | HECHO y evidencia | Brecha frente al objetivo |
|---|---|---|
| Página `/negocios` | Actor y `deals:view` antes de lectura; `visibleRows` de broker/baja; negocios y catálogos reales (`src/app/(crm)/negocios/page.tsx:49`, `:57`, `:84`) | SQL y Drizzle siguen en página. No hay `application/pipeline/consultas.ts` en el inventario de archivos leído |
| Relaciones | Propiedad principal en consulta separada; inspector seleccionado dentro de filas visibles; proyectos limitados por `projects:view` (`page.tsx:112`, `:133`, `:161`) | Consulta de principales lee todas las asociaciones, aunque solo se devuelven las de filas visibles. Rehacer la consulta con alcance desde el inicio y comprobar alcance de los datos relacionados |
| Tablero/lista | Tabs reales, filtros de broker/proyecto por nombre en cliente (`vista.tsx:108`, `:137`, `:192`); HTML drag-and-drop y PATCH (`vista.tsx:148`, `:359`) | Sin filtros de rango en servidor, paginación de lista, vistas guardadas, agrupación dinámica o selección múltiple. Tarjeta arrastrable es `div` sin alternativa de teclado propia (`vista.tsx:380`); selector del inspector sí existe (`inspector.tsx:212`) |
| Ficha | Edición de monto/probabilidad/comisión/fecha, asociación de proyecto/unidad, principal y retirada; notas solo lectura; historial reutilizado (`inspector.tsx:118`, `:159`, `:206`, `:240`) | Sin tabs 360, consulta explícita de historial de etapas/documentos ni flujo de propuesta/aprobación |
| Cambio de etapa | Unidad de trabajo, alcance `reaches`, validación de destino, historial y auditoría (`src/application/pipeline/casos-de-uso.ts:43`) | No bloquea el cambio simple; no valida que motivo esté activo; comentario opcional; no emite outbox. No hay idempotencia de comando ni versión esperada |
| Cierre | Bloquea negocio y revisa `kind`; ocho pasos con unidad vendida/reservada, metas, perfil, comisión, cancelación futura y auditoría (`src/application/pipeline/cierre.ts:64`, `:92`) | Bloquea negocio, no unidad compartida; no comprueba disponibilidad en `repos/pipeline.ts:151`. No limpia `nextActivityId`. #47 resuelve rangos: unidad obligatoria solo al cierre; falta garantía de venta única en BD |
| Baja de asociación | `quitarPropiedad` llama a DELETE real (`casos-de-uso.ts:338`; `src/infrastructure/db/repos/pipeline.ts:373`) | Contradice D-10; requiere baja lógica del interés y lectura histórica, no pérdida del vínculo |
| Contrato de salida | Página incluye `amountCents` y `commissionBasisPoints` (`page.tsx:71`); PATCH devuelve negocio completo (`src/app/api/pipeline/[id]/route.ts:56`, `etapa/route.ts:45`) | #47 define amountCents como monto comercial propio visible/editable al broker; falta proyección restrictiva de precio real y comisión ajena. Tarjeta muestra comisión calculada sin contrato por rol (`vista.tsx:422`) |
| Estados | Carga `loading.tsx:8`, vacío `vista.tsx:255`, error `error.tsx:22`, permiso en página `page.tsx:50`; formularios conservan entrada tras fallo de red (`inspector.tsx:300`, `:423`) | El modo offline del tablero/analítica no está implementado ni verificado. Los movimientos usan `alert` (`vista.tsx:158`); el diálogo de pérdida se cierra después del intento incluso si falló (`vista.tsx:506`) |
| Datos de adorno | Etiqueta Confotur incondicional (`src/app/(crm)/negocios/vista.tsx:420-422`), suma activa formateada como USD sin separar monedas (`vista.tsx:144-146`, `:187`). El hito 10·40·50 fue retirado en `e045c83` según revisión D02; su ausencia se verifica en la tarjeta actual | Confotur debe venir del proyecto; no mezclar divisas. El hito ya no es una brecha AS-IS |
| Nomenclatura | En HEAD (`6c610e3`, según revisión D02), título, metadata y carga ya dicen «Negocios», y el error dice «No se pudieron cargar los negocios» (`src/app/(crm)/negocios/page.tsx:38`; `src/app/(crm)/negocios/vista.tsx:182`; `src/app/(crm)/negocios/loading.tsx:11`; `src/app/(crm)/negocios/error.tsx:24`), verificados contra el código actual | REQ-03-01 satisfecho en estos textos de la vista; aceptación completa pendiente de inventario y E2E CA-01 |

Pruebas presentes, **no ejecutadas en esta sesión**: transición y permisos en `src/application/pipeline/casos-de-uso.test.ts:122`, `:158`, `:188`, `:232`; cierre/rollback/doble cierre en `cierre.test.ts:133`, `:347`, `:396`; guardas del bloqueo, upsert parcial y zona horaria en `cierre.test.ts:452`, `:459`, `:470`. Hay pruebas que conservan los comportamientos antiguos de comentario ausente (`casos-de-uso.test.ts:209`) y DELETE (`:407`); no sirven como aceptación de los requisitos firmados nuevos. La guarda de lecturas solo se activa cuando existe `consultas.ts` (`src/infrastructure/arquitectura.test.ts:120`); no se debilita para migrar.

Datos de carga documental: 648 leads, 184 negocios, 400 unidades y 12 brokers **según** `.viltrum/vre-os/PLAN-E1.md:9`. El inventario reporta 184 negocios, 184 asociaciones, 592 movimientos, 1.803 actividades, 17 comisiones, 15 usuarios y 13 perfiles de broker (`.viltrum/vre-os/spec/inventario/crm-as-is.md:220`, `:221`, `:238`). Son conteos totales de una lectura de otro productor, no conteos por rol ni recuentos hechos por D01; no se accedió a la BD. La diferencia entre 12 brokers sembrados y 13 perfiles totales no prueba un error: denominadores distintos.

GitNexus se consultó para flujos de cambio/cierre mediante `query` sobre `QuisqueyaHome_CRM`; devolvió `cambiarEtapaDeNegocio`, `cerrarNegocioGanado` y la vista. Se contrastaron con los archivos actuales. No se editaron símbolos; no corresponde análisis de impacto de cambios de código ni `detect_changes` previo a commit, porque esta tarea no realiza commit.

## 3. Pantallas

### Contrato común de experiencia

URL canónica activa en la interfaz: `/negocios`, con `?deal=<id>` para inspector. `/pipeline` y sus subrutas redirigen permanentemente (HTTP 308) a `/negocios` y sus subrutas (`next.config.ts:14-15`). Las pantallas de producto se llaman **Negocios**. Se toma DS-1 como receta visual prioritaria (`DS-1-negocios-leads.md:9`, `:87`, `:162`) y se registran incompatibilidades en §9; sus consultas de ejemplo sobre `negs` no son SQL ejecutable.

Cabecera, búsqueda, vista guardada, acción contextual y filtros compactos; tabs **Tablero · Lista · Análisis**. Filtro de resultado **Todos · Activos · Venta cerrada · No concretado** basado en `kind`, conservando las siete etapas del catálogo en el tablero. Estos nombres de resultado distinguen el cierre de la venta sin sustituir el nombre editable de la etapa. Para alquileres, el estado ganado debe presentar el tipo de operación; no describir un alquiler como venta. Admin ve contexto global; broker ve su cartera; asistente ve solo lo autorizado. Filtros comunes: proyecto por ID, broker por ID/alcance, resultado, etapa, operación/divisa, monto desde–hasta y fecha desde–hasta. El campo exacto del rango de fecha se resuelve en Q-305.

Diseño `docs/DESIGN.md:71`: una acción primaria por vista, inspector de 400–440 px en escritorio, tokens semánticos, Hanken Grotesk/Atkinson Hyperlegible Next, textos ≥13 px, sin confeti ni elementos financieros de adorno. Se reutilizan `Card` (`src/components/ui/card.tsx:4`), `Tabs` (`tabs.tsx:8`), `ChartContainer` (`chart.tsx`, exportación existente), `ChartCard` (`chart-card.tsx:6`) y `Drawer` (`drawer.tsx:7`). Instalación de primitivas no demuestra que M03 ya las use.

En 320/390: lista vertical de tarjetas/etapas desplegables, una superficie principal de desplazamiento por tab, filtros y acciones en hoja inferior, nunca tabla horizontal. Dock del shell existente, área segura y controles ≥48×48 px (`D05-graficas-movil.md:39`). En 768/1440: tabla semántica o columnas proporcionadas; ningún overflow horizontal de página. El drag no es obligatorio para operar: botón **Cambiar etapa** con selector accesible y confirmación tiene la misma validación. Foco visible, Escape/cierre y retorno a origen; los cambios se anuncian con `aria-live`. Respetar movimiento reducido.

### SCR-NEG-TABLERO · Trabajo por etapa

- **Fuente:** `DS-1-negocios-leads.md:9`, receta `:21`, wireframes `:51`; reemplaza la referencia antigua 7835 de `D05-ux-modulos-A.md:98` por el ID **29221** de DS-1 y `docs/DESIGN.md:144`.
- **Bloques:** cabecera/filtros; siete etapas iniciales Nuevo, Contactado, Presentación, Preselección, Negociación, Cierre y Perdido, leídas de tabla (`db/seed.sql:102`); conteo y suma por divisa/permiso; tarjetas con contacto, proyecto/rango, responsable, monto autorizado USD, antigüedad en etapa y próxima acción con fecha. USD es la divisa de la carga prevista; un registro en otra moneda conserva su divisa, sin conversión inventada.
- **Consultas:** `consultarTableroNegocios`, `consultarCatalogosNegocios`, `resumirNegocios` de §5. Los totales siempre usan exactamente los filtros y el alcance de las tarjetas, evitando doble conteo por N:M.
- **Acciones:** abrir ficha, contactar por enlace autorizado, mover, preparar pérdida/cierre, filtrar. Broker solo suyos; asistente envía propuesta, no PATCH efectivo. Alta desde conversión M01; creación independiente y Ctrl+N inactivos bajo SUPUESTO S-309.
- **Componentes:** 29221 kanban; **34511** sparkline propuesto por DS-1 `:18` (solo con serie real y autorizada; oculto en móvil). Licencia, adquisición y encaje de estos IDs pendientes de D05/D07, Q-313; no se descargó código.
- **Móvil:** encabezados de etapa desplegables y tarjetas; movimiento desde hoja inferior. En 320 se apilan los campos, sin truncar el significado de etapa/resultado; etiquetas largas se parten.

### SCR-NEG-LISTA · Lista y análisis

- **Fuente:** `DS-1-negocios-leads.md:87`, wireframes `:129`.
- **Lista:** búsqueda, filtros y selector de vista; columnas contacto/negocio, proyectos, etapa/resultado, monto autorizado y divisa, broker, días en etapa, próxima acción y fecha estimada. Orden, grupos por proyecto/broker/etapa y selección múltiple. Un negocio con varios proyectos sigue siendo uno; el grupo no puede inflar totales.
- **Análisis:** tab separado con `ChartCard` para conteos por etapa, valor ponderado, antigüedad y cierre/pérdida. Admin global; broker solo cartera; asistente sin rendimiento global. Definición de conversión por cohorte, comparación y series pendiente en §7; no se dibujan probabilidades ni históricos falsos.
- **Vistas guardadas:** conservar filtros/orden/columnas/agrupación y propietario, nunca guardar ni heredar permisos. Se reevalúa autorización al abrir. Compartir y persistencia son propuestas bloqueadas por Q-308.
- **Acciones:** abrir ficha, editar autorizado, exportar CSV por servidor y acción masiva previa a vista de confirmación. Operaciones admitidas, límite y atomicidad del lote pendientes Q-309; el diseño de selección no concede escritura.
- **Componentes:** **23604** tabla y **33507** analítica según DS-1 `:95`; `ChartCard`/`ChartContainer`/`Tabs`. La alternativa de tabla con scroll horizontal de DS-1 se registra como conflicto: se usa transformación a tarjetas exigida por `D05-graficas-movil.md:48`.
- **Móvil:** tarjetas apiladas; selección accesible; filtros/agrupación en Drawer; análisis en su tab, sin varias gráficas sobre la lista.

### SCR-NEG-FICHA · Ficha 360 en inspector / hoja inferior

- **Fuente:** `DS-1-negocios-leads.md:162`, wireframes `:203`. Se referencia la receta, pero Pagos y simulador 10/40/50 quedan fuera de esta ficha por mandato.
- **Tabs:** **Resumen** (contacto, proyecto/rangos, responsable, estado, próxima acción, nota); **Seguimiento** (historial de etapas y actividades con actor/fecha); **Propiedades** (intereses/principal y enlaces de disponibilidad); **Documentos** (enlaces autorizados, procedencia y estado). Información financiera por permiso dentro de Resumen; no crear tab de pagos vacío.
- **Consultas:** `consultarFichaNegocio`, `consultarSeguimientoNegocio`, `consultarInteresesNegocio`, `consultarDocumentosNegocio`. El acceso al contacto no amplía el alcance sobre otros negocios del contacto.
- **Acciones:** editar campos permitidos, registrar nota/acción mediante M06, asociar interés por proyecto, marcar principal, dar de baja lógica un interés, cerrar o marcar no concretado. Asistente propone; cualquier admin activo revisa con motivo antes del vencimiento, en un solo nivel (#47). KYC y restauración de versiones quedan en espera, S-311/S-312.
- **Componentes:** **28340** timeline semántica de lista y **4086** tabs según DS-1 `:169`; Drawer/hoja 25002 como referencia global (`docs/DESIGN.md:146`). DS-B asigna 4086 a calendario (`D05-ux-modulos-B.md:117`): identificación pendiente Q-313; conservar Radix `Tabs` mientras se verifica, sin adquirir un componente equivocado.
- **Móvil:** una columna; contacto/estado y acción contextual primero; cabecera y pie de hoja sticky, cuerpo desplazable y sin ocultar contenido tras dock. El Drawer instalado requiere normalización de radio, handle y objetivos táctiles (`drawer.tsx:55`, `:67`); no se afirma que ya cumpla.

### Diálogos de transición y matriz de seis estados

Pérdida: motivo activo + comentario no vacío; error conserva campos, cancelar no cambia datos; éxito **Negocio no concretado, archivado** y contacto accesible. Cierre: resumen, monto comercial y selector **Elegir unidad / Crear unidad** dentro del proyecto autorizado; unitId obligatorio, advertencia y confirmación, sin arrastre directo a cierre. Crear unidad no pide precio real al broker ni lo muestra. Si la identidad física ya existe, seleccionarla; conflicto de venta exige otra unidad, nunca un duplicado. Asistente ve **Enviar para aprobación** y el vencimiento. Revisión admin en ficha: cambios permitidos, autor/fecha, estado, motivo obligatorio y **Aprobar / Rechazar**; acciones inactivas tras caducidad. `409` requiere actualizar y decidir otra vez.

| Estado | Tablero | Lista / Análisis | Ficha / transición |
|---|---|---|---|
| Carga | Esqueleto de etapas/tarjetas, `aria-busy`; sin mover | Filas/gráfica con altura estable; sin exportar | Esqueleto del tab; envío ocupado sin doble confirmación |
| Vacío | Distinguir cartera vacía de filtros sin resultados; limpiar filtros o ir a Leads autorizado | Cero resultados explícitos; grupo vacío; gráfica sin denominador muestra «Sin datos» | Sin actividad/intereses/enlaces; CTA autorizado. Catálogo sin motivos impide perder con explicación |
| Error | Fallo recuperable con reintento, datos anteriores identificados si existen | Reintentar consulta/ChartCard; no sustituir fallos por ceros | Error junto al campo o formulario; conservar borrador; no cerrar hoja ni confirmar cambio |
| Sin conexión | Aviso, información ya disponible en memoria solo lectura; no mandar mutaciones | Datos previos con aviso; exportación de servidor inactiva | Entrada de formulario en memoria de la vista, sin persistencia automática de PII ni cola de cierre; reintento manual tras resolver resultado incierto |
| Éxito | Ubicación, contador e historial coherentes tras respuesta confirmada | Lista/agrupación/totales actualizados; tabla alternativa accesible en gráficas | Toast y foco; propuesta pendiente se distingue de cambio aprobado; cierre y pérdida muestran resultado correcto |
| Permiso insuficiente | Página denegada o sin acción por permiso; no datos ocultos en DTO | Analítica/exportación no autorizadas sin cifras ni metadata | 403 sin permiso, 404 para ID fuera de alcance; hoja sin información ajena |

Estados adicionales: conflicto de versión/transición `409` con actualización; sesión expirada conserva solo entrada no publicada y pide reautenticación; proveedor caído **con servidor local disponible** muestra sincronización pendiente sin impedir trabajar; carga parcial nunca se etiqueta total. La caída externa es distinta de navegador sin red. La recomendación antigua «Guardado localmente. Sincronizando…» (`D05-ux-modulos-A.md:112`) no habilita escrituras offline sin contrato G07.

### Wireframes de adaptación (objetivo, sin datos de muestra de negocio)

```text
1440 · SCR-NEG-TABLERO (dentro del shell)
Negocios    [Vista] [Buscar]                          [Acción autorizada]
[Tablero] [Lista] [Análisis]   [Proyecto] [Broker] [Desde–hasta] [Resultado]
[Estado de sincronización si corresponde]
Nuevo | Contactado | Presentación | Preselección | Negociación | Cierre | Perdido
conteos / montos autorizados por divisa, tarjetas + próxima acción
                                                [Ficha 360 cuando se abre]

1440 · SCR-NEG-LISTA
Negocios    [Vista guardada] [Filtros] [Agrupar]       [Exportar autorizado]
Contacto | Proyectos | Etapa | Monto | Broker | Días | Próxima acción
[Selección múltiple] → [Acción contextual y confirmación]
[Análisis] → gráficas en tab propio, resumen textual y datos tabulares

390 / 320 · SCR-NEG-TABLERO / LISTA
Negocios                      [Acción]
[Tablero] [Lista] [Análisis]
[Buscar] [Filtros en hoja] [Vista]
[Aviso si sin conexión / sincronización]
> Nuevo (conteo)
v Contactado (conteo)
  Contacto / Proyecto
  Monto autorizado · Días en etapa
  Próxima acción · Fecha
  [Ver ficha] [Cambiar etapa]
> Presentación  > Preselección ... hasta Perdido
[Dock del shell + área segura]

1440 · SCR-NEG-FICHA            390 / 320 · hoja inferior
Contacto / Resultado           [Handle] Contacto          [Cerrar]
Resumen | Seguimiento          [Resumen] [Seguimiento] [Más tabs]
Propiedades | Documentos       Estado y próxima acción
Contenido + enlaces            Contenido en una columna
[Cerrar / No concretado]       [Acción autorizada en pie sticky]
```

## 4. Funciones (casos de uso)

### Contrato común de entrada, permiso y ejecución

**Objetivo de validación, pendiente de implementación:** Zod en formularios y BFF, reglas en aplicación/dominio, FK/CHECK/UNIQUE en BD. IDs enteros positivos, dinero en centavos como entero seguro no negativo, probabilidad 0–100, comisión 0–10000 puntos básicos, fechas de calendario válidas; rangos `desde <= hasta`; booleanos estrictos, sin coerción de texto a booleano. PATCH diferencia ausente y null. Asignación campo por campo y proyección de salida por permiso. Las rutas actuales no satisfacen todos los requisitos: fecha es string sin formato (`src/app/api/pipeline/[id]/route.ts:25`) y `isPrimary` usa coerción (`propiedades/route.ts:27`). Longitudes de nota/comentario, límites de lote/página y divisas admitidas quedan Q-309; no se inventan cifras de negocio en la vista.

`requireScope`/`requireFullScope` antes de datos en servidor; `reaches`/`visibleRows` por entidad. Los nombres actuales son `deals`, `projects`, `activities`; sufijo `own|all` describe el permiso otorgado, no dos endpoints. Actor de sesión, nunca del body. Permisos nuevos de aprobación/vistas/documentos/exportación se acuerdan con G04, no se presentan como permisos instalados. La visibilidad de campos y la capacidad de editar son contratos separados. En §4, «evento de etapa» significa solo `NegocioCambioEtapa` con payload mínimo de §6; otros eventos indicados como propuestos no pertenecen al enum actual.

| Caso de uso / disparador | Entrada Zod objetivo | Reglas y salida | Errores / permiso | Outbox / idempotencia |
|---|---|---|---|---|
| Consultar tablero/lista/ficha | Filtros tipados y `dealId` opcional; orden en lista blanca | Alcance antes de filtros; una fila por negocio; DTO saneado + catálogo/totales | 400 filtro inválido, 403 sin `deals:view:own|all`, 404 ID ajeno | Sin evento; lectura repetible, resultados dependientes del estado actual |
| `cambiarEtapaDeNegocio` por mover/selector | `{stageId, lossReasonId?, lossComment?, amountCents?}` + versión/clave propuestas Q-307 | Destino activo, negocio abierto y visible, prerrequisitos de tabla siguiente; actualización + historial + auditoría; DTO autorizado | 404 inexistente/ajeno/inactivo, 409 regla/concurrencia; `deals:edit:own|all` | Evento de etapa en misma transacción; hoy no existe. Bloqueo o CAS de todas las transiciones, no solo cierre; repetición de comando pendiente Q-307 |
| Cerrar venta (`kind=won`) | Destino + monto comercial final o existente, `unitId` seleccionado o alta acotada de unidad, confirmación y control S-307 | REQ-03-15: unidad concreta del proyecto autorizado, disponibilidad releída, bloqueo de negocio/unidad y reserva de venta con UNIQUE durable en BD. Crear/seleccionar y cerrar atómicamente; ocho efectos aplicables, limpiar próxima acción, rollback íntegro | 400 falta unidad/forma, 404 relación ajena, 409 unidad vendida/identidad duplicada/datos de cierre; `deals:edit:own|all`. Broker no debe leer/editar precio real para cerrar; altas M04 acotadas por servidor | Un evento al éxito; ningún efecto del perdedor concurrente. S-307 rige reintento. Contratos de alquiler/ledger siguen M15, sin marcar alquiler como venta |
| Archivar no concretado (`kind=lost`) | Motivo activo y `lossComment` con trim/no vacío | No toca contacto ni libera/vende inventario por suposición; conserva historial; resultado lost distinguible de baja administrativa | 400 forma, 409 ausencia/motivo inactivo; `deals:edit:own|all` | Evento de etapa; no repetir historial/outbox por doble clic. Política de próximas actividades al perder, Q-311 |
| `editarNegocio` | Monto/probabilidad/comisión/fecha opcional/null; nota según contrato seguimiento | Solo abierto y visible; no asignar stage/broker/cierre por este PATCH; campos autorizados, auditados | 404 ajeno, 409 terminal, 403 campo restringido; `deals:edit:own|all` | Edición sin cambio de etapa no emite evento de etapa. Evento futuro de edición UNKNOWN; versión/clave Q-307 |
| Asociar proyecto/rango de interés | `{projectId, unitId?, isPrimary?}` estricto como compatibilidad actual; rango como propuesta Q-303 | Negocio abierto, proyecto visible, unidad opcional del proyecto si existe; múltiples tratos permitidos; DTO de interés | 404 fuera de alcance/relación inválida, 409 duplicado; `deals:edit:own|all` + `projects:view:own|all` | Auditoría local; evento específico no definido. UNIQUE y clave permiten no duplicar interés; contrato de repetición Q-307 |
| Marcar principal | `dealId`, `propId`, `{isPrimary:true}` | Asociación vigente del negocio; máximo una principal activa; transacción y guarda contra concurrencia | 404 asociación ajena, 409 terminal/conflicto; `deals:edit:own|all` | Sin evento CRM definido; versión/clave Q-307 |
| Retirar interés | IDs + motivo/confirmación según Q-311 | Sustituir DELETE físico por baja lógica y auditoría; preservar asociaciones históricas; principal/prerrequisitos deben seguir consistentes | 404 ajeno, 409 negocio terminal/conflicto; `deals:edit:own|all` | Sin evento definido; repetir baja no produce segunda baja. Schema pendiente D11 |
| Registrar nota/próxima acción | Entrada de M06: `dealId`, texto/tipo, responsable y fecha/estado según capacidad | Mantener reglas y alcance de negocio/actividad; no permitir vincular negocio ajeno; separar próxima acción vigente de actividad completada | 400 forma, 404 vínculos ajenos, 409 estado; `activities:create|edit:own|all` y acceso legítimo al negocio | `ActividadRegistrada` solo si ese caso M06 lo emite transaccionalmente; no se afirma conectado. Asistente propone; Q-301 |
| Preparar/aprobar/rechazar cambio del asistente | Comando tipado con entidad/revisión y campos permitidos; decisión con motivo no blanco y actor de sesión | REQ-03-13: propuesta no cambia negocio/unidad/metas/comisión/evento. Cualquier admin activo aprueba o rechaza en un solo nivel, distinto del autor. Al aprobar releer alcance, campos, reglas y revisión; ejecutar el mismo caso en una transacción con la resolución | 403 broker/asistente/no admin; 400 motivo ausente; 404 propuesta fuera de alcance; 409 resuelta/caducada/revisión cambiada. A los 7 días no se aplica aunque no corra un scheduler | Solo aplicación aprobada emite evento; máximo una aplicación, incluso dos admins concurrentes. Rechazo y caducidad conservan propuesta/auditoría sin efecto de dominio |
| Alta de negocio desde contacto / desde lead | Contrato vigente de conversión M01; alta independiente pendiente Q-309 | Reutilizar contacto; no imponer UNIQUE contactId/projectId. No habilitar botón sin fuente/validaciones | `deals:create:own|all` como objetivo a contrastar G04 y M01 | Evento de creación no está en enum actual; decidir si necesita espejo Q-306. Alta no equivale a transición |
| Guardar vista / agrupar / acción masiva | Filtros/orden/columnas y selección de IDs validados, propietario en sesión | Vista no amplía permisos; acción masiva usa el mismo caso por negocio y aprobación si asistente | Permiso de persistencia/lote UNKNOWN Q-308/Q-309 | Vista sin evento CRM; cambios de etapa aprobados emiten por negocio. Atomicidad del lote pendiente |
| Exportar / abrir documentos | Filtros de lista; ID de enlace/archivo autorizado | CSV seguro en servidor; documento externo autorizado, sin replicar carpeta ni exponer enlace privado indiscriminadamente | Alcances de G08/documentos UNKNOWN Q-309/Q-312; error recuperable | Sin evento de etapa; acceso/exportación con evidencia de auditoría según política a revisar |

### Invariantes de transición actuales y objetivo a confirmar

| Destino canónico | HECHO del código que debe quedar cubierto | Excepción / decisión pendiente |
|---|---|---|
| Nuevo | Etapa abierta sin requisito propio (`src/domain/transicion-etapa.ts:205`) | Saltos/retrocesos abiertos se revisan con Q-304, sin adoptar un workflow serial por intuición |
| Contactado | Actividad de contacto completada y no borrada (`repos/pipeline.ts:68`); tipos del catálogo del puerto | No contar tarea genérica o actividad de otro negocio |
| Presentación | Próxima acción pendiente con responsable y fecha (`casos-de-uso.ts:75`; `repos/pipeline.ts:84`) | Pointer debe pertenecer a este negocio, no basta actividad vigente ajena; añadir prueba |
| Preselección | Al menos una propiedad de interés (`transicion-etapa.ts:171`) | Al agregar baja lógica, contar solo intereses activos |
| Negociación | Monto, probabilidad, comisión y fecha estimada (`transicion-etapa.ts:179`) | #47 permite monto comercial propio al broker; comisión de terceros no sale al DTO. S-309 deja tasas/configuración de comisión al admin; si faltan, error «Configuración de comisión pendiente», sin revelar importes ni exigir campo oculto |
| Cierre (`won`) | Monto y principal con unidad; comisión necesaria; terminal (`cierre.ts:80`) | #47 exige seleccionar/crear unidad solo al cierre, venta única entre negocios distintos con restricción BD y prueba concurrente |
| Perdido (`lost`) | Motivo; terminal (`transicion-etapa.ts:143`, `:121`) | Objetivo exige comentario y motivo activo; no reabrir terminal sin política Q-311 |

La evidencia anterior engancha reglas a posiciones 2/3/4/5 (`transicion-etapa.ts:40`) mientras permite reordenar (`src/application/etapas/casos-de-uso.ts:23`). SUPUESTO S-304: reglas por identidad semántica estable del catálogo, conservando slug/kind; cambios de orden/nombre no cambian validación. Hasta separar regla de posición, no habilitar reordenación/desactivación desde M03. Se mantiene el catálogo actual y saltos entre abiertas sujetos a prerrequisitos de destino, sin reapertura terminal. Es contrato provisional D03, no una migración ejecutada.

### Contrato firmado de aprobación y campos por rol

REQ-03-13 (#47): fecha de envío y vencimiento se calculan en servidor. **Convención técnica SUPUESTO S-307:** 7 días son 604800 segundos desde `submittedAt` UTC; vigente solo si reloj servidor `< expiresAt`; igualdad ya es caducidad. Duración firmada de 7 días en fuente única de configuración, sin repetición en vistas. Estados propios de propuesta: pendiente, aprobada/aplicada, rechazada, caducada y en conflicto; no son etapas del negocio. No hay aprobación automática ni prórroga al editar. Una corrección crea otra propuesta y conserva el rastro. La autorización efectiva de autor y revisor se reevalúa al aprobar; una reasignación/revocación invalida el alcance anterior. CAS/bloqueo de propuesta y ejecución/resolución/auditoría en una transacción: el segundo admin recibe conflicto/resultado ya resuelto sin segunda aplicación. Si fallan reglas, incluida venta única, no se marca aplicada; se conserva el rechazo técnico sin mutaciones parciales.

| Campo/acción | Admin activo autorizado | Broker | Asistente (SUPUESTO S-309 para lo no firmado) |
|---|---|---|---|
| Monto comercial `deals.amountCents` | Lectura/edición con alcance | Lectura/edición solo propios, firmado #47 | Sin exposición ni cambio financiero directo; propuesta financiera en espera |
| Precio de lista real de unidad/proyecto | Lectura autorizada; gestión M04 | No SELECT/DTO/formulario/PATCH/exportación | No SELECT/DTO ni propuestas de precio real |
| Comisión de terceros y métricas globales | Lectura autorizada; gestión M10 | No exposición | No exposición |
| Tasas y comisión propia | Gestión admin/M10 | Edición de tasa no habilitada; visualización propia diferida (S-309), sin afirmar prohibición firmada | Sin exposición ni edición |
| Etapa/nota/próxima acción/interés | Ejecución autorizada | Ejecución propia autorizada | Propuesta permitida no financiera, nunca ejecución directa |
| Seleccionar/crear unidad al cerrar | Proyecto/unidad autorizados | Propio, alta mínima de identidad dentro del proyecto visible, sin precio real | Propuesta de selección/alta sin materializar inventario; aplicación admin |
| Aprobar/rechazar | Cualquier admin, motivo obligatorio, autor distinto, un nivel | Denegado | Denegado, incluso su propia propuesta |

La restricción REQ-03-14 se aplica **antes de leer campos sensibles**: SELECT por proyección para rol/alcance; nada de `SELECT *` seguido de ocultación JSX. Un DTO de broker permite monto comercial, divisa y campos operativos propios; omite precio real, base/repartos/tasas que revelen comisión de terceros y métricas globales. Misma proyección para RSC/HTML, ficha, mutación aprobada, errores, historial visible y exportación. Payload con precio real/comisión de tercero rechazado campo por campo, sin copiar cuerpo completo. Crear unidad como broker es capacidad acotada de cierre; no concede administración general de inventario ni `projects:edit:all`.

## 5. Datos

### Tablas y campos existentes que consume

| Tabla | Campos relevantes / restricciones verificadas | Uso objetivo |
|---|---|---|
| `deals` | ID, contact/lead, title, stage/source/broker, operation/currency, amount/probability/commission, expectedCloseDate, nextActivityId, stageChangedAt/closedAt, lossReason/comment/notes, autoría/fechas/deletedAt (`src/infrastructure/db/schema.ts:672`). FK de contacto/etapa/motivo; índices contacto/etapa/broker/cierre `:708` | Registro del negocio y estados. `nextActivityId` sin FK por ciclo; comprobar pertenencia/estado en aplicación. No hay UNIQUE contacto/proyecto |
| `deal_properties` | deal/project/unit opcional, principal, createdAt/By; UNIQUE deal+unit y parcial deal+project si unit NULL (`schema.ts:719`, `:736`) | Intereses múltiples. No hay baja lógica ni restricción de principal única en BD; migración necesaria antes de retirada lógica y concurrencia segura |
| `deal_stage_history` | deal, from/to stage, changedBy/At; índice por deal (`schema.ts:753`) | Timeline y duración/conversión. Nunca modificar una transición histórica para actualizar el catálogo |
| `pipeline_stages` | slug/name/position/kind/defaultProbability/isActive; UNIQUE slug e índice position (`schema.ts:287`) | Catálogo leído, no siete nombres/porcentajes duplicados en vista. Nombre editable; kind/slug no se editan por endpoint actual |
| `loss_reasons` | slug/name/position/isActive; UNIQUE slug (`schema.ts:307`) | Motivo vigente al perder; motivo histórico visible aunque luego quede inactivo |
| `commissions` | deal/broker/currency, monto/base/repartos, estado y fechas; UNIQUE deal (`schema.ts:887`, `:927`) | Efecto del cierre, no gestión de liquidación M10 dentro de M03; lectura de comisión ajena restringida |
| `contacts`, `users`, `lead_sources` | IDs, nombres y datos de contacto solo según necesidad y alcance (`page.tsx:59`) | Identidad/responsable/canal; ningún join autoriza por sí mismo exposición |
| `projects`, `units` | Proyecto: rangos públicos, precio interno, Confotur, broker/baja (`schema.ts:430`); unidad: proyecto/código/estado y precios (`:475`) | Proyecto/rango primero; Confotur desde atributo real; precio real fuera de SELECT no autorizado; enlace al detalle de disponibilidad de M04 |
| `activities` | deal/contact/lead, type/title/description, assignee, startsAt/status/deletedAt (`schema.ts:779`) | Próxima acción vigente y seguimiento; no duplicar módulo de agenda |
| `goals`, `broker_profiles` | Metas y acumulado/nivel del broker (`src/infrastructure/db/repos/pipeline.ts:170`, `:231`) | Efectos transaccionales heredados del cierre; tasas/ascenso no se legitiman por estar codificados |
| `files`, `audit_log` | Enlace polimórfico, nombre/MIME/visibilidad/baja (`schema.ts:1034`); auditoría del juego transaccional (`src/application/pipeline/puertos.ts:219`) | Documentación enlazada autorizada e historial de mutaciones, sin duplicar expedientes del cliente |
| `outbox`, `outbox_dead`, `external_refs` | Sobre mínimo, intentos/estados, referencias; índices/UNIQUE/CHECK y `.enableRLS()` (`schema.ts:1131`, `:1157`, `:1166`) | Espejo de eventos y diagnóstico operativo G10 |

RLS: las tablas originales lo activan en `drizzle/0001_enable_rls_public_tables.sql`; las de integración lo declaran en schema. El inventario reporta RLS=true/FORCE=false y políticas/privilegios efectivos no acreditados (`crm-as-is.md:215`). No equivale a una prueba de aislamiento por rol. Toda tabla nueva necesita `.enableRLS()` y migración verificada; seguir permisos en aplicación y probar acceso directo según conexión de QA. No se crea schema en esta entrega.

FK/UNIQUE no equivalen a CHECK de límites de negocio: en las declaraciones leídas de `deals`/catálogos no se observaron CHECK de monto/probabilidad/comisión. D11 debe revisar migraciones y catálogo efectivo y fijar restricciones junto con validación de aplicación. Dinero `bigint` en centavos, no floats; JSON/Node requiere enteros seguros. `currency` evita sumar monedas distintas; índices y métricas no deben ocultar ese límite.

### Consultas nuevas y SQL a migrar

La API de lectura vive en **`src/application/pipeline/consultas.ts`**, conservando el nombre técnico de módulo de `src/application/README.md:31`. Allí se validan/normalizan filtros, alcance, proyección, reglas y composición mediante interfaces de `puertos.ts`; **el SQL Drizzle se traslada a `src/infrastructure/db/repos/pipeline.ts` o su adaptador de lectura**, no dentro de `application/` (`README.md:56`). Página solo actor/permiso/searchParams → contenedor → consulta → render.

| Consulta objetivo (propuesta de contrato, no función existente) | SQL origen / datos y comportamiento |
|---|---|
| `consultarTableroNegocios(actor, filtros)` | Migrar `page.tsx:84` y `:112`; deals visibles con contacto/canal/broker/próxima actividad y proyectos. Filtrar proyectos con EXISTS, no join multiplicador; incluir alternativas no principales al filtrar proyecto. Sin leer asociaciones globales para descartarlas después |
| `consultarListaNegocios(actor, filtros, orden, cursor)` | Añadir filtros por IDs/rangos/resultado/moneda, orden estable con ID como desempate, paginación/límite acordado Q-309. Totales del conjunto filtrado completo, separados de filas de página |
| `consultarCatalogosNegocios(actor)` | Migrar etapas/motivos `page.tsx:97`; catálogo de etapas activas con nombre/posición/kind/defaultProbability. Motivos activos para formulario y motivos históricos por ID para ficha |
| `consultarFichaNegocio(actor, id)` | Migrar selección `page.tsx:133`, asociaciones `:135`, proyectos disponibles `:161`; consulta directa por ID con mismo alcance, DTO restrictivo; 404 si no visible. No cargar todos los negocios para resolver uno |
| `consultarInteresesNegocio(actor, id)` | Intereses activos/históricos, proyecto/rangos/Confotur; siempre alcance del negocio y datos relacionados. Unidad no obligatoria para exploración; Q-303 para cierre |
| `consultarSeguimientoNegocio(actor, id)` | Historial de etapas + actividades vigentes/históricas según política, actor/fecha, orden cronológico e ID; sin repetir auditoría como si fuera una segunda actividad |
| `consultarDocumentosNegocio(actor, id)` | Enlaces de proyecto y metadatos de files permitidos; comprobar visibilidad del documento, no solo del negocio; Q-312 para vínculo/fuente y acceso |
| `resumirNegocios(actor, filtros)` | Conteos/montos por etapa y divisa, ponderación con dato existente; antigüedad desde stageChangedAt y duraciones desde historial. Reutilizar definiciones con M12, no cálculos duplicados en React |
| `consultarVistasNegocios(actor)` | Persistencia/compartición sin contrato actual; Q-308. No prometer tabla ni procedimiento de Twenty no definido |
| `consultarPropuestasNegocio(actor, dealId, estado)` | Contrato objetivo adicional de §9: acceso por autor/admin y alcance del negocio; propuestas, resolución y auditoría, con proyección restrictiva |
| `consultarEstadoSincronizacionNegocio(actor, id)` | Contrato objetivo adicional de §9: alcance del negocio y estado/fecha local de sincronización saneados, sin datos de proveedor ni recepción remota presumida |

Índices de rendimiento candidatos **a justificar por EXPLAIN con carga documentada**, no órdenes de migración: deals(brokerId, stageId, stageChangedAt, id) parcial activos; historial(dealId, changedAt, id); interés(projectId, dealId) parcial vigente; actividad(dealId, status, startsAt) parcial no borrada. Unicidad de principal activa por negocio y venta de unidad son invariantes, no optimizaciones opcionales. No UNIQUE unitId sobre intereses abiertos: rompería D-09. `commissions_deal_unq` solo evita dos comisiones del mismo negocio, no dos ventas de una unidad.

### Datos objetivo afectados por la Decisión #47 (contrato a construir)

Estos datos son requeridos por REQ-03-13/14/15; **no existen por describirlos aquí**. D11 fija nombres de tablas/columnas y migración en la tarea de construcción. Forma física siguiente = PROPUESTA D03, revisable con garantía equivalente:

| Requisito | Datos/garantía necesarios | Restricción y prueba prevista |
|---|---|---|
| REQ-03-13 | Propuesta: id durable, negocio/entidad objetivo, tipo de comando, payload permitido, autor, submittedAt/expiresAt, revisión esperada, estado; resolución: admin, motivo, fecha y referencia del efecto | CHECK motivo no blanco en resolución; timestamps servidor; FK y RLS; resolución única por proposalId, CAS/bloqueo y revalidación transaccional de vencimiento. Prueba antes/igual/después del séptimo día y dos admins simultáneos |
| REQ-03-14 | `amountCents` conserva significado monto comercial; precio de lista real permanece en inventario, comisión/repartos en M10 | Proyecciones admin/broker/asistente distintas en repositorio, sin duplicar precio real en deals ni timeline expuesto. Centinelas prueban ausencia en SELECT/DTO/RSC/CSV y aceptación de edición de monto propio |
| REQ-03-15 | Unidad concreta identificada por proyecto+código normalizado; principal del negocio vinculada a esa unidad al cierre. Registro durable de venta con FK unitId/dealId | Registro de ventas **unitId NOT NULL + UNIQUE(unitId)**, dealId NOT NULL + UNIQUE(dealId), sin predicado por deletedAt/archivo. No DELETE/cascade que libere la venta. FK restrictiva, RLS y auditoría. Una restricción sobre ventas, no sobre intereses abiertos |
| REQ-03-15 | Unidad seleccionada/creada y ocupación efectiva | Dentro de la transacción: bloquear negocio, releer/bloquear unidad y disponibilidad, insertar registro único de venta, validar principal/efectos, comisión/metas/historial/auditoría/outbox. Una restricción única real es la barrera final aunque fallen locks |
| REQ-03-03 | Interés con baja lógica/actor/fecha/motivo; máximo una principal activa por negocio | UNIQUE parcial por dealId para principal vigente; no FK cascade que borre asociaciones históricas. S-311 exige principal sustituta si retirar dejaría inválida la etapa |

**Identidad y concurrencia de la unidad:** S-303-T, convención técnica D11 de 2026-10-05 que ejecuta la respuesta firmada, conserva la identidad canónica M04 por proyecto+código normalizado y exige UNIQUE sobre esa clave. No generar otra unidad con el mismo código para sortear conflicto. Código no blanco y normalización en una sola fuente, reutilizando M04; coincidencia/ambigüedad obliga a seleccionar la unidad existente o resolver identidad, sin autoinventar referencia. Reversión técnica: D11 puede sustituir registro de ventas o mecanismo de identificación mediante migración revisada, preservando los vínculos de ventas y unicidad física; nunca quitar la garantía firmada ni borrar rastro.

Si se crea al vender, identidad/unidad/principal/venta y efectos del cierre se confirman juntos. Un fallo deja el negocio abierto y no materializa una unidad huérfana desde ese comando; una unidad preexistente permanece intacta. Broker puede aportar identidad mínima del proyecto autorizado, sin precio de lista real ni asignación masiva. Se relee visibilidad de proyecto y pertenencia de unidad. No vender una unidad reservada/ocupada por otra operación sin resolver ese conflicto; reglas de reserva financiera y alquiler permanecen en sus módulos. La exclusividad permanente aquí es de **venta**, sin convertir un alquiler en venta.

**Prueba concurrente obligatoria (CA-08):** en PostgreSQL aislado, dos negocios con montos y demás requisitos válidos comparten unitId; dos conexiones/transacciones sincronizadas intentan cerrar. Exactamente una confirma; la otra responde 409 saneado. Comparar BD: una venta, un negocio ganado, una comisión y un incremento de cada acumulado aplicable, un historial/auditoría/evento del ganador; el perdedor abierto sin efectos. Repetir cierre tras archivar el ganador sigue sin permitir segunda venta. Probar INSERT directo de venta duplicada (UNIQUE rechaza) y creación concurrente del mismo proyecto+código (una identidad física). El revisor muta la restricción/lock de forma temporal y acredita la caída de la prueba específica; ningún doble en memoria acredita estas garantías.

Vistas guardadas quedan en espera bajo S-308, sin tabla nueva despachada ahora. S-311 conserva datos sin purga automática y no fija plazo legal. La duración de retención aceptada continúa **UNKNOWN**: D-10 prohíbe DELETE, no determina ese plazo.

## 6. Integraciones y puertos

### Capacidad real y contradicciones del catálogo

HECHO: `CrmPort` instalado ofrece `reflejarContacto`, `reflejarNegocio`, `registrarActividad`, `salud`, **sin `capacidades()`** (`src/application/compartido/crm.ts:13`). Solo se vio adaptador local y selección local en contenedor (`src/infrastructure/integraciones/crm/local.ts:8`; `src/infrastructure/contenedor/crm.ts:5`). `ReposPipeline` no contiene outbox (`puertos.ts:219`); `cambiarEtapaDeNegocio` y cierre no emiten evento hoy. Twenty vivo, adaptador HTTP, autenticación operativa y scheduler externo: **UNKNOWN / no acreditados**, no se consultó runtime.

El catálogo declara `crearNegocio`/`avanzarNegocio`, pantalla `e1-negocios` y eventos `NEGOCIO_CREADO`/`NEGOCIO_AVANZADO` (`.viltrum/vre-os/spec/integraciones/CAPACIDADES.md:15`; `capacidades.json:62`, `:72`). Son nombres de capacidad propuestos, no el contrato TS instalado ni el evento canónico. No sustituir `NegocioCambioEtapa` por esos strings. Sus degradados «Desactivado» contradicen ARQ `:83`: solo se pausa el espejo externo; la operación local permanece disponible.

La entrega anterior registra consulta de documentación primaria de Twenty del 04-10-2026: [Vistas](https://docs.twenty.com/user-guide/views-pipelines/overview) y [API](https://docs.twenty.com/developers/extend/api). R1 no repite esa consulta. La capacidad general no acredita endpoints, mapeo del workspace ni contrato CRM; `verificado:true` local tampoco demuestra una prueba viva. D19 verifica el esquema real antes de conectar. El mapa OSS de entrada, §4, informa Twenty vivo y una instantánea de 522 operaciones; es evidencia documental de D00, **UNKNOWN su funcionamiento observado por este productor**. No se accedió a servicios ni se aceptaron despliegues históricos del mapa como instrucciones vigentes.

### Matriz por capacidad M03

| Capacidad / pantalla | Sistema y puerto | Evento / procedimiento objetivo | Degradado visible y estado de verificación |
|---|---|---|---|
| Tablero, lista, filtros, agrupación, rangos y resultado | PostgreSQL local por repositorio de lectura propio | Consultas §5; sin dependencia remota | Local permanece operativo; si falla DB, error recuperable, no cifras de ejemplo. Vistas guardadas: Q-308 |
| Crear/actualizar espejo de negocio | Twenty detrás de `CrmPort`, hoy local/no-op | `reflejarNegocio({id,stageId}, contexto)`; catálogo crear/avanzar se mapea dentro del adaptador | «Sincronización pendiente» sin bloquear negocio. Alta sin cambio de etapa no tiene evento de creación instalado: Q-306 |
| Mover/cerrar/perder | Dominio + PostgreSQL; Twenty solo espejo | `NegocioCambioEtapa` → outbox → `CrmPort.reflejarNegocio` | Movimiento local confirmado, espejo pendiente si cae; no rollback por respuesta externa. No implementado aún en M03 |
| Timeline de etapas | PostgreSQL historial por puerto de lectura | Historial local, actor/fecha; no evento remoto nuevo | Disponible aunque Twenty caiga; `registrarActividad` es otra capacidad y no sustituye historial |
| Nota y próxima acción | M06/actividades local; Twenty tareas/notas como ampliación del catálogo (`CAPACIDADES.md:17`, `:19`) | Caso M06; `ActividadRegistrada` para actividad si está conectado; `crearTarea`/`crearNota` no existen en CrmPort actual | Seguimiento local; espejo no sincronizado. Extensión del puerto y payload mínimo pendientes Q-306 |
| Contacto WhatsApp/llamar | Enlaces de dominio (`vista.tsx:373`); M11 evaluará runtime propio por `MensajeriaPort`, conforme al mapa OSS §3/§5 | Sin evento de etapa; envío integrado solo por M11 tras contrato/prueba | Enlace autorizado no significa mensaje enviado. Chatwoot/Evolution quedan diferidos; no integrar directamente desde M03 |
| Visita/seguimiento calendarizado | M06 local; Cal.com/Schedule-X por contrato de Agenda, receta `D05-ux-modulos-B.md:128` | Actividad local y enlace a agenda; reserva externa según I04 | Sincronización de agenda pendiente; próxima acción local disponible. No declarar disponibilidad externa si no se pudo consultar |
| Búsqueda avanzada / facetas | SQL local; Meilisearch candidato de G02 detrás de puerto de búsqueda por definir | Catálogo `buscarTexto`/`buscarConFacetas`, `CAPACIDADES.md:138` | Búsqueda/filtros SQL con mismo alcance; nunca mostrar coincidencias ajenas de un índice sin filtrar. Adaptador M03 UNKNOWN |
| Análisis, ponderación y antigüedad | SQL local + Chart/Recharts sin proveedor; Cube.js/PostHog propuestos por DS-1 `:91` | Puerto analítico/banderas sin contrato; no evento con PII a analítica por defecto | «Análisis degradado» solo para series externas; conteos/totales locales autorizados siguen disponibles. Proveedores ausentes del catálogo leído, Q-306 |
| Automatizaciones de etapa | n8n de DS-1 `:14` descartado según mapa OSS §2/§5; workflows Twenty y GoRules candidatos tras contrato | Reglas obligatorias locales; automatización externa diferida | No activar automatización/licencia por mención en receta. Mantener transiciones locales aun sin proveedor, S-306 |
| Documentación enlazada | Enlaces del cliente + almacenamiento propio autorizado; Papermark propuesto DS-1 `:166` | Puerto documental/metadatos por definir; no iframe/dashboard externo | Lista de enlaces autorizados y «Vista de documentos no disponible» si cae servicio. No transformar caída en URL pública de KYC; Q-312 |
| Exportación y reporte | G08 local, `domain/csv.ts`; react-pdf solo corresponde a otra capacidad del catálogo | Exportación de consulta filtrada con whitelist de campos | CSV local independiente del espejo; no se activan cotizaciones/10/40/50 por existir react-pdf/GoRules en catálogo `:146` |
| Diagnóstico de sincronización | G10, outbox/DLQ; receta `D05-ux-modulos-B.md:339` | Enlace contextual autorizado a integraciones, no control de cola dentro de tarjeta | Mostrar estado saneado y fecha; acciones de reintento/descarte se especifican en G10, no en M03 |

Regla visual: ningún sistema externo se incrusta en iframe ni reemplaza nuestra navegación; la interfaz presenta DTO propios suministrados por puertos. El número de puerto TCP de un despliegue no es un procedimiento de aplicación. DS-1 cita 3001/5678/8000/4000/3005 mientras ARQ prevé Twenty :9320 (`ARQ-VRE-002:127`); configuración real **UNKNOWN**. No se escanean servicios ni se copian puertos a vistas.

**Banderas futuras por pantalla — PROPUESTA, fuera del tramo actual:** Tablero: `negocios`, `automatizacionesEtapa`; Lista: `vistasGuardadas`, `agrupacion`, `accionesMasivas`, `analiticaNegocios`, `exportacionNegocios`; Ficha: `seguimientoNegocios`, `documentosNegocio`, `mensajeriaNegocio`, `agendaNegocio`. No se presentan como banderas instaladas. **SUPUESTO S-306:** ausencia de contrato/capacidad probada significa ampliación externa no disponible; salud no consultada = «Estado de sincronización no verificado». Consultas/escrituras locales no dependen de estas banderas. No crear un `capacidades()` ficticio ni mostrar conectado por defecto. D19 puede sustituir este fallback con contrato tipado por capacidad y pruebas, sin añadir capacidades ajenas a CrmPort.

### Evento canónico, transacción, reintento y orden

Al confirmar una transición, en el mismo juego transaccional: cambio de negocio y efectos de cierre si corresponde + una fila de historial + auditoría + `OutboxCrm.emitir({tipo:"NegocioCambioEtapa", aggregateId:deal.id, payload:{id:deal.id, stageId:deal.stageId}})`. Puerto y unión de evento existen en `src/application/compartido/crm.ts:20`; schema del worker restringe payload a esos dos IDs (`src/infrastructure/integraciones/outbox/worker.ts:9`). No se añaden teléfono, nombre, nota, monto ni KYC al payload. Si insertar outbox falla, la transacción completa revierte; una propuesta del asistente sin aprobar no emite transición.

Sobre real: `eventId`, `eventType`, versión de contrato 1, `aggregateId`, `correlationId`, `idempotencyKey`, timestamps/estado; el adaptador genera UUID y usa la misma identidad como correlación/clave (`src/infrastructure/integraciones/outbox/repositorio.ts:10`). Es idempotencia de entrega, **no** del comando HTTP: dos comandos hoy producirían UUID diferentes. Q-307 debe definir identidad de comando y conflicto ante misma clave con payload distinto. Un cambio a la misma etapa no debe reiniciar antigüedad ni duplicar historial/evento; la respuesta exacta de replay se acuerda allí.

Worker validado por Zod → `CrmPort.reflejarNegocio` (`worker.ts:47`) → referencia externa y sentAt. Política existente: cinco intentos máximos, base 1000 ms, techo 60000 ms, jitter; `RETRYABLE` vuelve a cola, `NON_RETRYABLE`/`HUMAN_REQUIRED` pasan a revisión/DLQ (`outbox/politica.ts:5`, `:14`). Resultado incierto se reconcilia antes de reenviar; no mostrar excepción del proveedor con datos privados. El adaptador local recuerda claves solo en memoria de proceso (`crm/local.ts:9`), no garantiza deduplicación tras reinicio.

La versión 1 actual es del contrato, no una revisión creciente del negocio. Evitar que un evento antiguo sobrescriba etapa nueva requiere orden por agregado/revisión y reconciliación; Q-314. El worker actual mantiene lock transaccional mientras procesa y declara uso solo local (`outbox/repositorio.ts:22`); un adaptador HTTP externo necesita diseño de claim/lease y persistencia segura antes de habilitarlo. No se promete entrega exactamente una vez, ordering completo ni Twenty listo.

## 7. Métricas y reportes que alimenta

Todas las métricas usan el conjunto filtrado, alcance autorizado, intereses sin duplicación y catálogo real. Las globales se reservan al admin. Nulos significan dato ausente, no cero. Divisas separadas y períodos en `America/Santo_Domingo`, siguiendo el cierre (`src/infrastructure/db/repos/pipeline.ts:231`).

| Métrica / destino | Definición objetivo / datos | Evidencia y límite |
|---|---|---|
| Negocios por etapa/resultado · M21/M12/M03 | COUNT de IDs distintos vigentes por stage.kind y filtros | Datos de `deals`/catálogo. Snapshot no se llama tasa de conversión |
| Valor activo · tablero | SUM de amountCents de `kind=open`, por currency, con número de registros sin monto | Hoy vista suma sin separar divisa (`vista.tsx:144`); sustituir por consulta |
| Valor ponderado · tablero/análisis | SUM(amountCents × probability / 100) con aritmética decimal y regla de redondeo común; identificar registros sin probabilidad | No asignar 40%/80% por dibujo. Usar probabilidad guardada; fallback a defaultProbability requiere decisión Q-305 |
| Días en etapa · tarjeta/lista | Diferencia temporal desde stageChangedAt; nulo muestra «Sin fecha de etapa», valor futuro inconsistente se señala | Propuesta: días completos de 24 h con reloj inyectado y locale para fecha; convención de redondeo/calendario Q-305 |
| Duración por etapa · M12 | Diferencias de entradas/salidas del historial por negocio; observaciones abiertas se identifican separadas | Historial incompleto no permite inventar fecha; tratamiento de revisitas/cohorte Q-305 |
| Próxima acción / seguimiento vencido · M06/M21 | Actividad pending, no borrada, vinculada al negocio y con responsable/fecha; vencida comparando reloj | Pointer cancelado al cierre no cuenta; corregir limpieza y pertenencia |
| Cierres, pérdidas y motivos · M12 | Conteos por fecha de transición terminal, razones históricas aunque inactivas; separar venta/alquiler | No usar createdAt como si fuera closedAt. Políticas de archivo administrativo y reapertura Q-311 |
| Conversión real y embudo · M12 | Cohorte definida de negocios y transiciones observadas; denominador explícito | **UNKNOWN** cohorte/ventana/regla revisitas. No división de conteos actuales presentada como seguimiento longitudinal; Q-305 |
| Volumen/metas/nivel/comisión · M08/M09/M10 | Efectos heredados del cierre: metas del período, total ganado anual, comisión una vez | Ya implementados, pero montos/tasas de ascenso no confirmados como actuales de negocio por esta tarea; `EXP:220` los lista pendientes |
| Sincronización · G10 | Pendientes/fallidos/edad de cola por referencia/evento; estado saneado | Operación local confirmada no significa réplica recibida |
| Exportación · G08/M12 | CSV de los mismos filtros y campos autorizados; metadata de período/divisa | Usar neutralización de fórmulas; plantilla/formato definitivo Q-309 |

NFR numéricos verificados del mandato: 4 viewports (320/390/768/1440), 6 estados por pantalla, targets táctiles ≥48×48 px, texto ≥13 px, una mutación aprobada por transición sin duplicados, cero datos restringidos fuera de autorización y cero cifras fijas (`PLAN-E1.md:23`, `:26`, `:27`; `docs/DESIGN.md:110`; `D05-graficas-movil.md:49`). Verificación: E2E/captura DOM, teclado/manual D07, tests de alcance/proyección, pruebas transaccionales y guardas.

Latencia P95, carga de negocios/usuarios concurrentes, disponibilidad mensual, recuperación RTO/RPO, caducidad de datos offline, retención y presupuesto operativo son **UNKNOWN**, no adjetivos aceptados. Q-310/Q-311 exigen para cada NFR unidad + umbral + carga + entorno + procedimiento. Los 184 negocios son dataset de QA documentado, no capacidad máxima prometida. No se inventa un SLA de 2 segundos ni una disponibilidad para cerrar la ficha.

## 8. Criterios de aceptación (verificables)

**Criterios del tramo construible de §9; pruebas futuras, sin certificación de ejecución.** Fuente firmada #47 para CA-08/10/11/12; decisiones anteriores para archivo/vocabulario/reglas y arquitectura #45. S-304…S-315 son SUPUESTOS, no respuestas del cliente ni criterios comerciales bloqueantes. Sus comprobaciones provisionales se registran aparte para el revisor. Las capacidades en espera no condicionan aceptación del tramo actual ni se muestran disponibles. QA en PostgreSQL local aislado; credenciales solo del entorno en runtime, sin archivos ni impresión.

1. **CA-01 · REQ-03-01.** Dado un rol/estado, cuando M03 renderiza menú, metadata, carga/error, ayuda, CTA o exportación autorizada, usa Negocios/Presentación. Ningún texto visible contiene el nombre técnico antiguo ni «clasificación». **Prueba:** inventario de textos + E2E seis estados; excluir rutas/tablas técnicas del copy.
2. **CA-02 · REQ-03-08.** Dado catálogo vigente, cuando se lee tablero, muestra siete etapas reales con nombre, orden y terminalidad del catálogo. Copy de vista no cambia reglas. **Prueba:** consulta BD + unitaria de reglas por destino + captura. Reordenación/desactivación avanzada espera; S-304 conserva catálogo/semántica actual.
3. **CA-03 · REQ-03-02.** Dado contacto con dos negocios en diferentes proyectos y unidad con dos negociaciones abiertas, al consultar/gestionar siguen independientes, sin exclusividad prematura. **Prueba:** relaciones/IDs distintos en BD + E2E; venta exclusiva CA-08.
4. **CA-04 · REQ-03-10.** Cuando página/API lee datos consume aplicación/contenedor; aplicación no importa DB/Drizzle/Next/proveedor. SQL en infraestructura, una fila por negocio. **Prueba:** guardas de arquitectura + consulta real filtrada; no debilitar guardas.
5. **CA-05 · REQ-03-10.** Dados filtros proyecto/broker/etapa/resultado/moneda/monto/fecha, se aplican en servidor tras alcance; intereses N:M no inflan filas/conteos/sumas por divisa. IDs ajenos nunca amplían acceso. **Prueba:** own/all/none, N:M, bordes inclusivos y totales frente a consulta de control. Convención provisional de fecha/límites S-305/S-309, sin exigir aceptación comercial de esos valores.
6. **CA-06 · REQ-03-08/14.** Mover sin actividad propia completada (Contactado), próxima acción propia pendiente con responsable/fecha (Presentación), interés activo (Preselección) o datos requeridos (Negociación) se rechaza sin cambiar negocio/historial/auditoría/outbox. Broker aporta monto comercial propio; falta de configuración de comisión se comunica sin revelar terceros ni exigir precio real oculto. **Prueba:** cada prerrequisito/pertenencia/baja y rollback real.
7. **CA-07 · REQ-03-03.** Sin motivo activo y comentario no blanco no se pierde/archiva. Al confirmar ambos conserva contacto/asociaciones/historial y aparece «No concretado». Error conserva diálogo/entrada. **Prueba:** API/unitarias ausente/inactivo/blanco + BD antes/después + E2E; sustituir prueba de comentario opcional.
8. **CA-08 · REQ-03-02/15, Decisión #47.** Cerrar sin unidad concreta se rechaza. Dados dos negocios válidos que cierran simultáneamente la misma unidad, solo uno confirma venta; el otro recibe 409 sin comisión/metas/cambio/evento. Repetir cierre no duplica efectos y archivar ganador no libera otra venta. **Prueba:** dos conexiones PostgreSQL sincronizadas con aserciones §5; INSERT directo duplicado rechazado por UNIQUE de venta unitId; guarda de lock/restricción. Probar creación concurrente de misma identidad proyecto+código. Un doble en memoria o UNIQUE de comisión por negocio no acredita venta única.
9. **CA-09 · REQ-03-03.** Perder/archivar/retirar interés nunca elimina físicamente negocio/contacto/asociación ni pierde rastro. Principal sustituta/prerrequisitos se validan antes de retirar. **Prueba:** BD antes/después, historial accesible, guarda de adaptador y sustitución de prueba DELETE. Restauración/reapertura/purga legal en espera S-311.
10. **CA-10 · REQ-03-04/13, Decisión #47.** Enviar propuesta de asistente no publica nota/etapa/interés/unidad ni otros efectos. Cualquier admin activo distinto del autor aprueba/rechaza en un solo nivel **con motivo obligatorio**; broker/asistente no resuelven. Al aprobar revalida permisos actuales/alcance/revisión/reglas y aplica una vez. Rechazo/caducidad no mutan dominio. Caduca a los **7 días**, aun sin scheduler; resolución en límite se rechaza. **Prueba:** matriz de comandos/roles, motivo ausente/blanco, reloj antes/igual/después de expiresAt según S-307, revocación/reasignación, dos admins simultáneos y rollback si falla ejecución/outbox. Auditar autor/admin/motivo/fechas/resultado sin exponer payload restringido.
11. **CA-11 · REQ-03-05/14, Decisión #47.** Broker ve/edita monto comercial de sus negocios; ID ajeno devuelve 404. Precio de lista real y comisión de terceros solo admin: no llegan a SELECT no autorizado, DTO, HTML/RSC, PATCH, historial, gráfica, CSV/documentos ni campos ocultos. **Prueba:** centinelas, consultas/proyecciones por rol, respuesta tras edición/aprobación, exportación cuando esté habilitada y red/RSC; payload restringido rechazado sin asignación masiva. Admin recibe campos permitidos, sin confundir monto comercial y precio de lista.
12. **CA-12 · REQ-03-06/15, Decisión #47.** Se explora/asocia proyecto/rango sin alta anticipada de cada unidad. Al cerrar broker elige/crea unidad concreta del proyecto autorizado; no crea duplicado físico ni unidad de proyecto ajeno ni introduce/recibe precio real. Unidad/principal/cierre se confirman juntos; fallo no crea huérfana. **Prueba:** asociación sin unitId, selección, creación mínima, duplicados, pertenencia/permisos/rollback/concurrencia en BD y E2E.
13. **CA-13 · REQ-03-07.** Cliente/no autenticado no consulta/muta M03; enlace de comprador no expone ficha interna ni amplía sesión. **Prueba:** API/E2E sin actor/IDs adivinados, errores saneados.
14. **CA-14 · REQ-03-08.** Seguimiento autorizado muestra etapas/notas/actividades con actor/fecha. Actividad ajena/completada/cancelada/borrada no es próxima acción; cierre limpia pointer. Asistente propone sujeto a CA-10. **Prueba:** M06/M03 unitarias + vínculos/terminales BD + E2E.
15. **CA-15 · REQ-03-09.** Tablero/lista/ficha/diálogos/revisión contemplan carga/vacío/error/sin conexión/éxito/permiso. Parcial/conflicto nunca finge éxito; offline no envía mutación ni anuncia guardado. **Prueba:** E2E fallos inyectados y capturas por superficie/estado.
16. **CA-16 · REQ-03-09.** En 320/390/768/1440 no hay overflow horizontal de página; móvil usa tarjetas/etapas desplegables/hojas. **Prueba:** capturas por rol a cuatro anchuras, scrollWidth <= clientWidth y navegación táctil/dock.
17. **CA-17 · REQ-03-09.** Mover/proponer/revisar/abrir/cerrar ficha funciona con teclado sin arrastre obligatorio, foco visible/devuelto y anuncios. Objetivos ≥48×48 px, texto ≥13 px, tabs/timeline semánticos, contraste AA/movimiento reducido. **Prueba:** teclado, DOM y revisión manual independiente D07.
18. **CA-18 · REQ-03-09.** Sin Confotur incondicional, hitos 10/40/50, porcentajes/datos de adorno. Flags/métricas reales autorizados o vacío identificado. **Prueba:** proyecto con/sin/sin dato Confotur, capturas y guarda de datos fijos.
19. **CA-19 · REQ-03-09.** Pantallas corresponden a recetas SCR-NEG reconciliadas con §9, componentes propios, seis estados/móvil; sin iframe/Pagos vacío/componente sin procedencia. **Prueba:** capturas frente al contrato visual. Adquisición externa espera S-313, sin impedir primitivas locales acreditadas.
20. **CA-20 · REQ-03-11.** Transición efectiva confirma negocio/efectos/historial/auditoría y **un NegocioCambioEtapa** mínimo en una transacción, payload {id, stageId}. Fallo revierte cada efecto, incluida unidad/venta/comisión. Propuesta/rechazo/caducidad no emite transición. **Prueba:** unidad de trabajo con fallo outbox + rollback BD y Zod evento. Misma etapa sin transición no genera historial/evento.
21. **CA-21 · REQ-03-11.** Proveedor caído no impide consultar/mover/perder/cerrar localmente; UI comunica sincronización pendiente/no verificada. Navegador no llama proveedor ni carga su UI. **Prueba:** puerto fallando, API/E2E/red/guardas; distinguir navegador sin red.
22. **CA-22 · REQ-03-11.** Evento persistido conserva identidad/estado y queda pendiente/revisión según worker local, sin fingir recepción remota. **Prueba:** worker/política/consulta outbox local. Orden/dedup remotos/lease/garantía tras reinicio se verificarán en I01/G10 al habilitar tramo externo; S-314 no es aceptación bloqueante actual.
23. **CA-23 · REQ-03-11.** Sin observación válida de salud UI no dice «conectado»; capacidad externa no probada no se habilita ni impide dominio local. **Prueba:** salud ausente/fallida/verificada y captura; capacidades() externo espera S-306.
24. **CA-24 · REQ-03-12 — EN ESPERA, no bloquea tramo actual.** Vistas privadas sin permisos heredados: comprobación con dos usuarios/revocación cuando S-308 pase a contrato revisado. No exigir persistencia/compartición actual.
25. **CA-25 · REQ-03-12 — EN ESPERA, no bloquea tramo actual.** Agrupación/selección/lote con alcance por registro: comprobar lote mixto/replay cuando D02 defina operaciones. S-309 mantiene escrituras masivas inactivas.
26. **CA-26 · REQ-03-12 — EN ESPERA, no bloquea tramo actual.** Cohortes/gráficas avanzadas/CSV: comprobar dataset/moneda/nulos/denominadores y neutralización de fórmulas al activar. Núcleo exige conteos/montos CA-05; S-305/S-309 no son objetivos firmados de conversión/exportación.
27. **CA-27 · REQ-03-06/12 — EN ESPERA, no bloquea tramo actual.** Visor/documentos/KYC/subida requieren autorización/expiración/procedencia propios: comprobar con CI-302 y respuesta Q-312. S-312 no expone KYC/iframe/subida de asistente.
28. **CA-28 · Seguridad.** Zod/campos explícitos; fecha imposible, booleano textual, rango invertido, dinero no entero seguro, campo restringido e ID ajeno rechazados sin 500/filtración. Permisos antes de datos, visibleRows/reaches, RLS; tablas nuevas .enableRLS(), FK/CHECK/UNIQUE reales. **Prueba:** API/dominio/BD y guardas; límites S-309 configurables, sin aceptación comercial ficticia.
29. **CA-29 · Mutación independiente.** Revisor quita temporalmente motivo/caducidad/proyección/garantía de cierre y observa prueba específica fallar; restaura y verifica verde. **Prueba:** reporte cambio/comando/fallo/verde; solo en QA independiente.
30. **CA-30 · Salida del frente implementado.** Otro proveedor verifica código/flujo/capturas; orquestador observa typecheck/lint/npm test/test:db/build en entorno autorizado y spec:check. **Prueba:** salidas/capturas en evidencia/E1/negocios/ a producir. Esta entrega solo ejecuta spec:check, no cierra issue ni acredita L3/L4. Codex no ejecuta build/dev aquí.
31. **CA-31 · EN ESPERA, no bloquea tramo actual.** Línea base/KPI y SLA/retención definitivos requieren valores firmados y medición independiente. S-310/S-311/S-315 fijan tratamiento provisional, no compromisos de latencia/productividad/coste/plazo legal.

## 9. Fuera de alcance y preguntas abiertas

### Tramo construible ahora

**Lista cerrada del contrato R1 autorizado en TAREA.md/#47; D02/D00 revisan y despachan tareas pequeñas, sin aprobación propia de D01.** READY, si se cumplen condiciones de §10, se aplica exclusivamente a esta lista. Dependencias son contratos a integrar dentro de tareas acotadas; no se afirma que M01/M04/M06/G04/G05/G10/I01 estén listas/implementadas.

| Superficie | Funciones construibles | Consultas/datos | Aceptación |
|---|---|---|---|
| SCR-NEG-TABLERO y SCR-NEG-LISTA | Datos reales, catálogo vigente, búsqueda/filtros operativos, paginación lista, conteos/montos por divisa/alcance, abrir ficha | consultarTableroNegocios, consultarListaNegocios, consultarCatalogosNegocios, resumirNegocios; SQL en repositorio | CA-01…05/11/15…19 |
| Movimiento y diálogo No concretado | Mover etapa con prerrequisitos; perder con motivo activo + comentario y archivar lógicamente; contacto recontactable, ninguna eliminación | cambiarEtapaDeNegocio + historial/auditoría, motivos actuales | CA-06/07/09/20/28 |
| Diálogo de cierre | Elegir/crear unidad concreta autorizada, monto comercial, confirmar; venta única en BD, efectos transaccionales sin duplicados | Cierre, M04 mínimo, registro durable de venta UNIQUE unitId/dealId, comisión/metas heredadas aplicables | CA-08/11/12/14/20 |
| SCR-NEG-FICHA: Resumen/Seguimiento/Propiedades | Lectura/edición propia permitida, monto comercial por rol, nota/próxima acción vía M06, intereses/principal/baja lógica, timeline local con actor/fecha | consultarFichaNegocio, consultarInteresesNegocio, consultarSeguimientoNegocio y proyección | CA-09…14/28 |
| Revisión de propuestas en ficha | Asistente propone sin efectos; cualquier admin aprueba/rechaza con motivo, un nivel, sin autoaprobación, caducidad de 7 días, resolución concurrente segura | consultarPropuestasNegocio(actor, dealId, estado), contrato objetivo adicional con acceso por autor/admin y negocio; propuesta/resolución/auditoría | CA-10/11/15…17/20/28 |
| Espejo pendiente/estado saneado | NegocioCambioEtapa en outbox por transición efectiva; estado local, sin integración remota presumida; continuidad ante caída externa | OutboxCrm.emitir transaccional; consultarEstadoSincronizacionNegocio(actor, id), contrato objetivo de estado/fecha sin datos de proveedor | CA-20…23 |

Las dos consultas adicionales son contratos objetivo, no símbolos instalados. Propuestas del asistente se limitan a campos/operaciones no financieros bajo S-309; al aprobar cierre, admin completa/confirma configuración restringida sin devolverla al autor. Seleccionar/crear unidad en propuesta no materializa inventario hasta aprobar. Alta de negocio entra por conversión M01 vigente; no se despacha alta independiente. Primitivas UI existentes mientras se verifica S-313. Notas/actividades conservan permisos de M06, sin importación ni comunicación externa nueva por esta ficha.

### Tramo en espera

| Capacidad | Dependencia futura / dueño | Tratamiento actual |
|---|---|---|
| Edición/reordenación/desactivación avanzada de etapas | Q-304 + CI-301, D03/D01; catálogo/reglas desacoplados | Catálogo actual leído; sin modificar reglas/identidad por posición desde M03 |
| Cohortes/conversión/series/ponderación avanzada/KPI comparativos | Q-305/Q-315, D02/D01; definición atribuible e historial suficiente | Conteos/sumas operativas, sin mejoras ni tasas inventadas |
| Vistas persistentes/compartidas, agrupación avanzada/lotes | Q-308/Q-309, D03/D02; operaciones/permisos revisados | Sin persistencia/compartición/lote; no despachar tabla de vistas |
| Alta independiente/importación/exportación ampliada | Q-309, D02/G08; campos/monedas/alcance | Conversión M01; nueva exportación M03 no habilitada |
| Documentos/KYC/visor/subida/restauración de versiones | Q-312/CI-302, D12; acceso propio/procedencia/caducidad | Sin KYC/iframe/subida. Conservar enlace operativo de proyecto ya autorizado, sin acceso heredado al expediente |
| Restauración/reapertura/purga/seguimiento automático tras pérdida | Q-311, D11 + cliente; retención y efectos | Archivo lógico terminal, sin borrado/reapertura automáticos |
| SLA/capacidad/recuperación/coste definitivos y KPI productividad | Q-310/Q-315, D15/D01 + Wilber | Diagnóstico local, sin SLA/objetivo comercial firmado |
| HTTP Twenty, capacidades() externo, workflows, mensajería/reservas/búsqueda externa/dossiers | Q-306/Q-314, D19/I01/G10 y contratos por capacidad | Evento durable/estado local, sin llamadas nuevas al proveedor. PostgreSQL autoridad, Twenty espejo; n8n descartado; candidatos/diferidos del mapa no se instalan |
| IDs/licencias/adquisición externa UI | Q-313, D03 con D05/D07 | Primitivas locales; no copiar sin procedencia |

Fuera de M03: **plan de pagos 10/40/50 y cotizaciones**, simulador, facturas/PDF de cotización, reservas financieras, liquidación/aprobación/pago de comisiones M10, rentas contractuales/ledger, firma digital, cliente dentro del CRM, copia de carpetas completas y migración de autoridad a Twenty. Se preservan efectos existentes aplicables del cierre; no se aprueban tasas nuevas ni se convierte alquiler en venta. Capacidades en espera no autorizan construcción/despliegue.

### Correcciones de DS-1 preservadas

| Contradicción | Disposición vigente |
|---|---|
| Campos/tablas ilustrativos negs, estados/valores DOP | Boceto, no SQL/catálogo; usar §5/divisa real, sin adorno |
| Pagos/simulador | Excluidos; sin tab Pagos vacío/hitos de muestra |
| Iframe/dashboards proveedor | UI propia por DTO/puerto, nunca incrustar proveedor |
| «Conectado por defecto» | Salud observada; ausente = no verificado, S-306 |
| Escrituras offline/confeti | Memoria de vista/lectura con aviso, sin cola de escritura/confeti, S-310 |
| Asistente publica/sube sin revisión | #47 exige propuesta/admin; documentos esperan S-312 |
| Desactivar Negocios por caída Twenty | Solo espejo pendiente; local operativo (#45) |
| n8n/Cube/PostHog/Meilisearch/Chatwoot/Evolution de recetas | Mapa OSS limita adopción: n8n descartado, analítica/búsqueda locales, otros diferidos/candidatos; licencia vigente no acreditada aquí |
| Unidad obligatoria frente a rangos | #47: inventario fino al vender, elegir/crear unidad entonces; construir UNIQUE/prueba concurrente BD |
| Reglas por posición y catálogo reordenable | S-304: semántica estable; edición avanzada en espera |
| Nada se elimina frente a DELETE/cascade | Baja lógica/vínculos históricos; audit previo no sustituye conservación |
| Tarjeta/PATCH financiero completo | Monto propio broker permitido; precio real/comisión terceros restringidos en consulta/DTO, no solo JSX |

### Preguntas respondidas con fuente firmada

Registro local: sin editar questions.md/client-inputs.md/índice/roadmap. Reservas de IDs heredadas se concilian por D00/D22; no se simula actualización global.

- [x] Q-301 ¿Quién aprueba, niveles, rechazo y vencimiento del cambio de asistente? · a:cliente · bloquea:ninguna · dep:D02 · prioridad:P0
  - R: Wilber De La Rosa, 2026-10-05, **Decisión #47**, docs/contexto/decisiones.md:311: cualquier administrador aprueba/rechaza con motivo, un nivel, sin autoaprobación del asistente, caduca a 7 días. Consecuencia REQ-03-13, §4/§5/CA-10. Lectura/alcance sin ampliar y convención temporal son SUPUESTOS S-309/S-307, no respuestas firmadas adicionales.
- [x] Q-302 ¿Monto comercial, precio real y comisión de terceros por rol? · a:cliente · bloquea:ninguna · dep:D12 · prioridad:P0
  - R: Wilber, 2026-10-05, **Decisión #47**: broker ve/edita monto comercial propio; precio de lista real de unidad/comisión terceros solo admin. REQ-03-14/proyección de consulta/CA-11. Comisión propia/tasas/lectura financiera del asistente no se amplían por esa respuesta; mínimo privilegio S-309.
- [x] Q-303 ¿Identidad exclusiva al cerrar sin inventario unitario anticipado? · a:cliente · bloquea:ninguna · dep:D11 · prioridad:P0
  - R: Wilber, 2026-10-05, **Decisión #47**: unidad concreta obligatoria, broker elige/crea, no se vende dos veces, inventario fino al vender. REQ-03-15/§5/CA-08/12. S-303-T es forma técnica provisional de identidad, no respuesta adicional del cliente.

<!-- R1:supuestos -->

## 10. Anexos de entrega

Paquete R1: requisitos firmados §1, contratos/roles §4, datos/prueba concurrente §5, criterios §8 y tramos/Q/SUPUESTOS §9. No se actualizan índice/roadmap ni registros globales por el límite autorizado.

## Verificación

Comando: `npm run spec:check` (ejecutado con `npm.cmd` en PowerShell). Código de salida: 0.

```text

> quisqueya-home-crm@0.1.0 spec:check
> node scripts/spec/check.mjs

Spec Pack: 6 fichas; listas READY o superior: 0%
Estados: DRAFT 4 · REVIEW 2 · READY 0 · BUILT 0 · VERIFIED 0
Tipos: Módulo 3 · Global 0 · Integración 3
Bloqueos: 0
Aviso: .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: catálogo histórico omitido; investigación no probatoria, no acredita APIs verificadas
- .viltrum/vre-os/tareas/T-DS-1-negocios-leads.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-DS-2-propiedades-brokers.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-DS-3-integraciones-shell.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-0-renombrar-negocios.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-1a-ficha-negocios.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-1a-r1-ficha-negocios.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-1a-rev-negocios.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-1b1-consultas-negocios.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-2a-ficha-leads.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-2a-r1-ficha-leads.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-3a-ficha-propiedades.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-4a-ficha-brokers.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-5a-ficha-integraciones.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-I0-capacidades.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-P0-cms-reutilizable.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-P0-crm-inventario.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-P1-spec-check.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-QA-test-db.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-TW-D21-twenty-inventario.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D05-graficas-movil.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D09a-higiene-visual.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D11-datos-seed.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D11-rework-catalogos.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D21-cobertura-modulos.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D21-oss-intake.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D21b-rework.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W2-D10-reportes-reales.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W2-D19-base-integraciones.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W3-D05-ux-visual-A.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W3-D05-ux-visual-B.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W3-D09-inicio-reportes.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W4b-D10-rentas.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W4b-D21-rentas-porte.md: legado (sin Ficha:)
Sin bloqueos.
```

## Handoff

Para Claude/orquestador y D02, revisión independiente con D03/D11/D12/D19 y D14 de otro proveedor. Productor Codex D01; único archivo M03-negocios.md. Revisar §8/§9, atribución a #47 y venta única en BD. Estado REVIEW durante edición; ninguna aprobación propia, gate, C1 ni validación de producto. Orquestador concilia preguntas/insumos, sincroniza índice/roadmap y despacha solo el tramo explícito tras revisión. Sin código, git, BD, servicios ni build/dev.

## Promoción a READY (2026-10-13)

Orquestador D00 (Claude). Revisión independiente D02 por otro proveedor (Antigravity, `gemini-3.8-flash-high`): `.viltrum/reviews/D02-revision-M03-negocios-2026-10-13.md`, veredicto «APROBADO CON CAMBIOS», sin P0/P1. HAL-M03-01/02/03 aplicados por D01 (Codex, sesión HAPI) y comprobados por el orquestador con grep; `npm run spec:check` en verde. READY aplica solo al tramo construible de §9. Las revisiones D03/D11/D12 se exigen sobre el código en cada tarea de construcción; no hay gate, C1 ni aceptación del cliente por esta promoción.

**Supuesto adicional S-303-N (2026-10-13, orquestador D00 con D11, reversible):** mientras no exista la ficha M04, la identidad canónica de la unidad vendida es proyecto + código normalizado (NFKC, sin diacríticos, mayúsculas, separadores unificados a `-`), con `UNIQUE(project_id, unit_code_normalized)` en el registro de ventas; no cambia el índice ni el alta de unidades de M04. Detalle en `tareas/T-E1-1b2-cierre-venta-unica.md`. Pendiente de confirmación de Wilber/D03.

**Supuesto adicional S-303-H (2026-10-13, orquestador D00 con D11, reversible):** la venta única por unidad rige desde la migración. Los 15 negocios ganados sembrados sin unidad concreta (IDs 1000000–1000014) se conservan como «venta histórica sin unidad», visibles por consulta y sin unidad inventada; su conciliación espera un mapa validado negocio→unidad del responsable del dato. Detalle en `tareas/T-E1-1b2-cierre-venta-unica.md`.

**Corrección de S-303-H (2026-10-13, orquestador D00):** al aplicar las migraciones con el migrador oficial sobre la base de desarrollo real, los 15 negocios ganados 1000000–1000014 resultaron tener unidad principal concreta y quedaron con su venta (15 ventas, 0 legados). Los «15 legados» del ensayo de Codex eran un artefacto de la copia del arnés de pruebas. S-303-H queda solo como precaución para bases con ganados sin unidad.
