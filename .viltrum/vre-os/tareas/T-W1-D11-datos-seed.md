# T-W1-D11 · Esquema ampliado + generador determinista de datos realistas (≥600 leads)

Perfil: **D11 Data**. Modo: fix en worktree. Revisor: D12 (otro proveedor).
Mandato padre: `.viltrum/vre-os/M-20261004-VRE.md` §4 (léelo primero, es el contrato de datos).

## Contexto verificado
- Next 15 + Drizzle + PostgreSQL 15 local. Esquema en `src/infrastructure/db/schema.ts`; migraciones en `drizzle/`.
- Hoy hay 8 leads, 8 deals, 4 proyectos, 4 unidades: no sirve para medir nada.
- Seed actual: `scripts/seed.mjs`, `scripts/seed_local_crm.mjs`, `db/seed.sql`. Puedes reemplazarlos por el nuevo.
- Reglas del repo (`AGENTS.md`): toda tabla nueva con `.enableRLS()`; ninguna credencial en archivos; variables de
  entorno solo vía `src/infrastructure/env.ts`; `decisiones.md` solo se amplía.
- Catálogo real de proyectos del portal (solo lectura, para tomar nombres, zonas y rangos de precio):
  `C:\Users\wilbe\Documents\QuisqueyaHome PortalWeb\supabase\migrations\` y `scripts/populate-project-benefits.mjs`.

## Qué hacer
1. Lee el esquema y lista lo que falta para el contrato de §4. Mínimo esperado (ajusta nombres al estilo del esquema):
   - `marketing_campaigns` (canal, nombre, fechas) y `campaign_spend` (campaña, mes, monto USD) → ROI por canal.
   - Campos de inversor en lead/contacto si no existen: presupuesto mín/máx USD, zona de interés, horizonte de entrega,
     método de pago, interés Confotur, país y ciudad de residencia.
   - `lead_events` (o reutilizar `activities`/`deal_stage_history` si ya cubren) para timeline y velocidad.
   - Torres/pisos/tipo de unidad si `units` no los tiene (columnas o tablas, justifica en el entregable).
   - Catálogo de zonas en tabla (no en código).
   Genera **una** migración Drizzle nueva (`npm run db:generate`), con RLS en toda tabla nueva.
2. Crea `scripts/seed/` con un generador **determinista** (PRNG con semilla fija; puedes añadir `@faker-js/faker`
   como devDependency) que produzca los volúmenes y distribuciones de §4 y los inserte con transacción.
   Nombres y teléfonos plausibles por país (E.164), precios USD coherentes por zona/m², estacionalidad nov–mar,
   brokers con rendimiento desigual, motivos de pérdida que sumen los perdidos.
3. Al final del seed, ejecuta las invariantes de §4 y aborta (exit ≠ 0) si alguna falla.
4. `package.json`: script `db:seed` apunta al nuevo generador. No toques otros scripts.
5. Prueba `src/infrastructure/db/seed-invariantes.test.ts` (estilo `node --test` del repo) que valida las funciones
   puras del generador (distribuciones y coherencia) sin base de datos.

## Prohibido
- Tocar `src/app/`, `src/application/` o vistas. Borrar datos de staging/VPS. Ejecutar `npm run dev` o `build`.
- Hacer commit o push. Escribir credenciales en cualquier archivo.

## Pruebas que debes correr y pegar en el entregable
`npx tsc --noEmit` · `npm test` · `npm run db:migrate` y `npm run db:seed` contra la base local (`DATABASE_URL` de
`.env`) · consulta de conteos por tabla.

## Entregable
`.viltrum/vre-os/D11-datos-seed.md` con: cambios de esquema y por qué, distribuciones usadas, conteos finales por
tabla, resultado de invariantes y una sección `## Pruebas` con la salida real de los comandos.
