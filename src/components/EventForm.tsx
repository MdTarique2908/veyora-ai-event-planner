import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Palette,
  Utensils,
  Home,
  FileText,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { EventInput, EventType, VenueType } from '../types/event';

interface EventFormProps {
  onSubmit: (input: EventInput) => Promise<void>;
  isLoading: boolean;
  onLoadSample: (sampleId: string) => void;
}

const EVENT_TYPES: { value: EventType; label: string; icon: string }[] = [
  { value: 'birthday', label: 'Birthday Party', icon: '🎂' },
  { value: 'wedding', label: 'Wedding Celebration', icon: '💍' },
  { value: 'college', label: 'College / Grad Fest', icon: '🎓' },
  { value: 'community', label: 'Community Gathering', icon: '🤝' },
  { value: 'anniversary', label: 'Anniversary', icon: '🥂' },
  { value: 'baby_shower', label: 'Baby Shower', icon: '🍼' },
  { value: 'corporate', label: 'Corporate / Team Event', icon: '💼' },
  { value: 'other', label: 'Other Special Event', icon: '✨' },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

const POPULAR_THEMES = [
  'Modern Minimalist Elegance',
  'Cyber Neon & Synthwave',
  'Boho Garden & Botanical',
  'Rustic Barn & Fairy Lights',
  '90s Retro Nostalgia',
  'Tropical Summer Festival',
  'Golden Hour Glamour',
  'Cozy Community Potluck',
];

const DIETARY_OPTIONS = [
  'Buffet Style',
  'Plated Service',
  'Street Food Stations',
  'Finger Foods / Canapés',
  'Vegetarian Friendly',
  'Vegan Options',
  'Gluten-Free Designated',
  'Halal Certified',
  'Kosher Certified',
  'Craft Mocktails Bar',
  'Open Cocktail Bar',
];

export const EventForm: React.FC<EventFormProps> = ({
  onSubmit,
  isLoading,
  onLoadSample,
}) => {
  // Form State
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('birthday');
  const [customEventType, setCustomEventType] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [city, setCity] = useState('');
  const [guestCount, setGuestCount] = useState<number>(50);
  const [totalBudget, setTotalBudget] = useState<number>(3000);
  const [currency, setCurrency] = useState('USD');
  const [themeStyle, setThemeStyle] = useState('Modern Minimalist Elegance');
  const [customTheme, setCustomTheme] = useState('');
  const [selectedDiets, setSelectedDiets] = useState<string[]>([
    'Buffet Style',
    'Vegetarian Friendly',
    'Craft Mocktails Bar',
  ]);
  const [customDiet, setCustomDiet] = useState('');
  const [venuePreference, setVenuePreference] = useState<VenueType>('hybrid');
  const [specialRequirements, setSpecialRequirements] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingStage, setLoadingStage] = useState(0);

  // Toggle dietary option
  const toggleDiet = (diet: string) => {
    if (selectedDiets.includes(diet)) {
      setSelectedDiets(selectedDiets.filter((d) => d !== diet));
    } else {
      setSelectedDiets([...selectedDiets, diet]);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Event title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Event title must be at least 3 characters';
    }

    if (!eventDate) {
      newErrors.eventDate = 'Event date is required';
    }

    if (!city.trim()) {
      newErrors.city = 'City or location is required';
    }

    if (!guestCount || guestCount < 1) {
      newErrors.guestCount = 'At least 1 guest is required';
    }

    if (!totalBudget || totalBudget < 50) {
      newErrors.totalBudget = 'Please enter a realistic budget (min 50)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalTheme = customTheme.trim() ? customTheme.trim() : themeStyle;
    const allDiets = [...selectedDiets];
    if (customDiet.trim()) {
      allDiets.push(customDiet.trim());
    }

    const payload: EventInput = {
      id: `event-${Date.now()}`,
      title: title.trim(),
      eventType,
      customEventType: eventType === 'other' ? customEventType.trim() : undefined,
      eventDate,
      city: city.trim(),
      guestCount: Number(guestCount),
      totalBudget: Number(totalBudget),
      currency,
      themeStyle: finalTheme,
      foodPreferences: allDiets,
      customDietary: customDiet.trim() || undefined,
      venuePreference,
      specialRequirements: specialRequirements.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Animate loading stages
    const timer1 = setTimeout(() => setLoadingStage(1), 1200);
    const timer2 = setTimeout(() => setLoadingStage(2), 2600);
    const timer3 = setTimeout(() => setLoadingStage(3), 4200);

    try {
      await onSubmit(payload);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setLoadingStage(0);
    }
  };

  // Quick preset helpers
  const handleQuickBudget = (multiplier: number) => {
    setTotalBudget(Math.round(guestCount * multiplier));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header & Sample Loaders */}
      <div className="mb-8 rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4A8]/60 bg-[#FAF6ED] dark:bg-[#1E2B45] px-3.5 py-1 text-xs font-semibold text-[#8C6D2C] dark:text-[#E8D4A8]">
              <Sparkles className="h-3.5 w-3.5 text-[#C5A869]" />
              <span>Veyora AI Event Architect</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Create Your Tailored Event Plan
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Enter your event specifications below to generate an intelligent itemized budget, timeline, and vendor guide.
            </p>
          </div>

          {/* Quick Demo Preloads */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Quick Demo:</span>
            <button
              type="button"
              onClick={() => onLoadSample('sample-plan-birthday-1')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-white hover:text-indigo-600 transition-all cursor-pointer shadow-2xs"
            >
              🎂 21st Rooftop Bash
            </button>
            <button
              type="button"
              onClick={() => onLoadSample('sample-plan-wedding-2')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-white hover:text-indigo-600 transition-all cursor-pointer shadow-2xs"
            >
              💍 Garden Wedding
            </button>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Core Details */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-sm border border-indigo-200/60">
              1
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Event Basics</h2>
              <p className="text-xs text-slate-500">Title, celebration type, date, and host city</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Event Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">
                Event Name / Working Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Maya's 30th Milestone Birthday, Apex Tech Fest, Sunset Community Gala"
                className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all shadow-2xs ${
                  errors.title
                    ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/20'
                    : 'border-stone-300 focus:border-indigo-600 focus:ring-indigo-600'
                }`}
              />
              {errors.title && (
                <p className="mt-1 flex items-center gap-1 text-xs text-rose-500">
                  <AlertCircle className="h-3 w-3" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Event Type Grid */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Celebration Category <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {EVENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setEventType(type.value)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all cursor-pointer ${
                      eventType === type.value
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-bold shadow-2xs'
                        : 'border-stone-200 bg-stone-50/60 text-slate-700 hover:border-indigo-200 hover:bg-white'
                    }`}
                  >
                    <span className="text-base">{type.icon}</span>
                    <span className="truncate">{type.label}</span>
                  </button>
                ))}
              </div>

              {eventType === 'other' && (
                <input
                  type="text"
                  value={customEventType}
                  onChange={(e) => setCustomEventType(e.target.value)}
                  placeholder="Specify event type (e.g. Retirement Roast, Hackathon Demo Day)"
                  className="mt-3 w-full rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                />
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Target Celebration Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 transition-all shadow-2xs ${
                    errors.eventDate
                      ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/20'
                      : 'border-stone-300 focus:border-indigo-600 focus:ring-indigo-600'
                  }`}
                />
                <Calendar className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
              </div>
              {errors.eventDate && (
                <p className="mt-1 flex items-center gap-1 text-xs text-rose-500">
                  <AlertCircle className="h-3 w-3" />
                  {errors.eventDate}
                </p>
              )}
            </div>

            {/* City / Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                City / Region <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Chicago, IL or London, UK"
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all shadow-2xs ${
                    errors.city
                      ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/20'
                      : 'border-stone-300 focus:border-indigo-600 focus:ring-indigo-600'
                  }`}
                />
                <MapPin className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
              </div>
              {errors.city && (
                <p className="mt-1 flex items-center gap-1 text-xs text-rose-500">
                  <AlertCircle className="h-3 w-3" />
                  {errors.city}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Scale & Budget */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-sm border border-indigo-200/60">
              2
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Guest Headcount & Budget</h2>
              <p className="text-xs text-slate-500">Accurate sizing enables realistic vendor math</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Guest Count */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Estimated Guests <span className="text-rose-500">*</span>
                </label>
                <span className="font-mono text-sm font-bold text-indigo-700">
                  {guestCount} people
                </span>
              </div>
              <div className="mt-2">
                <input
                  type="range"
                  min="5"
                  max="500"
                  step="5"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-stone-200 accent-indigo-600"
                />
                <div className="mt-2.5 flex items-center justify-between gap-1">
                  {[20, 50, 100, 200, 350].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setGuestCount(count)}
                      className={`rounded-lg border px-2 py-1 text-[11px] font-mono transition-colors cursor-pointer ${
                        guestCount === count
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-800 font-bold'
                          : 'border-stone-200 bg-stone-50 text-slate-600 hover:text-slate-900 hover:bg-stone-100'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
              {errors.guestCount && (
                <p className="mt-1 flex items-center gap-1 text-xs text-rose-500">
                  <AlertCircle className="h-3 w-3" />
                  {errors.guestCount}
                </p>
              )}
            </div>

            {/* Total Budget & Currency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Total Target Budget <span className="text-rose-500">*</span>
              </label>
              <div className="mt-1.5 flex gap-2">
                {/* Currency select */}
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-24 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none shadow-2xs"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>

                {/* Amount input */}
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(Number(e.target.value))}
                    placeholder="3000"
                    className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all shadow-2xs ${
                      errors.totalBudget
                        ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/20'
                        : 'border-stone-300 focus:border-indigo-600 focus:ring-indigo-600'
                    }`}
                  />
                  <DollarSign className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Per guest estimate badge */}
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                <span>Per-guest allowance:</span>
                <span className="font-semibold text-slate-800">
                  {currency} {guestCount > 0 ? (totalBudget / guestCount).toFixed(0) : 0} / person
                </span>
              </div>

              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Quick estimate:</span>
                <button
                  type="button"
                  onClick={() => handleQuickBudget(35)}
                  className="rounded-lg border border-stone-200 bg-stone-100 px-2 py-0.5 text-[10px] text-slate-700 hover:bg-stone-200 cursor-pointer"
                >
                  Budget (${35}/pp)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickBudget(65)}
                  className="rounded-lg border border-stone-200 bg-stone-100 px-2 py-0.5 text-[10px] text-slate-700 hover:bg-stone-200 cursor-pointer"
                >
                  Moderate (${65}/pp)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickBudget(120)}
                  className="rounded-lg border border-stone-200 bg-stone-100 px-2 py-0.5 text-[10px] text-slate-700 hover:bg-stone-200 cursor-pointer"
                >
                  Premium (${120}/pp)
                </button>
              </div>

              {errors.totalBudget && (
                <p className="mt-1 flex items-center gap-1 text-xs text-rose-500">
                  <AlertCircle className="h-3 w-3" />
                  {errors.totalBudget}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Aesthetic, Food & Venue */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-sm border border-indigo-200/60">
              3
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Theme, Catering & Setting</h2>
              <p className="text-xs text-slate-500">Guide the atmosphere, culinary direction, and spatial vibe</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Theme & Style */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Preferred Theme / Atmosphere Style
              </label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_THEMES.map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => {
                      setThemeStyle(theme);
                      setCustomTheme('');
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                      themeStyle === theme && !customTheme
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-2xs'
                        : 'border-stone-200 bg-stone-50 text-slate-700 hover:border-indigo-200 hover:bg-white'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                placeholder="Or specify your own custom theme (e.g. Wes Anderson Pastels, Roaring 20s Gatsby, Hogwarts Winter)"
                className="mt-3 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
              />
            </div>

            {/* Venue Preference */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Venue Preference
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { value: 'indoor' as VenueType, label: 'Indoor Hall / Loft', desc: 'Climate controlled' },
                  { value: 'outdoor' as VenueType, label: 'Outdoor / Garden', desc: 'Fresh air & open sky' },
                  { value: 'hybrid' as VenueType, label: 'Hybrid Space', desc: 'Indoor lounge + patio' },
                  { value: 'any' as VenueType, label: 'No Preference', desc: 'Flexible options' },
                ].map((venue) => (
                  <button
                    key={venue.value}
                    type="button"
                    onClick={() => setVenuePreference(venue.value)}
                    className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                      venuePreference === venue.value
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-semibold shadow-2xs'
                        : 'border-stone-200 bg-stone-50/60 text-slate-700 hover:border-indigo-200 hover:bg-white'
                    }`}
                  >
                    <div className="text-xs font-semibold">{venue.label}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">{venue.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Food and Dietary */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Food Style & Dietary Considerations
              </label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleDiet(opt)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                      selectedDiets.includes(opt)
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-semibold shadow-2xs'
                        : 'border-stone-200 bg-stone-50 text-slate-700 hover:border-indigo-200 hover:bg-white'
                    }`}
                  >
                    {selectedDiets.includes(opt) && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />}
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customDiet}
                onChange={(e) => setCustomDiet(e.target.value)}
                placeholder="Additional dietary notes (e.g. 3 guests with severe peanut allergies, mocktail only)"
                className="mt-3 w-full rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
              />
            </div>

            {/* Special Requirements */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Special Requirements & Wishlist (Optional)
              </label>
              <textarea
                rows={3}
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                placeholder="Mention special details, e.g. 'Must have wheelchair ramp access', 'Surprise speech at 8 PM', 'Need projector for slideshow', 'Pet-friendly celebration'"
                className="w-full rounded-xl border border-stone-300 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Submit Button & Interactive Loading State */}
        <div className="rounded-2xl border border-stone-200/90 bg-gradient-to-br from-indigo-50/40 via-white to-stone-50/60 p-8 text-center shadow-xs">
          {isLoading ? (
            <div className="py-6 space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 animate-pulse">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {loadingStage === 0 && 'Analyzing event brief & city market rates...'}
                {loadingStage === 1 && 'Synthesizing creative concept & bespoke color palette...'}
                {loadingStage === 2 && 'Balancing itemized budget & contingency funds...'}
                {loadingStage === 3 && 'Finalizing milestone schedule and vendor criteria...'}
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Gemini is assembling a comprehensive celebration blueprint with realistic pricing, milestone tasks, and guest experience ideas.
              </p>
              <div className="mx-auto max-w-xs overflow-hidden rounded-full bg-stone-200 h-2">
                <div className="h-full bg-indigo-600 rounded-full animate-pulse w-full"></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#172033] dark:bg-[#E8D4A8] px-8 py-3.5 text-sm font-semibold text-[#E8D4A8] dark:text-[#172033] shadow-md shadow-[#172033]/25 hover:bg-[#1E2B45] dark:hover:bg-[#DFCA95] border border-[#E8D4A8]/40 active:scale-98 focus:outline-none focus:ring-2 focus:ring-[#E8D4A8] transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-[#E8D4A8] dark:text-[#172033]" />
                <span>Generate Veyora Event Plan</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
          <p className="mt-3 text-[11px] text-slate-500">
            Plans can be fully customized, budgeted, edited, and exported to clean PDF anytime.
          </p>
        </div>
      </form>
    </div>
  );
};
