import React from 'react';
import { X } from 'lucide-react';

interface Shortcut {
  keys: string[];
  label: string;
  group: string;
}

const SHORTCUTS: Shortcut[] = [
  { group: 'Navigation', keys: ['⌘', 'K'], label: 'Open command palette' },
  { group: 'Navigation', keys: ['G', 'L'], label: 'Go to Daily Log' },
  { group: 'Navigation', keys: ['G', 'W'], label: 'Go to Weekly Review' },
  { group: 'Navigation', keys: ['G', 'D'], label: 'Go to Deliverables' },
  { group: 'Navigation', keys: ['G', 'R'], label: 'Go to Roadmap' },
  { group: 'Navigation', keys: ['G', 'M'], label: 'Go to Meetings' },
  { group: 'Navigation', keys: ['G', 'O'], label: 'Go to Overview' },
  { group: 'Actions', keys: ['C'], label: 'New log entry' },
  { group: 'Actions', keys: ['?'], label: 'Show keyboard shortcuts' },
  { group: 'Actions', keys: ['Esc'], label: 'Close any overlay' },
];

export const ShortcutsOverlay: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  if (!open) return null;

  const groups = Array.from(new Set(SHORTCUTS.map(s => s.group)));

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center pt-[10vh] px-4 bg-black/55 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-xl bg-apple-elevated/95 backdrop-blur-xl border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.55)] overflow-hidden fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
          <h2 className="text-[14px] font-semibold text-white">Keyboard shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1 text-apple-gray hover:text-white rounded transition-colors"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-5">
          {groups.map(group => (
            <div key={group}>
              <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-apple-tertiary mb-2">
                {group}
              </p>
              <div className="space-y-1">
                {SHORTCUTS.filter(s => s.group === group).map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="text-[13px] text-white/85">{s.label}</span>
                    <span className="inline-flex items-center gap-1">
                      {s.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded text-[11px] font-mono text-white/90 bg-white/[0.05] border border-white/[0.08]"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};