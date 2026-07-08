import React, { useMemo } from 'react';
import type { DailyLogEntry } from '../../data/initialState';

interface WeekStripProps {
  /** ISO week id, e.g. "2026-W28". When omitted, uses the current week. */
  weekId?: string;
  /** Person whose logs we should highlight. */
  person?: 'Miral' | 'Shalini' | 'Both';
  /** All logs to consider. */
  logs: DailyLogEntry[];
}

/** Returns Monday → Sunday dates for the week containing the given date. */
const getWeekDates = (anchor: Date): Date[] => {
  const d = new Date(anchor);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0 = Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  const out: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    out.push(day);
  }
  return out;
};

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * WeekStrip — Notion/Apple-style horizontal week navigator.
 *
 * - Auto-updates based on the current date (no week selector needed).
 * - Shows logged count, today, and weekend subdued state.
 * - Pure presentational; clickable optionally.
 */
export const WeekStrip: React.FC<WeekStripProps> = ({ person = 'Both', logs }) => {
  const days = useMemo(() => getWeekDates(new Date()), []);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = fmt(today);

  const countByDate = useMemo(() => {
    const acc: Record<string, number> = {};
    logs.forEach(l => {
      if (person !== 'Both' && l.person !== person) return;
      acc[l.date] = (acc[l.date] || 0) + 1;
    });
    return acc;
  }, [logs, person]);

  const loggedCount = days.filter(d => (countByDate[fmt(d)] || 0) > 0).length;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10.5px] font-semibold tracking-[0.18em] uppercase text-apple-secondary">
          This week
        </p>
        <p className="text-[10.5px] text-apple-tertiary tabular-nums">
          {loggedCount}/5 active days
        </p>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const k = fmt(d);
          const isToday = k === todayKey;
          const isWeekend = i >= 5;
          const count = countByDate[k] || 0;
          const isLogged = count > 0;
          return (
            <div
              key={k}
              className={`flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg border transition-colors ${
                isToday
                  ? 'bg-white/[0.06] border-white/[0.14]'
                  : isLogged
                  ? 'bg-white/[0.04] border-white/[0.10]'
                  : isWeekend
                  ? 'bg-transparent border-white/[0.03]'
                  : 'bg-white/[0.015] border-white/[0.04]'
              }`}
            >
              <span
                className={`text-[9.5px] font-semibold tracking-[0.08em] uppercase ${
                  isToday ? 'text-white' : isWeekend ? 'text-apple-tertiary/70' : 'text-apple-secondary'
                }`}
              >
                {WEEKDAY_SHORT[i]}
              </span>
              <span
                className={`text-[14px] font-semibold tabular-nums leading-none ${
                  isToday ? 'text-white' : isWeekend ? 'text-apple-secondary/80' : 'text-white/95'
                }`}
              >
                {d.getDate()}
              </span>
              {/* Status dot — a single crisp dot, no extra decoration. */}
              <span
                aria-hidden="true"
                className={`w-1 h-1 rounded-full ${
                  isLogged
                    ? 'bg-emerald-400/90'
                    : isToday
                    ? 'bg-white/40'
                    : 'bg-white/[0.08]'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekStrip;