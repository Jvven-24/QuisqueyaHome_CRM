# Paquete de plataforma — Supabase (stack insignia)

Dueño: D11 (datos). Apoyo: D10 (API), D12 (seguridad, revisor), D16 (infra), D17 (observabilidad), D19 (CDC/webhooks).
Se carga solo cuando el proyecto usa Supabase (P5). Contrastado con el changelog y la documentación de Supabase el 2026-10-06 (revisión independiente D12 con observaciones corregidas); la versión real del
proyecto manda sobre este texto. El plan y entorno de producción de cada proyecto **no** están verificados aquí. Complementa la skill `supabase` y `supabase-postgres-best-practices` (no las duplica).

## 1. Qué cambió que afecta a todo proyecto Supabase

| Cambio | Fecha | Efecto | Acción de D11 |
|---|---|---|---|
| Tablas nuevas en `public` **no se exponen** a la Data API por defecto | opt-in hasta 2026-05-30 (por defecto en proyectos nuevos); **obligatorio en todos desde 2026-10-30** | Una migración que crea una tabla ya no la hace visible a `supabase-js` | Cada migración declara el `GRANT` explícito (o la decisión de no exponer). Sin grant = tabla invisible, no un bug |
| Esquema `realtime` bloqueado a cambios | 2026-07-14 (según el changelog) | Crear/alterar objetos allí falla; las políticas RLS sobre `realtime.messages` siguen valiendo | No migrar sobre `realtime`; usar solo políticas |
| Advisors incluye health checks de Auth, Storage, Edge Functions y Data API | 2026-09-18 | Señal gratuita de error-rate | D17 la lee tras cada release |
| Logs pasa a precio por consumo (periodo de gracia hasta principios de 2027) | 2026-09-25 | Costo de logs puede subir; Supabase indica que la mayoría de proyectos queda dentro de lo incluido | D16/D17 fijan retención y presupuesto |

Fuente: [changelog oficial](https://supabase.com/changelog). Cualquier migración escrita antes de la fecha debe revisarse.

## 2. Analítica y replicación (decisión 2026-10-06)

- **Supabase Pipelines** (CDC gestionado, public alpha, planes de pago): destino BigQuery para todos; ClickHouse, DuckLake y Snowflake en alpha desde 2026-10-02. Entrega *at-least-once* → el destino debe deduplicar. Un slot atrasado retiene WAL y puede llenar el disco; si se pierde el WAL requerido, el slot pasa a *Lost* y la replicación se detiene.
- **Supabase ETL** ([Apache-2.0, binario autoalojable o librería Rust](https://github.com/supabase/etl)): mismo motor, para Postgres propio o VPS. Requiere `wal_level=logical`.
- **Analytics Buckets (Iceberg)**: ya **no** se llenan con Pipelines; los llena una ingesta propia. No diseñar sobre esa ruta.
- Regla: la analítica nunca corre sobre la base transaccional de producción; se replica y se consulta en el destino.
- Estado: **WATCH → PILOT aislado** (ver `docs/research/supabase-pipelines-analytics-2026-10-06.md`). Producción solo con aprobación humana.

## 3. Lista de salida para toda entrega Supabase (además de `checklists/data-model-review.md`)

1. RLS activo en toda tabla expuesta; política probada con el rol real de la app y con otro tenant (debe fallar).
2. `GRANT`/exposición a la Data API explícito por tabla (ver §1).
3. `get_advisors` de seguridad y rendimiento sin hallazgos nuevos; los existentes, con dueño.
4. Migración expand/contract, reversible, con `supabase db diff` limpio contra local.
5. Claves: `service_role` nunca en cliente ni en el repo; publicable vs secreta según la versión de claves del proyecto.
6. Región, plan, PITR y RPO/RTO declarados; restauración ensayada (no solo configurada).
7. Auth: callbacks y proveedores por entorno; `getClaims`/`getUser` en servidor, nunca confiar en `getSession` para autorizar.
8. Entornos: staging aislado de producción; ninguna credencial de producción en pruebas de agentes.

## 4. Pruebas aisladas (no producción)

- Local: `supabase start` (Docker) para migraciones y RLS.
- VPS: contenedor Postgres con `wal_level=logical` + Supabase ETL contra una **copia sintética**, con destino ClickHouse local; medir latencia, WAL con el slot detenido y duplicados. Revertir: `DROP PUBLICATION`, `pg_drop_replication_slot()`, detener el contenedor.
- Los agentes de apoyo reciben solo datos sintéticos y nunca el `supabase_admin`.

## 5. Límites conocidos

- Plan/región/versión del proyecto de producción de Quisqueya: **sin verificar** (el conector de Supabase de esta sesión solo ve otra organización).
- Pipelines gestionado está en alpha: puede cambiar sin aviso.
