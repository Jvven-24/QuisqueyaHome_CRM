import React from 'react';
import { useHaptics } from '../hooks/useHaptics.js';

/**
 * Barra de navegación inferior móvil anclada a la zona ergonómica del pulgar (Thumb Zone).
 * Respeta el notch/barra inferior de iOS mediante env(safe-area-inset-bottom).
 */
export function MobileTabBar({
  tabs = [],
  activeTabId,
  onTabChange
}) {
  const { triggerHaptic } = useHaptics();

  const handleSelect = (id) => {
    if (id !== activeTabId) {
      triggerHaptic('light');
      onTabChange?.(id);
    }
  };

  return (
    <nav className="mobile-tab-bar" aria-label="Navegación principal inferior">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const IconComponent = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            className={`mobile-tab-item ${isActive ? 'active' : ''}`}
            onClick={() => handleSelect(tab.id)}
            aria-selected={isActive}
            aria-label={tab.label}
          >
            {IconComponent && (
              <div className="mobile-tab-icon">
                {typeof IconComponent === 'function' ? <IconComponent active={isActive} /> : IconComponent}
              </div>
            )}
            <span>{tab.label}</span>
            {Boolean(tab.badge) && (
              <span className="mobile-tab-badge" aria-label={`${tab.badge} notificaciones`}>
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
