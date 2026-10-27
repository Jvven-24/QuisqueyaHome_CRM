# Reportes

## Propósito
Dar a la dirección y a la operación comercial una lectura agregada del embudo, canales, zonas, brokers, velocidad de cierre, inventario, comisiones y pronóstico ponderado de Quisqueya Home, sin exponer filas de personas ni credenciales. Es solo lectura: no modifica negocios ni comisiones.

Buenas prácticas de referencia (CRM inmobiliario RD, preventa y brokers):
- Medir por fuente y por proyecto (costo por lead, lead a visita, visita a reserva), no solo volumen total.
- Separar métricas por fecha de evento (lead recibido, negocio cerrado, reserva confirmada) y declarar la metodología en pantalla.
- Pronóstico ponderado por etapa y probabilidad, mostrando cuántos negocios no tienen monto o probabilidad.
- Montos en USD y DOP separados; nunca sumar monedas sin conversión declarada.
- Informes programados con destinatarios autorizados y entrega registrada, no adjuntos sueltos.

## Roles y permisos
Recurso RBAC: `reports` (view, export); además `dashboard` para los KPI de Inicio que se muestran en la vista.

| Rol | `reports` | `dashboard` | Resultado hoy |
|---|---|---|---|
| Administrador | view, export: `all` (seed) | view: `all` | Acceso total a /reportes |
| Asistente | view, export: `all` (seed) | view: `all` | Acceso total a /reportes; sin ver métricas de configuración |
| Broker | sin fila → `none` | view: `own` | Recibe 403 en /reportes; ve solo KPI propios en Inicio |
| Gerente | sin fila → `none` (migración 0017 no la concede) | view: `team` (0017) | Recibe 403 en /reportes |

- La página exige `reports:view` en servidor (`requireScopeInPage`); el botón de exportar exige `reports:export`.
- La consulta SQL ya aplica `own`, `team` y `all` mediante `visibleRows` en leads, negocios, unidades y comisiones. El ROI por fuente solo se calcula con alcance `all` y sin filtro de broker o proyecto.
- Propuesta: dar `reports:view` con alcance `team` al gerente (usa `manager_scopes`) y `own` al broker, con la misma pantalla acotada a su cartera.

## Flujos principales
1. El usuario con `reports:view` abre /reportes. El servidor valida el permiso y lee `desde`, `hasta`, `projectId` y `brokerId`.
2. Si el rango o los IDs son inválidos, se rechaza la consulta con un error de validación (fecha, orden de fechas o identificador no entero positivo).
3. El servidor calcula la ventana de 18 meses de tendencia en America/Santo_Domingo y consulta los agregados por alcance.
4. La vista presenta las pestañas Embudo, Canales, Tendencia, Zonas, Brokers, Velocidad, Inventario, Comisiones y Pronóstico. La pestaña queda en la URL (`?tab=`) para compartirla.
5. El usuario cambia filtros; cada cambio vuelve a consultar al servidor.
6. Con `reports:export` puede exportar la tabla de canales a CSV (descarga en el navegador).
7. Imprime la vista con membrete (estilos de impresión).
8. Desde Inicio, un KPI enlaza a /reportes. Si la consulta falla, la tarjeta muestra error o sin conexión con reintento.
9. Propuesto: programar un informe (frecuencia, formato, destinatarios autorizados) y recibir la entrega por correo con registro de envío.

## Datos
No tiene tablas propias. Es un modelo de lectura sobre:
- `leads`, `deals` (negocios), `pipeline_stages` (etapa y tipo abierto/ganado/perdido), `loss_reasons`.
- `units` e `unit_inventory_states` (inventario por estado y antigüedad).
- `commissions` (comisiones por mes, broker y agencia; pagado).
- `campaign_spend` y fuentes (gasto para ROI). `zones` y `broker_profiles` para dimensiones.

Campos clave del resultado (`ReportSnapshot`, en centavos enteros, validado con `Number.isSafeInteger`):
- `asOf`, `desde`, `hasta`, `trendStart`, `projectId`, `brokerId`.
- `funnel`: `reachedCount`, `previousReachedCount`, `passRatePercent`.
- `sources`: `count`, `deals`, `won`, `revenueCents`, `spendCents`, `roiPercent`.
- `projection`: `totalWeightedCents`, `knownAmountCents`, `missingProbabilityCount`, `missingAmountCount`, `confidenceEstimated`.
- `velocity`: `medianDays`, `p75Days`, `sampleSize`.
- Propuesto (no existe): tabla de informes programados, destinatarios y registro de entregas.

## Estados de UI (D06)
- **Cargando:** `loading.tsx` de la ruta.
- **Vacío:** mensaje "Sin resultados" con "Limpiar filtros" cuando el filtro no encuentra datos; las tarjetas usan `common.empty`. No está verificado en todas las pestañas.
- **Error:** `error.tsx` de la ruta y estado `error` en la tarjeta, con reintento.
- **Sin conexión:** estado `offline` en la tarjeta.
- **Sin permiso:** `requireScopeInPage` responde 403 (página forbidden).
- **Éxito:** vista con datos y marca de tiempo `asOf`.
- **Parcial:** el pronóstico muestra cuántos negocios no tienen monto o probabilidad; `confidenceEstimated` queda vacío si no hay montos conocidos.

## Estado actual vs PRD
El compendio (`ref/compendio.txt`) no tiene PRD para Reportes. Su única referencia es la Fase 4 ("analítica de comportamiento, automatizaciones y BI"). El alcance inicial lo excluye.

Qué existe y funciona (código real):
- BI con agregados SQL por alcance, filtros, pestañas, tendencia y zona horaria local.
- Validación de filtros y de importes; pruebas unitarias de consultas y filtros (`consultas.test.ts`, `filtros.test.ts`).
- Exportación CSV de la tabla de canales y la página protegida por permiso.

Qué es demo o falta:
- "Informes programados" y "constructor" son una vista previa (`operaciones.tsx`), sin persistencia, scheduler ni entrega.
- Costo por lead no aparece como métrica; el ROI sí.
- El gerente y el broker no ven /reportes (sin concesión de `reports`).
- No hay pruebas de extremo a extremo de la pantalla.

## Checklist de aceptación
- [x] Métricas BI agregadas en SQL con alcance (own/team/all)
- [x] Filtros de periodo, proyecto y broker validados
- [x] Ventana de 18 meses en hora de Santo Domingo
- [x] Permiso reports:view exigido en servidor
- [x] Exportar tabla de canales a CSV (reports:export)
- [x] Estados de carga y error con reintento
- [ ] Informes programados por correo con destinatarios
- [ ] Constructor de informes personalizados
- [ ] Gerente y broker con métricas de su alcance
- [ ] Costo por lead por fuente y campaña

## Dependencias
- **Negocios y pipeline:** etapas, probabilidades, pérdidas y velocidad de cierre.
- **Leads y fuentes:** origen, gasto de campaña, ROI.
- **Propiedades (inventario):** estados y antigüedad de unidades.
- **Comisiones:** totales y pagado por mes.
- **Inicio (dashboard):** KPI que enlazan a /reportes.
- **RBAC y configuración:** `reports`, `dashboard`, `manager_scopes` para alcance de equipo.
- **Futuro:** proveedor de correo para informes programados (por definir).
