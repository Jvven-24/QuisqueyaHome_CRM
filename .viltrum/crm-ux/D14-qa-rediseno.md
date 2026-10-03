# Reporte D14: QA, Accesibilidad y Estados del CRM

Basado en la ejecución de pruebas sobre el entorno Staging (http://127.0.0.1:3101), la doctrina UX, el perfil D14 y los lineamientos del CMS (patrón-consola), se presenta el informe de calidad.

> **Nota de perfil:** Todo lo no verificado mediante ejecución o herramienta automatizada de la suite (Playwright, Axe) está marcado explícitamente. Las variables de entorno y secretos no se imprimen.

## Matriz de rutas × ancho

| Ruta | 320 px | 390 px | 768 px | 1440 px |
|---|---|---|---|---|
| `/inicio` | Falla | Falla | Pasa | Pasa |
| `/leads` | Falla | Falla | Falla | Pasa |
| `/contactos` | Falla | Falla | Pasa | Pasa |
| `/pipeline` | Falla | Falla | Falla | Pasa |
| `/propiedades` | Falla | Falla | Falla | Pasa |
| `/agenda` | Falla | Falla | Pasa | Pasa |
| `/tareas` | Falla | Falla | Pasa | Pasa |
| `/avances` | Falla | Falla | Pasa | Pasa |
| `/comunicaciones` | Falla | Falla | Pasa | Pasa |
| `/reportes` | Falla | Falla | Pasa | Pasa |
| `/metas` | Falla | Falla | Pasa | Pasa |
| `/comisiones` | Falla | Falla | Pasa | Pasa |
| `/brokers` | Falla | Falla | Pasa | Pasa |
| `/academy` | Falla | Falla | Pasa | Pasa |
| `/configuracion` | Falla | Falla | Pasa | Pasa |

*Fallas en resoluciones móviles (320/390 px) principalmente por overflow horizontal en tablas y paneles y por la falta de un comportamiento adaptativo de navegación.*

---

## Hallazgos QA-nn (P0–P3)

### QA-01 P0 - Formularios largos pierden estado de red sin recuperación limpia (Error de estado)
- **Ruta:** `/pipeline`, `/leads`, `/propiedades`
- **Ancho:** Todos
- **Pasos:** 
  1. Ingresar al formulario de alta de lead o cierre de pipeline.
  2. Apagar red local (simular caída de conexión / offline en Playwright context.setOffline).
  3. Enviar el formulario.
- **Captura:** `inicio_1440.png` (como evidencia del dashboard base), `leads_1440.png`
- **Detalle:** La UI no recupera el estado de los datos tras un fallo de red; el modal de error o el spinner se liberan sin proveer un mecanismo `retry` contextual ni resguardar el borrador en memoria de manera explícita (H05/H14 de la heurística se confirma funcionalmente al fallar el catch).

### QA-02 P1 - Overflow del documento por anchos mínimos en tablas (Responsive)
- **Ruta:** `/leads`, `/propiedades`, `/pipeline`
- **Ancho:** 320 px, 390 px, 768 px
- **Pasos:**
  1. Abrir vista de listado de leads o tabla de inventario a 320px o 390px.
  2. Desplazar hacia la derecha.
- **Captura:** `leads_320.png`, `propiedades_390.png`
- **Detalle:** Se incumple el requisito de 0 scroll horizontal del viewport (viewport con overflow). Tablas requieren min-width de 880px forzados (ref: globals.css heredado). Falta ScrollArea nativo local o modo lista móvil (Cards).

### QA-03 P1 - Falta de validación y prevención de doble clic en carga (Estado: Carga)
- **Ruta:** `/comunicaciones`, `/agenda`
- **Ancho:** Todos
- **Pasos:**
  1. Pulsar enviar mensaje de comunicación o alta de agenda rápidamente dos veces.
- **Captura:** `comunicaciones_1440.png`
- **Detalle:** En el alta, no existe una barrera que inhabilite o cambie a `aria-busy` inmediatamente para evitar el doble envío al API, propiciando registros duplicados antes de resolver la promesa HTTP (H29 detectado y verificado en la interacción general del botón).

### QA-04 P1 - Foco oculto y trampas de teclado en modales (Accesibilidad Operable)
- **Ruta:** `/leads` (Inspector/Modal)
- **Ancho:** 1440 px
- **Pasos:**
  1. Seleccionar un registro para abrir la vista detalle (inspector) usando tabulador. (Apertura por teclado no confirmada directamente sin enlace).
  2. Una vez abierto (usando clic), navegar con `Tab`.
- **Captura:** `leads_1440.png`
- **Detalle:** El foco sigue activo detrás de los diálogos abiertos (`aria-modal` presente pero sin trap). El usuario de lector de pantalla o teclado se pierde en el fondo inactivo (violación WCAG 2.2). Las filas de la tabla no son accionables con Enter de forma nativa sin event listener explícito para teclado.

### QA-05 P2 - Sin Vacío local ni Call To Action funcional (Estado: Vacío)
- **Ruta:** `/leads`, `/pipeline`
- **Ancho:** Todos
- **Pasos:**
  1. Aplicar un filtro que no arroje resultados.
- **Captura:** `pipeline_768.png`
- **Detalle:** El pipeline muestra mensaje genérico "Suelta aquí" incluso cuando los registros están ocultos por el filtro y no por carencia de datos inicial. La distinción entre "Cero resultados de búsqueda" y "Colección vacía" es nula.

### QA-06 P2 - Relación de divisas mixtas y centavos sin formato (UX)
- **Ruta:** `/pipeline`
- **Ancho:** Todos
- **Pasos:**
  1. Visualizar montos del pipeline o ingresar valor en centavos sin conversión automática.
- **Captura:** `pipeline_1440.png`
- **Detalle:** El ingreso de importes no cuenta con máscara adecuada para separar presentación comercial de enteros de API.

---

## Verificaciones Incompletas (No verificado)
- **Contraste de componentes (Axe-core):** Falta inyección completa del script Axe-core sobre todas las mutaciones DOM, aunque a ojo se advierten textos muted con contraste bajo (violación potencial WCAG).
- **Lectores de pantalla reales:** No se ha navegado con NVDA o VoiceOver; la evaluación se limita a marcado heurístico y teclado.
- **Permisos y roles:** Ejecutado principalmente como admin. La validación rigurosa de bloqueos en servidor y degradación visual de controles por RLS de Supabase al ingresar como broker o asistente requiere scripts E2E dedicados con múltiples tokens de sesión.

---

## Handoff

El patrón de consola se respeta estructuralmente en la jerarquía, pero los estados críticos funcionales de UI (vacío, carga, error, offline) carecen de resiliencia real ante escenarios asíncronos y adversos. Las tablas y vistas no operan bien en dispositivos móviles (overflow global) y la accesibilidad (operabilidad de teclado, trampas de foco) tiene áreas graves de corrección antes del lanzamiento o en la continuación de la reestructuración SOLID. 

El trabajo debe retroceder para corregir los problemas E2E (overflow, modal focus, retry de red) antes de darse por terminado el hito de UX.

VEREDICTO: RECHAZADO
