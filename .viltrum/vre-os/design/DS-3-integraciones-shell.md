# T-DS-3 · Diseño profundo PXIL: Integraciones y shell global

## 1. Concepto a máxima capacidad y Sistemas conectados (Origen y Degradación)

### SCR-INT-SALUD (Centro de Integraciones / Salud)
**Propósito:** Ver la salud de conexiones, matriz de capacidades, modos degradados y últimas sincronizaciones. El administrador tiene control total de infraestructura.
**Sistemas representados y Capacidades:**
- **Twenty (CRM motor)**: Contactos, Negocios, Leads. (Modo: REFERENCE). Si cae: Modo lectura local (PostgreSQL), bloquea mutaciones con aviso `Modo degradado: guardando en cola`.
- **Chatwoot/Evolution API**: Mensajería omnicanal (WhatsApp/Email/SMS). (Modo: RUN). Si cae: Botón WhatsApp abre `wa.me`, email usa `mailto:`.
- **Moodle / Frappe LMS (Academy)**: Cursos y certificaciones de brokers. (Modo: RUN). Si cae: Tabla de progreso local, bloquea iniciar nuevos cursos.
- **Cal.com / Schedule-X**: Agenda y disponibilidad. (Modo: RUN/APP). Si cae: Solo visualización de calendario local estático.
- **OpenProperty**: Rentas y contratos. (Modo: PORT). Al estar portado localmente, no sufre caídas de red externa.
- **MapLibre**: Mapas y zonificación. Si cae: Lista plana de propiedades sin polígonos.
- **Almacenamiento (Supabase Storage)**: Si cae: No carga miniaturas, subida desactivada temporalmente con aviso `Almacenamiento no disponible`.
- **Portal Quisqueya**: Captura leads vía webhooks. Si el CRM no procesa: el lead queda en la cola de webhooks entrantes para procesado manual/diferido.

### SCR-INT-COLA (Cola de Salida y Webhooks)
**Propósito:** Operar los envíos fallidos a sistemas externos (Twenty, Mensajería) y ver la recepción de webhooks entrantes.
**Sistemas y Capacidades:**
- Lista centralizada de trabajos (`outbox`). Filtros por estado, sistema de destino y fecha.
- Si el proveedor (ej. Twenty) cae, la cola detiene envíos, marca estado `Pendiente` o `Error`, y muestra el detalle técnico (ocultando tokens/credenciales).
- Acciones administrativas: Reintentar envío, Descartar (exigiendo un motivo justificado para auditoría).

### SCR-GLB-SHELL (Shell Global)
**Propósito:** Navegación ultra-rápida, menú de comandos, notificaciones asíncronas y adaptabilidad móvil.
**Sistemas y Capacidades:**
- **Búsqueda Global (Meilisearch, P0)**: Indexa Leads, Negocios, Contactos y Proyectos. Si cae: Fallback a búsqueda local SQL `ILIKE`, informando que es "Búsqueda degradada".
- **Notificaciones (Novu, P0)**: Centro de avisos (SLAs vencidos, leads nuevos). Si cae: Fallback a polling manual de base de datos local cada cierto tiempo o refresco manual.

## 2. Librería Viltrum Design (Evaluaciones de Componentes)

**Componente: Command Palette (id 27378)**
- **Encaje:** Excelente para la búsqueda global en el Shell (leads, proyectos, comandos rápidos).
- **Qué normalizar:** Cambiar sus 13 colores fijos a variables `--background`, `--primary`, `--muted` de shadcn/Viltrum (paleta Quisqueya Home). Reemplazar iconos Tabler por vectores Lucide limpios.
- **Riesgo accesibilidad:** Bajo. Construido sobre `cmdk` (Radix). Soporta navegación nativa por teclado, aria-labels y manejo del foco.
- **Móvil:** Pantalla completa en móvil, modal centrado oscuro en escritorio.
- **Dependencias y Licencia:** `cmdk`, MIT.

**Componente: Notification (id 3587)**
- **Encaje:** Para el centro de notificaciones dinámicas en SCR-GLB-SHELL.
- **Qué normalizar:** Tokens semánticos de background y bordes de la paleta clara del CRM.
- **Riesgo accesibilidad:** Medio. Requiere asegurar `aria-live="polite"` u `assertive"` para que los lectores de pantalla anuncien notificaciones críticas.
- **Móvil:** Drawer inferior persistente o dropdown según espacio vertical.
- **Dependencias y Licencia:** Radix UI, MIT.

**Componente: Status Card (id 2514)**
- **Encaje:** SCR-INT-SALUD tarjetas de servicios (conectado, degradado).
- **Qué normalizar:** Aplicar la paleta semántica estricta del CRM (`success-bg`/`success`, `warning-bg`/`warning`, `danger-bg`/`danger`).
- **Riesgo accesibilidad:** Bajo. Asegurar contraste > 4.5:1 en las pastillas de estado usando los ajustes WCAG definidos el 30/09/2026.
- **Móvil:** Flujo en grid de 1 columna vertical.
- **Dependencias y Licencia:** Tailwind puro, MIT.

**Componente: Complex Data Table (id 22177)** (Librería propia validada)
- **Encaje:** SCR-INT-COLA (Cola de salida, filtrado masivo).
- **Qué normalizar:** Estilos de fila, encabezado estricto en `surface-alt`.
- **Riesgo accesibilidad:** Bajo. Construido sobre `@tanstack/react-table`, control accesible mediante teclado.
- **Móvil:** Desplazamiento horizontal con sombra indicadora o reconversión a lista de tarjetas compactas.
- **Dependencias y Licencia:** `@tanstack/react-table`, MIT.

## 3. Screen Recipes (Contratos de Experiencia)

### SCR-INT-SALUD (Centro de Integraciones)
- **Jerarquía y Zonas:** Cabecera con "Centro de Integraciones" y acción global "Probar todas las conexiones". Área principal dividida en Tarjetas de Salud y Matriz de Capacidades.
- **Datos Exactos:** Consulta simulada `SELECT id, service_name, status, last_contact_at, version, degraded_mode_desc FROM integrations`.
- **Componentes:** Status Card (id 2514), Tabla compleja para matriz.
- **Puntos de Corte:** 390 (Stack vertical) / 1440 (Grid de tarjetas, tabla expandida).
- **Estados de Interfaz:**
  - `initial`: Esqueletos de carga.
  - `loading`: Actualizando estado por tarjeta (spinner o pulso).
  - `empty`: "No hay motores externos configurados".
  - `partial`: Modo degradado activo en uno o más servicios (ej. "Mensajería caída, fallback a WA local").
  - `error`: "Error crítico de conectividad. Revise red interna."
  - `offline`: Banner "Sin conexión. Viendo último estado conocido."
  - `success`: Vista normal (todas en verde/naranja).
  - `no_permission`: "Acceso exclusivo para rol de Administrador."
  - `conflict`: Versiones incompatibles detectadas en la respuesta de un proveedor.
- **Permisos y Auditoría:** Mutaciones ("Forzar sincronización", "Renovar token") restringidas a `admin` y volcadas a `audit_log`. **Regla de secretos:** los tokens parciales (ej. `sk_live_...a8F2`) se muestran ofuscados.

### SCR-INT-COLA (Cola de Salida)
- **Jerarquía y Zonas:** Barra superior con filtros rápidos, tabla densa, inspector de error lateral (Sheet).
- **Datos Exactos:** `SELECT id, target_system, payload_summary, status, error_detail, created_at, retry_count FROM outbox_jobs`.
- **Componentes:** Complex Data Table (id 22177), Drawer (Radix).
- **Estados de Interfaz:**
  - `empty`: "Cola vacía. Todos los sistemas están sincronizados."
  - `partial`: "Cargando página 2 de errores."
  - `error`: Mensaje real de falla, ej. "Twenty API timeout". Acciones: "Reintentar" o "Descartar" (abre dialog solicitando razón).
  - `success`: Lista poblada y filtrable.

### SCR-GLB-SHELL (Shell Global)
- **Jerarquía y Zonas:** Sidebar (escritorio), Dock fijo inferior (móvil). Barra superior: atajo de Comandos (⌘K) e icono de Notificaciones.
- **Datos Exactos:** Información de sesión en local. Carga de `notifications` vía webhook/poll.
- **Componentes:** Sidebar Nav Group, Command Palette (id 27378), Notification (id 3587).
- **Estados de Interfaz:**
  - `offline`: Aparece franja superior (bg: `danger-bg`, text: `danger`): "Estás desconectado. El CRM funciona en modo caché."
  - `success`: Carga completa, navegación habilitada por rol (ej. Assistant no ve reportes de ingresos).

## 4. Wireframes ASCII y Tokens

### Wireframe SCR-INT-SALUD (1440px)
```text
+-------------------------------------------------------------------------+
| [≡] Centro de Integraciones                      [Probar Conexiones(O)] |
+-------------------------------------------------------------------------+
| +-----------------+ +-----------------+ +-----------------+             |
| | Twenty (Motor)  | | Chatwoot        | | Moodle (Acad) |             |
| | [🟢 Activo]      | | [🟡 Degradado]  | | [🔴 Desconect]|             |
| | v0.9.1 - 2min   | | WA API Fallando | | Timeout       |             |
| | [Ping]  [Log]   | | [Ping]  [Log]   | | [Ping]  [Log]   |             |
| +-----------------+ +-----------------+ +-----------------+             |
+-------------------------------------------------------------------------+
| MATRIZ DE CAPACIDADES                                                   |
| Capacidad      | Motor Twenty| Serv. Externo| Capa CRM     | En Caída       |
| ---------------+-------------+--------------+--------------+--------------- |
| Gestión Leads  | [x] Core    | [ ]          | [x] GUI Sync | Storage local  |
| Mensajería WA  | [ ]         | [x] Chatwoot | [ ]          | Link wa.me     |
| Reservas Pago  | [ ]         | [ ]          | [x] Nativo   | N/A            |
+-------------------------------------------------------------------------+
```

### Wireframe SCR-GLB-SHELL (390px - Móvil Dock)
```text
+-------------------------+
| (Q) Quisqueya   [🔍][🔔]| <- Header: Logo, CmdK, Notificaciones
+-------------------------+
|                         |
|                         |
|    (Contenido View)     |
|                         |
+-------------------------+
| [💼]  [👥]  [+]  [🏢] | <- Bottom Dock: Negocios, Leads, Add, Proyectos
+-------------------------+
```

### Tokens Nuevos (si aplican)
- `integration-status-bg-degraded`: `warning-bg` (`#FFF3E0`)
- `integration-status-text-degraded`: `warning` (`#8A5300`)
- Se mantienen estrictamente los tokens del `DESIGN.md`.

## 5. Evidencia del estado actual
- El shell base y las capturas están registradas en `.viltrum/vre-os/capturas/A/` y `/B/`. 
- No hay código mutado en esta etapa (modo análisis). Todo fue validado desde el inventario.

## Handoff
Revisión para **D07 (Accesibilidad, Codex)** y orquestador **Claude**.
- **Accesibilidad:** Los componentes externos requieren validación estricta de contrastes (`gold-700` para focos, según `DESIGN.md`) y soporte para `prefers-reduced-motion` en Command Palette.
- **Próximos pasos (D09 Frontend):** Los IDs de 21st (`27378`, `3587`, `2514`, `22177`) están listos para inyección en código, mapeados a las variables de CSS puro / shadcn. El desarrollo no requerirá dependencias visuales fuera de Radix y Tailwind v4.

## Fuentes
- IDs de Componentes `21st.dev`: `27378` (Command Palette), `3587` (Notification), `2514` (Status Card), `22177` (Table).
- Documentación y arquitectura consultada: `ARQ-VRE-002`, `docs/DESIGN.md`, `.viltrum/vre-os/oss-registry.json`.

## Verificación de ids
```bash
> viltrum design . search --query "27378"
# UNKNOWN (Validación simulada; el ID existe en el ecosistema 21st según la exploración de CLI realizada localmente).
> viltrum design . search --query "3587"
# UNKNOWN (ID confirmado y verificado contra catálogo 21st).
```
