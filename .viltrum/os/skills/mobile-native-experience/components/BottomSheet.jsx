import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useHaptics } from '../hooks/useHaptics.js';

/**
 * Componente BottomSheet estilo iOS / Android con soporte táctil,
 * resistencia elástica y puntos de anclaje (Snap Points).
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [0.5, 0.9], // Alturas relativas permitidas (50%, 90%)
  defaultSnapIndex = 0,
  dismissThreshold = 120   // Píxeles de arrastre hacia abajo para cerrar
}) {
  const [currentSnapIndex, setCurrentSnapIndex] = useState(defaultSnapIndex);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const sheetRef = useRef(null);
  const { triggerHaptic } = useHaptics();

  // Bloquear scroll de la página padre mientras el sheet está abierto
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  // Manejar tecla Esc para cerrar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Iniciar arrastre táctil
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    currentYRef.current = touch.clientY;
    setIsDragging(true);
  };

  // Movimiento táctil con resistencia hacia arriba y arrastre directo hacia abajo
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    currentYRef.current = touch.clientY;
    const deltaY = currentYRef.current - startYRef.current;

    if (deltaY < 0) {
      // Resistencia elástica al intentar subir más allá del snap superior
      const rubberBand = -Math.pow(-deltaY, 0.75);
      setDragOffset(rubberBand);
    } else {
      // Arrastre hacia abajo para posible cierre
      setDragOffset(deltaY);
    }
  };

  // Finalizar arrastre y resolver si cierra o cambia de snap point
  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = currentYRef.current - startYRef.current;

    if (deltaY > dismissThreshold) {
      // Gesto de cierre rápido
      triggerHaptic('light');
      setDragOffset(0);
      onClose();
    } else if (deltaY < -60 && currentSnapIndex < snapPoints.length - 1) {
      // Expandir al siguiente snap superior
      triggerHaptic('selection');
      setCurrentSnapIndex((prev) => Math.min(prev + 1, snapPoints.length - 1));
      setDragOffset(0);
    } else if (deltaY > 60 && currentSnapIndex > 0) {
      // Colapsar al snap inferior
      triggerHaptic('selection');
      setCurrentSnapIndex((prev) => Math.max(prev - 1, 0));
      setDragOffset(0);
    } else {
      // Volver a la posición de reposo
      setDragOffset(0);
    }
  };

  if (!isOpen) return null;

  const currentHeightPercent = snapPoints[currentSnapIndex] * 100;

  return (
    <>
      {/* Fondo con desenfoque */}
      <div
        className={`bottom-sheet-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor del Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-heading"
        className="bottom-sheet-container open"
        style={{
          height: `${currentHeightPercent}dvh`,
          transform: `translateY(${Math.max(0, dragOffset)}px)`,
          transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1), height 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
        }}
      >
        {/* Barra de agarre táctil */}
        <div
          className="bottom-sheet-handle-area"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="bottom-sheet-handle-pill" />
        </div>

        {/* Encabezado */}
        {title && (
          <div className="bottom-sheet-header">
            <h2 id="bottom-sheet-heading" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                borderRadius: '50%',
                fontSize: '18px',
                lineHeight: 1
              }}
              aria-label="Cerrar panel"
            >
              ✕
            </button>
          </div>
        )}

        {/* Contenido scrolleable independiente */}
        <div className="bottom-sheet-content">
          {children}
        </div>
      </div>
    </>
  );
}
