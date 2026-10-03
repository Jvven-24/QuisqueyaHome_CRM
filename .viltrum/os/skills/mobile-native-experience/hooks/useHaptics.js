import { useCallback } from 'react';

/**
 * Patrones predefinidos de vibración (en milisegundos)
 * Calibrados según los lineamientos de Apple HIG y Google Material Design
 */
const HAPTIC_PATTERNS = {
  light: 12,                  // Toque suave, toggle switch, scroll snap
  medium: 24,                 // Selección en selector o Tab Bar
  heavy: 45,                  // Confirmación de acción relevante
  selection: [10, 30, 10],    // Doble pulso para selecciones sutiles
  success: [15, 60, 25],      // Éxito en transacción o guardado
  warning: [30, 50, 30],      // Alerta no destructiva
  error: [40, 40, 40, 40, 60] // Error de validación o bloqueo
};

/**
 * Hook de emulación háptica para React Web.
 * Realiza verificación segura de compatibilidad en el dispositivo y el navegador.
 */
export function useHaptics() {
  const isSupported = typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator;

  const triggerHaptic = useCallback((type = 'light') => {
    if (!isSupported) return false;

    try {
      const pattern = HAPTIC_PATTERNS[type] ?? HAPTIC_PATTERNS.light;
      return navigator.vibrate(pattern);
    } catch {
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    triggerHaptic,
    hapticLight: () => triggerHaptic('light'),
    hapticMedium: () => triggerHaptic('medium'),
    hapticHeavy: () => triggerHaptic('heavy'),
    hapticSuccess: () => triggerHaptic('success'),
    hapticError: () => triggerHaptic('error'),
    hapticSelection: () => triggerHaptic('selection')
  };
}
