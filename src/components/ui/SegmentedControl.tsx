import { useEffect, useRef, useState, useLayoutEffect } from 'react';

interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * SegmentedControl — Notion/Apple-style pill indicator.
 *
 * The selected tab gets a smooth, floating white background that
 * tracks the active option. Implementation uses inline style +
 * a ref to each option button to compute the indicator position.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'sm',
  className = ''
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0
  });

  const recompute = () => {
    const container = containerRef.current;
    const btn = buttonRefs.current[value];
    if (!container || !btn) return;
    const cRect = container.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    setIndicator({
      left: bRect.left - cRect.left,
      width: bRect.width,
      opacity: 1
    });
  };

  useLayoutEffect(() => {
    recompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options.length]);

  useEffect(() => {
    const handler = () => recompute();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const sizeClasses =
    size === 'sm' ? 'text-[12px] py-1.5 px-3' : 'text-[13px] py-2 px-3.5';
  const containerHeight = size === 'sm' ? 'h-8' : 'h-10';

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center bg-white/[0.04] border border-white/[0.06] rounded-lg p-[3px] ${containerHeight} ${className}`}
    >
      {/* Sliding indicator */}
      <span
        aria-hidden="true"
        className="absolute top-[3px] bottom-[3px] rounded-md bg-white/[0.10] shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_0_0_1px_rgba(255,255,255,0.04)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none"
        style={{
          left: `${indicator.left}px`,
          width: `${indicator.width}px`,
          opacity: indicator.opacity
        }}
      />
      {options.map(opt => {
        const active = opt === value;
        return (
          <button
            key={opt}
            ref={el => {
              buttonRefs.current[opt] = el;
            }}
            type="button"
            onClick={() => onChange(opt)}
            className={`relative z-10 ${sizeClasses} rounded-md font-medium transition-colors duration-150 ${
              active ? 'text-white' : 'text-apple-secondary hover:text-white/85'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;