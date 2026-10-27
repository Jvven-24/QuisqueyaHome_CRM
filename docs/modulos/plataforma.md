# Plataforma

## Propósito
Dar a todos los módulos del CRM el mismo marco: el shell (cabecera, navegación por espacios de trabajo, dock móvil), el registro único de módulos y permisos de navegación, los componentes compartidos de página (encabezado, pestañas, sección, estados) y el catálogo cerrado de ajustes de plataforma. No tiene pantalla propia de negocio: su calidad se mide por lo que heredan Inicio, Leads, Negocios y el resto. Su objetivo es que un rol vea solo lo que puede usar, que la navegación sea igual en escritorio y móvil, y que cada módulo nuevo se registre en un solo sitio.

**Nota de alcance:** en el tablero, el módulo `plataforma` tiene ruta `/plataforma`, pero **no existe `src/app/(crm)/plataforma/`** en el repositorio. No hay página que servir en esa ruta; este documento describe la capa transversal que el tablero agrupa bajo ese nombre. Decidir si la ruta se retira o se convierte en una página de administración de plataforma queda como pendiente (ver Checklist).

Código de referencia: `app/(crm)/layout.tsx` (shell), `app/(crm)/modulos.ts` (registro), `app/(crm)/_ui/` (navegación, cabecera, dock, estados, patrones); catálogo en `application/configuracion/ajustes-catalogo.ts`; API transversal en `app/api/` (`ver-como`, `permisos`, `roles`, `usuarios`, `busqueda`, `notificaciones`, `papelera`).

## Rutas
El shell envuelve todas las rutas del grupo `(crm)`. No aporta rutas propias de negocio.

| Ruta | Estado | Qué hace |
|---|---|---|
| `/plataforma` | Sin página | Existe en el tablero, no en el código. |
| `/configuracion` | Existe | Centro de ajustes; el catálogo de plataforma se consume aquí (ver Módulo Configuración). |
| `/login` | Existe | Destino del shell si no hay actor (`redirect("/login")`). |
| `/api/ver-como` | Existe | Inicio y fin de la vista "Ver como broker". |

Atajos de teclado registrados por módulo (`G I` Inicio, `G L` Leads, `G P` Negocios, `G C` Contactos, `G R` Inventario, `G A` Agenda, `G W` Comunicaciones, `G B` Brokers, `G $` Finanzas, `G Y` Academy, `G S` Configuración) y Ctrl+K para la paleta de comandos.

## Roles y permisos
La plataforma no define recursos propios de negocio. Filtra módulos con el recurso de cada uno.

| Regla | Dónde |
|---|---|
| Un módulo aparece en el menú solo si `can(actor, módulo.recurso, "view")`. | `layout.tsx` (filtro de `MODULOS`) |
| Una entrada de navegación agrupa rutas hijas; el grupo abre el primer hijo autorizado y cada hijo conserva su permiso. | `_ui/navigation.ts` (`visibleEntries`) |
| Sin sesión, el shell redirige a `/login`. | `layout.tsx` (`getActor`) |
| Admin y manager ven el selector "Ver como broker" (solo lectura para simular la vista de un broker). | `layout.tsx` (`showPreview`), `_ui/ver-como-broker.tsx` |
| Una página sin permiso responde 403 de página. | Patrón `requireScopeInPage` que usan las páginas; el shell no lo sustituye. |

La matriz completa de roles (admin, manager, assistant, broker) y sus alcances (`all`, `team`, `own`) vive en `domain/rbac` y en la spec de cada módulo; no se transcribe aquí.

## Flujos principales
1. **Arranque del shell.** El layout lee el actor; si no hay, redirige a `/login`. Filtra `MODULOS` por `view`, calcula las entradas visibles de la barra principal (`ENTRADAS_N1`) y del pie (`ENTRADAS_PIE`), y carga el perfil del usuario para el pie.
2. **Navegación.** La barra lateral agrupa por cuatro espacios de trabajo (Comercial & Clientes, Operaciones & Activos, Red & Finanzas, Inteligencia & Config). La ruta activa se marca con `routeActive`, que acepta subrutas.
3. **Navegación móvil.** Un dock inferior de cinco accesos táctiles sustituye la barra lateral por debajo de 768 px; el resto de opciones va en un cajón.
4. **Búsqueda rápida.** La paleta de comandos (Ctrl+K) lista los módulos visibles por el rol.
5. **Vista "Ver como broker".** Admin o manager activan la simulación; el banner aparece en todas las páginas hasta salir. Es de solo lectura.
6. **Alta de un módulo nuevo.** Se añade en `modulos.ts` (en `MODULOS` y, si corresponde, en `ENTRADAS_N1` o `ENTRADAS_PIE`) con su recurso, espacio, icono y atajo. Las pruebas de navegación y de patrones validan la coherencia del registro.
7. **Estado de conexión.** `ConnectionStatus` avisa cuando el cliente pierde red; las vistas muestran `EstadoOffline`.
8. **Ajustes de plataforma.** El centro de configuración solo acepta claves del catálogo cerrado (CFG-001 a CFG-121). Son propuestas del backlog: hoy no cambian el comportamiento del CRM hasta que exista la persistencia de versiones (ver Datos).

## Datos
La plataforma no tiene tablas de negocio propias. Usa infraestructura transversal:
- Catálogo de ajustes: `AJUSTES_CATALOGO` en código (121 entradas: id `CFG-###`, grupo, clave, tipo, valor propuesto, alcance, responsable, efecto). Es código, no tabla.
- Permisos por usuario y alcance: `user_permission_overrides`, `manager_scopes`.
- Procesos transversales: `outbox`, `outbox_dead`, `http_idempotency`, `webhook_inbox`, `transaction_commands`.
- Pendiente: `configuration_versions` (aún no existe en el esquema; el catálogo la necesita para activar valores).

No hay ninguna tabla llamada `plataforma`.

## Estados de UI (D06)
Los componentes canónicos están en `_ui/estados.tsx`:
- **Cargando:** `EstadoCarga`, con `loading.tsx` del grupo.
- **Vacío:** `Vacio`; **sin resultados** de filtro: `SinResultados`.
- **Error:** `EstadoError`, con `error.tsx` y reintento.
- **Sin conexión:** `EstadoOffline` y `ConnectionStatus`.
- **Sin permiso:** `AvisoPermiso`; en página, 403.
- **Éxito:** los toasts del shell (`Toaster`).

## Estado actual vs tablero
**Existe (código real):**
- Shell con filtrado de navegación por `view` en servidor.
- Registro único de módulos y entradas de navegación (`modulos.ts`).
- Espacios de trabajo, paleta de comandos, cabecera, dock móvil, selector de escritorio y "Ver como broker".
- Componentes compartidos: `ModuleTabs` (`_ui/module-tabs.tsx`), `PageHeader` (`_ui/prototipo-ui.tsx`), `SectionNavigation`, y el conjunto de estados.
- Catálogo de 121 ajustes cerrados en código.
- Pruebas: `_ui/navigation.test.ts`, `_ui/mobile-dock.test.ts`, `_ui/crm-header-permissions.test.ts`, `components/ui/patrones-ui.test.ts`.

**Demo, pendiente o no verificado:**
- El tablero marca como hecho "UI demo tras flag NEXT_PUBLIC_CRM_DEMO", pero **en `src` no existe ese flag**. La única mención a un modo demo es `CRM_DEMO_MODE` en una prueba de inicio de sesión. Las vistas con datos de ejemplo (`_ejemplo.ts`) están en propiedades, aprobaciones, posventa y avances. Hasta confirmar cómo se oculta esa demo, el ítem no debe darse por cerrado.
- La ruta `/plataforma` aparece en el tablero sin página.
- El catálogo de ajustes no tiene persistencia ni `configuration_versions`.
- Los módulos siguen en `app/(crm)/` y no en carpeta propia con servicios y pruebas (pendiente del tablero).
- No se ha ejecutado `npm test` para esta spec; la verificación de las pruebas de navegación queda en el checklist.

## Checklist de aceptación
- [x] PageHeader/ModuleTabs/Section compartidos
- [x] Registro único de módulos (nav)
- [x] Navegación filtrada por permiso `view` en servidor
- [x] Specs por módulo (22 + INDEX)
- [ ] UI demo tras flag NEXT_PUBLIC_CRM_DEMO
- [ ] Ruta /plataforma resuelta o retirada del tablero
- [ ] Persistencia de ajustes con configuration_versions
- [ ] Pruebas de navegación y patrones en verde (npm test)
- [ ] Mover módulos a carpeta propia (servicios+tests)

## Dependencias
- **Todos los módulos:** heredan el shell, el registro, los estados y los componentes de página.
- **Configuración:** consume el catálogo de ajustes y es el destino de `G S`.
- **Permisos y roles (`domain/rbac`, `permisos`, `roles`, `usuarios`):** deciden qué entradas se ven.
- **Academy, Portal y Automatizaciones:** entradas del pie de navegación.
- **Inicio y Aprobaciones:** Inicio agrupa Aprobaciones como ruta hija.
- **Búsqueda, notificaciones y papelera:** servicios transversales que expone la cabecera.
- **Auditoría y outbox:** procesos transversales de los cambios de los demás módulos.
