# Posventa

## Propósito
Seguimiento de la propiedad después de la venta: inspección y acta de entrega, pendientes de entrega, casos de servicio y garantías. Hoy es una vista previa con cuatro secciones y filas ficticias. En el menú aparece como M19 (`/posventa`, recurso `projects`, "Entrega y seguimiento de cada propiedad").

El compendio no define posventa como alcance. Su fuente funcional es la auditoría del 27/10/2026, con prioridad baja.

Buenas prácticas de industria (validar con asesoría legal):
- Separar tres hitos: entrega física, cierre comercial y transferencia jurídica. La vista previa ya lo dice.
- Acta de entrega firmada, con lista de observaciones y plazos de subsanación.
- SLA por categoría y prioridad, con responsable.
- Garantías con términos versionados y fecha de vencimiento. Los vicios de construcción tienen plazos legales propios (Código Civil); confirmarlos con abogado.
- Cerrar un pendiente solo con evidencia de la solución y confirmación del cliente. Marcar la unidad como entregada no cierra nada.
- Cobros fuera de garantía solo con consentimiento del cliente y aprobación interna.

## Roles y permisos
Hoy la página exige `projects:view` (provisional). Propuesta: recurso propio `aftersales` con las acciones `view`, `create`, `edit` y `close`.

- **Admin** (`admin`): `all`. Aprueba cobertura de garantía y cierres.
- **Gerente** (`manager`): `team`. Casos y entregas de su equipo.
- **Broker** (`broker`): `own`. Ve casos de sus negocios, abre casos y agenda inspecciones. No aprueba cobertura ni cierra.
- **Asistente** (`assistant`): `all` o `team` según su rol operativo. Agenda inspecciones y registra observaciones. No aprueba garantías ni cobros.

## Flujos principales
Todos los flujos son vista previa: muestran filas de ejemplo y no escriben.

1. El usuario abre Posventa. La página verifica `projects:view`.
2. **Entregas**: programa una inspección (unidad, fecha prevista, responsable, requisitos). Cada inspección tiene acciones de revisar requisitos, registrar observación, acordar subsanación y cerrar el acta.
3. **Pendientes**: registra una observación con ubicación, responsable y fecha acordada. Adjunta evidencia y solicita cierre verificado.
4. **Casos y servicio**: abre un caso con unidad, categoría y prioridad. Puede pedir información, agendar intervención, cotizar fuera de cobertura, cerrar con confirmación o reabrir.
5. **Garantías**: revisa la cobertura contra el contrato, solicita el documento, registra una excepción o pide consentimiento de cobro. No asume cobertura automática.
6. Flujo objetivo: el acta de entrega se firma en Documentos y solo se cierra si no quedan pendientes críticos.

## Datos
Tablas existentes: ninguna específica de posventa. Se reutilizan:
- `units`: la unidad afectada.
- `deals` y `unit_sales`: la venta y la unidad vendida.
- `financial_approval_requests`: aprobación de cobros fuera de garantía.

Entidades propuestas:
- `caso_posventa`: unidad_id, negocio_id, categoría, prioridad, estado, responsable_id, sla_vence_en, creado_en, cerrado_en, confirmado_por_cliente.
- `garantia`: negocio_id, versión de términos, cubre_desde, vence_en, excepciones.
- `inspeccion_entrega`: unidad_id, fecha prevista, responsable_id, requisitos, estado.
- `pendiente_entrega`: inspeccion_id, descripción, responsable_id, plazo, evidencia privada, estado.
- `acta_entrega`: inspeccion_id, versión, firmada_en.

Las fotos y la evidencia son privadas y se guardan en storage restringido.

## Estados de UI
- **Vacío**: no implementado. La vista siempre muestra filas `*-DEMO-*`.
- **Cargando**: no tiene `loading.tsx` propio (verificado en la carpeta).
- **Error**: no tiene `error.tsx` propio (verificado en la carpeta).
- **Sin conexión**: el layout usa `EstadoConexion` de Propiedades. Comportamiento en detalle no verificado.
- **Sin permiso**: `requireScopeInPage(projects, view)` responde 403 (verificado).
- **Éxito**: no aplica. Ninguna acción confirma una operación.
- **Parcial**: los textos de ejemplo expresan la regla: "un pendiente no se cierra por marcar la unidad como entregada". La lógica real no existe.

## Estado actual vs PRD
- **Existe y es real**: página protegida por permiso y navegación de cuatro secciones. Los textos de cada sección explican las reglas de negocio.
- **Es de ejemplo**: todo el contenido (`_ejemplo.ts`: CAS-DEMO-01, GAR-DEMO, ENT-DEMO, PEN-DEMO-01 y las acciones).
- **Falta**: persistencia, SLA, garantías versionadas, actas firmadas, cierre verificado, estados de carga y error propios, evidencia privada.
- **Prioridad**: baja en la auditoría. No mostrar como operativo hasta tener datos reales. Marcarlo "Próximamente" en el menú.

## Checklist de aceptación
- [x] Página protegida por permiso projects:view
- [x] Cuatro secciones con navegación
- [x] Textos de regla: pendiente no cierra por entrega
- [ ] Casos persistidos con SLA y prioridad
- [ ] Garantías con términos versionados y vencimiento
- [ ] Inspección de entrega con agenda y observaciones
- [ ] Acta de entrega firmada y versionada
- [ ] Cierre de caso con confirmación del cliente
- [ ] Cobro fuera de garantía requiere aprobación
- [ ] Estados de carga y error propios
- [ ] Evidencia privada: fotos y documentos

## Dependencias
- Inventario: `units`.
- Negocios: `deals`, `unit_sales`.
- Contactos: cliente del caso.
- Documentos: acta firmada y garantías.
- Agenda: inspecciones programadas.
- Comunicaciones: avisos al cliente.
- Finanzas: `financial_approval_requests` para cobros fuera de garantía.
- Acceso/RBAC: recurso propio.
- Avances: contexto de obra de la unidad.
