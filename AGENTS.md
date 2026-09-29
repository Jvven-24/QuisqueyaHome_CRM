# Instrucciones para agentes — CRM Quisqueya Home

Next.js 15 · React 19 · TypeScript · Supabase · Drizzle · Zod. El contexto
completo vive en `docs/contexto/` (arquitectura, convenciones, decisiones,
flujo de trabajo, errores conocidos). Léelo antes de cambiar código.

## Seguridad: no negociable

Antes de cerrar cualquier cambio, recorre el checklist de
`docs/contexto/flujo-de-trabajo.md` §6. Lo mínimo:

- Toda tabla nueva lleva RLS (`.enableRLS()` en `schema.ts`). `npm test` falla si no.
- Toda ruta de `src/app/api/` llama a `requireScope`/`requireFullScope` antes de
  tocar datos, y las rutas por `:id` filtran con `visibleRows`/`reaches`.
  `npm test` falla si falta el permiso.
- Cuerpos JSON con Zod y asignación campo por campo; nunca `...body`.
- Variables de entorno solo en `src/infrastructure/env.ts`. La `service_role`
  nunca en código de cliente.
- Ninguna credencial en el repositorio (decisión #39).
- Al terminar: revisión de seguridad del diff. Los hallazgos se reportan con
  archivo:línea y escenario concreto; si algo está bien, se dice.

## Verificación antes de dar algo por terminado

`npm run typecheck && npm run lint && npm test && npm run build`, y probar el
flujo en la interfaz. No se abre PR con algo fallando.

## Entorno

- Codex: no ejecutes `npm run build` ni `npm run dev` en esta carpeta; deja
  archivos en `.next/` que el usuario de Windows no puede borrar
  (`errores-conocidos.md`).
- No crees ramas nuevas sin que el usuario lo pida.
