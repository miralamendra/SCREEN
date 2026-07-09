import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Plus, Trash2, ExternalLink, Calendar, FileText, Pencil, X, Check, ChevronRight } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { ManageCategoriesModal } from '../ui/ManageCategoriesModal';
import { SegmentedControl } from '../ui/SegmentedControl';
import { useLocation } from 'react-router-dom';

const localDateStr = (d: Date = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const todayStr = () => localDateStr();

const isToday = (d: string) => d === todayStr();
const isYesterday = (d: string) => {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return d === localDateStr(y);
};
const getWeekRangeLabel = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setDate(date.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  
  // ISO week computation
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return {
    id: `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`,
    label: `Week ${weekNum} (${startLabel} - ${endLabel})`
  };
};

const renderFormattedDescription = (text: string) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  let currentListType: 'ul' | 'ol' | null = null;
  let currentListItems: string[] = [];

  const flushList = (key: string | number) => {
    if (currentListItems.length === 0) return;
    if (currentListType === 'ul') {
      elements.push(
        <ul key={`ul-${key}`} className="list-disc pl-5 my-1 space-y-0.5 text-[13px] text-white/90 font-medium leading-snug">
          {currentListItems.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      );
    } else if (currentListType === 'ol') {
      elements.push(
        <ol key={`ol-${key}`} className="list-decimal pl-5 my-1 space-y-0.5 text-[13px] text-white/90 font-medium leading-snug">
          {currentListItems.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ol>
      );
    }
    currentListItems = [];
    currentListType = null;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const isBullet = /^[*-]\s+(.*)/.exec(trimmed);
    const isNumbered = /^\d+[\.)]\s+(.*)/.exec(trimmed);

    if (isBullet) {
      if (currentListType !== 'ul') {
        flushList(idx);
        currentListType = 'ul';
      }
      currentListItems.push(isBullet[1]);
    } else if (isNumbered) {
      if (currentListType !== 'ol') {
        flushList(idx);
        currentListType = 'ol';
      }
      currentListItems.push(isNumbered[1]);
    } else {
      flushList(idx);
      if (trimmed.length > 0) {
        elements.push(
          <p key={`p-${idx}`} className="text-[13px] text-white/90 font-medium leading-snug my-0.5 break-words whitespace-pre-wrap">
            {line}
          </p>
        );
      } else {
        elements.push(<div key={`br-${idx}`} className="h-1" />);
      }
    }
  });

  flushList(lines.length);
  return elements;
};

interface DailyLogProps {
  newEntryTrigger?: number;
}

export const DailyLog: React.FC<DailyLogProps> = ({ newEntryTrigger }) => {
  const { role, data, addDailyLog, deleteDailyLog, updateDailyLog } = useWorkspace();
  const { push } = useToast();
  const { dailyLogs, categories } = data;
  const location = useLocation();

  useEffect(() => {
    if (location.state?.highlightLogId) {
      const logId = location.state.highlightLogId;
      setTimeout(() => {
        const el = document.getElementById(`log-row-${logId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('bg-emerald-500/10', 'border-emerald-500/30', 'shadow-[0_0_12px_rgba(16,185,129,0.15)]');
          setTimeout(() => {
            el.classList.remove('bg-emerald-500/10', 'border-emerald-500/30', 'shadow-[0_0_12px_rgba(16,185,129,0.15)]');
          }, 2000);
        }
      }, 150);
    }
  }, [location.state]);

  const [isComposing, setIsComposing] = useState(false);
  const [activeTab, setActiveTab] = useState<'Daily' | 'Weekly' | 'Monthly' | 'All Time'>('Daily');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const toggleSection = (key: string) => setCollapsedSections(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [link, setLink] = useState('');
  const [takeaway, setTakeaway] = useState('');
  const [date, setDate] = useState(todayStr());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editTakeaway, setEditTakeaway] = useState('');
  const [editDate, setEditDate] = useState('');
  const promptRef = useRef<HTMLButtonElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [description]);

  useEffect(() => {
    if (editTextareaRef.current) {
      editTextareaRef.current.style.height = 'auto';
      editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
    }
  }, [editDescription]);

  const activePerson = role === 'shalini' ? 'Shalini' : 'Miral';
  const myLogs = useMemo(
    () => {
      if (role === 'supervisor') return dailyLogs;
      return dailyLogs.filter(log => log.person === activePerson);
    },
    [dailyLogs, activePerson, role]
  );

  const weeklyGrouped = useMemo(() => {
    const acc: Record<string, { label: string; dateVal: string; items: typeof myLogs }> = {};
    myLogs.forEach(log => {
      const { id, label } = getWeekRangeLabel(log.date);
      if (!acc[id]) {
        acc[id] = { label, dateVal: log.date, items: [] };
      }
      acc[id].items.push(log);
    });
    return acc;
  }, [myLogs]);

  const sortedWeekKeys = useMemo(() => Object.keys(weeklyGrouped).sort((a, b) => b.localeCompare(a)), [weeklyGrouped]);

  const monthlyGrouped = useMemo(() => {
    const acc: Record<string, { label: string; items: typeof myLogs }> = {};
    myLogs.forEach(log => {
      const d = new Date(log.date + 'T00:00:00');
      const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      if (!acc[id]) {
        acc[id] = { label, items: [] };
      }
      acc[id].items.push(log);
    });
    return acc;
  }, [myLogs]);

  const sortedMonthKeys = useMemo(() => Object.keys(monthlyGrouped).sort((a, b) => b.localeCompare(a)), [monthlyGrouped]);

  useEffect(() => {
    if (newEntryTrigger && newEntryTrigger > 0) {
      setIsComposing(true);
      setTimeout(() => {
        const ta = document.getElementById('dailylog-description') as HTMLTextAreaElement | null;
        ta?.focus();
      }, 80);
    }
  }, [newEntryTrigger]);

  const reset = () => {
    setDescription('');
    setLink('');
    setTakeaway('');
    setDate(todayStr());
    setIsComposing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    addDailyLog({
      date,
      person: activePerson,
      category,
      description: description.trim(),
      link: link.trim() || undefined,
      takeaway: takeaway.trim() || undefined
    });

    push('Log entry saved');
    reset();
  };

  const handleDelete = (id: string) => {
    if (editingId === id) {
      cancelEdit();
    }
    deleteDailyLog(id);
    push('Log entry deleted', 'info');
  };

  const startEdit = (log: (typeof myLogs)[0]) => {
    setEditingId(log.id);
    setEditDescription(log.description);
    setEditCategory(log.category);
    setEditLink(log.link || '');
    setEditTakeaway(log.takeaway || '');
    setEditDate(log.date);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDescription('');
    setEditCategory('');
    setEditLink('');
    setEditTakeaway('');
    setEditDate('');
  };

  const saveEdit = (id: string) => {
    if (!editDescription.trim()) {
      push('Description cannot be empty', 'error');
      return;
    }
    updateDailyLog(id, {
      date: editDate,
      category: editCategory,
      description: editDescription.trim(),
      link: editLink.trim() || undefined,
      takeaway: editTakeaway.trim() || undefined
    });
    push('Log entry updated');
    cancelEdit();
  };

  const groupedLogs = useMemo(() => {
    const acc: Record<string, typeof myLogs> = {};
    myLogs.forEach(log => {
      if (!acc[log.date]) acc[log.date] = [];
      acc[log.date].push(log);
    });
    return acc;
  }, [myLogs]);

  const sortedDates = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));

  const todayDate = todayStr();
  const todayLogs = myLogs.filter(l => l.date === todayDate);
  const todayCount = todayLogs.length;

  const renderLogCard = (log: (typeof myLogs)[0]) => {
    const isEditing = editingId === log.id;
    return (
      <div
        key={log.id}
        id={`log-row-${log.id}`}
        className="group relative py-1.5 border-b border-apple-border/50 last:border-0 transition-colors"
      >
        {!isEditing ? (
          <div className="flex items-start gap-3 w-full">
            <div 
              className="w-1 h-1 rounded-full mt-2 shrink-0" 
              style={{ backgroundColor: categories.find(c => c.name === log.category)?.color || '#9ca3af' }} 
            />
            <div className="flex-1 min-w-0">
              <div className="space-y-0">
                {renderFormattedDescription(log.description)}
              </div>
              {log.takeaway && (
                <div className="mt-1 pl-2.5 border-l-2 border-apple-border/50">
                  <p className="text-[11px] text-white/60 leading-snug italic">
                    {log.takeaway}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[10px] text-white/20 tabular-nums">
                  {log.date}
                </span>
                <span
                  className="text-[10px] font-medium tracking-wide"
                  style={{ color: (categories.find(c => c.name === log.category)?.color || '#9ca3af') + 'aa' }}
                >
                  {log.category}
                </span>
                {role === 'supervisor' && (
                  <span className="text-[10px] text-white/20">
                    {log.person}
                  </span>
                )}
                {log.link && (
                  <a
                    href={log.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-apple-secondary hover:text-white p-0.5 rounded hover:bg-apple-elevated transition-colors"
                    title="Open link"
                  >
                    <ExternalLink size={10} />
                  </a>
                )}
                {role !== 'supervisor' && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                    <button
                      onClick={() => startEdit(log)}
                      className="p-1 text-apple-tertiary hover:text-emerald-400/90 rounded hover:bg-apple-elevated transition-colors"
                      aria-label="Edit log"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="p-1 text-apple-tertiary hover:text-red-400/90 rounded hover:bg-apple-elevated transition-colors"
                      aria-label="Delete log"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 fade-in">
            <div className="flex items-center gap-2 pb-1">
              <span className="w-1.5 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[12px] font-medium tracking-[0.18em] uppercase text-white/85">
                Editing entry
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[13px] text-white/95 focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-2">
                  Category
                </label>
                <select
                  required
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[13px] text-white/95 focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name} className="bg-apple-surface text-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-2">
                Description
              </label>
              <textarea
                ref={editTextareaRef}
                required
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                style={{ minHeight: '80px', height: 'auto' }}
                className="w-full px-4 py-3 bg-apple-base border border-apple-border rounded-lg text-[13px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] transition-colors outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-2">
                  Reference Link <span className="text-apple-tertiary font-normal normal-case tracking-normal">· optional</span>
                </label>
                <input
                  type="url"
                  value={editLink}
                  onChange={e => setEditLink(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[13px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-2">
                  Takeaway <span className="text-apple-tertiary font-normal normal-case tracking-normal">· optional</span>
                </label>
                <input
                  type="text"
                  value={editTakeaway}
                  onChange={e => setEditTakeaway(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[13px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.04]">
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center gap-2 px-3 py-2 text-[12px] text-apple-secondary hover:text-white/85 rounded-md hover:bg-white/[0.04] transition-colors"
              >
                <X size={12} />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={() => saveEdit(log.id)}
                disabled={!editDescription.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-apple-base rounded-md text-[12px] font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={12} />
                <span>Save changes</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fade-in space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[12px] font-medium tracking-[0.18em] uppercase text-apple-secondary mb-2">
            Journal
          </p>
          <h1 className="text-[36px] sm:text-[36px] font-semibold tracking-[-0.025em] text-white leading-none">
            Daily Log
          </h1>
          <p className="text-[13px] text-apple-gray mt-2.5 max-w-md">
            Record what you worked on. Keep it small, keep it daily.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Today stats badge */}
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white/[0.04] border border-white/[0.06] text-[12px] text-apple-secondary font-medium">
            <span>Today</span>
            <span className="text-white font-mono font-semibold tabular-nums bg-white/[0.06] px-2 py-0.2 rounded border border-white/5">{todayCount}</span>
          </div>

          {/* All time stats badge */}
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white/[0.04] border border-white/[0.06] text-[12px] text-apple-secondary font-medium">
            <span>All-time</span>
            <span className="text-white font-mono font-semibold tabular-nums bg-white/[0.06] px-2 py-0.2 rounded border border-white/5">{myLogs.length}</span>
          </div>

          {/* Date badge */}
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Calendar size={12} />
            <span className="text-[12px] font-mono tabular-nums font-semibold">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {role !== 'supervisor' && (!isComposing ? (
        <button
          ref={promptRef}
          onClick={() => setIsComposing(true)}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border border-apple-border bg-apple-surface hover:bg-apple-elevated transition-colors text-[13px] text-apple-gray hover:text-white/85 group"
        >
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-apple-elevated border border-apple-border transition-colors">
            <Plus size={13} className="group-hover:text-white transition-colors" />
          </span>
          <span>Add a log entry - what did you work on today?</span>
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[12px] font-mono bg-white/[0.04] border border-white/[0.06] ml-auto">
            C
          </kbd>
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-apple-border bg-apple-surface p-4 sm:p-5 space-y-4 fade-in"
        >
          <div className="flex items-center gap-2 pb-1">
            <span className="w-1.5 h-2 rounded-full bg-white animate-pulse" />
            <p className="text-[12px] font-medium tracking-[0.18em] uppercase text-white/85">
              New entry
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-2">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[13px] text-white/95 focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[12px] font-semibold tracking-[0.08em] uppercase text-white/80">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setIsManageCategoriesOpen(true)}
                  className="text-[12px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Manage categories
                </button>
              </div>
              <select
                required
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[13px] text-white/95 focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name} className="bg-apple-surface text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-2">
                Description
              </label>
              <textarea
                id="dailylog-description"
                ref={textareaRef}
                required
                placeholder="What did you accomplish?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ minHeight: '80px', height: 'auto' }}
                className="w-full px-4 py-3 bg-apple-base border border-apple-border rounded-lg text-[13px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] transition-colors outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-2">
                  Reference Link <span className="text-apple-tertiary font-normal normal-case tracking-normal">· optional</span>
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/artifact-or-ref"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[13px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-2">
                  Takeaway <span className="text-apple-tertiary font-normal normal-case tracking-normal">· optional</span>
                </label>
                <input
                  type="text"
                  placeholder="One-line insight from this work"
                  value={takeaway}
                  onChange={e => setTakeaway(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[13px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.04]">
              <button
                type="button"
                onClick={reset}
                className="px-3 py-2 text-[12px] text-apple-secondary hover:text-white/85 rounded-md hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!description.trim()}
                className="px-4 py-2 bg-white text-apple-base rounded-md text-[12px] font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save entry
              </button>
            </div>
          </div>
        </form>
      ))}

      {myLogs.length === 0 ? (
        <div className="mt-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3">
            <FileText size={18} className="text-apple-gray" />
          </div>
          <p className="text-[13px] text-white/90 font-medium">No logs recorded yet</p>
          <p className="text-[12px] text-apple-secondary mt-1 max-w-xs">
            A daily log is your research journal. Start with one line - what did you work on today?
          </p>
        </div>
      ) : (
        <div className="space-y-6 mt-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5 flex-wrap gap-2">
            <h2 className="text-[18px] font-semibold text-white tracking-tight flex items-center gap-2">
              <FileText size={16} className="text-apple-secondary" />
              <span>Research Log</span>
            </h2>
            <SegmentedControl<'Daily' | 'Weekly' | 'Monthly' | 'All Time'>
              options={['Daily', 'Weekly', 'Monthly', 'All Time'] as const}
              value={activeTab}
              onChange={setActiveTab}
              size="sm"
            />
          </div>

          <div className="mt-4 space-y-6">
            {activeTab === 'Daily' && (
              <div className="space-y-0">
                {sortedDates.map(dateKey => {
                  const isT = isToday(dateKey);
                  const isY = isYesterday(dateKey);
                  const dateObj = new Date(dateKey + 'T00:00:00');
                  const dayLabel = isT
                    ? 'Today'
                    : isY
                    ? 'Yesterday'
                    : dateObj.toLocaleDateString(undefined, { weekday: 'long' });
                  const dateLabel = dateObj.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  const isCollapsed = collapsedSections.has(dateKey);
                  return (
                    <section key={dateKey}>
                      <button
                        onClick={() => toggleSection(dateKey)}
                        className="w-full flex items-center gap-3 pt-6 pb-1.5 mb-1 group cursor-pointer"
                      >
                        <ChevronRight
                          size={10}
                          className="text-apple-tertiary/50 shrink-0 transition-transform duration-200"
                          style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}
                        />
                        <span className={`text-[11px] font-semibold tracking-[0.08em] uppercase shrink-0 ${
                          isT ? 'text-emerald-400' : 'text-white/40'
                        }`}>
                          {dayLabel}
                        </span>
                        <span className="text-[10px] font-mono text-white/20 tabular-nums shrink-0">
                          {dateLabel}
                        </span>
                        <div className="flex-1 h-px bg-white/[0.05]" />
                        <span className="text-[10px] font-mono text-white/20 tabular-nums shrink-0">
                          {groupedLogs[dateKey].length}
                        </span>
                      </button>
                      {!isCollapsed && (
                        <div className="space-y-0 mb-2">
                          {groupedLogs[dateKey].map(log => renderLogCard(log))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}

            {activeTab === 'Weekly' && (
              <div className="space-y-0">
                {sortedWeekKeys.map(weekKey => {
                  const week = weeklyGrouped[weekKey];
                  const isCollapsed = collapsedSections.has(weekKey);
                  return (
                    <section key={weekKey}>
                      <button
                        onClick={() => toggleSection(weekKey)}
                        className="w-full flex items-center gap-3 pt-6 pb-1.5 mb-1 group cursor-pointer"
                      >
                        <ChevronRight
                          size={10}
                          className="text-apple-tertiary/50 shrink-0 transition-transform duration-200"
                          style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}
                        />
                        <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/40 shrink-0">
                          {week.label}
                        </span>
                        <div className="flex-1 h-px bg-white/[0.05]" />
                        <span className="text-[10px] font-mono text-white/20 tabular-nums shrink-0">
                          {week.items.length}
                        </span>
                      </button>
                      {!isCollapsed && (
                        <div className="space-y-0 mb-2">
                          {week.items.map(log => renderLogCard(log))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}

            {activeTab === 'Monthly' && (
              <div className="space-y-0">
                {sortedMonthKeys.map(monthKey => {
                  const m = monthlyGrouped[monthKey];
                  const isCollapsed = collapsedSections.has(monthKey);
                  return (
                    <section key={monthKey}>
                      <button
                        onClick={() => toggleSection(monthKey)}
                        className="w-full flex items-center gap-3 pt-6 pb-1.5 mb-1 group cursor-pointer"
                      >
                        <ChevronRight
                          size={10}
                          className="text-apple-tertiary/50 shrink-0 transition-transform duration-200"
                          style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}
                        />
                        <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/40 shrink-0">
                          {m.label}
                        </span>
                        <div className="flex-1 h-px bg-white/[0.05]" />
                        <span className="text-[10px] font-mono text-white/20 tabular-nums shrink-0">
                          {m.items.length}
                        </span>
                      </button>
                      {!isCollapsed && (
                        <div className="space-y-0 mb-2">
                          {m.items.map(log => renderLogCard(log))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}

            {activeTab === 'All Time' && (
              <div className="space-y-0">
                {myLogs.map(log => renderLogCard(log))}
              </div>
            )}
          </div>
        </div>
      )}

      {isManageCategoriesOpen && (
        <ManageCategoriesModal onClose={() => setIsManageCategoriesOpen(false)} />
      )}
    </div>
  );
};