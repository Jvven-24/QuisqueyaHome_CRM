# Expediente de evolución · Negocios (G1 · Comercial)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Autor: D21 + D03 + D05 (Claude Sonnet), solo lectura de código y web; sin cambios en `src/`.
> Reglas: misma tecnología primero; copiar o portar solo MIT / Apache-2.0 / BSD / ISC con LICENSE leído y commit fijado; AGPL/GPL solo RUN o referencia.
> Ficha vigente: `.viltrum/vre-os/spec/modulos/M03-negocios.md` (**READY**, R3). Backend cerrado en `8db9d59`/`fcf024c` y UI c1/c2 en `4668be5`. Este expediente parte de ese estado y de `evidencia/E1/negocios/D09-c1-cierre-2026-10-14.md` (sus «no cubiertos»). M03 §9 deja **«en espera»** vistas persistentes, agrupación, lotes, alta independiente, exportación, documentos y cohortes; los lotes que las tocan dicen «enmienda de M03».
> Lotes compartidos citados: `CT-3`, `CT-E`, `CT-8` (en `G1-contactos.md`), `TA-5` (en `G1-tareas.md`). Cobros y cotizaciones son de G2/G3 (`M22-cobros.md`); aquí solo se define el contrato.

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia (archivo:línea o captura) |
|---|---|---|
| Funciones | 3 | Tablero por etapas, Lista con orden en servidor, Análisis (Recharts), cambio de etapa con reglas, cierre con unidad única, pérdida con motivo y comentario, retirada de interés con motivo (`src/app/(crm)/negocios/{tablero,lista,analisis,dialogos}.tsx`; `application/pipeline/{casos-de-uso,cierre}.ts`). Sin alta directa, sin propuestas de asistente, sin nota/próxima acción desde la ficha. |
| Datos reales y reglas de negocio | 4 | Venta única durable en BD (`drizzle/0004_cierre_venta_unica.sql`, `0005_identidad_venta_durable.sql`), historial de etapas, DTO por rol que decide en el `SELECT` (`application/pipeline/consultas.ts:camposNegocios`, `proyectarNegocio`), `NegocioCambioEtapa` en outbox (`casos-de-uso.ts:182`, `cierre.ts:219`), pruebas `test:db` (135 casos según `EN-CURSO.md`). |
| Diseño y componentes | 3 | Un solo árbol (kanban en escritorio, acordeón en móvil), `Tabs`/`Dialog`/`Drawer` de shadcn, objetivos ≥48 px, texto ≥13 px con guardas (`vista-guardas.test.ts`). Pendiente medir en navegador y capturas 320/390/768/1440 (D09 cierre §3). |
| Experiencia de uso (flujos, atajos, móvil) | 3 | Menú «Mover a…» como alternativa por teclado; arrastre HTML5 apagado en móvil (`tarjeta-negocio.tsx:58`). Sin atajos, sin vistas guardadas, sin acciones masivas, sin controles de monto/fecha. |
| Calidad (pruebas, seis estados, accesibilidad) | 4 | 596 pruebas verdes según D09; `loading.tsx`, `error.tsx`, estados vacío/sin resultados/permiso/parcial/sin conexión (D09 cierre §4, CA-15). |

**Objetivo: 4 (avanzado)** en los cinco ejes; Datos ya está en 4 y debe sostenerse. Escala: 0 ausente · 1 maqueta · 2 básico · 3 completo · 4 avanzado · 5 referente.

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **Arrastre HTML5 nativo, no táctil.** `negocios/tablero.tsx:129-130` usa `onDragOver`/`onDrop` con `dataTransfer.getData("dealId")` y `tarjeta-negocio.tsx:58-59` pone `draggable` solo si no es móvil. En teléfonos y tabletas no se puede arrastrar (el acordeón móvil depende del menú «Mover a…»), no hay marcador de destino ni animación y un soltar fuera de columna no se distingue de uno fallido. `docs/DESIGN.md:144` ya eligió el kanban de Dice UI con dnd-kit.
2. **Nota y próxima acción en solo lectura.** D09 cierre §4: «no hay endpoint en `api/pipeline/**`». El corazón del seguimiento (CA-14, REQ-03-08) no se puede escribir desde la ficha; el broker debe ir a Tareas y crear una actividad suelta. `deals.next_activity_id` (`schema.ts:697`) solo lo mueve `crearActividad`.
3. **Seguimiento visible solo para administración.** La pestaña «Seguimiento» aparece «solo si el servidor entrega el historial, o sea administración» (D09 §2, fila `inspector.tsx`); no existe `consultarSeguimientoNegocio`. El broker, dueño del negocio, no ve la historia de su propio negocio.
4. **Propuestas del asistente (REQ-03-13, CA-10) sin implementar.** Los controles del asistente se ocultan con el aviso «el envío de propuestas todavía no está disponible». Grep de «propuesta» en `src/`: ninguna tabla ni caso de uso de negocios. La Decisión #47 (admin único aprueba, caduca a 7 días) no tiene código; M01 y M03 la comparten, así que conviene construirla una vez (lote `NG-4a`, que Leads reutiliza en `LD-15`).
5. **Los eventos de negocio son uno solo.** `cierre.ts:219` y `casos-de-uso.ts:182` emiten `NegocioCambioEtapa`; no hay `VentaCerrada` ni `NegocioPerdido` con identificador de venta. Cobros (`M22-cobros.md`, «Negocio ganado con unidad → plan de pagos») y Comisiones necesitan un evento explícito; hoy leerían por SQL. Además `outbox_type_check` limita los tipos (`schema.ts:~1178`), así que cualquier evento nuevo pasa por `CT-E`.
6. **Sin alta directa de negocio.** Solo nace por conversión de lead (`application/leads/conversion.ts`; D21 inventario). Una compra por referido, un cliente que llega a la oficina o un negocio de alquiler recurrente exigen inventar un lead. M03 §9 lo deja «en espera» (Q-309).
7. **Filtros a medias.** El servidor admite monto, fecha y moneda (`consultas.ts:filtrosSchema`), la vista no ofrece los controles; no existe búsqueda por texto en servidor (D09 §4). Con 184 negocios sembrados (`crm-as-is.md`) alcanza; con miles, no.
8. **Un hueco declarado por M03 y exigido por el catálogo: reserva, cotización, plan de pago.** Catálogo A4.1, A4.2, A5.1 son ESENCIALES y M03 los excluye («Fuera de M03: plan de pagos 10/40/50 y cotizaciones… reservas financieras»). El API `POST /api/cotizador/confotur` existe sin UI (D21 inventario). Sin un puente desde la ficha, el negocio no puede llegar a una promesa de venta.
9. **Estado de sincronización del espejo no se muestra** (CA-21/23 pendientes, D09 §4): el equipo no sabe si un negocio llegó a Twenty.
10. **Botón de la barra lateral de 28×28 px** (P2b de D09, fuera de los archivos permitidos): pertenece al shell, no a Negocios, pero afecta al módulo en móvil.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo (A.x) | Hoy |
|---|---|---|---|---|
| NG-F1 | Tablero con arrastre accesible (ratón, tacto, teclado), marcador de destino, rollback si el servidor rechaza | ESENCIAL | A5.1 | PARCIAL (HTML5, sin tacto) |
| NG-F2 | Nota, próxima acción y registro de contacto desde la ficha, con responsable y vencimiento | ESENCIAL | A2.5, A12.2 | AUSENTE (solo lectura) |
| NG-F3 | Línea de tiempo del negocio para su responsable (etapas, notas, actividades, mensajes) | ESENCIAL | A2.2 | PARCIAL (solo admin) |
| NG-F4 | Propuestas del asistente y aprobación por administrador (un nivel, motivo, 7 días) | ESENCIAL | A19.2 | AUSENTE |
| NG-F5 | Alta directa de negocio (referido, visita en oficina, alquiler) con contacto existente o nuevo | IMPORTANTE | A5.1 | AUSENTE |
| NG-F6 | Filtros de monto, fecha y moneda en UI, búsqueda de texto sin tildes, vistas guardadas, agrupación y selección múltiple | IMPORTANTE | A2.4 | PARCIAL (servidor sí, UI no) |
| NG-F7 | Alertas de negocio estancado y próxima acción vencida | IMPORTANTE | A2.5 | AUSENTE (hay indicador de antigüedad en la tarjeta) |
| NG-F8 | Pronóstico mensual ponderado, ciclo de venta por etapa, conversión etapa a etapa | IMPORTANTE | A13.1, A13.3 | PARCIAL (`analisis.tsx`: valor ponderado, días promedio) |
| NG-F9 | Eventos `VentaCerrada` y `NegocioPerdido` consumibles por Cobros, Comisiones y Portal | ESENCIAL | A5, A7.1, A8.2 | AUSENTE |
| NG-F10 | Puente a cotización, apartado con caducidad y plan de pago (G2) desde la ficha | ESENCIAL | A4.1, A4.2, A5.1 | AUSENTE |
| NG-F11 | Co-compradores y comprador persona jurídica en el negocio | ESENCIAL | A5.5 | AUSENTE |
| NG-F12 | Lista documental por etapa (qué falta y quién lo debe) | ESENCIAL | A17.2 | AUSENTE (M03 §9: en espera) |
| NG-F13 | Descuentos con tope por rol y aprobación de dos personas | IMPORTANTE | A4.4, A19.2 | AUSENTE |
| NG-F14 | Exportar la lista (CSV) con permiso `export` y auditoría | IMPORTANTE | A13.1 | AUSENTE |
| NG-F15 | Estado de sincronización del espejo visible | DESEABLE | A21.3 | AUSENTE |

## 4. Open source que aporta (verificado)
Verificación del 14-oct-2026 (LICENSE leído en el commit citado; npm para versiones; `commits.atom` para fechas).

| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta que aporta | Modo | Encaje con nuestro stack | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **Dice UI · Kanban** | `sadmann7/diceui` @ `040e842` (2026-10-13) | MIT (`LICENSE`, © 2024 Sadman Sakib) | React + Radix + Tailwind; usa `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | `docs/registry/bases/radix/ui/kanban.tsx` (1 136 líneas; importa `radix-ui` y `radix-ui/internal` → `useComposedRefs`, ambos presentes en `radix-ui@^1.6.7` del `package.json`) y `docs/registry/bases/radix/ui/sortable.tsx`. Responde a **NG-F1**. | PORT (un componente, cabecera de procedencia con commit) | Mismo registro shadcn/Radix que ya usamos. `DESIGN.md:144` lo eligió (id 29221). Se recolorea con tokens; hay que quitar lo que no usemos para bajar de 1 136 líneas. | M |
| **dnd-kit** | `clauderic/dnd-kit` @ `e522d9c` (2026-09-12); npm `@dnd-kit/core@6.3.1` (publicado 2024-12-05), `@dnd-kit/sortable@10.0.0`, `@dnd-kit/react@0.5.0` (pre-1.0) | MIT (`LICENSE`, © 2021 Claudéric Demers) | React ≥16.8 | Sensores `PointerSensor`, `TouchSensor`, `KeyboardSensor`, `DragOverlay`, `closestCorners` | APP (dependencia) | La línea estable `core` lleva 22 meses sin publicar; funciona con React 19 (peer `>=16.8`). **No** adoptar `@dnd-kit/react 0.5.0` todavía (API pre-1.0). | S |
| **@hello-pangea/dnd** | npm `@hello-pangea/dnd@18.0.1` | Apache-2.0 (campo `license` del registro npm; no se leyó el LICENSE del repo) | React | Listas arrastrables con teclado de fábrica; lo usa Atomic CRM para su kanban | APP (alternativa) | Más simple para columnas, pero un segundo motor de arrastre junto a dnd-kit no conviene: solo si Dice UI no se porta. | S |
| **Atomic CRM** | `marmelab/atomic-crm` @ `ec21c1c` (2026-10-13) | MIT (`LICENSE.md`) | React 19 + shadcn + Supabase; Vite + ra-core | `src/components/atomic-crm/deals/{DealListContent,DealColumn,DealCard,stages,dealUtils}.ts(x)` (organización de columnas y totales), `dashboard/{DealsPipeline,DealsChart}.tsx` (gráficas de embudo), `notes/{NoteInputs,StatusSelector}.tsx` (nota con estado), `tasks/TaskFormContent.tsx` (tarea ligada), `deals/OnlyMineInput.tsx` (filtro «solo míos»). | REF (UI atada a `ra-core`) + PORT de `dealUtils.ts` si es función pura | Sus componentes usan `useGetList`/`useRecordContext`: no se copian. Útil como lista de qué muestra una tarjeta y qué acciones ofrece. | S |
| **TanStack Virtual** | `TanStack/virtual` @ `3c61b6e` (2026-10-14); npm `3.14.19` | MIT (`LICENSE`) | React | Virtualización de columnas largas del kanban y de la lista (`useVirtualizer`) | APP | Hoy hay tope de 20 tarjetas por etapa con «Ver más» (D09 §2); Virtual solo hace falta si se quita el tope. | S |
| **TanStack Table** | `TanStack/table` @ `95c4768`; npm `@tanstack/react-table@9.3.1` | MIT (`LICENSE`) | React | Agrupación por etapa/broker, selección múltiple, columnas ocultables | APP | La lista actual (`lista.tsx`, 165 líneas) es propia con `aria-sort`; migrar solo para agrupación/selección (NG-F6). Verificar API v9. | M |
| **GoRules Zen** | `gorules/zen` @ `c8a7d89`; npm `@gorules/zen-engine@2.1.7` | MIT (`LICENSE`) | Rust + binding Node | Tablas de decisión para tope de descuento por rol y reglas de etapa editables | APP | Solo si el administrador debe editar las reglas (NG-F13). Probar binario en Windows. | M |
| **Twenty** | `twentyhq/twenty` @ `a573e84` | AGPL-3.0 + archivos comerciales (`LICENSE`) | React + NestJS | `packages/twenty-front/src/modules/{object-record,views,activities,workflow}`: tablero, vistas guardadas, línea de tiempo | REF / RUN (espejo ya decidido, `CrmPort`) | No se copia (AGPL). | — |
| **Frappe CRM** | `frappe/crm` @ `ba2a6bb` | AGPL-3.0 (`LICENSE`) | Python + Vue | Lead → Deal, vista Kanban, notas y tareas por deal | REF (ideas) | Prohibido copiar. | — |
| **Krayin CRM** | `krayin/laravel-crm` @ `f6c6d68` | MIT (`LICENSE`) | PHP / Laravel | Modelo de cotización ligada a lead/deal | REF | Otro stack. | — |
| **nuqs** | npm `nuqs@2.10.2` | MIT | Next ≥14.2 | Filtros de la bandeja en URL con tipos | APP | `negocios/page.tsx` ya valida parámetros a mano; nuqs reduce el código repetido. | S |

Riesgos: el kanban de Dice UI depende de `@dnd-kit/core` (sin publicaciones recientes); si se estanca, el plan B es `@hello-pangea/dnd`. M03 Q-313/S-313 exige procedencia antes de copiar código externo: cabecera con repositorio, ruta y commit en cada archivo portado.

## 5. Diseño y componentes a elevar
| Patrón | Componente concreto | Dónde se usa |
|---|---|---|
| Tablero accesible | `kanban.tsx` portado de Dice UI con sensores de puntero, tacto y teclado, `DragOverlay` y texto vivo `aria-live` («Movido a Negociación») | `negocios/tablero.tsx` (escritorio y también tableta) |
| Acordeón móvil | Se conserva el actual (un solo árbol, sin scroll anidado) | 320/390 |
| Nota y próxima acción | Formulario corto en la ficha: tipo (llamada, WhatsApp, visita, nota), fecha/hora, responsable; `Textarea` + menciones con `mention.tsx` de Dice UI (MIT, `docs/registry/bases/radix/ui/mention.tsx`) solo si se piden menciones | Pestaña «Seguimiento» de la ficha |
| Línea de tiempo | `timeline.tsx` de Dice UI (MIT) compartido con Contactos y Leads | Pestaña «Seguimiento» |
| Revisión de propuestas | Lista de propuestas pendientes con diferencia (antes/ahora) y botones Aprobar/Rechazar con motivo, en `Sheet` | Ficha y bandeja de administrador |
| Embudo y pronóstico | `ChartCard` + `MetricChart` ya existentes; añadir embudo de conversión etapa a etapa y barras de pronóstico mensual (ponderado vs. meta) | `negocios/analisis.tsx` |
| Chips de filtros con contador, vistas guardadas | Chips + `Popover`; selector de vista (CT-8) | `negocios/filtros.tsx` |
| Alerta de estancamiento | `Badge` con texto («Sin movimiento hace 14 días»), nunca solo color | `tarjeta-negocio.tsx` |

## 6. Comunicación con el resto (centralización)
- **Emite hoy**: `NegocioCambioEtapa` (payload `{id, stageId}`) por cambio de etapa y por cierre. **Debe emitir**: `VentaCerrada` (aggregate = `dealId`, payload `{id, unitSaleId}`), `NegocioPerdido` (`{id}`), `NegocioReabierto`, `PropuestaNegocioResuelta`. Requiere `CT-E` (ampliar `TIPOS_EVENTO_CRM` y el `CHECK`) y un `ConsumidorOutbox` por consumidor; los eventos sin consumidor deben quedar pendientes, no en cola muerta (requisito de `M22-cobros.md` §Eventos).
- **Consume**: `InteraccionRegistrada` (CT-3) para refrescar `next_activity_id` y la antigüedad; `LeadConvertido` (Leads, LD-7); `CuotaVencida` / `PagoRegistrado` (Cobros) para mostrar el estado de cuenta en la ficha; `ActividadCompletada` (Tareas).
- **Puertos que usa**: `ContactosPort` (CT-1), `AgendaPort` para programar visita desde la ficha (AG-5), `CotizacionPort` y `ReservaPort` de G2 (contratos por escribir), `CrmPort` (espejo). Ya existe `ProyectosPort`/unidades en `application/proyectos`.
- **Datos que comparte**: `deals`, `deal_properties`, `deal_stage_history`, `unit_sales`, `commissions` (Comisiones y Metas leen al cierre), `activities.deal_id` (Agenda/Tareas), `saved_views` (CT-8).
- **Reglas que se mantienen**: precio real y comisión de terceros solo admin y decididos en el `SELECT`; ninguna baja física; unidad vendida una sola vez (índice único).

## 7. Lotes asignables
Cada lote ≤ 45 min con prueba. Productor Claude; revisor de otro proveedor; D12 en R3. M03 es R3: cada lote exige `gitnexus_impact` sobre los símbolos que toque.

| Lote | Entrega verificable | Archivos permitidos | Ficha que lo habilita | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| **NG-1a** | Portar el kanban de Dice UI como `src/components/ui/kanban.tsx` con cabecera de procedencia (repo, ruta, commit `040e842`, MIT), recoloreado con tokens y recortado a lo usado; prueba de guarda de procedencia | `src/components/ui/kanban.tsx`, `package.json` (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`) | M03 CA-06/CA-17 + cierre de Q-313 (procedencia) por D03 | Sonnet | Antigravity | — |
| **NG-1b** | `tablero.tsx` usa el componente nuevo: arrastre con tacto y teclado, `DragOverlay`, rollback visual si el servidor rechaza, anuncio `aria-live`; se mantiene el menú «Mover a…»; las guardas `vista-guardas.test.ts` se actualizan sin debilitarse | `src/app/(crm)/negocios/{tablero,tarjeta-negocio,vista-guardas.test,tablero.test}.tsx/ts` | M03 CA-06/CA-17 | Sonnet | Codex | NG-1a |
| **NG-2** | `registrarSeguimientoNegocio`: nota/próxima acción/contacto desde la ficha vía `registrarInteraccion`; ruta `POST /api/pipeline/[id]/seguimiento`; actualiza `next_activity_id`; prueba de alcance (broker no escribe en negocio ajeno) | `src/application/pipeline/seguimiento.ts` y test, `src/app/api/pipeline/[id]/seguimiento/route.ts`, `src/infrastructure/contenedor/pipeline.ts` | M03 §9 «Tramo construible» (CA-14) | Sonnet | Antigravity + D12 | CT-3 |
| **NG-3** | `consultarSeguimientoNegocio(actor, id)` (etapas, notas, actividades con actor y fecha) y pestaña «Seguimiento» para broker y asistente (sin auditoría administrativa) | `src/application/pipeline/{consultas,puertos,lectura-en-memoria}.ts`, `src/infrastructure/db/repos/pipeline-lectura.ts`, `negocios/inspector.tsx` | M03 §9 «Tramo construible» (CA-14) | Sonnet | Antigravity | NG-2 |
| **NG-4a** | Propuestas del asistente (R3): migración `change_proposals` (recurso, versión, payload, autor, estado, caduca a 7 días) con RLS; `proponerCambio`, `resolverPropuesta` (admin distinto del autor, motivo, revalida versión); evento `PropuestaNegocioResuelta`. Compartible con Leads (`LD-15`) | `schema.ts`, `drizzle/0011_*.sql`, `src/application/propuestas/**`, `src/app/api/propuestas/**`, `scripts/test-db/**` | M03 §9 (CA-10, REQ-03-13; Decisión #47) | Sonnet | Antigravity + D12 | CT-E |
| **NG-4b** | Interfaz: «Proponer cambio» para el asistente y «Revisión de propuestas» para administrador | `negocios/{inspector,propuestas}.tsx` | M03 §9 (CA-10) | Haiku | Codex | NG-4a |
| **NG-5a** | Búsqueda por texto en servidor (contacto, proyecto, unidad, título) sin tildes y filtros `montoMin`, `montoMax`, `desde`, `hasta` expuestos por URL | `src/application/pipeline/consultas.ts`, `repos/pipeline-lectura.ts`, `negocios/page.tsx` | M03 §3 (CA-05) | Sonnet | Antigravity | CT-11 (migración de `unaccent`) |
| **NG-5b** | Controles de monto, fecha, moneda y búsqueda en `filtros.tsx` con `nuqs` | `negocios/filtros.tsx`, `package.json` | M03 CA-05/CA-16 | Haiku | Codex | NG-5a |
| **NG-6** | Eventos `VentaCerrada` y `NegocioPerdido` con `unitSaleId`, en la misma transacción del cierre; esquema en `consumidores.ts`; prueba `test:db` | `src/application/pipeline/cierre.ts`, `src/application/compartido/crm.ts`, `consumidores.ts`, `scripts/test-db/cierre.ts` | M03 CA-20…23 (outbox) | Sonnet | Antigravity + D12 | CT-E |
| **NG-7** | Alertas: negocio sin movimiento hace N días y próxima acción vencida (N configurable), emitidas como `RecordatorioVencido` | `src/domain/estancamiento.ts` y test, `repos/pipeline-lectura.ts`, `tarjeta-negocio.tsx` | Ficha «Alertas y recordatorios» | Sonnet | Codex | TA-5 |
| **NG-8** | Análisis: pronóstico mensual ponderado vs. meta, ciclo por etapa y embudo de conversión etapa a etapa con tabla alterna | `src/application/pipeline/consultas.ts` (consulta nueva), `negocios/analisis.tsx`, `logica.ts` y test | M03 §7 / §9 «cohortes: en espera» (enmienda) | Sonnet | Codex | — |
| **NG-9** | Exportar CSV de la lista filtrada con `export` y auditoría | `src/app/api/pipeline/export/route.ts`, `src/application/pipeline/exportar.ts` | Enmienda de M03 §9 (Q-309) | Haiku | Codex | — |
| **NG-10** | `crearNegocio` directo: selector de contacto con `Command`, proyecto, responsable; mismas reglas de asignación y evento | `src/application/pipeline/casos-de-uso.ts`, `src/app/api/pipeline/route.ts`, `negocios/dialogos.tsx` | Enmienda de M03 §9 (alta independiente) | Sonnet | Antigravity + D12 | CT-1 |
| **NG-11** | Vistas guardadas, agrupación por etapa/broker y selección múltiple (mover, asignar) | `negocios/{vista,lista,vistas}.tsx` | Enmienda de M03 §9 (Q-308/Q-309) | Sonnet | Codex | CT-8 |
| **NG-12** | Estado de sincronización del espejo en la ficha (`consultarEstadoSincronizacionNegocio`) | `src/application/pipeline/consultas.ts`, `repos/pipeline-lectura.ts`, `inspector.tsx` | M03 CA-21/23 | Haiku | Codex | — |
| **NG-13** | Puente a G2 desde la ficha: «Cotizar», «Apartar» (botón y contrato de puerto; sin lógica) | `negocios/inspector.tsx`, `src/application/pipeline/puertos.ts` | Fichas G2 (cotizaciones, reservas) | Haiku | Codex | fichas G2 |

## 8. No verificado
- La UI de Negocios **no se vio en navegador**: D09 declara pendientes la medición de `.deal-card`, los 48 px y las capturas 320/390/768/1440; este expediente no las repitió.
- Que `kanban.tsx` de Dice UI compile contra nuestras versiones (`radix-ui@^1.6.7`, React 19, Tailwind 4): se verificó la existencia del archivo y sus importaciones, no se compiló.
- Licencia del repo de `@hello-pangea/dnd`: se leyó solo el campo `license` de npm.
- `@dnd-kit/core` no se publica desde diciembre de 2024: no se comprobó si hay incidencias abiertas con React 19.
- Q-313/S-313 (adquisición de código de interfaz externo) sigue abierta en M03; D03 debe cerrarla antes de `NG-1a`.
- Qué cuenta realmente como «estancado» para el negocio no está definido (sin cifra firmada): `NG-7` lo deja configurable.
- El impacto GitNexus de tocar `cierre.ts` y `casos-de-uso.ts` no se calculó (el índice se reportó desactualizado en D09 §2); cada lote debe correrlo.
