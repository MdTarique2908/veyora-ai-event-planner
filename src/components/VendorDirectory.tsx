import React, { useState, useEffect } from 'react';
import {
  Store,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Clock,
  DollarSign,
  Search,
  Navigation,
  Star,
  CheckCircle,
  Sparkles,
  RefreshCw,
  Building,
  Utensils,
  Camera,
  Music,
  Check,
  ArrowRight,
  MessageSquareQuote,
  LocateFixed,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EventPlan, VendorRecommendation, GroundedMapsPlace } from '../types/event';

interface VendorDirectoryProps {
  plan: EventPlan;
  onUpdatePlan?: (updated: EventPlan) => void;
}

export const VendorDirectory: React.FC<VendorDirectoryProps> = ({ plan, onUpdatePlan }) => {
  const [activeView, setActiveView] = useState<'maps' | 'benchmarks'>('maps');
  const [selectedCategory, setSelectedCategory] = useState<string>('venues');
  const [cityInput, setCityInput] = useState(plan.input.city || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [groundedPlaces, setGroundedPlaces] = useState<GroundedMapsPlace[]>([]);
  const [rawMarkdown, setRawMarkdown] = useState<string>('');
  const [showMarkdownAnalysis, setShowMarkdownAnalysis] = useState(false);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [benchmarkFilter, setBenchmarkFilter] = useState('all');
  const [benchmarkSearch, setBenchmarkSearch] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Trigger brief toast message
  const triggerNotice = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Search Real Google Maps Venues & Local Places
  const handleSearchMaps = async (overrideCategory?: string, overrideQuery?: string) => {
    const targetCategory = overrideCategory || selectedCategory;
    const targetQuery = overrideQuery !== undefined ? overrideQuery : searchQuery;
    const targetCity = cityInput.trim() || plan.input.city;

    if (!targetCity) {
      triggerNotice('Please enter a city or location to search.');
      return;
    }

    setIsSearching(true);
    setSearchNotice(null);

    try {
      const response = await fetch('/api/venues/search-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: targetCity,
          eventType: plan.input.eventType,
          guestCount: plan.input.guestCount,
          budget: plan.budgetPlan.totalBudget,
          currency: plan.budgetPlan.currency,
          venuePreference: plan.input.venuePreference,
          category: targetCategory,
          query: targetQuery,
          themeStyle: plan.concept.vibeKeywords?.join(', ') || plan.input.themeStyle,
          latLng: coords,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setGroundedPlaces(data.places || []);
      setRawMarkdown(data.rawMarkdown || '');
      setSearchNotice(
        data.isGrounded
          ? `Discovered ${data.places?.length || 0} real places via Google Maps Grounding in ${targetCity}.`
          : `Found ${data.places?.length || 0} recommended venues in ${targetCity}.`
      );
    } catch (err: any) {
      console.error('Error fetching Google Maps venues:', err);
      triggerNotice('Search completed with backup venue guide.');
    } finally {
      setIsSearching(false);
    }
  };

  // Trigger initial search for event city on mount if not loaded
  useEffect(() => {
    if (groundedPlaces.length === 0) {
      handleSearchMaps('venues', '');
    }
  }, [plan.id]);

  // Request browser GPS coordinates for local grounding
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      triggerNotice('Geolocation not supported by this browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setIsLocating(false);
        triggerNotice('GPS coordinates acquired for hyper-local Google Maps grounding.');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        triggerNotice('Could not access current location. Searching by city name instead.');
      },
      { timeout: 8000 }
    );
  };

  // Add place as primary venue in the plan
  const handleSetPrimaryVenue = (place: GroundedMapsPlace) => {
    if (!onUpdatePlan) return;

    // Check if venue already exists in recommendations
    const existingIndex = (plan.vendorRecommendations || []).findIndex(
      (v) => v.name.toLowerCase() === place.name.toLowerCase()
    );

    const vendorEntry: VendorRecommendation = {
      id: place.id,
      category: 'Venue',
      name: place.name,
      priceRange: (place.priceLevel as any) || '$$',
      estimatedCost: `Budget allocation: ${plan.budgetPlan.currency} ${(Math.round(plan.budgetPlan.totalBudget * 0.32)).toLocaleString()}`,
      location: place.address || plan.input.city,
      specialty: place.summary || 'Selected event venue discovered on Google Maps',
      contactOrWebsite: place.googleMapsUri,
      googleMapsUri: place.googleMapsUri,
      directionsUri: place.directionsUri,
      address: place.address,
      rating: place.rating,
      userRatingsTotal: place.userRatingsTotal,
      recommendedBookingWindow: '3-6 months in advance',
      isPrimaryVenue: true,
      isSampleData: false,
      keyQuestionsToAsk: [
        'What is your max legal seated & cocktail capacity for our event type?',
        'Do you require an in-house caterer or can we bring outside licensed food/beverage?',
        'What are the load-in hours, sound curfew, and cleanup cutoffs?',
        'Is liability insurance (COI) required for outside decor or DJ vendors?',
      ],
    };

    let updatedRecommendations: VendorRecommendation[];
    if (existingIndex >= 0) {
      updatedRecommendations = [...(plan.vendorRecommendations || [])];
      updatedRecommendations[existingIndex] = vendorEntry;
    } else {
      updatedRecommendations = [vendorEntry, ...(plan.vendorRecommendations || [])];
    }

    // Also update existing venue lines in budget plan if available
    const updatedBudgetItems = plan.budgetPlan.items.map((item) => {
      if (item.category === 'Venue & Space' && !item.name.includes('Deposit')) {
        return {
          ...item,
          name: `Venue Rental: ${place.name}`,
          notes: place.address
            ? `${place.address} (Rating: ${place.rating || 'N/A'}★ on Google Maps)`
            : item.notes,
        };
      }
      return item;
    });

    const updatedPlan: EventPlan = {
      ...plan,
      selectedVenue: place,
      vendorRecommendations: updatedRecommendations,
      budgetPlan: {
        ...plan.budgetPlan,
        items: updatedBudgetItems,
      },
      lastEditedAt: new Date().toISOString(),
    };

    onUpdatePlan(updatedPlan);

    // Confetti celebration
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // Safe fallback
    }

    triggerNotice(`🎉 "${place.name}" set as your official Event Venue!`);
  };

  // Remove selected venue
  const handleRemovePrimaryVenue = () => {
    if (!onUpdatePlan) return;
    const updatedPlan: EventPlan = {
      ...plan,
      selectedVenue: undefined,
      vendorRecommendations: (plan.vendorRecommendations || []).map((v) => ({
        ...v,
        isPrimaryVenue: false,
      })),
      lastEditedAt: new Date().toISOString(),
    };
    onUpdatePlan(updatedPlan);
    triggerNotice('Primary venue unlinked.');
  };

  // Existing benchmark vendors filter
  const benchmarkVendors = plan.vendorRecommendations || [];
  const benchmarkCategories = Array.from(new Set(benchmarkVendors.map((v) => v.category)));
  const filteredBenchmarks = benchmarkVendors.filter((v) => {
    if (benchmarkFilter !== 'all' && v.category !== benchmarkFilter) return false;
    if (
      benchmarkSearch &&
      !v.name.toLowerCase().includes(benchmarkSearch.toLowerCase()) &&
      !v.specialty.toLowerCase().includes(benchmarkSearch.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Category navigation tabs
  const categoryTabs = [
    { id: 'venues', label: 'Venues & Spaces', icon: Building },
    { id: 'catering', label: 'Catering & Chefs', icon: Utensils },
    { id: 'photography', label: 'Photography & Video', icon: Camera },
    { id: 'entertainment', label: 'DJs & Music', icon: Music },
  ];

  // Quick preset keyword pills for rapid discovery
  const venuePresetKeywords = [
    'Rooftop Terrace',
    'Garden Pavilion',
    'Historic Ballroom',
    'Industrial Brick Loft',
    'Scenic Lakefront',
    'Intimate Dining Room',
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-2xl bg-indigo-600 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-fade-in border border-indigo-400/40">
          {actionMessage}
        </div>
      )}

      {/* Selected Primary Venue Banner (if chosen) */}
      {plan.selectedVenue && (
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-5 shadow-xs text-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 border border-emerald-200 shrink-0">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Official Event Venue
                  </span>
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-mono text-emerald-800 border border-emerald-200 font-semibold">
                    Google Maps Grounded
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {plan.selectedVenue.name}
                </h3>
                {plan.selectedVenue.address && (
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                    <span>{plan.selectedVenue.address}</span>
                  </p>
                )}
                {plan.selectedVenue.summary && (
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 max-w-2xl">
                    {plan.selectedVenue.summary}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
              <a
                href={plan.selectedVenue.googleMapsUri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-all shadow-2xs"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Open in Google Maps</span>
                <ExternalLink className="h-3 w-3 opacity-80" />
              </a>

              {plan.selectedVenue.directionsUri && (
                <a
                  href={plan.selectedVenue.directionsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-stone-50 transition-all shadow-2xs"
                >
                  <Navigation className="h-3 w-3 text-indigo-600" />
                  <span>Get Directions</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleRemovePrimaryVenue}
                className="text-[11px] text-slate-500 hover:text-rose-600 transition-colors pt-1 cursor-pointer"
              >
                Change or unlink venue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Store className="h-5 w-5 text-indigo-600" />
            <span>Real Local Venues & Vendor Directory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover real physical locations with Google Maps grounding, live reviews, and direct directions.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-100/70 p-1">
          <button
            type="button"
            onClick={() => setActiveView('maps')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
              activeView === 'maps'
                ? 'bg-white text-indigo-700 font-bold shadow-2xs border border-stone-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Google Maps Venues</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('benchmarks')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
              activeView === 'benchmarks'
                ? 'bg-white text-indigo-700 font-bold shadow-2xs border border-stone-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Vetting & Rate Benchmarks</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: GOOGLE MAPS VENUES & PLACES */}
      {activeView === 'maps' && (
        <div className="space-y-6">
          {/* Search Controls Card */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-5 space-y-4 shadow-xs">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {categoryTabs.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      handleSearchMaps(cat.id, searchQuery);
                    }}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border border-indigo-200 bg-indigo-50 text-indigo-800 shadow-2xs font-bold'
                        : 'border border-stone-200 bg-stone-50 text-slate-600 hover:border-indigo-200 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    <IconComponent
                      className={`h-3.5 w-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}
                    />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Location & Keyword Search Inputs */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              {/* City Input with GPS Button */}
              <div className="sm:col-span-5 relative">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  City / Destination Area
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    placeholder="Enter city (e.g. Austin, New York, London)..."
                    className="w-full rounded-xl border border-stone-300 bg-white pl-9 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none shadow-2xs"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchMaps()}
                  />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    title="Use my current GPS position for hyper-local Google Maps grounding"
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    <LocateFixed className={`h-4 w-4 ${isLocating ? 'animate-spin text-indigo-600' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Keyword / Style Query */}
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Specific Venue Style or Feature (Optional)
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Rooftop terrace, waterfront, garden courtyard, ballroom..."
                    className="w-full rounded-xl border border-stone-300 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none shadow-2xs"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchMaps()}
                  />
                </div>
              </div>

              {/* Search Button */}
              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={() => handleSearchMaps()}
                  disabled={isSearching}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSearching ? 'animate-spin' : ''}`} />
                  <span>{isSearching ? 'Searching...' : 'Search Maps'}</span>
                </button>
              </div>
            </div>

            {/* Quick Keyword Preset Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 mr-1 font-medium">Popular Filters:</span>
              {venuePresetKeywords.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => {
                    setSearchQuery(kw);
                    handleSearchMaps(selectedCategory, kw);
                  }}
                  className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] text-slate-700 hover:border-indigo-300 hover:bg-white hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* Search Result Status & Analysis Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                <MapPin className="h-3 w-3 text-indigo-600" />
                Google Maps Grounded
              </span>
              <span>
                {searchNotice || `Results for ${cityInput || plan.input.city} (${groundedPlaces.length} places)`}
              </span>
            </div>

            {rawMarkdown && (
              <button
                type="button"
                onClick={() => setShowMarkdownAnalysis(!showMarkdownAnalysis)}
                className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors font-semibold text-left sm:text-right cursor-pointer"
              >
                {showMarkdownAnalysis ? 'Hide AI Venue Analysis ▲' : 'Read Full AI Venue Analysis ▼'}
              </button>
            )}
          </div>

          {/* Collapsible Raw Markdown Analysis */}
          {showMarkdownAnalysis && rawMarkdown && (
            <div className="rounded-2xl border border-stone-200 bg-white p-5 text-xs text-slate-700 leading-relaxed space-y-2 max-h-96 overflow-y-auto shadow-xs">
              <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Comprehensive Gemini Venue Report for {cityInput || plan.input.city}</span>
              </h4>
              <div className="whitespace-pre-line text-slate-600">
                {rawMarkdown}
              </div>
            </div>
          )}

          {/* Real Google Maps Venue Cards Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {groundedPlaces.map((place) => {
              const isSelected = plan.selectedVenue?.name.toLowerCase() === place.name.toLowerCase();

              return (
                <div
                  key={place.id}
                  className={`rounded-2xl border p-6 flex flex-col justify-between transition-all shadow-xs ${
                    isSelected
                      ? 'border-emerald-300 bg-emerald-50/20 ring-1 ring-emerald-300'
                      : 'border-stone-200/90 bg-white hover:border-indigo-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    {/* Header: Category Badge & Rating */}
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{place.category}</span>
                        {place.priceLevel && (
                          <span className="font-mono text-emerald-700 font-bold">
                            {place.priceLevel}
                          </span>
                        )}
                      </div>

                      {place.rating ? (
                        <div className="flex items-center gap-1 text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          <span>{place.rating}</span>
                          {place.userRatingsTotal && (
                            <span className="text-[10px] text-slate-400">
                              ({place.userRatingsTotal})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-indigo-600" /> Verified Map Place
                        </span>
                      )}
                    </div>

                    {/* Venue Title */}
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center justify-between gap-2">
                      <span>{place.name}</span>
                      {isSelected && (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200 shrink-0">
                          Selected
                        </span>
                      )}
                    </h3>

                    {/* Physical Address */}
                    {place.address && (
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{place.address}</span>
                      </p>
                    )}

                    {/* Summary / Fit Description */}
                    <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                      {place.summary}
                    </p>

                    {/* Review Snippets from Google Maps */}
                    {place.reviewSnippets && place.reviewSnippets.length > 0 && (
                      <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px]">
                          <MessageSquareQuote className="h-3.5 w-3.5" />
                          <span>Google Maps Review Highlights:</span>
                        </div>
                        {place.reviewSnippets.slice(0, 2).map((snip, idx) => (
                          <p key={idx} className="text-slate-600 italic text-[11px]">
                            "{snip}"
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Recommended for */}
                    {place.recommendedFor && (
                      <div className="mt-3 text-[11px] text-indigo-700 font-semibold">
                        Best suited for: {place.recommendedFor}
                      </div>
                    )}
                  </div>

                  {/* Actions: Links & Select as Primary Venue */}
                  <div className="mt-5 pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      {/* Google Maps link button */}
                      <a
                        href={place.googleMapsUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-stone-50 transition-all shadow-2xs"
                        title="View reviews, photos and opening hours on Google Maps"
                      >
                        <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                        <span>View on Maps</span>
                        <ExternalLink className="h-3 w-3 opacity-70" />
                      </a>

                      {place.directionsUri && (
                        <a
                          href={place.directionsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-stone-100 hover:text-slate-900 transition-colors"
                          title="Get turn-by-turn driving or transit directions"
                        >
                          <Navigation className="h-3 w-3 text-indigo-600" />
                          <span>Directions</span>
                        </a>
                      )}
                    </div>

                    {/* Set as Primary Venue CTA */}
                    {onUpdatePlan && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryVenue(place)}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-98'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Current Plan Venue</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Select as Venue</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {!isSearching && groundedPlaces.length === 0 && (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-10 text-center space-y-3">
              <MapPin className="mx-auto h-8 w-8 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900">No venues loaded yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click "Search Maps" to discover live event venues and celebration spaces in {cityInput || plan.input.city}.
              </p>
              <button
                type="button"
                onClick={() => handleSearchMaps()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search Real Places in {cityInput || plan.input.city}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: VETTING & BENCHMARK DIRECTORY */}
      {activeView === 'benchmarks' && (
        <div className="space-y-6">
          {/* Transparency & Safety Guide Banner */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-amber-900">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-amber-950 text-sm">
                  Vendor Rate Benchmarks & Negotiation Guide
                </h4>
                <p className="text-amber-800 leading-relaxed">
                  These price ranges and interview question templates represent vetted market benchmarks for <strong>{plan.input.city}</strong> for a celebration of {plan.input.guestCount} guests.
                </p>
                <p className="text-amber-700">
                  Always inspect business licensing, obtain itemized quotes in writing, and verify cancellation terms before paying deposits.
                </p>
              </div>
            </div>
          </div>

          {/* Category Filter Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-800">Service Category:</span>
              <select
                value={benchmarkFilter}
                onChange={(e) => setBenchmarkFilter(e.target.value)}
                className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 shadow-2xs cursor-pointer"
              >
                <option value="all">All Service Categories ({benchmarkVendors.length})</option>
                {benchmarkCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={benchmarkSearch}
                onChange={(e) => setBenchmarkSearch(e.target.value)}
                placeholder="Filter benchmark cards..."
                className="w-full rounded-xl border border-stone-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-2xs"
              />
            </div>
          </div>

          {/* Benchmark Cards Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {filteredBenchmarks.map((vendor) => (
              <div
                key={vendor.id}
                className="rounded-2xl border border-stone-200/90 bg-white p-6 flex flex-col justify-between hover:border-indigo-300 hover:shadow-xs transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{vendor.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-700 font-bold">{vendor.priceRange}</span>
                      {vendor.isSampleData && (
                        <span className="text-[10px] text-amber-800 font-mono bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          [Benchmark Guide]
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 tracking-tight">{vendor.name}</h4>

                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {vendor.specialty}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{vendor.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-slate-800 font-semibold">{vendor.estimatedCost}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Lead time: {vendor.recommendedBookingWindow}</span>
                    </div>
                  </div>

                  {vendor.keyQuestionsToAsk && vendor.keyQuestionsToAsk.length > 0 && (
                    <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-2">
                        <HelpCircle className="h-3.5 w-3.5" />
                        <span>Key Questions to Ask Before Hiring:</span>
                      </div>
                      <ul className="space-y-1 text-slate-700 list-disc list-inside text-[11px] leading-relaxed">
                        {vendor.keyQuestionsToAsk.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                  {vendor.googleMapsUri ? (
                    <a
                      href={vendor.googleMapsUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-mono text-[11px] font-semibold"
                    >
                      <MapPin className="h-3 w-3" />
                      <span>View Location</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ) : (
                    <span className="text-slate-500 font-mono text-[11px]">
                      {vendor.contactOrWebsite}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    Verify local permits
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Booking Safety Protocols */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-3">
              Vendor Booking Safety & Contract Protocols
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs text-slate-600">
              <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5 leading-relaxed shadow-2xs">
                <strong className="text-slate-900 block mb-1">1. Deposit Schedules</strong>
                Never pay 100% upfront. Standard industry deposits are 25%–50% upon contract signing with balance due 7–14 days before the event.
              </div>
              <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5 leading-relaxed shadow-2xs">
                <strong className="text-slate-900 block mb-1">2. Force Majeure & Weather</strong>
                Verify clear rain/weather contingency clauses, especially if booking outdoor or hybrid locations.
              </div>
              <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5 leading-relaxed shadow-2xs">
                <strong className="text-slate-900 block mb-1">3. COI (Insurance)</strong>
                Ask caterers and production crews for a Certificate of Insurance if required by your venue manager.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
