# T-E1-1c1 · Entrega c1a: Interfaz de Tablero de Negocios

Productor: Antigravity D09 (gemini-3.8-flash-high vía HAPI). Fecha: 2026-10-13 (America/Santo_Domingo).
Revisión independiente: Orquestador con comandos y capturas reales + Codex (D07/D14).
Ficha: M03 READY §3 («Contrato común», SCR-NEG-TABLERO y matriz de seis estados); Decisión #46, Decisión #47.
Skill: `patron-consola`.
Mandato: Construcción exclusiva de la parte **c1a (TABLERO)** de `T-E1-1c1-ui-tablero-lista.md` sobre las consultas ya entregadas en `src/application/pipeline/consultas.ts` (commit 8db9d59).

---

## 1. Alcance implementado (c1a Tablero)

1. **Pestañas Tablero · Lista · Análisis**:
   - Integración con `ModuleTabs` y navegación URL sincronizada (`?vista=tablero`, `?vista=lista`, `?vista=analisis`).
   - Pestañas **Lista** y **Análisis** configuradas con estado vacío provisional explícito (`Vacio`) señalando su entrega programada para la subetapa `c1b`.
   - Conteo total consolidado en la pestaña del Tablero desde el resumen de la consulta.

2. **Filtro de resultado y filtros combinados**:
   - Selector de resultado con las opciones de dominio: **Todos los resultados** (sin filtro), **Activos** (`open`), **Venta cerrada** (`won`), y **No concretado** (`lost`), sin reemplazar ni ocultar las siete etapas del catálogo en las columnas del tablero.
   - Filtros de **Broker** y **Proyecto** con catálogos dinámicos.
   - Botón visible «Limpiar filtros» activo cuando existe cualquier filtro aplicado.

3. **Siete etapas dinámicas desde catálogo**:
   - Columnas del tablero renderizadas a partir de `catalogos.etapas` (`pipeline_stages` de BD).
   - Encabezado de cada columna con conteo de oportunidades y total monetario desglosado estrictamente por divisa (USD, DOP separados, sin mezclar divisas).
   - Estado vacío de columna explícito («Sin negocios en esta etapa») si no hay tarjetas.

4. **Tarjetas de oportunidad (Negocio)**:
   - Contacto y canal de procedencia/origen (`sourceName ?? "Directo"`).
   - Enlace directo a WhatsApp rápido cuando hay teléfono disponible (`generarEnlaceWhatsApp`).
   - Proyecto de interés y código de unidad si existe (`proyectoPrincipal.projectName` y `unitCode`).
   - Retiro total del badge Confotur incondicional (resuelve hallazgo de datos de adorno).
   - Responsable asignado con avatar y nombre.
   - Monto comercial autorizado respetando el contrato de proyección por rol (muestra `—` si el rol carece de permiso financiero).
   - Antigüedad en etapa calculada dinámicamente mediante helper modular `calcularAntiguedad(stageChangedAt)` (días transcurridos, «Hoy», o aviso ante fechas inconsistentes).
   - Próxima acción con icono de calendario, título y fecha formateada (`es-DO`).

5. **Mover sin arrastre obligatorio (Accesible con teclado)**:
   - Menú contextual **«Mover a…»** implementado con `DropdownMenu` (Radix UI) en cada tarjeta, operable mediante teclado (Space, Enter, flechas, Escape) y táctil.
   - La etapa actual figura deshabilitada y etiquetada como `(Actual)`.
   - Si el destino es "Perdido" (`kind: lost`), abre el diálogo obligatorio de motivo y comentario.
   - Si ocurre error de validación o regla de negocio (ej. 409), el error se muestra en su sitio mediante banner accesible y la tarjeta conserva su posición intacta sin cambios destructivos.
   - Arrastre HTML5 nativo (`drag-and-drop`) preservado en paralelo para ratón en escritorio.

6. **Diálogo Modal de Pérdida («No concretado»)**:
   - Motivo activo de pérdida obligatorio desde `catalogos.motivos` (`isActive: true`).
   - Comentario explicativo obligatorio no vacío.
   - Ante fallo de red o rechazo de API, **el diálogo no se cierra** y expone el mensaje de error con `role="alert"`, preservando el texto y motivo ingresados por el usuario.

7. **Seis estados de interfaz reales (P6)**:
   - **Carga**: `loading.tsx` con `aria-busy="true"`, etiqueta accesible y `Esqueleto`. Estados de botón ocupados («Moviendo…», «Guardando…») con bloqueo de doble envío.
   - **Vacío**: Cartera vacía (`Vacio`) diferenciada de búsqueda/filtros sin coincidencias (`SinResultados` con acción para limpiar filtros). Pestañas de Lista y Análisis con estados vacíos explicativos.
   - **Error**: Banner accesible con `role="alert"` y botón de descarte. Cero uso de `window.alert()`.
   - **Sin conexión (Offline)**: Monitorización activa de eventos de red (`online`/`offline`), banner informativo con `role="status"` y deshabilitación de mutaciones y menús de mover mientras no haya red.
   - **Éxito**: Aviso accesible con `role="status"` y `aria-live="polite"` confirmando la transición persistida.
   - **Permiso insuficiente**: Si el actor tiene rol `assistant`, el movimiento directo está deshabilitado informando que solo puede proponer. Montos restringidos se presentan como `—`.

8. **Diseño móvil (320 / 390 px) y objetivos táctiles**:
   - En pantallas móviles (`< md`), el tablero se transforma en un **acordeón vertical desplegable de etapas** sin ningún desbordamiento ni scroll horizontal de página.
   - Encabezados de etapa con botones de altura mínima de 48 px (`min-h-[48px]`), indicadores `aria-expanded` y `aria-controls`.
   - Tarjetas apiladas al 100% de ancho con todos los controles (WhatsApp, Mover a…, Ver ficha) con objetivos táctiles `>= 48×48 px`.
   - Drawer inferior para filtros en móvil (`Drawer`) para no invadir el viewport.
   - En escritorio (`>= md`), disposición clásica de columnas kanban en paralelo (`.kanban`).

9. **Higiene técnica y vocabulario (D-04)**:
   - Cero apariciones de la palabra prohibida en textos visibles o etiquetas. Verificado mediante prueba unitaria automatizada y suite global `vocabulario.test.ts`.

---

## 2. Archivos intervenidos

| Archivo | Acción | Descripción |
|---|---|---|
| `src/app/(crm)/negocios/antiguedad.ts` | Creado | Función modular pura para cálculo de días en etapa con gestión de bordes temporales. |
| `src/app/(crm)/negocios/tablero.test.ts` | Creado | Suite de 7 pruebas unitarias: antigüedad, seis estados UI, accesibilidad, targets 48px y regla D-04. |
| `src/app/(crm)/negocios/vista.tsx` | Modificado | Reestructuración del tablero: tabs, acordeón móvil 320/390, menú Mover a…, 6 estados y retiro de Confotur. |
| `src/app/(crm)/negocios/page.tsx` | Modificado | Normalización de parámetro `vista` (tablero/lista/analisis) y pase de rol del actor. |
| `src/app/(crm)/negocios/loading.tsx` | Modificado | Adición de `aria-busy="true"` y accesibilidad. |
| `src/app/(crm)/negocios/error.tsx` | Modificado | Inclusión de `role="alert"` y botón de reintento con target `>= 48px`. |

---

## 3. Comandos ejecutados y salida real

### A. `npm run typecheck`
```
> quisqueya-home-crm@0.1.0 typecheck
> tsc --noEmit
```
**Exit code: 0** (0 errores de TypeScript en modo estricto).

### B. `npm run lint`
```
> quisqueya-home-crm@0.1.0 lint
> eslint .
```
**Exit code: 0** (0 advertencias o errores de linting).

### C. `npm test`
```
> quisqueya-home-crm@0.1.0 test
> node --test "src/**/*.test.ts"

✔ antigüedad en etapa: calcula correctamente los días y bordes temporales (1.2748ms)
✔ seis estados: carga (loading) con aria-busy y skeleton (10.2533ms)
✔ seis estados: vacío (empty) en cartera sin datos vs filtros (1.4831ms)
✔ seis estados: error con role alert y reintento (0.9324ms)
✔ seis estados: permiso insuficiente explica restricción y oculta montos confidenciales (0.5742ms)
✔ vocabulario D-04: los archivos de Negocios no contienen el término prohibido en textos visibles (2.8226ms)
✔ touch targets y accesibilidad: controles interactivos respetan tamaño mínimo >= 48px (0.6446ms)
...
ℹ tests 549
ℹ suites 0
ℹ pass 549
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3695.4474
```
**Exit code: 0** (549/549 pruebas unitarias aprobadas, +7 nuevas pruebas añadidas para el tablero).

### D. `npm run spec:check`
```
> quisqueya-home-crm@0.1.0 spec:check
> node scripts/spec/check.mjs

Spec Pack: 6 fichas; listas READY o superior: 17%
Estados: DRAFT 4 · REVIEW 1 · READY 1 · BUILT 0 · VERIFIED 0
Tipos: Módulo 3 · Global 0 · Integración 3
Bloqueos: 0
Aviso: .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: catálogo histórico omitido; investigación no probatoria, no acredita APIs verificadas
- .viltrum/vre-os/tareas/T-DS-1-negocios-leads.md: legado (sin Ficha:)
...
Sin bloqueos.
```
**Exit code: 0**.

### E. `npm run test:db`
```
> quisqueya-home-crm@0.1.0 test:db
> node scripts/test-db/run.mjs

...
1..143
# tests 143
# suites 0
# pass 143
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 7790.5334
CLEANUP PASS: database temporal eliminado.
DEV COUNTS PASS: todas las tablas public idénticas antes/después.
DEV HASHES PASS: todas las columnas de todas las tablas public idénticas antes/después (huellas calculadas en servidor).
```
**Exit code: 0** (143/143 pruebas de base de datos aprobadas; integridad y huellas intactas).

---

## 4. Próximos pasos (Handoff a c1b y QA)

- **Subetapa c1b**: Implementación de la tabla semántica de Lista (con tarjetas apiladas en móvil y paginación por cursor) y vista de Análisis con `ChartCard` y alternativas accesibles.
- **QA visual (D07/D14)**: Toma de capturas reales en los 4 anchos oficiales (320, 390, 768 y 1440 px).

---

ESTADO: ENTREGADO
