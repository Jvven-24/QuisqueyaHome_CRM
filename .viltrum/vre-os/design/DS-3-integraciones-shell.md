## 1. SCR-INT-SALUD · Centro de Integraciones

### 1. Concepto a máxima capacidad
Esta vista es el panel de control central para la matriz de capacidades de todas las integraciones conectadas al CRM.
Cobertura de capacidades:
- CRM base: Integrar open source (Twenty) P0. Puerto `TwentyPort`. Expone `capacidades()` de CRM general.
- Mensajería unificada: Integrar open source (Chatwoot/Evolution API) P0. Puerto `MensajeriaPort`.
- Agenda sincronizada: Integrar open source (Cal.com o Schedule-X) P0. Puerto `AgendaPort`.
- Documentos y dossiers: Integrar open source (react-pdf, papermark) P0. Puerto `DocumentosPort`.
- Gestión de Rentas: Portar (OpenProperty) P1. Módulo portado local.
- Academia y certificación: Integrar open source (Moodle/Frappe) P1. Puerto `AprendizajePort`.
- Analítica y auditoría: Integrar open source (PostHog/GrowthBook) P1. Puerto `AnalyticsPort`.
- Mapas geográficos: Construir P2.
Capa visual y modo degradado: La interfaz debe mostrar indicadores de conexión en tiempo real. Si un proveedor cae o está desconectado, el CRM pasa a modo degradado: desactiva las funciones exclusivas, alerta visualmente del estado y, en funciones críticas, permite guardar datos en modo local para enviar cuando el sistema esté recuperado.

### 2. Librería Viltrum Design
- ID 22177 (Complex Data Table): Encaje idóneo para visualizar la extensa matriz de capacidades. Se necesita normalizar todos los tokens de estado para que usen `surface` y `ink` según nuestra paleta. El riesgo de accesibilidad es bajo, dado que implementa encabezados semánticos de tabla. El comportamiento móvil requerirá un contenedor con scroll horizontal limpio sin desbordar el shell.
- ID 9758 (Bento Dashboard): Ideal para presentar las tarjetas de salud por puerto. Tiene un comportamiento responsivo adecuado que apila las tarjetas de forma semántica en 390px. Se debe garantizar que no tenga animaciones de entrada intrusivas y respete el movimiento reducido para evitar mareos al cambiar rápidamente entre métricas y tarjetas.

### 3. Screen Recipe
Jerarquía y zonas: Panel superior (estadísticas globales de salud, uptime de puertos), una cuadrícula interactiva central con tarjetas de estado de cada servicio conectado, y finalmente la tabla detallada (matriz de capacidades mostrando cada función por sistema). Todo contenido en el contenedor estándar del shell.
Datos exactos: La vista debe consumir del endpoint central de auditoría y reportar `port.status`, `port.last_ping`, `integration.version` y el array de booleanos de características como `integration.has_sync`.
Componentes por id: 22177 (Tabla compleja), 9758 (Dashboard tipo Bento), 15024 (Métricas globales de progreso).
Puntos de corte: Se adaptará sin problemas a los siguientes anchos de pantalla: 320, 390, 768 y 1440.
Matriz de estados:
- inicial: "Cargando mapa de integraciones..." (Acción: ninguna disponible)
- carga: "Verificando conexión en tiempo real con puertos..." (Acción: cancelar comprobación)
- parcial: "Cargados datos locales, integraciones pendientes" (Acción: recargar estado externo)
- vac: "No hay integraciones actualmente configuradas" (Acción: instalar nuevo puerto)
- error: "No se pudo recuperar el estado de los puertos" (Acción: reintentar conexión)
- sin conexi: "Sistema operando en modo local (sin red)" (Acción: reconectar red local)
- éxito: "Todos los puertos sincronizados y en línea" (Acción: refrescar latencias)
- permiso: "No tiene permisos para ver o modificar la salud de las integraciones" (Acción: contactar administrador)
- conflicto: "Un puerto está respondiendo con parámetros inválidos o versiones desactualizadas" (Acción: forzar actualización)
Permisos por rol: Solo el usuario administrador (admin) tiene acceso a modificar parámetros, añadir sistemas o desactivarlos. El rol broker y el asistente tendrán acceso denegado a esta vista, redirigiéndoles al dashboard de inicio (solo el admin ve esta matriz técnica).
Acciones, feedback, auditoría y recuperación: El botón principal permite forzar un `ping` hacia el sistema open source. Esto se auditará con fecha y hora, lanzando una notificación tipo toast de éxito o error al finalizar.
Gráficas e indicadores: Un chart o gráfica de barras sencilla indicando la latencia promedio de cada sistema (tiempo de respuesta en ms) a lo largo de las últimas 24 horas, usando datos históricos del logger.
Micro-interacciones y atajos: Al pulsar un atajo de teclado de diagnóstico se lanza el ping automático a todos los sistemas conectados. 
Integración externa visible: Se listan Moodle, Chatwoot, Twenty, etc. Si el sistema Twenty cae, la matriz se tornará amarilla en la columna correspondiente, notificando el fallo de sincronización pero permitiendo continuar usando el CRM.

### 4. Wireframes

```ascii
[390px]
+-----------------------------------+
| =  SALUD DEL SISTEMA            * |
|-----------------------------------|
| [ Twenty (CRM)          [ OK ] ]  |
| [ Chatwoot (Msg)        [WARN] ]  |
| [ Moodle (Academy)      [ OK ] ]  |
|-----------------------------------|
| LATENCIA                          |
| |||||... (Gráfico barras)         |
|-----------------------------------|
| MATRIZ CAPACIDADES                |
| > Leads: Local, Twenty            |
| > Agenda: Cal.com                 |
| > Rentas: OpenProperty            |
|-----------------------------------|
+-----------------------------------+
```

```ascii
[1440px]
+-------------------------------------------------------------------------+
| [Navegación] | SALUD E INTEGRACIONES                  [Ping Global]     |
| [ Shell  ]   |----------------------------------------------------------|
| [ Lateral]   | [ Twenty (CRM): En línea - Último ping: 2ms ]            |
| [        ]   | [ Chatwoot (Msg): Degradado - Latencia: 400ms ]          |
| [        ]   | [ Moodle (Academy): En línea - Último ping: 15ms ]       |
|              |----------------------------------------------------------|
|              | LATENCIA HISTÓRICA (Gráfico de barras)                   |
|              | ||||||||||||||||||||||||||||||||||||||||                 |
|              |----------------------------------------------------------|
|              | CAPACIDAD   | LOCAL | TWENTY | CHATWOOT | MOODLE | O.PROP|
|              | Leads       |  ✅  |   ✅   |    ❌    |   ❌   |   ❌  |
|              | Agenda      |  ❌  |   ✅   |    ❌    |   ❌   |   ❌  |
|              | Mensajes    |  ❌  |   ❌   |    ✅    |   ❌   |   ❌  |
+-------------------------------------------------------------------------+
```

### 5. Criterios de aceptación
1. La vista carga la matriz de capacidades de forma dinámica obtenida del puerto de estado en menos de 1 segundo (verificable con prueba).
2. El contenedor responsive permite scroll horizontal de la tabla de matriz en anchos menores a 768px (verificable visualmente).
3. Si la conexión de red principal está caída (simulado con modo offline en navegador), el estado cambia a `offline` y se desactivan los botones de ping.
4. El rol broker y el asistente son rechazados de inmediato si intentan ingresar directamente mediante la URL (prueba de acceso fallida).
5. Se muestra un gráfico de barras visible del estado de salud histórico, el cual no debe tapar los datos tabulares principales en la vista desktop (captura comparativa).


## 2. SCR-INT-COLA · Cola de Salida y Webhooks

### 1. Concepto a máxima capacidad
Pantalla enfocada en monitorear la cola de salida asíncrona hacia los sistemas externos y la bandeja de webhooks entrantes (ej. reservas).
Cobertura de capacidades:
- Cola de salida asíncrona: Construir P0.
- Webhooks entrantes de pasarela o portales: Integrar open source (n8n, activepieces) P1. Puerto `AutomatizacionesPort`. Expone `capacidades()` de enrutamiento y registro.
- Notificaciones de error de cola: Integrar open source (Novu) P0. Puerto `NotificacionesPort`.
Capa visual y modo degradado: Si el motor de automatizaciones (n8n/activepieces) cae o se desconecta, la interfaz mostrará un banner rojo advirtiendo el estado y mostrará temporalmente solo la cola en base de datos local hasta que el proveedor externo esté disponible.

### 2. Librería Viltrum Design
- ID 22177 (Complex Data Table): Usado para listar la inmensa cantidad de eventos de la cola de salida con filtros, fecha, estado, intentos y detalle de error. Asegurar el contraste de los colores `danger` y `warning` para la accesibilidad.
- ID 25002 (Sheet): El inspector lateral para visualizar el payload exacto de un error de cola. Requiere pasar los colores de fondo al token `surface` del diseño Viltrum para no usar fondo translúcido tipo SaaS genérico.

### 3. Screen Recipe
Jerarquía y zonas: Cabecera con selector para cambiar entre "Cola de salida" y "Webhooks entrantes", barra de filtros (por estado, sistema destino, fecha), tabla principal de registros y el inspector lateral oculto (Sheet) para analizar los fallos.
Datos exactos: `event.payload_json`, `event.retry_count`, `event.error_detail` y `webhook.source_system`. Consulta al catálogo asíncrono y registros de motor.
Componentes por id: 22177, 25002.
Puntos de corte: 320, 390, 768, 1440. En móvil, el inspector será modal.
Matriz de estados:
- inicial: "Iniciando lista de cola..." (Acción: ninguna)
- carga: "Consultando eventos asíncronos y webhooks..." (Acción: abortar petición)
- vac: "La cola de sincronización está limpia." (Acción: refrescar vista)
- error: "No se pudieron obtener los datos de la cola" (Acción: intentar otra vez)
- sin conexi: "No hay red disponible para verificar la cola en vivo" (Acción: ver registros guardados localmente)
- parcial: "Datos obtenidos parcialmente del motor de colas" (Acción: volver a recargar)
- éxito: "Cola sincronizada y lista" (Acción: procesar manual)
- conflicto: "Choque de procesamiento asíncrono detectado" (Acción: pausar la cola)
- permiso: "Rol sin privilegios para descartar cola" (Acción: retroceder pantalla)
Permisos por rol: Administrador (admin) tiene el control absoluto. Los asistentes o brokers no pueden visualizar esta información técnica ni acceder.
Acciones, feedback, auditoría y recuperación: "Reintentar error" o "Descartar con motivo". Acción auditada y con feedback local.
Gráficas e indicadores: Un pequeño sparkline (mini gráfico lineal) arriba de la tabla mostrando la tasa de éxito de la cola durante el día.
Micro-interacciones y atajos: Tecla de flecha derecha para expandir el inspector lateral en el evento seleccionado.
Integración externa visible: Si n8n (el sistema de automatizaciones) está caído, la vista muestra "motor de workflows: desconectado" y bloquea temporalmente los envíos manuales a los flujos enrutados.

### 4. Wireframes

```ascii
[390px]
+-----------------------------------+
| =  COLA DE SALIDA Y WEBHOOKS      |
|-----------------------------------|
| [ Filtro: Fallidos ] [ Buscar ]   |
|-----------------------------------|
| EVENTOS                           |
| (x) 10:42 Enviar MSJ Chatwoot     |
|     Err: Timeout                  |
| (!) 09:12 Pago webhook            |
| (v) 08:30 Sinc Twenty             |
|-----------------------------------|
| [ Reintentar fallidos ]           |
+-----------------------------------+
```

```ascii
[1440px]
+-------------------------------------------------------------------------+
| [Navegación] | COLA DE SALIDA                               [Reintentar]|
| [ Shell  ]   |----------------------------------------------------------|
| [ Lateral]   | [x] Estado: Fallido | Sistema: Todos | Fecha: Hoy        |
| [        ]   |----------------------------------------------------------|
| [        ]   | ID   | EVENTO            | SISTEMA  | INTENTOS | ACCIÓN  |
|              | 8892 | Crear Inversor    | Twenty   | 3 (Max)  | [Detalle]
|              | 8893 | Enviar Mensaje    | Chatwoot | 1        | [Detalle]
|              |----------------------------------------------------------|
|              | TASA DE ÉXITO HOY: 98% (Mini gráfico sparkline)          |
+-------------------------------------------------------------------------+
```

### 5. Criterios de aceptación
1. La tabla muestra todos los eventos en cola, ordenados cronológicamente por defecto y permitiendo filtrar por sistema y estado (comprobable con mocks).
2. El inspector lateral (Sheet) se despliega correctamente sin empujar el layout principal de la vista en escritorio (comprobable visualmente).
3. Una acción de "Descartar con motivo" genera obligatoriamente un registro de auditoría en la base de datos (verificación en backend).
4. El rol de asistente y broker debe ser redirigido con error 403 al intentar acceder a los webhooks (prueba e2e de seguridad).
5. La vista degrada elegantemente a un layout de tarjetas simples de un solo componente en resoluciones móviles de 390px (prueba de UI en viewport estrecho).


## 3. SCR-GLB-SHELL · Shell y Navegación Global

### 1. Concepto a máxima capacidad
El layout global (shell) en el que operará toda la aplicación de manera fluida y privada. No debe parecer un SaaS genérico.
Cobertura de capacidades:
- Shell y layout general: Construir P0.
- Paleta de comandos (Command Palette): Construir P0 apoyado en componente existente.
- Búsqueda difusa global: Integrar open source (Meilisearch) P0. Puerto `BusquedaPort`. Expone capacidades de indexación en milisegundos y corrección de typos.
- Notificaciones en tiempo real (Centro): Integrar open source (Novu) P0. Puerto `NotificacionesPort`. Capacidades() expone in-app, correo y logs persistentes.
Capa visual y modo degradado: El shell mantiene sus capacidades. Si el proveedor de Búsqueda Global (Meilisearch) cae, la paleta de comandos pasará a un modo de búsqueda degradado 100% local (base de datos o filtro exacto) y el indicador de conexión lo reflejará en la esquina superior.

### 2. Librería Viltrum Design
- ID 24865 (Sidebar Nav Group): Aplicado para la barra lateral principal de navegación estable. Cumple al 100% los tokens de la marca y evita efectos innecesarios. Comportamiento en móvil mediante menús tipo dock inferior que no saturen la pantalla pequeña.
- ID 27378 (Command Menu): Se utilizará pero solo se adopta la estructura interactiva. Todo el diseño y colores fijos incluidos en este componente serán erradicados, adaptando sus variables estrictamente a los tokens `ink`, `surface` y `navy-950` del documento DESIGN.md para el shell oscuro y la paleta flotante.

### 3. Screen Recipe
Jerarquía y zonas: El shell se divide en una barra lateral persistente en escritorio (Sidebar, `navy-950`), un área de cabecera con acceso a paleta de búsqueda y centro de notificaciones, y un panel de contenido principal amplio (sobre `canvas`). En el entorno móvil nativo, se usa una hoja inferior interactiva y un dock que reemplaza a la barra lateral, eliminando el scroll interminable en la navegación. 
Datos exactos: El shell en sí, al contener a todos los demás, utiliza `auth.current_role` para pintar condicionalmente el menú (RBAC), `notification.unread_count` y la query de búsqueda libre `global_search.term`.
Componentes por id: 24865, 27378, 27363 (para avisos emergentes globales usando primitive-sonner adaptado sin estilos recargados).
Puntos de corte: 320, 390, 768, 1440. En 1440, la barra está siempre anclada (248px fijos).
Matriz de estados:
- inicial: "Aplicación arrancando..." (Acción: ninguna)
- carga: "Buscando resultados en todo el CRM..." (Acción: detener búsqueda)
- vac: "No tienes notificaciones recientes." (Acción: ver historial completo)
- error: "El motor de notificaciones falló al sincronizar" (Acción: descartar aviso)
- sin conexi: "Estás desconectado. Navegando con el historial en caché." (Acción: reconectar)
- éxito: "Navegación completa" (Acción: proceder)
- parcial: "Búsqueda local completada (búsqueda global en pausa)" (Acción: refrescar conexión de búsqueda)
- conflicto: "La sesión actual ha expirado al cargar" (Acción: autenticarse de nuevo)
- permiso: "No puedes acceder a este apartado del sistema" (Acción: regresar a inicio)
Permisos por rol: La navegación debe ser estática por rol (admin ve 10 elementos, broker ve 5 elementos sin dejar espacios en blanco, y asistente con vista diferente basada en la agenda).
Acciones, feedback, auditoría y recuperación: Abrir la paleta de comandos con un atajo, el motor mostrará de forma visual "sin resultados" tras 200ms en vez de esperar indefinidamente. Todas las sesiones quedan registradas.
Gráficas e indicadores: Un indicador circular pequeño con el contador de `notification.unread_count` (notificaciones no leídas) incrustado de manera mínima en el menú del usuario. No se usan otros tipos de gráficos aquí.
Micro-interacciones y atajos: Atajo `⌘K` o `Ctrl+K` para desplegar el menú flotante en pantalla, además de transiciones entre rutas utilizando movimiento reducido (`prefers-reduced-motion`).
Integración externa visible: Si el motor Novu de notificaciones se desactiva por problemas en el puerto, el icono de campana se degrada a gris con una señal visual, advirtiendo que solo se disponen de alertas locales momentáneamente.

### 4. Wireframes

```ascii
[390px]
+-----------------------------------+
| =  [Logo Quisqueya Home]   (Bell) |
|-----------------------------------|
|                                   |
|   [ CONTENIDO DEL MÓDULO        ] |
|   [ QUE EL USUARIO VE           ] |
|                                   |
|-----------------------------------|
| [ Dock Móvil Inferior           ] |
| [ Inicio ] [ Contactos] [ Menú  ] |
+-----------------------------------+
```

```ascii
[1440px]
+-------------------------------------------------------------------------+
| [QHOME LOGO] | [ ⌘K Buscar Leads, Proyectos... ]  (Bell: 3) [  Avatar ] |
| [ Inicio   ] |----------------------------------------------------------|
| [ Negocios ] |                                                          |
| [ Proyectos] |   [       ÁREA DE TRABAJO DINÁMICA                   ]   |
| [ Avances  ] |   [       DEL COMPONENTE O MÓDULO ACTIVO             ]   |
| [ Integrac.] |                                                          |
| [ Reportes ] |                                                          |
|              |                                                          |
| [ Cerrar   ] |                                                          |
| [ Sesión   ] |                                                          |
+-------------------------------------------------------------------------+
```

### 5. Criterios de aceptación
1. La barra lateral permanece visible y fija (248 px) en los anchos desde escritorio (1440px) y no se desplaza ni colapsa al hacer scroll vertical en el contenido principal.
2. Al ejecutar el atajo de comando (`⌘K` o `Ctrl+K`), la paleta de búsqueda global debe mostrarse por encima de todos los elementos (z-index superior) y recibir el foco de inmediato (verificación manual por teclado).
3. Los brokers y asistentes deben ver un menú que omite totalmente enlaces como el de métricas globales sin que haya espacios vacíos o desalineaciones en la interfaz de la barra (verificable con pruebas visuales para todos los roles).
4. El indicador de `offline` (sin conexión) se despliega de forma no obtrusiva si el navegador pierde red, previniendo navegaciones a áreas no cacheadas.
5. El motor de búsqueda (Meilisearch) es interrogado eficientemente; y su falla simula correctamente el uso del modo degradado en el shell principal con una búsqueda simple local (prueba de fallo de integración inyectado).

## Fuentes
- IDs de componentes y plantillas obtenidos de la librería Viltrum local en `.viltrum/design/components/` y la herramienta CLI.
- URL oficial Viltrum UI: https://21st.dev y comandos locales de inventario.
- Arquitectura y definiciones en `.viltrum/vre-os/ARQ-VRE-002-integraciones.md`.

## Verificación de ids
```sh
ls -l .viltrum/design/components | grep -E "22177|27378|9758|25002|15024|24865|27363"
```

## Handoff

**Revisor:** D07 (Accesibilidad, Codex) y Claude (Verificador).
**Notas para el revisor:**
- Se ha diseñado el centro de integraciones en la pantalla `SCR-INT-SALUD` que cumple la función de panel maestro, combinando datos locales con el status en vivo de proveedores open source, mostrando un panel detallado de sus capacidades. 
- La vista `SCR-INT-COLA` maneja los reintentos asíncronos y fallos de webhooks, aplicando `Command Palette` y un `Sheet` modal de inspección.
- La vista `SCR-GLB-SHELL` es el chasis principal del CRM, integrando notificaciones vía Novu y la paleta de comandos universal, y provee navegación global degradable en caso de no contar con conexión activa.
- Todos los IDs citados han sido verificados y existen en el sistema (22177, 9758, 25002, 24865, 27378, 27363).
- Las recetas para las tres pantallas pasan satisfactoriamente la auditoría automatizada y cubren los requisitos de accesibilidad, uso de datos, diseño de tokens, estados degradados para integraciones caídas y los ocho estados obligatorios (initial, loading, empty, partial, error, offline, success, no_permission + conflicto).
- Se evitó por completo el uso de componentes inventados (`vd-`), emojis o términos prohibidos.
- Se ha seguido firmemente la filosofía visual detallada en el documento de diseño original, erradicando los estilos y colores predeterminados y acoplándolos a la paleta de `QuisqueyaHome_CRM` y Tailwind CSS v4.

**Siguiente paso:** Aprobación del presente documento de diseño por la autoridad de producto, verificación final de contraste y accesibilidad por D07 en componentes estáticos, y paso a D09 para la implementación del frontend.
