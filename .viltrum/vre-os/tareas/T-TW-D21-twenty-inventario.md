# T-TW-D21 · Twenty detrás: inventario de capacidades y requisitos de despliegue

Perfil: **D21 Research**. Modo: analysis (necesita web). Revisor: D03 (otro proveedor).
Mandato padre: `.viltrum/vre-os/M-20261004-VRE.md` §2 y "Vía TW". Decisión vigente: `docs/contexto/decisiones.md` #43.

## Contexto
Wilber decidió (4-oct): el frente es nuestro CRM Next.js; **Twenty corre detrás** como motor (headless), accedido
solo por un puerto desde `src/infrastructure/`. De Twenty se reproducen en nuestro frente, con nuestro estilo
(`docs/DESIGN.md`), solo las capacidades que necesitemos. El usuario final no ve la interfaz de Twenty.
Restricción local: Docker Desktop no arranca y hay ~2–3 GB de RAM libre.

## Qué entregar (fuentes oficiales: github.com/twentyhq/twenty, docs de Twenty, fecha 2026-10-04)
1. **Inventario de capacidades** con columna `NECESITAMOS | NO | DESPUÉS` y motivo, comparado con lo que el CRM ya
   tiene (`src/app/(crm)/*`, `src/application/*`): objetos estándar (people, companies, opportunities, tasks, notes),
   objetos/campos personalizados, vistas guardadas, filtros/orden/agrupación, kanban, timeline de actividad,
   workflows (disparadores y acciones), importación/exportación CSV, permisos/roles, API REST/GraphQL, webhooks,
   agentes IA, búsqueda, email/calendario.
2. **API que usaríamos**: endpoints/consultas concretas para crear/leer/actualizar persona, compañía, oportunidad,
   tarea y nota; autenticación por API key; webhooks y su firma; límites de tasa; versión de la API.
3. **Despliegue**: requisitos mínimos (servicios, RAM, Postgres/Redis, worker), self-hosting con Docker Compose y
   alternativa sin Docker; estimación de recursos para el VPS de staging.
4. **Licencia**: alcance exacto de la "Twenty Application Exception" para un adaptador que solo usa la API; qué
   implicaría modificar el core (no lo haremos).
5. **Riesgos y fallos**: cambios de esquema entre versiones, migraciones de Twenty, qué pasa si Twenty cae (el CRM
   debe seguir operando con su base local).

## Prohibido
Instalar o clonar en el repo del CRM. Modificar archivos fuera del entregable. Inventar datos: lo no verificado se
marca `UNKNOWN` con el motivo.

## Entregable
`.viltrum/vre-os/D21-twenty-inventario.md` con secciones 1–5 y `## Fuentes` (URL por afirmación).
