import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Layers,
  Shirt,
  CalendarPlus,
  Download,
  ExternalLink,
  X,
  CheckCircle2,
  CalendarDays,
  Bell,
  ListTodo,
  Navigation,
  Star,
  Building,
  Compass,
  Film,
  Music,
  Cloud,
} from 'lucide-react';
import { EventPlan } from '../types/event';
import {
  generateEventPlanIcs,
  downloadIcsFile,
  createGoogleCalendarUrl,
  CalendarExportOptions,
} from '../utils/icsExport';

interface PlanOverviewProps {
  plan: EventPlan;
  onRegenerate: () => void;
  isRegenerating: boolean;
  onNavigateToTab?: (tab: 'overview' | 'budget' | 'timeline' | 'schedule' | 'vendors' | 'seating' | 'video' | 'music' | 'experience' | 'inspiration') => void;
  onOpenCollaboration?: () => void;
}

export const PlanOverview: React.FC<PlanOverviewProps> = ({
  plan,
  onRegenerate,
  isRegenerating,
  onNavigateToTab,
  onOpenCollaboration,
}) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Calendar export configuration options
  const [calendarOptions, setCalendarOptions] = useState<CalendarExportOptions>({
    includeMainEvent: true,
    includeMilestones: true,
    includeDayOfSchedule: true,
    milestoneFilter: 'all',
    alarmMinutesBefore: 1440, // 24 hours
  });

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // Calculate days until event
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(plan.input.eventDate);
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const formattedDate = targetDate.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const perGuestBudget =
    plan.input.guestCount > 0
      ? (plan.budgetPlan.totalBudget / plan.input.guestCount).toFixed(0)
      : '0';

  // Handle .ics generation and file download
  const handleDownloadIcs = () => {
    try {
      const icsString = generateEventPlanIcs(plan, calendarOptions);
      const safeEventTitle = (plan.concept.title || plan.input.title || 'event-plan')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const filename = `${safeEventTitle}-${plan.input.eventDate}.ics`;

      downloadIcsFile(filename, icsString);
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Failed to generate calendar file', err);
    }
  };

  // Open Google Calendar 1-click web link
  const handleOpenGoogleCalendar = () => {
    const url = createGoogleCalendarUrl(plan);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const milestoneCount = plan.timeline?.length || 0;
  const pendingMilestoneCount =
    plan.timeline?.filter((t) => !t.isCompleted).length || 0;
  const scheduleCount = plan.dayOfSchedule?.length || 0;

  return (
    <div className="space-y-6">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            {/* Metadata line */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
              <span className="capitalize text-[#8C6D2C] dark:text-[#E8D4A8] font-semibold bg-[#FAF6ED] dark:bg-[#1E2B45] px-2.5 py-0.5 rounded-md border border-[#E8D4A8]/50">
                {plan.input.eventType}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-700">{plan.input.city}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-500 font-medium">
                {diffDays > 0
                  ? `${diffDays} days away`
                  : diffDays === 0
                  ? 'Happening today!'
                  : 'Past event'}
              </span>
            </div>

            <h1 className="mt-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {plan.concept.title}
            </h1>
            <p className="mt-1 text-sm sm:text-base font-semibold text-indigo-700">
              "{plan.concept.tagline}"
            </p>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {plan.concept.description}
            </p>

            {/* Vibe Keywords */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-800">Atmosphere Vibe:</span>
              {plan.concept.vibeKeywords.map((vibe, idx) => (
                <React.Fragment key={vibe}>
                  <span className="text-slate-700 font-medium bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                    {vibe}
                  </span>
                  {idx < plan.concept.vibeKeywords.length - 1 && (
                    <span className="text-slate-300" aria-hidden="true">
                      /
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Action Group: Export Calendar & Regenerate Plan */}
          <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCalendarModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
              >
                <CalendarPlus className="h-3.5 w-3.5 text-indigo-600" />
                <span>Export to Calendar</span>
              </button>

              <button
                type="button"
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50 hover:text-slate-900 transition-all disabled:opacity-50 shadow-2xs cursor-pointer"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin text-indigo-600' : ''}`}
                />
                <span>{isRegenerating ? 'Regenerating...' : 'Regenerate Plan'}</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400">
              Generated {new Date(plan.generatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Ambient Subtle Accent */}
        <div className="pointer-events-none absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-indigo-50/60 blur-3xl" />
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <span>Target Date</span>
          </div>
          <p className="mt-1 font-bold text-sm sm:text-base text-slate-900 truncate">
            {plan.input.eventDate}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{formattedDate}</p>
        </div>

        <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Users className="h-4 w-4 text-indigo-600" />
            <span>Guest Count</span>
          </div>
          <p className="mt-1 font-bold text-sm sm:text-base text-slate-900">
            {plan.input.guestCount} Guests
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 capitalize">
            {plan.input.venuePreference} venue
          </p>
        </div>

        <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span>Total Budget</span>
          </div>
          <p className="mt-1 font-bold text-sm sm:text-base text-slate-900">
            {plan.budgetPlan.currency} {plan.budgetPlan.totalBudget.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            ~{plan.budgetPlan.currency} {perGuestBudget} per guest
          </p>
        </div>

        <div className="rounded-xl border border-stone-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Clock className="h-4 w-4 text-amber-500" />
            <span>Timeline Tasks</span>
          </div>
          <p className="mt-1 font-bold text-sm sm:text-base text-slate-900">
            {plan.timeline.filter((t) => t.isCompleted).length} / {plan.timeline.length} Done
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {Math.round(
              (plan.timeline.filter((t) => t.isCompleted).length / (plan.timeline.length || 1)) * 100
            )}% Completed
          </p>
        </div>
      </div>

      {/* Bento Operations Hub: Cohesive 2-Column Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Event Operations & Interactive Studios
          </h2>
          <span className="text-xs text-slate-500 font-medium">All systems active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Google Maps Grounded Venue */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700 border border-emerald-100">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {plan.selectedVenue ? 'Selected Venue' : 'Venue Discovery'}
                    </h3>
                    <span className="text-[11px] text-emerald-700 font-medium">Google Maps Grounded</span>
                  </div>
                </div>
                {plan.selectedVenue?.rating && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span>{plan.selectedVenue.rating}</span>
                  </div>
                )}
              </div>

              {plan.selectedVenue ? (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-bold text-slate-900">{plan.selectedVenue.name}</p>
                  {plan.selectedVenue.address && (
                    <p className="text-xs text-slate-500 line-clamp-1">{plan.selectedVenue.address}</p>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                  Discover verified venues in {plan.input.city} with real customer reviews, photos, addresses, and navigation links.
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              {plan.selectedVenue ? (
                <a
                  href={plan.selectedVenue.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <span>Open in Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-xs text-slate-400">Ready to explore</span>
              )}

              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('vendors')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-800 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>{plan.selectedVenue ? 'Change Venue' : 'Explore Venues'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 2: 3D Seating & Spatial Studio */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-indigo-50 p-2 text-indigo-700 border border-indigo-100">
                    <Compass className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">3D Venue & Seating Planner</h3>
                    <span className="text-[11px] text-indigo-700 font-medium">Three.js Spatial Engine</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-medium text-slate-500 bg-stone-100 px-2 py-0.5 rounded-md">
                  {plan.seatingLayout?.tables.length || 0} Tables
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                Arrange banquet rounds, cocktail high-tops, staging, dance floor, and seat all {plan.input.guestCount} attendees in interactive 3D.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Real-time collision detection</span>
              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('seating')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                >
                  <Compass className="h-3 w-3" />
                  <span>Launch 3D Studio</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Animated Video Teaser & Studio */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-violet-300 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-violet-50 p-2 text-violet-700 border border-violet-100">
                    <Film className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Video Invitation Studio</h3>
                    <span className="text-[11px] text-violet-700 font-medium">Gemini Omni Flash 1.1</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-medium text-slate-500 bg-stone-100 px-2 py-0.5 rounded-md">
                  {plan.videoInvites?.length || 0} Invites
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                Turn your theme photos into animated motion teasers with typography overlays. Supports 16:9 widescreen and 9:16 portrait formats.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Direct video rendering</span>
              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('video')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-800 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Film className="h-3 w-3" />
                  <span>Launch Studio</span>
                </button>
              )}
            </div>
          </div>

          {/* Card 4: Bespoke Theme Music */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-amber-50 p-2 text-amber-700 border border-amber-100">
                    <Music className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Theme Music & Fanfare</h3>
                    <span className="text-[11px] text-amber-700 font-medium">Google DeepMind Lyria</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-medium text-slate-500 bg-stone-100 px-2 py-0.5 rounded-md">
                  {plan.themeMusicTracks?.length || 0} Tracks
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                Compose bespoke entrance fanfares, cocktail hour ambient tracks, and peak celebration anthems tailored to your event's theme.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Downloadable WAV & DJ cues</span>
              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('music')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-800 px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Music className="h-3 w-3" />
                  <span>Compose Music</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card 5: Cloud Sync & Co-Host Collaboration Banner */}
        <div className="mt-4 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-700 border border-indigo-100 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Multi-Device Cloud Sync & Co-Host Collaboration</h3>
                <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {plan.collaborators?.length || 0} Co-Hosts • {plan.cloudSyncedAt ? 'Synced' : 'Local'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 max-w-2xl">
                Google Sign-in and secure Firestore synchronization. Share instant invite links for co-hosts, planners, or partners to review budgets and check off milestones together.
              </p>
            </div>
          </div>

          {onOpenCollaboration && (
            <button
              type="button"
              onClick={onOpenCollaboration}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-slate-800 px-4 py-2 text-xs font-semibold transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              <Users className="h-3.5 w-3.5 text-indigo-600" />
              <span>Manage Co-Hosts & Sync</span>
            </button>
          )}
        </div>
      </div>

      {/* Color Palette & Dress Code */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Curated Color Palette */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Curated Color Palette</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Click to copy hex</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {plan.concept.colorPalette.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => copyToClipboard(color.hex)}
                className="group flex flex-col items-start rounded-xl border border-stone-200 bg-stone-50/60 p-2.5 text-left transition-all hover:border-indigo-300 hover:bg-white shadow-2xs cursor-pointer"
              >
                <div
                  className="h-12 w-full rounded-lg shadow-inner border border-stone-200/80"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="mt-2 text-xs font-semibold text-slate-800 truncate w-full">
                  {color.name}
                </span>
                <div className="mt-1 flex items-center justify-between w-full text-[11px] font-mono text-slate-500">
                  <span>{color.hex}</span>
                  {copiedHex === color.hex ? (
                    <Check className="h-3 w-3 text-emerald-600 font-bold" />
                  ) : (
                    <Copy className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Dress Code & Style Guide */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shirt className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Recommended Dress Code</h3>
            </div>
            <p className="text-sm font-semibold text-indigo-700">
              {plan.concept.dressCodeSuggestion}
            </p>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Advise guests on footwear and layers suited for the {plan.input.venuePreference} venue in {plan.input.city}. Mentioning color accents helps create cohesive photos.
            </p>
          </div>

          {/* Quick Dietary and Requirements Note */}
          <div className="mt-4 pt-4 border-t border-stone-100 text-xs text-slate-500">
            <span className="font-semibold text-slate-800">Dietary & Style Focus: </span>
            {plan.input.foodPreferences.join(', ')}
            {plan.input.specialRequirements && (
              <p className="mt-1 text-slate-600 italic">
                Note: "{plan.input.specialRequirements}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Export Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl space-y-5 text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Export to Calendar (.ics)</h3>
                  <p className="text-xs text-slate-500">
                    Sync celebration dates & deadlines with your calendar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-stone-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Target Event Summary */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900">{plan.concept.title}</p>
                <p className="text-slate-500 mt-0.5">
                  {formattedDate} • {plan.input.city}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-md capitalize">
                {plan.input.eventType}
              </span>
            </div>

            {/* Customization Options */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-800">Choose what to include:</p>

              {/* Option 1: Main Event Celebration */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={calendarOptions.includeMainEvent}
                  onChange={(e) =>
                    setCalendarOptions({
                      ...calendarOptions,
                      includeMainEvent: e.target.checked,
                    })
                  }
                  className="mt-0.5 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    Main Celebration Event
                  </span>
                  <p className="text-slate-500 mt-0.5">
                    All-day calendar entry with theme details, venue, guest count, and key notes.
                  </p>
                </div>
              </label>

              {/* Option 2: Preparation Milestones */}
              <div className="p-3 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2.5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calendarOptions.includeMilestones}
                    onChange={(e) =>
                      setCalendarOptions({
                        ...calendarOptions,
                        includeMilestones: e.target.checked,
                      })
                    }
                    className="mt-0.5 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <ListTodo className="h-3.5 w-3.5 text-indigo-600" />
                      Preparation Milestones & Deadlines ({milestoneCount} tasks)
                    </span>
                    <p className="text-slate-500 mt-0.5">
                      Scheduled calendar events for countdown checklists and vendor deadlines.
                    </p>
                  </div>
                </label>

                {/* Sub-option: Pending tasks only */}
                {calendarOptions.includeMilestones && (
                  <div className="ml-7 pt-2 border-t border-stone-200 flex items-center gap-4 text-xs text-slate-600">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="milestoneFilter"
                        checked={calendarOptions.milestoneFilter === 'all'}
                        onChange={() =>
                          setCalendarOptions({
                            ...calendarOptions,
                            milestoneFilter: 'all',
                          })
                        }
                        className="border-stone-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>All milestones ({milestoneCount})</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="milestoneFilter"
                        checked={calendarOptions.milestoneFilter === 'pending-only'}
                        onChange={() =>
                          setCalendarOptions({
                            ...calendarOptions,
                            milestoneFilter: 'pending-only',
                          })
                        }
                        className="border-stone-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Pending only ({pendingMilestoneCount})</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Option 3: Day-of Schedule */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={calendarOptions.includeDayOfSchedule}
                  onChange={(e) =>
                    setCalendarOptions({
                      ...calendarOptions,
                      includeDayOfSchedule: e.target.checked,
                    })
                  }
                  className="mt-0.5 rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-600" />
                    Day-of Run of Show ({scheduleCount} timeline entries)
                  </span>
                  <p className="text-slate-500 mt-0.5">
                    Timed itinerary items with owner roles (e.g. setup, ceremony, speeches, dinner).
                  </p>
                </div>
              </label>

              {/* Option 4: Alarm / Notification */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50/50 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Bell className="h-3.5 w-3.5 text-amber-500" />
                  <span>Calendar Reminder</span>
                </div>
                <select
                  value={calendarOptions.alarmMinutesBefore}
                  onChange={(e) =>
                    setCalendarOptions({
                      ...calendarOptions,
                      alarmMinutesBefore: Number(e.target.value),
                    })
                  }
                  aria-label="Calendar Reminder Notification Timing"
                  className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
                >
                  <option value={0}>No alert</option>
                  <option value={120}>2 hours before</option>
                  <option value={1440}>1 day before (24h)</option>
                  <option value={2880}>2 days before (48h)</option>
                  <option value={10080}>1 week before</option>
                </select>
              </div>
            </div>

            {/* Export Success Feedback */}
            {exportSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  iCalendar (.ics) file downloaded! Open it to import into Apple Calendar, Outlook, or Google Calendar.
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-all shadow-sm active:scale-98 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Download .ics Calendar File</span>
              </button>

              <button
                type="button"
                onClick={handleOpenGoogleCalendar}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-stone-50 transition-all shadow-2xs cursor-pointer"
                title="Opens Google Calendar event template in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5 text-indigo-600" />
                <span>Google Calendar Web</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
