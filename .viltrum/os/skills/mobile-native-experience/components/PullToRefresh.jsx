import React, { useState, useRef, useCallback } from 'react';
import { useHaptics } from '../hooks/useHaptics.js';

/**
 * Contenedor PullToRefresh que emula el refresco elástico nativo de iOS y Android.
 */
export function PullToRefresh({
  onRefresh,
  children,
  pullThreshold = 70,
  maxPull = 120
}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const containerRef = useRef(null);
  const { triggerHaptic } = useHaptics();

  const handleTouchStart = (e) => {
    // Solo permitir pull si el scroll está en el tope absoluto
    if (containerRef.current && containerRef.current.scrollTop === 0 && !isRefreshing) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };

  const handleTouchMove = (e) => {
    if (!isPullingRef.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startYRef.current;

    if (deltaY > 0) {
      // Curva logarítmica de resistencia elástica
      const dampedDistance = Math.min(maxPull, Math.pow(deltaY, 0.85) * 1.5);
      setPullDistance(dampedDistance);

      if (dampedDistance >= pullThreshold && pullDistance < pullThreshold) {
        triggerHaptic('light');
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current || isRefreshing) return;
    isPullingRef.current = false;

    if (pullDistance >= pullThreshold) {
      setIsRefreshing(true);
      triggerHaptic('medium');
      setPullDistance(pullThreshold);

      try {
        await onRefresh();
        triggerHaptic('success');
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      ref={containerRef}
      className="pull-refresh-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Indicador giratorio */}
      <div
        className="pull-refresh-indicator"
        style={{
          transform: `translateY(${pullDistance}px)`,
          opacity: pullDistance > 10 ? Math.min(1, pullDistance / pullThreshold) : 0
        }}
      >
        <div className="pull-refresh-spinner" />
      </div>

      {/* Contenido principal con desplazamiento elástico */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPullingRef.current ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)'
        }}
      >
        {children}
      </div>
    </div>
  );
}
