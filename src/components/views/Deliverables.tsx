import React, { useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Download, Milestone, Filter } from 'lucide-react';
import type { DeliverableItem } from '../../data/initialState';
import { useToast } from '../ui/Toast';
import { Avatar } from '../ui/Avatar';

const STATUS_OPTIONS: DeliverableItem['status'][] = ['Not started', 'In progress', 'Done', 'Late'];

const getStatusStyle = (s: DeliverableItem['status']) => {
  switch (s) {
    case 'Done': return 'text-emerald-300 bg-emerald-400/[0.1] border-emerald-400/20';
    case 'In progress': return 'text-blue-300 bg-blue-400/[0.1] border-blue-400/20';
    case 'Late': return 'text-red-300 bg-red-400/[0.1] border-red-400/20';
    default: return 'text-white/75 bg-white/[0.05] border-white/[0.1]';
  }
};

const isOverdue = (d: DeliverableItem) =>
  new Date(d.dueDate).getTime() < new Date().getTime() && d.status !== 'Done' && d.status !== 'Late';

type FilterKey = 'all' | 'active' | 'done' | 'late';

export const Deliverables: React.FC = () => {
  const { role, data, updateDeliverableStatus, exportToCSV } = useWorkspace();
  const { push } = useToast();
  const { deliverables } = data;

  const isSupervisor = role === 'supervisor';
  const activePerson: 'Miral' | 'Shalini' = role === 'shalini' ? 'Shalini' : 'Miral';
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    deliverables.forEach(d => {
      if (isOverdue(d)) updateDeliverableStatus(d.id, 'Late');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliverables]);

  const handleStatusChange = (id: string, status: DeliverableItem['status']) => {
    updateDeliverableStatus(id, status);
    push('Status updated');
  };

  return (
    <div className="fade-in space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10.5px] font-semibold tracking-[0.18em] uppercase text-apple-secondary mb-2">
            Milestones
          </p>
          <h1 className="text-[30px] sm:text-[34px] font-semibold tracking-[-0.025em] text-white leading-none">
            Deliverables
          </h1>
          <p className="text-[13.5px] text-apple-gray mt-2.5">
            Milestones, deadlines, and progress across the project.
          </p>
        </div>
        <button
          onClick={() => exportToCSV('deliverables')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-apple-secondary hover:text-white/85 rounded-md hover:bg-white/[0.04] transition-colors"
        >
          <Download size={13} />
          <span>Export</span>
        </button>
      </div>

      {isSupervisor ? (
        <SupervisorGrid
          shaliniDeliverables={deliverables.filter(d => d.owner === 'Shalini')}
          miralDeliverables={deliverables.filter(d => d.owner === 'Miral')}
          onStatusChange={handleStatusChange}
          filter={filter}
          setFilter={setFilter}
        />
      ) : (
        <SingleColumn
          deliverables={deliverables.filter(d => d.owner === activePerson)}
          onStatusChange={handleStatusChange}
          filter={filter}
          setFilter={setFilter}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  SingleColumn — researcher view (one person)                                */
/* -------------------------------------------------------------------------- */

interface ColumnProps {
  deliverables: DeliverableItem[];
  onStatusChange: (id: string, status: DeliverableItem['status']) => void;
  filter: FilterKey;
  setFilter: (f: FilterKey) => void;
}

const SingleColumn: React.FC<ColumnProps> = ({ deliverables, onStatusChange, filter, setFilter }) => {
  const counts = useMemo(
    () => ({
      all: deliverables.length,
      active: deliverables.filter(d => d.status === 'In progress' || d.status === 'Not started').length,
      done: deliverables.filter(d => d.status === 'Done').length,
      late: deliverables.filter(d => d.status === 'Late').length
    }),
    [deliverables]
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return deliverables;
    if (filter === 'active') return deliverables.filter(d => d.status === 'In progress' || d.status === 'Not started');
    if (filter === 'done') return deliverables.filter(d => d.status === 'Done');
    if (filter === 'late') return deliverables.filter(d => d.status === 'Late');
    return deliverables;
  }, [deliverables, filter]);

  const sorted = [...filtered].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const totalDone = deliverables.filter(d => d.status === 'Done').length;
  const totalCount = deliverables.length;
  const totalPct = totalCount > 0 ? (totalDone / totalCount) * 100 : 0;

  return (
    <ProgressColumn
      title="Overall"
      subtitle=""
      counts={counts}
      totalDone={totalDone}
      totalCount={totalCount}
      totalPct={totalPct}
      filter={filter}
      setFilter={setFilter}
    >
      <DeliverableList items={sorted} onStatusChange={onStatusChange} showOwner={false} />
    </ProgressColumn>
  );
};

/* -------------------------------------------------------------------------- */
/*  ResearcherColumn — supervisor view (one of the two side-by-side)          */
/* -------------------------------------------------------------------------- */


/* -------------------------------------------------------------------------- */
/*  SupervisorGrid — parallel row-aligned by quarter                           */
/* -------------------------------------------------------------------------- */

interface SupervisorGridProps {
  shaliniDeliverables: DeliverableItem[];
  miralDeliverables: DeliverableItem[];
  onStatusChange: (id: string, status: DeliverableItem['status']) => void;
  filter: FilterKey;
  setFilter: (f: FilterKey) => void;
}

const SupervisorGrid: React.FC<SupervisorGridProps> = ({
  shaliniDeliverables,
  miralDeliverables,
  onStatusChange,
  filter,
  setFilter
}) => {
  const applyFilter = (items: DeliverableItem[]) => {
    if (filter === 'active') return items.filter(d => d.status === 'In progress' || d.status === 'Not started');
    if (filter === 'done') return items.filter(d => d.status === 'Done');
    if (filter === 'late') return items.filter(d => d.status === 'Late');
    return items;
  };

  const parseQuarter = (q: string) => {
    const match = q.match(/Q(\d)\s+(\d{4})/i);
    if (!match) return 99999;
    const qNum = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);
    return year * 10 + qNum;
  };

  const getQuarters = (items: DeliverableItem[]) => {
    const qs = new Set(items.map(d => d.quarter));
    return Array.from(qs).sort((a, b) => parseQuarter(a) - parseQuarter(b));
  };

  const sFiltered = applyFilter(shaliniDeliverables);
  const mFiltered = applyFilter(miralDeliverables);
  const allQuarters = Array.from(new Set([
    ...getQuarters(shaliniDeliverables),
    ...getQuarters(miralDeliverables)
  ])).sort((a, b) => parseQuarter(a) - parseQuarter(b));

  const sDone = shaliniDeliverables.filter(d => d.status === 'Done').length;
  const sTotal = shaliniDeliverables.length;
  const sPct = sTotal > 0 ? (sDone / sTotal) * 100 : 0;
  const mDone = miralDeliverables.filter(d => d.status === 'Done').length;
  const mTotal = miralDeliverables.length;
  const mPct = mTotal > 0 ? (mDone / mTotal) * 100 : 0;

  const sCounts = {
    all: shaliniDeliverables.length,
    active: shaliniDeliverables.filter(d => d.status === 'In progress' || d.status === 'Not started').length,
    done: sDone,
    late: shaliniDeliverables.filter(d => d.status === 'Late').length
  };
  const mCounts = {
    all: miralDeliverables.length,
    active: miralDeliverables.filter(d => d.status === 'In progress' || d.status === 'Not started').length,
    done: mDone,
    late: miralDeliverables.filter(d => d.status === 'Late').length
  };

  const FilterChip = ({ k, label, counts }: { k: FilterKey; label: string; counts: Record<FilterKey, number> }) => (
    <button
      onClick={() => setFilter(k)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] transition-colors ${
        filter === k
          ? 'bg-white text-apple-base font-semibold'
          : 'bg-white/[0.04] text-apple-secondary hover:text-white/85 hover:bg-white/[0.06] border border-white/[0.06]'
      }`}
    >
      <span>{label}</span>
      <span className={`text-[10.5px] font-mono tabular-nums ${filter === k ? 'text-apple-base/60' : 'text-apple-tertiary'}`}>
        {counts[k]}
      </span>
    </button>
  );

  const DeliverableRow = ({ del }: { del: DeliverableItem }) => {
    const isLate = new Date(del.dueDate).getTime() < new Date().getTime() && del.status !== 'Done';
    const displayedStatus = isLate && del.status !== 'Done' ? 'Late' : del.status;
    const dueObj = new Date(del.dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil((dueObj.getTime() - today.getTime()) / 86_400_000);
    const isT = dueObj.toDateString() === today.toDateString();
    const dueLabel = isT ? 'Today' : dueObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const daysLabel = isT ? 'today' : daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil}d`;

    return (
      <div className="group flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] px-3 py-2.5 transition-colors">
        <div className="flex flex-col items-start w-14 shrink-0">
          <span className="text-[12px] font-mono text-white tabular-nums font-semibold leading-none">{dueLabel}</span>
          <span className="text-[9.5px] text-apple-tertiary uppercase tracking-[0.06em] mt-1">{daysLabel}</span>
        </div>
        <span className="text-[13px] text-white flex-1 min-w-0 font-medium leading-snug">{del.name}</span>
        <div className="w-32 shrink-0 flex justify-end">
          <select
            value={displayedStatus}
            onChange={e => onStatusChange(del.id, e.target.value as DeliverableItem['status'])}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold outline-none cursor-pointer border ${getStatusStyle(displayedStatus)} appearance-none`}
            aria-label="Status"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s} className="bg-apple-surface text-white">{s}</option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Column headers */}
      <div className="grid gap-x-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Shalini header */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 flex items-center gap-3 border-b border-white/[0.05]">
            <Avatar name="Shalini" size="sm" />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-white tracking-tight leading-none">Shalini</p>
              <p className="text-[10.5px] text-apple-tertiary mt-1">Study 1: GenAI Application</p>
            </div>
            <div className="flex-1" />
            <span className="text-[10.5px] font-mono text-apple-tertiary tabular-nums">{sDone}/{sTotal} · {Math.round(sPct)}%</span>
          </div>
          <div className="px-4 sm:px-5 pt-3.5">
            <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400/70 rounded-full transition-all duration-500" style={{ width: `${sPct}%` }} />
            </div>
          </div>
          <div className="px-4 sm:px-5 py-3 flex items-center gap-2 flex-wrap">
            <Filter size={12} className="text-apple-tertiary" />
            {(['all', 'active', 'done', 'late'] as FilterKey[]).map(k => (
              <FilterChip key={k} k={k} label={k.charAt(0).toUpperCase() + k.slice(1)} counts={sCounts} />
            ))}
          </div>
        </div>
        {/* Miral header */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 flex items-center gap-3 border-b border-white/[0.05]">
            <Avatar name="Miral" size="sm" />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-white tracking-tight leading-none">Miral</p>
              <p className="text-[10.5px] text-apple-tertiary mt-1">Study 2: Gamification</p>
            </div>
            <div className="flex-1" />
            <span className="text-[10.5px] font-mono text-apple-tertiary tabular-nums">{mDone}/{mTotal} · {Math.round(mPct)}%</span>
          </div>
          <div className="px-4 sm:px-5 pt-3.5">
            <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400/70 rounded-full transition-all duration-500" style={{ width: `${mPct}%` }} />
            </div>
          </div>
          <div className="px-4 sm:px-5 py-3 flex items-center gap-2 flex-wrap">
            <Filter size={12} className="text-apple-tertiary" />
            {(['all', 'active', 'done', 'late'] as FilterKey[]).map(k => (
              <FilterChip key={k} k={k} label={k.charAt(0).toUpperCase() + k.slice(1)} counts={mCounts} />
            ))}
          </div>
        </div>
      </div>

      {/* Quarter rows — parallel aligned */}
      {allQuarters.map(quarter => {
        const sItems = sFiltered.filter(d => d.quarter === quarter).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        const mItems = mFiltered.filter(d => d.quarter === quarter).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        if (sItems.length === 0 && mItems.length === 0) return null;
        return (
          <div key={quarter} className="grid gap-x-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {/* Shalini quarter col */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2 pb-1">
                <span className="text-[12px] font-semibold text-white tracking-tight">{quarter}</span>
                <span className="text-[10.5px] text-apple-tertiary font-mono">
                  {shaliniDeliverables.filter(d => d.quarter === quarter && d.status === 'Done').length}/{shaliniDeliverables.filter(d => d.quarter === quarter).length}
                </span>
              </div>
              <div className="space-y-1.5">
                {sItems.length > 0 ? sItems.map(del => <DeliverableRow key={del.id} del={del} />) : (
                  <p className="text-[12px] text-apple-tertiary italic py-2">No items for this filter</p>
                )}
              </div>
            </div>
            {/* Miral quarter col */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2 pb-1">
                <span className="text-[12px] font-semibold text-white tracking-tight">{quarter}</span>
                <span className="text-[10.5px] text-apple-tertiary font-mono">
                  {miralDeliverables.filter(d => d.quarter === quarter && d.status === 'Done').length}/{miralDeliverables.filter(d => d.quarter === quarter).length}
                </span>
              </div>
              <div className="space-y-1.5">
                {mItems.length > 0 ? mItems.map(del => <DeliverableRow key={del.id} del={del} />) : (
                  <p className="text-[12px] text-apple-tertiary italic py-2">No items for this filter</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  ProgressColumn — header, progress, filters shared by both views           */
/* -------------------------------------------------------------------------- */

interface ProgressColumnProps {
  title: string;
  subtitle: string;
  avatar?: React.ReactNode;
  counts: Record<FilterKey, number>;
  totalDone: number;
  totalCount: number;
  totalPct: number;
  filter: FilterKey;
  setFilter: (f: FilterKey) => void;
  children: React.ReactNode;
}

const ProgressColumn: React.FC<ProgressColumnProps> = ({
  title,
  subtitle,
  avatar,
  counts,
  totalDone,
  totalCount,
  totalPct,
  filter,
  setFilter,
  children
}) => {
  const FilterChip = ({ k, label }: { k: FilterKey; label: string }) => (
    <button
      onClick={() => setFilter(k)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] transition-colors ${
        filter === k
          ? 'bg-white text-apple-base font-semibold'
          : 'bg-white/[0.04] text-apple-secondary hover:text-white/85 hover:bg-white/[0.06] border border-white/[0.06]'
      }`}
    >
      <span>{label}</span>
      <span className={`text-[10.5px] font-mono tabular-nums ${filter === k ? 'text-apple-base/60' : 'text-apple-tertiary'}`}>
        {counts[k]}
      </span>
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        {/* Column header */}
        <div className="px-4 sm:px-5 py-3.5 flex items-center gap-3 border-b border-white/[0.05]">
          {avatar}
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-white tracking-tight leading-none">{title}</p>
            {subtitle && (
              <p className="text-[10.5px] text-apple-tertiary mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex-1" />
          <span className="text-[10.5px] font-mono text-apple-tertiary tabular-nums">
            {totalDone}/{totalCount} · {Math.round(totalPct)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="px-4 sm:px-5 pt-3.5">
          <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400/70 rounded-full transition-all duration-500"
              style={{ width: `${totalPct}%` }}
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="px-4 sm:px-5 py-3 flex items-center gap-2 flex-wrap">
          <Filter size={12} className="text-apple-tertiary" />
          <FilterChip k="all" label="All" />
          <FilterChip k="active" label="Active" />
          <FilterChip k="done" label="Done" />
          <FilterChip k="late" label="Late" />
        </div>
      </div>

      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  DeliverableList                                                            */
/* -------------------------------------------------------------------------- */

interface DeliverableListProps {
  items: DeliverableItem[];
  onStatusChange: (id: string, status: DeliverableItem['status']) => void;
  showOwner: boolean;
}

const DeliverableList: React.FC<DeliverableListProps> = ({ items, onStatusChange, showOwner }) => {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 flex flex-col items-center text-center">
        <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-2.5">
          <Milestone size={16} className="text-apple-gray" />
        </div>
        <p className="text-[13px] text-white/90 font-medium">Nothing here</p>
        <p className="text-[12px] text-apple-secondary mt-1 max-w-xs">
          No deliverables match this filter.
        </p>
      </div>
    );
  }

  // Group by quarter for the researcher view
  const grouped = items.reduce<Record<string, DeliverableItem[]>>((acc, d) => {
    if (!acc[d.quarter]) acc[d.quarter] = [];
    acc[d.quarter].push(d);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([quarter, list]) => (
        <section key={quarter} className="space-y-2">
          <div className="flex items-baseline gap-2 pb-1">
            <span className="text-[12px] font-semibold text-white tracking-tight">{quarter}</span>
            <span className="text-[10.5px] text-apple-tertiary font-mono">
              {list.filter(d => d.status === 'Done').length}/{list.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {list.map(del => {
              const isLate =
                new Date(del.dueDate).getTime() < new Date().getTime() && del.status !== 'Done';
              const displayedStatus = isLate && del.status !== 'Done' ? 'Late' : del.status;
              const dueObj = new Date(del.dueDate + 'T00:00:00');
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const daysUntil = Math.ceil((dueObj.getTime() - today.getTime()) / 86_400_000);
              const isT = dueObj.toDateString() === today.toDateString();
              const dueLabel = isT
                ? 'Today'
                : dueObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              const daysLabel = isT
                ? 'today'
                : daysUntil < 0
                ? `${Math.abs(daysUntil)}d overdue`
                : daysUntil === 1
                ? 'tomorrow'
                : `in ${daysUntil}d`;

              return (
                <div
                  key={del.id}
                  className="group flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] px-3 py-2.5 transition-colors"
                >
                  <div className="flex flex-col items-start w-14 shrink-0">
                    <span className="text-[12px] font-mono text-white tabular-nums font-semibold leading-none">
                      {dueLabel}
                    </span>
                    <span className="text-[9.5px] text-apple-tertiary uppercase tracking-[0.06em] mt-1">
                      {daysLabel}
                    </span>
                  </div>
                  <span className="text-[13px] text-white flex-1 min-w-0 font-medium leading-snug">
                    {del.name}
                    {showOwner && (
                      <span className="ml-2 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-white/[0.05] text-apple-secondary border border-white/10 align-middle">
                        {del.owner}
                      </span>
                    )}
                  </span>
                  <div className="w-32 shrink-0 flex justify-end">
                    <select
                      value={displayedStatus}
                      onChange={e => onStatusChange(del.id, e.target.value as DeliverableItem['status'])}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold outline-none cursor-pointer border ${getStatusStyle(displayedStatus)} appearance-none`}
                      aria-label="Status"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s} className="bg-apple-surface text-white">
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};