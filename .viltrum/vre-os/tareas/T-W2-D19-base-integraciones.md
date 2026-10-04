# T-W2-D19 · Base de integraciones: outbox, referencias externas, CrmPort y guardas

Perfil: **D19 Integrations**. Modo: fix en worktree. Revisor: D12 (otro proveedor). Tier: medium.
Autorización: decisiones #43/#44 (sí escribes código en los archivos listados; sin git ni commit).
Diseño que manda: `.viltrum/vre-os/ARQ-VRE-002-integraciones.md` (léelo completo). Receta de capas:
`src/application/README.md`. Precondición: la migración de T-W1-D11 ya está integrada en la rama.

## Qué construir (sin Twenty vivo)
1. Tablas en `src/infrastructure/db/schema.ts` + una migración Drizzle: `outbox`, `outbox_dead`, `external_refs`,
   `webhook_inbox`, con RLS, índices y únicas de ARQ §2.4–§2.6.
2. `application/compartido/crm.ts`: `CrmPort` con tipos del dominio; doble en memoria en `application/testing/`
   y suite de contrato en `application/testing/contratos.ts` (mismo estilo que los puertos existentes).
3. `infrastructure/integraciones/crm/local.ts`: adaptador local (no-op que registra) y selección en el contenedor
   por `CRM_MOTOR` leído en `src/infrastructure/env.ts` (valor por defecto `local`).
4. Escritura en outbox dentro de la unidad de trabajo para `LeadCreado`, `NegocioCambioEtapa`,
   `ActividadRegistrada` (solo emitir; no cambiar el comportamiento visible).
5. Worker `scripts/worker-outbox.mjs` (o módulo en `infrastructure/`): lee pendientes, llama al puerto, backoff con
   jitter, clasifica errores y mueve a `outbox_dead` tras el máximo. Pruebas unitarias de la política de reintento.
6. Guardas 1–5 de ARQ §4 en `arquitectura.test.ts` / `seguridad.test.ts`, comprobadas por mutación (romper lo que
   vigila y ver que la prueba cae por su nombre), como exige `docs/R_RELEVO.md` §4.

## Prohibido
Llamar a Twenty o a cualquier red. Cambiar vistas. Commit/push. `npm run dev`/`build`. Credenciales en archivos.

## Pruebas
`npx tsc --noEmit` · `npm run lint` · `npm test` · `npm run db:migrate` local. Pega la salida real.

## Entregable
`.viltrum/vre-os/D19-base-integraciones.md`: tablas y por qué, archivos tocados, resultado de las mutaciones de
cada guarda, sección `## Pruebas`.
