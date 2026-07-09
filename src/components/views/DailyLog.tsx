import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Plus, Trash2, ExternalLink, Calendar, FileText, Pencil, X, Check } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { ManageCategoriesModal } from '../ui/ManageCategoriesModal';
import { SegmentedControl } from '../ui/SegmentedControl';
import { useLocation } from 'react-router-dom';

const todayStr = () => new Date().toISOString().split('T')[0];

const isToday = (d: string) => d === todayStr();
const isYesterday = (d: string) => {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return d === y.toISOString().split('T')[0];
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
        className="group relative rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] p-4 transition-colors"
      >
        {!isEditing ? (
          <div className="flex items-start gap-3">
            <div 
              className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" 
              style={{ backgroundColor: categories.find(c => c.name === log.category)?.color || '#9ca3af' }} 
            />
            <div className="flex-1 min-w-0">
              <p className="text-[14.5px] text-white font-medium leading-relaxed">
                {log.description}
              </p>

              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                {role === 'supervisor' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-white/10 bg-white/[0.05] text-apple-secondary uppercase tracking-[0.06em]">
                    {log.person}
                  </span>
                )}
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-[0.06em]"
                  style={{ 
                    color: categories.find(c => c.name === log.category)?.color || '#9ca3af',
                    borderColor: categories.find(c => c.name === log.category)?.color || '#9ca3af',
                    backgroundColor: (categories.find(c => c.name === log.category)?.color || '#9ca3af') + '1A'
                  }}
                >
                  {log.category}
                </span>
                {log.link && (
                  <a
                    href={log.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11.5px] text-white/70 hover:text-white inline-flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink size={10} />
                    <span>Open link</span>
                  </a>
                )}
              </div>

              {log.takeaway && (
                <div className="mt-3 pl-3 border-l-2 border-emerald-400/30">
                  <p className="text-[12.5px] text-white/80 leading-relaxed italic">
                    {log.takeaway}
                  </p>
                </div>
              )}
            </div>
            {role !== 'supervisor' && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => startEdit(log)}
                  className="p-1.5 text-apple-tertiary hover:text-emerald-400/90 rounded-md hover:bg-white/[0.04] transition-colors"
                  aria-label="Edit log"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="p-1.5 text-apple-tertiary hover:text-red-400/90 rounded-md hover:bg-white/[0.04] transition-colors"
                  aria-label="Delete log"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 fade-in">
            <div className="flex items-center gap-2 pb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[10.5px] font-medium tracking-[0.18em] uppercase text-white/85">
                Editing entry
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[13.5px] text-white/95 focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-1.5">
                  Category
                </label>
                <select
                  required
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[13.5px] text-white/95 focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none cursor-pointer"
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
              <label className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                required
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[14px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-1.5">
                  Reference Link <span className="text-apple-tertiary font-normal normal-case tracking-normal">· optional</span>
                </label>
                <input
                  type="url"
                  value={editLink}
                  onChange={e => setEditLink(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[13.5px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-1.5">
                  Takeaway <span className="text-apple-tertiary font-normal normal-case tracking-normal">· optional</span>
                </label>
                <input
                  type="text"
                  value={editTakeaway}
                  onChange={e => setEditTakeaway(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[13.5px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.04]">
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-apple-secondary hover:text-white/85 rounded-md hover:bg-white/[0.04] transition-colors"
              >
                <X size={12} />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={() => saveEdit(log.id)}
                disabled={!editDescription.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white text-apple-base rounded-md text-[12.5px] font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <p className="text-[10.5px] font-medium tracking-[0.18em] uppercase text-apple-secondary mb-2">
            Journal
          </p>
          <h1 className="text-[30px] sm:text-[34px] font-semibold tracking-[-0.025em] text-white leading-none">
            Daily Log
          </h1>
          <p className="text-[13.5px] text-apple-gray mt-2.5 max-w-md">
            Record what you worked on. Keep it small, keep it daily.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">

          <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
            <Calendar size={12} className="text-apple-gray" />
            <span className="text-[12.5px] text-white/90 font-mono tabular-nums font-medium">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10.5px] font-medium tracking-[0.18em] uppercase text-apple-secondary">Today</p>
          <p className="text-[24px] font-semibold text-white tabular-nums leading-none mt-2.5">
            {todayCount}
          </p>
          <p className="text-[11px] text-apple-tertiary mt-1.5">
            {todayCount === 0 ? 'nothing logged' : todayCount === 1 ? 'entry logged' : 'entries logged'}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10.5px] font-medium tracking-[0.18em] uppercase text-apple-secondary">All time</p>
          <p className="text-[24px] font-semibold text-white tabular-nums leading-none mt-2.5">
            {myLogs.length}
          </p>
          <p className="text-[11px] text-apple-tertiary mt-1.5">total entries</p>
        </div>
      </div>

      {role !== 'supervisor' && (!isComposing ? (
        <button
          ref={promptRef}
          onClick={() => setIsComposing(true)}
          className="w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl border border-dashed border-white/[0.14] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.22] animate-pulse-emerald transition-all text-[13.5px] text-apple-gray hover:text-white/85 group"
        >
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-white/[0.06] group-hover:bg-white/10 transition-colors">
            <Plus size={13} className="group-hover:text-white transition-colors" />
          </span>
          <span>Add a log entry - what did you work on today?</span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] border border-white/[0.06] ml-auto">
            C
          </kbd>
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-white/[0.1] bg-apple-surface/60 p-4 sm:p-5 space-y-3.5 fade-in shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
        >
          <div className="flex items-center gap-2 pb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <p className="text-[10.5px] font-medium tracking-[0.18em] uppercase text-white/85">
              New entry
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-1.5">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[13.5px] text-white/95 focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase text-white/80">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setIsManageCategoriesOpen(true)}
                  className="text-[10.5px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Manage categories
                </button>
              </div>
              <select
                required
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[13.5px] text-white/95 focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.name} className="bg-apple-surface text-white">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-1.5">
                Description
              </label>
              <textarea
                id="dailylog-description"
                rows={3}
                required
                placeholder="What did you accomplish?"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[14px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-1.5">
                  Reference Link <span className="text-apple-tertiary font-normal normal-case tracking-normal">· optional</span>
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/artifact-or-ref"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[13.5px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-1.5">
                  Takeaway <span className="text-apple-tertiary font-normal normal-case tracking-normal">· optional</span>
                </label>
                <input
                  type="text"
                  placeholder="One-line insight from this work"
                  value={takeaway}
                  onChange={e => setTakeaway(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[13.5px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.04]">
              <button
                type="button"
                onClick={reset}
                className="px-3 py-1.5 text-[12px] text-apple-secondary hover:text-white/85 rounded-md hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!description.trim()}
                className="px-4 py-1.5 bg-white text-apple-base rounded-md text-[12.5px] font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <p className="text-[14px] text-white/90 font-medium">No logs recorded yet</p>
          <p className="text-[12.5px] text-apple-secondary mt-1 max-w-xs">
            A daily log is your research journal. Start with one line - what did you work on today?
          </p>
        </div>
      ) : (
        <div className="space-y-6 mt-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5 flex-wrap gap-2">
            <h2 className="text-[16px] font-semibold text-white tracking-tight flex items-center gap-2">
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
              <div className="space-y-10">
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

                  return (
                    <section key={dateKey} className="space-y-4">
                      <div className="flex items-center gap-3 pb-2 border-b border-white/[0.04]">
                        <div className="flex flex-col">
                          <span className="text-[15px] font-semibold text-white tracking-tight leading-none">
                            {dayLabel}
                          </span>
                          <span className="text-[11px] font-mono text-apple-secondary tabular-nums mt-1.5">
                            {dateLabel}
                          </span>
                        </div>
                        <div className="flex-1" />
                        <span className="text-[10.5px] font-mono text-apple-tertiary tabular-nums px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
                          {groupedLogs[dateKey].length} {groupedLogs[dateKey].length === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {groupedLogs[dateKey].map(log => renderLogCard(log))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}

            {activeTab === 'Weekly' && (
              <div className="space-y-10">
                {sortedWeekKeys.map(weekKey => {
                  const week = weeklyGrouped[weekKey];
                  return (
                    <section key={weekKey} className="space-y-4">
                      <div className="flex items-center gap-3 pb-2 border-b border-white/[0.04]">
                        <span className="text-[15px] font-semibold text-white tracking-tight leading-none">
                          {week.label}
                        </span>
                        <div className="flex-1" />
                        <span className="text-[10.5px] font-mono text-apple-tertiary tabular-nums px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
                          {week.items.length} {week.items.length === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {week.items.map(log => renderLogCard(log))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}

            {activeTab === 'Monthly' && (
              <div className="space-y-10">
                {sortedMonthKeys.map(monthKey => {
                  const m = monthlyGrouped[monthKey];
                  return (
                    <section key={monthKey} className="space-y-4">
                      <div className="flex items-center gap-3 pb-2 border-b border-white/[0.04]">
                        <span className="text-[15px] font-semibold text-white tracking-tight leading-none">
                          {m.label}
                        </span>
                        <div className="flex-1" />
                        <span className="text-[10.5px] font-mono text-apple-tertiary tabular-nums px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
                          {m.items.length} {m.items.length === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {m.items.map(log => renderLogCard(log))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}

            {activeTab === 'All Time' && (
              <div className="space-y-3">
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