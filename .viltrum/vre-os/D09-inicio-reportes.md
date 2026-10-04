# D09 · Inicio y Reportes

Fecha: 04/10/2026. Despacho: `20261004T205003Z-D09-codex`, tarea `T-W3-D09`.
Estado: implementación acotada entregada para revisión independiente; **sin aprobación ni cierre de issue**.

## Mandato y fuentes

Clasificación: `CAMBIO_UI` y corrección de defectos, CRM/ERP, riesgo del proyecto R3, perfil D09, revisor D14 de otro proveedor. C1 consta activo en `.viltrum/commercial.md`; autorización de construcción en TAREA y decisiones #43/#44. Se leyó completo PERFIL y `skills/patron-consola/SKILL.md` del despacho; también DESIGN, contexto de arquitectura/convenciones/seguridad, relevo, routing y metodología PXIL.

La especificación `.viltrum/vre-os/D05-graficas-movil.md` **no existe en este worktree**. Se leyó completa su copia de `C:/Users/wilbe/Documents/QuisqueyaHome_CRM/.viltrum/vre-os/D05-graficas-movil.md`. SHA256 de esa copia: `746C75C59F2ADC92C7E765B8984F17C93211CB34E2F001E85C4FC56AB3D06C63`.

`b376aad` es la referencia de D10 indicada por la tarea; no se verificó HEAD, ancestro ni remoto. No se ejecutó git, commit, push, migración, despliegue, `npm run dev` ni `npm run build`. `.next` no existe después de la verificación. No se abrieron subagentes ni se atribuye revisión independiente a estas comprobaciones de productor.

Versiones verificadas en paquetes instalados: Next 15.5.24, React 19.2.8, Recharts 3.8.0, Radix UI 1.6.7 y Vaul 1.1.2. Esos paquetes declaran MIT. Vaul se reutiliza mediante `drawer.tsx`, sin instalar dependencias. Los comandos locales usan Node 24.18.0.

GitNexus: consultas de flujos Inicio/Reportes y análisis upstream previos de `InicioVista`, `ReportesVista`, `exportarCsv`, ambas páginas y `MobileDock`. Resultado: LOW, 0 callers/procesos registrados. La inspección local sí identifica las páginas como consumidoras de las vistas y el layout como consumidor del dock: el cero del índice no acredita aislamiento total. Las cuatro rutas `loading/error` no fueron encontradas por el índice; su impacto gráfico queda **no verificado**, aunque se comprobaron compilación y consumo directo por App Router.

## Cambios y decisiones de diseño

- Inicio: cinco KPI comerciales con periodo/unidad y alcance; variante operativa para asistente; variante de cartera/meta para broker. Pipeline conserva el importe preformateado del contrato. La tarjeta financiera ocupa más ancho en escritorio para evitar partir cifras. Carrusel local en móvil.
- Inicio: tabs Resumen, Embudo y Agenda. Leads enlazan al inspector existente `?lead=<id>`. Se denominan **leads recientes**, porque D10 no entrega una cola priorizada. Agenda mantiene las fechas reales y hora de Santo Domingo. Los proyectos del dashboard no incluyen slug: su acceso lleva al catálogo existente, sin inventar una ruta por id.
- Reportes: nueve tabs de Radix, navegación por flechas y foco visible. Solo se monta la gráfica de la pestaña activa; Recharts carga bajo demanda mediante `next/dynamic`.
- Cabecera de Reportes separada de los filtros. Barra propia en escritorio; hoja inferior Vaul en móvil con handle 36×4, radio 20 px, header/footer sticky, scroll local, labels persistentes y targets de 48 px. Se mantienen fecha, proyecto y broker como parámetros GET y la pestaña al aplicar/limpiar filtros.
- Proyecto se elige por nombre. Se reutiliza la consulta existente del dashboard, solo cuando el servidor concede `dashboard:view`; se envían a la vista únicamente ids/nombres de los proyectos de demanda. No se escribió SQL nuevo ni se modificaron consultas/casos de uso. **La lista es parcial**, porque ese puerto limita los proyectos. Brokers se eligen entre los agregados visibles de la consulta actual; también es una lista parcial. Un filtro seleccionado que ya no aparece conserva su valor sin revelar su código en pantalla.
- Dona de canales y tabla de ROI en escritorio; tarjetas de valores en móvil. Tendencia apilada mantiene los 18 meses del contrato y aclara que los eventos no equivalen a personas únicas. Inventario apila los conteos de estados recibidos en una barra agregada; no inventa un desglose por proyecto.
- Gráficas: ejes, tooltip, leyenda con botones que aíslan/restauran series, resumen textual y alternativa de valores. Identidad separada de nombre visible: stageId, sourceId, zoneId, reasonId, brokerId, mes o estado. Se corrigieron las keys basadas en nombre; tampoco se usa el nombre como categoría interna de Recharts.
- Dinero de Reportes/tooltip/alternativas pasa por `src/lib/formato-analitica.ts`, con una instancia de `Intl.NumberFormat("es-DO", { style: "currency", currency: "USD" })`. No se cambió el formateo ya producido por los puertos del backend.
- CSV del embudo conserva `generarCsv` y el chequeo de permiso recibido del servidor. Añade feedback persistente accesible, recuperación ante fallo y liberación del Object URL. Se mantiene como exportación del embudo, sin prometer exportar todas las pestañas.
- Dock: conserva cinco accesos; superficie sólida, sin desenfoque ni gradiente; buscador y cierre de menú de 48 px; etiquetas de 13 px; safe areas; se retiraron los códigos de módulo y el texto dorado sobre superficie blanca. No se rehízo la lógica del menú/paleta compartidos.
- Los textos nuevos se centralizan en `_ui/analitica-copy.ts`. No se encontró runtime i18n oficial en este repositorio. El catálogo es de idioma actual es-DO; **no acredita soporte multilingüe** ni corrige los textos incrustados de otros módulos.

### Componentes y P0

| Referencia D05 | Procedencia comprobada | Uso en esta entrega |
|---|---|---|
| 28770 · App Dashboard Layout | 21st, shadcnstore, `metadata_imported` | Referencia de composición; no código importado |
| 2503 · Weekly KPI Chart | 21st, isaiahbjork, `metadata_imported` | Referencia de densidad KPI; no gradientes/animaciones del candidato |
| 11641 · Tabs | 21st, coss.com, `metadata_imported` | Referencia visual; se implementa con las tabs Radix existentes |
| 25002 · Sheet | 21st, shadcnspace, `metadata_imported` | Referencia de hoja; se reutiliza Drawer Vaul existente |

Las cuatro fichas se leyeron en `.viltrum/design/components/` del repositorio principal. No incluyen fuente ni licencia verificable: **no se declara adquirido/integrado su código**. No se copiaron librerías de otro sistema de primitivas.

Evaluación D09 de integración, escala 1–5 (criterio de selección, no medición de calidad): primitivas existentes 5 por compatibilidad/ausencia de dependencias nuevas; candidatos con solo metadatos 1 por falta de fuente/licencia; wrapper ChartCard propio 4 porque la tarea exige los seis estados y no había un wrapper equivalente. Se reutilizan `ChartContainer/ChartTooltipContent`, Recharts, Tabs y Drawer; únicamente se construyen envolventes de presentación y adaptación de datos.

Documentación técnica consultada: [Recharts API](https://recharts.github.io/en-US/api/), [Radix Tabs](https://www.radix-ui.com/primitives/docs/components/tabs).

## Paleta y contraste

Medición mediante luminancia relativa sRGB y `(Lclaro + .05) / (Loscuro + .05)`, contra `surface = #FFFFFF`. Salida real:

```text
chart-1 #765600 6.77:1
chart-2 #1d2b53 13.79:1
chart-3 #315f8c 6.67:1
chart-4 #16734a 5.86:1
chart-5 #66558c 6.48:1
chart-6 #a13f43 6.35:1
```

Las seis variables superan 4,5:1 contra blanco. `chart-1` es dorado oscuro y se reserva a la serie principal financiera o primer segmento de la dona. El texto/las cifras usan tinta/navy, no dorado sobre blanco. La línea de cada área mantiene color opaco; el relleno translúcido es secundario. Estos ratios de tokens no son una declaración de conformidad WCAG de la pantalla completa.

## Mapa gráfica → consulta

| Pantalla/región | Consulta existente | Campos del contrato / presentación |
|---|---|---|
| Inicio KPI | `consultarDashboard` → `obtenerMetricasDashboard` | leadsMesCount, negociosActivosCount, volumenPipelineDisplay, cierresMesCount, conversionPorcentaje; variante de asistente/cartera |
| Inicio embudo | misma consulta | funnel.stageId, reachedCount, count, passRatePercent; barras horizontales y detalle |
| Inicio agenda/leads/demanda | misma consulta | activities, leadsRecientes, projects; listas reales |
| Reportes embudo | `consultarReportesBi` → `obtenerMetricasBi` | funnel, totalLeads/totalDeals; tasa de paso recibida |
| Canales | misma consulta | sources.sourceId/count/revenueCents/spendCents/roiPercent; dona y ROI |
| Tendencia | misma consulta | trend.month/leads/deals/won; área apilada |
| Zonas | misma consulta | zones.zoneId/count; barras |
| Brokers | misma consulta | brokerId/volumeCents/won/conversionPercent; ranking |
| Velocidad | misma consulta | velocity.sampleSize/medianDays/p75Days; resumen, sin histograma ficticio |
| Inventario | misma consulta | inventory.state/count/medianAgeDays/p75AgeDays; barra apilada y edades |
| Comisiones | misma consulta | commissions.month/brokerCents/agencyCents/paidCents; barras agrupadas |
| Pronóstico | misma consulta | projection.points.amountCents, totalWeightedCents, confidenceEstimated y faltantes; línea, sin intervalo inventado |
| Filtros | `leerFiltros` → ambas consultas | desde/hasta/projectId/brokerId; validación Zod existente y consultas filtradas del servidor |

## Estados, datos y seguridad

| Estado | Implementación | Evidencia / límite |
|---|---|---|
| Carga | ChartCard skeleton, `aria-busy`, loading de ruta y carga diferida | Prueba aislada y typecheck; navegación real de Next pendiente |
| Vacío | Rama explícita y acción permitida/limpiar filtros | Prueba aislada; datos vacíos reales por rol pendientes |
| Error | Error de ruta con mensaje público y reintento | Prueba aislada; fallo del backend real pendiente |
| Offline | Suscripción online/offline; conserva props de última consulta en memoria | Verificado en Chromium; no persistencia ni cola offline |
| Éxito | Gráfica/lista con valores y feedback CSV persistente | Capturas/recorrido aislado; descarga CSV real pendiente |
| Permiso | Estado ChartCard oculta contenido; páginas mantienen guard servidor | Prueba aislada; 403/revocación reales pendientes |

Estado servidor: props de RSC; no store global ni copia persistida. Estado local: tab, aislamiento de serie, edición del filtro y feedback de exportación. Reportes se remonta por identidad y asOf; Inicio por identidad. Filtros hacen navegación GET completa, sin mutación ni concurrencia de fetch propia. No se agregó caché de datos compartida entre usuarios. Cambio de tenant/sesión, caducidad y solicitudes reales fuera de orden **no verificados**. Conflicto/submit de escritura no aplican a estas pantallas de lectura.

Checklist §6 de `docs/contexto/flujo-de-trabajo.md`, inspección de los archivos tocados:

- Bien: `inicio/page.tsx:10` y `reportes/page.tsx:13` resuelven actor; las líneas 11 y 14 comprueban scope antes de consultar. Los adapters con visibleRows permanecen intactos; pruebas de alcance/RLS/permisos pasan.
- Bien: `inicio/page.tsx:14` decide permisos en servidor; ocultar UI no sustituye esa autorización. `reportes/page.tsx:17` cierra la lectura adicional del dashboard si el alcance es none.
- Bien: `reportes/vista.tsx:56` usa `generarCsv`, que neutraliza fórmulas; no introduce un serializador CSV paralelo.
- Bien: React renderiza nombres/etiquetas como texto; no se agregó HTML de usuario. `chart.tsx:94` tiene un `dangerouslySetInnerHTML` **preexistente** para CSS de configuración: los nuevos consumidores usan claves de serie propias y colores `var(--chart-N)`; los nombres de datos no se interpolan como CSS.
- Bien: sin secretos, lectura de .env, cadenas de conexión, almacenamiento local de datos personales ni nuevos SDK privilegiados en las vistas. Las fixtures del verificador son explícitamente sintéticas. No se imprimió ni guardó ninguna credencial.
- No aplica: nuevas tablas/RLS/migraciones, nuevas rutas API, cuerpos JSON, uploads o redirecciones suministradas por usuario: no se añadieron.
- Pendiente de revisión: exportación ya concedida en props ante revocación posterior de sesión/permiso; el cambio conserva el modelo CSV cliente existente y no acredita reautorización al descargar. D14/D12 deben comprobar ese escenario.

No se identificó una vulnerabilidad nueva explotable en los archivos modificados durante esta inspección. No es una aprobación independiente de seguridad.

## Pruebas

Los comandos se ejecutaron en este worktree. `.cmd` es la variante equivalente en Windows: los wrappers `.ps1` fueron bloqueados por la política de firma. No se cambió esa política. `.next/types` no existe; no se ocultaron diagnósticos del compilador.

### TypeScript

```text
npx.cmd tsc --noEmit --incremental false
[sin salida]
exit_code: 0
```

### Lint

```text
> quisqueya-home-crm@0.1.0 lint
> eslint .
✖ 12 problems (0 errors, 12 warnings)
exit_code: 0
```

Advertencias en `scripts/seed/generator.ts:42`, `scripts/seed_local_crm.mjs:41/57/86`, `_ui/crm-header.tsx:38`, `_ui/crm-sidebar-menu.tsx:6`, `comisiones/vista.tsx:12/300`, `leads/vista.tsx:57`, `propiedades/vista.tsx:11` (dos), `login/page.tsx:17`. Todas están fuera de los archivos modificados; no se corrigieron fuera de alcance.

### Suite completa — salida real, extracto final

```text
> quisqueya-home-crm@0.1.0 test
> node --test "src/**/*.test.ts"
✔ Inicio y Reportes: guarda anti-hardcode lee las dos vistas y los dos repositorios (71.9584ms)
✔ guarda anti-hardcode: mutación de cada fuente rechazada, incluidos ceros y arrays primitivos (117.3042ms)
✔ formato USD: utiliza centavos y distingue un cero real (2.4722ms)
✔ ChartCard aislado: estado loading (16.6164ms)
✔ ChartCard aislado: estado empty (1.5931ms)
✔ ChartCard aislado: estado error (1.2664ms)
✔ ChartCard aislado: estado offline (1.0119ms)
✔ ChartCard aislado: estado success (0.6208ms)
✔ ChartCard aislado: estado permission (0.6936ms)
ℹ tests 485
ℹ suites 0
ℹ pass 485
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3333.4325
exit_code: 0
```

La guarda AST lee ambas vistas y ambos repositorios. Rechaza filas con valores numéricos literales, filas anidadas y arrays numéricos identificados como datasets. Se prueban 16 mutaciones virtuales (cuatro por fuente). Su alcance es esta forma sintáctica de hardcode; no pretende demostrar que cualquier valor futuro de toda la aplicación tenga origen real.

También se introdujo temporalmente un dataset literal en `inicio/vista.tsx`, se ejecutó la guarda y se restauró el archivo en `finally`. Salida real de la mutación en disco:

```text
✖ Inicio y Reportes: guarda anti-hardcode lee las dos vistas y los dos repositorios
ℹ tests 1
ℹ pass 0
ℹ fail 1
AssertionError [ERR_ASSERTION]: src/app/(crm)/inicio/vista.tsx
+ [ 'src/app/(crm)/inicio/vista.tsx:71' ]
- []
MUTACION RECHAZADA: exit 1 observado
```

La suite posterior volvió a 485/485, con el dataset mutante retirado.

### Navegador aislado — salida real

```text
node "src/app/(crm)/_ui/analytics-browser-check.mjs"
inicio 320px: 3 tabs, sin overflow global, teclado OK
reportes 320px: 9 tabs, sin overflow global, teclado OK
inicio 390px: 3 tabs, sin overflow global, teclado OK
reportes 390px: 9 tabs, sin overflow global, teclado OK
inicio 768px: 3 tabs, sin overflow global, teclado OK
reportes 768px: 9 tabs, sin overflow global, teclado OK
inicio 1440px: 3 tabs, sin overflow global, teclado OK
reportes 1440px: 9 tabs, sin overflow global, teclado OK
Offline: aviso visible y datos recibidos conservados
Consola: 0 errores con nombres de etapas, zonas y canales duplicados
exit_code: 0
```

Verificador con Chromium/Playwright instalado localmente. Bundles/CSS y servidor HTTP efímero solo en memoria, cierre al terminar, sin Next dev/build. Reutiliza los componentes actuales, incluido MobileDock, pero sustituye Link/dynamic/navigation de Next con adaptadores de fixture. Dataset explícitamente sintético, nombres largos, etapas/zonas/canales con nombres duplicados, viewport altura 900 px, fuentes fallback. No contiene personas ni importes reales del CRM.

Se visitan todas las tabs a cada ancho; flecha derecha cambia de pestaña; leyenda aísla/restaura series; hoja móvil abre/cierra y devuelve foco; fecha admite edición; dock conserva cinco accesos de al menos 48×48; documento no desborda horizontalmente (el harness desactiva el overflow-x hidden legado para no ocultarlo). La primera aserción de foco fue demasiado inmediata: se corrigió el verificador para esperar el estado de Radix; después pasó.

Estas pruebas no acreditan filtrado SQL efectivo, roles reales, descarga, tipografías next/font, shell completo, zoom/lector de pantalla, safe area de hardware iOS o rendimiento de la ruta desplegada. El verificador usa esbuild/postcss/Playwright disponibles localmente; no se añadieron a las dependencias del proyecto ni se exige este harness en CI.

### Capturas

Capturas de éxito aislado con datos sintéticos: Inicio/Embudo y Reportes/Canales. No son capturas de producción ni de todos los estados.

| Ancho | Inicio | Reportes |
|---|---|---|
| 320 | [Inicio](<../../src/app/(crm)/_ui/evidencia-d09/inicio-320.png>) | [Reportes](<../../src/app/(crm)/_ui/evidencia-d09/reportes-320.png>) |
| 390 | [Inicio](<../../src/app/(crm)/_ui/evidencia-d09/inicio-390.png>) | [Reportes](<../../src/app/(crm)/_ui/evidencia-d09/reportes-390.png>) |
| 768 | [Inicio](<../../src/app/(crm)/_ui/evidencia-d09/inicio-768.png>) | [Reportes](<../../src/app/(crm)/_ui/evidencia-d09/reportes-768.png>) |
| 1440 | [Inicio](<../../src/app/(crm)/_ui/evidencia-d09/inicio-1440.png>) | [Reportes](<../../src/app/(crm)/_ui/evidencia-d09/reportes-1440.png>) |

SHA256 finales:

```text
inicio-1440.png   82018A5A629F9F369576463C2C5FAAAEDB091876641A558BC3D848ACD823E3EA
inicio-320.png    72D31C02E3E7EE1A6F89297435CD433F5F9DAFE84C0A38FD6FFA00BDD4656BE1
inicio-390.png    601815A5F0B0FA07F27044D6D085D94F0C60B0402F6A65B99A38A49304363BE9
inicio-768.png    4D134B4945B89662428B5BC55CBE2A8568D993C133AAF29079D63F7D4BBED935
reportes-1440.png CF41E30ACD9EAC4E172D16E075E396CF80F50249320F6EB621ADE7E1A632CC30
reportes-320.png  05550520E946BE8EDE050F0FDE5CB0BA251B34EB3F9120EF3B4EBB2F311296B0
reportes-390.png  398DF25A791D08F0D75F52D642648939D221971A0F74BDC4A35F0C9A3B0519A7
reportes-768.png  AD3FC094B44789D21DFE0C27E4BBD5BAC9CA044EA3D3932B11E59A7D31E825FC
```

## Límites y solicitudes para D10/D03/D08

1. Comparación de KPI contra periodo anterior: **no disponible** en DashboardMetrics. No se muestran flechas ni porcentajes ficticios; se informa la ausencia. Se necesita contrato de valor anterior/tendencia y periodos comparables.
2. Pronóstico: no hay límites inferior/superior ni metodología de intervalo de confianza. `confidenceEstimated` es ponderación, no banda estadística. Se muestra línea real y limitación; la banda queda pendiente de D10.
3. Velocidad: hay mediana, p75 y tamaño de muestra; no distribución ni bins. Se muestra el resumen. Histograma/boxplot quedan pendientes de contrato.
4. Filtros: catálogo completo de proyectos y brokers con ids/nombres/alcance está pendiente. La reutilización del dashboard agrega una consulta completa aunque solo se necesiten proyectos; D10 debe ofrecer un puerto de opciones mínimo. El broker selector actual se estrecha con los filtros: limpiar filtros recupera las opciones con actividad.
5. Priorización de leads: no existe motivo/categoría de atención en el puerto. La vista muestra la lista reciente y su próxima acción; no inventa alertas/SLA.
6. Dashboard recibe dinero ya formateado y meta como texto. Unificar moneda con backend y distinguir meta ausente mediante un campo explícito requiere ampliar contratos fuera de esta tarea.
7. Sistema oficial multilingüe, copy aprobado por D08 y matriz formal completa D06 del nuevo recorrido: no se hallaron artefactos específicos adicionales en el despacho. Se centralizó el copy derivado de la tarea/D05; requiere revisión D08, sin declarar esas aprobaciones.

## Archivos de entrega

- `src/app/(crm)/inicio/{page,vista,loading,error}.tsx`.
- `src/app/(crm)/reportes/{page,vista,loading,error}.tsx` y `filtros-vista.tsx`.
- `src/app/(crm)/_ui/analitica-copy.ts`, `analytics-state.ts`, `analytics-tabs.tsx`, `analytics-details.tsx`, `metric-chart.tsx`, `mobile-dock.tsx`, `analitica.test.ts`, `analytics-browser-check.mjs` y ocho PNG en `evidencia-d09/`.
- `src/components/ui/chart-card.tsx`, `src/app/tokens.css`, `src/lib/formato-analitica.ts` y este informe.

No se editaron `src/application/**`, `src/infrastructure/**`, `package.json`, lockfile, configuración TS, R_RELEVO ni decisiones. El productor entrega archivos de worktree; el orquestador genera/aplica el parche mediante su flujo autorizado.

## Handoff

**D14 de otro proveedor** recibe esta implementación para revisión; D09 no la aprueba. Antes de cerrar, integrar el parche en el entorno aislado autorizado y verificar el build, el shell real y los recorridos con admin/broker/asistente. Repetir typecheck/lint/test, filtros fecha/proyecto/broker contra consultas reales, vacíos, error recuperable, offline, permisos/revocación, CSV y nombres duplicados. Capturar 320/390/768/1440 con el shell completo; añadir 430/1024 del contrato del perfil. Verificar la altura de scroll por tab y que el dock no tape acciones/foco, incluida su paleta/menú preexistentes.

**D07**: lector de pantalla, zoom/reflow, contraste de la composición completa, tooltip/leyenda por teclado, foco de hoja, targets y safe areas. No se declara WCAG AA de la aplicación a partir de estas capturas.

**D15**: medir bundle de rutas, carga diferida, tiempos de consultas y coste de la lectura adicional para opciones en el entorno real. No hay medición de campo/presupuesto acreditado.

**D10/D03/D08/D06**: resolver los siete límites de contrato/contenido anteriores. La tendencia anterior, la banda estadística y el histograma **no están implementados por falta de datos**. No aprobar esos requisitos por el aspecto visual de las gráficas disponibles. El revisor decide aceptación parcial o devuelve el trabajo con las entradas faltantes; no se cerró ningún gate/issue ni se publicó esta entrega.
