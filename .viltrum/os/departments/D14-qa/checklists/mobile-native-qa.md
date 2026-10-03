# Checklist QA — Verificación de Experiencia Móvil Nativa (Gate G5 / G6)

> Auditoría de D14 (QA) para certificar que la experiencia móvil en Web/React cumpla estándares nativos iOS/Android antes de pasar a producción.

---

## 1. Verificación de Viewport y Dynamic Units
- [ ] La aplicación no presenta saltos o barras cortadas al deslizar en navegadores móviles (Safari iOS y Chrome Android).
- [ ] Los contenedores a pantalla completa utilizan `100dvh` (o fallback a `100vh`) y no desbordan verticalmente.
- [ ] Meta viewport contiene: `width=device-width, initial-scale=1.0, viewport-fit=cover`.
- [ ] Safe Area insets (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`) están presentes en barras de estado, tab bars y modales.

---

## 2. Prevención de Desbordamiento de Cajas y Modales (Box Model Integrity)
- [ ] En viewports `< 768px`, ningún modal ni diálogo se renderiza como cuadro flotante centrado de ancho fijo (`w-[...px]`).
- [ ] Los modales móviles adoptan el patrón **Bottom Sheet** (`w-full`, pegado al borde inferior `bottom-0`, esquinas superiores redondeadas `rounded-t-2xl`, altura máxima acotada a `max-h-[90dvh]`).
- [ ] El cuerpo del Bottom Sheet tiene scroll independiente con `overflow-y-auto` y `overscroll-behavior-y: contain`, previniendo scroll de la página de fondo.
- [ ] Los encabezados y botones de cierre o confirmación del modal permanecen visibles (`sticky` top/bottom) sin quedar enterrados o cortados por la pantalla.

---

## 3. Ergonomía Táctil y Touch Targets
- [ ] Todos los elementos accionables (botones, pestañas, selectores, checkboxes, links de navegación) tienen un área mínima de toque de **44px × 44px**.
- [ ] Las acciones principales de los formularios se encuentran en la **Zona del Pulgar** (tercio inferior de la pantalla).
- [ ] Espaciado adecuado entre botones interactivos para evitar toques involuntarios o erráticos.
- [ ] Se elimina el destello azul predeterminado con `-webkit-tap-highlight-color: transparent`.

---

## 4. Comportamiento Táctil, Deslizamiento y Gestos
- [ ] El Bottom Sheet cuenta con barra de arrastre (*drag handle*) visible y responde a gestos de arrastre táctil hacia abajo para cerrar.
- [ ] Cierre por flick (deslizamiento rápido hacia abajo) evaluado con umbral de velocidad y distancia.
- [ ] Las listas con `PullToRefresh` solo se activan cuando el scroll está en `scrollTop === 0`.
- [ ] Las transiciones de apertura y cierre utilizan curvas de aceleración de resorte natural (spring easing) sin retraso perceptible.

---

## 5. Teclado Virtual y Campos de Entrada
- [ ] Cada campo numérico presenta el teclado numérico nativo (`inputmode="numeric"` o `type="number"`).
- [ ] Los campos de correo y teléfono invocan teclados con símbolos `@` y teclado telefónico respectivamente (`inputmode="email"`, `inputmode="tel"`).
- [ ] Al abrirse el teclado virtual, los inputs o botones de confirmación no quedan tapados; la vista o Bottom Sheet se ajusta escuchando `visualViewport`.

---

## 6. Evidencia Requerida para Aprobación
- [ ] Captura de pantalla en viewport móvil 375×667 (iPhone SE / estándar compacto).
- [ ] Captura de pantalla en viewport móvil 390×844 o 412×915 con Bottom Sheet abierto.
- [ ] Prueba automatizada de Playwright Mobile ejecutada sin violaciones de layout ni desbordamientos (`scrollWidth <= clientWidth`).
