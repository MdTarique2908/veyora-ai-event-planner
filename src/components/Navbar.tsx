import React from 'react';
import { Calendar, PlusCircle, Bookmark, Sparkles, Printer, FileDown, Users, Cloud, Sun, Moon, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { VeyoraLogo } from './VeyoraLogo';

interface NavbarProps {
  activeTab: 'dashboard' | 'create' | 'plan' | 'saved';
  setActiveTab: (tab: 'dashboard' | 'create' | 'plan' | 'saved') => void;
  savedCount: number;
  hasActivePlan: boolean;
  onPrint: () => void;
  onExportJson: () => void;
  onOpenCollaboration?: () => void;
  onOpenAbout?: () => void;
  collaboratorCount?: number;
  isCloudSynced?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  hasActivePlan,
  onPrint,
  onExportJson,
  onOpenCollaboration,
  onOpenAbout,
  collaboratorCount = 0,
  isCloudSynced = false,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 dark:border-slate-800 bg-[#F8F7F3]/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Veyora Home - Go to Dashboard"
          onClick={() => setActiveTab('dashboard')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveTab('dashboard');
            }
          }}
          className="flex cursor-pointer items-center gap-3 transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#E8D4A8] rounded-xl p-1"
        >
          <VeyoraLogo size="md" showWordmark={true} showTagline={true} />
        </div>

        {/* Navigation Tabs */}
        <nav aria-label="Main Navigation" className="flex items-center gap-1 sm:gap-1.5 bg-stone-100/70 p-1 rounded-xl border border-stone-200/60">
          <button
            onClick={() => setActiveTab('dashboard')}
            aria-current={activeTab === 'dashboard' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white text-slate-900 shadow-sm border border-stone-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Calendar className="h-4 w-4 text-indigo-600" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            aria-current={activeTab === 'create' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              activeTab === 'create'
                ? 'bg-[#172033] dark:bg-[#E8D4A8] text-[#E8D4A8] dark:text-[#172033] shadow-sm shadow-[#172033]/25 font-semibold border border-[#E8D4A8]/40'
                : 'text-[#172033] dark:text-[#E8D4A8] hover:text-[#172033] hover:bg-[#FAF6ED] dark:hover:bg-[#1E2B45]'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Plan</span>
          </button>

          {hasActivePlan && (
            <button
              onClick={() => setActiveTab('plan')}
              aria-current={activeTab === 'plan' ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === 'plan'
                  ? 'bg-white text-slate-900 shadow-sm border border-stone-200/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Current Plan</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('saved')}
            aria-current={activeTab === 'saved' ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              activeTab === 'saved'
                ? 'bg-white text-slate-900 shadow-sm border border-stone-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Bookmark className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline">Saved Plans</span>
            {savedCount > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-stone-200 text-[10px] font-semibold text-slate-700">
                {savedCount}
              </span>
            )}
          </button>
        </nav>

        {/* Action buttons (Theme Toggle, About / Credits, Co-Host Collaboration, Print, Export) */}
        <div className="flex items-center gap-2">
          {/* Light / Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-stone-200 bg-white text-slate-700 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-xs cursor-pointer active:scale-90"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600 transition-transform hover:-rotate-12" />
            )}
          </button>

          {onOpenAbout && (
            <button
              type="button"
              onClick={onOpenAbout}
              title="About Veyora & Creator Credits"
              aria-label="About Veyora & Creator Credits"
              className="flex items-center justify-center h-9 w-9 rounded-xl border border-stone-200 bg-white text-slate-700 hover:text-[#A98C4C] hover:border-[#E8D4A8] transition-all shadow-xs cursor-pointer active:scale-90"
            >
              <Info className="h-4 w-4 text-[#C5A869]" />
            </button>
          )}

          {onOpenCollaboration && (
            <button
              onClick={onOpenCollaboration}
              title="Cloud Sync & Co-Host Collaboration (Firebase Auth + Firestore)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-stone-200 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Users className="h-3.5 w-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Co-Hosts & Cloud</span>
              <span className="sm:hidden">Share</span>
              {collaboratorCount > 0 && (
                <span className="rounded-full bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 text-[10px] font-mono text-indigo-700 font-bold">
                  {collaboratorCount}
                </span>
              )}
            </button>
          )}

          {hasActivePlan && activeTab === 'plan' && (
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={onPrint}
                title="Print or Save as Clean PDF"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-stone-100/80 rounded-xl border border-stone-200 bg-white transition-colors shadow-sm"
              >
                <Printer className="h-3.5 w-3.5 text-slate-500" />
                <span>Print / PDF</span>
              </button>
              <button
                onClick={onExportJson}
                title="Export Plan JSON Backup"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-stone-100/80 rounded-xl border border-stone-200 bg-white transition-colors shadow-sm"
              >
                <FileDown className="h-3.5 w-3.5 text-indigo-600" />
                <span>Export JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
