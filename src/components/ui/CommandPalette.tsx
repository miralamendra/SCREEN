import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  Search, FileText, CheckSquare, Milestone, Compass, Calendar,
  LayoutDashboard, Plus, ArrowRight, Hash, User, Sparkles
} from 'lucide-react';

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenNewLog: () => void;
  onOpenNewMeeting: () => void;
}

interface PaletteItem {
  id: string;
  group: 'Pages' | 'Actions' | 'Recent';
  label: string;
  hint?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  shortcut?: string;
  run: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open, onClose, onOpenNewLog, onOpenNewMeeting
}) => {
  const navigate = useNavigate();
  const { setRole, data, role } = useWorkspace();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // Slight delay so the input is mounted
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  // Build the items list
  const items = useMemo<PaletteItem[]>(() => {
    const go = (path: string) => () => {
      onClose();
      navigate(path);
    };

    const pages: PaletteItem[] = [
      { id: 'p-log', group: 'Pages', label: 'Daily Log', icon: FileText, run: go('/workspace/log') },
      { id: 'p-review', group: 'Pages', label: 'Weekly Review', icon: CheckSquare, run: go('/workspace/review') },
      { id: 'p-deliverables', group: 'Pages', label: 'Deliverables', icon: Milestone, run: go('/workspace/deliverables') },
      { id: 'p-roadmap', group: 'Pages', label: 'Roadmap', icon: Compass, run: go('/workspace/roadmap') },
      { id: 'p-meetings', group: 'Pages', label: 'Meetings', icon: Calendar, run: go('/workspace/meetings') },
    ];

    if (role === 'supervisor') {
      pages.unshift({
        id: 'p-overview', group: 'Pages', label: 'Overview', icon: LayoutDashboard, run: go('/workspace/overview')
      });
    }

    // Dynamic items: deliverables
    data.deliverables.forEach(d => {
      if (d.owner === (role === 'shalini' ? 'Shalini' : role === 'miral' ? 'Miral' : 'Miral') ||
          role === 'supervisor') {
        pages.push({
          id: `d-${d.id}`,
          group: 'Pages',
          label: d.name,
          hint: `${d.quarter} · ${d.status}`,
          icon: Hash,
          run: go('/workspace/deliverables')
        });
      }
    });

    // Dynamic items: meetings (upcoming only)
    const now = Date.now();
    data.meetings
      .filter(m => new Date(m.date).getTime() >= now - 86400000)
      .slice(0, 6)
      .forEach(m => {
        pages.push({
          id: `m-${m.id}`,
          group: 'Pages',
          label: m.title,
          hint: new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          icon: Hash,
          run: go('/workspace/meetings')
        });
      });

    // Actions
    const actions: PaletteItem[] = [
      {
        id: 'a-newlog', group: 'Actions', label: 'New log entry', hint: 'Open Daily Log form',
        icon: Plus, shortcut: 'C', run: () => { onClose(); onOpenNewLog(); }
      },
      {
        id: 'a-newmeet', group: 'Actions', label: 'New meeting', hint: 'Open Meetings form',
        icon: Plus, run: () => { onClose(); onOpenNewMeeting(); }
      },
      {
        id: 'a-shalini', group: 'Actions', label: 'Switch to Study 1 - GenAI',
        icon: User, run: () => { setRole('shalini'); onClose(); navigate('/workspace/log'); }
      },
      {
        id: 'a-miral', group: 'Actions', label: 'Switch to Study 2 - Gamification',
        icon: User, run: () => { setRole('miral'); onClose(); navigate('/workspace/log'); }
      },
      {
        id: 'a-supervisor', group: 'Actions', label: 'Switch to Supervisor',
        icon: User, run: () => { setRole('supervisor'); onClose(); navigate('/workspace/overview'); }
      },
    ];

    return [...pages, ...actions];
  }, [data, role, navigate, onClose, onOpenNewLog, onOpenNewMeeting, setRole]);

  // Filter by query
  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(i => i.label.toLowerCase().includes(q) || (i.hint?.toLowerCase().includes(q)));
  }, [items, query]);

  // Group filtered items
  const grouped = useMemo(() => {
    const out: Record<string, PaletteItem[]> = { Pages: [], Actions: [], Recent: [] };
    filtered.forEach(i => { out[i.group].push(i); });
    return out;
  }, [filtered]);

  // Flatten for keyboard nav
  const flat = useMemo(() => {
    const list: PaletteItem[] = [];
    (['Pages', 'Actions', 'Recent'] as const).forEach(g => {
      grouped[g]?.forEach(i => list.push(i));
    });
    return list;
  }, [grouped]);

  // Keyboard handling
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => (i + 1) % Math.max(flat.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => (i - 1 + flat.length) % Math.max(flat.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = flat[activeIndex];
        if (item) item.run();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, flat, activeIndex, onClose]);

  // Keep active item in view
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center pt-[12vh] px-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] rounded-xl bg-apple-elevated/95 backdrop-blur-xl border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.55)] overflow-hidden fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <Search size={15} className="text-apple-gray shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, deliverables, actions…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-[14.5px] text-white placeholder:text-apple-tertiary"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-mono text-apple-gray bg-white/[0.04] border border-white/[0.06]">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {flat.length === 0 ? (
            <div className="px-4 py-10 text-center text-[12.5px] text-apple-tertiary">
              No results for "{query}"
            </div>
          ) : (
            (['Pages', 'Actions', 'Recent'] as const).map(groupName => {
              const list = grouped[groupName];
              if (!list || list.length === 0) return null;
              return (
                <div key={groupName} className="mb-1">
                  <div className="px-4 py-1.5 text-[10px] font-medium tracking-[0.18em] uppercase text-apple-tertiary">
                    {groupName}
                  </div>
                  {list.map(item => {
                    const flatIndex = flat.indexOf(item);
                    const isActive = flatIndex === activeIndex;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={item.run}
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2 mx-1 rounded-md text-[13px] text-left transition-colors ${
                          isActive
                            ? 'bg-white/[0.08] text-white'
                            : 'text-white/80 hover:bg-white/[0.04]'
                        }`}
                      >
                        <Icon size={14} className="text-apple-gray shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.hint && (
                          <span className="text-[11.5px] text-apple-tertiary truncate max-w-[140px]">
                            {item.hint}
                          </span>
                        )}
                        {item.shortcut && (
                          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-apple-gray bg-white/[0.04] border border-white/[0.06]">
                            {item.shortcut}
                          </kbd>
                        )}
                        {isActive && (
                          <ArrowRight size={12} className="text-apple-gray shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/[0.06] text-[10.5px] text-apple-tertiary">
          <span className="inline-flex items-center gap-1.5">
            <kbd className="px-1 py-0.5 rounded font-mono bg-white/[0.04] border border-white/[0.06]">↑↓</kbd>
            navigate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="px-1 py-0.5 rounded font-mono bg-white/[0.04] border border-white/[0.06]">↵</kbd>
            open
          </span>
          <span className="inline-flex items-center gap-1.5 ml-auto">
            <Sparkles size={10} />
            Command palette
          </span>
        </div>
      </div>
    </div>
  );
};