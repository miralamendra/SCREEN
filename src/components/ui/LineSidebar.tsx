import React, { useRef, useCallback, useEffect } from 'react';
import './LineSidebar.css';

const FALLOFF_CURVES = {
  linear: (p: number) => p,
  smooth: (p: number) => p * p * (3 - 2 * p),
  sharp: (p: number) => p * p * p
};

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
  smoothing?: number;
}

export const LineSidebar: React.FC<LineSidebarProps> = ({
  items,
  activeId,
  onSelect,
  accentColor = '#A855F7',
  textColor = '#c4c4c4',
  markerColor = '#6c6c6c',
  showIndex = true,
  showMarker = true,
  proximityRadius = 100,
  maxShift = 30,
  falloff = 'smooth',
  markerLength = 60,
  markerGap = 0,
  tickScale = 0.5,
  scaleTick = true,
  itemGap = 20,
  fontSize = 14,
  smoothing = 100,
}) => {
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const targetsRef = useRef<number[]>([]);
  const currentRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);

  const activeIndex = items.findIndex(item => item.id === activeId);
  const activeRef = useRef<number>(activeIndex >= 0 ? activeIndex : -1);

  useEffect(() => {
    const idx = items.findIndex(item => item.id === activeId);
    activeRef.current = idx;
    targetsRef.current = items.map((_, i) => (i === idx ? 1 : 0));
    startLoop();
  }, [activeId, items]);

  const runFrame = useCallback(
    (now: number) => {
      const dt = Math.min((now - lastRef.current) / 1000, 0.05);
      lastRef.current = now;
      const tau = smoothing / 1000;
      const k = 1 - Math.exp(-dt / tau);

      let moving = false;
      const itemEls = itemRefs.current;

      for (let i = 0; i < itemEls.length; i++) {
        const el = itemEls[i];
        if (!el) continue;
        const isHoverTarget = targetsRef.current[i] || 0;
        const isActiveTarget = activeRef.current === i ? 1 : 0;
        const target = Math.max(isHoverTarget, isActiveTarget);

        const cur = currentRef.current[i] || 0;
        const next = cur + (target - cur) * k;
        const settled = Math.abs(target - next) < 0.0015;
        const value = settled ? target : next;

        currentRef.current[i] = value;
        el.style.setProperty('--effect', value.toFixed(4));
        if (!settled) moving = true;
      }

      if (moving) {
        rafRef.current = requestAnimationFrame(runFrame);
      } else {
        rafRef.current = null;
      }
    },
    [smoothing]
  );

  const startLoop = useCallback(() => {
    if (rafRef.current === null) {
      lastRef.current = performance.now();
      rafRef.current = requestAnimationFrame(runFrame);
    }
  }, [runFrame]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLUListElement>) => {
      const list = listRef.current;
      if (!list) return;
      const rect = list.getBoundingClientRect();
      const pointerY = e.clientY - rect.top;

      const curveFn = FALLOFF_CURVES[falloff];

      const itemEls = itemRefs.current;
      for (let i = 0; i < itemEls.length; i++) {
        const el = itemEls[i];
        if (!el) continue;
        const elTop = el.offsetTop;
        const elHeight = el.offsetHeight;
        const center = elTop + elHeight / 2;
        const distance = Math.abs(pointerY - center);
        const p = Math.max(0, 1 - distance / proximityRadius);
        targetsRef.current[i] = curveFn(p);
      }
      startLoop();
    },
    [falloff, proximityRadius, startLoop]
  );

  const handlePointerLeave = useCallback(() => {
    targetsRef.current = targetsRef.current.map(() => 0);
    startLoop();
  }, [startLoop]);

  useEffect(() => {
    targetsRef.current = items.map((_, i) => (activeRef.current === i ? 1 : 0));
    currentRef.current = items.map((_, i) => (activeRef.current === i ? 1 : 0));
    startLoop();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [items, startLoop]);

  const cssVars = {
    '--accent-color': accentColor,
    '--text-color': textColor,
    '--marker-color': markerColor,
    '--marker-length': `${markerLength}px`,
    '--marker-gap': `${markerGap}px`,
    '--tick-scale': tickScale,
    '--max-shift': `${maxShift}px`,
    '--item-gap': `${itemGap}px`,
    '--font-size': `${fontSize}px`,
    '--smoothing': `${smoothing}ms`,
  } as React.CSSProperties;

  return (
    <ul
      ref={listRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`line-sidebar ${showMarker ? 'line-sidebar--markers' : ''} ${scaleTick ? 'line-sidebar--scale-tick' : ''} w-full py-2`}
      style={cssVars}
    >
      {items.map((item, index) => {
        const isActive = activeId === item.id;
        const Icon = item.icon;
        return (
          <li
            key={item.id}
            ref={(el) => { itemRefs.current[index] = el; }}
            className="line-sidebar__item"
            aria-current={isActive ? 'true' : undefined}
            onClick={() => onSelect?.(item.id, index)}
          >
            {showMarker && <span className="line-sidebar__marker" aria-hidden="true" />}
            <span className="line-sidebar__label">
              {showIndex && (
                <span className="line-sidebar__index">
                  {String(index + 1).padStart(2, '0')}
                </span>
              )}
              {Icon && <Icon size={14} strokeWidth={isActive ? 2 : 1.5} className="line-sidebar__icon shrink-0 mr-2.5" />}
              <span className="line-sidebar__text">{item.label}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export default LineSidebar;
