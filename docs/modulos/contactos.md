# Contactos

## Propósito
Registro único de personas con las que la inmobiliaria se relaciona: compradores, inversionistas, propietarios y referidos. Un contacto es la identidad sobre la que cuelgan leads, negocios, actividades y comunicaciones. Aquí también vive el consentimiento y el ejercicio de derechos del titular (exportación, baja, eliminación), requisito de la Ley 172-13 de protección de datos en República Dominicana.

Código de referencia: `app/(crm)/contactos/` (`page.tsx`, `vista.tsx`, `inspector.tsx`, `[id]/page.tsx`, `[id]/privacidad/`, `[id]/relaciones/`); API en `app/api/contactos/`; casos de uso en `application/contactos/`.

## Roles y permisos
Recursos: `contacts:view`, `contacts:create`, `contacts:edit`, `contacts:import`, `contacts:export`, `contacts:delete`.

| Rol | Alcance | Puede |
|---|---|---|
| admin | all | Todo, incluido eliminar |
| manager | team | Ver, crear y editar contactos de su equipo |
| assistant | all | Ver, crear, editar, importar y exportar. No eliminar |
| broker | own | Ver, crear y editar los suyos. No exportar ni importar |

- Lista: `consultarListadoContactos` aplica el alcance de `contacts:view`. Con `own`, el contacto se ve por su vínculo con el broker (leads o negocios); la regla exacta está en `application/contactos/casos-de-uso.ts` y su prueba `s3-privacidad-matching.test.ts`. Verificar antes de dar por cerrado el alcance `own`.
- Reasignar responsable: solo con `contacts:edit` de alcance `all` (selector de brokers en la página).
- Página: `requireScopeInPage(actor, "contacts", "view")`; sin permiso, 403.
- Eliminar: `DELETE /api/contactos/[id]` exige `contacts:delete` (solo admin).
- Exportar datos del titular: `GET /api/contactos/[id]/exportar` exige `contacts:export`.

## Flujos principales
1. **Crear contacto.** Nombre, teléfono en formato E.164 con su versión para mostrar, correo, país, ciudad y notas. `POST /api/contactos` valida y devuelve el registro.
2. **Buscar.** Búsqueda por nombre, teléfono o correo en la lista, con paginación. El resultado respeta el alcance del usuario.
3. **Abrir ficha.** `?contacto=<id>` muestra datos, leads, negocios, actividades e historial de auditoría. Un id inexistente responde 404.
4. **Editar.** `PATCH /api/contactos/[id]` con validación; cada cambio queda en auditoría.
5. **Registrar consentimiento (pendiente).** Al capturar, debe guardarse la fecha, la fuente y la finalidad del consentimiento. Hoy los campos `consent_at` y `consent_source` solo se leen; no hay escritura desde el alta ni desde los leads.
6. **Exportar datos del titular.** La ficha de privacidad descarga un JSON con nombre, teléfono, correo, ciudad, notas, última interacción y el registro de consentimiento. No incluye documentos, negocios ni comunicaciones.
7. **Baja o eliminación (pendiente).** Revocación de consentimiento, baja de comunicaciones y solicitud de eliminación con plazo; hoy solo existe la eliminación por admin.
8. **Fusionar duplicados (pendiente).** Vista previa en Leads; falta fusión transaccional con reasociación de leads y negocios.

## Datos
Tabla `contacts` (campos clave):
- Identidad: `full_name`, `phone` (E.164), `phone_display`, `email`, `country`, `city`, `notes`.
- Consentimiento: `consent_at`, `consent_source` (lectura; sin escritura en el flujo actual).
- Actividad: `last_interaction_at`.
- Auditoría: timestamps, `created_by`, `updated_by`, `deleted_at` (borrado lógico).

Índice por `phone`. Tablas relacionadas: `leads`, `deals`, `activities`, `files` (documentos), `notifications`, `audit_log`, `papelera` (restauración de borrados).

Pendiente de modelo: consentimiento por finalidad y canal (correo, WhatsApp, llamada), evidencia, revocación y solicitudes de titular.

## Estados de UI (D06)
- **Vacío:** "Aún no hay contactos" con acción "Crear contacto"; búsqueda sin resultados con "Limpiar búsqueda".
- **Cargando:** `loading.tsx` con filas esqueleto.
- **Error:** `error.tsx` con reintento; el formulario conserva lo escrito.
- **Sin permiso:** 403 de página; el botón eliminar no aparece si falta `contacts:delete`; "Exportar" oculto para broker.
- **Éxito:** toast y ficha actualizada sin recargar.
- **Parcial:** la ficha muestra lo que el usuario puede ver; relaciones, empresas y demandas muestran vista previa con aviso.
- **No encontrado:** `not-found.tsx` para contacto inexistente o fuera de alcance.

## Estado actual vs PRD
**Existe (código real):**
- Alta, edición, búsqueda y ficha con alcance por propietario.
- Exportación JSON del titular desde la ficha de privacidad.
- Eliminación para admin.
- Teléfono E.164 con versión para mostrar.

**Demo o faltante:**
- `empresas/`, `demandas/` y `[id]/relaciones/`: vistas previas con datos de ejemplo (`_ejemplo.ts`).
- Consentimiento: se muestra en la ficha de privacidad, pero no se guarda ni se pide al capturar; la auditoría lo marca como riesgo legal.
- La ficha de privacidad declara como faltantes: consentimientos por finalidad y canal, evidencias, revocación, baja y solicitudes de eliminación.
- Sin timeline unificado (mezcla de actividades, leads, negocios y comunicaciones).

**PRD:** el compendio no define el contacto como entidad. El modelo de contenido del PRD (§6) no lo incluye; la captura de leads (RF-12) implica tenerlo. Tratar la privacidad como requisito propio de la inmobiliaria, no del compendio.

## Checklist de aceptación
- [x] Crear y editar contacto con validación de teléfono
- [x] Búsqueda y ficha con leads y negocios
- [x] Exportar datos del titular en JSON
- [x] Alcance por propietario (own, team, all)
- [x] Eliminación solo con permiso contacts:delete
- [ ] Registrar consentimiento al capturar el contacto
- [ ] Consentimiento por finalidad y canal
- [ ] Baja y revocación de consentimiento
- [ ] Solicitud de eliminación con plazo y registro
- [ ] Empresas y demandas con datos reales
- [ ] Fusión de duplicados transaccional
- [ ] Timeline unificado del contacto

## Dependencias
- **Leads:** la captura crea o reutiliza el contacto.
- **Negocios:** cliente y negocios vinculados.
- **Agenda (actividades):** historial de interacciones y `last_interaction_at`.
- **Comunicaciones:** los envíos deben respetar el consentimiento y las exclusiones.
- **Integraciones (WhatsApp/YCloud, portal):** origen de los contactos y de sus consentimientos.
- **Documentos y KYC:** expediente del titular (pendiente).
- **Papelera y auditoría:** restauración de borrados y trazabilidad de cambios.
- **Configuración:** roles y permisos por contacto.
- **Normativa:** Ley 172-13 (protección de datos personales, RD).
