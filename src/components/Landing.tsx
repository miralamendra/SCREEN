import React, { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import type { Role } from '../data/initialState';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import Noise from './ui/Noise';

// Lazy-load the WebGL shader so the main bundle stays light.
const Silk = lazy(() => import('./ui/Silk'));

interface Portal {
  role: Role;
  number: string;
  title: string;
  description: string;
  destination: string;
}

const PORTALS: Portal[] = [
  {
    role: 'shalini',
    number: '01',
    title: 'Study 1 - GenAI Application',
    description: 'Generative AI for translating local coexistence wisdom into actionable guidance.',
    destination: '/workspace/log'
  },
  {
    role: 'miral',
    number: '02',
    title: 'Study 2 - Gamification',
    description: 'A serious game for integrating elephant behavioral intelligence with children and young professionals.',
    destination: '/workspace/log'
  },
  {
    role: 'supervisor',
    number: '03',
    title: 'Review Portal',
    description: 'Cross-study overview: weekly logging, deliverables, and progress review.',
    destination: '/workspace/overview'
  }
];

export const Landing: React.FC = () => {
  const { setRole } = useWorkspace();
  const navigate = useNavigate();

  const handleSelect = (portal: Portal) => {
    setRole(portal.role);
    requestAnimationFrame(() => navigate(portal.destination));
  };

  const year = new Date().getFullYear();

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0a1a10] text-white flex flex-col">
      {/* Noise layer */}
      <Noise 
        patternSize={250}
        patternScaleX={2}
        patternScaleY={2}
        patternRefreshInterval={2}
        patternAlpha={12}
      />

      {/* Silk background */}
      <div className="absolute inset-0 z-0 opacity-90">
        <Suspense fallback={<div className="absolute inset-0 bg-[#0a1a10]" />}>
          <Silk
            speed={4}
            scale={1.2}
            color="#14532d"
            noiseIntensity={1.5}
            rotation={0}
          />
        </Suspense>
        {/* Subtle top→bottom darkening for legibility on top of the shader */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50 pointer-events-none"
        />
      </div>

      {/* Content — single viewport, no scroll */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Hero — takes the remaining viewport; perfectly centered */}
        <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 sm:px-10 max-w-[1120px] mx-auto w-full py-6">
          <div className="-mt-16 sm:-mt-24 w-full flex flex-col items-center justify-center">
            <header className="flex flex-col items-center justify-center fade-in">
              <img
                src="picture1.png"
                alt="SCREEN Logo"
                className="w-36 h-36 sm:w-48 sm:h-48 object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)] translate-y-8 sm:translate-y-12"
              />
            </header>
            <div className="fade-in-slow text-center flex flex-col items-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] mb-3">
                <Sparkles size={11} className="text-white/70" />
                <span className="text-[11px] font-medium tracking-wide text-white/80">
                  Research workspace
                </span>
              </div>

              <h1 className="text-[34px] sm:text-[44px] md:text-[52px] font-semibold tracking-[-0.035em] leading-[1.02] text-white text-balance max-w-3xl">
                Mapping the boundaries
                <br />
                of coexistence.
              </h1>

              <p className="mt-4 text-[14px] sm:text-[15px] text-white/70 max-w-xl leading-relaxed text-pretty">
                Research portal for SCREEN, designed for research workflow management.
              </p>
            </div>

            {/* Portal selector — sits under the hero, well above the footer */}
            <div
              className="mt-8 sm:mt-10 fade-in w-full"
              style={{ animationDelay: '0.35s', opacity: 0 }}
            >
            <p className="text-[10.5px] font-medium tracking-[0.18em] uppercase text-white/50 mb-4 text-center">
              Choose a workspace
            </p>

            <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PORTALS.map(portal => (
                <li key={portal.role}>
                  <button
                    onClick={() => handleSelect(portal)}
                    className="group relative w-full text-left p-5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] backdrop-blur-md transition-all duration-300 ease-out hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10.5px] font-mono text-white/50 mb-2">
                          {portal.number}
                        </div>
                        <div className="text-[16px] font-semibold tracking-tight text-white/95 leading-snug">
                          {portal.title}
                        </div>
                        <p className="mt-2 text-[13px] text-white/55 leading-relaxed line-clamp-2">
                          {portal.description}
                        </p>
                      </div>
                      <div className="shrink-0 w-8 h-8 rounded-full bg-white/[0.05] group-hover:bg-white group-hover:text-[#0a1a10] flex items-center justify-center transition-all duration-300 ease-out text-white/60 group-hover:translate-x-1">
                        <ArrowUpRight size={14} strokeWidth={2} />
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          </div>
        </main>

        {/* Footer — simplified */}
        <footer className="px-6 sm:px-10 py-6 shrink-0 fade-in" style={{ animationDelay: '0.5s', opacity: 0 }}>
          <div className="max-w-[1120px] mx-auto flex items-center justify-center gap-2 text-[11px] text-white/40 tracking-wider uppercase">
            <span>Sustainable Coexistence Research &amp; Education Network</span>
            <span className="opacity-40">·</span>
            <span>© {year}</span>
          </div>
        </footer>
      </div>
    </div>
  );
};