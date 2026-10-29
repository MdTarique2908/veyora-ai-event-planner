import React, { useRef } from 'react';
import {
  Sparkles,
  PlusCircle,
  Calendar,
  DollarSign,
  ArrowRight,
  Bookmark,
  Trash2,
  FileDown,
  Upload,
  Clock,
  Compass,
} from 'lucide-react';
import { EventPlan } from '../types/event';
import { VeyoraLogo } from './VeyoraLogo';

interface DashboardProps {
  savedPlans: EventPlan[];
  onSelectPlan: (plan: EventPlan) => void;
  onCreateNew: () => void;
  onDeletePlan: (id: string) => void;
  onExportJson: (plan: EventPlan) => void;
  onImportJson: (jsonStr: string) => void;
  onLoadSample: (sampleId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  savedPlans,
  onSelectPlan,
  onCreateNew,
  onDeletePlan,
  onExportJson,
  onImportJson,
  onLoadSample,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportJson(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Aggregates
  const totalEvents = savedPlans.length;
  const totalBudgetManaged = savedPlans.reduce(
    (sum, p) => sum + (Number(p.budgetPlan?.totalBudget) || 0),
    0
  );
  const totalTasks = savedPlans.reduce((sum, p) => sum + (p.timeline?.length || 0), 0);
  const completedTasks = savedPlans.reduce(
    (sum, p) => sum + (p.timeline?.filter((t) => t.isCompleted).length || 0),
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-10 shadow-xs">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4A8]/60 bg-[#FAF6ED] dark:bg-[#1E2B45] px-3.5 py-1 text-xs font-semibold text-[#8C6D2C] dark:text-[#E8D4A8]">
              <Sparkles className="h-3.5 w-3.5 text-[#C5A869]" />
              <span>AI-Powered Event Planning, Beautifully Simplified</span>
            </div>

            <div className="mt-4 mb-2">
              <VeyoraLogo size="xl" showWordmark={true} showTagline={true} />
            </div>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Design bespoke celebrations, weddings, anniversaries, corporate galas, and community festivals. Generate intelligent itemized budgets, vendor checklists, and master run-of-show schedules powered by Gemini.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={onCreateNew}
                className="inline-flex items-center gap-2 rounded-xl bg-[#172033] dark:bg-[#E8D4A8] px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#E8D4A8] dark:text-[#172033] shadow-md shadow-[#172033]/25 hover:bg-[#1E2B45] dark:hover:bg-[#DFCA95] border border-[#E8D4A8]/40 active:scale-98 transition-all cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create New Plan</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-xs"
              >
                <Upload className="h-4 w-4 text-slate-500" />
                <span>Import JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Quick Previews Box */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-5 lg:w-80 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900 mb-3">
              <Compass className="h-4 w-4 text-indigo-600" />
              <span>Explore Sample Blueprints</span>
            </div>
            <div className="space-y-2.5">
              <button
                onClick={() => onLoadSample('sample-plan-birthday-1')}
                className="w-full text-left rounded-xl border border-stone-200 bg-white p-3 hover:border-indigo-300 hover:shadow-xs transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900 group-hover:text-indigo-600">
                  <span>🎂 21st Neon Rooftop Bash</span>
                  <ArrowRight className="h-3.5 w-3.5 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Austin, TX · 45 guests · $2,800
                </div>
              </button>

              <button
                onClick={() => onLoadSample('sample-plan-wedding-2')}
                className="w-full text-left rounded-xl border border-stone-200 bg-white p-3 hover:border-indigo-300 hover:shadow-xs transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900 group-hover:text-indigo-600">
                  <span>💍 Botanical Greenhouse Wedding</span>
                  <ArrowRight className="h-3.5 w-3.5 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Portland, OR · 80 guests · $11,500
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Ambient Warm Accent */}
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-indigo-50/60 blur-3xl" />
      </div>

      {/* Aggregate Metrics Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Bookmark className="h-4 w-4 text-indigo-600" />
            <span>Saved Plans</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalEvents}</div>
          <p className="mt-0.5 text-[11px] text-slate-400">Stored locally in browser</p>
        </div>

        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span>Total Budget Tracked</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ${totalBudgetManaged.toLocaleString()}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">Across all plans</p>
        </div>

        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Clock className="h-4 w-4 text-indigo-600" />
            <span>Task Completion</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {completedTasks} / {totalTasks}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% done
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>AI Architecture</span>
          </div>
          <div className="mt-2 text-base font-bold text-slate-900">Gemini 2.5 Flash</div>
          <p className="mt-0.5 text-[11px] text-slate-400">Secure server integration</p>
        </div>
      </div>

      {/* Plans Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your Celebration Plans</h2>
            <p className="text-xs text-slate-500">
              Select any plan to view its concept, edit the budget, manage the timeline, or export.
            </p>
          </div>

          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Plan New Event</span>
          </button>
        </div>

        {savedPlans.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {savedPlans.map((plan) => {
              const completed = plan.timeline.filter((t) => t.isCompleted).length;
              const total = plan.timeline.length;
              const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
              const currency = plan.budgetPlan?.currency || '$';

              return (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-stone-200/90 bg-white p-6 flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all shadow-xs group"
                >
                  <div>
                    {/* Metadata line */}
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
                      <span className="capitalize text-indigo-700 font-semibold bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100">
                        {plan.input.eventType}
                      </span>
                      <span>{plan.input.eventDate}</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                      {plan.concept.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {plan.concept.description}
                    </p>

                    {/* Specs */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-y border-stone-100 py-3">
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">Location:</span>
                        <span className="font-semibold text-slate-800">{plan.input.city}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">Guests:</span>
                        <span className="font-semibold text-slate-800">
                          {plan.input.guestCount} People
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">Budget:</span>
                        <span className="font-semibold text-emerald-700">
                          {currency} {plan.budgetPlan?.totalBudget?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">Readiness:</span>
                        <span className="font-semibold text-indigo-700">
                          {completed}/{total} Tasks ({progress}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 flex items-center justify-between border-t border-stone-100">
                    <button
                      onClick={() => onSelectPlan(plan)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
                    >
                      <span>Open Plan</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onExportJson(plan)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                        title="Download JSON"
                      >
                        <FileDown className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete plan "${plan.concept.title}"?`)) {
                            onDeletePlan(plan.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Plan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-12 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">No Event Plans Stored</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Create your first event plan with Gemini or load an illustrative sample to test the budget & timeline.
              </p>
            </div>
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Event Plan</span>
            </button>
          </div>
        )}
      </div>

      {/* Storage & Privacy Architecture Notice */}
      <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-5 text-xs text-slate-600 space-y-1">
        <h4 className="font-semibold text-slate-800">Persistence Architecture Notice</h4>
        <p className="leading-relaxed">
          Event plans are stored locally in your browser’s storage ({totalEvents} plans active). You can export any plan as a self-contained JSON file or print to PDF for team distribution. Gemini API calls are securely processed on the application server without exposing keys in the browser bundle.
        </p>
      </div>
    </div>
  );
};
