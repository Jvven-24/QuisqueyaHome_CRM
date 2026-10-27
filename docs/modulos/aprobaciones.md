# Aprobaciones

## Propósito
Concentrar en una bandeja las decisiones que no puede tomar una sola persona: descuentos sobre precio, prórrogas de hold, liquidaciones de comisión y fusiones de contactos. Cada decisión muestra expediente, política aplicada, responsable e historial, y queda auditada en servidor.

Buenas prácticas de referencia (CRM inmobiliario RD y finanzas comerciales):
- Cuatro ojos: quien solicita no aprueba su propia solicitud, y el aprobador no puede ser el mismo que propuso el cambio.
- Política por tipo y monto (por ejemplo, descuento por encima de un porcentaje o liquidación por encima de un monto), versionada.
- Decisiones con motivo obligatorio y, para importes, verificación de MFA.
- Solicitudes con vencimiento; una solicitud vencida no se puede aprobar, solo se vuelve a pedir.
- Aprobar fija el contenido: si el expediente cambia después, la aprobación se invalida (hash del contenido).
- Ver la bandeja no concede permiso para decidir.

## Roles y permisos
Recurso de la pantalla: `dashboard` (view). Para decidir se propone un recurso financiero propio.

| Rol | Ver la bandeja (`dashboard`) | Decidir | Estado |
|---|---|---|---|
| Administrador | view: `all` (seed) | Propuesto: `financial_approvals` (sin concesiones hoy) | Ver todo |
| Asistente | view: `all` (seed) | No | Ver todo, sin decidir |
| Broker | view: `own` (seed) | No | Ver solo sus solicitudes |
| Gerente | view: `team` (0017) | Propuesto: solo las de su equipo, nunca las propias | Ver equipo |

- `financial_approvals` pertenece a los recursos financieros: "declarar una capacidad no concede acceso a ningún rol", así que hoy nadie puede decidir.
- La página exige `dashboard:view` en servidor (`requireScopeInPage`).

## Flujos principales
1. El solicitante crea una solicitud desde el negocio, el hold o la liquidación (propuesto; hoy no hay API ni formulario).
2. El sistema asigna la solicitud a un aprobador según la política por tipo y monto, excluyendo al solicitante.
3. El aprobador abre el detalle: expediente, política aplicada, historial y evidencia.
4. Aprueba o rechaza con motivo. Si es un importe, verifica MFA (`mfa_verified_at`).
5. La decisión se confirma en servidor, se registra en auditoría y se aplica al objeto (por ejemplo, el lote de pago de comisiones).
6. Si la solicitud vence (`expires_at`) sin decisión, pasa a expirada y no se puede decidir.
7. Hoy: el botón "Revisar aprobaciones" de Inicio abre esta vista de ejemplo. Las acciones abren un diálogo que no guarda nada y dice "Solicitud de ejemplo · no es una operación real".

## Datos
Tabla existente: `financial_approval_requests` (esquema con RLS):
- `public_id`, `batch_id` (lote de liquidación) o `entry_id` (entrada de comisión), exactamente uno.
- `adjustment_amount_cents`, `adjustment_reason`, `adjustment_reversal_of_id` (ajuste y su reverso).
- `object_version` y `content_hash` (SHA-256 del contenido aprobado).
- `status`: pendiente, aprobada o rechazada. Restricción: solo una aprobada por lote.
- `requested_by`, `decided_by`, `decided_at`, `mfa_verified_at`, `evidence_id` (archivo), `expires_at`.

Sin tabla propia hoy: descuentos (no hay entidad de descuento en el esquema), holds en prórroga (se piden desde `holds`) y fusiones de contactos.

## Estados de UI (D06)
La vista actual tiene un selector "Estado de demostración" visible para el usuario. Estados que muestra:
- **Con ejemplos:** cuatro solicitudes de ejemplo con filtros por tipo y búsqueda.
- **Cargando:** "Cargando solicitudes de ejemplo…" (simulado).
- **Vacío:** "No hay solicitudes pendientes" o "Sin coincidencias".
- **Error:** "No se pudo cargar la bandeja de ejemplo" con "Reintentar" (simulado).
- **Sin conexión:** "Las decisiones requieren conexión y confirmación del servidor. No se encolan aprobaciones."
- **Sin permiso:** "Consultar la bandeja no concede permiso para aprobar."
- **Éxito:** no existe; la decisión real debe mostrar folio y confirmación del servidor.

Propuesto: quitar el selector de demostración en producción y usar los estados reales (vacío, cargando, error, sin permiso por 403, éxito con folio y parcial cuando una decisión se guarda pero el efecto aguas abajo falla).

## Estado actual vs PRD
El compendio (`ref/compendio.txt`) no contiene PRD para Aprobaciones. No aparece en las fases ni en las historias de usuario; se considera fuera del alcance inicial (CRM completo).

Qué existe y funciona (código real):
- La página, el permiso `dashboard:view` y la navegación desde Inicio.
- El esquema de `financial_approval_requests` con MFA, hash de contenido y restricciones de estado.

Qué es demo o falta:
- Toda la vista usa 4 registros de ejemplo (`_ejemplo.ts`); ninguna acción persiste nada.
- No hay API, casos de uso ni política de aprobación para ninguno de los cuatro tipos.
- Descuentos sin entidad ni solicitud persistida; fusiones sin flujo.
- Auditoría de decisiones y vencimientos no implementados.
- Riesgo (auditoría 27/10/2026): el selector de estados de demostración se muestra al usuario final.

## Checklist de aceptación
- [x] Esquema de solicitudes con MFA y hash en BD
- [ ] Bandeja real de solicitudes persistidas
- [ ] Política de aprobación por tipo y monto
- [ ] Quien solicita no puede aprobar su solicitud
- [ ] Decisión con motivo, MFA y auditoría
- [ ] Solicitudes vencidas no se pueden decidir
- [ ] Descuentos con solicitud y decisión persistidas
- [ ] Liquidaciones aprobadas en servidor con evidencia
- [ ] Sin selector de estados de demostración en producción

## Dependencias
- **Comisiones:** liquidaciones y entradas de comisión (`batch_id`, `entry_id`), ajustes y reversos.
- **Negocios:** descuentos sobre precio y propuestas.
- **Reservas:** prórrogas de hold (`holds:edit`).
- **Contactos:** fusión de duplicados.
- **Configuración y RBAC:** recurso `financial_approvals`, roles, políticas y MFA.
- **Auditoría:** registro de cada decisión.
- **Archivos (documentos):** evidencia de cada solicitud.
- **Inicio:** enlace "Revisar aprobaciones".
- **Integraciones:** ninguna; MFA del proveedor de autenticación (por confirmar).
