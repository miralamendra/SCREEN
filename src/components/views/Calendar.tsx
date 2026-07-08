import React, { useMemo, useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ChevronLeft, ChevronRight, CalendarDays, MapPin, ExternalLink } from 'lucide-react';
import type { DailyLogEntry, MeetingEvent } from '../../data/initialState';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];



const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const Calendar: React.FC = () => {
  const { role, data } = useWorkspace();
  const { dailyLogs, meetings, categories } = data;

  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const activePerson = role === 'shalini' ? 'Shalini' : 'Miral';

  // Researcher sees their own logs + meetings that involve them.
  // Supervisor sees everyone's logs + all meetings.
  const visibleLogs = useMemo(() => {
    if (role === 'supervisor') return dailyLogs;
    return dailyLogs.filter(l => l.person === activePerson);
  }, [dailyLogs, role, activePerson]);

  const visibleMeetings = useMemo(() => {
    if (role === 'supervisor') return meetings;
    return meetings.filter(m => m.attendees.includes(activePerson));
  }, [meetings, role, activePerson]);

  // Index entries by date
  const logsByDate = useMemo(() => {
    const acc: Record<string, DailyLogEntry[]> = {};
    visibleLogs.forEach(l => {
      (acc[l.date] = acc[l.date] || []).push(l);
    });
    return acc;
  }, [visibleLogs]);

  const meetingsByDate = useMemo(() => {
    const acc: Record<string, MeetingEvent[]> = {};
    visibleMeetings.forEach(m => {
      (acc[m.date] = acc[m.date] || []).push(m);
    });
    return acc;
  }, [visibleMeetings]);

  // Build month grid
  const monthGrid = useMemo(() => {
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);
    // Start grid on Monday
    const startWeekday = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();

    const cells: { date: Date | null; key: string }[] = [];
    for (let i = 0; i < startWeekday; i++) {
      cells.push({ date: null, key: `pad-start-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      cells.push({ date: dt, key: fmt(dt) });
    }
    // pad to fill the last row
    while (cells.length % 7 !== 0) {
      cells.push({ date: null, key: `pad-end-${cells.length}` });
    }
    return cells;
  }, [cursor]);

  const monthLabel = `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const today = new Date();

  const selectedKey = fmt(selectedDate);
  const selectedLogs = logsByDate[selectedKey] || [];
  const selectedMeetings = meetingsByDate[selectedKey] || [];

  // Monthly stats
  const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
  const monthLogCount = visibleLogs.filter(l => l.date.startsWith(monthKey)).length;
  const monthMeetingCount = visibleMeetings.filter(m => m.date.startsWith(monthKey)).length;
  const monthActiveDays = new Set(
    visibleLogs.filter(l => l.date.startsWith(monthKey)).map(l => l.date)
  ).size;

  const goPrev = () =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const goNext = () =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  const goToday = () => {
    setCursor(new Date());
    setSelectedDate(new Date());
  };

  return (
    <div className="fade-in space-y-6">
      {/* Title */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10.5px] font-medium tracking-[0.18em] uppercase text-apple-secondary mb-2">
            Schedule
          </p>
          <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-[-0.025em] text-white leading-none">
            Calendar
          </h1>
          <p className="text-[13px] text-apple-gray mt-2">
            See your logs and meetings laid out across time.
          </p>
        </div>

        {/* Month nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="px-2.5 py-1.5 text-[12px] text-apple-secondary hover:text-white/85 rounded-md hover:bg-white/[0.04] transition-colors"
          >
            Today
          </button>
          <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-md overflow-hidden">
            <button
              onClick={goPrev}
              className="p-1.5 text-apple-secondary hover:text-white hover:bg-white/[0.04] transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 text-[13px] font-medium text-white/95 tabular-nums min-w-[150px] text-center">
              {monthLabel}
            </span>
            <button
              onClick={goNext}
              className="p-1.5 text-apple-secondary hover:text-white hover:bg-white/[0.04] transition-colors"
              aria-label="Next month"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Month summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
          <p className="text-[10.5px] font-medium tracking-[0.18em] uppercase text-apple-secondary">Logs</p>
          <p className="text-[22px] font-semibold text-white tabular-nums leading-none mt-2">{monthLogCount}</p>
          <p className="text-[11px] text-apple-tertiary mt-1.5">this month</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
          <p className="text-[10.5px] font-medium tracking-[0.18em] uppercase text-apple-secondary">Active days</p>
          <p className="text-[22px] font-semibold text-white tabular-nums leading-none mt-2">{monthActiveDays}</p>
          <p className="text-[11px] text-apple-tertiary mt-1.5">logged this month</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
          <p className="text-[10.5px] font-medium tracking-[0.18em] uppercase text-apple-secondary">Meetings</p>
          <p className="text-[22px] font-semibold text-white tabular-nums leading-none mt-2">{monthMeetingCount}</p>
          <p className="text-[11px] text-apple-tertiary mt-1.5">scheduled</p>
        </div>
      </div>

      {/* Calendar grid + selected day details */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Grid */}
        <div className="lg:col-span-3 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          {/* Weekday labels */}
          <div className="grid grid-cols-7 border-b border-white/[0.06]">
            {WEEKDAY_LABELS.map(d => (
              <div
                key={d}
                className="px-2 py-2.5 text-[10.5px] font-medium tracking-[0.12em] uppercase text-apple-secondary text-center"
              >
                {d}
              </div>
            ))}
          </div>
          {/* Cells */}
          <div className="grid grid-cols-7">
            {monthGrid.map((cell, idx) => {
              if (!cell.date) {
                return <div key={cell.key} className="min-h-[88px] border-b border-r border-white/[0.04] last:border-r-0" />;
              }
              const dateStr = fmt(cell.date);
              const logCount = (logsByDate[dateStr] || []).length;
              const meetingCount = (meetingsByDate[dateStr] || []).length;
              const isToday = sameDay(cell.date, today);
              const isSelected = sameDay(cell.date, selectedDate);
              const isLastInRow = (idx + 1) % 7 === 0;
              const isLastRow = idx >= monthGrid.length - 7;

              return (
                <button
                  key={cell.key}
                  onClick={() => setSelectedDate(cell.date!)}
                  className={`min-h-[88px] text-left p-2 border-b border-r border-white/[0.04] hover:bg-white/[0.03] transition-colors group ${
                    isLastInRow ? 'border-r-0' : ''
                  } ${isLastRow ? 'border-b-0' : ''} ${
                    isSelected ? 'bg-accent-soft' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[12.5px] font-mono tabular-nums ${
                        isToday
                          ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-apple-base font-semibold'
                          : isSelected
                          ? 'text-white font-semibold'
                          : 'text-white/85'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                    {(logCount > 0 || meetingCount > 0) && (
                      <span className="text-[9.5px] font-mono text-apple-tertiary tabular-nums">
                        {logCount + meetingCount > 0 ? logCount + meetingCount : ''}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-1 flex-wrap">
                    {Array.from({ length: Math.min(logCount, 3) }).map((_, i) => {
                      const logs = logsByDate[dateStr] || [];
                      const cat = logs[i]?.category;
                      return (
                        <span
                          key={`l-${i}`}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: categories.find(c => c.name === cat)?.color || '#9ca3af' }}
                        />
                      );
                    })}
                    {Array.from({ length: Math.min(meetingCount, 2) }).map((_, i) => {
                      const meets = meetingsByDate[dateStr] || [];
                      const cat = meets[i]?.category;
                      return (
                        <span
                          key={`m-${i}`}
                          className="w-1.5 h-1.5 rounded-full ring-1 ring-white/10"
                          style={{ backgroundColor: categories.find(c => c.name === cat)?.color || '#9ca3af' }}
                        />
                      );
                    })}
                  </div>

                  {/* Truncated log preview (selected only) */}
                  {isSelected && logCount > 0 && (
                    <p className="mt-1.5 text-[10.5px] text-white/70 leading-tight line-clamp-2">
                      {logsByDate[dateStr][0].description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day details */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-[10.5px] font-medium tracking-[0.18em] uppercase text-apple-secondary">
                {selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}
              </p>
              <h2 className="text-[20px] font-semibold text-white tracking-[-0.02em] mt-1.5 leading-none">
                {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
            </div>
            {sameDay(selectedDate, today) && (
              <span className="text-[10px] font-medium tracking-wider uppercase px-1.5 py-0.5 rounded bg-accent-soft text-emerald-400/80">
                Today
              </span>
            )}
          </div>

          <div className="mt-5 space-y-5">
            {/* Meetings */}
            {selectedMeetings.length > 0 && (
              <section>
                <p className="text-[10.5px] font-medium tracking-[0.18em] uppercase text-apple-secondary mb-2.5">
                  Meetings · {selectedMeetings.length}
                </p>
                <div className="space-y-2.5">
                  {selectedMeetings.map(m => {
                    const isUrl = m.locationLink?.startsWith('http');
                    return (
                      <div
                        key={m.id}
                        className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                      >
                        <div className="flex items-start gap-2.5">
                          <span 
                            className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" 
                            style={{ backgroundColor: categories.find(c => c.name === m.category)?.color || '#9ca3af' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-white/95 leading-snug">
                              {m.title}
                            </p>
                            <p className="text-[10.5px] font-medium text-apple-secondary uppercase tracking-wider mt-1">
                              {m.category}
                            </p>
                            {m.locationLink && (
                              <div className="mt-1.5 text-[11.5px] text-apple-secondary inline-flex items-center gap-1.5">
                                {isUrl ? <ExternalLink size={10} /> : <MapPin size={10} />}
                                {isUrl ? (
                                  <a
                                    href={m.locationLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-white/85 transition-colors"
                                  >
                                    Join
                                  </a>
                                ) : (
                                  <span>{m.locationLink}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Logs */}
            {selectedLogs.length > 0 && (
              <section>
                <p className="text-[10.5px] font-medium tracking-[0.18em] uppercase text-apple-secondary mb-2.5">
                  Log entries · {selectedLogs.length}
                </p>
                <div className="space-y-2.5">
                  {selectedLogs.map(log => (
                    <div
                      key={log.id}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <span 
                          className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" 
                          style={{ backgroundColor: categories.find(c => c.name === log.category)?.color || '#9ca3af' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-white/90 leading-snug">
                            {log.description}
                          </p>
                          <p className="text-[10.5px] font-medium text-apple-secondary uppercase tracking-wider mt-1.5">
                            {log.person} · {log.category}
                          </p>
                          {log.takeaway && (
                            <div className="mt-2.5 pl-3 border-l-[1.5px] border-emerald-500/30">
                              <p className="text-[12.5px] italic text-emerald-400/90 leading-relaxed">
                                "{log.takeaway}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {selectedLogs.length === 0 && selectedMeetings.length === 0 && (
              <div className="py-12 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-2.5">
                  <CalendarDays size={16} className="text-apple-gray" />
                </div>
                <p className="text-[12.5px] text-white/85 font-medium">Nothing on this day</p>
                <p className="text-[11.5px] text-apple-secondary mt-1 max-w-[220px]">
                  Pick another day or add a log entry to fill in the journal.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-[11px] text-apple-tertiary">
        <span className="font-medium tracking-[0.06em] uppercase text-[10px] text-apple-secondary">Legend</span>
        {categories.map(cat => (
          <span key={cat.id} className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
            <span>{cat.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
};