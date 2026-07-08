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
  /** Time-constant for the hover-driven effect (snappy). Default 90ms. */
  hoverSmoothing?: number;
  /** Time-constant for the active-item transition (smooth glide). Default 750ms. */
  activeSmoothing?: number;
  /**
   * Backward-compat alias. If set and the new props are not, this is used as both.
   * @deprecated prefer hoverSmoothing/activeSmoothing.
   */
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
  hoverSmoothing,
  activeSmoothing,
  smoothing,
}) => {
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  // Per-item target from hover (0..1) and current rendered value (0..1)
  const hoverTargetRef = useRef<number[]>([]);
  const currentRef = useRef<number[]>([]);
  // Per-item active value tracking — uses its own smoothing so click feels smooth
  // while hover feels snappy.
  const activeRef = useRef<number[]>([]);
  const activeTargetRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);

  const activeIndex = items.findIndex(item => item.id === activeId);

  // Resolve smoothing values with sensible fallbacks
  const hoverTau = (hoverSmoothing ?? smoothing ?? 90) / 1000;
  const activeTau = (activeSmoothing ?? smoothing ?? 750) / 1000;

  // When activeId or items change, update the active target and snap current to follow
  // the previous active exactly (so the new active glides in from where the old one was).
  const lastActiveIdRef = useRef<string | undefined>(activeId);
  useEffect(() => {
    if (lastActiveIdRef.current !== activeId) {
      // Carry over the previous active's value into the new active's current value,
      // so the marker slides from the old location to the new one smoothly.
      const prevIdx = items.findIndex(item => item.id === lastActiveIdRef.current);
      const newIdx = items.findIndex(item => item.id === activeId);
      if (prevIdx >= 0 && newIdx >= 0 && currentRef.current[prevIdx] !== undefined) {
        currentRef.current[newIdx] = currentRef.current[prevIdx];
      }
      lastActiveIdRef.current = activeId;
    }
    // Reset the active target to 1 for the active item, 0 for others
    activeTargetRef.current = items.map((_, i) => (i === activeIndex ? 1 : 0));
    // Initialize current active value if not set
    if (activeRef.current.length !== items.length) {
      activeRef.current = items.map((_, i) => (i === activeIndex ? 1 : 0));
    }
  }, [activeId, items, activeIndex]);

  const runFrame = useCallback(
    (now: number) => {
      const dt = Math.min((now - lastRef.current) / 1000, 0.05);
      lastRef.current = now;

      const kHover = 1 - Math.exp(-dt / hoverTau);
      const kActive = 1 - Math.exp(-dt / activeTau);

      let moving = false;
      const itemEls = itemRefs.current;

      for (let i = 0; i < itemEls.length; i++) {
        const el = itemEls[i];
        if (!el) continue;

        // Active value glides on its own slow track
        const activeTarget = activeTargetRef.current[i] ?? 0;
        const activeCur = activeRef.current[i] ?? 0;
        const activeNext = activeCur + (activeTarget - activeCur) * kActive;
        const activeSettled = Math.abs(activeTarget - activeNext) < 0.0008;
        const activeValue = activeSettled ? activeTarget : activeNext;
        activeRef.current[i] = activeValue;
        if (!activeSettled) moving = true;

        // Hover value glides on its own snappy track
        const hoverTarget = hoverTargetRef.current[i] ?? 0;
        const hoverCur = currentRef.current[i] ?? 0;
        const hoverNext = hoverCur + (hoverTarget - hoverCur) * kHover;
        const hoverSettled = Math.abs(hoverTarget - hoverNext) < 0.0008;
        const hoverValue = hoverSettled ? hoverTarget : hoverNext;
        currentRef.current[i] = hoverValue;
        if (!hoverSettled) moving = true;

        // Combine: active wins over hover (it owns the slot when active)
        const combined = Math.max(activeValue, hoverValue);
        el.style.setProperty('--effect', combined.toFixed(4));
      }

      if (moving) {
        rafRef.current = requestAnimationFrame(runFrame);
      } else {
        rafRef.current = null;
      }
    },
    [hoverTau, activeTau]
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
        hoverTargetRef.current[i] = curveFn(p);
      }
      startLoop();
    },
    [falloff, proximityRadius, startLoop]
  );

  const handlePointerLeave = useCallback(() => {
    hoverTargetRef.current = hoverTargetRef.current.map(() => 0);
    startLoop();
  }, [startLoop]);

  useEffect(() => {
    // Initialize target/current arrays
    if (hoverTargetRef.current.length !== items.length) {
      hoverTargetRef.current = items.map(() => 0);
    }
    if (currentRef.current.length !== items.length) {
      currentRef.current = items.map(() => 0);
    }
    if (activeRef.current.length !== items.length) {
      activeRef.current = items.map((_, i) => (i === activeIndex ? 1 : 0));
    }
    if (activeTargetRef.current.length !== items.length) {
      activeTargetRef.current = items.map((_, i) => (i === activeIndex ? 1 : 0));
    }
    startLoop();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [items, startLoop, activeIndex]);

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
    // Used by CSS for the hover-driven label transition only.
    '--smoothing': `${Math.round(hoverTau * 1000)}ms`,
    // Used for the active-driven transform (smooth glide on click).
    '--active-smoothing': `${Math.round(activeTau * 1000)}ms`,
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