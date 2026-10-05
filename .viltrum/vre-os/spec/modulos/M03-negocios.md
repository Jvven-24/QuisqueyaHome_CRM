---
id: M03
nombre: Negocios
estado: REVIEW
riesgo: R3
owner: D10
revisores: [D02, D03, D12, D14]
fuente_de_verdad: PostgreSQL local
depende_de: [M01, M02, M04, M06, M10, G04, G05, G07, G08, G10, I01]
actualizado: 2026-10-04
---

# M03 · Negocios

Entrega T-E1-1a, productor Codex como D01; contratos y límites descritos bajo el ámbito D03 que asigna la tarea. **Nivel L1: especificada para revisión; no L2 ni implementación aprobada.** Clasificación: cambio de módulo CRM/ERP existente con interfaz, API, datos personales, cierre financiero e integraciones; R3 por datos y acciones, conforme a `.viltrum/os/core/routing.md:36`. No se aprueba G0/G1/G2 ni C1.

Mandato: especificar la capacidad completa de Negocios con fuentes verificables, resolver lo que permiten las entradas y aislar lo que requiere decisión. Solo se escribe este archivo. Se conserva la arquitectura aprobada y la autoridad local del negocio; no se cambia código, datos ni configuración. Los identificadores técnicos `pipeline` se conservan en las referencias y rutas; ningún texto de producto los empleará. El destino `M03-negocios.md` sigue la instrucción directa de Wilber, que prevalece sobre el nombre antiguo del entregable en `TAREA.md:34`.

**Convención de evidencia:** HECHO = código/documento leído; DECISIÓN = declaración atribuida; PROPUESTA = contrato objetivo sometido a revisión; UNKNOWN = no acreditado. Un comportamiento implementado no demuestra aceptación del cliente. Las pruebas de §8 son obligaciones futuras y no resultados de esta sesión. Las dependencias YAML son vínculos funcionales previstos; su existencia o estado READY no se da por comprobado.

## 1. Propósito y usuarios

### Problema, proceso y medida de éxito

El equipo comercial necesita conservar el seguimiento de cada negociación sin encerrar a un contacto en un solo proyecto, perder oportunidades que vuelven meses después ni confundir una venta cerrada con una gestión que no se concretó. El cliente explica esos casos en el expediente del 25-08-2026, líneas 201–212. La frecuencia observada y una línea base de tiempo de trabajo son **UNKNOWN**; no se convierten los datos sembrados en métricas de adopción.

Proceso objetivo: contacto existente → negocio independiente con responsable y proyecto(s) de interés → actividad de contacto → presentación con próxima acción → preselección → negociación → venta cerrada o negocio no concretado archivado. Las etapas y sus nombres proceden del catálogo; saltos y retrocesos abiertos no se suponen aprobados por esta secuencia narrativa. El código hoy permite llegar a una etapa si cumple su requisito de destino (`src/domain/transicion-etapa.ts:116`). Un contacto y una propiedad pueden participar en varias negociaciones abiertas; la exclusividad se exige al cierre (D-03/D-09).

Resultados verificables: cero bajas físicas del negocio/contacto y de sus asociaciones; cero cambios efectivos del asistente antes de aprobación; cero filtraciones de campos restringidos; historial atribuible para cada mutación; una sola venta/comisión por cierre; lectura operativa local durante caída externa. El objetivo de productividad, su valor inicial, umbral y ventana de medición quedan en Q-315. No se promete fecha, coste ni mejora porcentual sin fuente.

| Actor | Trabajo principal | Alcance objetivo y límites |
|---|---|---|
| Administrador | Supervisar todos los negocios, distribuir trabajo, revisar propuestas del asistente, cerrar y consultar resultados | `deals:view:all` / `deals:edit:all` otorgados por el catálogo; métricas globales y precio real restringidos según D-07. La aprobación tiene contrato pendiente Q-301 |
| Broker | Priorizar su cartera, registrar seguimiento, presentar proyectos y conducir la negociación | `deals:view:own` / `deals:edit:own`; se filtra por `brokerId`. El acceso a un negocio no concede acceso a negocios del mismo contacto de otro broker. Nunca se presupone acceso a precio real, resultados globales o comisiones ajenas |
| Asistente | Preparar cambios y seguimiento para aprobación, consultar la carga operativa autorizada | Solo lectura según permisos efectivos y propuestas sin efectos de dominio. Cada cambio necesita aprobación previa, incluso notas, asociaciones y acciones masivas. El ámbito de lectura y quién aprueba se cierran en Q-301 |
| Cliente final | Recibir la comunicación y enlaces autorizados por los módulos correspondientes | No entra al CRM ni obtiene acceso a la ficha interna, según D-08. No es un rol de esta pantalla |

### Fuentes y trazabilidad del requisito

`EXP` designa `C:/Users/wilbe/Documents/QuisqueyaHome PortalWeb/.viltrum/inputs/whatsapp-qa-seguridad/texto/Expediente_Sprint1_CRM_Quisqueya_Home.md`, leído directamente. Es una fuente documental atribuida a la sesión del 25-08-2026; no se consultó la grabación ni el Trello original.

| Requisito | Clasificación y fuente | Consecuencia / aceptación |
|---|---|---|
| REQ-03-01 Vocabulario Negocios / Presentación | DECISIÓN D-04, `EXP:1444`; Wilber, `docs/contexto/decisiones.md:301` | Todos los textos visibles, exportaciones y estados; CA-01 |
| REQ-03-02 Múltiples negocios por contacto y negociaciones por propiedad | DECISIÓN D-03/D-09, `EXP:1440`, `EXP:1461` | Independencia de cada trato; exclusividad solo al cierre; CA-03, CA-08 |
| REQ-03-03 Archivo lógico, motivo y comentario | DECISIÓN D-05/D-10, `EXP:1447`, `EXP:1464`; mandato de comentario en `.viltrum/dispatch/20261004T235540Z-D01-codex/TAREA.md:22` | Contacto recontactable, sin DELETE físico. El expediente admite comentario; la tarea exige motivo y comentario, por lo que esta ficha exige ambos; CA-07, CA-09 |
| REQ-03-04 Aprobar cada cambio del asistente | DECISIÓN D-06, `EXP:1450` | Propuesta separada del efecto y nueva autorización al aprobar; CA-10 |
| REQ-03-05 Precio real / métricas globales / comisión ajena restringidos | DECISIÓN D-07, `EXP:1453`; instrucción de tarea, `TAREA.md:23` | Restricción en SELECT, DTO, respuesta de mutación y exportación; CA-11 |
| REQ-03-06 Inventario por rangos y documentación enlazada | DECISIÓN D-01/D-02, `EXP:1431`, `EXP:1436` | Elegir proyecto y rango, sin alta obligatoria unidad por unidad; cierre pendiente Q-303; CA-12 |
| REQ-03-07 Cliente fuera del CRM | DECISIÓN D-08, `EXP:1457` | Ningún enlace interno compartido ni autenticación de comprador; CA-13 |
| REQ-03-08 Etapas editables y seguimiento transversal | DECISIÓN atribuida al Acta de Reunión 2 en `TAREA.md:26`; texto del acta **UNKNOWN** en esta sesión | Catálogo, nota y próxima acción en ficha. Semántica de reordenación Q-304; CI-301; CA-02, CA-14 |
| REQ-03-09 Rediseño completo y simple | DECISIÓN #46, Wilber 04-10-2026, `docs/contexto/decisiones.md:306` | Pantallas DS-1, divulgación progresiva, sin relleno ni cifras falsas; CA-15 a CA-19 |
| REQ-03-10 SQL fuera de página y datos reales | Mandato E1, `.viltrum/vre-os/PLAN-E1.md:23` | Consulta de aplicación mediante puerto, no Drizzle en aplicación; CA-04 |
| REQ-03-11 Integración local y outbox | ARQ aprobada, `.viltrum/vre-os/ARQ-VRE-002-integraciones.md:78`; `TAREA.md:44` | `NegocioCambioEtapa` transaccional, proveedor sustituible; CA-20 a CA-23 |
| REQ-03-12 Capacidades completas adicionales | PROPUESTA D05, `.viltrum/vre-os/design/DS-1-negocios-leads.md:87`, `:162` | Vistas guardadas, agrupación, selección múltiple, análisis, timeline y documentos; contratos pendientes en §9; CA-24 a CA-27 |

Línea base CRM incorporada: auditoría por registro, permisos granulares, búsqueda, baja lógica y recuperación controlada, historial y reportes exportables (`.viltrum/os/departments/D01-discovery/reference/expected-capabilities.md:39`). Importación/exportación masiva se coordina con G08; no se presupone un importador de negocios disponible. La selección de campos/formato y validación masiva requieren Q-309. Esta ficha amplía capacidad, pero D02 fija prioridad y oleadas; los P0/P1 del diseño no se convierten aquí en prioridades comerciales definitivas.

## 2. Estado actual (AS-IS, del inventario P0)

### Lo verificado por lectura

| Superficie | HECHO y evidencia | Brecha frente al objetivo |
|---|---|---|
| Página `/pipeline` | Actor y `deals:view` antes de lectura; `visibleRows` de broker/baja; negocios y catálogos reales (`src/app/(crm)/pipeline/page.tsx:49`, `:57`, `:84`) | SQL y Drizzle siguen en página. No hay `application/pipeline/consultas.ts` en el inventario de archivos leído |
| Relaciones | Propiedad principal en consulta separada; inspector seleccionado dentro de filas visibles; proyectos limitados por `projects:view` (`page.tsx:112`, `:133`, `:161`) | Consulta de principales lee todas las asociaciones, aunque solo se devuelven las de filas visibles. Rehacer la consulta con alcance desde el inicio y comprobar alcance de los datos relacionados |
| Tablero/lista | Tabs reales, filtros de broker/proyecto por nombre en cliente (`vista.tsx:108`, `:137`, `:192`); HTML drag-and-drop y PATCH (`vista.tsx:148`, `:359`) | Sin filtros de rango en servidor, paginación de lista, vistas guardadas, agrupación dinámica o selección múltiple. Tarjeta arrastrable es `div` sin alternativa de teclado propia (`vista.tsx:380`); selector del inspector sí existe (`inspector.tsx:212`) |
| Ficha | Edición de monto/probabilidad/comisión/fecha, asociación de proyecto/unidad, principal y retirada; notas solo lectura; historial reutilizado (`inspector.tsx:118`, `:159`, `:206`, `:240`) | Sin tabs 360, consulta explícita de historial de etapas/documentos ni flujo de propuesta/aprobación |
| Cambio de etapa | Unidad de trabajo, alcance `reaches`, validación de destino, historial y auditoría (`src/application/pipeline/casos-de-uso.ts:43`) | No bloquea el cambio simple; no valida que motivo esté activo; comentario opcional; no emite outbox. No hay idempotencia de comando ni versión esperada |
| Cierre | Bloquea negocio y revisa `kind`; ocho pasos con unidad vendida/reservada, metas, perfil, comisión, cancelación futura y auditoría (`src/application/pipeline/cierre.ts:64`, `:92`) | Bloquea el negocio, no la unidad compartida entre distintos negocios; no se comprueba disponibilidad en `repos/pipeline.ts:151`. No limpia `nextActivityId` tras cancelar. Unidad obligatoria puede contradecir operación por rangos |
| Baja de asociación | `quitarPropiedad` llama a DELETE real (`casos-de-uso.ts:338`; `src/infrastructure/db/repos/pipeline.ts:373`) | Contradice D-10; requiere baja lógica del interés y lectura histórica, no pérdida del vínculo |
| Contrato de salida | Página incluye `amountCents` y `commissionBasisPoints` (`page.tsx:71`); PATCH devuelve negocio completo (`src/app/api/pipeline/[id]/route.ts:56`, `etapa/route.ts:45`) | No hay proyección restrictiva en estas superficies. La interpretación de monto comercial vs precio real está pendiente Q-302; la tarjeta muestra comisión calculada sin decisión por rol (`vista.tsx:422`) |
| Estados | Carga `loading.tsx:8`, vacío `vista.tsx:255`, error `error.tsx:22`, permiso en página `page.tsx:50`; formularios conservan entrada tras fallo de red (`inspector.tsx:300`, `:423`) | El modo offline del tablero/analítica no está implementado ni verificado. Los movimientos usan `alert` (`vista.tsx:158`); el diálogo de pérdida se cierra después del intento incluso si falló (`vista.tsx:506`) |
| Datos de adorno | Etiqueta Confotur incondicional (`vista.tsx:393`), hito 10·40·50 fijo (`vista.tsx:429`), suma activa formateada como USD sin separar monedas (`vista.tsx:144`, `:187`) | No es capacidad verificada. Confotur debe venir del proyecto; el hito se retira de M03; no mezclar divisas |
| Nomenclatura | Título, metadata, carga y error aún dicen el nombre antiguo (`page.tsx:38`; `vista.tsx:182`; `loading.tsx:11`; `error.tsx:24`) | REQ-03-01 todavía no satisfecho |

Pruebas presentes, **no ejecutadas en esta sesión**: transición y permisos en `src/application/pipeline/casos-de-uso.test.ts:122`, `:158`, `:188`, `:232`; cierre/rollback/doble cierre en `cierre.test.ts:133`, `:347`, `:396`; guardas del bloqueo, upsert parcial y zona horaria en `cierre.test.ts:452`, `:459`, `:470`. Hay pruebas que conservan los comportamientos antiguos de comentario ausente (`casos-de-uso.test.ts:209`) y DELETE (`:407`); no sirven como aceptación de los requisitos firmados nuevos. La guarda de lecturas solo se activa cuando existe `consultas.ts` (`src/infrastructure/arquitectura.test.ts:120`); no se debilita para migrar.

Datos de carga documental: 648 leads, 184 negocios, 400 unidades y 12 brokers **según** `.viltrum/vre-os/PLAN-E1.md:9`. El inventario reporta 184 negocios, 184 asociaciones, 592 movimientos, 1.803 actividades, 17 comisiones, 15 usuarios y 13 perfiles de broker (`.viltrum/vre-os/spec/inventario/crm-as-is.md:220`, `:221`, `:238`). Son conteos totales de una lectura de otro productor, no conteos por rol ni recuentos hechos por D01; no se accedió a la BD. La diferencia entre 12 brokers sembrados y 13 perfiles totales no prueba un error: denominadores distintos.

GitNexus se consultó para flujos de cambio/cierre mediante `query` sobre `QuisqueyaHome_CRM`; devolvió `cambiarEtapaDeNegocio`, `cerrarNegocioGanado` y la vista. Se contrastaron con los archivos actuales. No se editaron símbolos; no corresponde análisis de impacto de cambios de código ni `detect_changes` previo a commit, porque esta tarea no realiza commit.

## 3. Pantallas

### Contrato común de experiencia

Ruta técnica conservada: `/pipeline`, con `?deal=<id>` para inspector; no se decide renombrar URLs públicas en esta tarea. Las pantallas de producto se llaman **Negocios**. Se toma DS-1 como receta visual prioritaria (`DS-1-negocios-leads.md:9`, `:87`, `:162`) y se registran incompatibilidades en §9; sus consultas de ejemplo sobre `negs` no son SQL ejecutable.

Cabecera, búsqueda, vista guardada, acción contextual y filtros compactos; tabs **Tablero · Lista · Análisis**. Filtro de resultado **Todos · Activos · Venta cerrada · No concretado** basado en `kind`, conservando las siete etapas del catálogo en el tablero. Estos nombres de resultado distinguen el cierre de la venta sin sustituir el nombre editable de la etapa. Para alquileres, el estado ganado debe presentar el tipo de operación; no describir un alquiler como venta. Admin ve contexto global; broker ve su cartera; asistente ve solo lo autorizado. Filtros comunes: proyecto por ID, broker por ID/alcance, resultado, etapa, operación/divisa, monto desde–hasta y fecha desde–hasta. El campo exacto del rango de fecha se resuelve en Q-305.

Diseño `docs/DESIGN.md:71`: una acción primaria por vista, inspector de 400–440 px en escritorio, tokens semánticos, Hanken Grotesk/Atkinson Hyperlegible Next, textos ≥13 px, sin confeti ni elementos financieros de adorno. Se reutilizan `Card` (`src/components/ui/card.tsx:4`), `Tabs` (`tabs.tsx:8`), `ChartContainer` (`chart.tsx`, exportación existente), `ChartCard` (`chart-card.tsx:6`) y `Drawer` (`drawer.tsx:7`). Instalación de primitivas no demuestra que M03 ya las use.

En 320/390: lista vertical de tarjetas/etapas desplegables, una superficie principal de desplazamiento por tab, filtros y acciones en hoja inferior, nunca tabla horizontal. Dock del shell existente, área segura y controles ≥48×48 px (`D05-graficas-movil.md:39`). En 768/1440: tabla semántica o columnas proporcionadas; ningún overflow horizontal de página. El drag no es obligatorio para operar: botón **Cambiar etapa** con selector accesible y confirmación tiene la misma validación. Foco visible, Escape/cierre y retorno a origen; los cambios se anuncian con `aria-live`. Respetar movimiento reducido.

### SCR-NEG-TABLERO · Trabajo por etapa

- **Fuente:** `DS-1-negocios-leads.md:9`, receta `:21`, wireframes `:51`; reemplaza la referencia antigua 7835 de `D05-ux-modulos-A.md:98` por el ID **29221** de DS-1 y `docs/DESIGN.md:144`.
- **Bloques:** cabecera/filtros; siete etapas iniciales Nuevo, Contactado, Presentación, Preselección, Negociación, Cierre y Perdido, leídas de tabla (`db/seed.sql:102`); conteo y suma por divisa/permiso; tarjetas con contacto, proyecto/rango, responsable, monto autorizado USD, antigüedad en etapa y próxima acción con fecha. USD es la divisa de la carga prevista; un registro en otra moneda conserva su divisa, sin conversión inventada.
- **Consultas:** `consultarTableroNegocios`, `consultarCatalogosNegocios`, `resumirNegocios` de §5. Los totales siempre usan exactamente los filtros y el alcance de las tarjetas, evitando doble conteo por N:M.
- **Acciones:** abrir ficha, contactar por enlace autorizado, mover, preparar pérdida/cierre, filtrar. Broker solo suyos; asistente envía propuesta, no PATCH efectivo. Botón de creación de DS-1/atajo Ctrl+N solo se habilita al cerrar el contrato de alta Q-309; hoy los negocios proceden de convertir leads (`vista.tsx:256`).
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
- **Acciones:** editar campos permitidos, registrar nota/acción mediante M06, asociar interés por proyecto, marcar principal, dar de baja lógica un interés, cerrar o marcar no concretado. Asistente únicamente propone; admin revisa según contrato pendiente. Documento KYC y restauración de versiones de DS-1 no se presuponen implementados ni autorizados; Q-311/Q-312.
- **Componentes:** **28340** timeline semántica de lista y **4086** tabs según DS-1 `:169`; Drawer/hoja 25002 como referencia global (`docs/DESIGN.md:146`). DS-B asigna 4086 a calendario (`D05-ux-modulos-B.md:117`): identificación pendiente Q-313; conservar Radix `Tabs` mientras se verifica, sin adquirir un componente equivocado.
- **Móvil:** una columna; contacto/estado y acción contextual primero; cabecera y pie de hoja sticky, cuerpo desplazable y sin ocultar contenido tras dock. El Drawer instalado requiere normalización de radio, handle y objetivos táctiles (`drawer.tsx:55`, `:67`); no se afirma que ya cumpla.

### Diálogos de transición y matriz de seis estados

Pérdida: elegir motivo activo + comentario no vacío, conservar campos tras error, cancelar sin cambios; tras éxito mostrar **Negocio no concretado, archivado** y contacto accesible. Cierre: resumen de operación, propiedad y monto autorizado, advertir efectos, confirmar; no se arrastra a cierre sin confirmación. La identidad del recurso a cerrar por rangos se decide en Q-303. Asistente ve **Enviar para aprobación**. `409` nunca simula éxito; actualizar y volver a decidir.

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
| Cerrar (`kind=won`) | Destino + monto final o existente, referencia de propiedad y confirmación | Ocho efectos actuales preservados donde aplique, exclusividad real del recurso, limpiar próxima acción, rollback completo; un cierre por negocio | 409 falta monto/principal/comisión o propiedad cerrada por otro; `deals:edit:own|all`, campos financieros según G04 | Un evento de etapa al éxito, ninguno si rollback; no duplicar comisión/metas. Reintento con misma identidad exige Q-307 |
| Archivar no concretado (`kind=lost`) | Motivo activo y `lossComment` con trim/no vacío | No toca contacto ni libera/vende inventario por suposición; conserva historial; resultado lost distinguible de baja administrativa | 400 forma, 409 ausencia/motivo inactivo; `deals:edit:own|all` | Evento de etapa; no repetir historial/outbox por doble clic. Política de próximas actividades al perder, Q-311 |
| `editarNegocio` | Monto/probabilidad/comisión/fecha opcional/null; nota según contrato seguimiento | Solo abierto y visible; no asignar stage/broker/cierre por este PATCH; campos autorizados, auditados | 404 ajeno, 409 terminal, 403 campo restringido; `deals:edit:own|all` | Edición sin cambio de etapa no emite evento de etapa. Evento futuro de edición UNKNOWN; versión/clave Q-307 |
| Asociar proyecto/rango de interés | `{projectId, unitId?, isPrimary?}` estricto como compatibilidad actual; rango como propuesta Q-303 | Negocio abierto, proyecto visible, unidad opcional del proyecto si existe; múltiples tratos permitidos; DTO de interés | 404 fuera de alcance/relación inválida, 409 duplicado; `deals:edit:own|all` + `projects:view:own|all` | Auditoría local; evento específico no definido. UNIQUE y clave permiten no duplicar interés; contrato de repetición Q-307 |
| Marcar principal | `dealId`, `propId`, `{isPrimary:true}` | Asociación vigente del negocio; máximo una principal activa; transacción y guarda contra concurrencia | 404 asociación ajena, 409 terminal/conflicto; `deals:edit:own|all` | Sin evento CRM definido; versión/clave Q-307 |
| Retirar interés | IDs + motivo/confirmación según Q-311 | Sustituir DELETE físico por baja lógica y auditoría; preservar asociaciones históricas; principal/prerrequisitos deben seguir consistentes | 404 ajeno, 409 negocio terminal/conflicto; `deals:edit:own|all` | Sin evento definido; repetir baja no produce segunda baja. Schema pendiente D11 |
| Registrar nota/próxima acción | Entrada de M06: `dealId`, texto/tipo, responsable y fecha/estado según capacidad | Mantener reglas y alcance de negocio/actividad; no permitir vincular negocio ajeno; separar próxima acción vigente de actividad completada | 400 forma, 404 vínculos ajenos, 409 estado; `activities:create|edit:own|all` y acceso legítimo al negocio | `ActividadRegistrada` solo si ese caso M06 lo emite transaccionalmente; no se afirma conectado. Asistente propone; Q-301 |
| Preparar/aprobar/rechazar cambio del asistente | Propuesta tipada, entidad/versión, cambios permitidos; decisión con motivo y actor de sesión | Crear propuesta no modifica negocio, unidad, metas, comisión ni outbox de etapa. Al aprobar, releer permisos/versión y ejecutar el mismo comando; autoaprobación prohibida | Permisos/niveles/vencimiento UNKNOWN Q-301; conflicto si cambió el recurso | Solo ejecución aprobada emite evento; una aplicación máxima por propuesta. Nuevo contrato pendiente, no endpoint inventado |
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
| Negociación | Monto, probabilidad, comisión y fecha estimada (`transicion-etapa.ts:179`) | Datos financieros ocultos no se exigen al broker como campos visibles sin resolver Q-302; permitir preparación por admin según decisión |
| Cierre (`won`) | Monto y principal con unidad; comisión necesaria; terminal (`cierre.ts:80`) | Q-303 decide cierre sin inventariar detalle unitario; D-09 exige exclusividad entre negocios distintos |
| Perdido (`lost`) | Motivo; terminal (`transicion-etapa.ts:143`, `:121`) | Objetivo exige comentario y motivo activo; no reabrir terminal sin política Q-311 |

El código engancha requisitos abiertos a posiciones 2/3/4/5 (`transicion-etapa.ts:40`), pero permite reordenar el catálogo (`src/application/etapas/casos-de-uso.ts:23`). Eso puede cambiar qué regla aplica a una etapa. D03 debe resolver Q-304 con identidad semántica estable/configuración aprobada; no se duplica la regla en nombres ni IDs. No se codifica una solución estructural aquí.

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

Índices existentes arriba; candidatos **a justificar por EXPLAIN con la carga acordada**, no órdenes de migración: deals(brokerId, stageId, stageChangedAt, id) parcial activos; historial(dealId, changedAt, id); interés(projectId, dealId) parcial vigente; unicidad parcial de principal activa por deal; actividad(dealId, status, startsAt) parcial no borrada. No UNIQUE unitId sobre todos los intereses: rompería D-09. La exclusividad de cierre requiere lock/CAS del recurso de inventario elegido con D11; `commissions_deal_unq` solo impide dos comisiones de un mismo negocio, no dos negocios sobre una misma propiedad.

Modelo nuevo pendiente: propuestas/aprobaciones, vistas guardadas y baja lógica de intereses. Se documentan los datos necesarios (actor, destino, versión, campos, motivo, timestamps y resultado), pero nombres de tablas/columnas, índices y migraciones se fijan en D11 después de Q-301/Q-308/Q-311. Retención y recuperación no se inventan; D-10 prohíbe DELETE, no determina plazo legal de conservación.

## 6. Integraciones y puertos

### Capacidad real y contradicciones del catálogo

HECHO: `CrmPort` instalado ofrece `reflejarContacto`, `reflejarNegocio`, `registrarActividad`, `salud`, **sin `capacidades()`** (`src/application/compartido/crm.ts:13`). Solo se vio adaptador local y selección local en contenedor (`src/infrastructure/integraciones/crm/local.ts:8`; `src/infrastructure/contenedor/crm.ts:5`). `ReposPipeline` no contiene outbox (`puertos.ts:219`); `cambiarEtapaDeNegocio` y cierre no emiten evento hoy. Twenty vivo, adaptador HTTP, autenticación operativa y scheduler externo: **UNKNOWN / no acreditados**, no se consultó runtime.

El catálogo declara `crearNegocio`/`avanzarNegocio`, pantalla `e1-negocios` y eventos `NEGOCIO_CREADO`/`NEGOCIO_AVANZADO` (`.viltrum/vre-os/spec/integraciones/CAPACIDADES.md:15`; `capacidades.json:62`, `:72`). Son nombres de capacidad propuestos, no el contrato TS instalado ni el evento canónico. No sustituir `NegocioCambioEtapa` por esos strings. Sus degradados «Desactivado» contradicen ARQ `:83`: solo se pausa el espejo externo; la operación local permanece disponible.

Se verificó documentación primaria de Twenty el 04-10-2026: las vistas guardan layout, filtros, orden y campos ([Vistas](https://docs.twenty.com/user-guide/views-pipelines/overview)); su API se genera por esquema de workspace, y no hay referencia estática universal por operación ([API](https://docs.twenty.com/developers/extend/api)). Esto acredita capacidad general, no endpoints específicos, mapeo del workspace ni contrato funcional del CRM. `verificado:true` del JSON local no demuestra pruebas de contrato vivas. Los enlaces iniciales de `developers.twenty.com/api-reference/opportunities/update` no fueron accesibles mediante la herramienta; las fuentes locales cambiaron durante la lectura y se releían ya apuntando a `docs.twenty.com/developers/extend/api#capacidad-N`. Esos fragmentos no acreditan un procedimiento. D19 debe verificar el esquema real antes de conectar.

### Matriz por capacidad M03

| Capacidad / pantalla | Sistema y puerto | Evento / procedimiento objetivo | Degradado visible y estado de verificación |
|---|---|---|---|
| Tablero, lista, filtros, agrupación, rangos y resultado | PostgreSQL local por repositorio de lectura propio | Consultas §5; sin dependencia remota | Local permanece operativo; si falla DB, error recuperable, no cifras de ejemplo. Vistas guardadas: Q-308 |
| Crear/actualizar espejo de negocio | Twenty detrás de `CrmPort`, hoy local/no-op | `reflejarNegocio({id,stageId}, contexto)`; catálogo crear/avanzar se mapea dentro del adaptador | «Sincronización pendiente» sin bloquear negocio. Alta sin cambio de etapa no tiene evento de creación instalado: Q-306 |
| Mover/cerrar/perder | Dominio + PostgreSQL; Twenty solo espejo | `NegocioCambioEtapa` → outbox → `CrmPort.reflejarNegocio` | Movimiento local confirmado, espejo pendiente si cae; no rollback por respuesta externa. No implementado aún en M03 |
| Timeline de etapas | PostgreSQL historial por puerto de lectura | Historial local, actor/fecha; no evento remoto nuevo | Disponible aunque Twenty caiga; `registrarActividad` es otra capacidad y no sustituye historial |
| Nota y próxima acción | M06/actividades local; Twenty tareas/notas como ampliación del catálogo (`CAPACIDADES.md:17`, `:19`) | Caso M06; `ActividadRegistrada` para actividad si está conectado; `crearTarea`/`crearNota` no existen en CrmPort actual | Seguimiento local; espejo no sincronizado. Extensión del puerto y payload mínimo pendientes Q-306 |
| Contacto WhatsApp/llamar | Enlaces actuales de dominio (`vista.tsx:373`); M11 para chat con Chatwoot/Evolution mediante puerto de mensajería | Sin evento de etapa; `enviarMensaje`/`enviarTextoWa` solo a través del contrato M11 | Abrir enlace autorizado cuando el hilo integrado no está disponible; no declarar mensaje enviado por abrir enlace. Catálogo `CAPACIDADES.md:49`, `:65`; integración M03 no acreditada |
| Visita/seguimiento calendarizado | M06 local; Cal.com/Schedule-X por contrato de Agenda, receta `D05-ux-modulos-B.md:128` | Actividad local y enlace a agenda; reserva externa según I04 | Sincronización de agenda pendiente; próxima acción local disponible. No declarar disponibilidad externa si no se pudo consultar |
| Búsqueda avanzada / facetas | SQL local; Meilisearch candidato de G02 detrás de puerto de búsqueda por definir | Catálogo `buscarTexto`/`buscarConFacetas`, `CAPACIDADES.md:138` | Búsqueda/filtros SQL con mismo alcance; nunca mostrar coincidencias ajenas de un índice sin filtrar. Adaptador M03 UNKNOWN |
| Análisis, ponderación y antigüedad | SQL local + Chart/Recharts sin proveedor; Cube.js/PostHog propuestos por DS-1 `:91` | Puerto analítico/banderas sin contrato; no evento con PII a analítica por defecto | «Análisis degradado» solo para series externas; conteos/totales locales autorizados siguen disponibles. Proveedores ausentes del catálogo leído, Q-306 |
| Automatizaciones de etapa | n8n propuesto DS-1 `:14`; no puerto instalado observado | Consumidor externo de eventos detrás de contrato por capacidad a definir | «Reglas automáticas suspendidas», reglas obligatorias de transición local siguen activas; nunca validar cierre delegándolo a n8n. Q-306 |
| Documentación enlazada | Enlaces del cliente + almacenamiento propio autorizado; Papermark propuesto DS-1 `:166` | Puerto documental/metadatos por definir; no iframe/dashboard externo | Lista de enlaces autorizados y «Vista de documentos no disponible» si cae servicio. No transformar caída en URL pública de KYC; Q-312 |
| Exportación y reporte | G08 local, `domain/csv.ts`; react-pdf solo corresponde a otra capacidad del catálogo | Exportación de consulta filtrada con whitelist de campos | CSV local independiente del espejo; no se activan cotizaciones/10/40/50 por existir react-pdf/GoRules en catálogo `:146` |
| Diagnóstico de sincronización | G10, outbox/DLQ; receta `D05-ux-modulos-B.md:339` | Enlace contextual autorizado a integraciones, no control de cola dentro de tarjeta | Mostrar estado saneado y fecha; acciones de reintento/descarte se especifican en G10, no en M03 |

Regla visual: ningún sistema externo se incrusta en iframe ni reemplaza nuestra navegación; la interfaz presenta DTO propios suministrados por puertos. El número de puerto TCP de un despliegue no es un procedimiento de aplicación. DS-1 cita 3001/5678/8000/4000/3005 mientras ARQ prevé Twenty :9320 (`ARQ-VRE-002:127`); configuración real **UNKNOWN**. No se escanean servicios ni se copian puertos a vistas.

**Banderas de `capacidades()` consumidas por pantalla — PROPUESTA bloqueada Q-306:** Tablero: `negocios` (catálogo original), `automatizacionesEtapa`; Lista: `vistasGuardadas`, `agrupacion`, `accionesMasivas`, `analiticaNegocios`, `exportacionNegocios`; Ficha: `seguimientoNegocios`, `documentosNegocio`, `mensajeriaNegocio`, `agendaNegocio`. Solo `negocios` fue declarado como bandera en la versión inicial del catálogo; las otras son nombres de contrato propuestos, no banderas instaladas. El catálogo releído ya no contiene aquella sección `capacidades()`. D03/D19 deben fijar forma/tipos y ubicación del puerto por capacidad, y D05 consumir respuesta saneada del servidor; no añadir todas las capacidades indiscriminadamente a `CrmPort`. Capacidad y salud son distintas: una capacidad soportada puede estar caída. Ausencia de bandera nunca deshabilita la escritura local legítima.

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

**Esta sección describe cómo probar, no certifica resultados.** Ninguna corrida unitaria, `test:db`, mutación o captura del producto se ejecutó para esta entrega documental. Donde el comportamiento depende de una decisión abierta se indica el bloqueo concreto; hasta resolverlo no es READY. Cada evidencia debe contener comando/prueba, resultado y actor independiente. Base de QA local aislada, nunca BD real; credenciales leídas en runtime, sin escribirlas ni imprimirlas.

1. **CA-01 · REQ-03-01.** Dado cualquier rol/estado de M03, al renderizar menú, metadata, carga/error, ayuda, CTA o CSV, ningún texto visible contiene el nombre técnico antiguo ni «clasificación»; se usa Negocios/Presentación. **Prueba:** inventario de textos renderizados + E2E de seis estados y exportación; rutas/tablas técnicas se excluyen de la búsqueda de copy.
2. **CA-02 · REQ-03-08.** Con catálogo canónico, se muestran siete etapas reales en orden; renombrar/reordenar según contrato acordado conserva reglas, terminalidad y datos. **Prueba:** `test:db` lectura del catálogo + unitaria de transición tras edición + captura; **bloquea Q-304** la semántica de reordenación.
3. **CA-03 · REQ-03-02.** Un contacto sostiene dos negocios en distintos proyectos y dos negociaciones abiertas pueden compartir propiedad sin bloquearse ni fusionarse. **Prueba:** `test:db` relaciones/lecturas e IDs distintos; E2E cartera. Cierre exclusivo se prueba aparte CA-08.
4. **CA-04 · REQ-03-10.** Página y API consumen aplicación/contenedor; aplicación no importa DB/Drizzle/Next/proveedor. Consultas devuelven una fila por negocio y datos reales. **Prueba:** `npm test` guardas de arquitectura + `test:db` consulta filtrada. No se modifica una guarda para aceptarlo.
5. **CA-05 · REQ-03-10/12.** Proyecto/broker/rangos/resultado/moneda y orden se aplican en servidor; contactos con varios intereses no inflan lista, conteos, grupos ni exportación; filtro ajeno no amplía alcance. **Prueba:** `test:db` conjuntos esperados con N:M, own/all/none y bordes inclusivos; **bloquea Q-305/Q-309** campos/rangos/límites definitivos.
6. **CA-06 · REQ-03-08.** Al mover a Contactado sin actividad, Presentación sin acción propia vigente, Preselección sin interés activo o Negociación sin cada dato requerido, se rechaza sin actualizar negocio/historial/auditoría/outbox. **Prueba:** unitarias `casos-de-uso.test.ts:142`, `:158` ampliadas para pertenencia/baja y cada campo; `test:db` rollback. Contrato financiero **bloquea Q-302**.
7. **CA-07 · REQ-03-03.** Sin motivo activo o comentario no vacío, no se archiva; al confirmar ambos se conserva contacto, asociaciones e historial y se ve «No concretado». Un fallo conserva diálogo/entrada. **Prueba:** unitarias y API de motivo ausente/inactivo/comentario blanco, `test:db` archivo/contacto, E2E error y éxito; sustituir prueba antigua de comentario opcional.
8. **CA-08 · REQ-03-02.** Dos negocios intentan cerrar la misma propiedad a la vez: solo uno produce venta efectiva; la otra operación recibe conflicto sin comisión/metas/evento. Doble clic del mismo cierre tampoco duplica efectos. **Prueba:** `test:db` dos transacciones concurrentes + guarda de lock/CAS y UNIQUE; **bloquea Q-303/Q-307** recurso/contrato de comando.
9. **CA-09 · REQ-03-03.** Ningún alta/edición/pérdida/retirada de interés realiza DELETE físico de negocio/contacto/relación; la baja lógica conserva rastro y lectura histórica. **Prueba:** `test:db` comparación de filas antes/después + guarda del adaptador + unitaria sustituyendo `casos-de-uso.test.ts:407`; **bloquea Q-311** restauración/principal.
10. **CA-10 · REQ-03-04.** Para asistente, notas, cambio de etapa, propiedad, monto, lote y documento no publican efecto antes de aprobación. Al aprobar por actor autorizado distinto, se revalida versión/permiso y se aplica una vez. Rechazo/expiración no mutan dominio. **Prueba:** unitarias matriz de comandos + API por rol + `test:db` antes/después y concurrencia + captura pendiente; **bloquea Q-301**.
11. **CA-11 · REQ-03-05.** Broker/asistente no reciben precio real, métricas globales ni comisión de tercero en HTML/RSC, DTO, respuestas PATCH, gráficas, campos ocultos, CSV o documentos; conocer el ID no basta. **Prueba:** API/lectura/exportación por permisos con valores centinela en `test:db`, inspección de response/RSC y E2E por rol; **bloquea Q-302** clasificación de monto comercial.
12. **CA-12 · REQ-03-06.** Es posible explorar/asociar proyecto por rango con enlace de disponibilidad, sin inventariar todas las unidades; precio público desde–hasta y detalle real respetan permiso. **Prueba:** `test:db` DTO de proyecto y E2E asociación sin unitId. La prueba de cierre del mismo flujo **bloquea Q-303**.
13. **CA-13 · REQ-03-07.** Cliente/no autenticado no consulta ni muta M03; enlaces de comprador no exponen URL interna autorizada ni amplían sesión. **Prueba:** API/E2E sin actor y IDs adivinados; respuesta saneada sin datos del negocio.
14. **CA-14 · REQ-03-08.** Seguimiento muestra nota, acción/estado, actor y fecha del negocio autorizado; una acción completada/cancelada/ajena no se presenta como próxima. Tras cierre el pointer queda limpio. **Prueba:** unitarias M06/M03 y `test:db` vínculos/terminales + E2E ficha; aprobación del asistente CA-10.
15. **CA-15 · REQ-03-09.** Tablero, lista/análisis, ficha y diálogos muestran cada uno carga, vacío, error, offline, éxito y permiso; parcial/conflicto nunca fingen éxito o total completo. **Prueba:** E2E con fallos inyectados y capturas independientes de cada estado; offline sin transmitir mutaciones.
16. **CA-16 · REQ-03-09.** En 320/390/768/1440 ninguna pantalla produce overflow horizontal de página; móvil transforma tabla/kanban en tarjetas, hojas y etapas accesibles. **Prueba:** captura a las cuatro anchuras por rol + aserción `scrollWidth <= clientWidth` + navegación táctil/dock. No basta captura del diseño.
17. **CA-17 · REQ-03-09.** Cambiar etapa y abrir/cerrar ficha funciona con teclado sin arrastre; foco visible y devuelto; targets móviles ≥48×48 px, texto ≥13 px, tabs/diagramas con semántica y contraste AA. **Prueba:** E2E teclado, medición DOM y revisión manual D07/contraste, incluida opción reduced-motion.
18. **CA-18 · REQ-03-09.** No aparecen Confotur incondicional, hitos 10/40/50, pronósticos, porcentajes o valores de muestra. Flags/métricas provienen de registros permitidos o vacío identificado. **Prueba:** `test:db` proyecto sin/con/desconocido Confotur + captura y guarda de datos fijos.
19. **CA-19 · REQ-03-09/12.** Las tres pantallas corresponden a recetas SCR-NEG y componentes normalizados; IDs/licencias/adquisición están acreditados por D05/D07 y divergencias resueltas. **Prueba:** registro del catálogo/adquisición + comparación de capturas con DS-1; **bloquea Q-313**.
20. **CA-20 · REQ-03-11.** Cada transición confirmada emite exactamente un `NegocioCambioEtapa` mínimo con IDs correctos, historial y auditoría en la misma transacción. Fallar cualquiera revierte todos los efectos, incluido cierre. **Prueba:** unitaria de unidad de trabajo con outbox fallando y `test:db` rollback real + schema Zod del evento; propuesta sin aprobar no emite.
21. **CA-21 · REQ-03-11.** Con proveedor caído, mover/cerrar/perder local sigue funcionando con sincronización pendiente; el navegador no llama al proveedor ni carga su UI. **Prueba:** contrato de puerto que falla + API/E2E/red y guardas de imports; distinguir de offline del navegador.
22. **CA-22 · REQ-03-11.** Reintentar evento preserva identidad; error reintentable, permanente y resultado incierto siguen política/DLQ sin duplicar efecto externo ni exponer datos. **Prueba:** suites de contrato memoria/adaptador, `worker.test.ts`/`politica.test.ts` y `test:db` estados; **bloquea Q-314** garantía tras reinicio/orden y llamada externa.
23. **CA-23 · REQ-03-11.** UI deriva disponibilidad de capacidades/estado verificados; bandera ausente/servicio caído no bloquea el dominio local ni se presenta como conectado. **Prueba:** contrato de `capacidades()` y matriz de combinaciones por pantalla + captura degradada; **bloquea Q-306** contrato que hoy no existe.
24. **CA-24 · REQ-03-12.** Guardar/reabrir vista conserva configuración, nunca permisos, datos ni acceso de otro actor; compartición solo según decisión. **Prueba:** unitarias + `test:db` dos usuarios con vistas diferentes/revocación + E2E; **bloquea Q-308**.
25. **CA-25 · REQ-03-12.** Agrupar/seleccionar/operar lote usa las mismas reglas y alcance por negocio; confirmación muestra resultado por ID sin aplicar cambios del asistente. **Prueba:** `test:db` lote mixto propio/ajeno/terminal y reintento + E2E; **bloquea Q-309** atomicidad/operaciones/límites.
26. **CA-26 · REQ-03-12.** Gráficas y CSV concuerdan con dataset, filtros y moneda; cero/nulo/denominador vacío están identificados, CSV neutraliza fórmulas. **Prueba:** unitarias de cálculo y CSV + `test:db` agregados frente a consulta de control + E2E lectores de pantalla; **bloquea Q-305/Q-309** cohorte/redondeo/formato.
27. **CA-27 · REQ-03-06/12.** Documentos se abren solo con autorización propia; caída del visor muestra enlaces permitidos, sin iframe proveedor ni publicación automática de KYC. Asistente no sube/publica directamente. **Prueba:** contrato de enlaces/documentos + API/E2E por rol y caída + captura; **bloquea Q-312/Q-301**.
28. **CA-28 · Validación y seguridad.** Fecha imposible, booleano textual, rango invertido, dinero fraccionario/no seguro, payload con campo restringido y IDs ajenos se rechazan sin 500 ni asignación masiva. RLS y permisos se conservan. **Prueba:** pruebas API/cliente/dominio/BD + `seguridad.test.ts`, CHECK/UNIQUE/FK con `test:db`; límites definitivos **bloquea Q-309**.
29. **CA-29 · Regla clave bajo mutación.** El revisor elimina temporalmente la exigencia de motivo o el lock/CAS de cierre y observa caer la prueba específica; restaura después sin entregar código mutado. **Prueba:** reporte de mutación con diff temporal/comando/fallo esperado/verde restaurado; un doble en memoria no demuestra lock SQL real. Mutación se realiza en trabajo de QA independiente, no en esta entrega.
30. **CA-30 · Salida del frente.** Otro proveedor verifica código/flujo/capturas; el orquestador observa `typecheck`, `lint`, `npm test`, `test:db`, `build` en entorno autorizado y `spec:check`; ningún fallo abierto se etiqueta hecho. **Prueba:** salidas y capturas de `.viltrum/vre-os/evidencia/E1/negocios/` a producir. Codex no ejecuta build/dev en esta carpeta ni cierra issue por informe ajeno.
31. **CA-31 · Objetivo y NFR.** Se acreditan línea base/objetivo de productividad y NFR de latencia, disponibilidad, capacidad, recuperación, retención/coste con unidad, umbral, carga, entorno y procedimiento. **Prueba:** medición de negocio atribuida y reporte de carga/recuperación independiente frente a valores firmados; **bloquea Q-310/Q-311/Q-315**. No sustituirlo por «rápido» o conteos de seed.

## 9. Fuera de alcance y preguntas abiertas

### Exclusiones y desacuerdos explícitos

Fuera de M03: plan de pagos 10/40/50, simulador, cotizaciones/facturas/PDF de cotización, reservas financieras, liquidación/aprobación/pago de comisiones M10, rentas contractuales/ledger, firma digital, cliente dentro del CRM, copia de carpetas completas y migración de fuente de verdad a Twenty. Se preservan efectos de cierre existentes; no se atribuye aquí aprobación de tasas comerciales. Las ampliaciones máximas de vistas/lotes/documentos/integraciones están descritas para revisión, sin autorización automática para construirlas ni desplegarlas.

| Contradicción / pendiente | Tratamiento y responsable |
|---|---|
| Nombre viejo en tarea/plan/UX-A y copy actual | Instrucción humana + #45 prevalecen. Se entrega M03-negocios, copy futuro Negocios/Presentación; D00 sincroniza índice y tareas dentro de su ámbito, no este productor |
| DS-1 exige simulador/Pagos (`:164`, `:231`) | Exclusión expresa `TAREA.md:47` prevalece; D05 corrige receta/criterio; no simular tab Pagos |
| DS-1 consulta `negs`, valores DOP y estados ilustrativos (`:28`, `:58`) | Son boceto. Contrato real en §5, siete etapas del catálogo y USD/divisa real; D03/D05 revisan correspondencia |
| UX-A ofrece cachear escrituras offline/confeti; DS-1 offline lectura | Seguir seis estados/proveedor local y `docs/DESIGN.md:93`; no anunciar guardado sin servidor, no confeti. G07 debe acordar almacenamiento/caducidad; Q-310 |
| DS-1 documentos subidos por asistente (`:234`) frente a D-06 | Toda publicación requiere aprobación; D05/D02 precisan alcance documental y flujo Q-301/Q-312 |
| DS-1 «conectado por defecto» (`:48`, `:126`, `:200`) | Salud debe observarse, jamás presumirse; Q-306 |
| Catálogo muestra desactivar negocio al caer Twenty y procedimientos ajenos al puerto | ARQ aprobada manda; local sigue operativo. D19 mapea procedimientos y corrige catálogo con pruebas Q-306/Q-314 |
| Proveedores n8n/Cube/PostHog/Papermark no incluidos en catálogo leído | Candidatos de D05, no integración verificada ni decisión de compra/despliegue. D21/D03/D19 evalúan contrato, licencia y PII antes de incluirlos |
| Cierre exige unitId y solo bloquea deal, frente a inventario por rangos/exclusividad al cierre | Q-303 bloquea diseño de cierre de D11/D03; no borrar esta incompatibilidad ni afirmar que UNIQUE comisión la resuelve |
| Catálogos reordenables frente a reglas por posición | Q-304; no hardcodear nombres/posiciones nuevos para ocultarlo |
| Nada se elimina frente a DELETE y FK cascade actuales | Baja lógica necesaria; guardar audit_log antes de DELETE no cumple conservación del vínculo; Q-311 |
| Precio real frente a tarjeta con monto/comisión y PATCH completo | Q-302 y CA-11; no dar filtración por resuelta con un botón oculto |

### Preguntas (con responsable y gate)

Se registran **dentro del único archivo permitido**, sin editar `.viltrum/questions.md` ni `client-inputs.md`. Esos dos archivos estaban vacíos de Q/CI al leerlos; IDs Q-301…Q-315 y CI-301…CI-302 son reservas propuestas para D00/D22, que deben conciliar el registro global antes de incorporarlos. No se finge actualización de esos archivos. Todas permanecen abiertas; la prioridad indica bloqueo de descubrimiento/técnico, no prioridad comercial decidida por D01.

- [ ] Q-301 ¿Quién aprueba cada tipo de cambio del asistente, cuántos niveles hay, qué lectura tiene, cómo se rechaza/vence/escala y se impide autoaprobación? · a:cliente · bloquea:G1 · dep:D02 · prioridad:P0
  - Requiere respuesta atribuida de Wilber/operación y contrato G04; D-06 fija la obligación, no este procedimiento.
- [ ] Q-302 ¿`amountCents` es monto comercial visible al broker o precio real restringido, qué campos financieros puede editar/ver cada rol y existe alguna excepción expresa de D-07? · a:cliente · bloquea:G1 · dep:D12 · prioridad:P0
  - No conceder excepción por el texto configurable del catálogo. La instrucción de tarea mantiene restricción admin; cualquier ampliación necesita decisión expresa.
- [ ] Q-303 ¿Cómo se identifica la propiedad exclusiva al cerrar sin alta unidad por unidad: referencia externa, unidad solo al cierre o recurso agregado; qué prueba demuestra disponibilidad y quién resuelve conflictos? · a:cliente · bloquea:G2 · dep:D11 · prioridad:P0
  - D03/D11 diseñan después de la respuesta; no decidir una venta a nivel de proyecto por inferencia.
- [ ] Q-304 ¿Qué edición de etapas autoriza el cliente y cómo se conserva la identidad de sus requisitos al reordenar/desactivar, incluidos saltos y retrocesos abiertos? · a:equipo · bloquea:G2 · dep:D03 · prioridad:P1
- [ ] Q-305 ¿Qué fechas/cohorte/revisitas definen conversión y rangos, cómo se cuentan días en etapa, qué redondeo tiene ponderación y qué ocurre con probabilidad/monto ausentes? · a:cliente · bloquea:G1 · dep:D02 · prioridad:P1
- [ ] Q-306 ¿Cuál es el contrato tipado de `capacidades()` por puerto, qué banderas/procedimientos soporta realmente cada adaptador y cuáles de los proveedores propuestos de D05 entran tras investigación D21? · a:equipo · bloquea:G2 · dep:D19 · prioridad:P1
- [ ] Q-307 ¿Cuál es la identidad durable del comando/revisión esperada, la respuesta al replay/misma clave con payload distinto y el resultado de pedir la misma etapa sin transición? · a:equipo · bloquea:G2 · dep:D03 · prioridad:P1
- [ ] Q-308 ¿Quién posee/puede compartir las vistas guardadas, dónde se persisten y cómo se preserva su configuración sin heredar permisos del autor? · a:equipo · bloquea:G2 · dep:D03 · prioridad:P2
- [ ] Q-309 ¿Qué alta independiente, operaciones masivas, atomicidad de lote, límites de página/lote/texto, monedas y columnas/formato de exportación se admiten? · a:cliente · bloquea:G1 · dep:D02 · prioridad:P1
- [ ] Q-310 ¿Qué umbrales de latencia/capacidad/concurrencia/disponibilidad/recuperación/coste se aceptan y con qué entorno y procedimiento se miden, incluida caducidad/seguridad offline? · a:cliente · bloquea:G1 · dep:D15 · prioridad:P2
- [ ] Q-311 ¿Qué política de retención, restauración/reapertura y seguimiento posterior a pérdida rige, y qué pasa al retirar la principal o archivar administrativamente un negocio? · a:cliente · bloquea:G1 · dep:D11 · prioridad:P1
- [ ] Q-312 ¿Qué enlaces de proyecto/documentos se muestran, quién puede acceder a KYC, qué expiración aplica y entra algún visor detrás de puerto sin copiar el expediente? · a:cliente · bloquea:G1 · dep:D12 · prioridad:P1
- [ ] Q-313 ¿Se han adquirido/verificado licencias y componentes 29221/34511/23604/33507/28340/4086 y cómo se resuelve el ID 4086 usado también como calendario? · a:equipo · bloquea:G3 · dep:D05 · prioridad:P2
- [ ] Q-314 ¿Cómo se garantiza orden/revisión por agregado, deduplicación tras reinicio y claim/lease sin mantener lock durante llamadas externas, incluida reconciliación de resultado incierto? · a:equipo · bloquea:G2 · dep:D19 · prioridad:P1
- [ ] Q-315 ¿Cuál es la línea base y objetivo cuantificado de productividad/seguimiento, en qué ventana y quién mide el éxito de Negocios? · a:cliente · bloquea:G0 · dep:D01 · prioridad:P2

Insumos pendientes, no preguntas:

- [ ] CI-301 Texto verificable o extracción citada del Acta Reunión 2 sobre etapas y seguimiento, con fecha/participantes. Se encontró `QuisqueyaHome PortalWeb/diseño/Informe-Reunion-2-Quisqueya-Home.pdf`, pero no se extrajo ni verificó su contenido. · a:equipo · bloquea:G1 · dep:D01 · prioridad:P1
- [ ] CI-302 Muestra autorizada de documentación enlazada y reglas de acceso por rol, sin credenciales ni datos personales de prueba reales. · a:cliente · bloquea:G2 · dep:D12 · prioridad:P1

### Estado del descubrimiento

Cobertura por módulo: Negocios — **0/15 preguntas de aclaración resueltas**, además de las decisiones firmadas ya trazadas en §1 (no se cuentan como respuestas inventadas a las preguntas nuevas). Preguntas abiertas que bloquean G0: **1**; G1: **7**; G2: **6**; G3: **1**. Insumos pendientes: **2**, uno G1 y uno G2. Esta distribución no declara ninguna puerta aprobada.

Siguiente paso: D02/Claude revisa §8 y consigue respuestas atribuidas a Q-301/Q-302/Q-303; D03/D11/D19 cierran los contratos dependientes; D05/D07 reconcilian recetas. Hasta cerrar bloqueos, M03 queda REVIEW y no despacha código. La falta de una capacidad implementada no impediría por sí sola READY; lo que lo impide aquí son reglas y contratos todavía indeterminados.

Revisión de seguridad de esta entrega documental contra `docs/contexto/flujo-de-trabajo.md:153`: no se añaden tablas/API/ejecuciones SQL ni secretos. Se registran escenarios concretos: datos financieros sin proyección (`page.tsx:71`, API `route.ts:56`); unidad vendida desde dos negocios sin bloqueo del recurso (`repos/pipeline.ts:151`); pointer que puede referir actividad de otro negocio (`repos/pipeline.ts:84`); retirada física (`repos/pipeline.ts:373`). Lo positivo verificado por lectura: permiso de ruta antes de escritura, alcance por ID, campos copiados explícitamente, auditoría transaccional, lock de negocio en cierre e integración con payload mínimo. No se certifica explotación, corrección ni QA por leer código. No se observaron valores secretos; no se consultaron archivos de credenciales, configuración secreta ni inspecciones de servicios.

## 10. Anexos de entrega

## Verificación

Comando solicitado: `npm run spec:check`. El primer intento no llegó al verificador: PowerShell bloqueó el wrapper `npm.ps1` por firma. Se usó `npm.cmd run spec:check`, que ejecuta el mismo script de package.json sin cambiar la política del sistema. No se pasó `--md` ni se modificó el índice.

Primera salida del wrapper (exit code 1):

```text
npm : No se puede cargar el archivo C:\Users\wilbe\tools\node-v24.18.0-win-x64\npm.ps1. El archivo 
C:\Users\wilbe\tools\node-v24.18.0-win-x64\npm.ps1 no está firmado digitalmente. No se puede ejecutar este script en 
el sistema actual. Para obtener más información acerca de la ejecución de scripts y la configuración de la directiva 
de ejecución, consulta about_Execution_Policies en https:/go.microsoft.com/fwlink/?LinkID=135170.
En línea: 2 Carácter: 1
+ npm run spec:check
+ ~~~
    + CategoryInfo          : SecurityError: (:) [], PSSecurityException
    + FullyQualifiedErrorId : UnauthorizedAccess
```

Salida literal del verificador después de ajustar la redacción de M03 (exit code 1):

```text
> quisqueya-home-crm@0.1.0 spec:check
> node scripts/spec/check.mjs

Spec Pack: 3 fichas; listas READY o superior: 0%
Estados: DRAFT 0 · REVIEW 2 · READY 0 · BUILT 0 · VERIFIED 0
Tipos: Módulo 2 · Global 0 · Integración 1
Bloqueos: 12
- .viltrum/vre-os/spec/modulos/M01-leads.md: secciones vacías, con TODO o ausentes: §1, §3, §6, §7, §8, §9
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: falta cabecera YAML entre ---
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: falta campo obligatorio id
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: falta campo obligatorio sistema
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: falta campo obligatorio estado
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: falta campo obligatorio riesgo
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: falta campo obligatorio owner
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: falta campo obligatorio revisores
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: falta campo obligatorio actualizado
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: estado inválido (vacío); permitido: DRAFT|REVIEW|READY|BUILT|VERIFIED
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: nombre de archivo no sigue el patrón INN-descripcion.md
- .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: secciones vacías, con TODO o ausentes: §1, §2, §3, §4, §5, §6, §7, §8, §9, §10
- .viltrum/vre-os/tareas/T-DS-1-negocios-leads.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-DS-2-propiedades-brokers.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-DS-3-integraciones-shell.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-0-renombrar-negocios.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-1a-ficha-negocios.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-2a-ficha-leads.md: legado (sin Ficha:)
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
```

**Resultado:** el comando global falla; esta corrida no señala ninguna infracción estructural de M03. Los 12 bloqueos reportados pertenecen a M01 y CAPACIDADES, fuera del único archivo permitido, y quedan para el orquestador. Las advertencias de tareas legadas no son bloqueos según el script. No se convierte este resultado en aprobación propia ni en estado READY.

Incidencia del verificador: `scripts/spec/check.mjs:61` busca el marcador de pendientes con límites de palabra de JavaScript y sin distinguir mayúsculas. La redacción española «todo» y el sufijo de «método» activaban falsamente secciones vacías. Se reformuló la prosa de M03 sin cambiar requisitos; no se editó la herramienta. El anexo numerado separa la salida literal (que contiene ese marcador) de las nueve secciones funcionales examinadas. La comprobación acredita formato, no la exactitud del negocio ni las pruebas de §8.

## Handoff

**Para Claude/orquestador y D02, con D03/D11/D12/D19/D05/D07 y QA D14 de proveedor independiente.** Productor: Codex D01. Entregable único: `.viltrum/vre-os/spec/modulos/M03-negocios.md`. Estado REVIEW/L1, sin gate, sin aprobación propia, sin cambios de código, git, BD, build/dev o producción.

Revisar §8 requisito por requisito, confirmar las fuentes firmadas y obtener las respuestas/insumos de §9. Prestar especial atención a aprobación del asistente, clasificación del monto, cierre exclusivo con rangos, baja lógica y orden/idempotencia de eventos. Conciliar los nombres del catálogo externo y las recetas D05 con los puertos instalados; los candidatos no son capacidades conectadas.

El orquestador incorpora Q/CI al registro y sincroniza índice/roadmap/tareas; eso queda fuera del archivo autorizado. Solo otro actor puede aceptar el entregable y resolver su promoción a READY cuando contratos, preguntas y NFR tengan evidencia. Después se derivan tareas pequeñas backend/frontend y QA independiente con las pruebas/capturas indicadas. Esta entrega no cierra E1.1 ni acredita que el producto cumpla los criterios.
