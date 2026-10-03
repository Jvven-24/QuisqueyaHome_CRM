import { useState, useEffect } from 'react';

/**
 * Hook reactivo para detectar el teclado virtual en dispositivos táctiles
 * usando el estándar Window Visual Viewport API.
 * Evita que modales, bottom sheets y campos de texto queden ocultos tras el teclado.
 */
export function useVisualViewport() {
  const [viewportInfo, setViewportInfo] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    offsetTop: 0,
    isKeyboardOpen: false,
    keyboardHeight: 0
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const vv = window.visualViewport;

    const handleResize = () => {
      const windowHeight = window.innerHeight;
      const currentHeight = vv.height;
      const heightDifference = windowHeight - currentHeight;

      // Un umbral de 140px identifica con precisión teclados en iOS y Android
      const keyboardOpen = heightDifference > 140;

      setViewportInfo({
        width: vv.width,
        height: vv.height,
        offsetTop: vv.offsetTop,
        isKeyboardOpen: keyboardOpen,
        keyboardHeight: keyboardOpen ? Math.max(0, heightDifference) : 0
      });
    };

    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);

    handleResize();

    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
    };
  }, []);

  return viewportInfo;
}
