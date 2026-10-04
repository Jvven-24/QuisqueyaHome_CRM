# T-W2-D10 · Reportes e Inicio 100 % desde la base de datos

Perfil: **D10 Backend**. Modo: fix en worktree. Revisor: D11 (otro proveedor). Autorización: decisiones #43/#44
(sí escribes código en los archivos listados; sin git, sin commit, sin `npm run dev`/`build`).
Mandato: `.viltrum/vre-os/M-20261004-VRE.md` W2. Receta de capas: `src/application/README.md`.
Base: commit `2de69fa` (seed con 648 leads, 184 negocios en las 7 etapas canónicas, campañas con gasto mensual).

## Defectos verificados
1. `src/infrastructure/db/repos/reportes.ts:141-172` y `:218-224`: cifras fijas ("Punta Cana 88", "Precio fuera de
   rango 12", embudo 48/36/24) devueltas en un `catch` "modo demo". **Eliminar todo dato inventado**: si la consulta
   falla, el caso de uso devuelve error y la vista muestra su estado de error.
2. `src/app/(crm)/inicio/vista.tsx`: embudo con **porcentajes fijos** y agenda con **datos escritos en la vista**.
3. `src/app/(crm)/inicio/page.tsx` consulta `users` con `getDb()` desde `app/` (viola capas): mover el nombre del
   usuario a `application/dashboard/consultas.ts` + su repositorio.

## Qué construir (consultas SQL reales, con filtros fecha/proyecto/broker y alcance `own/team/all`)
En `application/reportes/` (puertos + consultas) y `infrastructure/db/repos/reportes.ts`:
embudo por etapa con tasa de paso · leads y negocios por canal + **ROI** (`campaign_spend`) · tendencia mensual de
leads/negocios/cierres (18 meses) · zonas (`zones`) · motivos de pérdida · ranking de brokers (volumen USD, cierres,
conversión) · velocidad (días lead→cierre, mediana y p75) · inventario por estado y antigüedad · comisiones por mes ·
pronóstico ponderado por probabilidad de etapa. En `application/dashboard/`: KPIs, embudo y próximas actividades
reales para Inicio.

## Pruebas obligatorias
- Casos de uso con doble en memoria (patrón del repo).
- **Guarda anti-hardcode**: prueba que lee `repos/reportes.ts`, `repos/dashboard*.ts`, `inicio/vista.tsx` y
  `reportes/vista.tsx` y falla si aparece un literal numérico de negocio en un array de datos (estilo
  `arquitectura.test.ts`), comprobada por mutación.
- Prueba de coherencia contra el contrato del seed (sin BD): suma de etapas = total de negocios, etc.

## Archivos permitidos
`src/application/reportes/**`, `src/application/dashboard/**`, `src/infrastructure/db/repos/reportes.ts`,
`src/infrastructure/db/repos/dashboard*.ts`, `src/infrastructure/contenedor/{reportes,dashboard}.ts`,
`src/app/(crm)/reportes/**`, `src/app/(crm)/inicio/**`, `src/app/api/` solo si existe ruta de reportes, tests.
No cambies el diseño visual (lo hará D09 en W3): solo conecta datos reales y estados.

## Verificación (pega la salida real)
`npx tsc --noEmit --incremental false` (ignora `.next/types`) · `npm run lint` · `npm test`.

## Entregable
`.viltrum/vre-os/D10-reportes-reales.md`: consultas, contratos de datos por gráfica (para D09), guardas y `## Pruebas`.
