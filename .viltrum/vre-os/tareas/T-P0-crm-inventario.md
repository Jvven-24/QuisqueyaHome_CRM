# T-P0-CRM · Inventario AS-IS del CRM (base del Spec Pack)

Perfil: **D03 Architecture** (con D22 para el orden). Modo: fix limitado: **solo escribes** en
`.viltrum/vre-os/spec/inventario/` (ningún archivo de código). Revisor: D22 (otro proveedor).
Flujo: `.viltrum/vre-os/FLUJO-PASADAS.md` (P0). Plantilla de fichas: `.viltrum/vre-os/spec/_plantilla-modulo.md`.
Commit base: el actual de `develop` (≥ `5d96155`).

## Qué inventariar (todo con archivo:línea; nada de memoria)
Puedes usar la CLI de GitNexus (`npx gitnexus` sobre este repo, índice `QuisqueyaHome_CRM`) y lectura de código.
1. **Pantallas**: cada ruta de `src/app/(crm)/**` y `src/app/login|recuperar`: qué muestra, tabs, acciones, si tiene
   los seis estados, si usa datos fijos, si tiene móvil.
2. **API**: cada ruta de `src/app/api/**`: método, permiso (`requireScope`), Zod, caso de uso que llama.
3. **Aplicación**: cada módulo de `src/application/**`: puertos, casos de uso, consultas, pruebas; cuáles siguen con
   SQL en rutas (no migrados).
4. **Datos**: cada tabla de `src/infrastructure/db/schema.ts`: propósito, filas actuales (consulta de conteo vía
   `node --env-file=.env scripts/seed/index.ts --counts` si sirve), RLS, catálogos, columnas sin uso.
5. **Permisos**: recursos y acciones del catálogo RBAC (`src/domain/rbac.ts` y seed de permisos).
6. **Integraciones existentes**: comunicaciones (`proveedor-despacho`), almacenamiento, auth, outbox/CrmPort.
7. **Deuda y riesgos**: hallazgos abiertos de `docs/R_HALLAZGOS.md`, lint warnings, pruebas que faltan.

## Salidas
- `.viltrum/vre-os/spec/inventario/crm-as-is.md`: secciones 1–7 con tablas.
- `.viltrum/vre-os/spec/inventario/crm-mapa-modulos.md`: por cada ficha del catálogo de `FLUJO-PASADAS.md` §3
  (M01–M21, G01–G11) qué existe hoy (rutas, casos de uso, tablas) y un borrador de "§2 Estado actual" listo para pegar.

## Verificación
Ningún archivo fuera de `spec/inventario/` cambia (`git status`). Termina las salidas con `## Fuentes` y `## Pruebas`
(los comandos que ejecutaste y su resultado).
