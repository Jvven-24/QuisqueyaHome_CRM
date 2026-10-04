# T-DS-3 · Diseño profundo PXIL: Integraciones y shell global

Perfil: **D05 UI / Design System** (con criterio D04 recorridos, D06 estados, D08 feedback). Modo: analysis, **sin código**.
Revisores: D07 (accesibilidad, Codex) y Claude (verifica ids, capturas y coherencia). Tier: large.
Decisión que manda: `docs/contexto/decisiones.md` **#46**: Wilber autorizó un **rediseño profundo**. La demo del Sprint 1 es solo el
**concepto** de cada módulo; **amplía cada pantalla a su máxima capacidad** para una inmobiliaria de lujo en República Dominicana
(diáspora, USD, Confotur), lo que el módulo debe hacer manda sobre cómo lo hacía la demo.

## Doctrina y flujo (obligatorio, es el flujo PXIL de Viltrum)
Lee: `E:/PERFILES AI/skills/viltrum-pxil-design/SKILL.md`, `E:/PERFILES AI/skills/patron-consola/SKILL.md`,
`E:/PERFILES AI/skills/mobile-native-experience/SKILL.md`, `E:/PERFILES AI/templates/pxil-experience-contract.md` y
`E:/PERFILES AI/templates/pxil-component-evaluation.md` (plantillas de salida), y `docs/DESIGN.md` (tokens, tipografía, reglas del dorado).
Brief ya registrado: `.viltrum/vre-os/design/pantallas-e1.json` (id `BRIEF-VRE-E1`); tus pantallas son las de la lista de abajo.
Principios innegociables: seis estados + parcial + conflicto cuando haya mutaciones; datos reales (nada hardcodeado); móvil nativo
(hoja inferior, dock, sin scroll interminable); **rápido y simple**: ampliar capacidad NO es recargar, usa divulgación progresiva,
pestañas y acciones contextuales; sin emojis; sin glassmorphism; texto en español; **vocabulario firmado: «Negocios», nunca «pipeline»**.
Roles firmados: el **administrador** ve precio real, métricas globales y comisiones de terceros; el **broker** solo lo suyo; el
**asistente** necesita aprobación para publicar cambios. Nada se elimina (bajas lógicas; negocio perdido archivado con motivo).

## Qué hacer, por pantalla
1. **Concepto a máxima capacidad.** Decide qué debe haber en esa pantalla según su propósito (investiga cómo lo resuelven los CRM
   inmobiliarios líderes — Follow Up Boss, kvCORE, HubSpot, AlterEstate que el cliente ya conoce — y Twenty). Para cada capacidad
   indica **cómo se cubre**: construir · integrar open source (consulta `.viltrum/vre-os/oss-registry.json` y
   `.viltrum/vre-os/D21-cobertura-modulos.md`; licencia verificada; modo RUN/APP/PORT/REFERENCE y puerto) · portar. Prioriza P0/P1/P2.
2. **Librería Viltrum Design (mírala de verdad).** En `C:/Users/wilbe/Documents/QuisqueyaHome_CRM`: `viltrum design status`, luego
   `viltrum design search --query "<patrón concreto>" --limit 8` (≥ 3 búsquedas por pantalla), `viltrum design acquire --id <ID>` para los
   elegidos, y **abre sus capturas** (`E:/VILTRUM/VILTRUM DESING/pxil-ecosystem/private-library/screenshots/`, `.viltrum/design/`).
   Elige por **id numérico real** (verifica que existe `.viltrum/design/components/<id>.json` o está en `catalog-index.json`).
   Para cada elegido rellena la evaluación (plantilla `pxil-component-evaluation`): encaje, qué normalizar a tokens, riesgo de accesibilidad,
   comportamiento móvil, dependencias y licencia. Cita también la biblioteca propia (`src/components/ui/`) y shadcn antes de adquirir nada nuevo.
3. **Screen Recipe** (plantilla `pxil-experience-contract`): jerarquía y zonas · datos exactos (campos y la consulta que los alimenta) ·
   componentes por id · puntos de corte 320/390/768/1440 · **8 estados** con el texto y la acción de cada uno · acciones con permisos,
   feedback, auditoría y recuperación · gráficas (tipo de gráfica + métrica + consulta) · micro-interacciones y atajos · qué integración
   externa se ve y cómo se ve cuando el proveedor cae · criterios de aceptación visuales verificables.
4. **Wireframe ASCII** a 390 y a 1440 por pantalla y una lista de **tokens/variantes nuevas** que haga falta añadir (con valor y contraste).
5. **Evidencia del estado actual**: usa las capturas ya hechas en `.viltrum/vre-os/capturas/A/` y `/B/` o toma las que falten con
   Playwright (`C:/Users/wilbe/node_modules/playwright`, login con el botón «Admin» en `http://localhost:9301/login`; no levantes el servidor).

## Pantallas de esta tarea
- SCR-INT-SALUD · SCR-INT-COLA
- SCR-GLB-SHELL
Pistas de capacidad (punto de partida, supérala si investigas mejor): Integraciones: tarjetas de salud por puerto (CRM/Twenty, mensajería, almacenamiento, agenda, academia) con último contacto, versión y prueba de conexión; modo degradado visible; cola de salida con filtros por estado, detalle del error, reintentar y descartar con motivo (admin, auditado); bandeja de webhooks entrantes; estado de credenciales sin mostrar secretos. Shell: navegación agrupada, paleta de comandos con búsqueda global (leads, negocios, proyectos, unidades, contactos), centro de notificaciones real (respuesta vencida, negocio estancado, tarea vencida, fallo de integración), dock móvil con hoja, aviso sin conexión, menú de usuario y rol.


## Capa visual de los sistemas open source conectados (petición de Wilber, 4-oct)
Todo sistema open source integrado debe poder **verse y usarse desde el CRM general**, nunca incrustando su interfaz: se reproduce en
nuestro frente con nuestros componentes, alimentada por su puerto (ARQ-VRE-002). Para cada pantalla que diseñes:
- Marca **qué funciones vienen de qué sistema** (Twenty, Moodle, Chatwoot/Evolution, Cal.com/Schedule-X, OpenProperty, MapLibre…) con una
  indicación discreta de origen y su **estado de conexión** (conectado · degradado · desconectado).
- **Detección de capacidades:** cada puerto expone `capacidades()` (qué sabe hacer el proveedor activo). La pantalla muestra solo lo que el
  proveedor soporta y define la **versión degradada** cuando no (ejemplo: sin mensajería conectada, el botón WhatsApp abre `wa.me`).
- Define el **comportamiento si el proveedor cae**: la pantalla sigue útil con datos locales y avisa del estado.

## Reglas de entrega
Escribe SOLO `.viltrum/vre-os/design/DS-3-integraciones-shell.md` (más lo que la CLI guarde en `.viltrum/design/` y capturas en
`.viltrum/vre-os/capturas/DS/`). Sin código del CRM, sin git. Lo no verificado = `UNKNOWN`. Nada de componentes inventados
(`vd-...`): si no hay id real, dilo y propón construirlo con shadcn. Termina con `## Fuentes` (ids, rutas, URLs) y un bloque
`## Verificación de ids` con el comando que comprueba que cada id citado existe y su salida.

## Pieza central de esta tarea: el «Centro de integraciones»
Diseña SCR-INT-SALUD como **el lugar donde se ve todo lo conectado**: una **matriz de capacidades** (filas = capacidad, columnas = sistema)
que muestra qué ofrece cada sistema, qué parte ya expone el CRM, qué está pendiente y qué se cubre en modo degradado; con el estado de cada
conexión, el último contacto, la versión y una acción «probar conexión». Incluye una vista de **mapa de pantallas ↔ sistemas** (qué pantalla
del CRM depende de qué sistema). Sistemas a representar: Twenty (CRM), Moodle (Academy), Chatwoot/Evolution API (mensajería), Cal.com o
Schedule-X (agenda), OpenProperty (rentas, portado), MapLibre (mapas), almacenamiento y el portal Quisqueya (captura de leads).
