# F3 · Inventario y equipo — análisis y plan de implementación

Milestone **F3 · Inventario y equipo** (issues #30 M8, #31 M9, #32 M6, #33 M7). Contenido según §19.1 de
`MAPEO_FRONTEND_CRM.md`: **M6** Avances de obra · **M7** Brokers · **M8** Metas ·
**M9** Comisiones. Peso 7 de 46 (M + S + S + M).

F2 quedó cerrada y mergeada (PR #29, `799513e` en `develop`). Este documento se
escribe contra el repositorio real —`npm test` con **74 pruebas en verde**,
verificado el 17 de septiembre de 2026—, no contra el prototipo.

Se construye con **ponytail** (`/ponytail`, nivel `full`), `/ponytail-review`
sobre el diff de cada issue y `/ponytail-audit` + `/ponytail-debt` al cierre (§10).

---

## 1. Qué entrega F3

F1 escribe en `goals`, `broker_profiles` y `commissions` **desde el cierre
transaccional**, y F2 permite ejercer ese cierre desde la interfaz. Pero nadie
**lee** lo que el cierre escribe: las cuatro pantallas de F3 siguen pintando
cifras literales (`US$48,500`, `7 de 10`, `Top Producer`, `60%`).

**F3 es la fase que hace visible —y gobernable— lo que el cierre produce:**

| Lo que el cierre ya escribe | Quién lo lee hoy | Quién lo lee tras F3 |
|---|---|---|
| `goals.achieved_deals` / `achieved_amount_cents` | nadie | M8 Metas, M7 Brokers |
| `broker_profiles.annual_sales_cents` / `level` | nadie | M7 Brokers |
| `commissions` en `pending` | nadie — y nadie la aprueba ni la paga | M9 Comisiones |

Y M6 cierra lo que M5 dejó fuera a propósito: fases de obra por proyecto, fotos y
la marca de publicación al portal.

## 2. Estado real hoy, verificado en el repositorio

| Pieza | Estado | Evidencia |
|---|---|---|
| Tablas `construction_phases`, `files`, `goals`, `commissions`, `broker_profiles` | ✅ existen | `src/infrastructure/db/schema.ts` |
| `goals` / `commissions` / `broker_profiles` alimentadas por el cierre | ✅ probado en Postgres real | `api/pipeline/[id]/etapa/_cierre.ts`, `docs/F2_ESTADO.md` |
| Perfil de broker (especialidad, alquileres, meta mensual) editable | ✅ | M13, `configuracion/_usuarios.tsx` |
| Invitación de usuarios | ✅ | `api/usuarios` (decisión #28) |
| Permisos sembrados para los 4 recursos | ✅ | `db/seed.sql`: admin todo; asistente `view` (+ `edit` en fases); broker `view own` |
| Rutas `/avances`, `/brokers`, `/metas`, `/comisiones` con guardia de permiso | ✅ | `page.tsx` con `requireScopeInPage` |
| **Vistas conectadas** | ❌ las 4 con datos de muestra y comentario `ponytail:` | `vista.tsx` |
| **Escritura en `construction_phases`, `files`, `goals` (meta), `commissions` (estado)** | ❌ no existe | — |
| Almacenamiento de archivos | ❌ ningún bucket, ningún uso de Storage | `grep storage src` vacío |
| `SUPABASE_SERVICE_ROLE_KEY` en `.env` | ❌ **no está** | pendiente del usuario desde F2 |

## 3. Los hallazgos que cambian el plan

### 1. Las fases no tienen responsable propio: el alcance `own` pasa por el proyecto

El broker tiene `construction_phases:view own`, pero la tabla no tiene
`broker_id`. No hace falta columna (esquema congelado): el alcance se aplica al
**proyecto** con `visibleRows(actor, scope, projects.brokerId, projects.deletedAt)`
y las fases se leen solo de un proyecto que pasó ese filtro — mismo patrón que
`api/pipeline/[id]/propiedades` ya usa.

### 2. `projects.progress_percent` es un caché de las fases

Su comentario dice «derivado de las fases, cacheado para listados». Toda escritura
de una fase recalcula el promedio de `progress_percent` de las fases del proyecto
**en la misma transacción**. Así la rejilla de M5 no se toca y nunca miente.

### 3. «R2» del mapeo ya no aplica: las fotos van a Supabase Storage

El mapeo es anterior a la decisión #12. Supabase Storage viene con el proyecto y
con `@supabase/supabase-js`, ya instalado — **cero dependencias nuevas**. Bucket
**privado** `avances-obra`, subida por route handler con `adminClient()` después
de `requireScope` (mismo criterio que la invitación, decisión #28), fila en
`files` (`entity_type = 'construction_phase'`) y **URLs firmadas** generadas en el
servidor al pintar. El portal público (Sistema 1) está fuera de alcance (§15); que
el bucket sea privado significa que nada se filtra antes de publicar. El bucket se
crea en `db/seed.sql` (`INSERT INTO storage.buckets … ON CONFLICT DO NOTHING`),
idempotente como el resto del seed.

**Bloqueo conocido:** sin `SUPABASE_SERVICE_ROLE_KEY` la subida responde un error
claro y todo lo demás de M6 funciona.

### 4. «Publicar en el portal» es una marca, no una integración

`construction_phases.is_published` + `published_at`. El portal que la lea es otro
producto. F3 entrega el contrato (qué campos ve el comprador: nota, porcentaje,
fotos, video) y la marca auditada — nada más.

### 5. La meta del mes tiene dos fuentes y el cierre elige la equivocada

`broker_profiles.monthly_target_deals` (editable en M13) es la meta mensual
**por defecto** del broker. `goals.target_deals` es la meta **de un mes
concreto**. Hoy, el primer cierre del mes crea la fila de `goals` con
`target_deals = 0`, y desde ese instante el mes aparece «sin meta» aunque el
perfil diga 4.

Corrección mínima en `incrementarMeta` (`_cierre.ts`): al **insertar**, tomar
`target_deals` del perfil del broker; el `ON CONFLICT` sigue tocando solo
`achieved_*`. La meta de la compañía (sin perfil) sigue naciendo en 0 hasta que el
administrador la fija. M8 escribe `target_*` con el mismo `ON CONFLICT` pero en
sentido inverso: **nunca toca `achieved_*`** — esos solo los escribe el cierre
(criterio #4: exactamente una vez).

### 6. Aprobar y pagar no son ediciones libres: son transiciones

`commissions.status`: `pending → approved → paid`, y `pending | approved → void`.
Una función pura en `domain/` (como `transicion-etapa.ts`) decide qué transición
es válida; el route handler la aplica con `approved_by`/`approved_at`/`paid_at`.
El reparto broker/agencia (el `60% / 40%` del prototipo) solo es editable en
`pending` y se recalcula con `calcularComision`, que ya existe y ya cuadra al
centavo. Permiso: `commissions:edit` (solo admin según el seed).

### 7. Exportar es texto: CSV desde un route handler

«Exportar reporte» es `GET /api/comisiones/export` con `text/csv`, filtrado con
los mismos `searchParams` y `visibleRows` que la tabla, y `commissions:export`.
Sin librería de hojas de cálculo — Excel abre CSV. (Mismo criterio que el `.ics`,
decisión #25.)

### 8. M7 casi no escribe: reutiliza M13 y M5

- **Invitar broker** = el formulario y el endpoint de M13 con el rol broker
  preseleccionado. No se duplica.
- **Editar perfil** ya existe en M13. «Ver perfil» es una página de lectura
  `/brokers/[id]`.
- **Asignar propiedades** es la única escritura nueva: fija `projects.broker_id`
  del conjunto elegido, con `projects:edit` y auditado por proyecto.
- Nivel, ventas del año, negocios activos y % de meta son **consultas** sobre lo
  que el cierre ya escribió.

## 4. Análisis módulo por módulo

### 4.1 M8 · Metas — `size: S`

- `/metas` con selector de periodo real (`?periodo=2026-09`, por defecto el mes
  en hora de Santo Domingo con `fechaSantoDomingo`).
- Anillo y encabezado: meta de la compañía (alcance `all`) o la propia (`own`).
- Tabla por broker: meta, logrados, cumplimiento, nivel — `visibleRows` sobre
  `goals.brokerId`. Un broker nunca ve la fila de la compañía (`broker_id` nulo no
  cumple `= userId`).
- Gráfico anual: 12 barras de `achieved_deals` del año, marcada `hit` cuando
  `achieved >= target` y `target > 0` (R12 deja de ser el literal 10).
- `PUT /api/metas` (`goals:edit`): fija `target_deals`/`target_amount_cents` de un
  broker o de la compañía para un mes. Auditado.
- Corrección del hallazgo 5 en `incrementarMeta`.
- **Umbrales de nivel de broker**: siguen provisionales en
  `domain/cierre-negocio.ts` salvo que el negocio los confirme — es una pregunta,
  no código (§6).

### 4.2 M9 · Comisiones — `size: M`

- `/comisiones` con KPIs de consulta (del mes, pendientes, pagadas), filtros
  reales por broker, periodo (`closed_date`) y estado vía `searchParams`, y
  `visibleRows(actor, scope, commissions.brokerId)`.
- Columna Negocio = contacto + proyecto de la unidad principal (joins).
- `PATCH /api/comisiones/[id]`: transición de estado (dominio puro, probado) y
  reparto editable solo en `pending`. Auditado.
- `GET /api/comisiones/export`: CSV con los mismos filtros.

### 4.3 M6 · Avances de obra — `size: M`

- `/avances?proyecto=<slug>`: selector de proyecto (proyectos visibles), línea de
  tiempo con las fases reales ordenadas por `position`, editor de la fase elegida.
- Proyecto sin fases: botón «Crear las 8 fases estándar» (la lista del prototipo
  como constante marcada `ponytail:`), más alta, renombrado y borrado de fases
  sueltas — número parametrizable por proyecto.
- `POST/PATCH/DELETE /api/proyectos/[id]/fases…` (`construction_phases:edit`),
  recalculando `projects.progress_percent` en la transacción. Borrado de fase:
  `DELETE` real (la tabla no tiene `deleted_at`; congelada) — auditado con el
  estado anterior.
- Fotos: `POST /api/proyectos/[id]/fases/[faseId]/fotos` (multipart, imagen,
  ≤ 10 MB) → Storage + `files`; borrado lógico de foto; URLs firmadas al pintar.
- «Publicar en el portal»: marca `is_published`/`published_at`. Auditado.
- Enlace «Ver avances» desde el detalle del proyecto en `/propiedades/[slug]`.

### 4.4 M7 · Brokers — `size: S`

- `/brokers`: tarjetas de usuarios con perfil de broker y activos; `visibleRows`
  sobre `broker_profiles.userId` (el broker se ve a sí mismo).
- Datos por tarjeta: nivel, ventas del año, negocios activos (etapa `open`), % de
  meta del mes.
- `/brokers/[id]`: perfil, proyectos asignados, negocios abiertos, metas de los
  últimos meses.
- «Asignar propiedades»: `PUT /api/brokers/[id]/proyectos` con la lista de
  proyectos (`projects:edit`, alcance `all`), auditado por proyecto.
- «Invitar broker»: el formulario de M13 con rol broker.

## 5. Orden

```
M8 Metas ──▶ M9 Comisiones ──▶ M6 Avances ──▶ M7 Brokers
```

Ninguno comparte tablas de escritura salvo M7 sobre `projects.broker_id` (dueño
M5, frontera anotada en §12: la asignación de propiedades es de M7). Nadie toca
`schema.ts`.

Se construye **en serie** sobre `dev/jvven`, un commit por issue: M8 primero
porque corrige el cierre (hallazgo 5) y M7 lo consume; M9 depende solo del cierre;
M6 es el más grande y el único con Storage; M7 al final porque agrega M5 y M8.

## 6. Decisiones

| # | Asunto | Decisión |
|---|---|---|
| 32 | Alcance `own` en fases de obra | Se hereda del proyecto (`projects.broker_id`); sin columna nueva |
| 33 | Fotos de obra | Supabase Storage, bucket privado creado en el seed, subida con `adminClient()` tras `requireScope`, URLs firmadas al pintar |
| 34 | Publicar al portal | Marca `is_published`/`published_at`; el portal es otro producto |
| 35 | Meta mensual | `goals.target_*` por mes; al nacer la fila en un cierre toma `monthly_target_deals` del perfil; M8 nunca escribe `achieved_*` |
| 36 | Estado de comisiones | Transiciones cerradas en dominio puro; reparto editable solo en `pending` |
| 37 | Exportaciones | CSV generado en servidor con los mismos filtros y permiso `export` |
| 38 | M7 | Reutiliza invitación y perfil de M13; solo escribe la asignación de proyectos |

**Pendientes del lado del usuario/negocio, no bloqueantes:**

- `SUPABASE_SERVICE_ROLE_KEY` en `.env` — sin ella no se suben fotos (ni se envían
  invitaciones, igual que en F2).
- Umbrales de nivel Senior+, Top Producer y Top Leader — hoy provisionales.

## 7. Plan de implementación

Cada issue es un commit sobre `dev/jvven`, con
`npm run typecheck && npm run lint && npm test && npm run build` en verde y
`/ponytail-review` sobre su diff.

1. **M8 · Metas** — corrección de `incrementarMeta`, página conectada, `PUT
   /api/metas`. *Verificación:* prueba de que fijar meta no altera `achieved_*`;
   cierre en navegador → la meta sube 1.
2. **M9 · Comisiones** — `domain/comision-estado.ts` con pruebas, página
   conectada, `PATCH`, export CSV. *Verificación:* pruebas de transiciones
   inválidas (`paid → pending`, editar reparto en `approved`); broker solo ve las
   suyas.
3. **M6 · Avances de obra** — bucket en seed, fases, recálculo de avance, fotos,
   publicación. *Verificación:* prueba pura del promedio de avance; en navegador,
   crear fases, editar, ver `/propiedades` con el avance nuevo.
4. **M7 · Brokers** — tarjetas, perfil, asignación, invitación reutilizada.
   *Verificación:* asignar un proyecto a un broker → el broker lo ve en
   `/propiedades` en la petición siguiente.
5. **Cierre de fase** — prueba de interfaz completa (admin y broker),
   `/ponytail-audit`, `/ponytail-debt`, `docs/F3_ESTADO.md`, decisiones #32–#38 en
   `docs/contexto/decisiones.md`, PR contra `develop`.

## 8. Cuándo está terminado F3

1. Cerrar un negocio desde la interfaz se refleja en `/metas`, `/brokers` y
   `/comisiones` sin tocar SQL.
2. Un mes con meta fijada muestra cumplimiento real; el gráfico anual sale de
   `goals`.
3. Una comisión se aprueba y se paga, con autor y fecha; una transición inválida
   responde 409.
4. El CSV exportado coincide con la tabla filtrada y respeta el alcance.
5. Un proyecto tiene sus fases, su avance se recalcula solo y una fase se publica.
6. Con la clave de servicio configurada, una foto se sube y se ve; sin ella, el
   error es claro.
7. Un broker solo ve sus metas, sus comisiones, sus avances y su tarjeta —
   verificado en servidor.
8. Asignar un proyecto a un broker cambia lo que ese broker ve.
9. Todo lo anterior queda en `audit_log`.
10. `typecheck`, `lint`, `test` y `build` en verde.

## 9. Lo que F3 deliberadamente no construye

- **Portal público / API para el portal** — Sistema 1, fuera de alcance (§15).
- **Pago real de comisiones** (transferencias, nómina) — solo el estado.
- **Metas por monto en la interfaz de broker** más allá del campo — la pantalla
  aprobada mide negocios.
- **Recalcular niveles de todos los brokers** al cambiar umbrales — el nivel se
  reevalúa en cada cierre; un recálculo masivo espera a que haya umbrales reales.
- **Automatizaciones §10.3 #1 y #3** — siguen anotadas desde F2 como paso aparte.
- **Issue #25** (F1) — decisión de alcance pendiente, no se toca.

## 10. Ponytail

Igual que F2: la escalera antes de escribir y ninguna dependencia nueva — Storage
ya viene en `@supabase/supabase-js`, el CSV es texto, las fechas son
`fechaSantoDomingo`/`Intl`. Se reutilizan `visibleRows`, `requireScope`,
`parseInput`, `errorResponse`, `auditar`, `transaction`, `calcularComision`,
`evaluarNivelBroker` y el formulario de invitación de M13. Todo atajo con techo
lleva su `ponytail:`. `/ponytail-review` por issue; `/ponytail-audit` y
`/ponytail-debt` al cierre, sin excepción.
