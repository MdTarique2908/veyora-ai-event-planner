import React from 'react';
import { EventPlan } from '../types/event';

interface PrintableReportProps {
  plan: EventPlan;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({ plan }) => {
  const currency = plan.budgetPlan.currency || 'USD';
  const totalEstimated = plan.budgetPlan.items.reduce(
    (sum, item) => sum + (Number(item.estimatedCost) || 0),
    0
  );
  const totalBudget = plan.budgetPlan.totalBudget;
  const remaining = totalBudget - totalEstimated;

  return (
    <div className="printable-document hidden print:block text-black p-8 font-sans max-w-4xl mx-auto">
      {/* Print Document Header */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-black">
              {plan.concept.title}
            </h1>
            <p className="text-sm italic text-gray-700 mt-1">
              "{plan.concept.tagline}"
            </p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <div className="font-bold text-black uppercase tracking-wider">Veyora Event Blueprint</div>
            <div className="text-[10px] text-gray-500 italic">Every occasion, extraordinary.</div>
            <div>Date Generated: {new Date(plan.generatedAt).toLocaleDateString()}</div>
            <div>Status: Planned & Active</div>
          </div>
        </div>

        {/* Core Specs Bar */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-3 border-t border-gray-300 text-xs">
          <div>
            <span className="font-semibold block text-gray-600">Event Date:</span>
            <span className="font-medium text-black">{plan.input.eventDate}</span>
          </div>
          <div>
            <span className="font-semibold block text-gray-600">City / Venue:</span>
            <span className="font-medium text-black">
              {plan.selectedVenue ? plan.selectedVenue.name : `${plan.input.city} (${plan.input.venuePreference})`}
            </span>
            {plan.selectedVenue?.address && (
              <span className="block text-[10px] text-gray-600 truncate">{plan.selectedVenue.address}</span>
            )}
          </div>
          <div>
            <span className="font-semibold block text-gray-600">Guest Count:</span>
            <span className="font-medium text-black">{plan.input.guestCount} Guests</span>
          </div>
          <div>
            <span className="font-semibold block text-gray-600">Total Budget:</span>
            <span className="font-medium text-black">{currency} {totalBudget.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Concept Summary & Palette */}
      <div className="mb-6 print-avoid-break">
        <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-2 text-black">
          1. Concept & Atmosphere Vibe
        </h2>
        <p className="text-xs text-gray-800 leading-relaxed">
          {plan.concept.description}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-semibold text-gray-700">Recommended Dress Code: </span>
            <span className="text-gray-900">{plan.concept.dressCodeSuggestion}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Atmosphere Keywords: </span>
            <span className="text-gray-900">{plan.concept.vibeKeywords.join(' · ')}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs">
          <span className="font-semibold text-gray-700">Color Palette:</span>
          {plan.concept.colorPalette.map((c) => (
            <div key={c.name} className="flex items-center gap-1.5 border border-gray-300 px-2 py-0.5 rounded text-[11px]">
              <span
                className="inline-block w-3 h-3 rounded-full border border-gray-400"
                style={{ backgroundColor: c.hex }}
              />
              <span>{c.name} ({c.hex})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Itemized Budget Table */}
      <div className="mb-6 print-avoid-break">
        <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-2 text-black">
          2. Itemized Budget Allocation
        </h2>
        <table className="w-full text-left text-xs border border-gray-300">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="p-2 border-r border-gray-300">Category</th>
              <th className="p-2 border-r border-gray-300">Item Name & Specifications</th>
              <th className="p-2 text-right border-r border-gray-300">Estimated Cost</th>
              <th className="p-2 text-right">Actual / Committed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {plan.budgetPlan.items.map((item) => (
              <tr key={item.id}>
                <td className="p-2 border-r border-gray-200 font-medium text-gray-800">{item.category}</td>
                <td className="p-2 border-r border-gray-200">
                  <div className="font-semibold">{item.name}</div>
                  {item.notes && <div className="text-[10px] text-gray-600">{item.notes}</div>}
                </td>
                <td className="p-2 text-right border-r border-gray-200 font-mono">
                  {currency} {Number(item.estimatedCost).toLocaleString()}
                </td>
                <td className="p-2 text-right font-mono text-gray-700">
                  {item.actualCost !== undefined ? `${currency} ${Number(item.actualCost).toLocaleString()}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
              <td colSpan={2} className="p-2 border-r border-gray-300 text-right">Total Estimated Allocation:</td>
              <td className="p-2 text-right font-mono border-r border-gray-300">{currency} {totalEstimated.toLocaleString()}</td>
              <td className="p-2 text-right font-mono">
                {remaining >= 0 ? `Remaining: ${currency} ${remaining.toLocaleString()}` : `Over Budget: -${currency} ${Math.abs(remaining).toLocaleString()}`}
              </td>
            </tr>
          </tfoot>
        </table>
        <p className="mt-1 text-[10px] text-gray-500 italic">
          * Notice: Prices are planning estimates and benchmarks. Confirm final terms with individual licensed vendors.
        </p>
      </div>

      {/* Milestone Timeline Checklist */}
      <div className="mb-6 print-avoid-break">
        <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-2 text-black">
          3. Preparation Timeline Checklist
        </h2>
        <div className="space-y-2 text-xs">
          {plan.timeline.map((task) => (
            <div key={task.id} className="flex items-start gap-2 border-b border-gray-200 pb-1.5">
              <span className="font-mono text-sm leading-none mt-0.5">
                {task.isCompleted ? '[✓]' : '[ ]'}
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-baseline">
                  <span className={`font-semibold ${task.isCompleted ? 'line-through text-gray-500' : 'text-black'}`}>
                    {task.title}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {task.duePhase} · {task.priority.toUpperCase()}
                  </span>
                </div>
                {task.description && (
                  <p className="text-[11px] text-gray-600 mt-0.5">{task.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Day-of Run of Show */}
      {plan.dayOfSchedule && plan.dayOfSchedule.length > 0 && (
        <div className="mb-6 print-avoid-break">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-2 text-black">
            4. Day-of Master Run of Show Schedule
          </h2>
          <table className="w-full text-left text-xs border border-gray-300">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="p-2 border-r border-gray-300 w-24">Time</th>
                <th className="p-2 border-r border-gray-300">Milestone Activity</th>
                <th className="p-2 border-r border-gray-300">Execution Cues / Notes</th>
                <th className="p-2 w-28">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {plan.dayOfSchedule.map((s, idx) => (
                <tr key={idx}>
                  <td className="p-2 border-r border-gray-200 font-mono font-bold text-black">{s.time}</td>
                  <td className="p-2 border-r border-gray-200 font-semibold">{s.activity}</td>
                  <td className="p-2 border-r border-gray-200 text-gray-700">{s.details}</td>
                  <td className="p-2 text-gray-800">{s.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vendor Criteria Guide */}
      {plan.vendorRecommendations && plan.vendorRecommendations.length > 0 && (
        <div className="mb-6 print-avoid-break">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-2 text-black">
            5. Vendor Criteria & Vetting Checklist
          </h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {plan.vendorRecommendations.map((v) => (
              <div key={v.id} className="border border-gray-300 p-2.5 rounded">
                <div className="flex justify-between items-baseline font-bold text-black">
                  <span>{v.name} ({v.category})</span>
                  <span className="font-mono text-gray-600">{v.priceRange}</span>
                </div>
                <div className="text-[11px] text-gray-700 mt-0.5">{v.specialty}</div>
                <div className="text-[10px] text-gray-500 mt-1 font-mono">
                  Rate Benchmark: {v.estimatedCost} · Window: {v.recommendedBookingWindow}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Theme Inspiration & Visual Assets (If Present) */}
      {plan.inspirationBoard && plan.inspirationBoard.length > 0 && (
        <div className="mb-6 print-avoid-break">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-2 text-black">
            6. Theme & Visual Inspiration Board
          </h2>
          <div className="grid grid-cols-3 gap-3 text-xs">
            {plan.inspirationBoard.map((item) => (
              <div key={item.id} className="border border-gray-300 p-2 rounded flex flex-col justify-between">
                <div className="aspect-video w-full overflow-hidden bg-gray-100 rounded mb-1.5">
                  <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                </div>
                <div>
                  <div className="font-bold text-black text-[11px] line-clamp-1">{item.title}</div>
                  <div className="text-[10px] text-gray-600">{item.category} ({item.source.replace('_', ' ')})</div>
                  {item.notes && <div className="text-[9px] text-gray-500 italic mt-0.5 line-clamp-1">{item.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Host Signoff Footer */}
      <div className="mt-8 pt-4 border-t-2 border-black flex justify-between text-xs text-gray-600">
        <div>Event Lead Signature: ___________________________</div>
        <div>Coordinator / Date: ___________________________</div>
      </div>
    </div>
  );
};
