import React, { useState } from 'react';
import { Clock, Plus, Trash2, Edit2, Check, User, ArrowRight } from 'lucide-react';
import { EventPlan, ScheduleItem } from '../types/event';
import { TimelineScheduleVisual3D } from './Luxury3DVisuals';

interface DayOfScheduleProps {
  plan: EventPlan;
  onUpdatePlan: (updatedPlan: EventPlan) => void;
}

export const DayOfSchedule: React.FC<DayOfScheduleProps> = ({
  plan,
  onUpdatePlan,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newOwner, setNewOwner] = useState('');

  // Editing state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTime, setEditTime] = useState('');
  const [editActivity, setEditActivity] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [editOwner, setEditOwner] = useState('');

  const schedule = plan.dayOfSchedule || [];

  const handleStartEdit = (item: ScheduleItem, index: number) => {
    setEditingIndex(index);
    setEditTime(item.time);
    setEditActivity(item.activity);
    setEditDetails(item.details);
    setEditOwner(item.owner);
  };

  const handleSaveEdit = (index: number) => {
    const updated = [...schedule];
    updated[index] = {
      time: editTime.trim() || updated[index].time,
      activity: editActivity.trim() || updated[index].activity,
      details: editDetails.trim() || updated[index].details,
      owner: editOwner.trim() || updated[index].owner,
    };

    onUpdatePlan({
      ...plan,
      dayOfSchedule: updated,
    });
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    const updated = schedule.filter((_, idx) => idx !== index);
    onUpdatePlan({
      ...plan,
      dayOfSchedule: updated,
    });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime.trim() || !newActivity.trim()) return;

    const newItem: ScheduleItem = {
      time: newTime.trim(),
      activity: newActivity.trim(),
      details: newDetails.trim(),
      owner: newOwner.trim() || 'Host',
    };

    onUpdatePlan({
      ...plan,
      dayOfSchedule: [...schedule, newItem],
    });

    setNewTime('');
    setNewActivity('');
    setNewDetails('');
    setNewOwner('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Luxury 3D Run of Show & Analytics Header */}
      <div className="relative overflow-hidden rounded-3xl border border-[#D6B779]/35 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] p-6 sm:p-8 shadow-2xl text-[#F8FAFC]">
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#D6B779]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D6B779]/40 bg-[#D6B779]/10 px-3.5 py-1 text-xs font-semibold text-[#D6B779]">
              <Clock className="h-3.5 w-3.5 text-[#D6B779]" />
              <span>Master Run of Show & Timeline Engine</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
              Day-of Timeline & Schedule
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Coordinate vendors, greeters, speeches, catering, and send-off cues hour by hour with precision timeline sequencing.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#D6B779] to-[#C5A25D] px-4 py-2 text-xs font-bold text-[#0F172A] shadow-md shadow-[#D6B779]/20 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D6B779] focus:outline-none"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Milestone</span>
              </button>

              <div className="rounded-xl border border-[#334155] bg-[#0F172A]/70 px-3.5 py-2 text-center">
                <span className="text-xs font-mono font-bold text-[#D6B779]">{schedule.length}</span>
                <span className="text-[11px] text-slate-400 ml-1.5">Scheduled Cues</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex items-center justify-center">
            <div className="relative w-full rounded-2xl border border-[#334155]/60 bg-[#0F172A]/50 backdrop-blur-xs p-1 shadow-inner">
              <TimelineScheduleVisual3D />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 font-mono tracking-widest uppercase bg-[#0F172A]/90 px-2.5 py-0.5 rounded-full border border-[#334155]/60 pointer-events-none">
                3D Chronological Ring
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Milestone Drawer */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-indigo-900">Add Schedule Milestone</h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700">Time (e.g. 05:00 PM) *</label>
              <input
                type="text"
                required
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                placeholder="05:30 PM"
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700">Activity Title *</label>
              <input
                type="text"
                required
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="e.g. Guest Welcome & Cocktails"
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700">Lead Owner / Contact</label>
              <input
                type="text"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder="e.g. Best Man, Coordinator, DJ"
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700">Execution Details / Cues</label>
            <input
              type="text"
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
              placeholder="e.g. Dim lights to 30%, queue soundtrack #4, bring out cake"
              className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-2xs cursor-pointer"
            >
              Save Milestone
            </button>
          </div>
        </form>
      )}

      {/* Itinerary Timeline View */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-200 space-y-6">
        {schedule.map((item, idx) => {
          const isEditing = editingIndex === idx;

          if (isEditing) {
            return (
              <div
                key={idx}
                className="relative rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3 shadow-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    placeholder="Time"
                    className="rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-2xs"
                  />
                  <input
                    type="text"
                    value={editActivity}
                    onChange={(e) => setEditActivity(e.target.value)}
                    placeholder="Activity"
                    className="rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-2xs"
                  />
                  <input
                    type="text"
                    value={editOwner}
                    onChange={(e) => setEditOwner(e.target.value)}
                    placeholder="Owner"
                    className="rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-2xs"
                  />
                </div>
                <input
                  type="text"
                  value={editDetails}
                  onChange={(e) => setEditDetails(e.target.value)}
                  placeholder="Details"
                  className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-2xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleSaveEdit(idx)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" /> Save
                  </button>
                  <button
                    onClick={() => setEditingIndex(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className="relative group">
              {/* Dot indicator */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-indigo-600 bg-white shadow-2xs" />

              <div className="rounded-2xl border border-stone-200/90 bg-white p-4.5 hover:border-indigo-300 hover:shadow-xs transition-all shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50/80 px-2.5 py-0.5 rounded-md border border-indigo-100">
                      {item.time}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{item.activity}</h4>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.owner && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <User className="h-3 w-3 text-indigo-600" />
                        <span>{item.owner}</span>
                      </span>
                    )}

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-2 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(item, idx)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {item.details && (
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed pl-0.5">
                    {item.details}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
