import React, { useState, useMemo } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { CheckCircle2, ListTodo } from 'lucide-react';
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

export const SupervisorHistory: React.FC = () => {
  const { data: { dailyLogs, deliverables, categories } } = useWorkspace();
  const [tab, setTab] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

  const groupedData = useMemo(() => {
    const acc: Record<string, {
      label: string,
      miral: { logs: typeof dailyLogs, deliverables: typeof deliverables },
      shalini: { logs: typeof dailyLogs, deliverables: typeof deliverables }
    }> = {};

    const getGroupKey = (dateStr: string) => {
      if (tab === 'Daily') return dateStr; // YYYY-MM-DD
      if (tab === 'Weekly') return getIsoWeekId(dateStr);
      return getMonthId(dateStr);
    };

    const getGroupLabel = (dateStr: string) => {
      const d = new Date(dateStr + 'T00:00:00');
      if (tab === 'Daily') {
        const today = new Date();
        const isToday = d.toDateString() === today.toDateString();
        return isToday ? `Today (${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})` : d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      }
      if (tab === 'Weekly') {
        const weekId = getIsoWeekId(dateStr);
        const [, weekStr] = weekId.split('-W');
        const weekNum = weekStr;
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const start = new Date(d);
        start.setDate(d.getDate() + diff);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        return `Week ${weekNum} (${startLabel} - ${endLabel})`;
      }
      return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    };

    // Process logs
    dailyLogs.forEach(log => {
      const key = getGroupKey(log.date);
      if (!acc[key]) {
        acc[key] = {
          label: getGroupLabel(log.date),
          miral: { logs: [], deliverables: [] },
          shalini: { logs: [], deliverables: [] }
        };
      }
      if (log.person === 'Miral') acc[key].miral.logs.push(log);
      if (log.person === 'Shalini') acc[key].shalini.logs.push(log);
    });

    // Process completed deliverables
    deliverables.forEach(d => {
      if (d.status === 'Done') {
        const key = getGroupKey(d.dueDate);
        if (!acc[key]) {
          acc[key] = {
            label: getGroupLabel(d.dueDate),
            miral: { logs: [], deliverables: [] },
            shalini: { logs: [], deliverables: [] }
          };
        }
        if (d.owner === 'Miral') acc[key].miral.deliverables.push(d);
        if (d.owner === 'Shalini') acc[key].shalini.deliverables.push(d);
      }
    });

    return acc;
  }, [dailyLogs, deliverables, tab]);

  const sortedKeys = Object.keys(groupedData).sort((a, b) => b.localeCompare(a)); // Descending

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

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-7">
        {sortedKeys.length === 0 ? (
          <p className="text-[13px] text-apple-tertiary text-center py-10">No work records found for this view.</p>
        ) : (
          <div className="space-y-12">
            {sortedKeys.map(key => {
              const group = groupedData[key];
              const mCount = group.miral.logs.length + group.miral.deliverables.length;
              const sCount = group.shalini.logs.length + group.shalini.deliverables.length;

              return (
                <div key={key} className="space-y-6">
                  {/* Period Header */}
                  <div className="border-b border-white/[0.06] pb-2">
                    <h3 className="text-[18px] font-semibold text-white tracking-tight">
                      {group.label}
                    </h3>
                  </div>

                  {/* Shalini's Section */}
                  {sCount > 0 && (
                    <div className="pl-4 border-l-[2px] border-purple-500/40 space-y-3">
                      <h4 className="text-[13.5px] font-semibold text-white/90 flex items-center gap-2 uppercase tracking-wider">
                        <Avatar name="Shalini" size="xs" /> Shalini
                      </h4>
                      <ul className="space-y-2.5">
                        {group.shalini.deliverables.map(d => (
                          <li key={`d-${d.id}`} className="text-[13px] text-white/85 leading-relaxed flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <span><strong className="text-amber-400/90 font-medium">Completed Deliverable:</strong> {d.name}</span>
                          </li>
                        ))}
                        {group.shalini.logs.map(log => {
                          const catColor = categories.find(c => c.name === log.category)?.color || '#9ca3af';
                          return (
                            <li key={`l-${log.id}`} className="text-[13px] text-white/85 leading-relaxed flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: catColor }} />
                              <span>
                                <strong className="font-medium text-white/95" style={{ color: catColor }}>[{log.category}]</strong> {log.description}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Miral's Section */}
                  {mCount > 0 && (
                    <div className="pl-4 border-l-[2px] border-emerald-500/40 space-y-3">
                      <h4 className="text-[13.5px] font-semibold text-white/90 flex items-center gap-2 uppercase tracking-wider">
                        <Avatar name="Miral" size="xs" /> Miral
                      </h4>
                      <ul className="space-y-2.5">
                        {group.miral.deliverables.map(d => (
                          <li key={`d-${d.id}`} className="text-[13px] text-white/85 leading-relaxed flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <span><strong className="text-amber-400/90 font-medium">Completed Deliverable:</strong> {d.name}</span>
                          </li>
                        ))}
                        {group.miral.logs.map(log => {
                          const catColor = categories.find(c => c.name === log.category)?.color || '#9ca3af';
                          return (
                            <li key={`l-${log.id}`} className="text-[13px] text-white/85 leading-relaxed flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: catColor }} />
                              <span>
                                <strong className="font-medium text-white/95" style={{ color: catColor }}>[{log.category}]</strong> {log.description}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {mCount === 0 && sCount === 0 && (
                    <p className="text-[13px] text-apple-tertiary italic pl-4">No activities logged during this period.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
