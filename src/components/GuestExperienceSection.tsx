import React from 'react';
import {
  Sparkles,
  Heart,
  Smile,
  Music,
  Camera,
  Coffee,
  CheckCircle,
  Lightbulb,
  Shield,
  Palette,
} from 'lucide-react';
import { EventPlan } from '../types/event';
import { InspirationBoard } from './InspirationBoard';

interface GuestExperienceSectionProps {
  plan: EventPlan;
  onUpdatePlan?: (updatedPlan: EventPlan) => void;
}

export const GuestExperienceSection: React.FC<GuestExperienceSectionProps> = ({ plan, onUpdatePlan }) => {
  const experiences = plan.guestExperience || [];
  const recs = plan.recommendations || {
    venueTips: [],
    cateringIdeas: [],
    decorAndAmbiance: [],
    photoVideoMoments: [],
    entertainmentAndMusic: [],
  };
  const practicalTips = plan.practicalTips || [];

  return (
    <div className="space-y-8">
      {/* Theme & Decor Inspiration Board (Camera + AI Image Visualizer) */}
      <InspirationBoard plan={plan} onUpdatePlan={onUpdatePlan || (() => {})} />

      {/* Interactive Guest Experience Highlights */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-900">Guest Experience & Signature Moments</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {experiences.map((exp, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-stone-200/90 bg-white p-5 flex flex-col justify-between hover:border-indigo-300 shadow-xs transition-all"
            >
              <div>
                <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full inline-block mb-2 border border-indigo-100">
                  Impact: {exp.impact}
                </div>
                <h4 className="text-sm font-bold text-slate-900">{exp.title}</h4>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  {exp.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Production & Creative Pillars */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-4">
          Detailed Recommendations by Service Area
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Venue & Logistics */}
          {recs.venueTips && recs.venueTips.length > 0 && (
            <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs uppercase tracking-wider mb-3">
                <Coffee className="h-4 w-4 text-indigo-600" />
                <span>Venue & Flow Optimization</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {recs.venueTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-600 shrink-0 font-bold">›</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Catering & Refreshments */}
          {recs.cateringIdeas && recs.cateringIdeas.length > 0 && (
            <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs uppercase tracking-wider mb-3">
                <Coffee className="h-4 w-4 text-indigo-600" />
                <span>Food & Beverage Concepts</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {recs.cateringIdeas.map((idea, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-600 shrink-0 font-bold">›</span>
                    <span className="leading-relaxed">{idea}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Decor & Ambiance */}
          {recs.decorAndAmbiance && recs.decorAndAmbiance.length > 0 && (
            <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs uppercase tracking-wider mb-3">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span>Decor, Lighting & Atmosphere</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {recs.decorAndAmbiance.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-600 shrink-0 font-bold">›</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Photography & Media */}
          {recs.photoVideoMoments && recs.photoVideoMoments.length > 0 && (
            <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs uppercase tracking-wider mb-3">
                <Camera className="h-4 w-4 text-emerald-600" />
                <span>Photo & Video Memory Moments</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {recs.photoVideoMoments.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-600 shrink-0 font-bold">›</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Entertainment & Audio */}
          {recs.entertainmentAndMusic && recs.entertainmentAndMusic.length > 0 && (
            <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs md:col-span-2">
              <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs uppercase tracking-wider mb-3">
                <Music className="h-4 w-4 text-indigo-600" />
                <span>Music, Playlist Arc & Entertainment</span>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
                {recs.entertainmentAndMusic.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-600 shrink-0 font-bold">›</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Practical Host Peace of Mind Tips */}
      {practicalTips.length > 0 && (
        <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Practical Advice for Stress-Free Hosting
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {practicalTips.map((tip, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 text-xs text-slate-700 leading-relaxed"
              >
                <div className="font-bold text-slate-900 mb-1">Principle #{idx + 1}</div>
                {tip}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
