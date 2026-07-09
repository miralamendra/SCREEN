import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { CheckCircle2, MessageSquare, Clock, Sparkles, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

const renderFormattedDescription = (text: string) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  let currentListType: 'ul' | 'ol' | null = null;
  let currentListItems: string[] = [];

  const flushList = (key: string | number) => {
    if (currentListItems.length === 0) return;
    if (currentListType === 'ul') {
      elements.push(
        <ul key={`ul-${key}`} className="list-disc pl-5 my-1.5 space-y-1 text-[13.5px] text-white/90 leading-relaxed">
          {currentListItems.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      );
    } else if (currentListType === 'ol') {
      elements.push(
        <ol key={`ol-${key}`} className="list-decimal pl-5 my-1.5 space-y-1 text-[13.5px] text-white/90 leading-relaxed">
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
          <p key={`p-${idx}`} className="text-[13.5px] text-white/90 leading-relaxed my-1 break-words whitespace-pre-wrap">
            {line}
          </p>
        );
      } else {
        elements.push(<div key={`br-${idx}`} className="h-1.5" />);
      }
    }
  });

  flushList(lines.length);
  return elements;
};

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

// Returns the ISO 8601 week number for a given date.
const getISOWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const fmtDay = (d: Date) => d.getDate();
const fmtWeekday = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short' });
const fmtMonth = (d: Date) => d.toLocaleDateString(undefined, { month: 'short' });

// Format date range as a clear, multi-part string.
// e.g. start=Mon Jul 6, end=Sun Jul 12, 2026
const fmtRange = (start: Date, end: Date) => {
  const sameYear = start.getFullYear() === end.getFullYear();
  const startStr = `${fmtWeekday(start)}, ${fmtMonth(start)} ${fmtDay(start)}`;
  const endStr = `${fmtWeekday(end)}, ${fmtMonth(end)} ${fmtDay(end)}${sameYear ? '' : ', ' + end.getFullYear()}`;
  return { startStr, endStr, year: end.getFullYear() };
};

export const WeeklyReview: React.FC = () => {
  const { role, data, updateWeeklyReflection, addSupervisorCommentForPerson } = useWorkspace();
  const { dailyLogs, weeklyReflections } = data;

  const [supervisorCommentMiral, setSupervisorCommentMiral] = useState('');
  const [supervisorCommentShalini, setSupervisorCommentShalini] = useState('');
  const [isEditingMiral, setIsEditingMiral] = useState(false);
  const [isEditingShalini, setIsEditingShalini] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const commentShaliniRef = useRef<HTMLTextAreaElement>(null);
  const commentMiralRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (commentShaliniRef.current) {
      commentShaliniRef.current.style.height = 'auto';
      commentShaliniRef.current.style.height = `${commentShaliniRef.current.scrollHeight}px`;
    }
  }, [supervisorCommentShalini, isEditingShalini]);

  useEffect(() => {
    if (commentMiralRef.current) {
      commentMiralRef.current.style.height = 'auto';
      commentMiralRef.current.style.height = `${commentMiralRef.current.scrollHeight}px`;
    }
  }, [supervisorCommentMiral, isEditingMiral]);

  // Track which week is being viewed. Stored as an offset from the current week (0 = this week,
  // -1 = previous week, +1 = next week). Auto-jumps to current week on mount and re-mounts.
  const [weekOffset, setWeekOffset] = useState(0);

  // Re-anchor to the current week whenever the underlying date changes (covers overnight rollover,
  // app reopens after a long time, etc.).
  useEffect(() => {
    setWeekOffset(0);
  }, []);

  const weekAnchor = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekStart = useMemo(() => getWeekStart(weekAnchor), [weekAnchor]);
  const weekEnd = useMemo(() => getWeekEnding(weekAnchor), [weekAnchor]);
  const fullRange = useMemo(() => fmtRange(weekStart, weekEnd), [weekStart, weekEnd]);
  const isoWeekNumber = useMemo(() => getISOWeekNumber(weekStart), [weekStart]);

  const isSupervisor = role === 'supervisor';
  const researcher: 'Miral' | 'Shalini' = role === 'shalini' ? 'Shalini' : 'Miral';

  // The current reflection — lookup by ISO weekId of the selected week.
  const currentWeekId = useMemo(() => getISOWeekId(weekStart), [weekStart]);

  // The full sorted list of weekIds that exist in the data, plus the currently-viewed week,
  // so we can tell when we're browsing an old/future week that has no record yet.
  const allWeekIds = useMemo(() => {
    const ids = new Set<string>(weeklyReflections.map(r => r.weekId));
    ids.add(currentWeekId);
    return Array.from(ids).sort();
  }, [weeklyReflections, currentWeekId]);

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
      return filled || {
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

  // Detect "future week" — researcher is browsing ahead of the current week, so we should
  // hide the editable fields (and not show a "pending" status that implies it should be filled in).
  const isFutureWeek = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return weekStart.getTime() > today.getTime();
  }, [weekStart]);

  const isPastWeek = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return weekEnd.getTime() < today.getTime();
  }, [weekEnd]);

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

  // Determine week context label
  const weekContextLabel = isFutureWeek
    ? 'Future week'
    : isPastWeek
    ? 'Past week'
    : 'Current week';

  return (
    <div className="fade-in space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold tracking-[0.18em] uppercase text-apple-secondary mb-2 inline-flex items-center gap-1.5">
            <Calendar size={10} />
            Weekly review
          </p>
          <h1 className="text-[30px] sm:text-[34px] font-semibold tracking-[-0.025em] text-white leading-none">
            {isSupervisor ? 'Weekly Reviews' : 'Weekly Review'}
          </h1>
          <p className="text-[13.5px] text-apple-gray mt-2.5 font-mono tabular-nums">
            Week {isoWeekNumber} of {weekStart.getFullYear()} · {weekContextLabel}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Week navigator */}
          <div className="inline-flex items-center rounded-md bg-white/[0.04] border border-white/[0.06] overflow-hidden">
            <button
              onClick={() => setWeekOffset(o => o - 1)}
              className="p-1.5 text-apple-secondary hover:text-white/85 hover:bg-white/[0.04] transition-colors"
              aria-label="Previous week"
              title="Previous week"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
              className={`px-2.5 py-1 text-[11.5px] font-medium border-x border-white/[0.06] transition-colors tabular-nums ${
                weekOffset === 0
                  ? 'text-white/95 bg-white/[0.04] cursor-default'
                  : 'text-apple-secondary hover:text-white/85 hover:bg-white/[0.04]'
              }`}
              title="Jump to current week"
            >
              Today
            </button>
            <button
              onClick={() => setWeekOffset(o => o + 1)}
              className="p-1.5 text-apple-secondary hover:text-white/85 hover:bg-white/[0.04] transition-colors"
              aria-label="Next week"
              title="Next week"
            >
              <ChevronRight size={13} />
            </button>
          </div>
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

      {/* Day-from-to header - large, clear, unambiguous */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 sm:px-5 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-5 sm:gap-6 flex-wrap">
          {/* Start Date */}
          <div className="flex flex-col">
            <span className="text-[9.5px] font-semibold tracking-[0.18em] uppercase text-apple-secondary leading-none mb-2">
              Start
            </span>
            <span className="text-[14.5px] sm:text-[15.5px] font-semibold text-white tracking-tight">
              {fullRange.startStr}
            </span>
          </div>
          
          {/* Separator - aligned with values */}
          <div className="flex flex-col justify-end h-8 pb-0.5 text-apple-secondary/60 text-[13.5px]">
            <span>-</span>
          </div>

          {/* End Date */}
          <div className="flex flex-col">
            <span className="text-[9.5px] font-semibold tracking-[0.18em] uppercase text-apple-secondary leading-none mb-2">
              End
            </span>
            <span className="text-[14.5px] sm:text-[15.5px] font-semibold text-white tracking-tight">
              {fullRange.endStr}
            </span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-white/[0.06] self-center mx-1" />

          {/* Year */}
          <div className="flex flex-col">
            <span className="text-[9.5px] font-semibold tracking-[0.18em] uppercase text-apple-secondary leading-none mb-2">
              Year
            </span>
            <span className="text-[14.5px] sm:text-[15.5px] font-semibold text-white tracking-tight tabular-nums">
              {fullRange.year}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-apple-secondary uppercase tracking-[0.12em] bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/[0.05] shrink-0">
          7 days · {weekStart.toLocaleDateString(undefined, { month: 'short' })}
        </div>
      </div>

      {/* Future-week notice */}
      {isFutureWeek && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[12.5px] text-apple-tertiary flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
          <span>This week hasn't started yet. You can pre-fill reflections, but they'll only become meaningful once the week begins.</span>
        </div>
      )}

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
            <div className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-[13.5px] text-white/90 leading-relaxed min-h-[80px] space-y-1">
              {renderFormattedDescription(myReflection.shaliniReflection.done || 'Nothing entered')}
            </div>
          </div>
          <div className="border-x border-t border-white/[0.04] bg-white/[0.02] px-4 sm:px-5 pt-4 pb-2">
            <label className="block text-[11px] text-white/85 mb-1.5 font-semibold tracking-[0.02em] uppercase">What got done</label>
            <div className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-[13.5px] text-white/90 leading-relaxed min-h-[80px] space-y-1">
              {renderFormattedDescription(myReflection.miralReflection.done || 'Nothing entered')}
            </div>
          </div>

          {/* Row 3: Blockers */}
          <div className="border-x border-t border-white/[0.04] bg-white/[0.02] px-4 sm:px-5 pt-4 pb-2">
            <label className="block text-[11px] text-white/85 mb-1.5 font-semibold tracking-[0.02em] uppercase">Blockers</label>
            <div className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-[13.5px] text-white/90 leading-relaxed min-h-[80px] space-y-1">
              {renderFormattedDescription(myReflection.shaliniReflection.blockers || 'None')}
            </div>
          </div>
          <div className="border-x border-t border-white/[0.04] bg-white/[0.02] px-4 sm:px-5 pt-4 pb-2">
            <label className="block text-[11px] text-white/85 mb-1.5 font-semibold tracking-[0.02em] uppercase">Blockers</label>
            <div className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-[13.5px] text-white/90 leading-relaxed min-h-[80px] space-y-1">
              {renderFormattedDescription(myReflection.miralReflection.blockers || 'None')}
            </div>
          </div>

          {/* Row 4: Next week focus */}
          <div className="border-x border-t border-white/[0.04] bg-white/[0.02] px-4 sm:px-5 pt-4 pb-4">
            <label className="block text-[11px] text-white/85 mb-1.5 font-semibold tracking-[0.02em] uppercase">Next week focus</label>
            <div className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-[13.5px] text-white/90 leading-relaxed min-h-[80px] space-y-1">
              {renderFormattedDescription(myReflection.shaliniReflection.next || 'Nothing entered')}
            </div>
          </div>
          <div className="border-x border-t border-white/[0.04] bg-white/[0.02] px-4 sm:px-5 pt-4 pb-4">
            <label className="block text-[11px] text-white/85 mb-1.5 font-semibold tracking-[0.02em] uppercase">Next week focus</label>
            <div className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-[13.5px] text-white/90 leading-relaxed min-h-[80px] space-y-1">
              {renderFormattedDescription(myReflection.miralReflection.next || 'Nothing entered')}
            </div>
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
                  <div className="text-[13.5px] text-white/90 leading-relaxed space-y-1">
                    {renderFormattedDescription(myReflection.supervisorCommentShalini)}
                  </div>
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
                <textarea
                  ref={commentShaliniRef}
                  value={supervisorCommentShalini}
                  onChange={e => setSupervisorCommentShalini(e.target.value)}
                  style={{ minHeight: '60px', height: 'auto' }}
                  placeholder="Add comments for Shalini…"
                  className="w-full px-3.5 py-2.5 bg-apple-base border border-apple-border rounded-lg text-[14px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] transition-colors outline-none resize-none leading-relaxed"
                />
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
                  <div className="text-[13.5px] text-white/90 leading-relaxed space-y-1">
                    {renderFormattedDescription(myReflection.supervisorCommentMiral)}
                  </div>
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
                <textarea
                  ref={commentMiralRef}
                  value={supervisorCommentMiral}
                  onChange={e => setSupervisorCommentMiral(e.target.value)}
                  style={{ minHeight: '60px', height: 'auto' }}
                  placeholder="Add comments for Miral…"
                  className="w-full px-3.5 py-2.5 bg-apple-base border border-apple-border rounded-lg text-[14px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] transition-colors outline-none resize-none leading-relaxed"
                />
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

      {/* Recent weeks history (if there are any) — for context */}
      {allWeekIds.length > 1 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10.5px] font-semibold tracking-[0.18em] uppercase text-apple-secondary mb-2.5">
            Reflection history · {allWeekIds.length} {allWeekIds.length === 1 ? 'week' : 'weeks'} on record
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allWeekIds.slice().reverse().map(wid => {
              const isCurrent = wid === currentWeekId;
              // Compute label for this week
              const [yearStr, wkStr] = wid.split('-W');
              return (
                <button
                  key={wid}
                  onClick={() => {
                    // jump to the week whose ISO id matches wid
                    const target = allWeekIds.indexOf(wid);
                    const currentIdx = allWeekIds.indexOf(currentWeekId);
                    setWeekOffset(prev => prev + (target - currentIdx));
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono tabular-nums transition-colors ${
                    isCurrent
                      ? 'bg-white/[0.08] border border-white/[0.14] text-white'
                      : 'bg-white/[0.02] border border-white/[0.04] text-apple-secondary hover:bg-white/[0.04] hover:text-white/85'
                  }`}
                >
                  W{wkStr} {yearStr}
                </button>
              );
            })}
          </div>
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

const Field: React.FC<FieldProps> = ({ label, placeholder, value, onChange, readOnly }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, readOnly]);

  return (
    <div>
      <label className="block text-[11px] text-white/85 mb-1.5 font-semibold tracking-[0.02em] uppercase">
        {label}
      </label>
      {readOnly ? (
        <div className="w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-lg text-[13.5px] text-white/90 leading-relaxed min-h-[80px] space-y-1">
          {renderFormattedDescription(value || '')}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ minHeight: '80px', height: 'auto' }}
          className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[13.5px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] focus:bg-white/[0.05] transition-colors outline-none resize-none leading-relaxed disabled:opacity-80"
        />
      )}
    </div>
  );
};