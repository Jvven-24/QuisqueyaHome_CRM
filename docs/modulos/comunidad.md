# Comunidad

## Propósito
Dar a los brokers de la red un espacio para intercambiar materiales autorizados, publicar demandas de inmuebles de forma anonimizada, inscribirse a encuentros y reportar contenido, con moderación y apelación. No es una red social abierta ni un canal para compartir datos de clientes.

Buenas prácticas de referencia (brokers y colaboración inmobiliaria):
- Anonimizar toda demanda: zona, tipo y requisitos, sin nombre, teléfono, presupuesto identificable ni expediente del cliente.
- Interés en una demanda no da acceso al contacto ni prioridad de reserva; el contacto se libera por acuerdo de colaboración.
- Reglas de visibilidad explícitas por grupo (público para la red, solo para membresía, solo para equipo).
- Moderación con motivo, evidencia preservada y apelación revisada por una persona distinta del decisor.
- Reputación solo con señales verificables (cierres validados, cumplimiento de acuerdos); nunca calculada de ejemplos.
- Sin datos personales en publicaciones; el consentimiento de uso de datos se respeta según la Ley 172-13 de protección de datos personales de RD.

## Roles y permisos
Hoy la página usa el recurso `brokers` (view). No hay recurso propio de comunidad.

| Rol | `brokers` (view) | Propuesta de uso | Estado |
|---|---|---|---|
| Administrador | `all` (seed) | Moderar y decidir apelaciones | Ver todo |
| Asistente | `all` (seed) | Ver; publicar material de la empresa | Ver todo |
| Broker | `own` (seed) | Publicar, crear demandas, inscribirse a eventos | Ver lo propio |
| Gerente | `team` (0017) | Moderar dentro de su equipo; apelaciones las resuelve otra persona | Ver equipo |

- Propuesta: añadir un recurso `community` a la lista cerrada de `PERMISSION_RESOURCES` con view, create, edit, moderate, y no reutilizar `brokers`.
- La página exige `brokers:view` en servidor (`requireScopeInPage`).

## Flujos principales
1. El broker abre /comunidad y entra a Comunidad, Demandas, Eventos o Moderación desde la navegación de la red (hoy solo ve la vista previa).
2. Propuesto: publica en un grupo con visibilidad definida; el contenido pasa por las reglas del grupo.
3. Propuesto: publica una demanda anonimizada (zona, tipo, requisitos). Otros brokers pueden expresar interés; el contacto solo se comparte tras acuerdo de colaboración.
4. Propuesto: se inscribe a un evento; recibe confirmación y recordatorio.
5. Propuesto: cualquier miembro reporta contenido con motivo; el reporte entra a la cola de moderación.
6. Propuesto: el moderador decide (ocultar, advertir o retirar) con motivo y evidencia preservada.
7. Propuesto: el afectado apela; la apelación la revisa una persona distinta del decisor.
8. Hoy: el borrador de una publicación o demanda vive solo en la pantalla y se pierde al salir. El aviso indica "No adjuntes datos personales reales".

## Datos
No hay tablas de comunidad en el esquema (ni grupos, publicaciones, comentarios, demandas, eventos, inscripciones, reportes ni apelaciones).

Entidades propuestas:
- `community_groups`: nombre, visibilidad, reglas, responsable.
- `community_memberships`: grupo, broker, rol, `joined_at`.
- `community_posts` y `community_comments`: autor, grupo, contenido, estado, moderación.
- `buyer_demands`: zona, tipo, requisitos, presupuesto por rangos, estado. Sin identificadores de cliente.
- `demand_interests`: demanda, broker, fecha, consentimiento.
- `community_events` y `event_registrations`: fecha, lugar o enlace, cupo, inscripción.
- `content_reports` y `moderation_decisions`: motivo, evidencia, decisor, decisión, apelación, revisor distinto.

## Estados de UI (D06)
Estados de la vista previa (`RedPrevia`, selector "Estados de la vista previa"):
- **Con datos:** tres tipos de ficha de ejemplo (grupo, demanda, evento o reporte) con búsqueda y filtro por estado.
- **Cargando:** "Cargando ejemplo…" (simulado).
- **Vacío:** "Sin expedientes de ejemplo" o "Sin resultados para este filtro".
- **Error:** "No se pudo cargar el ejemplo"; los borradores permanecen en pantalla.
- **Sin conexión:** "Sin conexión: no se ejecutan cambios" y aviso de que no hay cola de sincronización.
- **Sin permiso:** "Sin permiso de acceso" (simulado; el permiso real responde 403 en la página).
- **Éxito:** solo "Borrador revisado localmente. No se guardó ni ejecutó ninguna operación."
- **Parcial:** no aplica hoy; debe aparecer cuando una publicación se guarda pero la notificación falla.

Propuesto: quitar el selector de estados de demostración en producción y usar los estados reales.

## Estado actual vs PRD
El compendio (`ref/compendio.txt`) excluye explícitamente la "red inmobiliaria colaborativa completa" del alcance inicial. Su Fase 3 cubre login, favoritos, área de brokers, recursos privados y control de roles, sin comunidad. No hay PRD para este módulo.

Qué existe y funciona (código real):
- Ruta /comunidad y sus subrutas, navegación de la red y permiso `brokers:view` en servidor.
- Estado de conexión de la red.

Qué es demo o falta:
- Todas las fichas son ejemplo (`brokers/_ejemplo.ts`, registros `COM-EJ`, `DEM-EJ`, `EV-EJ`, `MOD-EJ`).
- No hay grupos, publicaciones, demandas, eventos, denuncias ni apelaciones persistidos. No hay API.
- La vista de ejemplo se muestra en producción, por lo que puede confundirse con datos reales.
- Auditoría 27/10/2026: prioridad baja; decidir si entra en el alcance, o si no entra, ocultarla.

## Checklist de aceptación
- [x] Acceso protegido por permiso brokers:view
- [ ] Decisión de alcance documentada o sección oculta
- [ ] Grupos y publicaciones persistidos
- [ ] Demandas anonimizadas sin datos de clientes
- [ ] Interés en demanda sin acceso al contacto
- [ ] Eventos con inscripción persistida
- [ ] Denuncias con cola de moderación
- [ ] Apelación revisada por persona distinta
- [ ] Permiso propio de comunidad en RBAC

## Dependencias
- **Brokers (red):** alta y acreditación del miembro, directorio y permisos por broker.
- **Contactos:** privacidad, consentimiento y sin exposición de datos personales.
- **Cooperación (co-broke):** acuerdo que libera el contacto de una demanda.
- **Comunicaciones:** notificaciones de inscripción, respuesta de demanda y decisión de moderación.
- **Configuración y RBAC:** recurso propio de comunidad y matriz por rol.
- **Auditoría:** cada decisión de moderación.
- **Integraciones:** ninguna; correo o WhatsApp para recordatorios (por definir).
