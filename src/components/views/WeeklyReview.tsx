import React, { useState, useEffect, useMemo } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { CheckCircle2, MessageSquare, Clock, Sparkles, Calendar } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

// Returns the Monday of the week containing `date`.
const getWeekStart = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d;
};

// Returns the Sunday of the week containing `date`.
const getWeekEnding = (date: Date = new Date()): Date => {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
};

// Returns the ISO 8601 week id (e.g., "2026-W28") for a given date.
const getISOWeekId = (date: Date): string => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

const fmtRange = (start: Date, end: Date) => {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const startStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString(undefined, {
    month: sameMonth ? undefined : 'short',
    day: 'numeric',
    year: 'numeric'
  });
  return `${startStr} – ${endStr}`;
};

export const WeeklyReview: React.FC = () => {
  const { role, data, updateWeeklyReflection, addSupervisorCommentForPerson } = useWorkspace();
  const { dailyLogs, weeklyReflections } = data;

  const [supervisorCommentMiral, setSupervisorCommentMiral] = useState('');
  const [supervisorCommentShalini, setSupervisorCommentShalini] = useState('');
  const [isEditingMiral, setIsEditingMiral] = useState(false);
  const [isEditingShalini, setIsEditingShalini] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const weekStart = useMemo(() => getWeekStart(new Date()), []);
  const weekEnd = useMemo(() => getWeekEnding(new Date()), []);
  const fullRange = useMemo(() => fmtRange(weekStart, weekEnd), [weekStart, weekEnd]);

  const isSupervisor = role === 'supervisor';
  const researcher: 'Miral' | 'Shalini' = role === 'shalini' ? 'Shalini' : 'Miral';

  // The current reflection — lookup by ISO weekId of the current week.
  const currentWeekId = useMemo(() => getISOWeekId(weekStart), [weekStart]);

  const myReflection = useMemo(
    () => {
      const found = weeklyReflections.find(r => r.weekId === currentWeekId);
      if (found) return found;
      // Fallback: pick the most recent reflection that's not empty
      const filled = weeklyReflections.find(r =>
        (r.miralReflection?.done || r.miralReflection?.blockers || r.miralReflection?.next ||
         r.shaliniReflection?.done || r.shaliniReflection?.blockers || r.shaliniReflection?.next ||
         r.supervisorCommentMiral || r.supervisorCommentShalini || r.supervisorComment)
      );
      return filled || weeklyReflections[0] || {
        weekId: currentWeekId,
        miralReflection: { done: '', blockers: '', next: '' },
        shaliniReflection: { done: '', blockers: '', next: '' },
        isReviewed: false,
        supervisorCommentMiral: '',
        supervisorCommentShalini: ''
      };
    },
    [weeklyReflections, currentWeekId]
  );

  // Sync textarea states to persisted comments ONLY when not actively editing.
  useEffect(() => {
    if (!isEditingMiral) setSupervisorCommentMiral(myReflection.supervisorCommentMiral || '');
  }, [myReflection.supervisorCommentMiral, isEditingMiral]);

  useEffect(() => {
    if (!isEditingShalini) setSupervisorCommentShalini(myReflection.supervisorCommentShalini || '');
  }, [myReflection.supervisorCommentShalini, isEditingShalini]);

  const handleReflectionChange = (
    person: 'Miral' | 'Shalini',
    section: 'done' | 'blockers' | 'next',
    val: string
  ) => {
    updateWeeklyReflection(currentWeekId, person, section, val);
    setSavedAt(new Date());
  };

  const handleSupervisorSubmitForPerson = (person: 'Miral' | 'Shalini') => {
    const comment = person === 'Miral' ? supervisorCommentMiral : supervisorCommentShalini;
    addSupervisorCommentForPerson(currentWeekId, person, comment, true);
    setSavedAt(new Date());
    if (person === 'Miral') {
      setIsEditingMiral(false);
    } else {
      setIsEditingShalini(false);
    }
  };

  const handleCancelEdit = (person: 'Miral' | 'Shalini') => {
    if (person === 'Miral') {
      setSupervisorCommentMiral(myReflection.supervisorCommentMiral || '');
      setIsEditingMiral(false);
    } else {
      setSupervisorCommentShalini(myReflection.supervisorCommentShalini || '');
      setIsEditingShalini(false);
    }
  };

  const getRollupStats = (person: 'Miral' | 'Shalini') => {
    const counts: { [cat: string]: number } = {};
    const end = new Date(weekEnd);
    end.setHours(23, 59, 59, 999);
    dailyLogs
      .filter(l => {
        if (l.person !== person) return false;
        const d = new Date(l.date + 'T00:00:00');
        return d >= weekStart && d <= end;
      })
      .forEach(l => {
        counts[l.category] = (counts[l.category] || 0) + 1;
      });
    return counts;
  };

  const rollup = (person: 'Miral' | 'Shalini') => {
    const r = getRollupStats(person);
    const total = Object.values(r).reduce((a, b) => a + b, 0);
    return { counts: r, total };
  };

  const miralRollup = rollup('Miral');
  const shaliniRollup = rollup('Shalini');

  const savedAgo = savedAt
    ? Date.now() - savedAt.getTime() < 8000
      ? 'just now'
      : 'a moment ago'
    : null;

  const showReviewedBadge = isSupervisor && myReflection.isReviewed;

  return (
    <div className="fade-in space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10.5px] font-semibold tracking-[0.18em] uppercase text-apple-secondary mb-2 inline-flex items-center gap-1.5">
            <Calendar size={10} />
            Weekly review
          </p>
          <h1 className="text-[30px] sm:text-[34px] font-semibold tracking-[-0.025em] text-white leading-none">
            {isSupervisor ? 'Weekly Reviews' : 'Weekly Review'}
          </h1>
          <p className="text-[13.5px] text-apple-gray mt-2.5 font-mono tabular-nums">
            {fullRange}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {savedAgo && (
            <div className="hidden sm:inline-flex items-center gap-1.5 text-[11.5px] text-apple-tertiary">
              <Clock size={11} />
              <span>Saved {savedAgo}</span>
            </div>
          )}
          {showReviewedBadge ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/[0.1] text-emerald-400/90 text-[12px] border border-emerald-400/15">
              <CheckCircle2 size={12} />
              <span>Reviewed</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/[0.1] text-amber-400/90 text-[12px] border border-amber-400/15">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400/90" />
              <span>Pending review</span>
            </div>
          )}
        </div>
      </div>

      {/* Reflections section */}
      {isSupervisor ? (
        /* ── Supervisor: parallel row-aligned 2-column grid ── */
        <div
          className="grid gap-x-4"
          style={{ gridTemplateColumns: '1fr 1fr' }}
        >
          {/* Row 0: Column headers */}
          <div className="rounded-t-2xl border-x border-t border-white/[0.06] bg-white/[0.02] px-4 sm:px-5 py-3.5 flex items-center gap-3">
            <Avatar name="Shalini" size="sm" />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-white tracking-tight leading-none">Shalini</p>
              <p className="text-[10.5px] text-apple-tertiary mt-1">Study 1: GenAI</p>
            </div>
            <div className="flex-1" />
            <span className="text-[10.5px] font-mono text-apple-tertiary tabular-nums">
              {shaliniRollup.total} {shaliniRollup.total === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <div className="rounded-t-2xl border-x border-t border-white/[0.06] bg-white/[0.02] px-4 sm:px-5 py-3.5 flex items-center gap-3">
            <Avatar name="Miral" size="sm" />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-white tracking-tight leading-none">Miral</p>
              <p className="text-[10.5px] text-apple-tertiary mt-1">Study 2: Gamification</p>
            </div>
            <div className="flex-1" />
            <span className="text-[10.5px] font-mono text-apple-tertiary tabular-nums">
              {miralRollup.total} {miralRollup.total === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {/* Row 1: Activity rollup */}
          <div className="border-x border-t border-white/[0.06] bg-white/[0.02] px-4 sm:px-5 py-3 space-y-1.5 border-b border-white/[0.04]">
            {shaliniRollup.total > 0 ? Object.entries(shaliniRollup.counts).sort(([, a], [, b]) => b - a).map(([cat, count]) => {
              const pct = shaliniRollup.total > 0 ? (count / shaliniRollup.total) * 100 : 0;
              return (
                <div key={cat} className="flex items-center gap-3 text-[12px]">
                  <span className="text-white/85 flex-1 truncate">{cat}</span>
                  <div className="w-24 h-1 bg-white/[0.04] rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-emerald-400/60 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11.5px] text-white font-mono tabular-nums w-5 text-right shrink-0">{count}</span>
                </div>
              );
            }) : <p className="text-[12px] text-apple-tertiary italic">No log entries this week</p>}
          </div>
          <div className="border-x border-t border-white/[0.06] bg-white/[0.02] px-4 sm:px-5 py-3 space-y-1.5 border-b border-white/[0.04]">
            {miralRollup.total > 0 ? Object.entries(miralRollup.counts).sort(([, a], [, b]) => b - a).map(([cat, count]) => {
              const pct = miralRollup.total > 0 ? (count / miralRollup.total) * 100 : 0;
              return (
                <div key={cat} className="flex items-center gap-3 text-[12px]">
                  <span className="text-white/85 flex-1 truncate">{cat}</span>
                  <div className="w-24 h-1 bg-white/[0.04] rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-emerald-400/60 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11.5px] text-white font-mono tabular-nums w-5 text-right shrink-0">{count}</span>
                </div>
              );
            }) : <p className="text-[12px] text-apple-tertiary italic">No log entries this week</p>}
          </div>

          {/* Row 2: What got done */}
          <div className="border-x border-t border-white/[0.04] bg-white/[0.02] px-4 sm:px-5 pt-4 pb-2">
            <label className="block text-[11px] text-white/85 mb-1.5 font-semibold tracking-[0.02em] uppercase">What got done</label>
            <textarea rows={3} value={myReflection.shaliniReflection.done} readOnly disabled
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[13.5px] text-white/95 placeholder:text-apple-tertiary outline-none resize-none leading-relaxed disabled:opacity-80" />
          </div>
          <div className="border-x border-t border-white/[0.04] bg-white/[0.02] px-4 sm:px-5 pt-4 pb-2">
            <label className="block text-[11px] text-white/85 mb-1.5 font-semibold tracking-[0.02em] uppercase">What got done</label>
            <textarea rows={3} value={myReflection.miralReflection.done} readOnly disabled
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[13.5px] text-white/95 placeholder:text-apple-tertiary outline-none resize-none leading-relaxed disabled:opacity-80" />
          </div>

          {/* Row 3: Blockers */}
          <div className="border-x border-t border-white/[0.04] bg-white/[0.02] px-4 sm:px-5 pt-4 pb-2">
            <label className="block text-[11px] text-white/85 mb-1.5 font-semibold tracking-[0.02em] uppercase">Blockers</label>
            <textarea rows={3} value={myReflection.shaliniReflection.blockers} readOnly disabled
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[13.5px] text-white/95 placeholder:text-apple-tertiary outline-none resize-none leading-relaxed disabled:opacity-80" />
          </div>
          <div className="border-x border-t border-white/[0.04] bg-white/[0.02] px-4 sm:px-5 pt-4 pb-2">
            <label className="block text-[11px] text-white/85 mb-1.5 font-semibold tracking-[0.02em] uppercase">Blockers</label>
            <textarea rows={3} value={myReflection.miralReflection.blockers} readOnly disabled
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[13.5px] text-white/95 placeholder:text-apple-tertiary outline-none resize-none leading-relaxed disabled:opacity-80" />
          </div>

          {/* Row 4: Next week focus */}
          <div className="border-x border-t border-white/[0.04] bg-white/[0.02] px-4 sm:px-5 pt-4 pb-4">
            <label className="block text-[11px] text-white/85 mb-1.5 font-semibold tracking-[0.02em] uppercase">Next week focus</label>
            <textarea rows={3} value={myReflection.shaliniReflection.next} readOnly disabled
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[13.5px] text-white/95 placeholder:text-apple-tertiary outline-none resize-none leading-relaxed disabled:opacity-80" />
          </div>
          <div className="border-x border-t border-white/[0.04] bg-white/[0.02] px-4 sm:px-5 pt-4 pb-4">
            <label className="block text-[11px] text-white/85 mb-1.5 font-semibold tracking-[0.02em] uppercase">Next week focus</label>
            <textarea rows={3} value={myReflection.miralReflection.next} readOnly disabled
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[13.5px] text-white/95 placeholder:text-apple-tertiary outline-none resize-none leading-relaxed disabled:opacity-80" />
          </div>

          {/* Row 5: Supervisor feedback boxes */}
          <div className="rounded-b-2xl border-x border-b border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={14} className="text-apple-secondary" />
              <h3 className="text-[13px] font-semibold text-white">Feedback for Shalini</h3>
            </div>
            {myReflection.supervisorCommentShalini && !isEditingShalini ? (
              <div className="space-y-3">
                <div className="relative pl-3.5 border-l-2 border-emerald-500/40 py-1 bg-emerald-500/[0.02] rounded-r-lg">
                  <p className="text-[13.5px] text-white/90 leading-relaxed whitespace-pre-wrap">
                    {myReflection.supervisorCommentShalini}
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsEditingShalini(true)}
                    className="px-3 py-1 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Edit Feedback
                  </button>
                </div>
              </div>
            ) : (
              <>
                <textarea rows={3} value={supervisorCommentShalini} onChange={e => setSupervisorCommentShalini(e.target.value)}
                  placeholder="Add comments for Shalini…"
                  className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[14px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] focus:bg-white/[0.05] transition-colors outline-none resize-none leading-relaxed" />
                <div className="flex justify-end gap-2 mt-2">
                  {myReflection.supervisorCommentShalini && (
                    <button onClick={() => handleCancelEdit('Shalini')}
                      className="px-3 py-1.5 text-[12px] text-apple-secondary hover:text-white/85 rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer">
                      Cancel
                    </button>
                  )}
                  <button onClick={() => handleSupervisorSubmitForPerson('Shalini')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-apple-base rounded-md text-[12px] font-semibold hover:bg-white/90 transition-colors cursor-pointer">
                    <Sparkles size={12} /><span>Save feedback</span>
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="rounded-b-2xl border-x border-b border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={14} className="text-apple-secondary" />
              <h3 className="text-[13px] font-semibold text-white">Feedback for Miral</h3>
            </div>
            {myReflection.supervisorCommentMiral && !isEditingMiral ? (
              <div className="space-y-3">
                <div className="relative pl-3.5 border-l-2 border-emerald-500/40 py-1 bg-emerald-500/[0.02] rounded-r-lg">
                  <p className="text-[13.5px] text-white/90 leading-relaxed whitespace-pre-wrap">
                    {myReflection.supervisorCommentMiral}
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsEditingMiral(true)}
                    className="px-3 py-1 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Edit Feedback
                  </button>
                </div>
              </div>
            ) : (
              <>
                <textarea rows={3} value={supervisorCommentMiral} onChange={e => setSupervisorCommentMiral(e.target.value)}
                  placeholder="Add comments for Miral…"
                  className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[14px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] focus:bg-white/[0.05] transition-colors outline-none resize-none leading-relaxed" />
                <div className="flex justify-end gap-2 mt-2">
                  {myReflection.supervisorCommentMiral && (
                    <button onClick={() => handleCancelEdit('Miral')}
                      className="px-3 py-1.5 text-[12px] text-apple-secondary hover:text-white/85 rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer">
                      Cancel
                    </button>
                  )}
                  <button onClick={() => handleSupervisorSubmitForPerson('Miral')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-apple-base rounded-md text-[12px] font-semibold hover:bg-white/90 transition-colors cursor-pointer">
                    <Sparkles size={12} /><span>Save feedback</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ── Researcher view: only own reflection + supervisor feedback ── */
        <div className="space-y-4">
          <ReflectionColumn
            person={researcher}
            reflection={myReflection[`${researcher.toLowerCase()}Reflection` as 'miralReflection' | 'shaliniReflection']}
            rollup={rollup(researcher)}
            onChange={(section, val) => handleReflectionChange(researcher, section, val)}
          />
          {(myReflection[`supervisorComment${researcher}` as 'supervisorCommentMiral' | 'supervisorCommentShalini']) && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={14} className="text-emerald-400/70" />
                <h3 className="text-[13px] font-semibold text-white">Supervisor Feedback</h3>
              </div>
              <p className="text-[14px] text-white/90 leading-relaxed">
                {myReflection[`supervisorComment${researcher}` as 'supervisorCommentMiral' | 'supervisorCommentShalini']}
              </p>
              <p className="text-[10.5px] text-apple-tertiary mt-2 uppercase tracking-[0.12em] font-semibold">
                Dr. Chathura
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  ReflectionColumn                                                           */
/* -------------------------------------------------------------------------- */

interface ReflectionColumnProps {
  person: 'Miral' | 'Shalini';
  reflection: { done: string; blockers: string; next: string };
  rollup: { counts: Record<string, number>; total: number };
  readOnly?: boolean;
  onChange?: (section: 'done' | 'blockers' | 'next', val: string) => void;
}

const ReflectionColumn: React.FC<ReflectionColumnProps> = ({
  person,
  reflection,
  rollup,
  readOnly,
  onChange
}) => {
  const studyLabel = person === 'Shalini' ? 'Study 1: GenAI' : 'Study 2: Gamification';
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      {/* Column header */}
      <header className="px-4 sm:px-5 py-3.5 flex items-center gap-3 border-b border-white/[0.05]">
        <Avatar name={person} size="sm" />
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-white tracking-tight leading-none">{person}</p>
          <p className="text-[10.5px] text-apple-tertiary mt-1">{studyLabel}</p>
        </div>
        <div className="flex-1" />
        <span className="text-[10.5px] font-mono text-apple-tertiary tabular-nums">
          {rollup.total} {rollup.total === 1 ? 'entry' : 'entries'}
        </span>
      </header>

      {/* Activity rollup */}
      {rollup.total > 0 && (
        <div className="px-4 sm:px-5 py-3 border-b border-white/[0.04] space-y-1.5">
          {Object.entries(rollup.counts)
            .sort(([, a], [, b]) => b - a)
            .map(([cat, count]) => {
              const pct = rollup.total > 0 ? (count / rollup.total) * 100 : 0;
              return (
                <div key={cat} className="flex items-center gap-3 text-[12px]">
                  <span className="text-white/85 flex-1 truncate">{cat}</span>
                  <div className="w-24 h-1 bg-white/[0.04] rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full bg-emerald-400/60 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11.5px] text-white font-mono tabular-nums w-5 text-right shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}
        </div>
      )}

      {/* Reflection fields */}
      <div className="p-4 sm:p-5 space-y-4">
        <Field
          label="What got done"
          placeholder="List completed tasks…"
          value={reflection.done}
          onChange={v => onChange?.('done', v)}
          readOnly={readOnly}
        />
        <Field
          label="Blockers"
          placeholder="What is slowing you down?"
          value={reflection.blockers}
          onChange={v => onChange?.('blockers', v)}
          readOnly={readOnly}
        />
        <Field
          label="Next week focus"
          placeholder="Planned priorities…"
          value={reflection.next}
          onChange={v => onChange?.('next', v)}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Field                                                                      */
/* -------------------------------------------------------------------------- */

interface FieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}

const Field: React.FC<FieldProps> = ({ label, placeholder, value, onChange, readOnly }) => (
  <div>
    <label className="block text-[11px] text-white/85 mb-1.5 font-semibold tracking-[0.02em] uppercase">
      {label}
    </label>
    <textarea
      rows={3}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      disabled={readOnly}
      className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[13.5px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] focus:bg-white/[0.05] transition-colors outline-none resize-none leading-relaxed disabled:opacity-80"
    />
  </div>
);