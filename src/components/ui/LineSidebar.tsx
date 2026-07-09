import React from 'react';
import './LineSidebar.css';

export interface LineSidebarItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

interface LineSidebarProps {
  items: LineSidebarItem[];
  activeId?: string;
  onSelect?: (id: string, index: number) => void;
  accentColor?: string;
  textColor?: string;
  markerColor?: string;
  showIndex?: boolean;
  showMarker?: boolean;
  proximityRadius?: number;
  maxShift?: number;
  falloff?: 'linear' | 'smooth' | 'sharp';
  markerLength?: number;
  markerGap?: number;
  tickScale?: number;
  scaleTick?: boolean;
  itemGap?: number;
  fontSize?: number;
  hoverSmoothing?: number;
  activeSmoothing?: number;
  smoothing?: number;
}

export const LineSidebar: React.FC<LineSidebarProps> = ({
  items,
  activeId,
  onSelect,
  accentColor = '#22c55e',
  textColor = '#c4c4c4',
  markerColor = '#6c6c6c',
  showIndex = true,
  showMarker = true,
  itemGap = 4,
  fontSize = 13,
}) => {
  const cssVars = {
    '--accent-color': accentColor,
    '--text-color': textColor,
    '--marker-color': markerColor,
    '--item-gap': `${itemGap}px`,
    '--font-size': `${fontSize}px`,
  } as React.CSSProperties;

  return (
    <ul
      className={`line-sidebar ${showMarker ? 'line-sidebar--markers' : ''} w-full py-2`}
      style={cssVars}
    >
      {items.map((item, index) => {
        const isActive = activeId === item.id;
        const Icon = item.icon;
        return (
          <li
            key={item.id}
            className="line-sidebar__item"
            data-active={isActive ? 'true' : undefined}
            onClick={() => onSelect?.(item.id, index)}
          >
            <span className="line-sidebar__label">
              {showIndex && (
                <span className="line-sidebar__index">
                  {String(index + 1).padStart(2, '0')}
                </span>
              )}
              {Icon && (
                <Icon
                  size={14}
                  strokeWidth={isActive ? 2 : 1.5}
                  className="line-sidebar__icon shrink-0 mr-2"
                />
              )}
              <span className="line-sidebar__text">{item.label}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export default LineSidebar;
