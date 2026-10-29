import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  Filter,
  Check,
  Award,
  Mic,
} from 'lucide-react';
import { EventPlan, TaskPhase, TimelineTask, PriorityLevel } from '../types/event';
import { VoiceNoteRecorderModal } from './VoiceNoteRecorderModal';

interface TimelineChecklistProps {
  plan: EventPlan;
  onUpdatePlan: (updatedPlan: EventPlan) => void;
}

const PHASES: TaskPhase[] = [
  '8+ Weeks Before',
  '4-6 Weeks Before',
  '2-3 Weeks Before',
  '1 Week Before',
  'Day Before',
  'Event Day',
  'Post Event',
];

export const TimelineChecklist: React.FC<TimelineChecklistProps> = ({
  plan,
  onUpdatePlan,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPhase, setNewPhase] = useState<TaskPhase>('2-3 Weeks Before');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('medium');
  const [newCategory, setNewCategory] = useState('General');

  // Check event date status
  const targetDate = new Date(plan.input.eventDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const isPastEvent = targetDate.getTime() < now.getTime();

  // Metrics
  const totalTasks = plan.timeline.length;
  const completedTasks = plan.timeline.filter((t) => t.isCompleted).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Toggle complete
  const handleToggleTask = (taskId: string) => {
    let triggeredConfetti = false;
    const updatedTasks = plan.timeline.map((t) => {
      if (t.id === taskId) {
        const nextState = !t.isCompleted;
        if (nextState) {
          triggeredConfetti = true;
        }
        return { ...t, isCompleted: nextState };
      }
      return t;
    });

    if (triggeredConfetti) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'],
        });
      } catch {
        // Safe fallback if canvas not available
      }
    }

    onUpdatePlan({
      ...plan,
      timeline: updatedTasks,
    });
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = plan.timeline.filter((t) => t.id !== taskId);
    onUpdatePlan({
      ...plan,
      timeline: updatedTasks,
    });
  };

  // Add custom task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: TimelineTask = {
      id: `task-custom-${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory.trim() || 'Custom',
      duePhase: newPhase,
      priority: newPriority,
      isCompleted: false,
    };

    onUpdatePlan({
      ...plan,
      timeline: [...plan.timeline, newTask],
    });

    setNewTitle('');
    setNewDescription('');
    setIsAddingTask(false);
  };

  // Filter tasks
  const filteredTasks = plan.timeline.filter((task) => {
    if (filterStatus === 'pending' && task.isCompleted) return false;
    if (filterStatus === 'completed' && !task.isCompleted) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Past Date Alert if applicable */}
      {isPastEvent && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            <strong>Note:</strong> The target date for this event ({plan.input.eventDate}) has passed. You can still track remaining post-event tasks, vendor reviews, or adjust the date.
          </span>
        </div>
      )}

      {/* Progress Card */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
              <Award className="h-4 w-4 text-indigo-600" />
              <span>Event Readiness Checklist</span>
            </div>
            <h3 className="mt-1 text-xl font-bold text-slate-900">
              {completedTasks} of {totalTasks} Tasks Completed ({progressPercent}%)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Organized chronologically from early bookings to day-of execution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Mic className="h-3.5 w-3.5 text-indigo-600" />
              <span>Record Voice Note</span>
            </button>

            <button
              onClick={() => setIsAddingTask(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Custom Task</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-stone-100 border border-stone-200/60">
          <div
            className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Status:</span>
          {(['all', 'pending', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors cursor-pointer ${
                filterStatus === status
                  ? 'bg-stone-100 text-indigo-700 font-bold border border-stone-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-xl border border-stone-300 bg-white px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Add Task Modal / Inline Drawer */}
      {isAddingTask && (
        <form
          onSubmit={handleAddTask}
          className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-indigo-900">Add Milestone Task</h4>
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-700">Task Title *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Schedule floral walk-through with coordinator"
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700">Timeline Phase</label>
              <select
                value={newPhase}
                onChange={(e) => setNewPhase(e.target.value as TaskPhase)}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs cursor-pointer"
              >
                {PHASES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-700">Description / Action Steps</label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Details, contacts, or checklist points..."
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700">Priority Level</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs cursor-pointer"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-2xs cursor-pointer"
            >
              Add Task
            </button>
          </div>
        </form>
      )}

      {/* Grouped Tasks by Phase */}
      <div className="space-y-6">
        {PHASES.map((phase) => {
          const phaseTasks = filteredTasks.filter((t) => t.duePhase === phase);
          if (phaseTasks.length === 0) return null;

          const phaseCompleted = phaseTasks.filter((t) => t.isCompleted).length;

          return (
            <div
              key={phase}
              className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs"
            >
              {/* Phase Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">{phase}</h4>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {phaseCompleted} of {phaseTasks.length} done
                </span>
              </div>

              {/* Task Items */}
              <div className="space-y-2.5">
                {phaseTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className={`group flex items-start gap-3 rounded-xl border p-3.5 transition-all cursor-pointer shadow-2xs ${
                      task.isCompleted
                        ? 'border-stone-200 bg-stone-50/40 text-slate-400'
                        : 'border-stone-200 bg-white hover:border-indigo-300 hover:shadow-xs text-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      aria-label="Toggle task completion"
                      className="mt-0.5 shrink-0 text-stone-400 group-hover:text-indigo-600 cursor-pointer"
                    >
                      {task.isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-stone-300 group-hover:text-indigo-600 transition-colors" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            task.isCompleted
                              ? 'line-through text-slate-400'
                              : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </span>

                        {/* Priority indicator */}
                        <span
                          className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
                            task.priority === 'high'
                              ? 'text-rose-600'
                              : task.priority === 'medium'
                              ? 'text-amber-700'
                              : 'text-slate-500'
                          }`}
                        >
                          [{task.priority}]
                        </span>

                        {task.category && (
                          <span className="text-[10px] text-slate-400">
                            · {task.category}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p
                          className={`mt-1 text-xs leading-relaxed ${
                            task.isCompleted ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          {task.description}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity shrink-0 cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-8 text-center text-slate-500 text-xs">
            No tasks match the selected filters.
          </div>
        )}
      </div>

      {/* Voice Note & Supplier Memo Recorder Modal */}
      <VoiceNoteRecorderModal
        plan={plan}
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onAddTask={(task) => {
          onUpdatePlan({
            ...plan,
            timeline: [...plan.timeline, task],
          });
        }}
      />
    </div>
  );
};
