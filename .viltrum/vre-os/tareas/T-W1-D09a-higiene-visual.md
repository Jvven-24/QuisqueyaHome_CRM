# T-W1-D09a · Higiene visual global: subrayados, siglas y ruido

Perfil: **D09 Frontend**. Modo: fix en worktree. Revisor: D14 (otro proveedor, con capturas).
Mandato padre: `.viltrum/vre-os/M-20261004-VRE.md` §1. Diseño: `docs/DESIGN.md`.

> **AUTORIZACIÓN EXPRESA (decisión #44, Wilber, 4-oct-2026):** en este programa **tú sí escribes código** en los
> archivos listados abajo. La sección "Reparto" del 02/10 en `AGENTS.md` / `docs/R_RELEVO.md` §2 ("Codex solo prueba
> la interfaz") está **sustituida** y no aplica a esta tarea. Sigues sin usar `git`, sin commit y sin `npm run dev`/`build`.
> Un intento anterior (run `20261004T164018Z`) se negó por esa regla vieja: no la repitas.

## Diagnóstico ya verificado (úsalo, no repitas la búsqueda)
- `src/app/globals.css:44-50`: no hay regla global para `a` → añadir reset y foco `gold-700`.
- `src/components/ui/data-table.tsx:128`: quitar `underline` permanente.
- Prefijos `C<n> ·` en eyebrows: `reportes/vista.tsx:26`, `agenda/vista.tsx:69`, `avances/vista.tsx:138`,
  `academy/vista.tsx:243`, `comisiones/vista.tsx:306`, `contactos/vista.tsx:176`, `brokers/vista.tsx:53`,
  `brokers/[id]/page.tsx:106`, `propiedades/vista.tsx:79`, `leads/vista.tsx:256`, `configuracion/vista.tsx:59`,
  `metas/vista.tsx:60`, `tareas/vista.tsx:76`, `comunicaciones/vista.tsx:288`, `pipeline/vista.tsx:181`
  (todas bajo `src/app/(crm)/`).
- `src/app/(crm)/_ui/crm-sidebar-menu.tsx:22-28,94,125-135`: `BADGES_MAP` con valores fijos (`12`, `$2.4M`,
  `Confotur`, `50/50`) → eliminar el mapa y los badges decorativos (no hay contador real conectado).
- `next.config.ts`: añadir `devIndicators: false` (o posición que no tape el dock).
- Saludo: `inicio/vista.tsx:20-24` usa `title="Hola"`; `layout.tsx:50-67` ya obtiene el nombre autenticado →
  pasarlo a Inicio (vía `page.tsx`) y mostrar "Hola, <nombre>".

## Defectos verificados (4-oct)
1. **Enlaces subrayados en todo el CRM**: en móvil (390 px) los nombres de lead, "Registrar Lead", badges y
   etiquetas del dock salen azules y subrayados (estilo por defecto del navegador); en escritorio salen subrayados
   los ítems del menú lateral, los nombres de lead y "Contactar hoy". Falta un reset global de `a` coherente con
   Tailwind v4 (`src/app/globals.css`), y `src/components/ui/data-table.tsx:128` fuerza `underline`.
2. **Siglas/códigos internos visibles**: eyebrows con el código del módulo, p. ej. `src/app/(crm)/reportes/vista.tsx:26`
   "C12 · Métricas Operativas". Busca el patrón en todas las vistas (`grep -rn "eyebrow=" src/app`) y deja solo
   texto de negocio legible ("Métricas operativas"). Mayúsculas continuas solo en microetiquetas (DESIGN.md).
3. **Badges al final de cada ítem del menú lateral** (números y textos como "Confotur", "$2.4M", "58/58"):
   deja solo contadores accionables (p. ej. leads sin atender) y quita los decorativos; ningún valor fijo en código.
4. El indicador de Next dev ("N") tapa el dock móvil: `devIndicators` en `next.config.ts` → posición que no tape
   o desactivado.
5. Saludo "Hola" sin nombre en Inicio: muestra el nombre del usuario autenticado si existe.

## Reglas
- Enlaces: sin subrayado por defecto; foco visible (anillo `gold-700`, DESIGN.md §Accesibilidad); subrayado solo
  en hover para enlaces dentro de texto corrido. No dependas solo del color.
- No cambies lógica, rutas ni datos. Solo estilos y textos visibles listados.

## Prohibido
`npm run dev`/`build`, commit, push, tocar `src/infrastructure/` o `src/application/`.

## Pruebas
`npx tsc --noEmit` · `npm run lint` · `npm test`. Lista de archivos tocados con el antes/después de cada defecto.

## Entregable
`.viltrum/vre-os/D09a-higiene-visual.md` con sección `## Pruebas` (salida real) y tabla defecto → archivo:línea → cambio.
