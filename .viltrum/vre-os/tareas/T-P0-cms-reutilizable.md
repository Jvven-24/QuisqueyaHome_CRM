# T-P0-CMS · Qué tiene el CMS (Quisqueya Studio / Portal) que el CRM puede reutilizar

Perfil: **D22 Knowledge Ops** con criterio D03. Modo: analysis. Revisor: D03 (otro proveedor).
Flujo: `.viltrum/vre-os/FLUJO-PASADAS.md` §4. Repo CMS (solo lectura): `C:\Users\wilbe\Documents\QuisqueyaHome PortalWeb`
(rama `main`; Vite + React; Supabase). CRM: este repo (Next 15, Tailwind v4, shadcn).

## Qué hacer
1. Recorre `src/studio/**`, `src/portal/**`, componentes compartidos, i18n, auth/perfil, utilidades (`tone.ts`),
   `CommandPalette.tsx`, DataTable, explorador de Drive, enlaces de origen, captura de leads, media/galería,
   formularios, y la skill `E:\PERFILES AI\skills\patron-consola` (nació de esa consola).
2. Para cada pieza: ruta, qué hace, stack/dependencias, **equivalente en el CRM** (ruta o "no existe"), decisión
   (`COMPARTIR` como paquete común · `PORTAR` adaptando a Next/Tailwind v4 · `REFERENCIA` · `IGNORAR`) y por qué,
   riesgo de divergencia y esfuerzo (S/M/L).
3. Datos compartidos CMS↔CRM: proyectos, unidades, leads del portal, beneficios Confotur, medios. ¿Quién es la fuente
   de verdad de cada uno hoy? ¿Hay duplicación? Propuesta de contrato (I06 Portal → CRM: captura de leads).
4. Lista de lo que el CRM reimplementó y ya existe mejor en el CMS (y al revés).

## Reglas
No modifiques ningún repo. Lo no verificado = `UNKNOWN`. Cita archivo:línea.

## Entregable
`.viltrum/vre-os/spec/inventario/cms-reutilizable.md` con tabla resumen, secciones 1–4 y `## Fuentes`.
