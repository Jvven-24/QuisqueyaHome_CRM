# Metas

## Propósito
Fijar y seguir objetivos de cierres y de monto por mes: meta de compañía, meta por broker, metas por proyecto y por equipo, y la regla versionada que atribuye cada cierre a un proyecto o equipo. Muestra el logro por moneda, el ritmo del mes y el ranking por asesor.

Buenas prácticas de industria (preventa y proyectos, RD):
- La meta se mide sobre cierres firmados (contrato firmado y con reserva confirmada), no sobre reservas. Definir el evento que cuenta antes de fijar cifras.
- Seguimiento de ritmo (lo que debería llevar a la fecha) además del acumulado.
- Metas separadas por moneda (USD y DOP); no sumar montos de monedas distintas.
- Reglas de atribución versionadas: un cierre se atribuye con la regla vigente a la fecha del cierre, y las reglas pasadas no cambian.
- Ajustar metas por nivel de broker (`level`) y por periodo (temporadas de venta).

## Roles y permisos
Recurso RBAC: `goals` (view, edit).

| Rol (slug) | Acciones | Alcance | Efecto |
|---|---|---|---|
| Administrador (`admin`) | view, edit | all | Todas las metas; compañía, proyectos, equipos y atribución |
| Gerente (`manager`) | view, edit | team | Metas de los brokers de su equipo |
| Asistente (`assistant`) | view | all | Consulta |
| Broker (`broker`) | view | own | Solo su meta y su rendimiento |

- Fijar o reiniciar meta por broker (`PUT` / `DELETE /api/metas`): exige `goals:edit` y que el alcance llegue al broker (`reaches`). La meta de compañía (`brokerId` nulo) solo con alcance `all`.
- Metas por proyecto o equipo, equipos y regla de atribución (`/api/metas/alcances`, `/equipos`, `/atribucion`): solo alcance `all` (`soloCompania`).
- Nota: la vista muestra el aviso "Solo la administración asigna metas", pero el gerente sí puede fijar metas de su equipo. El texto debe corregirse.

## Flujos principales
1. Ver el mes: logro de compañía y de cada broker, por moneda, con ritmo y tendencia mensual.
2. Fijar meta mensual de un broker o de compañía (`PUT /api/metas`): cierres objetivo y monto opcional con moneda. Usa `Idempotency-Key`.
3. Reiniciar una meta (`DELETE /api/metas`): el objetivo queda en cero y sin monto; los cierres ya logrados se conservan y el cambio queda auditado.
4. Fijar meta por proyecto o por equipo (`PUT /api/metas/alcances`), solo administración.
5. Crear o editar equipo con líder y miembros (`PUT /api/metas/equipos`).
6. Publicar una regla de atribución nueva (`POST /api/metas/atribucion`): queda aprobada y activa; la versión anterior deja de ser activa.
7. Cuando un negocio se cierra, el logro se actualiza en la misma transacción del cierre.
8. Consultar el ranking por asesor y las metas de proyecto y equipo.

## Datos
- `goals`: `broker_id` (nulo = compañía), `year`, `month`, `target_deals`, `target_amount_cents`, `achieved_deals`, `achieved_amount_cents`, `currency` (USD por defecto). Únicos por broker y periodo, y uno solo de compañía por periodo.
- `scoped_goals`: meta por proyecto o equipo (`scope_type` project o team), `scope_id`, `year`, `month` (1 a 12), `target_deals`, `target_amount_cents`, `currency` (USD o DOP). Única por alcance y periodo.
- `teams`, `team_members`: equipo con líder opcional y miembros.
- `attribution_rules`: `version`, `scope`, `rule`, `config` (JSON), `is_active` (solo una activa), `approved_by`, `approved_at`.
- `broker_profiles.level` y `monthly_target_deals`: nivel y meta base del broker.
- `deals` y `deal_stage_history`: fuente del logro.

Faltan: meta por etapa de pipeline (forecast ponderado) y una vista del historial de cambios de meta.

## Estados de UI
| Estado | Situación en código | Qué debe mostrar |
|---|---|---|
| Vacío | Sí: "Sin meta fijada para este mes"; "Sin equipos"; "Sin regla aprobada" | Mensaje y acción según permiso |
| Cargando | Sí: `metas/loading.tsx` | Esqueleto de tarjetas y tabla |
| Error | Sí: `metas/error.tsx`; errores de formulario con `role="alert"` | Aviso con reintento; el borrador se conserva |
| Sin permiso | Sí: `AvisoPermiso` para quien solo consulta | "Tu rol permite consultar tu rendimiento" |
| Éxito | Sí: "Meta reiniciada", "Meta eliminada" y actualización de la vista | Confirmación con periodo y nombre |
| Parcial | Sí: sin conexión, el borrador se conserva | "Sin conexión. Reconecta para guardar" |

## Estado actual vs PRD
Fuentes: código en `/tmp/qh-review` y `AUDITORIA-MODULOS.md` (27/10/2026, Metas: severidad Baja).

- **Existe y funciona:** metas de compañía y de broker por periodo; reinicio auditado; metas por proyecto y equipo; equipos; regla de atribución versionada; ranking y tendencia; `Idempotency-Key` en PUT, DELETE y regla.
- **Discrepancias a verificar:**
  - La auditoría dice que se ignora `Idempotency-Key`. El código lo aplica con `conIdempotencia("META")`.
  - La auditoría señala que el DELETE lleva el identificador en el cuerpo JSON. Conviene pasarlo a la ruta, porque muchos proxies descartan el cuerpo de un DELETE.
  - La vista dice que solo la administración asigna metas, y el seed da al gerente `goals:edit` en team.
- **Falta:** gráfico de tendencia de ritmo con alertas; metas por proyecto en el dashboard; forecast por etapa.
- **PRD (compendio):** no define metas. Solo menciona "métricas" en la fase de CMS y "métricas de negocio" en el PRD de la web pública.

## Checklist de aceptación
- [x] Meta por broker y de compañía por mes
- [x] Reinicio de meta auditado sin perder cierres
- [x] Metas separadas por moneda (USD y DOP)
- [x] Equipos con líder y miembros
- [x] Regla de atribución versionada, una activa
- [x] Idempotency-Key en la escritura de metas
- [ ] Alerta de ritmo por debajo de lo esperado
- [ ] Metas por proyecto visibles en Inicio
- [ ] Aviso de permiso alineado con el rol gerente
- [ ] Definición del evento que cuenta como cierre

## Dependencias
- **Negocios:** logro al cerrar (`deals`, `deal_stage_history`).
- **Brokers:** nivel, cartera y tablero de cumplimiento.
- **Comisiones:** mismo cierre genera la comisión.
- **Reportes e Inicio:** KPI de cumplimiento.
- **Proyectos y unidades:** metas por proyecto.
- **Auditoría y RBAC:** `audit_log`, `requireScope`, `reaches`, `soloCompania`.
- **Idempotencia HTTP:** `http_idempotency` para metas.
