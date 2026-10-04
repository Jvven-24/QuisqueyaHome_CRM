# D09a · Higiene visual global

**Tarea:** T-W1-D09a · Higiene visual global: subrayados, siglas y ruido  
**Fecha:** 2026-10-04  
**Estado:** cambios aplicados; revisión independiente D14 pendiente.

## Resultado

Se eliminaron los códigos internos de los eyebrows indicados, el subrayado permanente en enlaces y los badges decorativos codificados en el menú. Se configuró el indicador de desarrollo de Next para que no se muestre. Inicio saluda con el nombre completo del usuario autenticado cuando el registro lo tiene; si no hay nombre, conserva «Hola».

No se cambiaron rutas ni reglas de negocio. La tarea cita `.viltrum/vre-os/M-20261004-VRE.md` como mandato padre, pero ese archivo no existe en este worktree; por eso su contenido queda **no verificado**. En Inicio, el nombre se consulta usando el `userId` del actor autenticado y se filtra por ese mismo identificador.

## Tabla de defectos y cambios

| Defecto | Archivo:línea | Cambio |
|---|---|---|
| Enlaces con estilo por defecto del navegador | [globals.css:50](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/globals.css:50) | Reset global de enlaces: hereda color y elimina subrayado. |
| Foco de teclado de enlaces no sigue el token indicado | [globals.css:51](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/globals.css:51) | Anillo de foco visible de 2 px con `gold-700`; el mismo selector incluye controles interactivos existentes. |
| Subrayado hover limitado a texto corrido | [globals.css:52](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/globals.css:52) | Hover subrayado solo para enlaces dentro de párrafos, listas y celdas de tabla. |
| Acción de selección subrayada siempre | [data-table.tsx:130](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/components/ui/data-table.tsx:130) | Quitadas las clases `underline` y `underline-offset-2`. |
| Códigos internos en eyebrows | [reportes/vista.tsx:26](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/(crm)/reportes/vista.tsx:26), [agenda/vista.tsx:69](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/(crm)/agenda/vista.tsx:69), [avances/vista.tsx:138](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/(crm)/avances/vista.tsx:138), [academy/vista.tsx:243](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/(crm)/academy/vista.tsx:243), [comisiones/vista.tsx:306](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/(crm)/comisiones/vista.tsx:306), [contactos/vista.tsx:176](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/(crm)/contactos/vista.tsx:176), [brokers/vista.tsx:53](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/(crm)/brokers/vista.tsx:53), [brokers/[id]/page.tsx:106](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/(crm)/brokers/[id]/page.tsx:106), [propiedades/vista.tsx:79](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/(crm)/propiedades/vista.tsx:79), [leads/vista.tsx:256](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/(crm)/leads/vista.tsx:256), [configuracion/vista.tsx:59](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/(crm)/configuracion/vista.tsx:59), [metas/vista.tsx:60](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/(crm)/metas/vista.tsx:60), [tareas/vista.tsx:76](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/(crm)/tareas/vista.tsx:76), [comunicaciones/vista.tsx:288](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/(crm)/comunicaciones/vista.tsx:288), [pipeline/vista.tsx:181](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/(crm)/pipeline/vista.tsx:181) | Retirado el prefijo `C<n> ·`; conservadas etiquetas legibles de negocio. |
| Badges de menú con valores fijos | [crm-sidebar-menu.tsx:22](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/(crm)/_ui/crm-sidebar-menu.tsx:22) | Eliminados `BADGES_MAP` y su renderizado. Se conservan atajos reales definidos por el módulo. No se añadió contador porque no existe uno conectado en este componente. |
| Indicador de desarrollo puede cubrir el dock | [next.config.ts:10](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/next.config.ts:10) | `devIndicators: false`. |
| Saludo sin nombre autenticado | [inicio/page.tsx:23](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/(crm)/inicio/page.tsx:23), [inicio/vista.tsx:25](/C:/Users/wilbe/Documents/.viltrum-worktrees/QuisqueyaHome_CRM/20261004T164612Z-D09-codex/src/app/(crm)/inicio/vista.tsx:25) | Consulta el nombre del usuario cuyo ID coincide con el actor y muestra «Hola, <nombre>» cuando existe; usa «Hola» como fallback vacío. |

## Archivos tocados

- `src/app/globals.css`
- `src/components/ui/data-table.tsx`
- `next.config.ts`
- `src/app/(crm)/_ui/crm-sidebar-menu.tsx`
- `src/app/(crm)/inicio/page.tsx`
- `src/app/(crm)/inicio/vista.tsx`
- `src/app/(crm)/reportes/vista.tsx`
- `src/app/(crm)/agenda/vista.tsx`
- `src/app/(crm)/avances/vista.tsx`
- `src/app/(crm)/academy/vista.tsx`
- `src/app/(crm)/comisiones/vista.tsx`
- `src/app/(crm)/contactos/vista.tsx`
- `src/app/(crm)/brokers/vista.tsx`
- `src/app/(crm)/brokers/[id]/page.tsx`
- `src/app/(crm)/propiedades/vista.tsx`
- `src/app/(crm)/leads/vista.tsx`
- `src/app/(crm)/configuracion/vista.tsx`
- `src/app/(crm)/metas/vista.tsx`
- `src/app/(crm)/tareas/vista.tsx`
- `src/app/(crm)/comunicaciones/vista.tsx`
- `src/app/(crm)/pipeline/vista.tsx`

## Pruebas

- `npx.cmd tsc --noEmit` — **exit code 0**, sin salida.
- `npm.cmd run lint` — **exit code 0**, 0 errores y 11 advertencias ya presentes en el repo: `seed_local_crm.mjs` (3), `crm-header.tsx` (1), `crm-sidebar-menu.tsx` (`ChevronRight`, 1), `comisiones/vista.tsx` (2), `leads/vista.tsx` (1), `propiedades/vista.tsx` (2), `login/page.tsx` (1). No se limpiaron advertencias fuera del alcance.
- `npm.cmd test` — **exit code 0**; 448 pasaron, 0 fallaron, 0 omitidas.
- No se ejecutó `npm run dev` ni `build`.
- Revisión estática de seguridad del cambio: la consulta nominal de Inicio filtra por `users.id = actor.userId`; no se añadió exposición de datos ni acceso a credenciales. No se ejecutó un scanner de seguridad.
- Validación visual manual y capturas: **pendientes de D14**; no verificadas en esta sesión.

## Handoff

**Para D14 (QA), revisión independiente requerida:** validar con capturas escritorio y móvil que los enlaces no quedan subrayados en navegación/dock, que el foco usa el anillo gold-700, que las etiquetas de menú ya no muestran datos decorativos, que no aparece el indicador `N` sobre el dock y que el saludo usa el nombre de la sesión (incluido el caso sin nombre). Confirmar también que los 15 eyebrows indicados muestran solo texto legible. Esta entrega no constituye aprobación propia ni cierre de revisión.