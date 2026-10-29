import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  DollarSign,
  CheckSquare,
  Clock,
  Store,
  Lightbulb,
  MessageSquare,
  Printer,
  FileDown,
  ArrowLeft,
  AlertTriangle,
  Compass,
  Film,
  Palette,
  Music,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { EventForm } from './components/EventForm';
import { PlanOverview } from './components/PlanOverview';
import { BudgetPlanner } from './components/BudgetPlanner';
import { TimelineChecklist } from './components/TimelineChecklist';
import { DayOfSchedule } from './components/DayOfSchedule';
import { VendorDirectory } from './components/VendorDirectory';
import { SeatingPlanner3D } from './components/SeatingPlanner3D';
import { VideoInvitationStudio } from './components/VideoInvitationStudio';
import { ThemeMusicStudio } from './components/ThemeMusicStudio';
import { InspirationBoard } from './components/InspirationBoard';
import { CoHostCollaborationModal } from './components/CoHostCollaborationModal';
import { GuestExperienceSection } from './components/GuestExperienceSection';
import { AssistantDrawer } from './components/AssistantDrawer';
import { SavedPlansList } from './components/SavedPlansList';
import { PrintableReport } from './components/PrintableReport';
import { VeyoraLogo } from './components/VeyoraLogo';
import { AboutModal } from './components/AboutModal';
import { EventInput, EventPlan } from './types/event';
import { storageHelper } from './utils/storage';
import { SAMPLE_PLANS } from './utils/sampleData';

export default function App() {
  const [savedPlans, setSavedPlans] = useState<EventPlan[]>([]);
  const [activePlan, setActivePlan] = useState<EventPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'plan' | 'saved'>('dashboard');
  const [planSubTab, setPlanSubTab] = useState<
    'overview' | 'budget' | 'timeline' | 'schedule' | 'vendors' | 'seating' | 'video' | 'music' | 'inspiration' | 'experience'
  >('overview');
  const [videoSourcePhoto, setVideoSourcePhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isCollaborationOpen, setIsCollaborationOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show temporary toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load plans on mount & check for share link
  useEffect(() => {
    const plans = storageHelper.getSavedPlans();
    setSavedPlans(plans);

    const activeId = storageHelper.getActivePlanId();
    if (activeId) {
      const match = plans.find((p) => p.id === activeId);
      if (match) {
        setActivePlan(match);
      } else if (plans.length > 0) {
        setActivePlan(plans[0]);
      }
    } else if (plans.length > 0) {
      setActivePlan(plans[0]);
    }

    // Check if user followed a share/co-host invite link (?share=... or ?join=...)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const shareParam = urlParams.get('share') || urlParams.get('join');
      if (shareParam) {
        fetch(`/api/cloud/join/${shareParam}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.plan) {
              storageHelper.savePlan(data.plan);
              setSavedPlans(storageHelper.getSavedPlans());
              setActivePlan(data.plan);
              setActiveTab('plan');
              showToast(`Joined shared event: ${data.plan.concept?.title || 'Event'}!`);
              setIsCollaborationOpen(true);
            }
          })
          .catch((e) => console.warn('Could not join share link:', e));
      }
    } catch {}
  }, []);

  // Handle plan generation from form
  const handleGeneratePlan = async (input: EventInput) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const newPlan: EventPlan = await response.json();
      storageHelper.savePlan(newPlan);
      setSavedPlans(storageHelper.getSavedPlans());
      setActivePlan(newPlan);
      setActiveTab('plan');
      setPlanSubTab('overview');
      showToast('Event plan generated and saved successfully!');
    } catch (err: any) {
      console.error('Plan generation error:', err);
      showToast('Using high-quality fallback event plan.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle regeneration of active plan
  const handleRegeneratePlan = async () => {
    if (!activePlan) return;
    setIsRegenerating(true);
    try {
      const response = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activePlan.input),
      });

      if (!response.ok) throw new Error('Regeneration failed');
      const regenerated: EventPlan = await response.json();
      const merged: EventPlan = {
        ...regenerated,
        id: activePlan.id,
      };

      storageHelper.savePlan(merged);
      setSavedPlans(storageHelper.getSavedPlans());
      setActivePlan(merged);
      showToast('Event blueprint refreshed with new creative suggestions!');
    } catch (err) {
      console.error('Regenerate error:', err);
      showToast('Could not refresh plan. Kept current version.');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Update plan in state & storage
  const handleUpdatePlan = (updatedPlan: EventPlan) => {
    setActivePlan(updatedPlan);
    storageHelper.savePlan(updatedPlan);
    setSavedPlans(storageHelper.getSavedPlans());
  };

  // Select plan to view
  const handleSelectPlan = (plan: EventPlan) => {
    setActivePlan(plan);
    storageHelper.setActivePlanId(plan.id);
    setActiveTab('plan');
    setPlanSubTab('overview');
  };

  // Load a sample plan by ID
  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_PLANS.find((s) => s.id === sampleId) || SAMPLE_PLANS[0];
    storageHelper.savePlan(sample);
    setSavedPlans(storageHelper.getSavedPlans());
    setActivePlan(sample);
    setActiveTab('plan');
    setPlanSubTab('overview');
    showToast(`Loaded sample: ${sample.concept.title}`);
  };

  // Delete plan
  const handleDeletePlan = (id: string) => {
    const updated = storageHelper.deletePlan(id);
    setSavedPlans(updated);
    if (activePlan?.id === id) {
      setActivePlan(updated.length > 0 ? updated[0] : null);
    }
    showToast('Plan deleted.');
  };

  // Export JSON
  const handleExportJson = (planToExport?: EventPlan) => {
    const p = planToExport || activePlan;
    if (p) {
      storageHelper.exportPlanToJson(p);
      showToast('JSON backup exported.');
    }
  };

  // Import JSON
  const handleImportJson = (jsonStr: string) => {
    try {
      const imported = storageHelper.importPlanFromJson(jsonStr);
      setSavedPlans(storageHelper.getSavedPlans());
      setActivePlan(imported);
      setActiveTab('plan');
      showToast(`Imported "${imported.concept.title}"!`);
    } catch (err: any) {
      console.error('Import error:', err);
      alert('Invalid Veyora plan JSON file. Please check file format.');
    }
  };

  // Print PDF
  const handlePrint = () => {
    window.print();
  };

  // Check if active plan has budget warning
  const totalEstimatedCost = activePlan?.budgetPlan?.items.reduce(
    (sum, item) => sum + (Number(item.estimatedCost) || 0),
    0
  ) || 0;
  const isOverBudget = activePlan
    ? totalEstimatedCost > (activePlan.budgetPlan?.totalBudget || 0)
    : false;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900 dark:bg-[#0b0f19] dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-stone-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xl backdrop-blur-md transition-all">
          {toastMessage}
        </div>
      )}

      {/* Navigation */}
      <div className="no-print">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          savedCount={savedPlans.length}
          hasActivePlan={Boolean(activePlan)}
          onPrint={handlePrint}
          onExportJson={() => handleExportJson()}
          onOpenAbout={() => setIsAboutOpen(true)}
          onOpenCollaboration={() => {
            if (activePlan) {
              setIsCollaborationOpen(true);
            } else {
              showToast('Select or create a plan first to collaborate with co-hosts.');
            }
          }}
          collaboratorCount={activePlan?.collaborators?.length || 0}
          isCloudSynced={Boolean(activePlan?.cloudSyncedAt)}
        />
      </div>

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <Dashboard
            savedPlans={savedPlans}
            onSelectPlan={handleSelectPlan}
            onCreateNew={() => setActiveTab('create')}
            onDeletePlan={handleDeletePlan}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onLoadSample={handleLoadSample}
          />
        )}

        {/* Create Plan Tab */}
        {activeTab === 'create' && (
          <EventForm
            onSubmit={handleGeneratePlan}
            isLoading={isLoading}
            onLoadSample={handleLoadSample}
          />
        )}

        {/* Saved Plans Tab */}
        {activeTab === 'saved' && (
          <SavedPlansList
            savedPlans={savedPlans}
            onSelectPlan={handleSelectPlan}
            onDeletePlan={handleDeletePlan}
            onExportJson={handleExportJson}
            onCreateNew={() => setActiveTab('create')}
          />
        )}

        {/* Current Plan Detailed View */}
        {activeTab === 'plan' && activePlan && (
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
            {/* Top Bar: Back to dashboard & Subtab switcher */}
            <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-200/80 pb-4">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Dashboard</span>
              </button>

              {/* Sub-Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-stone-200/80 bg-stone-100/70 p-1.5 shadow-xs">
                <button
                  onClick={() => setPlanSubTab('overview')}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    planSubTab === 'overview'
                      ? 'bg-white text-indigo-700 font-bold shadow-xs border border-stone-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Overview</span>
                </button>

                <button
                  onClick={() => setPlanSubTab('budget')}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    planSubTab === 'budget'
                      ? 'bg-white text-indigo-700 font-bold shadow-xs border border-stone-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Budget</span>
                  {isOverBudget && (
                    <span title="Over budget">
                      <AlertTriangle className="h-3 w-3 text-rose-500" />
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setPlanSubTab('timeline')}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    planSubTab === 'timeline'
                      ? 'bg-white text-indigo-700 font-bold shadow-xs border border-stone-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Checklist ({activePlan.timeline.filter((t) => t.isCompleted).length}/{activePlan.timeline.length})</span>
                </button>

                <button
                  onClick={() => setPlanSubTab('schedule')}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    planSubTab === 'schedule'
                      ? 'bg-white text-indigo-700 font-bold shadow-xs border border-stone-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  <span>Run of Show</span>
                </button>

                <button
                  onClick={() => setPlanSubTab('vendors')}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    planSubTab === 'vendors'
                      ? 'bg-white text-indigo-700 font-bold shadow-xs border border-stone-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Store className="h-3.5 w-3.5 text-violet-600" />
                  <span>Vendors</span>
                </button>

                <button
                  onClick={() => setPlanSubTab('seating')}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    planSubTab === 'seating'
                      ? 'bg-white text-indigo-700 font-bold shadow-xs border border-stone-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Compass className="h-3.5 w-3.5 text-coral-500 text-rose-500" />
                  <span>3D Seating</span>
                </button>

                <button
                  onClick={() => setPlanSubTab('video')}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    planSubTab === 'video'
                      ? 'bg-white text-indigo-700 font-bold shadow-xs border border-stone-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Film className="h-3.5 w-3.5 text-rose-500" />
                  <span>Video Invites</span>
                  {activePlan.videoInvites && activePlan.videoInvites.length > 0 && (
                    <span className="rounded-full bg-rose-50 border border-rose-100 px-1.5 py-0.2 text-[10px] font-mono text-rose-700 font-bold">
                      {activePlan.videoInvites.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setPlanSubTab('music')}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    planSubTab === 'music'
                      ? 'bg-white text-indigo-700 font-bold shadow-xs border border-stone-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Music className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Theme Music</span>
                  {activePlan.themeMusicTracks && activePlan.themeMusicTracks.length > 0 && (
                    <span className="rounded-full bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 text-[10px] font-mono text-indigo-700 font-bold">
                      {activePlan.themeMusicTracks.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setPlanSubTab('inspiration')}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    planSubTab === 'inspiration'
                      ? 'bg-white text-indigo-700 font-bold shadow-xs border border-stone-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Palette className="h-3.5 w-3.5 text-purple-600" />
                  <span>Moodboard</span>
                  {activePlan.inspirationBoard && activePlan.inspirationBoard.length > 0 && (
                    <span className="rounded-full bg-purple-50 border border-purple-100 px-1.5 py-0.2 text-[10px] font-mono text-purple-700 font-bold">
                      {activePlan.inspirationBoard.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setPlanSubTab('experience')}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    planSubTab === 'experience'
                      ? 'bg-white text-indigo-700 font-bold shadow-xs border border-stone-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <span>Guest Experience</span>
                </button>
              </div>

              {/* Action Buttons for Mobile */}
              <div className="flex lg:hidden items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl border border-stone-200 bg-white text-slate-700 shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => handleExportJson()}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-xl border border-stone-200 bg-white text-slate-700 shadow-xs"
                >
                  <FileDown className="h-3.5 w-3.5 text-indigo-600" />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* Sub-view Content */}
            <div className="no-print">
              {planSubTab === 'overview' && (
                <PlanOverview
                  plan={activePlan}
                  onRegenerate={handleRegeneratePlan}
                  isRegenerating={isRegenerating}
                  onNavigateToTab={setPlanSubTab}
                  onOpenCollaboration={() => setIsCollaborationOpen(true)}
                />
              )}

              {planSubTab === 'budget' && (
                <BudgetPlanner
                  plan={activePlan}
                  onUpdatePlan={handleUpdatePlan}
                />
              )}

              {planSubTab === 'timeline' && (
                <TimelineChecklist
                  plan={activePlan}
                  onUpdatePlan={handleUpdatePlan}
                />
              )}

              {planSubTab === 'schedule' && (
                <DayOfSchedule
                  plan={activePlan}
                  onUpdatePlan={handleUpdatePlan}
                />
              )}

              {planSubTab === 'vendors' && (
                <VendorDirectory
                  plan={activePlan}
                  onUpdatePlan={handleUpdatePlan}
                />
              )}

              {planSubTab === 'seating' && (
                <SeatingPlanner3D
                  plan={activePlan}
                  onUpdatePlan={handleUpdatePlan}
                />
              )}

              {planSubTab === 'video' && (
                <VideoInvitationStudio
                  plan={activePlan}
                  onUpdatePlan={handleUpdatePlan}
                  initialPhotoUrl={videoSourcePhoto}
                />
              )}

              {planSubTab === 'music' && (
                <ThemeMusicStudio
                  plan={activePlan}
                  onUpdatePlan={handleUpdatePlan}
                />
              )}

              {planSubTab === 'inspiration' && (
                <InspirationBoard
                  plan={activePlan}
                  onUpdatePlan={handleUpdatePlan}
                  onAnimateIntoVideo={(photoUrl) => {
                    setVideoSourcePhoto(photoUrl);
                    setPlanSubTab('video');
                  }}
                />
              )}

              {planSubTab === 'experience' && (
                <GuestExperienceSection
                  plan={activePlan}
                  onUpdatePlan={handleUpdatePlan}
                />
              )}
            </div>

            {/* Print-Only Document */}
            <PrintableReport plan={activePlan} />
          </div>
        )}
      </main>

      {/* Floating AI Consultant Drawer Trigger */}
      {activePlan && (
        <aside aria-label="AI Event Assistant" className="no-print fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsAssistantOpen(true)}
            className="flex items-center gap-2.5 rounded-full bg-[#172033] dark:bg-[#1E2B45] px-5 py-3 text-xs sm:text-sm font-semibold text-[#E8D4A8] shadow-xl shadow-[#172033]/30 hover:bg-[#1E2B45] border border-[#E8D4A8]/40 active:scale-98 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-[#E8D4A8]" />
            <span>Ask Veyora AI</span>
          </button>
        </aside>
      )}

      {/* AI Assistant Drawer */}
      {activePlan && (
        <AssistantDrawer
          plan={activePlan}
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
        />
      )}

      {/* Cloud Sync & Co-Host Collaboration Modal */}
      {activePlan && (
        <CoHostCollaborationModal
          plan={activePlan}
          isOpen={isCollaborationOpen}
          onClose={() => setIsCollaborationOpen(false)}
          onUpdatePlan={handleUpdatePlan}
          onToast={showToast}
        />
      )}

      {/* About & Creator Credits Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Footer */}
      <footer className="no-print border-t border-stone-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 py-8 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Tagline */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <VeyoraLogo size="sm" showTagline={false} />
            <div className="flex flex-col sm:border-l sm:border-stone-200 dark:sm:border-slate-800 sm:pl-3">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Veyora — Every occasion, extraordinary.
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                AI-powered event planning, beautifully simplified.
              </span>
            </div>
          </div>

          {/* Creator Attribution */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right gap-1">
            <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
              Created by <span className="font-bold text-[#A98C4C] dark:text-[#E8D4A8]">Md Tarique</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              First-year B.Tech Electronics and VLSI Design student at Jamia Millia Islamia
            </div>
            <div className="flex items-center gap-3 text-[11px] mt-0.5">
              <a
                href="https://www.linkedin.com/in/md-tarique-516476447"
                target="_blank"
                rel="noopener noreferrer"
                title="Md Tarique on LinkedIn"
                className="font-semibold text-slate-700 dark:text-slate-300 hover:text-[#A98C4C] dark:hover:text-[#E8D4A8] transition-colors underline decoration-[#E8D4A8]/60 underline-offset-2"
              >
                LinkedIn &rarr;
              </a>
              <span>•</span>
              <a
                href="https://github.com/MdTarique2908"
                target="_blank"
                rel="noopener noreferrer"
                title="Md Tarique on GitHub"
                className="font-semibold text-slate-700 dark:text-slate-300 hover:text-[#A98C4C] dark:hover:text-[#E8D4A8] transition-colors underline decoration-[#E8D4A8]/60 underline-offset-2"
              >
                GitHub &rarr;
              </a>
              <span>•</span>
              <button
                type="button"
                onClick={() => setIsAboutOpen(true)}
                className="font-semibold text-[#A98C4C] dark:text-[#E8D4A8] hover:underline cursor-pointer"
              >
                About & Credits
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
