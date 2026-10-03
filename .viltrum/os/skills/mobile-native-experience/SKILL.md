---
name: mobile-native-experience
description: Estándares, componentes y patrones para transformar aplicaciones web React/Next.js en experiencias indistinguibles de una app móvil nativa. Incluye Bottom Sheets con snap points, Tab Bars ergonómicas en la zona del pulgar, Pull to Refresh elástico, emulación háptica con navigator.vibrate, y adaptación a teclados virtuales mediante VisualViewport.
---

# Mobile Native Experience (React / Web)

> **Misión:** Garantizar que las interfaces web para dispositivos móviles alcancen la misma fluidez táctil, ergonomía y retroalimentación sensorial que una aplicación nativa iOS o Android.

---

## 1. Principios Fundamentales del Ecosistema Móvil Nativo

1. **La Ley del Pulgar (Thumb Zone Ergonomics):**
   - El 75% de las interacciones móviles ocurren con una sola mano. La zona natural de confort está en el tercio inferior de la pantalla.
   - Las acciones primarias (confirmar, pagar, filtrar) y la navegación principal deben vivir en la parte inferior (`bottom: 0`).
   - Los modales centrados flotantes de escritorio están estrictamente **prohibidos** en pantallas móviles; se reemplazan por **Bottom Sheets** deslizables hacia arriba.

2. **Física Táctil y Gestos (Spring Physics & Elasticity):**
   - En una app nativa, los elementos se mueven con el dedo del usuario con resistencia elástica (`damping` y `stiffness`), no con animaciones CSS lineales o de duración fija.
   - Todo panel o drawer arrastrable debe responder con `touch-action: pan-y` y snap points predecibles.

3. **Manejo Riguroso del Viewport y Safe Areas:**
   - Usar siempre unidades dinámicas `100dvh` (Dynamic Viewport Height) en lugar de `100vh` para evitar que la barra de direcciones de Safari o Chrome empuje la interfaz fuera de pantalla.
   - Respetar los bordes físicos del hardware (`notch`, `dynamic island`, barra de inicio de iOS) aplicando:
     ```css
     padding-top: env(safe-area-inset-top, 0px);
     padding-bottom: env(safe-area-inset-bottom, 0px);
     padding-left: env(safe-area-inset-left, 0px);
     padding-right: env(safe-area-inset-right, 0px);
     ```

4. **Retroalimentación Háptica (Micro-Vibraciones):**
   - Los botones clave, cambios de pestaña en la Tab Bar, pull-to-refresh y confirmaciones destructivas deben disparar pulsos de vibración suaves mediante la Web Vibration API (`navigator.vibrate`), con fallback silencioso cuando el dispositivo no lo soporte.

5. **Aislamiento de Scroll y Teclados Virtuales:**
   - Evitar el rebote accidental de la página padre al deslizar listas internas mediante `overscroll-behavior-y: contain`.
   - Adaptar los formularios dinámicamente cuando el teclado virtual aparece usando el evento `window.visualViewport.resize`.

---

## 2. Componentes Incluidos en esta Skill

| Componente / Hook | Ruta | Propósito |
| :--- | :--- | :--- |
| `BottomSheet` | `components/BottomSheet.jsx` | Modal deslizable inferior con snap points (30%, 60%, 90%), arrastre táctil y cierre por flick |
| `MobileTabBar` | `components/MobileTabBar.jsx` | Barra de navegación fija inferior con micro-animaciones, badges y safe-area insets |
| `PullToRefresh` | `components/PullToRefresh.jsx` | Contenedor con tracción elástica superior, spinner y recarga reactiva |
| `useHaptics` | `hooks/useHaptics.js` | Disparador de patrones hápticos estandarizados (`light`, `selection`, `success`, `error`) |
| `useVisualViewport` | `hooks/useVisualViewport.js` | Monitoreo del alto real visible ante la apertura/cierre de teclados virtuales en iOS/Android |
| `mobile-native.css` | `styles/mobile-native.css` | Reset táctil, curvas de resorte cúbico y utilidades de safe area |

---

## 3. Guía de Integración Rápida

### A. Bottom Sheet
```jsx
import { useState } from 'react';
import { BottomSheet } from './components/BottomSheet';

function PropertyFilterModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir Filtros</button>
      <BottomSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Filtrar Inmuebles"
        snapPoints={[0.4, 0.85]}
      >
        <div className="filter-content">
          {/* Contenido scrolleable con overscroll contenido */}
        </div>
      </BottomSheet>
    </>
  );
}
```

### B. Emulación Háptica en Toques
```jsx
import { useHaptics } from './hooks/useHaptics';

function LikeButton() {
  const { triggerHaptic } = useHaptics();

  const handleFavorite = () => {
    triggerHaptic('selection');
    // Guardar favorito
  };

  return <button onClick={handleFavorite}>❤️ Guardar</button>;
}
```

### C. Teclado Virtual en Formularios
```jsx
import { useVisualViewport } from './hooks/useVisualViewport';

function CheckoutSheet() {
  const { isKeyboardOpen, keyboardHeight } = useVisualViewport();

  return (
    <div style={{ paddingBottom: isKeyboardOpen ? `${keyboardHeight}px` : 'env(safe-area-inset-bottom)' }}>
      <input type="text" inputMode="numeric" placeholder="Cédula / RNC" />
      <button>Continuar</button>
    </div>
  );
}
```
