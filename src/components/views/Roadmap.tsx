import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Download, CheckCircle2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

export const Roadmap: React.FC = () => {
  const { role, data, exportToCSV } = useWorkspace();
  const { roadmaps, deliverables } = data;

  const isSupervisor = role === 'supervisor';
  const activePerson: 'Miral' | 'Shalini' = role === 'shalini' ? 'Shalini' : 'Miral';
  const getStatusColor = (s: string) => {
    if (s === 'Done') return 'text-emerald-300 bg-emerald-400/[0.08] border-emerald-400/15';
    if (s === 'In progress') return 'text-blue-300 bg-blue-400/[0.08] border-blue-400/15';
    if (s === 'Late') return 'text-red-300 bg-red-400/[0.08] border-red-400/15';
    return 'text-white/70 bg-white/[0.05] border-white/[0.08]';
  };

  const renderPhaseCard = (phase: typeof roadmaps[0], ownerDeliverables: typeof deliverables, idx: number) => {
    const phaseDeliverables = ownerDeliverables.filter(
      d => d.quarter.trim().toLowerCase() === phase.quarter.trim().toLowerCase()
    );
    const doneCount = phaseDeliverables.filter(d => d.status === 'Done').length;
    const totalCount = phaseDeliverables.length;
    const pct = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
    const isCurrent = idx === 0;

    return (
      <section key={phase.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <div className="px-4 sm:px-5 py-4 flex items-baseline gap-3 border-b border-white/[0.05]">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-white tracking-tight leading-none">{phase.quarter}</span>
              {isCurrent && (
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-accent-soft text-emerald-400/80">
                  Current
                </span>
              )}
            </div>
            <span className="text-[11px] text-apple-tertiary mt-1">{phase.theme}</span>
          </div>
          <div className="flex-1" />
          {totalCount > 0 && (
            <span className="text-[11px] text-apple-secondary font-mono tabular-nums font-semibold">
              {doneCount}/{totalCount} · {Math.round(pct)}%
            </span>
          )}
        </div>
        {totalCount > 0 && (
          <div className="px-4 sm:px-5 pt-3">
            <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400/60 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
        <div className="p-4 sm:p-5 space-y-4">
          <ul className="space-y-1.5">
            {phase.activities.map((activity, i) => (
              <li key={i} className="flex items-start gap-3 py-1 text-[13.5px] text-white/85 leading-relaxed">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-white/[0.04] border border-white/[0.08] shrink-0 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-white/50" />
                </span>
                <span>{activity}</span>
              </li>
            ))}
          </ul>
          {phaseDeliverables.length > 0 && (
            <div className="pt-4 border-t border-white/[0.06]">
              <p className="text-[10.5px] font-semibold tracking-[0.18em] uppercase text-apple-secondary mb-3">
                Checkpoints
              </p>
              <div className="divide-y divide-white/[0.04]">
                {phaseDeliverables.map(del => {
                  const isLate = new Date(del.dueDate).getTime() < new Date().getTime() && del.status !== 'Done';
                  const displayedStatus = isLate && del.status !== 'Done' ? 'Late' : del.status;
                  const dueObj = new Date(del.dueDate + 'T00:00:00');
                  return (
                    <div key={del.id} className="flex items-center gap-3 py-2.5">
                      {displayedStatus === 'Done' ? (
                        <CheckCircle2 size={14} className="text-emerald-400/80 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-white/[0.18] shrink-0" />
                      )}
                      <span className="text-[13.5px] text-white/90 flex-1 leading-snug">{del.name}</span>
                      <span className="text-[11px] font-mono text-apple-secondary tabular-nums shrink-0 hidden sm:inline">
                        {dueObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-[0.06em] shrink-0 ${getStatusColor(displayedStatus)}`}>
                        {displayedStatus}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  };

  const shaliniRoadmaps = roadmaps.filter(r => r.owner === 'Shalini');
  const miralRoadmaps = roadmaps.filter(r => r.owner === 'Miral');
  const shaliniDeliverables = deliverables.filter(d => d.owner === 'Shalini');
  const miralDeliverables = deliverables.filter(d => d.owner === 'Miral');

  const parseQuarter = (q: string) => {
    const match = q.match(/Q(\d)\s+(\d{4})/i);
    if (!match) return 99999;
    const qNum = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);
    return year * 10 + qNum;
  };

  // All quarters from both (union), sorted chronologically
  const allQuarters = Array.from(new Set([
    ...shaliniRoadmaps.map(r => r.quarter),
    ...miralRoadmaps.map(r => r.quarter)
  ])).sort((a, b) => parseQuarter(a) - parseQuarter(b));

  return (
    <div className="fade-in space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10.5px] font-semibold tracking-[0.18em] uppercase text-apple-secondary mb-2">
            Long view
          </p>
          <h1 className="text-[30px] sm:text-[34px] font-semibold tracking-[-0.025em] text-white leading-none">
            Roadmap
          </h1>
          <p className="text-[13.5px] text-apple-gray mt-2.5">
            Quarterly phases and planned activities
          </p>
        </div>
        <button
          onClick={() => exportToCSV('roadmap')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-apple-secondary hover:text-white/85 rounded-md hover:bg-white/[0.04] transition-colors"
        >
          <Download size={13} />
          <span>Export</span>
        </button>
      </div>

      {isSupervisor ? (
        <div className="space-y-8">
          {/* Column headers */}
          <div className="grid gap-x-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 sm:px-5 py-3.5 flex items-center gap-3">
              <Avatar name="Shalini" size="sm" />
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-white tracking-tight leading-none">Shalini</p>
                <p className="text-[10.5px] text-apple-tertiary mt-1">Study 1: GenAI Application</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 sm:px-5 py-3.5 flex items-center gap-3">
              <Avatar name="Miral" size="sm" />
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-white tracking-tight leading-none">Miral</p>
                <p className="text-[10.5px] text-apple-tertiary mt-1">Study 2: Gamification</p>
              </div>
            </div>
          </div>

          {/* Parallel phase rows per quarter */}
          {allQuarters.map(quarter => {
            const sPhase = shaliniRoadmaps.find(r => r.quarter === quarter);
            const mPhase = miralRoadmaps.find(r => r.quarter === quarter);
            const sIdx = shaliniRoadmaps.indexOf(sPhase!);
            const mIdx = miralRoadmaps.indexOf(mPhase!);
            return (
              <div key={quarter} className="grid gap-x-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  {sPhase ? renderPhaseCard(sPhase, shaliniDeliverables, sIdx) : (
                    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-4 text-[12px] text-apple-tertiary italic">No phase for {quarter}</div>
                  )}
                </div>
                <div>
                  {mPhase ? renderPhaseCard(mPhase, miralDeliverables, mIdx) : (
                    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-4 text-[12px] text-apple-tertiary italic">No phase for {quarter}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Researcher view — single column */
        <div className="space-y-6">
          {roadmaps
            .filter(r => r.owner === activePerson)
            .map((phase, idx) => renderPhaseCard(phase, deliverables.filter(d => d.owner === activePerson), idx))}
        </div>
      )}
    </div>
  );
};