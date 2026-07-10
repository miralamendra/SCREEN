import React, { useMemo } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { AlertCircle, Milestone, CalendarDays, TrendingUp, Activity } from 'lucide-react';
import { SupervisorHistory } from './SupervisorHistory';
import { Avatar } from '../ui/Avatar';

/* ─────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────── */

const localDateStr = (d: Date = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatTime12h = (timeStr: string) => {
  if (!timeStr) return '';
  const [hoursStr, minutesStr] = timeStr.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || '00';
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
};

const todayStr = () => localDateStr();

const getWeekBounds = () => {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
};

/* ─────────────────────────────────────────────────────────────────
   ProgressRing — thin SVG ring showing 0–100%
───────────────────────────────────────────────────────────────── */
const ProgressRing: React.FC<{ pct: number; size?: number; stroke?: number; color?: string }> = ({
  pct, size = 40, stroke = 3, color = '#34d399'
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeDasharray={circ}
        strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MiniBar — tiny categorical activity bar
───────────────────────────────────────────────────────────────── */
const MiniBar: React.FC<{ label: string; count: number; total: number; color: string }> = ({
  label, count, total, color
}) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[11.5px] text-white/75 flex-1 truncate">{label}</span>
      <div className="w-20 h-1 bg-white/[0.05] rounded-full overflow-hidden shrink-0">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] font-mono text-apple-secondary tabular-nums w-4 text-right shrink-0">{count}</span>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   StudyCard — full researcher overview card
───────────────────────────────────────────────────────────────── */
interface StudyCardProps {
  person: 'Shalini' | 'Miral';
  studyLabel: string;
  studyNum: string;
  weekLogDays: number;
  totalLogs: number;
  deliverablesDone: number;
  deliverablesTotal: number;
  nextDeliverable: { name: string; dueDate: string; daysRemaining: number } | null;
  inProgressDeliverables: string[];
  categories: { name: string; count: number; color: string }[];
}

const StudyCard: React.FC<StudyCardProps> = ({
  person, studyLabel, studyNum, weekLogDays, totalLogs,
  deliverablesDone, deliverablesTotal, nextDeliverable,
  inProgressDeliverables, categories
}) => {
  const progressPct = deliverablesTotal > 0 ? (deliverablesDone / deliverablesTotal) * 100 : 0;
  const isUrgent = nextDeliverable && nextDeliverable.daysRemaining < 30;
  const totalCatLogs = categories.reduce((a, c) => a + c.count, 0);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden flex flex-col">
      {/* ── Card header ── */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-white/[0.05]">
        <Avatar name={person} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[15px] font-semibold text-white tracking-tight leading-none">{person}</h2>
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-apple-tertiary">{studyNum}</span>
          </div>
          <p className="text-[11px] text-apple-secondary mt-0.5 truncate">{studyLabel}</p>
        </div>
        {/* Progress ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <ProgressRing pct={progressPct} size={44} stroke={3} />
          <span className="absolute text-[10px] font-semibold font-mono text-white tabular-nums">
            {Math.round(progressPct)}%
          </span>
        </div>
      </div>

      {/* ── Stat row ── */}
      <div className="grid grid-cols-3 divide-x divide-white/[0.04] border-b border-white/[0.04]">
        <div className="px-4 py-3 flex flex-col items-center gap-0.5">
          <span className="text-[20px] font-semibold text-white tabular-nums leading-none">{weekLogDays}</span>
          <span className="text-[9.5px] text-apple-tertiary uppercase tracking-[0.1em] font-medium">days/week</span>
        </div>
        <div className="px-4 py-3 flex flex-col items-center gap-0.5">
          <span className="text-[20px] font-semibold text-white tabular-nums leading-none">{totalLogs}</span>
          <span className="text-[9.5px] text-apple-tertiary uppercase tracking-[0.1em] font-medium">all logs</span>
        </div>
        <div className="px-4 py-3 flex flex-col items-center gap-0.5">
          <span className="text-[20px] font-semibold text-white tabular-nums leading-none">
            {deliverablesDone}<span className="text-[13px] text-apple-tertiary">/{deliverablesTotal}</span>
          </span>
          <span className="text-[9.5px] text-apple-tertiary uppercase tracking-[0.1em] font-medium">done</span>
        </div>
      </div>

      {/* ── In-progress deliverable ── */}
      {inProgressDeliverables.length > 0 && (
        <div className="px-5 py-3 border-b border-white/[0.04]">
          <p className="text-[9.5px] uppercase tracking-[0.14em] font-semibold text-apple-tertiary mb-2">In progress</p>
          <div className="space-y-1.5">
            {inProgressDeliverables.map((name, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400/70 shrink-0 animate-pulse" />
                <span className="text-[12.5px] text-white/90 leading-snug">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Next deadline ── */}
      {nextDeliverable && (
        <div className={`px-5 py-3 border-b border-white/[0.04] ${isUrgent ? 'bg-amber-400/[0.04]' : ''}`}>
          <p className="text-[9.5px] uppercase tracking-[0.14em] font-semibold text-apple-tertiary mb-2">Next deadline</p>
          <div className="flex items-start justify-between gap-2">
            <p className="text-[12.5px] text-white/90 leading-snug flex-1">{nextDeliverable.name}</p>
            <div className="text-right shrink-0">
              <span className={`text-[18px] font-semibold tabular-nums leading-none ${isUrgent ? 'text-amber-400' : 'text-white'}`}>
                {nextDeliverable.daysRemaining}
              </span>
              <p className="text-[9px] text-apple-tertiary uppercase tracking-[0.08em]">days</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <CalendarDays size={10} className="text-apple-tertiary" />
            <span className="text-[10.5px] font-mono text-apple-secondary">
              {new Date(nextDeliverable.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {isUrgent && (
              <span className="ml-1 flex items-center gap-1 text-[10px] text-amber-400/90 font-semibold">
                <AlertCircle size={9} />Due soon
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Activity breakdown ── */}
      {categories.length > 0 && (
        <div className="px-5 py-3 flex-1">
          <p className="text-[9.5px] uppercase tracking-[0.14em] font-semibold text-apple-tertiary mb-2.5">This week's activity</p>
          <div className="space-y-1.5">
            {categories.map(c => (
              <MiniBar key={c.name} label={c.name} count={c.count} total={totalCatLogs} color={c.color} />
            ))}
          </div>
        </div>
      )}
      {categories.length === 0 && (
        <div className="px-5 py-4 flex-1 flex items-center gap-2 text-apple-tertiary">
          <Activity size={13} />
          <span className="text-[12px]">No logs this week</span>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   Overview — main export
───────────────────────────────────────────────────────────────── */
export const Overview: React.FC = () => {
  const { data } = useWorkspace();
  const { dailyLogs, deliverables, meetings, categories } = data;

  const { monday, sunday } = useMemo(getWeekBounds, []);
  const today = todayStr();

  /* Per-person helpers */
  const buildPersonStats = (person: 'Miral' | 'Shalini') => {
    const myLogs = dailyLogs.filter(l => l.person === person);
    const weekLogs = myLogs.filter(l => {
      const d = new Date(l.date);
      return d >= monday && d <= sunday;
    });
    const weekLogDays = new Set(weekLogs.map(l => l.date)).size;

    const myDeliverables = deliverables.filter(d => d.owner === person);
    const deliverablesDone = myDeliverables.filter(d => d.status === 'Done').length;
    const inProgressDeliverables = myDeliverables
      .filter(d => d.status === 'In progress')
      .map(d => d.name);

    const nextDeliverable = (() => {
      const sorted = [...myDeliverables]
        .filter(d => d.status !== 'Done')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      if (!sorted.length) return null;
      const n = sorted[0];
      const days = Math.ceil((new Date(n.dueDate).getTime() - Date.now()) / 86_400_000);
      return { name: n.name, dueDate: n.dueDate, daysRemaining: days };
    })();

    // Category breakdown for this week
    const catCounts: Record<string, number> = {};
    weekLogs.forEach(l => { catCounts[l.category] = (catCounts[l.category] || 0) + 1; });
    const catList = Object.entries(catCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        color: categories.find(c => c.name === name)?.color || '#9ca3af'
      }));

    return {
      weekLogDays,
      totalLogs: myLogs.length,
      deliverablesDone,
      deliverablesTotal: myDeliverables.length,
      nextDeliverable,
      inProgressDeliverables,
      categories: catList,
    };
  };

  const shalini = useMemo(() => buildPersonStats('Shalini'), [dailyLogs, deliverables, categories]);
  const miral = useMemo(() => buildPersonStats('Miral'), [dailyLogs, deliverables, categories]);

  /* Overall stats */
  const totalDone = deliverables.filter(d => d.status === 'Done').length;
  const totalDels = deliverables.length;
  const overallPct = totalDels > 0 ? (totalDone / totalDels) * 100 : 0;
  const lateCount = deliverables.filter(d => d.status === 'Late').length;
  const inProgressCount = deliverables.filter(d => d.status === 'In progress').length;

  const nextMeeting = useMemo(() => {
    const now = Date.now();
    return [...meetings]
      .filter(m => {
        const dateStr = m.time ? `${m.date}T${m.time}:00` : `${m.date}T23:59:59`;
        return new Date(dateStr).getTime() >= now;
      })
      .sort((a, b) => {
        const dateA = a.time ? `${a.date}T${a.time}:00` : `${a.date}T00:00:00`;
        const dateB = b.time ? `${b.date}T${b.time}:00` : `${b.date}T00:00:00`;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      })[0] ?? null;
  }, [meetings]);



  return (
    <div className="fade-in space-y-10 pb-10">

      {/* ── Page header ── */}
      <div>
        <p className="text-[10.5px] font-semibold tracking-[0.18em] uppercase text-apple-secondary mb-2">
          Review Portal
        </p>
        <h1 className="text-[30px] sm:text-[34px] font-semibold tracking-[-0.025em] text-white leading-none">
          Overview
        </h1>
        <p className="text-[13.5px] text-apple-gray mt-2.5 max-w-lg">
          Real-time progress across both research studies.
        </p>
      </div>

      {/* ── Command strip — 3 key metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          {
            icon: Milestone,
            label: 'Overall progress',
            value: `${Math.round(overallPct)}%`,
            sub: `${totalDone} of ${totalDels} delivered`,
            tone: lateCount > 0 ? 'warning' as const : 'default' as const
          },
          {
            icon: TrendingUp,
            label: 'In progress',
            value: inProgressCount,
            sub: `${lateCount} late`,
            tone: lateCount > 0 ? 'warning' as const : 'success' as const
          },
          {
            icon: CalendarDays,
            label: 'Next meeting',
            value: nextMeeting
              ? `${new Date(nextMeeting.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}${nextMeeting.time ? ' @ ' + formatTime12h(nextMeeting.time) : ''}`
              : '-',
            sub: nextMeeting?.title?.slice(0, 32) ?? 'Nothing scheduled',
            tone: 'default' as const
          }
        ].map(({ icon: Icon, label, value, sub, tone }) => (
          <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 hover:bg-white/[0.03] transition-colors">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon size={11} className="text-apple-tertiary" />
              <span className="text-[9.5px] font-semibold tracking-[0.14em] uppercase text-apple-secondary">{label}</span>
            </div>
            <div className={`text-[22px] font-semibold tabular-nums leading-none tracking-tight ${
              tone === 'warning' ? 'text-amber-400/90' :
              tone === 'success' ? 'text-emerald-400/90' : 'text-white'
            }`}>
              {value}
            </div>
            <p className="text-[10.5px] text-apple-tertiary mt-1.5 leading-snug truncate">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Study cards — side by side ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[15px] font-semibold text-white tracking-tight">Research Studies</h2>
          <span className="text-[11px] text-apple-tertiary">· {today}</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StudyCard
            person="Shalini"
            studyNum="Study 1"
            studyLabel="GenAI Application for HEC Coexistence"
            {...shalini}
          />
          <StudyCard
            person="Miral"
            studyNum="Study 2"
            studyLabel="Serious Game for HEC Awareness"
            {...miral}
          />
        </div>
      </section>

      {/* ── Full history ── */}
      <SupervisorHistory />
    </div>
  );
};
