import React, { useState, useMemo } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { CheckCircle2, ListTodo, ChevronRight } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { SegmentedControl } from '../ui/SegmentedControl';

const getIsoWeekId = (dateStr: string): string => {
  const date = new Date(dateStr);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

const getMonthId = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/* ─────────────────────────────────────────────────────────────────
   Shared markdown-aware description renderer (mirrors DailyLog)
───────────────────────────────────────────────────────────────── */
const renderFormattedDescription = (text: string) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentListType: 'ul' | 'ol' | null = null;
  let currentListItems: string[] = [];

  const flushList = (key: string | number) => {
    if (currentListItems.length === 0) return;
    if (currentListType === 'ul') {
      elements.push(
        <ul key={`ul-${key}`} className="list-disc pl-4 my-0.5 space-y-0.5 text-[13px] text-white/85 leading-snug">
          {currentListItems.map((item, idx) => <li key={idx}>{item}</li>)}
        </ul>
      );
    } else if (currentListType === 'ol') {
      elements.push(
        <ol key={`ol-${key}`} className="list-decimal pl-4 my-0.5 space-y-0.5 text-[13px] text-white/85 leading-snug">
          {currentListItems.map((item, idx) => <li key={idx}>{item}</li>)}
        </ol>
      );
    }
    currentListItems = [];
    currentListType = null;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const isBullet = /^[*-]\s+(.*)/.exec(trimmed);
    const isNumbered = /^\d+[.)]\s+(.*)/.exec(trimmed);

    if (isBullet) {
      if (currentListType !== 'ul') { flushList(idx); currentListType = 'ul'; }
      currentListItems.push(isBullet[1]);
    } else if (isNumbered) {
      if (currentListType !== 'ol') { flushList(idx); currentListType = 'ol'; }
      currentListItems.push(isNumbered[1]);
    } else {
      flushList(idx);
      if (trimmed.length > 0) {
        elements.push(
          <p key={`p-${idx}`} className="text-[13px] text-white/85 leading-snug my-0.5 break-words whitespace-pre-wrap">
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

export const SupervisorHistory: React.FC = () => {
  const { data: { dailyLogs, deliverables, categories } } = useWorkspace();
  const [tab, setTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const toggleSection = (key: string) => setCollapsedSections(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const groupedData = useMemo(() => {
    const acc: Record<string, {
      label: string,
      miral: { logs: typeof dailyLogs, deliverables: typeof deliverables },
      shalini: { logs: typeof dailyLogs, deliverables: typeof deliverables }
    }> = {};

    const getGroupKey = (dateStr: string) => {
      if (tab === 'Daily') return dateStr;
      if (tab === 'Weekly') return getIsoWeekId(dateStr);
      return getMonthId(dateStr);
    };

    const getGroupLabel = (dateStr: string) => {
      const d = new Date(dateStr + 'T00:00:00');
      if (tab === 'Daily') {
        const today = new Date();
        const isToday = d.toDateString() === today.toDateString();
        return isToday
          ? `Today (${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})`
          : d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      }
      if (tab === 'Weekly') {
        const weekId = getIsoWeekId(dateStr);
        const [, weekStr] = weekId.split('-W');
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const start = new Date(d);
        start.setDate(d.getDate() + diff);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        return `Week ${weekStr} (${startLabel} - ${endLabel})`;
      }
      return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    };

    dailyLogs.forEach(log => {
      const key = getGroupKey(log.date);
      if (!acc[key]) {
        acc[key] = { label: getGroupLabel(log.date), miral: { logs: [], deliverables: [] }, shalini: { logs: [], deliverables: [] } };
      }
      if (log.person === 'Miral') acc[key].miral.logs.push(log);
      if (log.person === 'Shalini') acc[key].shalini.logs.push(log);
    });

    deliverables.forEach(d => {
      if (d.status === 'Done') {
        const key = getGroupKey(d.dueDate);
        if (!acc[key]) {
          acc[key] = { label: getGroupLabel(d.dueDate), miral: { logs: [], deliverables: [] }, shalini: { logs: [], deliverables: [] } };
        }
        if (d.owner === 'Miral') acc[key].miral.deliverables.push(d);
        if (d.owner === 'Shalini') acc[key].shalini.deliverables.push(d);
      }
    });

    return acc;
  }, [dailyLogs, deliverables, tab]);

  const sortedKeys = Object.keys(groupedData).sort((a, b) => b.localeCompare(a));

  /* Renders a single person's log list in the Daily Log compact style */
  const renderPersonLogs = (
    logs: typeof dailyLogs,
    delivs: typeof deliverables,
  ) => (
    <div className="space-y-0">
      {delivs.map(d => (
        <div key={`d-${d.id}`} className="py-1.5 border-b border-apple-border/40 last:border-0">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 size={12} className="text-amber-400 shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-white/85 leading-snug">{d.name}</p>
              <span className="text-[10px] font-medium text-amber-400/60 mt-0.5 block">Deliverable</span>
            </div>
          </div>
        </div>
      ))}
      {logs.map(log => {
        const catColor = categories.find(c => c.name === log.category)?.color || '#9ca3af';
        return (
          <div key={`l-${log.id}`} className="py-1.5 border-b border-apple-border/40 last:border-0">
            <div className="flex items-start gap-2.5">
              <div className="w-1 h-1 rounded-full shrink-0 mt-2" style={{ backgroundColor: catColor }} />
              <div className="flex-1 min-w-0">
                <div className="space-y-0">
                  {renderFormattedDescription(log.description)}
                </div>
                <span
                  className="text-[10px] font-medium mt-0.5 block"
                  style={{ color: catColor + '88' }}
                >
                  {log.category}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-white/[0.06] pb-3">
        <h2 className="text-[15px] font-semibold text-white tracking-tight flex items-center gap-2">
          <ListTodo size={16} className="text-apple-secondary" />
          Work History
        </h2>
        <SegmentedControl<'Daily' | 'Weekly' | 'Monthly'>
          options={['Daily', 'Weekly', 'Monthly'] as const}
          value={tab}
          onChange={setTab}
          size="sm"
        />
      </div>

      <div className="space-y-0">
        {sortedKeys.length === 0 ? (
          <p className="text-[13px] text-apple-tertiary text-center py-10">No work records found for this view.</p>
        ) : (
          sortedKeys.map(key => {
            const group = groupedData[key];
            const mCount = group.miral.logs.length + group.miral.deliverables.length;
            const sCount = group.shalini.logs.length + group.shalini.deliverables.length;
            if (mCount === 0 && sCount === 0) return null;

            return (
              <div key={key}>
                {/* Period header — collapsible, same minimal style as DailyLog */}
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center gap-3 pt-6 pb-1.5 mb-1 cursor-pointer"
                >
                  <ChevronRight
                    size={10}
                    className="text-apple-tertiary/50 shrink-0 transition-transform duration-200"
                    style={{ transform: collapsedSections.has(key) ? 'rotate(0deg)' : 'rotate(90deg)' }}
                  />
                  <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/40 shrink-0">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                  <span className="text-[10px] font-mono text-white/20 tabular-nums shrink-0">
                    {mCount + sCount}
                  </span>
                </button>

                {!collapsedSections.has(key) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-2">
                    {/* Shalini */}
                    {sCount > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar name="Shalini" size="xs" />
                          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Shalini</span>
                        </div>
                        {renderPersonLogs(group.shalini.logs, group.shalini.deliverables)}
                      </div>
                    )}

                    {/* Miral */}
                    {mCount > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar name="Miral" size="xs" />
                          <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Miral</span>
                        </div>
                        {renderPersonLogs(group.miral.logs, group.miral.deliverables)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
