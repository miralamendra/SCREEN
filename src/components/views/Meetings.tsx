import React, { useEffect, useState, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Download, Plus, ExternalLink, MapPin, CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useLocation } from 'react-router-dom';

const renderFormattedDescription = (text: string) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  let currentListType: 'ul' | 'ol' | null = null;
  let currentListItems: string[] = [];

  const flushList = (key: string | number) => {
    if (currentListItems.length === 0) return;
    if (currentListType === 'ul') {
      elements.push(
        <ul key={`ul-${key}`} className="list-disc pl-5 my-1.5 space-y-1 text-[12.5px] text-white/85 leading-relaxed">
          {currentListItems.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      );
    } else if (currentListType === 'ol') {
      elements.push(
        <ol key={`ol-${key}`} className="list-decimal pl-5 my-1.5 space-y-1 text-[12.5px] text-white/85 leading-relaxed">
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
          <p key={`p-${idx}`} className="text-[12.5px] text-white/85 leading-relaxed my-1 break-words whitespace-pre-wrap">
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
import { ManageCategoriesModal } from '../ui/ManageCategoriesModal';

const ATTENDEES = ['Shalini', 'Miral', 'Dr. Chathura'] as const;

const formatTime12h = (timeStr: string) => {
  if (!timeStr) return '';
  const [hoursStr, minutesStr] = timeStr.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || '00';
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${hours}:${minutes} ${ampm}`;
};

interface MeetingsProps {
  newMeetingTrigger?: number;
}

export const Meetings: React.FC<MeetingsProps> = ({ newMeetingTrigger }) => {
  const { role, data, addMeeting, exportToCSV } = useWorkspace();
  const { push } = useToast();
  const { meetings, categories } = data;
  const location = useLocation();

  useEffect(() => {
    if (location.state?.highlightMeetingId) {
      const meetId = location.state.highlightMeetingId;
      setTimeout(() => {
        const el = document.getElementById(`meeting-row-${meetId}`);
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

  const [isOpen, setIsOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [locationLink, setLocationLink] = useState('');
  const [date, setDate] = useState((() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })());
  const [time, setTime] = useState('10:00');
  const [attendees, setAttendees] = useState<('Miral' | 'Shalini' | 'Dr. Chathura')[]>([]);
  const [outcome, setOutcome] = useState('');

  const outcomeRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (outcomeRef.current) {
      outcomeRef.current.style.height = 'auto';
      outcomeRef.current.style.height = `${outcomeRef.current.scrollHeight}px`;
    }
  }, [outcome, isOpen]);

  useEffect(() => {
    if (newMeetingTrigger && newMeetingTrigger > 0) setIsOpen(true);
  }, [newMeetingTrigger]);

  const activePerson = role === 'shalini' ? 'Shalini' : 'Miral';
  const myMeetings = role === 'supervisor'
    ? meetings
    : meetings.filter(m => m.attendees.includes(activePerson) || m.attendees.includes('Dr. Chathura'));

  const handleDateClick = (dateStr: string) => {
    const meet = myMeetings.find(m => m.date === dateStr);
    if (meet) {
      setTimeout(() => {
        const el = document.getElementById(`meeting-row-${meet.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('bg-emerald-500/10', 'border-emerald-500/30', 'shadow-[0_0_12px_rgba(16,185,129,0.15)]');
          setTimeout(() => {
            el.classList.remove('bg-emerald-500/10', 'border-emerald-500/30', 'shadow-[0_0_12px_rgba(16,185,129,0.15)]');
          }, 2000);
        }
      }, 50);
    }
  };

  const reset = () => {
    setTitle('');
    setLocationLink('');
    setOutcome('');
    setAttendees([]);
    setDate((() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })());
    setTime('10:00');
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addMeeting({
      date,
      time,
      category,
      title: title.trim(),
      locationLink: locationLink.trim(),
      attendees: attendees.length > 0 ? attendees : [activePerson],
      outcome: outcome.trim()
    });

    push('Meeting saved');
    reset();
  };

  const handleAttendeeToggle = (name: 'Miral' | 'Shalini' | 'Dr. Chathura') => {
    setAttendees(prev => (prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]));
  };

  const getPersonLabel = (name: string) => {
    if (name === 'Dr. Chathura') return 'Supervisor';
    if (name === 'Shalini') return 'Study 1';
    return 'Study 2';
  };

  // Sort meetings chronologically: upcoming (asc) → past (desc)
  const now = Date.now();
  const sorted = [...myMeetings].sort((a, b) => {
    const dateA = a.time ? `${a.date}T${a.time}:00` : `${a.date}T00:00:00`;
    const dateB = b.time ? `${b.date}T${b.time}:00` : `${b.date}T00:00:00`;
    const ta = new Date(dateA).getTime();
    const tb = new Date(dateB).getTime();
    const aFuture = ta >= now;
    const bFuture = tb >= now;
    if (aFuture && !bFuture) return -1;
    if (!aFuture && bFuture) return 1;
    if (aFuture) return ta - tb;
    return tb - ta;
  });

  // Group by date
  const groupedMeetings = sorted.reduce((acc, m) => {
    if (!acc[m.date]) acc[m.date] = [];
    acc[m.date].push(m);
    return acc;
  }, {} as Record<string, typeof sorted>);

  const sortedDates = Object.keys(groupedMeetings).sort((a, b) => b.localeCompare(a));
  const today = new Date();
  const todayStr = today.toDateString();

  return (
    <div className="fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10.5px] font-semibold tracking-[0.18em] uppercase text-apple-secondary mb-2">
            Workspace
          </p>
          <h1 className="text-[30px] sm:text-[34px] font-semibold tracking-[-0.025em] text-white leading-none">
            Schedule & Events
          </h1>
          <p className="text-[13.5px] text-apple-gray mt-2.5">
            Log your upcoming and past events, schedules, and other work.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportToCSV('meetings')}
            className="h-9 px-3.5 inline-flex items-center gap-2 rounded-lg bg-white/[0.04] text-[13px] font-medium text-white hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] transition-all"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="h-9 px-3.5 inline-flex items-center gap-2 rounded-lg bg-white/[0.08] text-white/95 border border-white/[0.08] hover:bg-white/[0.12] hover:border-white/[0.14] text-[13px] font-semibold animate-pulse-emerald-btn transition-all shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
          >
            <Plus size={14} />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Form */}
      {isOpen && (
        <div className="rounded-xl border border-white/[0.1] bg-apple-surface/60 p-5 sm:p-6 space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.3)] fade-in">
          <div className="flex items-center gap-2 pb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <p className="text-[10.5px] font-semibold tracking-[0.18em] uppercase text-white/85">
              New meeting
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[14px] text-white/95 focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-1.5">
                  Time
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[14px] text-white/95 focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none"
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
                    className="text-[10px] text-apple-secondary hover:text-white transition-colors"
                  >
                    Manage
                  </button>
                </div>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[14px] text-white/95 focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none appearance-none cursor-pointer"
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
                Title
              </label>
              <input
                type="text"
                required
                placeholder="Meeting subject..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[14px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-1.5">
                Location or link
              </label>
              <input
                type="text"
                placeholder="Zoom link or room name..."
                value={locationLink}
                onChange={e => setLocationLink(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[14px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-2">
                Attendees
              </label>
              <div className="flex flex-wrap gap-4">
                {ATTENDEES.map(name => (
                  <label key={name} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={attendees.includes(name)}
                      onChange={() => handleAttendeeToggle(name)}
                      className="rounded border-white/[0.12] bg-white/[0.04] text-white focus:ring-0 focus:ring-offset-0 cursor-pointer accent-white"
                    />
                    <span className="text-[12.5px] text-apple-secondary group-hover:text-white/85 transition-colors">
                      {getPersonLabel(name)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold tracking-[0.08em] uppercase text-white/80 mb-1.5">
                Outcome notes
              </label>
              <textarea
                ref={outcomeRef}
                placeholder="Key decisions or action items..."
                value={outcome}
                onChange={e => setOutcome(e.target.value)}
                style={{ minHeight: '60px', height: 'auto' }}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-md text-[14px] text-white/95 placeholder:text-apple-tertiary focus:border-white/[0.2] focus:bg-white/[0.06] transition-colors outline-none resize-none"
              />
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
                className="px-4 py-1.5 bg-white text-apple-base rounded-md text-[12.5px] font-semibold hover:bg-white/90 transition-colors"
              >
                Save meeting
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Meetings list with mini calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-start">
      {myMeetings.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3">
            <CalendarDays size={18} className="text-apple-gray" />
          </div>
          <p className="text-[14px] text-white/90 font-medium">No meetings scheduled</p>
          <p className="text-[12.5px] text-apple-secondary mt-1 max-w-xs">
            Click "New meeting" to schedule a supervisor review, field visit, or workshop.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedDates.map(dateKey => {
            const isUpcoming = new Date(dateKey).getTime() >= now;
            const isT = new Date(dateKey + 'T00:00:00').toDateString() === todayStr;
            const dateObj = new Date(dateKey + 'T00:00:00');
            const dayLabel = isT
              ? 'Today'
              : isUpcoming
              ? dateObj.toLocaleDateString(undefined, { weekday: 'long' })
              : dateObj.toLocaleDateString(undefined, { weekday: 'long' });
            const fullDate = dateObj.toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <section key={dateKey}>
                <div className="flex items-baseline gap-3 mb-4 pb-3 border-b border-white/[0.06]">
                  <div className="flex flex-col">
                    <span className="text-[15px] font-semibold text-white tracking-tight leading-none">
                      {dayLabel}
                      {isT && (
                        <span className="ml-2 text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-accent-soft text-emerald-400/80">
                          Now
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] font-mono text-apple-secondary tabular-nums mt-1">
                      {fullDate}
                    </span>
                  </div>
                  <div className="flex-1" />
                  {isUpcoming && !isT && (
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-accent-soft text-emerald-400/80">
                      Upcoming
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {groupedMeetings[dateKey].map(meet => {
                    const isUrl = meet.locationLink?.startsWith('http');

                    return (
                      <div
                        key={meet.id}
                        id={`meeting-row-${meet.id}`}
                        className="rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] p-4 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div 
                              className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" 
                              style={{ backgroundColor: categories.find(c => c.name === meet.category)?.color || '#9ca3af' }} 
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[14.5px] text-white font-medium leading-snug">
                                {meet.title}
                              </p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border uppercase tracking-[0.06em]"
                                  style={{ 
                                    color: categories.find(c => c.name === meet.category)?.color || '#9ca3af',
                                    borderColor: categories.find(c => c.name === meet.category)?.color || '#9ca3af',
                                    backgroundColor: (categories.find(c => c.name === meet.category)?.color || '#9ca3af') + '1A'
                                  }}
                                >
                                  {meet.category}
                                </span>
                                <span className="text-apple-tertiary text-[10px]">·</span>
                                <span className="text-[12px] text-apple-secondary">
                                  {meet.attendees.map(getPersonLabel).join(', ')}
                                </span>
                                {meet.time && (
                                  <>
                                    <span className="text-apple-tertiary text-[10px]">·</span>
                                    <span className="text-[12px] text-white/90 inline-flex items-center gap-1 font-mono">
                                      <Clock size={11} className="text-apple-tertiary" />
                                      <span>{formatTime12h(meet.time)}</span>
                                    </span>
                                  </>
                                )}
                                {meet.locationLink && !isUrl && (
                                  <>
                                    <span className="text-apple-tertiary text-[10px]">·</span>
                                    <span className="text-[12px] text-apple-secondary inline-flex items-center gap-1">
                                      <MapPin size={10} />
                                      <span>{meet.locationLink}</span>
                                    </span>
                                  </>
                                )}
                              </div>
                              {meet.outcome && (
                                <div className="mt-3 pl-3 border-l-2 border-white/[0.12] space-y-1">
                                  {renderFormattedDescription(meet.outcome)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {meet.locationLink && isUrl && (
                            <div className="self-end sm:self-start shrink-0">
                              <a
                                href={meet.locationLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition-colors text-[12px] font-semibold"
                              >
                                <ExternalLink size={12} />
                                <span>Join Meeting</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Mini calendar sidebar */}
      <div className="hidden lg:block">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sticky top-4">
          <MiniCalendar meetings={myMeetings} onDateClick={handleDateClick} />
        </div>
      </div>
      </div>
      
      {isManageCategoriesOpen && (
        <ManageCategoriesModal onClose={() => setIsManageCategoriesOpen(false)} />
      )}
    </div>
  );
};

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

interface MiniCalendarProps {
  meetings: typeof import('../../data/initialState').initialWorkspaceData.meetings;
  onDateClick?: (dateStr: string) => void;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ meetings, onDateClick }) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthStart = new Date(year, month, 1);
  let startDow = monthStart.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const monthEnd = new Date(year, month + 1, 0);
  const totalDays = monthEnd.getDate();

  const days: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) {
    days.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    days.push(new Date(year, month, d));
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = MONTH_NAMES[month];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-white">
        <span className="text-[12.5px] font-semibold tracking-tight">{monthName} {year}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-white/[0.06] text-apple-secondary hover:text-white transition-colors cursor-pointer">
            <ChevronLeft size={14} />
          </button>
          <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-white/[0.06] text-apple-secondary hover:text-white transition-colors cursor-pointer">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1.5 text-center">
        {WEEKDAY_LABELS.map(label => (
          <span key={label} className="text-[10px] font-medium text-apple-tertiary uppercase tracking-wider">
            {label.charAt(0)}
          </span>
        ))}
        {days.map((dateVal, idx) => {
          if (!dateVal) return <div key={`empty-${idx}`} />;
          const isToday = sameDay(dateVal, today);
          const hasMeeting = meetings.some(m => {
            const mDate = new Date(m.date + 'T00:00:00');
            return sameDay(mDate, dateVal);
          });
          const dateStr = `${dateVal.getFullYear()}-${String(dateVal.getMonth() + 1).padStart(2, '0')}-${String(dateVal.getDate()).padStart(2, '0')}`;

          return (
            <div 
              key={idx} 
              onClick={() => hasMeeting && onDateClick && onDateClick(dateStr)}
              className={`relative flex flex-col items-center justify-center py-1 rounded transition-colors ${
                hasMeeting ? 'cursor-pointer hover:bg-white/[0.06]' : ''
              }`}
            >
              <span className={`text-[12px] tabular-nums font-medium h-5 w-5 rounded-full flex items-center justify-center ${
                isToday ? 'bg-white text-apple-base font-bold' : 'text-white/90'
              }`}>
                {dateVal.getDate()}
              </span>
              {hasMeeting && !isToday && (
                <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
