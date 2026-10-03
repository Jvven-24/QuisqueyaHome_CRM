No pude guardar `.viltrum/crm-ux/D04-crm-ux-audit.md`. Dejo el informe completo aquí; no se modificaron archivos del proyecto.

# D04 · Auditoría UX del CRM Quisqueya Home

Fecha: 2026-10-03. Dispatch: `20261003T163455Z-D04-codex`.

Estado: **propuesta pendiente de revisión independiente**. No constituye aprobación, cierre de issue, C1 ni autorización de implementación.

## 1. Dictamen, método y límites

El CRM dispone de pantallas operativas y controles reales, pero sus vistas interrumpen la continuidad comercial: Inicio pierde la selección del lead; convertir no conduce al negocio creado; las actividades y el inventario se recorren por módulos separados; la preparación del cierre no está secuenciada. También hay contenido literal presentado como operación, filtros que no afectan los datos y recuperación de errores desigual.

La anatomía del CMS aporta una dirección útil: navegación agrupada, orientación contextual, resumen accionable, cola de atención y trabajo principal con inspector. La adaptación debe conservar los contratos del CRM y mejorar continuidad, accesibilidad y estados. Sus gradientes, tipografías pequeñas y componentes manuales no deben copiarse sin revisión.

**Trabajo realizado:**

- Lectura del perfil completo, TAREA.md y documentación local.
- Auditoría documental y heurística estática del código.
- Aplicación de `viltrum-ux-research`, `viltrum-pxil-design`, doctrina de estados y contrato PXIL.
- Inventario delegado a `ux_inventory`, que leyó el mismo PERFIL.md antes de trabajar. Su contribución no constituye revisión independiente.
- Inspección de las 15 rutas principales, dos detalles y formularios/paneles internos.
- Inspección del CMS de referencia y fichas concretas de la biblioteca privada.

**No realizado:** entrevistas, observación de usuarios, navegación, capturas, pruebas de tareas, consultas de datos vivos, envíos, llamadas de red, git, gh, npm, servidores, build ni tests.

**No verificado:** commit publicado, runtime, permisos efectivos, C1, responsive real, contraste calculado, foco, lector de pantalla y tiempos de tarea.

Convenciones:

- **E:** evidencia comprobada en archivos.
- **H:** hipótesis de impacto pendiente de reproducción.
- **P:** propuesta.
- **Alta:** compromete una tarea, la interpretación de datos o la recuperación.
- **Media:** aumenta esfuerzo, carga cognitiva o inconsistencia.

Una acción visible sin capacidad explícita no demuestra un bypass del servidor.

### Identificación del snapshot

Sin comparación remota. SHA256 de fuentes principales:

| Fuente | SHA256 |
|---|---|
| `src/app/(crm)/layout.tsx` | `E4E88078A5962723C8E6E8A3C50100BB0EE4A4B9347D220220D98387118C6504` |
| `src/app/(crm)/_ui/prototipo-ui.tsx` | `1B6097E7A2D3A32B08ABCC360EED36F14B0BCF2AD02AC51245A7B5D72776E9B7` |
| `docs/R_RELEVO.md` | `47219B3424099C4AC100FD2800F46458A9F251E53A57F3F8E6B1183259E9A7C9` |
| `docs/DESIGN.md` | `3F6DA9DD0360DECE295ADE609FB3319638BE48ADFC3272A22E473C0B14D160BD` |

### Discrepancias que deben resolverse

1. `R_RELEVO.md` §1 anuncia R3 cerrada y siguiente R4.1; §3 mantiene #50/R3.6 como siguiente. D00/Claude deben aclarar la secuencia.
2. El relevo informa 334 pruebas; perfil/status, 358. Ninguna cifra fue verificada mediante una corrida.
3. `arquitectura.md` describe ausencia de Tailwind/shadcn y cuatro módulos mock; el código actual contiene tokens, shell shadcn y consultas reales. La auditoría funcional del 24/07/2026 describe un prototipo anterior.
4. Glosario/prototipo restringen módulos de Asistente; `db/seed.sql:44-69` concede pipeline, propiedades, metas, comisiones y reportes. `DESIGN.md:164` restringe rendimiento global a Asistente, mientras el seed concede `reports:view all`.
5. Varios IDs seleccionados en DESIGN no coinciden con las fichas privadas inspeccionadas; muchas fichas carecen de código fuente.

## 2. Requisitos y objetivo de investigación

Los siguientes IDs organizan este informe; no son requisitos previamente aprobados.

| ID | Necesidad | Fuente/estado |
|---|---|---|
| REQ-UX-01 | Navegación y distribución comprensibles mediante patrón consola | TAREA.md |
| REQ-UX-02 | Continuidad lead → actividad/cita → negocio → reserva/cierre | TAREA y MAPEO §10; reserva por definir |
| REQ-UX-03 | Seis estados y recuperación sin perder datos | Perfil y doctrina UX |
| REQ-UX-04 | Densidad operativa y acceso en 320/390/768/1440 | TAREA; validación pendiente |
| REQ-UX-05 | Permisos, alcance propio y precios restringidos | MAPEO y DESIGN; discrepancia de roles |
| REQ-UX-06 | Paleta, tipografía y primitivas Radix vigentes | DESIGN |
| REQ-UX-07 | Solo vistas, conservando reglas, API y datos durante SOLID | Decisiones y plan R5 |
| REQ-UX-08 | Componentes auténticos con procedencia y ruta | TAREA y biblioteca Viltrum |

No se encontró un objetivo UX medible aprobado. Propuesta para D02: que un broker localice un lead asignado, identifique responsable y siguiente acción y retome su negocio sin ayuda ni pérdida de contexto. Medir finalización, errores, ayuda y retrocesos; definir umbrales después de medir la línea base.

Roles confirmados documentalmente: Admin, Asistente y Broker. Frecuencia diaria, uso intensivo de móvil y conectividad irregular son hipótesis de investigación. La escala de 3–10 usuarios y cientos de leads mensuales procede de la auditoría de julio; requiere ratificación.

## 3. Inventario y arquitectura de información

En adelante, **C** significa `src/app/(crm)/`.

| SCR | Ruta | Tarea y patrón actual | Entrada/salida principal |
|---|---|---|---|
| S01 | `/inicio` | Priorizar trabajo; dashboard | Shell → `/leads` |
| S02 | `/leads` | Captación/asignación/conversión; lista + inspector | Shell/Inicio → `?lead=id` |
| S03 | `/contactos` | Consultar/editar persona; lista + inspector | Shell → `?contacto=id` |
| S04 | `/pipeline` | Gestionar oportunidad; kanban + inspector | Shell/perfil → `?deal=id` |
| S05 | `/agenda` | Planificar citas; calendario | Semana → alta/Google Calendar/ICS |
| S06 | `/tareas` | Completar seguimiento; lista | Alta/completar → misma lista |
| S07 | `/propiedades` | Elegir inventario autorizado; rejilla | Listado → proyecto |
| S08 | `/propiedades/[slug]` | Administrar unidades; detalle + tabla | Proyecto → unidad/Avances |
| S09 | `/avances` | Revisar fase y evidencia; editor | Proyecto/fase URL → guardar/publicar |
| S10 | `/brokers` | Revisar equipo/asignaciones; tarjetas | Listado → perfil/invitar/asignar |
| S11 | `/brokers/[id]` | Revisar cartera; detalle | Perfil → propiedad/pipeline |
| S12 | `/metas` | Comparar objetivo y cierres; resumen + tabla | Periodo → editar meta |
| S13 | `/comisiones` | Revisar liquidaciones; tabla financiera | Filtros → reparto/transición/exportación |
| S14 | `/academy` | Consultar formación/progreso; catálogo | Filtros → completar/reabrir |
| S15 | `/comunicaciones` | Preparar mensajes; catálogo + editor | Plantilla → guardar/copiar/despachar |
| S16 | `/reportes` | Interpretar indicadores; dashboard | Selector local/CSV |
| S17 | `/configuracion` | Administrar acceso y catálogos; paneles | `?tab` → panel interno |

Entradas: `C/modulos.ts:23-63`. El shell filtra enlaces por permiso `view`: `C/layout.tsx:59,88`. Resultado de navegación y logout no ensayado.

### Formularios y sub-vistas

| Padre | Sub-vistas | Datos/tarea |
|---|---|---|
| Leads | Inspector, alta, descarte | Responsable, contacto, interés, origen, estado, motivo |
| Contactos | Inspector, alta, edición | Persona, canal, responsable, notas |
| Pipeline | Inspector, condiciones, interés, pérdida | Monto, probabilidad, comisión, fecha, proyecto/unidad/principal |
| Agenda | Alta | Asunto, día, hora, responsable, ubicación |
| Tareas | Alta | Título, vencimiento, prioridad, responsable |
| Propiedades | Alta/edición proyecto; alta/edición unidad | Datos físicos/comerciales, precios protegidos, estados |
| Avances | Editor fase, evidencia | Estado, progreso, responsable, fechas, nota, fotos |
| Brokers | Invitación, asignación | Usuario/perfil, proyectos |
| Metas | Meta compañía/broker | Objetivo del periodo |
| Comisiones | Reparto, confirmación de transición | Importe broker/agencia, estado |
| Academy | Progreso, checklist | Sesiones/elementos completados |
| Comunicaciones | Autoría, preview, despacho | Plantilla, variables, canal, destinatario |
| Configuración | Usuarios y formulario | Identidad/acceso/perfil |
| Configuración | Permisos | Rol × recurso × acción × alcance |
| Configuración | Etapas | Nombre, posición, probabilidad, activa |
| Configuración | Catálogos | Motivos de pérdida y canales |
| Configuración | Papelera | Tipo, nombre, fecha, restauración |
| Configuración | Integraciones | Proveedor, estado, capacidad |

Las confirmaciones de borrado y transición son estados de sus vistas, no rutas nuevas. Carga/error globales y `src/app/forbidden.tsx` forman parte del inventario.

Login e invitaciones quedan fuera de la auditoría detallada de `(crm)`. No existe una pantalla de reserva comercial comprobada ni una salida funcional al material de Academy.

### Matriz de roles documental

Referencia: `db/seed.sql:29-94`. **No representa permisos vivos.** A = ve y actúa según permisos específicos; V = ve; N = sin permiso en el seed.

| Vista | Admin | Asistente | Broker |
|---|---|---|---|
| Inicio | V all | V all; global pendiente | V own |
| Leads | A all | A all | A own |
| Contactos | A all | A all; sin delete | A own; sin delete |
| Pipeline | A all | A all | A own |
| Agenda/Tareas | A all | A all | A own |
| Propiedades/unidades | A all | A all; sin precio real/delete | V own |
| Avances | A all | Edit all; sin create/delete | V own |
| Brokers/perfil | A all | V all; asignación según projects:edit | V own |
| Invitación de usuario | A all | N | N |
| Metas | A all | V all | V own |
| Comisiones | A all | V all | V own |
| Academy | V all; progreso por confirmar | Igual | Igual |
| Comunicaciones | A all | A all | Create own; edit ausente |
| Reportes/CSV | A all | A all; conflicto con DESIGN | N |
| Configuración | A all; admin protegido | N | N |
| Precios internos | A all | N | N |
| Métricas globales | V all | N | N |

Las capacidades deben calcularse en servidor. `roleSlug` puede orientar presentación, pero no sustituye autorización. D01/D02 deben ratificar esta matriz.

### Sitemap propuesto

Se conservan rutas y recursos:

```text
Hoy
  Inicio
  Agenda ↔ Tareas

Comercial
  Leads → Inspector → Conversión → Negocio
  Contactos → Inspector
  Pipeline → Inspector → Condiciones / Intereses / Historial
  Comunicaciones → Plantilla → Revisión de destino

Inventario
  Propiedades → Proyecto → Unidades
                       ↔ Avances → Fase → Evidencia

Equipo y resultados
  Brokers → Perfil → Cartera
  Metas
  Comisiones
  Academy
  Reportes

Sistema
  Configuración
    Usuarios / Permisos / Etapas / Catálogos / Papelera / Integraciones
```

Orden estable entre roles; omitir enlaces no autorizados y grupos vacíos. Las continuaciones hacia negocio, actividad contextual y revisión de destino son propuestas condicionadas a los contratos existentes.

## 4. Hallazgos por pantalla

### Shell y componentes compartidos

**H01 · Media · E — Navegación plana y orientación genérica.**  
`C/layout.tsx:83-99` presenta módulos en un solo grupo; `:122-132` muestra “Panel de trabajo” y rol sin migas, búsqueda ni paleta. `C/nav-link.tsx:52` numera según el índice visible, que cambia entre roles. El logo ya es imagen (`layout.tsx:67-70`); el diagnóstico anterior de QH estático no aplica a este shell.

**Propuesta:** grupos por tarea, orientación contextual y orden estable.

**H02 · Alta · E/H — Apertura de fichas dependiente del ratón.**  
`C/leads/vista.tsx:191-195`, `contactos/vista.tsx:136` y `pipeline/vista.tsx:240-245` usan filas/divs con `onClick`, sin controles de apertura por teclado en esos elementos. El selector de etapa del inspector (`pipeline/inspector.tsx:202-225`) ya aporta alternativa al arrastre, pero no resuelve abrir la tarjeta.

**Propuesta:** enlace o botón real para abrir cada ficha; probar teclado completo.

**H03 · Alta · E/H — Diálogos manuales incompletos.**  
`C/_ui/prototipo-ui.tsx:114-143` declara `aria-modal` sin implementar trap/restauración de foco ni Escape. `globals.css:421-422` no limita altura ni incorpora scroll propio.

**Propuesta:** Dialog Radix existente, título/descripción, foco y acciones alcanzables. Clipping y foco real no verificados.

**H04 · Media · E — Contrato visual fragmentado.**  
`prototipo-ui.tsx:25` usa 11px; `:80,92,98`, texto pequeño; `:91,123`, sombras y radios. `DESIGN.md:65,110` exige objetivos 44/48px y texto ≥13px. `globals.css:76` conserva iconos de 40px, `:32` un muted antiguo y `:50` foco translúcido, mientras `tokens.css:60` contiene el muted corregido.

**Propuesta:** unificar tokens; verificar estilos computados antes de atribuir colisiones concretas.

**H05 · Alta · E/H — Recuperación de red desigual.**  
Altas de leads (`vista.tsx:274-298`), contactos (`:214-238`), negocio (`inspector.tsx:249-278`), proyecto (`_formulario-proyecto.tsx:44-66`) y unidad (`[slug]/vista.tsx:223-245`) liberan busy después de fetch sin recuperación integral mediante catch/finally.

**Propuesta:** reutilizar `src/lib/api.ts:78-112`, que ya representa error de conexión; conservar datos y liberar busy siempre. No crear otro cliente ni prometer colas offline.

### S01 · Inicio

**H06 · Alta · E — Operación mezclada con literales.**  
`C/inicio/vista.tsx:110-115` deriva etapas mediante porcentajes fijos; `:136-157` contiene tres actividades literales; `:168-181`, progreso Academy y ranking. `inicio/page.tsx:20-24` consulta métricas, pero pasa un nombre fijo según rol.

Los KPI superiores sí usan datos: no toda la pantalla es ficticia.

**H07 · Alta · E — Cola que pierde identidad.**  
`inicio/vista.tsx:70-71` limita a cuatro leads y enlaza a `/leads` sin selección. Falta “ver todos” y vacío local. `globals.css:477` oculta próxima acción en móvil.

**Propuesta:** abrir el mismo lead, mostrar siguiente acción y distinguir datos reales de muestras.

### S02 · Leads

**H08 · Alta · E — Conversión sin continuidad.**  
`C/leads/inspector.tsx:63-75` confirma y refresca sin abrir el negocio ni ofrecer enlace. `:176-195` oculta acciones al convertir. La tabla (`vista.tsx:180-187`) no muestra la próxima acción prometida en `:125`.

**H09 · Media · E/H — Filtros y selección inconsistentes.**  
Buscar elimina `lead` (`vista.tsx:139`); origen/estado lo conservan (`:146,158`). `page.tsx:141` combina selección y condiciones del listado, por lo que la ficha puede desaparecer al filtrar.

Filtros URL, paginación y vacíos distintos son aciertos.

**H10 · Media · E — Capacidades de acción no expresadas.**  
Registrar y convertir carecen de props explícitas de capacidad (`vista.tsx:126-130`; `inspector.tsx:130,176`). Esto no demuestra falta de autorización del servidor.

**Propuesta:** capacidad por acción, filtros previsibles y continuación al negocio cuando el ID ya esté disponible.

### S03 · Contactos

**H11 · Media · E — Ficha orientada a edición, con poca continuidad.**  
`C/contactos/inspector.tsx:100-132` ofrece datos, editar, WhatsApp y borrar, seguido de historial (`:193`), sin navegación al lead/negocio relacionado en esa estructura.

**Propuesta:** Resumen/Notas/Historial y vínculos solo cuando las relaciones ya estén disponibles. Conservar filtros y paginación URL.

### S04 · Pipeline

**H12 · Alta · E — Preparación y cierre sin secuencia.**  
`C/pipeline/inspector.tsx:108-147` presenta ocho datos al mismo nivel; `:149-187`, propiedades; `:202-225`, otras etapas. `pipeline/vista.tsx:169-175` envía directamente cualquier etapa no lost. No hay resumen ni requisitos visibles antes del cierre.

MAPEO `:467-472` exige datos diferentes por transición.

**H13 · Alta · E — Centavos expuestos al operador.**  
`pipeline/inspector.tsx:285-286` pide importe en centavos, aunque la lectura muestra moneda normal.

**Propuesta:** entrada en moneda de negocio y adaptación exacta al entero existente; conservar centavos en API.

**H14 · Alta · E/H — El error puede cerrar el motivo de pérdida.**  
`pipeline/vista.tsx:156-161` retorna tras alert al fallar; `:343-344` cierra el modal después de esperar esa función, sin resultado de éxito/fracaso. `finally` libera busy (`:164-166`), pero no hay catch humano local de rechazo de red.

**Propuesta:** cerrar solo tras éxito confirmado; conservar motivo ante 403/409/red.

**H15 · Alta · E/H — Total sin separar divisas.**  
`pipeline/vista.tsx:142-144` suma importes y `:187` etiqueta USD; cada tarjeta usa su moneda (`:271`). Si existen divisas mezcladas, el total resulta engañoso.

Divisas vivas no verificadas. No introducir FX durante R5.

**H16 · Media · E — Filtros locales y vacío ambiguo.**  
`pipeline/vista.tsx:107-108` usa estado local; `:211` evalúa registros sin filtrar; `:312` muestra “Suelta aquí” aunque los filtros oculten todos.

**Propuesta:** diferenciar vacío inicial y cero coincidencias; alternativa lista/táctil al kanban.

### S05 · Agenda

**H17 · Alta · E/H — Hora admitida pero no representada.**  
`C/agenda/vista.tsx:21,54,101-107` limita la rejilla a cinco días y 09–16; `:198` permite hora libre. `agenda/page.tsx:38,57-58` termina antes del sábado. Una cita de las 17:00 podría guardarse sin aparecer en la rejilla.

Regla horaria y alta real no verificadas.

**H18 · Media · E — Salida externa sustituye contexto CRM.**  
`agenda/vista.tsx:111-117` abre Google Calendar sin detalle contextual de contacto/negocio. “Esta semana” permanece activo al navegar (`:87`). El alta no muestra relación comercial.

**Propuesta:** aclarar salida externa, estado de semana y contexto disponible. Conservar ICS y URL semanal.

### S06 · Tareas

**H19 · Alta · E — Asociación prometida sin contexto visible.**  
`C/tareas/vista.tsx:78` menciona contactos, pero lista (`:99-114`) y alta (`:192-219`) muestran título, fecha, prioridad y persona. `tareas/page.tsx:36-37` excluye futuras; la vista no conecta con Agenda. Recuperación de red incompleta en `:56-68,158-186`.

No se afirma que el dominio carezca de relaciones.

**Propuesta:** cola por vencimiento/prioridad, contexto acreditado y conexión Agenda/Tareas sin duplicar CRUD.

### S07–S08 · Propiedades y unidades

**H20 · Media · E — Decoración desplaza inventario.**  
`C/propiedades/vista.tsx:120-125` presenta QH/progreso; `globals.css:253-256` reserva 42% y mínimo 240px. `[slug]/vista.tsx:103-107` repite el panel antes de unidades. DESIGN `:90` prioriza inventario, precio y disponibilidad.

**H21 · Alta · E — Formularios largos y pérdida de filtros.**  
Proyecto autorizado puede tener ocho campos (`_formulario-proyecto.tsx:79-133`); unidad, once (`[slug]/vista.tsx:257-320`), sin segmentación. Precios en centavos. Volver a `/propiedades` (`:79`) pierde contexto de filtros.

**H22 · Alta · H — Reserva comercial sin recorrido definido.**  
La unidad ofrece estado (`[slug]/vista.tsx:315`) y el negocio permite asociar interés (`pipeline/inspector.tsx:149-187`). Cambiar una unidad a reserved no acredita una reserva comercial.

**Pendiente D01/D02:** actor, requisitos, vigencia, reversión y concurrencia. No inventar una transacción ni etapa.

### S09 · Avances

**H23 · Alta · E/H — Editor largo y publicación poco contextual.**  
`C/avances/vista.tsx:341-398` contiene ocho campos; publicar/retirar (`:148-151`) precede a evidencia (`:218-268`). `:268` promete visibilidad al comprador en portal; decisión §34 describe una marca, sin integración acreditada. Error parcial de fotos (`:221-222`) sin recuperación específica visible.

**Propuesta:** Estado/Evidencia, errores por región y descripción del efecto real de publicar.

### S10–S11 · Brokers

**H24 · Media · E/H — Escaneo difícil con volumen.**  
`C/brokers/vista.tsx:78-124` usa tarjetas sin búsqueda/paginación local; asignación (`:185-219`) repite todos los proyectos. Volumen vivo desconocido. Perfil `[id]/page.tsx:105-122` repite nombre/cargo.

Acierto: regreso (`:110`) y enlaces a proyectos (`:170`) y negocios (`:206`).

**Propuesta:** filas comparables y una cabecera; conservar enlaces de cartera.

### S12 · Metas

**H25 · Media · E — Gráfico sin magnitudes recuperables.**  
`C/metas/vista.tsx:22` abrevia meses en una letra; `:169-179` dibuja barras sin valores ni alternativa tabular en esa estructura. No hay continuidad hacia negocios.

Periodo URL y alcance all/own (`page.tsx:38-51`) son aciertos.

**Propuesta:** cifras, denominador y tabla textual, sin alterar cálculo.

### S13 · Comisiones

**H26 · Alta · E — Acción financiera mediante prompt y símbolos.**  
`C/comisiones/vista.tsx:134-147` usa prompt/alert para reparto; `:254-293` presenta símbolos con nombres accesibles, pero sin texto visible ni resumen de importes.

`page.tsx:39-43` excluye deliberadamente el estado del cálculo KPI.

**Propuesta:** Dialog con reparto y efectos; explicar que KPI corresponde a periodo/broker, no necesariamente a filas filtradas.

### S14 · Academy

**H27 · Alta · E/H — Progreso sin salida al material y promesa offline no acreditada.**  
`C/academy/vista.tsx:33` declara videoUrl; PlayCircle (`:388-391`) no tiene enlace/handler. Se permite marcar/reabrir (`:455-474`). `:252` promete sincronización, pero online (`:66-68`) solo limpia bandera; handlers (`:151-168,195-219`) hacen fetch y rollback sin cola en este archivo.

No se descarta una capacidad externa no inspeccionada.

**Propuesta:** acceso a material solo con contrato confirmado; mensaje honesto de conectividad. Conservar filtros, reset, reintento y rollback.

### S15 · Comunicaciones

**H28 · Alta · E/H — Simulación conectada con despacho.**  
`C/comunicaciones/vista.tsx:92-99` fija variables de ejemplo y `:101` prellena destino; `:224-237` lo manda al endpoint de despacho. `:516` llama al panel “Simulador de Entrega”.

Riesgo de confundir ejemplo con envío. No se ejecutó envío ni se auditó el adaptador.

**H29 · Alta · E — Canal y acción divergentes.**  
Se ofrecen email/webhook (`:442-445`), pero el destino (`:228`) y preview/acciones (`:557,568-610`) distinguen Telegram o WhatsApp. Guardar no tiene busy (`:170-220,495-500`); cambiar plantilla reemplaza borrador (`:136-140`); copiar anuncia éxito sin esperar portapapeles (`:163-166`).

**Propuesta:** separar autoría, preview y despacho; capacidad explícita, destinatario revisado y resultado acreditado.

### S16 · Reportes

**H30 · Alta · E — Periodo decorativo.**  
`C/reportes/vista.tsx:8,31-40` cambia estado local sin afectar métricas/CSV (`:10-20,47-123`). `page.tsx:21` consulta sin periodo.

**Propuesta:** describir periodo real y retirar/deshabilitar control inerte. Filtrar agregados sin fechas no resuelve el problema; una consulta temporal queda fuera de vistas.

### S17 · Configuración

**H31 · Alta · E/H — Formulario largo y posible borrador de permisos obsoleto.**  
`C/configuracion/_usuarios.tsx:228-280` contiene ocho campos para broker. `_permisos.tsx:75-77` inicializa matriz desde props; cambio de rol (`:83-87`) usa URL y `vista.tsx:73` no incluye key por rol. Posible permanencia de estado anterior: requiere reproducción con dos roles distintos. Falta guarda de cambios.

Acierto: explicación del rol protegido (`:135-143`).

**H32 · Media · E — Papelera y capacidad anunciada exceden lo mostrado.**  
`configuracion/page.tsx:126-132` limita 30 por tipo antes de ordenar (`:141`); `_papelera.tsx:54` promete todo sin búsqueda/paginación (`:54-93`). `_integraciones.tsx:22` afirma ausencia de plantillas M11; los campos de última sincronización/error (`:9-10`) no se muestran.

**Propuesta:** copy exacto sobre alcance/capacidades; vacíos accionables en etapas y catálogos. No ampliar consultas desde una decisión visual.

## 5. Responsive: diagnóstico y contrato

**Ningún ancho fue probado en navegador.** La siguiente evidencia es estática.

| Ancho | Evidencia | Riesgo y propuesta |
|---|---|---|
| 320 | `globals.css:469`: margen 14; `:495`: calendario 783px; `:59`: tabla mínimo 880px | Evitar overflow del documento; scroll local cuando sea necesario; lista móvil, filtros en Sheet, inspector completo |
| 390 | `:493`: inspector desde y=72; `:478-479`: filtros horizontales; `:477`: próxima acción oculta | Mantener siguiente acción; diálogo con scroll/footer; targets 48px; comprobar teclado móvil |
| 768 | Sidebar `md:block`, 248px (`sidebar.tsx:210`); reglas legadas ≤980 | Área útil cercana a 480px: navegación overlay y detalle superpuesto según espacio |
| 1440 | Área aproximada 1128px; split mínimo 640+390+16 | Inspector cabe, pero tabla 880px desborda panel de 640; reducir columnas o scroll local |

Propuestas y pruebas pendientes por pantalla:

| Pantalla | 320/390 | 768 | 1440 |
|---|---|---|---|
| Inicio | Cola primero, KPI apilados, próxima acción | Resumen sobre cola | Resumen, radar, cola principal |
| Leads/Contactos | Fichas enlazables, Sheet, detalle completo | Lista y detalle superpuesto | Tabla + inspector |
| Pipeline | Lista por etapa; drag opcional | Lista/kanban con scroll local | Kanban + inspector |
| Agenda | Lista diaria; calendario opcional | Día/semana dentro del panel | Semana y horario ratificado |
| Tareas | Vencimiento, responsable, contexto | Cola y resumen separado | Cola + equipo autorizado |
| Propiedades | Disponibilidad/rango antes de arte | Inventario compacto | Tabla/rejilla según tarea |
| Proyecto/unidades | Resumen, ficha unidad, tabs | Columnas esenciales | Tabla + inspector |
| Avances | Estado/Evidencia apilados | Editor y evidencia verticales | Editor + evidencia lateral |
| Brokers/perfil | Lista y cartera por secciones | Lista/detalle | Equipo comparable y cartera |
| Metas | Cifras y texto histórico | Comparativa compacta | Resumen, tabla y gráfico con valores |
| Comisiones | Ficha financiera y acción textual | Tabla reducida | Tabla, filtros, KPI con alcance |
| Academy | Catálogo y progreso | Lista/contexto | Catálogo + progreso |
| Comunicaciones | Catálogo → editar → revisar | Dos regiones si caben | Editor/revisión sin columnas estrechas |
| Reportes | Indicadores y tablas alternativas | Paneles por decisión | Gráficos y datos textuales |
| Configuración | Selector de panel; permisos por recurso | Editor por panel | Navegación contextual + panel |

Contrato propuesto: márgenes 16/20/32px, cero scroll horizontal del documento, nombres largos con wrapping, zoom 200%, targets táctiles 48px y una acción primaria reconocible. Inspector de 400–440px solo si el ancho útil lo permite; pantalla completa en móvil. D05 debe ratificar breakpoints y relación con la regla actual de sidebar.

## 6. Seis estados por pantalla

Leyenda:

- **L:** carga compartida en `C/loading.tsx:9-10`; algunas vistas tienen loading propio.
- **E0:** error de render en `C/error.tsx:24-33`; no cubre automáticamente eventos async.
- **P0:** guardia view y 403 en `src/app/forbidden.tsx:14-24`.
- “Éxito” describe estructura presente, no una mutación probada.

| Vista | Carga | Vacío | Error | Offline | Éxito | Permiso |
|---|---|---|---|---|---|---|
| Inicio | L | Cola sin rama explícita | E0 | Sin tratamiento local visto | Datos + literales | P0; global pendiente |
| Leads | L/busy | Inicial y filtrado | E0/campos/HTTP | H05 | Refresh sin negocio | P0; H10 |
| Contactos | L/busy | Inicial y filtrado | E0/campos/alert | H05 | Refresh/cierre | P0; revisar acciones |
| Pipeline | L/busy | Filtros ambiguos | E0/alert409 | Recuperación incompleta | Motivo puede perderse | P0; capacidades pendientes |
| Agenda | L/busy | Rejilla sin explicación | E0/HTTP | Alta sin recuperación integral | Cierre/refresh | P0; create pendiente |
| Tareas | L/busy | Explícito | E0/HTTP | Recuperación incompleta | Refresh/desaparición | P0; acciones pendientes |
| Propiedades/unidades | L/busy | Explícitos | E0/campos/alert | H05 | Refresh/cierre | P0; CRUD/precio presentes |
| Avances | L/busy | Proyecto/fases/CTA | E0/red/parcial fotos | Mensaje genérico | Refresh/marca | P0; flags presentes |
| Brokers/perfil | L/busy | Equipo/cartera | E0/formulario | Integral no acreditado | Refresh/cierre | P0/reaches/404 |
| Metas | L/busy | Meta ausente/tabla | E0/HTTP | Sin finally de red | Refresh/cierre | P0/all-own |
| Comisiones | L/busy | Explícito; reset limitado | E0/HTTP/red | Error genérico | Estado/refresh | P0/edit-export |
| Academy | L/propios | Reset disponible | E0/reintento/rollback | Sync no acreditado | Banner/progreso | P0; progreso pendiente |
| Comunicaciones | L/despacho busy | Catálogo sin vacío claro | E0/mensajes | Capacidad no acreditada | Copy no esperado | P0; acciones pendientes |
| Reportes | L | Sin rama específica vista | E0 | Sin tratamiento local visto | Datos; periodo inerte | P0/global-export |
| Usuarios | L/busy | Explícito | E0/campos/HTTP | Sin finally de red | Refresh/cierre | P0/puedeEditar |
| Permisos | L/busy | Rol ausente por revisar | E0/HTTP | Sin finally de red | Refresh; H31 | P0/admin protegido |
| Etapas/Catálogos | L/busy | CTA insuficiente | E0/HTTP | Integral no acreditado | Refresh/cancelar | P0/puedeEditar |
| Papelera | L/busy | Explícito | E0/HTTP | Sin finally de red | Refresh | P0/puedeEditar |
| Integraciones | L | Estados de configuración | E0; último error omitido | Fallo de lectura pendiente | Capacidad consultada | P0/lectura |

No se declara ausencia global de loading/error/403. La brecha está en cada acción y región.

### Contrato propuesto para D06/D08

- **Carga:** skeleton regional, `aria-busy`, texto específico, ancho estable y doble envío bloqueado.
- **Vacío:** distinguir ausencia inicial y cero coincidencias; CTA permitido o reset.
- **Error:** mensaje humano, asociación al campo, datos conservados y foco en sección afectada.
- **Offline:** explicar imposibilidad de contactar y conservar formulario durante la sesión. Sin promesas de cola, cache o autosync.
- **Éxito:** objeto/cambio concreto, estado visible y feedback anunciado; continuidad al objeto creado.
- **Permiso:** omitir lectura no autorizada; deshabilitar acción conocida con motivo cuando ayude; 403 tras revocación sin filtrar identidades.
- **Parcial/conflicto:** recuperación por foto, distinguir duplicado/concurrencia y releer estado antes de repetir transiciones inciertas.
- **Interrupción:** cancelar no muta; advertir borrador; mantener valores entre tabs. Persistencia tras recarga requiere capacidad aprobada.

## 7. Patrón consola extraído del CMS

Referencia: `C:/Users/wilbe/Documents/QuisqueyaHome PortalWeb/src/studio/`.

| Patrón comprobado | Evidencia | Adaptación CRM |
|---|---|---|
| Sidebar agrupada y contadores | `Studio.jsx:306-337,393-410`; `studio.css:132` | Grupos por tarea; contadores autorizados, con significado |
| Migas/título/contexto | `Studio.jsx:454-485` | Migas semánticas y padre enlazable; evitar títulos duplicados |
| Búsqueda y Ctrl/⌘K | `Studio.jsx:488-499,674-675`; `CommandPalette.tsx:54-74,133-143` | Paleta de rutas permitidas; búsqueda de entidades requiere contrato |
| Héroe con tres KPI y accesos | `Overview.tsx:124-195` | Resumen por alcance/periodo; solo donde ayuda a decidir |
| Radar de atención | `Overview.tsx:199-300` | Razón, cantidad y destino concreto; sin prometer tiempo real |
| KPI con progreso/denominador | `Overview.tsx:308-388` | Cifra, periodo, meta y “sin meta” |
| Cola que abre objeto | `Overview.tsx:485-513` | Identidad/estado/motivo/acción; abrir el mismo registro |
| Tabla y fichas móviles | `ui/DataTable.tsx:44-60,155-158,245-297` | Datos/permisos equivalentes; enlace real; paginación servidor |
| Formularios por tabs | `ui/EditorTabs.jsx:5-11`; `ui/Field.tsx:50-63,90-112` | Valores conservados, errores/foco, ≤7 campos por vista |
| Feedback y tonos | `ui/tone.ts:10-27`; `ui/Bits.tsx:30-46,70-76` | Tokens semánticos CRM |
| Guarda de salida | `Studio.jsx:711-713`; `UnsavedChangesDialog.jsx` | Continuar edición o descartar |
| Carga/error regional | `Studio.jsx:274-278,705-709` | Conservar contexto; estados por región |

Offline y permisos completos del CMS no están acreditados.

### Anatomía reutilizable

1. Shell: identidad, grupos, sesión y salida.
2. Orientación: migas, título, alcance/periodo y búsqueda.
3. Cabecera de tarea: una primaria.
4. Resumen/radar solo cuando modifica la siguiente acción.
5. Filtros con resumen aplicado y limpieza.
6. Trabajo principal: tabla, lista, calendario o kanban.
7. Inspector: identidad, estado, siguiente acción y conexiones.
8. Acciones y feedback alcanzables.

```text
Inicio
  Migas / alcance / fecha                   Buscar / sesión
  Operación de hoy + tres KPI                Radar
  Cola: persona, motivo, próxima acción, Abrir
  Agenda / cartera / meta autorizada
```

```text
Ficha comercial
  Volver con filtros    Persona / responsable / etapa
  Resumen               Próxima acción
  Actividades | Intereses | Condiciones | Historial
  Requisito siguiente → campo/acción que lo resuelve
  Primaria contextual   Secundarias / Cancelar
```

### Tokens y límites de adaptación

Conservar DESIGN:

| Uso | Token/color |
|---|---|
| Canvas/superficie | `#F3F5F8` / `#FFFFFF` |
| Tinta/texto/muted | `#172036` / `#3D485F` / `#646D85` |
| Línea | `#DFE3EB` |
| Navy | `#10172D` / `#1D2B53` |
| Dorado | `#C7990E`, `#9B7300`, `#765600` |
| Fondo dorado | `#FFF6D9` |

Success/warning/danger/info siguen DESIGN. Una primaria dorada por vista; success permanece verde. Fuente única en tokens y retirada de duplicados al final de R5.

El CMS contiene gradientes, radios 24px, sombras y textos 11–12px (`Overview.tsx:102,112,204`; `Bits.tsx:9,38`; `Field.tsx:33`). Contradicen el contrato CRM. Su paleta manual y apertura de filas tampoco acreditan accesibilidad completa. Se reutiliza la anatomía, con revisión de D05/D07.

## 8. Biblioteca Viltrum: componentes concretos

Base **L**:

`E:/VILTRUM/VILTRUM DESING/pxil-ecosystem/private-library/components/`

Las fichas existen y sus metadatos fueron inspeccionados. `verified:true` almacenado no constituye revisión independiente. No se adquirió código por red.

### Fuente presente

| CMP | Archivo auténtico | Estado y uso |
|---|---|---|
| K01 | `L/shadcn_sidebar_1627.json` | Fuente presente, 23.396 caracteres; React/Radix Slot. Mantener sidebar local ya adaptado |
| K02 | `L/shadcn_dialog_1248.json` | Fuente presente, 3.702 caracteres; Radix Dialog. Usar Dialog local |
| K03 | `L/originui_calendar-[react-day-picker]_476.json` | Fuente presente, 3.883 caracteres; candidato de selección de fecha, no agenda semanal |

Licencia explícita no encontrada en fichas inspeccionadas. Fuente presente no implica aprobación o compatibilidad. K03 requiere revisión de dependencia, versión y targets; no reemplaza la agenda existente.

### Fichas sin fuente

| CMP | Archivo auténtico | Aplicación condicionada |
|---|---|---|
| K04 | `L/felipemenezes098_sidebar-nav-group_24865.json` | Grupos; usar SidebarGroup local |
| K05 | `L/felipemenezes098_complex-data-table_22177.json` | Listados; TanStack no verificado mediante fuente |
| K06 | `L/diceui_kanban-board_29221.json` | Pipeline; accesibilidad declarada, no comprobada |
| K07 | `L/shadcnspace_sheet-(different-directions)_25002.json` | Inspector; Sheet local disponible |
| K08 | `L/makviesainte_progress-metric-card_15024.json` | KPI/meta; composición pendiente |
| K09 | `L/olewandowski1_revenue-bars-chart_29223.json` | Gráficos; código/dependencias pendientes |
| K10 | `L/olewandowski1_activity-timeline_28340.json` | Historial; conservar implementación existente |
| K11 | `L/joyco_file-dropzone_19201.json` | Fotos; conservar contrato actual |
| K12 | `L/serafimcloud_empty-state_1435.json` | Vacíos; reutilizar estados locales |
| K13 | `L/isaiahbjork_sonner-toast_27363.json` | Feedback; Sonner local presente |
| K14 | `L/ephraimduncan_command-menu-with-global-search_27378.json` | Paleta; Command/cmdk local no encontrado |
| K15 | `L/originui_tabs_422.json` | Tabs; no corresponde al ID425 de DESIGN |
| K16 | `L/originui_input_173.json` | Tags indican date-range-picker; input genérico no acreditado |

No se encontró coincidencia para Search Toolbar Page Header26793 ni Calendar469. Existe una ficha Page Header with Breadcrumbs18149, pero no fue evaluada como sustituto.

Primitivas locales presentes: button, input, label, select, dialog, sheet, tabs, popover, dropdown-menu, badge, sidebar, skeleton, sonner, separator y tooltip. DataTable, Command, Calendar y Chart no fueron encontrados en `src/components/ui`.

D05/D21 deben revisar procedencia, licencia, código, dependencias y estados antes de adopción. Una composición propia no debe atribuirse a un componente 21st cuya ficha carece de fuente.

## 9. Rediseño por pantalla

Todas las recetas son propuestas. Base común: K01/K02 y primitivas locales. “Pendiente” significa ficha auténtica sin fuente.

| Vista | Jerarquía y trabajo propuesto | Componentes/límites |
|---|---|---|
| Inicio | Fecha/alcance → tres KPI → radar/cola → actividad real → secundarios | K08/K10 pendientes; datos existentes, sin ranking/SLA inventado |
| Leads | Filtros URL → filas esenciales → responsable/estado/interés → conversión y continuidad | K05/K07/K12 pendientes; Sheet/Dialog local |
| Contactos | Lista → Resumen/Notas/Historial → editar | K05/K07/K10 pendientes; relaciones solo disponibles |
| Pipeline | Moneda/alcance → filtros → siguiente acción → Resumen/Intereses/Condiciones/Historial | K06/K07/K10 pendientes; alternativa al drag; reglas intactas |
| Agenda | Fecha → cola de citas → calendario → alta contextual | Agenda existente; K03 solo fecha; horario/relaciones pendientes |
| Tareas | Vencidas/hoy → contexto → completar → seguimiento | Lista local; Agenda/Tareas como modos de M4 |
| Propiedades | Disponibilidad/rango/zona → inventario → proyecto | K05 pendiente; precios protegidos; búsqueda actual conservada |
| Proyecto/unidades | Resumen → unidades → inspector → Avances | K05/K07 pendientes; regreso con contexto |
| Avances | Proyecto/fase → Estado → Evidencia → efecto real de publicar | Tabs/Dialog; K10/K11 pendientes; sin promesa de portal |
| Brokers | Filas comparables → perfil → acciones autorizadas | K05/K07 pendientes; invitación segmentada |
| Perfil broker | Cabecera única → indicadores con periodo → Cartera/Metas | Tabs; K05/K08 pendientes; enlaces conservados |
| Metas | Periodo → logrado/meta → tabla → histórico textual | K08/K09 pendientes; sin meta no equivale a 0% |
| Comisiones | Alcance → KPI explicados → filtros → reparto/transición contextual | K05/K08 pendientes; acciones textuales; reglas intactas |
| Academy | Catálogo → material acreditado → progreso → feedback | K08/K12 pendientes; sin player/sync inventado |
| Comunicaciones | Catálogo → autoría → preview → revisión canal/destino → despacho | Tabs/Dialog/Sheet; canales reales y acciones inequívocas |
| Reportes | Periodo/fuente reales → decisiones → tablas → CSV consistente | K09 pendiente; sin filtro temporal ficticio |
| Usuarios | Lista → Identidad/acceso → Perfil → confirmar | Dialog/Tabs; K05 pendiente |
| Permisos | Rol → recursos → alcance → cambios → guardar | Select/Tabs/Dialog; admin protegido |
| Etapas/Catálogos | Lista → edición breve → feedback | Inputs locales; K12 pendiente; sin reglas por nombre |
| Papelera | Alcance real → borrados → restauración | K05/K12 pendientes; no prometer totalidad |
| Integraciones | Proveedor → capacidad/estado → diagnóstico no secreto | Badge/nota; sin añadir conectores/OAuth |

### Presupuesto de formularios

| Formulario | Máximo actual | Distribución propuesta |
|---|---:|---|
| Lead | 7 | Contacto3 + interés/origen4; puede permanecer en una vista |
| Contacto | 5–6 | Agrupación semántica, una vista |
| Condiciones de negocio | 4 | Una vista, moneda legible |
| Interés de negocio | 3 | Proyecto/unidad/principal |
| Cita/tarea | 5/4 | Una vista; contexto solo soportado |
| Proyecto | 7–8 | Datos5 + gestión2–3 |
| Unidad | 11 | Características5 + comercial6 |
| Fase | 8 | Estado5 + evidencia3 |
| Usuario broker | 8 | Identidad/acceso5 + perfil3 |
| Meta/reparto | 1 | Una vista con contexto |
| Etapa/catálogo | 4/2–3 | Edición contextual |
| Plantilla/despacho | Mezclados; conteo final pendiente | Separar autoría de envío |

Las tabs conservan valores en memoria y mantienen guardado final único. No acreditan borrador persistente ni recuperación tras recarga.

## 10. Recorridos críticos y recuperación

### FLOW-01 · Retomar y cualificar lead

**Principal propuesto:** Inicio/Leads → ficha específica → contacto/origen → responsable → contactar mediante capacidad existente → convertir → negocio concreto.

Abrir WhatsApp no acredita actividad registrada ni cumplimiento de la transición Contactado.

- Alternativas: sin teléfono, sin responsable, duplicado409, convertido o descartado.
- Error: conservar campos; diferenciar validación, permiso, duplicado y registro fuera de alcance.
- Interrupción: preservar filtros/selección URL; advertir borrador no persistente.
- Éxito: responsable/estado persistente y negocio identificable.
- Prueba: abrir el mismo lead desde Inicio; convertir una vez; continuar y recuperarse de error sin duplicar.

### FLOW-02 · Planificar y completar actividad/cita

**Principal propuesto:** negocio/contacto → actividad contextual, si está soportada → fecha/responsable → guardar → Agenda/Tareas → completar → resultado/historial.

La alta actual no expone la relación; confirmar contrato antes de prometer continuidad.

- Alternativas: seguimiento sin cita, cita externa, actividad futura u horario fuera de rejilla.
- Error: conservar campos; no afirmar guardado tras timeout.
- Interrupción: cancelar no muta; volver conserva contexto.
- Éxito: actividad visible en periodo/hora y relación correspondientes.
- Prueba: 17:00, otra semana, completar/recargar y volver al negocio.

### FLOW-03 · Seleccionar unidad y definir reserva

**Principal acreditado:** negocio → agregar interés → proyecto/unidad → principal → guardar.

Reserva comercial **no verificada**. El estado reserved no define actor, duración, documento, monto o prioridad.

- Alternativas: interés general, cambio de principal, unidad no disponible.
- Error: retirada/concurrencia/403; preservar negocio sin revelar otro cliente.
- Interrupción: cancelar selector no modifica intereses.
- Éxito actual: vínculo/principal confirmados.
- Reserva: bloqueada a definición de D01/D02.

### FLOW-04 · Preparar cierre o pérdida

**Principal propuesto:** ficha → requisitos existentes → completar condiciones/interés → etapa → resumen de efectos → confirmar → estado servidor.

- Alternativas: permanecer abierto, corregir faltante, perder con motivo, cancelar.
- Error: conservar motivo/campos; diferenciar409/403/red incierta; releer antes de repetir.
- Interrupción: recarga recupera estado servidor, no éxito supuesto.
- Éxito: etapa/fecha y efectos acreditados por backend.
- Prueba: cierre/pérdida/cancelación,409, doble pulsación y única transición.

No introducir deshacer cierre ni alterar transacción.

### FLOW-05 · Preparar comunicación

**Principal propuesto:** plantilla → autoría → preview identificado → revisión de destinatario/canal/cuerpo → acción explícita → resultado acreditado.

- Alternativas: copiar, abrir enlace externo, canal no disponible.
- Error: portapapeles denegado, despacho fallido/incierto,403 o desconexión.
- Interrupción: advertir borrador al cambiar plantilla/salir.
- Éxito: distinguir copiado, abierto, aceptado y entregado según evidencia.
- Prueba: únicamente destinos de prueba autorizados; cero envío real en esta auditoría.

### Heurísticas aplicadas

| Heurística | Aplicación concreta |
|---|---|
| Visibilidad | Busy incompleto, cierre tras error, copy prematuro |
| Lenguaje real | Centavos, reserva ambigua, simulador/despacho |
| Control/libertad | Borradores, cancelación y motivo conservado |
| Consistencia | URL/local, diálogos manuales/nativos, canal/acción |
| Prevención | Cita invisible, requisitos tardíos, ejemplo como destino |
| Reconocimiento | Volver a localizar negocio/contacto y requisitos |
| Eficiencia | Apertura por teclado, filtros, selección y paleta |
| Jerarquía | Literales/arte compiten con trabajo; datos sin secuencia |
| Recuperación | Red,409, reintento y resultado incierto |
| Ayuda contextual | Relación, próxima acción, cierre y efecto del envío |

Son hallazgos heurísticos; no resultados de pruebas de usuarios.

## 11. Plan por archivos compatible con SOLID

Plan propuesto, sin ejecución. Claude escribe código y usa git/gh; Codex prueba la vitrina.

Clasificación previa:

- **A:** composición equivalente, mismos contratos/datos/acciones.
- **B:** correcciones visibles de comportamiento; D00/Claude deben clasificarlas conforme decisión42.
- **C:** capacidades nuevas o datos no disponibles; fuera del milestone.

Ejemplos B: motivo preservado, recuperación de red, conversión→negocio, periodo inerte y revisión de despacho. Ejemplos C: búsqueda global de entidades, SLA, reserva comercial, autosave persistente, offline sync y nueva consulta temporal.

| Orden | Archivos | Trabajo y dependencia |
|---|---|---|
| 0 | Plan D00; propuesta DESIGN | Resolver roles, objetivo, componentes, estado R4/R5 y clasificación |
| R5.1 | `C/layout.tsx`, `modulos.ts`, `nav-link.tsx`; sidebar local | Grupos/orientación; preservar guardias; sin query nueva para contadores |
| Base compartida | `C/_ui/prototipo-ui.tsx`, `estados.tsx`, `cargando.tsx`; UI local | Radix, busy/error, targets, estados; reutilizar cliente existente |
| R5.2, tras R4.1 | Contactos y leads: `vista.tsx`, `inspector.tsx`, loading/error | Lista/tabla + Sheet, URL/paginación, teclado y formularios |
| R5.3, tras R4.1 | Pipeline: `vista.tsx`, `inspector.tsx`, loading/error | Kanban/lista, inspector por secciones y moneda legible |
| R5.4, tras R4.1 | Agenda, tareas, inicio, reportes: `vista.tsx` | Jerarquía, calendario/ICS, contenido honesto y periodo real |
| R5.5, tras R4.2 | Propiedades, formulario proyecto, detalle, avances | Inventario primero; segmentación; evidencia y precios protegidos |
| R5.6, tras R4.3 | Brokers, perfil, metas, comisiones | Equipo comparable, cifras textuales, Dialog financiero |
| R5.7, tras R4.3 | Configuración y paneles; academy; comunicaciones | Formularios, borradores, estados y separación preview/envío |
| R5.8, último | `tokens.css`, `globals.css`, referencias migradas | Unificar tokens, retirar legado y activar preflight según plan |

Criterios transversales: navegación estable, apertura con teclado, foco/restauración, seis estados, borrador conservado, rol/alcance correcto y acciones sin doble envío.

No añadir queries/campos en `page.tsx` para completar una receta visual. Si faltan datos/capacidades, D00 abre tarea explícita. R4.2 retira imports de schema de tipos visuales: D09 consume sus contratos, no adelanta esa migración.

No agregar TanStack, dnd-kit, cmdk o librerías de gráficos basándose en fichas vacías.

## 12. Cambios propuestos a DESIGN.md

DESIGN no fue modificado. D05 debe revisar:

1. Anatomía consola, grupos, migas y selección contextual.
2. Radar con motivo/destino; KPI con periodo, denominador y alcance.
3. Representación móvil de tablas e inspector por ancho útil.
4. Targets 44/48px, texto ≥13px, diálogo con scroll, foco y retorno.
5. Formularios ≤7 campos por segmento, conservación entre tabs y seis estados.
6. Separación entre selección documental, fuente adquirida, adaptación y revisión de biblioteca.
7. Matriz de roles ratificada; resolver Asistente/Reportes/global_metrics.
8. Moneda de presentación frente a centavos API; confirmaciones y distinción preview/despacho.

Mantener paleta/fuentes y evitar copia literal de gradientes, sombras, radios y textos pequeños del CMS. Respetar reduced-motion.

Si hace falta una decisión nueva, se añade al registro append-only; no se reescriben decisiones anteriores para presentar la propuesta como vigente.

## 13. Validación pendiente y seguridad

### Investigación pendiente

D02 debe ratificar tareas y objetivo medible. D04 debe investigar casos recientes con personas reales de los tres roles y registrar dispositivo, contexto, errores, ayuda, retrocesos y abandono.

Escenarios neutrales:

- Retomar un prospecto y preparar su siguiente paso.
- Encontrar una cita guardada.
- Explicar qué falta para cerrar.
- Preparar una comunicación y distinguir ejemplo de envío.

Comparar línea base y propuesta. No imponer porcentajes ni una muestra universal sin fundamento. Simulaciones de agentes se etiquetan como heurística.

### Pruebas para D14

Todas pendientes en vitrina publicada y verificada:

| TST | Evidencia |
|---|---|
| T01 | Lead específico, filtros/volver, conversión y cartera |
| T02 | Tab/Enter/Escape, apertura de ficha, foco/retorno, zoom200% |
| T03 | 320/390/768/1440; formas largas y nombres largos |
| T04 | Carga/vacío/error/offline/éxito/403; parcial/conflicto |
| T05 | Actividad, interés/principal, requisitos, cierre/pérdida |
| T06 | Moneda/centavos, divisas, KPI/filas, reparto, CSV |
| T07 | Admin/Asistente/Broker, own, revocación, deep links, precio/global |
| T08 | Fases/fotos/publicación, Academy, permisos/borradores |
| T09 | Preview/copy/abrir/despachar con destinos de prueba |

Reserva solo después de definición de D01. No levantar servidor ni build desde Codex. El autor autorizado realiza typecheck, lint, tests y build; cierre exige evidencia propia y commit publicado/ancestro según las reglas del proyecto.

### Seguridad del alcance

- No se modificaron tablas, rutas, schema, API, JSON del servidor ni configuración.
- En lectura estática, el shell filtra navegación; páginas inspeccionadas usan `requireScopeInPage`; detalles de proyecto/broker usan `reaches/notFound`.
- Esa estructura es positiva, pero no certifica todas las API ni RLS.
- Capacidad de acciones, ejemplo/despacho y alcance global están documentados como riesgos, sin declarar bypass.
- No se leyeron `.env`, cadenas de conexión, listas de variables, `docker inspect` ni `printenv`.
- No apareció un secreto identificado. Los metadatos de instalación contenían una referencia simbólica, sin valor de credencial.
- No existe diff de código que revisar. Seguridad funcional posterior queda pendiente de revisión independiente.

## 14. Preguntas abiertas

| Q | Decisión | Dueño |
|---|---|---|
| Q01 | Objetivo, frecuencia, dispositivos y tareas reales | D02/D04 |
| Q02 | Matriz viva y conflicto Asistente/Reportes/global; progreso/despacho | D01/D02 |
| Q03 | Horario/días y actividad contextual soportada | D01/D02 |
| Q04 | Reserva: actor, requisitos, vigencia, reversión, concurrencia | D01/D02 |
| Q05 | Divisas y significado del total pipeline | D01/D02 |
| Q06 | Canales, resultado de despacho y destinos de prueba | D01/D02 |
| Q07 | Datos de Inicio y periodo de BI | D01/D02/D00 |
| Q08 | Publicación al portal y acceso al contenido Academy | D01/D02 |
| Q09 | Meta de perfil/periodo y alcance de papelera | D01/D02 |
| Q10 | C1, estado R4/R5 y clasificación de fixes | D00/Claude |
| Q11 | Fuente, licencia, dependencias y QA de biblioteca | D05/D21 |
| Q12 | Borrador, timeout, reintento y permiso revocado | D06/D08/D07 |

## Handoff

**Destinatarios principales: D09 y D14.** D05 debe revisar independientemente el entregable D04. D07 revisa barreras; D06/D08, estados y feedback; D01/D02 resuelven preguntas; D00 conserva gates y secuencia.

**Para D09:**

1. Clasificar trabajo A/B/C con D00 antes de implementar.
2. Respetar reparto Claude/código y Codex/prueba de vitrina.
3. Consumir contratos R4 sin alterar dominio, infraestructura, schema, API o reglas.
4. Verificar código, licencia y QA de cada componente.
5. Resolver bloqueos antes de habilitar reservas, sync, búsqueda de entidades, nuevos datos o canales.

**Para D14:**

1. Confirmar commit publicado, vitrina y relevo coherente.
2. Registrar evidencia por pantalla, ancho, rol y estado.
3. Devolver H01–H32 con reproducción, evidencia y criterio de cierre.
4. No sustituir investigación con usuarios ni declarar una revisión D05 inexistente.

**Estado:** D05 pendiente; D14 pendiente; investigación con usuarios no realizada; implementación no realizada. D04 no aprueba su propio trabajo ni declara G3/C1 cumplidos.

La revisión automática rechazó escribir `.viltrum/crm-ux/D04-crm-ux-audit.md` porque la sesión tiene el sistema de archivos en solo lectura y las excepciones están deshabilitadas. El informe queda entregado en esta respuesta; su guardado en la ruta solicitada permanece pendiente.