# T-E1-1b2 · Negocios: cierre con venta única en BD, pérdida con motivo y evento al outbox

Ficha: M03

Perfil: **D11 Datos + D10 Backend**. Productor: Codex (gpt-6.1-sol, HAPI). Revisión independiente: Antigravity (QA/otro proveedor) + D12 sobre permisos + orquestador con comandos.
Ficha: `M03-negocios.md` (READY) §5 «Datos objetivo afectados por la Decisión #47», §8 CA-06, 07, 08, 09, 12, 20, 21, 22, 28, 29. Decisión firmada #47 (`docs/contexto/decisiones.md:311`).
Requisito previo: T-E1-1b1 entregada y en verde (las consultas viven en `src/application/pipeline/consultas.ts`). Si no lo está, para y avisa.
Modo: fix, escribes código y migración. **Sin git, sin commit, sin `npm run dev` ni `build`**, sin tocar la VPS ni leer `.env*`. Máximo 45 min.

## Qué construir
1. **Migración** (Drizzle, `drizzle/0004_*.sql`, con su entrada en `meta`; no edites migraciones anteriores): tabla durable de **ventas de unidad** con `unitId NOT NULL UNIQUE`, `dealId NOT NULL UNIQUE`, FK **restrictivas** (sin `ON DELETE CASCADE`), `.enableRLS()`, sin predicado por `deletedAt`; en `deal_properties`, baja lógica (actor, fecha, motivo) y UNIQUE parcial «una principal vigente por negocio» (CA-09). Identidad de unidad = proyecto + código normalizado, con UNIQUE (reutiliza la normalización de M04, una sola fuente). CHECK de monto ≥ 0 y probabilidad 0–100 donde falten.
2. **Cierre ganado** (`src/application/pipeline/cierre.ts` + repositorio): unidad concreta obligatoria (elegir una del proyecto autorizado o crear la mínima); dentro de **una sola transacción**: bloquear negocio y unidad, insertar la venta única, comisión/metas heredadas, historial, auditoría y **un solo** evento `NegocioCambioEtapa` al outbox (`OutboxCrm`, payload `{id, stageId}`). Dos cierres simultáneos de la misma unidad: gana uno, el otro recibe **409 saneado** sin comisión, metas, historial ni evento. Repetir el cierre no duplica efectos. El broker no introduce ni recibe el precio de lista real.
3. **Perder (No concretado)**: exige motivo activo del catálogo y comentario no en blanco; archivo lógico, **nunca DELETE**; el contacto sigue disponible para nuevas negociaciones. Un fallo conserva el estado anterior (diálogo y datos intactos para la UI).
4. **Prerrequisitos de etapa** (CA-06): Contactado exige actividad propia completada; Presentación, próxima acción propia pendiente con responsable y fecha; Preselección, interés activo; Negociación, los datos requeridos. Si no se cumplen: rechazo sin cambiar negocio, historial, auditoría ni outbox. Misma etapa → sin historial ni evento.
5. Fallo del outbox ⇒ **rollback completo** (incluida la unidad/venta/comisión). El proveedor externo caído no impide mover, perder ni cerrar localmente.
6. **Fuga conocida a cerrar (hallazgo de b1):** `src/app/api/pipeline/[id]/route.ts:56` responde `Response.json({ ok: true, negocio })` con el objeto persistido completo y su schema admite `commissionBasisPoints` (`:24`). La respuesta de cada mutación (PATCH, etapa, propiedades) debe pasar por el mismo DTO restrictivo por rol de b1: el broker no recibe comisión de terceros ni precio real; prueba con valores centinela.
7. Entrada validada con Zod (fecha imposible, booleano textual, rango invertido, dinero no entero seguro, ID ajeno → rechazados sin 500 ni filtración de detalles). Permisos en servidor antes de leer datos.

## Pruebas obligatorias
- Unitarias con doble en memoria para cada regla (patrón de `cierre.test.ts`).
- **`npm run test:db` con carrera real:** dos conexiones PostgreSQL sincronizadas cierran la misma unidad con dos negocios distintos; exactamente una confirma, la otra 409; compara BD (una venta, un negocio ganado, una comisión, un incremento de metas, un historial, un evento). Un `INSERT` directo duplicado en la tabla de ventas es rechazado por la restricción.
- **Prueba de mutación (CA-29)** con el patrón `test:db:mutation:*`: quita temporalmente el `UNIQUE(unitId)` (o el motivo obligatorio) y la prueba específica debe fallar; documenta el comando y el resultado, y deja restaurado todo.
- Guardas de arquitectura y seguridad sin debilitar; RLS en la tabla nueva comprobada.

## Hecho cuando (pega la salida real)
`npm run typecheck` · `npm run lint` · `npm test` · `npm run test:db` · `npm run spec:check` sin errores nuevos.

## Entrega
`.viltrum/vre-os/evidencia/E1/negocios/D11-D10-b2-cierre.md`: archivos tocados, migración, decisiones, salida de los cinco comandos, la mutación y su resultado, y lo no verificado. Termina con `ESTADO: ENTREGADO` o `ESTADO: BLOQUEADO — motivo`.

## Desbloqueo 2026-10-13 · Regla S-303-N (SUPUESTO técnico, dueño D11/D00, reversible)
Codex paró con razón: no existe ficha M04 ni normalizador. Hasta que M04 lo defina, rige esta regla; no es decisión del cliente y se revierte con una migración.
1. **Una sola función de normalización** en dominio (`src/domain/`, p. ej. `unidades.ts`): `normalizarCodigoUnidad(code)` = Unicode NFKC → quitar diacríticos → `trim` → mayúsculas → toda secuencia de espacios, `_` y guiones/rayas (`- ‐ ‑ – — −`) pasa a un solo `-`. Resultado vacío ⇒ error de validación (código en blanco). Ejemplos: `" a 101 "`, `"a_101"`, `"A–101"` ⇒ `A-101`.
2. **No se modifica `units_project_code_unq` ni el comportamiento actual de Propiedades (M04).** La identidad durable vive en la **tabla de ventas**: columnas `project_id` y `unit_code_normalized` (NOT NULL, CHECK no blanco y `= upper(btrim(...))`) con **`UNIQUE(project_id, unit_code_normalized)`**, además de `UNIQUE(unit_id)` y `UNIQUE(deal_id)`. Así, aunque una unidad vendida se archive y se cree otra fila con el mismo código, la segunda venta del mismo proyecto+código es rechazada por la base.
3. **Elegir/crear unidad al cerrar:** busca por `(project_id, normalizarCodigoUnidad(code))` entre unidades **no archivadas**; si existe, úsala (no crees otra). Si solo coincide una **archivada**, rechaza con error claro y no la resucites en silencio. Si no hay coincidencia, crea la unidad mínima (proyecto autorizado, código, sin precio real) dentro de la misma transacción.
4. Pruebas: vectores de normalización (los ejemplos de arriba, acentos, guiones largos, espacios internos, vacío); venta duplicada con código escrito distinto (`a 101` vs `A-101`) rechazada por la restricción; unidad archivada tras vender no permite una segunda venta del mismo código; migración sobre la base poblada (184 negocios) sin perder datos.
Continúa desde tu entrega anterior (`D11-D10-b2-cierre.md`), reutiliza lo que ya está bien y **reescribe ese mismo informe** al terminar.

## Desbloqueo 2 · 2026-10-13 · Regla S-303-H (SUPUESTO, dueño D11/D00, reversible)
Segunda parada de Codex, también correcta: 15 negocios ganados sembrados (IDs 1000000–1000014) no tienen unidad principal concreta y el preflight de `drizzle/0004` aborta la migración. No existe correspondencia negocio→unidad y **no se inventa**.
1. **La venta única rige hacia adelante.** El registro de ventas contiene solo cierres con unidad concreta. El preflight deja de abortar: la migración hace el backfill únicamente de los negocios ganados que sí tienen unidad principal concreta, y para los demás emite un aviso (`RAISE NOTICE` con la cuenta) sin escribir filas inventadas ni tocar esos negocios.
2. Esos negocios son **«venta histórica sin unidad»** (legado): siguen ganados, conservan comisión, historial y auditoría, y se obtienen con una consulta de lectura (`ganados sin fila en unit_sales`) que debe existir como función en `application/pipeline/consultas.ts` con su prueba, para que la UI pueda mostrarlos y alguien concilie después con el responsable del dato.
3. **Cualquier cierre nuevo** sigue exigiendo unidad concreta (CA-08). Reabrir/volver a cerrar uno de esos legados exige elegir la unidad en ese momento.
4. Pruebas: el ensayo poblado sobre la copia de la base de 184 negocios debe **terminar con éxito**, con registro de ventas = ganados con unidad, y la consulta de legado devolviendo exactamente los 15 IDs; conteos y SHA de columnas originales intactos; base de desarrollo idéntica antes/después. `npm run test:db` debe volver a exit 0 de verdad.
Reescribe `D11-D10-b2-cierre.md` al terminar con las salidas reales de los cinco comandos.
