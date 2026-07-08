import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { Overview } from './views/Overview';
import { DailyLog } from './views/DailyLog';
import { WeeklyReview } from './views/WeeklyReview';
import { Deliverables } from './views/Deliverables';
import { Roadmap } from './views/Roadmap';
import { Meetings } from './views/Meetings';
import { Calendar } from './views/Calendar';
import {
  LayoutDashboard, FileText, CheckSquare,
  Milestone, CalendarDays, Compass, LogOut, ChevronRight, ArrowLeftRight,
  Search, Plus, Keyboard, ChevronDown, Check
} from 'lucide-react';
import { CommandPalette } from './ui/CommandPalette';
import { ShortcutsOverlay } from './ui/ShortcutsOverlay';
import { useGlobalKeys } from './ui/Toast';
import type { Role } from '../data/initialState';
import Dither from './ui/Dither';
import { LineSidebar } from './ui/LineSidebar';
import { Avatar } from './ui/Avatar';

type TabId = 'log' | 'review' | 'deliverables' | 'roadmap' | 'meetings' | 'overview' | 'calendar';

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

const NAV_ITEMS_RESEARCHER: NavItem[] = [
  { id: 'log', label: 'Daily Log', icon: FileText },
  { id: 'review', label: 'Weekly Review', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'deliverables', label: 'Deliverables', icon: Milestone },
  { id: 'roadmap', label: 'Roadmap', icon: Compass },
  { id: 'meetings', label: 'Schedule & Events', icon: CalendarDays },
];

const NAV_ITEMS_SUPERVISOR: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'review', label: 'Weekly Review', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'deliverables', label: 'Deliverables', icon: Milestone },
  { id: 'roadmap', label: 'Roadmap', icon: Compass },
  { id: 'meetings', label: 'Schedule & Events', icon: CalendarDays },
];

const PROFILE_META: Record<Role, {
  label: string;
  short: string;
  subtitle: string;
  avatar: 'Miral' | 'Shalini' | 'Chathura';
}> = {
  shalini: { label: 'Shalini', short: 'S', subtitle: 'Study 1: GenAI Application', avatar: 'Shalini' },
  miral: { label: 'Miral', short: 'M', subtitle: 'Study 2: Gamification', avatar: 'Miral' },
  supervisor: { label: 'Dr. Chathura', short: 'C', subtitle: 'Review Portal', avatar: 'Chathura' }
};

export const Dashboard: React.FC = () => {
  const { role, setRole, syncMode } = useWorkspace();
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<'top' | 'bottom'>('top');
  const [newLogTrigger, setNewLogTrigger] = useState(0);
  const [newMeetingTrigger, setNewMeetingTrigger] = useState(0);

  useEffect(() => {
    if (!role) navigate('/');
  }, [role, navigate]);

  const navItems = role === 'supervisor' ? NAV_ITEMS_SUPERVISOR : NAV_ITEMS_RESEARCHER;
  const fallbackTab: TabId = role === 'supervisor' ? 'overview' : 'log';
  const activeTab: TabId = (navItems.find(n => n.id === tab)?.id ?? fallbackTab) as TabId;

  const setActiveTab = useCallback((newTab: TabId) => {
    setMobileNavOpen(false);
    if (location.pathname !== `/workspace/${newTab}`) {
      navigate(`/workspace/${newTab}`);
    }
  }, [navigate, location.pathname]);

  // Keyboard shortcuts: ⌘K, ?, Esc, and G+{key} navigation
  useGlobalKeys(useMemo(() => ({
    cmdK: () => { setPaletteOpen(o => !o); setShortcutsOpen(false); },
    question: () => { setShortcutsOpen(o => !o); setPaletteOpen(false); },
    escape: () => { setPaletteOpen(false); setShortcutsOpen(false); setProfileMenuOpen(false); }
  }), []));

  // G+key shortcuts: go to tab
  useEffect(() => {
    let pending: string | null = null;
    let timer: number | null = null;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const k = e.key.toLowerCase();
      if (pending === 'g') {
        const map: Record<string, TabId> = {
          l: 'log', c: 'calendar', w: 'review', d: 'deliverables', r: 'roadmap', m: 'meetings', o: 'overview'
        };
        if (map[k]) { e.preventDefault(); setActiveTab(map[k]); }
        pending = null;
        return;
      }
      if (k === 'g') {
        pending = 'g';
        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(() => { pending = null; }, 1000);
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      if (timer) window.clearTimeout(timer);
    };
  }, [setActiveTab]);

  const profileMeta = role ? PROFILE_META[role] : null;
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  const NavList = ({ onSelect }: { onSelect?: () => void }) => {
    return (
      <div className="flex-1 px-2 py-3 relative z-10 overflow-y-auto">
        <LineSidebar
          items={navItems as any}
          activeId={activeTab}
          onSelect={(id) => {
            setActiveTab(id as TabId);
            if (onSelect) onSelect();
          }}
          accentColor="#22c55e"
          textColor="#c4c4c4"
          markerColor="#6c6c6c"
          showIndex={true}
          showMarker={true}
          proximityRadius={100}
          maxShift={20}
          falloff="smooth"
          markerLength={24}
          markerGap={8}
          tickScale={0.5}
          scaleTick={true}
          itemGap={8}
          fontSize={13}
          smoothing={650}
        />
      </div>
    );
  };

  const switchTo = (r: Role, dest: string) => {
    setRole(r);
    setProfileMenuOpen(false);
    setMobileNavOpen(false);
    navigate(dest);
  };

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{
        background: 'radial-gradient(circle at 50% -20%, #010402 0%, #000100 100%)'
      }}
    >
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[244px] bg-apple-base/85 border-r border-white/[0.06] shrink-0 relative z-10 backdrop-blur-md overflow-hidden">
        {/* Sidebar Header */}
        <div 
          onClick={() => navigate('/')}
          className="relative z-10 h-12 px-4 border-b border-white/[0.06] flex items-center gap-2 shrink-0 min-w-0 cursor-pointer hover:bg-white/[0.02] transition-colors"
          title="Go to Landing Page"
        >
          <img
            src="picture1.png"
            alt="SCREEN"
            className="w-12 h-12 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] shrink-0 translate-y-[1.5px]"
          />
          <div className="w-[1px] h-3.5 bg-white/15 shrink-0 translate-y-[1.5px]" />
          <span className="text-[12px] font-medium text-white truncate leading-none">
            {profileMeta?.subtitle}
          </span>
        </div>

        {/* Navigation list with Dither animation background */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
            <Dither
              waveColor="#004d33"
              disableAnimation={false}
              enableMouseInteraction={true}
              mouseRadius={0.3}
              colorNum={4}
              waveAmplitude={0.3}
              waveFrequency={3}
              waveSpeed={0.05}
              pixelSize={2}
            />
          </div>
          <NavList />
        </div>

        <div className="px-2 pb-3 pt-2 border-t border-white/[0.04] relative z-10">
          {profileMenuOpen && menuAnchor === 'bottom' && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)} />
              <div className="absolute left-2 right-2 bottom-full mb-1.5 z-40 rounded-lg bg-apple-elevated/98 backdrop-blur-xl border border-white/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.5)] py-1 fade-in">
                <p className="px-3 py-1.5 text-[10px] font-medium tracking-[0.18em] uppercase text-apple-tertiary">
                  Switch profile
                </p>
                {(Object.keys(PROFILE_META) as Role[]).map(r => {
                  const meta = PROFILE_META[r];
                  const active = r === role;
                  const dest = r === 'supervisor' ? '/workspace/overview' : '/workspace/log';
                  return (
                    <button
                      key={r}
                      onClick={() => switchTo(r, dest)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.04] transition-colors text-left"
                    >
                      <Avatar name={meta.avatar} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] text-white/90 font-medium truncate">{meta.label}</div>
                        <div className="text-[10.5px] text-white/55 truncate">{meta.subtitle}</div>
                      </div>
                      {active && <Check size={12} className="text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
                <div className="h-px bg-white/[0.06] my-1" />
                <button
                  onClick={() => { setRole(null); navigate('/'); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.04] transition-colors text-left text-apple-gray hover:text-white"
                >
                  <LogOut size={13} />
                  <span className="text-[12.5px]">Sign out</span>
                </button>
              </div>
            </>
          )}
          <button
            onClick={() => { setProfileMenuOpen(o => !o); setMenuAnchor('bottom'); }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[12px] text-apple-secondary hover:text-white/85 hover:bg-white/[0.04] transition-colors"
          >
            <ArrowLeftRight size={13} />
            <span>Switch account</span>
          </button>
          <button
            onClick={() => setShortcutsOpen(true)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[12px] text-apple-secondary hover:text-white/85 hover:bg-white/[0.04] transition-colors"
          >
            <span className="inline-flex items-center gap-2.5">
              <Keyboard size={13} />
              <span>Shortcuts</span>
            </span>
            <kbd className="px-1 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] border border-white/[0.06]">?</kbd>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed inset-x-0 top-0 z-30 bg-apple-base/90 backdrop-blur-md border-b border-white/[0.06]">
        <div className="flex items-center justify-between h-12 px-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-white/85 hover:opacity-80 transition-opacity"
              aria-label="Go to Landing Page"
            >
              <img
                src="picture1.png"
                alt="SCREEN"
                className="w-7 h-7 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
              />
              <span className="text-[12px] font-semibold">SCREEN</span>
            </button>
            <button
              onClick={() => setMobileNavOpen(o => !o)}
              className="p-1 text-apple-gray hover:text-white transition-colors"
              aria-label="Open menu"
            >
              <ChevronDown
                size={11}
                className={`transition-transform ${mobileNavOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
          <span className="text-[12px] text-apple-gray truncate max-w-[40vw]">
            {navItems.find(n => n.id === activeTab)?.label}
          </span>
          <div className="flex items-center gap-1.5">
            {syncMode === 'synced' ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Synced
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Running in local storage fallback mode">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Local
              </span>
            )}
            <button
              onClick={() => setPaletteOpen(true)}
              className="text-apple-gray hover:text-white p-1.5 rounded-md hover:bg-white/[0.04] transition-colors"
              aria-label="Search"
            >
              <Search size={14} />
            </button>
          </div>
        </div>
        {mobileNavOpen && (
          <div className="border-t border-white/[0.06] bg-apple-base max-h-[70vh] overflow-y-auto">
            <div className="px-3 py-2 border-b border-white/[0.04]">
              <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-apple-tertiary px-2 mb-1">
                Profiles
              </p>
              {(Object.keys(PROFILE_META) as Role[]).map(r => {
                const meta = PROFILE_META[r];
                const active = r === role;
                const dest = r === 'supervisor' ? '/workspace/overview' : '/workspace/log';
                return (
                  <button
                    key={r}
                    onClick={() => switchTo(r, dest)}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-white/[0.04] transition-colors text-left"
                  >
                    <Avatar name={meta.avatar} size="xs" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] text-white/95 font-medium truncate leading-tight">{meta.label}</div>
                      <div className="text-[10.5px] text-white/55 truncate leading-tight mt-0.5">{meta.subtitle}</div>
                    </div>
                    {active && <Check size={11} className="text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <NavList onSelect={() => setMobileNavOpen(false)} />
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent relative z-10 md:pt-0 pt-12">
        {/* Top bar */}
        <header className="hidden md:flex h-12 items-center justify-between px-3 sm:px-5 border-b border-white/[0.06] shrink-0 bg-apple-base/80 backdrop-blur-sm sticky top-0 z-20">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0 text-[13px]">
            {profileMeta && <Avatar name={profileMeta.avatar} size="sm" />}
            <span 
              onClick={() => navigate('/')}
              className="text-apple-secondary hover:text-white transition-colors cursor-pointer"
            >
              SCREEN
            </span>
            <ChevronRight size={11} className="text-apple-tertiary shrink-0" />
            <span className="text-apple-secondary truncate max-w-[180px]">{profileMeta?.subtitle}</span>
            <ChevronRight size={11} className="text-apple-tertiary shrink-0" />
            <span className="text-white/95 font-medium truncate">
              {navItems.find(n => n.id === activeTab)?.label || 'Overview'}
            </span>
            <div className="flex items-center gap-1.5 ml-3 shrink-0">
              {syncMode === 'synced' ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Synced
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Running in local storage fallback mode">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Local Mode
                </span>
              )}
            </div>
          </div>

          {/* Right: search trigger + new entry */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setPaletteOpen(true)}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] text-apple-secondary hover:text-white/85 hover:bg-white/[0.04] transition-colors"
            >
              <Search size={12} />
              <span>Search</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] border border-white/[0.06]">
                {isMac ? '⌘' : 'Ctrl'} K
              </kbd>
            </button>
            <button
              onClick={() => setShortcutsOpen(true)}
              className="p-1.5 rounded-md text-apple-secondary hover:text-white/85 hover:bg-white/[0.04] transition-colors"
              aria-label="Shortcuts"
            >
              <Keyboard size={13} />
            </button>
            {/* Hide "+ New entry" CTA entirely for supervisor */}
            {role !== 'supervisor' && (
              <button
                onClick={() => {
                  if (activeTab === 'log') setNewLogTrigger(t => t + 1);
                  else if (activeTab === 'meetings') setNewMeetingTrigger(t => t + 1);
                  else if (activeTab === 'deliverables' || activeTab === 'review' || activeTab === 'roadmap' || activeTab === 'calendar') {
                    setActiveTab('log');
                    setTimeout(() => setNewLogTrigger(t => t + 1), 50);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-apple-base rounded-md text-[12px] font-medium hover:bg-white/90 transition-colors ml-1"
              >
                <Plus size={12} strokeWidth={2.5} />
                <span>New entry</span>
                <kbd className="hidden lg:inline-flex items-center px-1 py-0.5 rounded text-[10px] font-mono bg-black/10 text-apple-base">
                  C
                </kbd>
              </button>
            )}
          </div>
        </header>

        {/* Mobile top bar (right-side action) */}
        <div className="md:hidden sticky top-12 z-20 bg-apple-base/90 backdrop-blur-sm border-b border-white/[0.06] flex items-center justify-end gap-1.5 px-3 h-10">
          <button
            onClick={() => setPaletteOpen(true)}
            className="p-1.5 rounded-md text-apple-secondary hover:text-white/85 hover:bg-white/[0.04] transition-colors"
            aria-label="Search"
          >
            <Search size={14} />
          </button>
          <button
            onClick={() => {
              if (activeTab === 'log') setNewLogTrigger(t => t + 1);
              else { setActiveTab('log'); setTimeout(() => setNewLogTrigger(t => t + 1), 50); }
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white text-apple-base rounded-md text-[12px] font-medium"
          >
            <Plus size={12} strokeWidth={2.5} />
            <span>New</span>
          </button>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[860px] mx-auto px-5 sm:px-8 py-6 sm:py-8">
            {activeTab === 'overview' && role === 'supervisor' && <Overview />}
            {activeTab === 'log' && role !== 'supervisor' && <DailyLog newEntryTrigger={newLogTrigger} />}
            {activeTab === 'calendar' && <Calendar />}
            {activeTab === 'review' && <WeeklyReview />}
            {activeTab === 'deliverables' && <Deliverables />}
            {activeTab === 'roadmap' && <Roadmap />}
            {activeTab === 'meetings' && <Meetings newMeetingTrigger={newMeetingTrigger} />}
          </div>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOpenNewLog={() => {
          if (activeTab !== 'log') navigate('/workspace/log');
          setTimeout(() => setNewLogTrigger(t => t + 1), 50);
        }}
        onOpenNewMeeting={() => {
          if (activeTab !== 'meetings') navigate('/workspace/meetings');
          setTimeout(() => setNewMeetingTrigger(t => t + 1), 50);
        }}
      />
      <ShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
};
