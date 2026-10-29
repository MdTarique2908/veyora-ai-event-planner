import React from 'react';
import { X, Sparkles, ExternalLink, GraduationCap, Code2, Heart, Award, ShieldCheck, Globe, Cpu } from 'lucide-react';
import { VeyoraLogo, VeyoraIcon } from './VeyoraLogo';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Md Tarique's Official Profiles
  const LINKEDIN_URL = 'https://www.linkedin.com/in/md-tarique-516476447';
  const PORTFOLIO_URL = 'https://github.com/MdTarique2908';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-[#E8D4A8]/40 bg-[#F8F7F3] dark:bg-[#131B2B] p-6 sm:p-8 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative champagne ambient glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#E8D4A8]/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#172033]/20 dark:bg-[#1E2B45]/40 blur-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close About dialog"
          className="absolute right-5 top-5 rounded-xl p-2 text-slate-400 hover:bg-stone-200/60 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header with Logo */}
        <div className="flex flex-col items-center text-center">
          <VeyoraLogo size="lg" showWordmark={true} showTagline={false} />
          <p className="mt-1.5 text-xs sm:text-sm font-semibold tracking-wide text-[#A98C4C] dark:text-[#E8D4A8] italic">
            Every occasion, extraordinary.
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md">
            AI-powered event planning, beautifully simplified.
          </p>
        </div>

        {/* Creator Attribution Card */}
        <div className="mt-6 rounded-2xl border border-[#E8D4A8]/50 bg-white dark:bg-[#0D131F] p-5 shadow-sm">
          <div className="flex items-start gap-4">
            {/* Monogram Badge */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E2B45] to-[#172033] border border-[#E8D4A8]/60 text-[#E8D4A8] shadow-md shadow-[#172033]/25 font-display text-lg font-extrabold tracking-wider">
              MT
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#A98C4C] dark:text-[#E8D4A8] bg-[#FAF6ED] dark:bg-[#1E2B45] px-2 py-0.5 rounded-full border border-[#E8D4A8]/40">
                  Creator & Lead Engineer
                </span>
              </div>
              <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                Created by Md Tarique
              </h3>
              <div className="mt-1 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <GraduationCap className="h-4 w-4 shrink-0 text-[#C5A869] mt-0.5" />
                <span>First-year B.Tech Electronics and VLSI Design student at Jamia Millia Islamia</span>
              </div>
            </div>
          </div>

          {/* Social / Portfolio Links */}
          <div className="mt-4 pt-4 border-t border-stone-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
              Connect with Md Tarique:
            </span>
            <div className="flex items-center gap-2">
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Replace with your LinkedIn profile URL"
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-[#F8F7F3] dark:bg-[#172033] px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-[#E8D4A8] hover:text-[#A98C4C] dark:hover:text-[#E8D4A8] transition-all shadow-2xs"
              >
                <span>LinkedIn</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="Replace with your Portfolio or GitHub URL"
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-[#F8F7F3] dark:bg-[#172033] px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-[#E8D4A8] hover:text-[#A98C4C] dark:hover:text-[#E8D4A8] transition-all shadow-2xs"
              >
                <span>Portfolio / GitHub</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Technical Highlights Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-left text-xs">
          <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white/70 dark:bg-[#0D131F]/60 p-3">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
              <Cpu className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Gemini 3.8 Flash</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Autonomous event architect & budget reallocation</p>
          </div>

          <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white/70 dark:bg-[#0D131F]/60 p-3">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
              <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Gemini 3.8 Live</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Real-time bi-directional low latency voice partner</p>
          </div>

          <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white/70 dark:bg-[#0D131F]/60 p-3 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>Production Safe</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Server-side secrets & zero exposed client keys</p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 border-t border-stone-200/80 dark:border-slate-800 pt-4">
          <span>Veyora v1.0.0 • Production Build</span>
          <button
            onClick={onClose}
            className="font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
