# Luna-ui

## Propósito
Unificar la interfaz del CRM con una sola gramática visual Viltrum (marfil, oro y navy) y unas mismas reglas de accesibilidad: controles táctiles de al menos 44 px, foco visible, contraste AA, movimiento reducido y semántica correcta. No es una pantalla ni un módulo de negocio: es el frente de trabajo de UI de la Etapa 2 (ficha G22) que corrige y comparte piezas usadas por todas las vistas, sin cambiar rutas, datos, permisos ni migraciones. Su objetivo es que un checkbox, un acordeón, una pestaña o un aviso se comporten igual en cualquier módulo y que las vistas resistan de 320 a 1440 px.

Código de referencia: **no existe `app/(crm)/luna-ui/` ni una ruta `/luna-ui`**. El trabajo vive en `src/components/ui/` (`checkbox.tsx`, `radio-group.tsx`, `switch.tsx`, `accordion.tsx`, `collapsible.tsx`, `data-table.tsx`, `sonner.tsx`), en `src/components/modulo/` (`page-header.tsx`, `module-tabs.tsx`, `section.tsx`) y en las vistas `src/app/(crm)/**` que consumen esas piezas. Pruebas: `src/components/ui/controles-seleccion.test.ts`, `src/components/ui/expansivos.test.ts`, `src/components/modulo/module-tabs.test.ts` y `src/app/(crm)/_ui/contraste-tactil.test.ts`.

## Rutas y alcance
- **Sin ruta propia.** `/luna-ui` no existe en `src/app/(crm)` ni en el menú; el módulo es transversal.
- **Rutas afectadas:** todas las de `src/app/(crm)/` salvo `tareas/**` y los archivos de auth, login y correo (alcance fijado por G22). En la práctica toca `/negocios` (`herramientas.tsx`, `analisis.tsx`), `/propiedades`, `/configuracion`, `/reportes`, `/agenda`, `/brokers`, `/academy`, `/reservas`, `/contactos`, `/documentos`, `/comunicaciones` y `/leads`; `/metas` entra en el alcance de G22 (Bento/Awards), aún pendiente.
- **Fuera de alcance:** `src/app/api/**`, esquema Drizzle, migraciones, RLS, reglas de negocio y despliegue. G22 lo dice expresamente: «sin cambios de rutas, datos, permisos ni migraciones».
- **Superficie compartida:** `src/components/ui/**`, `src/components/modulo/**`, `src/app/globals.css` y los tokens de Viltrum Design.

## Roles y permisos
- No define recursos RBAC propios (`luna_ui:*` no existe). Cada pantalla conserva su `requireScopeInPage` y sus recursos (`leads:*`, `deals:*`, `reports:view`, etc.).
- Los componentes no conceden acceso: ocultar o deshabilitar un control es solo presentación; la autorización real sigue en el servidor.
- Todos los roles (admin, manager, assistant, broker) ven los mismos controles; lo que cambia es el permiso de la vista que los monta (por ejemplo, exportar en Negocios o editar en Configuración).
- La matriz RBAC de Configuración solo se vuelve más legible y táctil; no altera qué permiso tiene cada rol.
- Los avisos (toasts) no deben revelar datos que el rol no puede ver; se limitan a confirmar la acción ya autorizada.

## Entidades y tablas
- **Sin tablas ni migraciones.** No hay entidades `luna_ui_*` ni columnas nuevas.
- **Estado efímero en cliente:** selección de filas en `DataTable`, pestaña activa en `ModuleTabs`, estado abierto/cerrado de `Accordion`/`Collapsible`, preferencias de columnas y vistas guardadas en `localStorage` (`negocios-vistas`).
- **Tokens y estilos:** `src/app/globals.css` y `tokens.css` (Viltrum Design v2.1). Paleta semántica: `navy-900`, `navy-950`, `gold-600`, `gold-700`, `surface`, `line`, `ink-muted`, `ink-secondary`. Keyframes `accordion-down` y `accordion-up`.
- **Dependencias de UI:** `radix-ui` (Checkbox, RadioGroup, Switch, Accordion, Collapsible), `lucide-react` (iconos), `sonner` (toasts), `tailwind-merge`/`clsx` (`cn`).

## Flujos principales
1. **Selección unificada.** Checkbox, radio y switch usan Radix y un objetivo táctil de 44 px (`size-11`) con control visible de 17–18 px. Admiten `checked`, `disabled` e `indeterminate`, foco con anillo oro (`focus-visible:ring-2 ring-gold-700`) y `onCheckedChange` tipado a booleano.
2. **Selección parcial en tablas.** `DataTable` calcula `algunasMarcadas` y pasa `"indeterminate"` al checkbox de cabecera; el usuario ve que la selección de la página es parcial.
3. **Expansivos.** `Accordion` y `Collapsible` delegan teclado y `aria-expanded` a Radix; el disparador tiene `min-h-12`, el contenido anima 180–200 ms y respeta `motion-reduce`. Sustituyen `<details>` y bloques plegados ad-hoc.
4. **Cabecera y pestañas.** `PageHeader` concentra breadcrumb, eyebrow, título, descripción y acciones; `ModuleTabs` mantiene pestañas con `role="tab"`, flechas/Home/End, indicadores de desborde y foco visible; `Section` da el contenedor común.
5. **Avisos.** Un único `Toaster` (sonner, tema claro) se monta en `app/(crm)/layout.tsx`; las vistas confirman creación, edición, asignación o error con un solo sistema, sin duplicar toasts.
6. **Contraste y tacto.** Se corrigen los hallazgos INV-04 a INV-08: escudo del banner en oro sobre navy, iconos en `gold-700` sobre superficie clara, eyebrow con tinta secundaria, breadcrumb/buscador/separadores legibles y botones de la barra superior de 44 px con nombre accesible.
7. **Migración de vistas.** Se reemplazan inputs nativos y `<details>` por los componentes compartidos; una prueba recorre `src/app/(crm)` y falla si reaparece un `<input type="checkbox|radio">` fuera de `metas`, `tareas`, auth, login o correo.
8. **Regresión visual y de accesibilidad.** Las pruebas leen el código y verifican Radix, tamaño táctil, foco oro, estado indeterminado, duración ≤220 ms y `motion-reduce`; no sustituyen la revisión visual a 320/390/1280/1440 px.

## Estados de UI (D06)
- **Base:** superficies `surface` con borde `line`; texto `navy-900`; acciones en `gold-600`.
- **Hover:** borde o texto pasa a `gold-700` sin cambiar el tamaño del control.
- **Foco:** anillo `ring-2 ring-gold-700` con `ring-offset` sobre `surface`, visible en teclado y ratón.
- **Marcado:** `data-[state=checked]` en navy; **indeterminado:** guion en el checkbox y estado `"indeterminate"` en la tabla; **no marcado:** borde navy-700.
- **Deshabilitado:** `disabled:opacity-50` y `cursor-not-allowed`; la acción sigue bloqueada en servidor.
- **Movimiento reducido:** `motion-reduce:transition-none` y `motion-reduce:animate-none`; el contenido se muestra igual.
- **Desborde:** las pestañas se desplazan en horizontal con indicadores; los controles no deben romper el layout a 320/390 px.

Estados de pantalla (los aporta cada módulo; Luna-ui no inventa un 403/404 propio):
- **Vacío:** cada vista conserva su mensaje y su acción de limpiar filtros; un expansivo cerrado no oculta un estado vacío que deba verse.
- **Cargando:** esqueletos y `aria-busy` del módulo; los controles deshabilitados muestran `opacity-50`.
- **Error:** el `error.tsx` de la ruta y el reintento; el toast de error no duplica el mensaje en pantalla.
- **Sin permiso:** 403 de la página; el control oculto o deshabilitado no sustituye la comprobación de servidor.
- **Éxito:** un solo toast de sonner confirma la acción; la vista se actualiza sin recargar.
- **Parcial:** si falla una carga secundaria, la pieza compartida sigue usable; la tabla conserva la selección ya hecha.
- **Modo oscuro:** fuera de alcance (decisión 2 de los tokens); `Toaster` fija `theme="light"`.

## Estado actual vs PRD
**Existe (código real, rama `orq/luna-ui-etapa2`):**
- Checkbox, radio y switch compartidos con Radix, 44 px de área táctil, 17–18 px visibles, foco oro, `disabled` e indeterminado (`src/components/ui/checkbox.tsx`, `radio-group.tsx`, `switch.tsx`).
- `DataTable` con selección parcial indeterminada y checkbox compartido (`src/components/ui/data-table.tsx`).
- `Accordion` y `Collapsible` con Radix, `min-h-12`, animación 180–200 ms y movimiento reducido (`src/components/ui/accordion.tsx`, `collapsible.tsx`); migración en Negocios, Reportes y Configuración.
- `Toaster` único de sonner montado en el layout del CRM (`src/app/(crm)/layout.tsx`).
- `PageHeader`, `ModuleTabs` y `Section` compartidos; corrección de contraste INV-04..08 en propiedades y cabecera.
- Pruebas de controles, expansivos, pestañas y contraste/tacto incluidas en la rama.

**Demo o faltante:**
- No hay componentes `bento`, `award` ni `stats-bento`: el punto 6 de G22 (Metas Bento 5/Awards) sigue sin implementar.
- No hay ruta pública de cita ni `OpenSlotBooking`; solo existe `agenda/_lib/guardado-cita.ts` como lógica de guardado (punto 8 de G22 pendiente).
- Los patrones de tallyho (barra de presupuesto consumible, archivar en lugar de borrar, Quick Add con lo último registrado, jerarquía cliente > proyecto > fase) no están implementados.
- La compactación de KPI/resúmenes (punto 4) y la matriz RBAC sin scroll lateral a 1280/390 (punto 5) no tienen componente ni prueba propia; Configuración aún arrastra pendientes de navegación móvil y permisos duplicados.
- No existe pantalla `/luna-ui`: el nombre del módulo es un frente de trabajo, no una ruta del producto.
- El modo oscuro está deliberadamente fuera de alcance.

**PRD:** el compendio no contempla un módulo de UI ni una ruta `/luna-ui`; G22 es una ficha de evolución de la Etapa 2 aprobada por Wilber el 2026-10-27. Las «buenas prácticas» que aplica son: componente único por patrón, objetivo táctil de 44 px, foco visible, contraste AA y movimiento reducido.

## Pendientes del tablero (estado.json)
Estado al 2026-10-27 (fuente única: `tablero/estado.json`):

| Módulo | Item | Estado | Fuente |
|---|---|---|---|
| luna-ui | `g22-componentes-expansivos-accordion-col` — G22 componentes expansivos Accordion/Collapsible | done | luna-ui |
| propiedades | `g22-contraste-de-eyebrow-breadcrumb-y-bu` — G22: contraste de eyebrow, breadcrumb y buscador (INV-06/07) | pending | luna-ui |
| configuracion | `controles-checkbox-radio-y-switch-unific` — Controles checkbox, radio y switch unificados G22 | done | orq/luna-ui-etapa2 |

- El módulo `luna-ui` no tiene pendientes abiertos; su único item está cerrado.
- **Desfase a revisar:** el item de contraste de `propiedades` sigue `pending` aunque INV-04..08 están implementados y cubiertos por `contraste-tactil.test.ts` en la rama. Confirmar en la revisión cruzada antes de cerrarlo; no se marca done sin esa verificación.
- Los puntos 3 a 9 de G22 no están desglosados como items del tablero; si se abordan, deben añadirse con `marcar.sh luna-ui - add …` para no perder trazabilidad.

## Criterios de aceptación
- [x] Checkbox, radio y switch unificados con Radix y un solo componente por patrón
- [x] Área táctil ≥44×44 px y control visible de 16–18 px
- [x] Foco visible con anillo oro y contraste AA
- [x] Estados `checked`, `indeterminate` y `disabled`
- [x] `Accordion` y `Collapsible` con `aria-expanded`, teclado y `motion-reduce`
- [x] Animación de expansivos ≤220 ms
- [x] `DataTable` comunica la selección parcial como indeterminada
- [x] Sin `<input type="checkbox|radio">` nativo en las vistas CRM (prueba de barrido)
- [x] Toaster único de sonner montado en el layout del CRM
- [x] INV-04..08 corregidos y cubiertos por prueba
- [x] Pruebas automatizadas de controles, expansivos, pestañas y contraste/tacto incluidas en la rama
- [ ] `npm test` y `npx tsc --noEmit` ejecutados en esta revisión (no se tocó código en esta tarea)
- [ ] KPI/resúmenes compactos que no empujen el contenido a 390 px
- [ ] Matriz RBAC sin scroll lateral a 1280 y 390 px
- [ ] Metas con Bento 5, Awards y StatsBento con datos reales y tokens Viltrum
- [ ] `OpenSlotBooking` en Agenda y en una página pública de cita
- [ ] Patrones tallyho (presupuesto consumible, archivar, Quick Add, jerarquía)
- [ ] Revisión visual a 320, 390, 768, 1280 y 1440 px sin desborde horizontal

## Dependencias
- **Viltrum Design v2.1:** tokens, paleta Private Desk (marfil/oro/navy) y contratos D05–D07.
- **Radix UI, lucide-react y sonner:** primitivas accesibles, iconografía y avisos.
- **Módulos consumidores:** Inicio, Leads, Negocios, Contactos, Propiedades, Agenda, Tareas, Comunicaciones, Brokers, Comisiones, Metas, Reportes, Reservas, Portal, Comunidad, Aprobaciones, Automatizaciones, Academy, Documentos, Posventa, Configuración, Acceso y Avances.
- **Navegación y cabecera:** `crm-header`, `crm-sidebar-menu`, `mobile-dock` y `module-tabs` comparten los objetivos táctiles y el contraste.
- **QA Antigravity:** inventario INV-04..08 que originó las correcciones de contraste y tacto.
- **Ficha G22** (`.viltrum/vre-os/spec/globales/G22-etapa2-ui.md`) y normalización G20.
- **Tablero:** `estado.json` como fuente única de avance; el módulo no tiene ruta ni datos propios.
- **Accesibilidad:** WCAG AA, teclado completo, lectores de pantalla y preferencia `prefers-reduced-motion`.
