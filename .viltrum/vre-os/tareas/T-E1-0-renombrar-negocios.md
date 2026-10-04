# T-E1-0 · «Pipeline» pasa a llamarse «Negocios» en toda la interfaz (decisión firmada D-04)

Perfil: **D09 Frontend**. Modo: fix en worktree. Revisor: Claude (comandos + abre la pantalla) y Gemini (captura). Tier: medium.
Autorización: decisiones #43/#44/#45 (sí escribes código en los archivos listados; sin git, sin commit, sin `npm run dev`/`build`).
Origen: Expediente del Sprint 1, D-04: «el término técnico no era comprensible para el usuario final; se adoptó **Negocios**»
(el nombre de AlterEstate). `docs/contexto/decisiones.md` #45. **La palabra «pipeline» no puede aparecer en texto visible al cliente.**

## Qué cambiar
1. **Textos visibles**: menú (`src/app/(crm)/modulos.ts`), títulos de página, `loading.tsx`/`error.tsx`, `command-palette.tsx`,
   Configuración («Etapas del pipeline» → «Etapas de negocios»), Metas («Cierres del pipeline» → «Cierres de negocios»),
   Inicio, `_ui/analitica-copy.ts` («Pipeline USD», «Pipeline ponderado», «Ver pipeline», descripciones), tooltips, vacíos,
   mensajes de error de la API que lleguen a pantalla, cabeceras de CSV y metadatos `<title>`. Busca con
   `grep -rniE pipeline src` y decide cada caso; ejemplos: «Valor en negocios abiertos», «Negocios ponderados», «Ver negocios».
2. **Ruta**: `src/app/(crm)/pipeline/` → `src/app/(crm)/negocios/` (URL `/negocios`). Añade en `next.config.ts` una
   redirección permanente `/pipeline` y `/pipeline/:path*` → `/negocios` conservando la query (`?deal=`). Actualiza todos los
   `href`, `router.push`, `redirect()` y enlaces internos (también los de las demás pantallas y el inspector).
3. **La fase «clasificación» se llama «presentación»**: comprueba textos, plantillas y catálogos de `src/` y `scripts/seed/`.
4. **No cambies** (se decide en la ficha de Negocios): `/api/pipeline/**`, tablas `pipeline_stages`, carpetas
   `application/pipeline` e `infrastructure/**/pipeline*`, ni el nombre del recurso de permisos `pipeline` (lo ven roles en
   Configuración: si ese texto es visible, tradúcelo en la capa de vista sin cambiar el identificador).

## Guarda obligatoria
`src/infrastructure/vocabulario.test.ts`: recorre `.ts/.tsx` de `src/app`, `src/components`, `src/application` (sin `*.test.ts`),
extrae **literales de cadena y texto JSX** y falla si alguno contiene «pipeline» (insensible a mayúsculas), salvo una lista
corta y comentada de excepciones técnicas (rutas `/api/pipeline`, imports, nombres de tabla/identificador). Demuestra por
**mutación** que cae: añade temporalmente `title="Pipeline"` en una vista, pega la salida roja y revierte.

## Archivos permitidos
`src/app/**`, `src/components/**`, `src/application/**` (solo textos), `src/infrastructure/vocabulario.test.ts`,
`next.config.ts`, `scripts/seed/**` (solo textos), tests existentes que referencien la ruta o los textos.

## Verificación (pega la salida real)
`npx tsc --noEmit --incremental false` (ignora `.next/types`) · `npm run lint` · `npm test` (incluye la guarda nueva) ·
con el servidor en `localhost:9301` y la cookie de evaluación (`POST /api/auth/demo {"role":"admin"}`): `GET /negocios` → 200 y
`GET /pipeline?deal=1` → redirección permanente a `/negocios?deal=1` · cero ocurrencias visibles de la palabra.

## Entregable
`.viltrum/vre-os/D09-renombrar-negocios.md`: tabla texto antiguo → nuevo (archivo:línea), la redirección, la guarda y `## Pruebas`.
