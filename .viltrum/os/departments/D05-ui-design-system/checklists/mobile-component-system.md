# Checklist UI Design System — Arquitectura de Componentes Móviles Nativos (Gate G3)

> Responsable: D05 (UI Design System)
> Validador independiente: D07 (Accesibilidad) / D14 (QA)

---

## 1. Tokens y Primitivas Móviles
- [ ] Definición de tokens de espaciado táctil: `spacing-touch-target = 44px` como mínimo absoluto.
- [ ] Definición de tokens de curvatura móvil: `rounded-sheet = 1.25rem (20px)` para bordes superiores de drawers/sheets.
- [ ] Tokens de sombras e iluminación para elevación móvil (superficies superpuestas a `z-index: 50+`).
- [ ] Tokens para `safe-area-inset`: compatibilidad con variables CSS `--sat`, `--sab`, `--sal`, `--sar`.

---

## 2. Patrones de Layout y Modales
- [ ] **Prohibición de Modales Centrados en Mobile:** Cualquier diálogo o popup debe colapsar a un `MobileBottomSheet` en viewports `< 768px`.
- [ ] **Estructura de Caja del Bottom Sheet:**
  - `Drag Handle` superior: píldora centrada de 36px × 4px en gris atenuado.
  - Header pegajoso (`sticky top-0`) con título truncado y botón de cierre táctil (≥ 44px).
  - Cuerpo con `overflow-y-auto` y `overscroll-behavior-y: contain`.
  - Footer de acción pegajoso (`sticky bottom-0`) con botones de ancho completo dentro de la zona del pulgar.
- [ ] Contenedores principales usan `min-h-[100dvh]` para evitar desfases con las barras dinámicas del navegador.

---

## 3. Barras de Navegación y Acciones
- [ ] `MobileTabBar` fija en la base con etiquetas legibles y retroalimentación háptica/visual al toque.
- [ ] `MobileAppBar` compacta en la parte superior con título claro, botón de retorno y acciones secundarias.
- [ ] `Floating Action Button (FAB)` ubicado estratégicamente en la esquina inferior derecha respetando el inset inferior y sin tapar elementos de lista.
