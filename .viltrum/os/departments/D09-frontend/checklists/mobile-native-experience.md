# Checklist — Experiencia Móvil Nativa en React Web (Gate G4)

> La firma quien revisa (D14 / D07), nunca D09 que produjo.
> Se aplica obligatoriamente a todo módulo, pantalla o flujo con tráfico móvil.

---

## A. Viewport y Safe Area Insets (Hardware Físico)

- [ ] Se utilizan unidades dinámicas `100dvh` (Dynamic Viewport Height) para contenedores a pantalla completa, eliminando saltos bruscos con la barra de direcciones de Safari/Chrome.
- [ ] Todo elemento fijo (`position: fixed` o `position: sticky`) respeta los safe area insets:
  - `padding-top: env(safe-area-inset-top)` en barras superiores / headers.
  - `padding-bottom: env(safe-area-inset-bottom)` en tab bars, bottom sheets y botones flotantes.
- [ ] La etiqueta `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">` está presente en el HTML principal.

---

## B. Ergonomía Táctil y Zona del Pulgar (Thumb Zone)

- [ ] Las acciones críticas (confirmar compra, aplicar filtros, enviar formulario) se ubican en el tercio inferior de la pantalla.
- [ ] Los modales flotantes centrados tradicionales de escritorio están **reemplazados por Bottom Sheets** en pantallas móviles (`< 768px`).
- [ ] El tamaño mínimo de los objetivos táctiles interactivos (`touch-target`) es de al menos `44px × 44px` (o con `hit-area` padding invisible).
- [ ] Se desactiva el highlight azul por defecto de WebKit: `-webkit-tap-highlight-color: transparent`.

---

## C. Físicas de Resorte y Gestos

- [ ] Los drawers y Bottom Sheets implementan arrastre táctil con resistencia elástica (rubber-banding) al superar los límites.
- [ ] Cierre por flick: un deslizamiento rápido hacia abajo cierra el panel con una transición fluida.
- [ ] Las listas con recarga implementan `PullToRefresh` elástico únicamente cuando el scroll se encuentra en el tope absoluto (`scrollTop === 0`).
- [ ] El contenedor interno tiene `overscroll-behavior-y: contain` para impedir que el scroll rebote en el body de la página padre.

---

## D. Teclado Virtual y Formularios Móviles

- [ ] Cada campo de entrada define su `inputmode` exacto:
  - `inputmode="numeric"` para cédulas, códigos OTP, tarjetas o montos numéricos.
  - `inputmode="email"` para correos.
  - `inputmode="tel"` para números de teléfono.
- [ ] Los botones de acción fija o Bottom Sheets escuchan el evento `window.visualViewport.resize` para subir automáticamente cuando el teclado virtual se despliega, impidiendo que el botón quede oculto.
- [ ] Los campos de texto tienen `enterkeyhint="next"` o `enterkeyhint="done"` para controlar la tecla de acción del teclado nativo.

---

## E. Retroalimentación Háptica

- [ ] Se dispara micro-vibración suave (`navigator.vibrate(12)` o `useHaptics`) en:
  - Cambio de pestaña en la `MobileTabBar`.
  - Toque en toggles y sliders.
  - Disparo exitoso de `PullToRefresh`.
  - Alerta o error de validación en formularios.
- [ ] La emulación háptica cuenta con fallback seguro y silencioso si el dispositivo o navegador no soporta la Vibration API.

---

## F. Entrada, navegación y compatibilidad adaptable

- [ ] Los campos de texto usan tamaño de fuente de al menos `16px` en móvil para evitar zoom automático al enfocarlos en navegadores que lo aplican.
- [ ] En una SPA, cada vista navegable tiene URL representativa; atrás/adelante del navegador y enlaces directos restauran el destino esperado.
- [ ] Si el producto requiere instalación o capacidades de aplicación, se verifica el comportamiento PWA definido para ese alcance (manifest, service worker y fallback); si no aplica, se registra como no aplicable.
- [ ] Se comprueba el layout en cada punto de corte de D05 (`320/390/430/768/1024/1440`) sin overflow ni contenido estirado sin límite, más un ancho intermedio y uno ultra-wide como comprobación exploratoria que **no** cuentan como punto de corte (añadir `360px` y ultra-wide a la fuente única está pendiente de decisión humana).
- [ ] Las animaciones respetan `prefers-reduced-motion`, con alternativa que reduce o elimina movimiento no esencial.
