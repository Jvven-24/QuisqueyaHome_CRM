# T-DS-1 · Diseño profundo PXIL: Negocios y Leads

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
- SCR-NEG-TABLERO · SCR-NEG-LISTA · SCR-NEG-FICHA
- SCR-LEAD-BANDEJA · SCR-LEAD-FICHA · SCR-LEAD-ENTRADA
Pistas de capacidad (punto de partida, supérala si investigas mejor): Negocios: tablero con valor ponderado por columna, tarjeta con monto, probabilidad, días en etapa, próxima acción, indicador de negocio estancado, arrastrar con confirmación y motivo al perder, vistas guardadas por rol, lista con agrupación y acciones en lote, analítica (embudo, antigüedad, pronóstico, motivos de pérdida), ficha 360 con propiedades de interés múltiples, esquema de pago 10/40/50 como simulador, checklist de documentos, comisión estimada solo admin, control que distingue venta cerrada de negocio no concretado. Leads: bandeja con temporizador de respuesta, calificación por presupuesto/horizonte/origen, atribución por campaña con ROI, reglas de asignación (turno, zona, idioma), detección de duplicados por teléfono E.164, acciones WhatsApp/llamar/correo, ficha con línea de tiempo unificada, convertir a negocio, canales de captura (formulario, webhook, manual, importación CSV).


## Capa visual de los sistemas open source conectados (petición de Wilber, 4-oct)
Todo sistema open source integrado debe poder **verse y usarse desde el CRM general**, nunca incrustando su interfaz: se reproduce en
nuestro frente con nuestros componentes, alimentada por su puerto (ARQ-VRE-002). Para cada pantalla que diseñes:
- Marca **qué funciones vienen de qué sistema** (Twenty, Moodle, Chatwoot/Evolution, Cal.com/Schedule-X, OpenProperty, MapLibre…) con una
  indicación discreta de origen y su **estado de conexión** (conectado · degradado · desconectado).
- **Detección de capacidades:** cada puerto expone `capacidades()` (qué sabe hacer el proveedor activo). La pantalla muestra solo lo que el
  proveedor soporta y define la **versión degradada** cuando no (ejemplo: sin mensajería conectada, el botón WhatsApp abre `wa.me`).
- Define el **comportamiento si el proveedor cae**: la pantalla sigue útil con datos locales y avisa del estado.


## Por qué se repite
Tu entrega anterior NO pasó el validador objetivo. **Ejecútalo tú** y no termines hasta que salga completo:
`node scripts/spec/design-check.mjs .viltrum/vre-os/design/DS-1-negocios-leads.md` (directorio: `C:/Users/wilbe/Documents/QuisqueyaHome_CRM`). Itera: corrige, vuelve a correrlo,
repite. Trabaja **una pantalla cada vez** y corre el validador al terminar cada una: la calidad bajó a medida que avanzabas (la primera pantalla estaba
bien; las últimas tenían recetas de 175 caracteres). Cada pantalla debe quedar al nivel de la primera o por encima.

## FORMATO OBLIGATORIO (el validador lo exige; una pantalla = un bloque independiente)
Para cada pantalla, un bloque con este encabezado exacto y estas cinco subsecciones, en este orden:
```
## <n>. SCR-XXX-YYY · <Nombre>
### 1. Concepto a máxima capacidad   (capacidades; por cada una: construir | integrar open source (sistema, puerto, método de capacidades()) | portar; prioridad P0/P1/P2; capa visual y modo degradado si el proveedor cae)
### 2. Librería Viltrum Design        (≥ 2 componentes con ID NUMÉRICO real de la librería, cada uno con encaje, qué normalizar a tokens, riesgo de accesibilidad, comportamiento móvil)
### 3. Screen Recipe                  (≥ 1500 caracteres; ver lista)
### 4. Wireframes                     (DOS bloques de código ASCII: uno a 390 px y otro a 1440 px)
### 5. Criterios de aceptación       (lista numerada de ≥ 5 criterios verificables con captura o prueba)
```
La **Screen Recipe** debe contener, cada elemento con su etiqueta en negrita:
**Jerarquía y zonas** · **Datos exactos** (≥ 4 campos entre acentos graves, p. ej. `deal.amount_cents`, y la consulta o contrato que los alimenta) ·
**Componentes por id** · **Puntos de corte** (320, 390, 768, 1440) · **Matriz de estados**: los ocho — initial, loading, empty, partial, error, offline,
success, no_permission (+ conflict si hay mutaciones) — cada uno con el texto exacto en pantalla y la acción disponible · **Permisos por rol** (admin,
broker, asistente) · **Acciones** (feedback, auditoría y recuperación de cada una) · **Gráficas e indicadores** (tipo, métrica y consulta) ·
**Micro-interacciones y atajos** · **Integración externa visible** (qué sistema, estado de conexión y cómo se ve si cae).
Reglas de vocabulario: «Negocios», **nunca la palabra «pipeline»** (tampoco en mensajes de error ni en consultas de ejemplo); sin emojis; sin `vd-…` inventados.
Conserva lo que ya estaba bien y amplíalo; **sobrescribe el mismo archivo**.

## Reglas de entrega
Escribe SOLO `.viltrum/vre-os/design/DS-1-negocios-leads.md` (más lo que la CLI guarde en `.viltrum/design/` y capturas en
`.viltrum/vre-os/capturas/DS/`). Sin código del CRM, sin git. Lo no verificado = `UNKNOWN`. Nada de componentes inventados
(`vd-...`): si no hay id real, dilo y propón construirlo con shadcn. Termina con `## Fuentes` (ids, rutas, URLs) y un bloque
`## Verificación de ids` con el comando que comprueba que cada id citado existe y su salida.
