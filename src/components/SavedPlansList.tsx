import React, { useState } from 'react';
import {
  Bookmark,
  Calendar,
  Users,
  DollarSign,
  FileDown,
  Trash2,
  ArrowRight,
  Search,
  PlusCircle,
  Clock,
} from 'lucide-react';
import { EventPlan } from '../types/event';

interface SavedPlansListProps {
  savedPlans: EventPlan[];
  onSelectPlan: (plan: EventPlan) => void;
  onDeletePlan: (id: string) => void;
  onExportJson: (plan: EventPlan) => void;
  onCreateNew: () => void;
}

export const SavedPlansList: React.FC<SavedPlansListProps> = ({
  savedPlans,
  onSelectPlan,
  onDeletePlan,
  onExportJson,
  onCreateNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = savedPlans.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.concept.title.toLowerCase().includes(term) ||
      p.input.city.toLowerCase().includes(term) ||
      p.input.eventType.toLowerCase().includes(term) ||
      p.input.themeStyle.toLowerCase().includes(term)
    );
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Saved Event Blueprints
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {savedPlans.length} plan{savedPlans.length === 1 ? '' : 's'} saved on this device.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 sm:w-64 rounded-xl border border-stone-300 bg-white px-3.5 py-2 pl-9 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
            />
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#172033] dark:bg-[#E8D4A8] px-4 py-2 text-xs font-semibold text-[#E8D4A8] dark:text-[#172033] hover:bg-[#1E2B45] dark:hover:bg-[#DFCA95] border border-[#E8D4A8]/40 transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Plan</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map((plan) => {
          const completed = plan.timeline.filter((t) => t.isCompleted).length;
          const total = plan.timeline.length;
          const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
          const currency = plan.budgetPlan?.currency || '$';

          return (
            <div
              key={plan.id}
              className="rounded-2xl border border-stone-200/90 bg-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-indigo-300 hover:shadow-xs transition-all shadow-2xs"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <span className="capitalize text-indigo-700 font-semibold bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100">
                    {plan.input.eventType}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-slate-700">{plan.input.city}</span>
                  <span aria-hidden="true">·</span>
                  <span>{plan.input.eventDate}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 truncate">
                  {plan.concept.title}
                </h3>
                <p className="mt-0.5 text-xs text-slate-600 truncate">
                  {plan.concept.tagline}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700">{plan.input.guestCount} Guests</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="font-semibold text-emerald-700">
                      {currency} {plan.budgetPlan.totalBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-600" />
                    <span className="font-medium text-indigo-700">
                      {completed}/{total} Tasks ({progress}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                <button
                  onClick={() => onSelectPlan(plan)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <span>Open</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => onExportJson(plan)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                  title="Export JSON"
                >
                  <FileDown className="h-4 w-4" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Delete plan "${plan.concept.title}"?`)) {
                      onDeletePlan(plan.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-12 text-center text-slate-500 text-xs">
            No saved plans found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};
