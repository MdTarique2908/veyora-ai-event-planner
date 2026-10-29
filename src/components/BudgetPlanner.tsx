import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Check,
  TrendingDown,
  TrendingUp,
  Info,
  PieChart,
  BarChart3,
  CalendarRange,
  ShieldAlert,
  Save,
  Sparkles,
  RefreshCw,
  Wand2,
  Scale,
  X,
  ArrowRight,
  CheckCircle2,
  Globe,
  ArrowRightLeft,
} from 'lucide-react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  ComposedChart,
  Line,
  Legend as RechartsLegend,
} from 'recharts';
import { BudgetItem, EventPlan } from '../types/event';
import { useTheme } from '../context/ThemeContext';

interface BudgetPlannerProps {
  plan: EventPlan;
  onUpdatePlan: (updatedPlan: EventPlan) => void;
}

const CATEGORIES: BudgetItem['category'][] = [
  'Venue & Space',
  'Food & Beverages',
  'Decor & Styling',
  'Photography & Video',
  'Entertainment & Audio',
  'Stationery & Favors',
  'Staff & Operations',
  'Contingency Fund',
];

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rateToUSD: number;
}

export const EXCHANGE_RATES: Record<string, CurrencyInfo> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', rateToUSD: 1.0 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rateToUSD: 0.92 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', rateToUSD: 0.79 },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', rateToUSD: 83.5 },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', rateToUSD: 1.36 },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', rateToUSD: 1.52 },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', rateToUSD: 154.2 },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', rateToUSD: 1.35 },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭', rateToUSD: 0.91 },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', rateToUSD: 3.67 },
};

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({
  plan,
  onUpdatePlan,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const baseCurrency = plan.budgetPlan.currency || 'USD';
  const [viewCurrency, setViewCurrency] = useState<string>(baseCurrency);

  // Keep in sync if plan's base currency updates externally
  useEffect(() => {
    if (!EXCHANGE_RATES[viewCurrency]) {
      setViewCurrency(baseCurrency);
    }
  }, [baseCurrency]);

  const baseRate = EXCHANGE_RATES[baseCurrency]?.rateToUSD ?? 1.0;
  const targetRate = EXCHANGE_RATES[viewCurrency]?.rateToUSD ?? 1.0;
  const fxMultiplier = targetRate / baseRate;
  const isConverted = viewCurrency !== baseCurrency;

  // Active currency symbol/code for all visual displays
  const currency = viewCurrency;

  // Convert raw value into current view currency
  const convertCost = (val: number | string | undefined): number => {
    if (val === undefined || val === null || val === '') return 0;
    return Math.round(Number(val) * fxMultiplier);
  };

  const rawTotalBudget = plan.budgetPlan.totalBudget;
  const totalBudget = convertCost(rawTotalBudget);

  // Editing line items
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCost, setEditCost] = useState<number>(0);
  const [editActual, setEditActual] = useState<string>('');
  const [editNotes, setEditNotes] = useState('');
  const [editCategory, setEditCategory] = useState<BudgetItem['category']>('Food & Beverages');
  const [editEssential, setEditEssential] = useState<boolean>(true);

  // New item modal / form
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState<number>(100);
  const [newCategory, setNewCategory] = useState<BudgetItem['category']>('Food & Beverages');
  const [newNotes, setNewNotes] = useState('');
  const [newEssential, setNewEssential] = useState(true);

  // Filter category
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  type ChartMode = 'donut' | 'bar' | 'variance' | 'cashflow';
  const [chartMode, setChartMode] = useState<ChartMode>('donut');

  // Math calculations
  const rawTotalEstimated = plan.budgetPlan.items.reduce(
    (sum, item) => sum + (Number(item.estimatedCost) || 0),
    0
  );
  const totalEstimated = convertCost(rawTotalEstimated);

  const rawTotalActual = plan.budgetPlan.items.reduce(
    (sum, item) => sum + (item.actualCost !== undefined ? Number(item.actualCost) : 0),
    0
  );
  const totalActual = convertCost(rawTotalActual);

  const remaining = totalBudget - totalEstimated;
  const isOverBudget = remaining < 0;
  const percentUsed = Math.min(Math.round((totalEstimated / (totalBudget || 1)) * 100), 100);

  // Category Color Palette
  const CATEGORY_COLORS: Record<string, string> = {
    'Venue & Space': '#4f46e5', // Indigo
    'Food & Beverages': '#0284c7', // Sky
    'Decor & Styling': '#7c3aed', // Violet
    'Photography & Video': '#059669', // Emerald
    'Entertainment & Audio': '#d97706', // Amber
    'Stationery & Favors': '#e11d48', // Rose
    'Staff & Operations': '#2563eb', // Blue
    'Contingency Fund': '#64748b', // Slate
  };

  // Group items by category for breakdown
  const categoryTotals: Record<string, number> = {};
  CATEGORIES.forEach((cat) => {
    categoryTotals[cat] = 0;
  });
  plan.budgetPlan.items.forEach((item) => {
    categoryTotals[item.category] =
      (categoryTotals[item.category] || 0) + convertCost(item.estimatedCost);
  });

  const chartData = CATEGORIES.map((cat) => {
    const amount = categoryTotals[cat] || 0;
    return {
      name: cat,
      value: amount,
      color: CATEGORY_COLORS[cat] || '#818cf8',
      percentage: totalEstimated > 0 ? ((amount / totalEstimated) * 100).toFixed(1) : '0',
    };
  })
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // Benchmark Percentages for Event Realism Analysis
  const BENCHMARK_PERCENTAGES: Record<string, { min: number; max: number; target: number }> = {
    'Venue & Space': { min: 25, max: 35, target: 30 },
    'Food & Beverages': { min: 28, max: 40, target: 34 },
    'Decor & Styling': { min: 6, max: 14, target: 10 },
    'Photography & Video': { min: 8, max: 15, target: 11 },
    'Entertainment & Audio': { min: 5, max: 12, target: 8 },
    'Stationery & Favors': { min: 2, max: 6, target: 3 },
    'Staff & Operations': { min: 2, max: 6, target: 4 },
    'Contingency Fund': { min: 5, max: 10, target: 7 },
  };

  // Category-based cost variance & realism comparison data
  const varianceData = CATEGORIES.map((cat) => {
    const currentCost = categoryTotals[cat] || 0;
    const benchmarkConfig = BENCHMARK_PERCENTAGES[cat] || { min: 5, max: 15, target: 10 };
    const benchmarkCost = Math.round((totalBudget * benchmarkConfig.target) / 100);
    const diff = currentCost - benchmarkCost;
    const currentPct = totalEstimated > 0 ? (currentCost / totalEstimated) * 100 : 0;

    let realismStatus: 'Balanced' | 'High Spend' | 'Lean / Low';
    if (currentCost === 0) {
      realismStatus = 'Lean / Low';
    } else if (currentPct > benchmarkConfig.max) {
      realismStatus = 'High Spend';
    } else if (currentPct < benchmarkConfig.min) {
      realismStatus = 'Lean / Low';
    } else {
      realismStatus = 'Balanced';
    }

    return {
      category: cat,
      plannedCost: currentCost,
      benchmarkCost: benchmarkCost,
      diff,
      status: realismStatus,
      targetPct: benchmarkConfig.target,
      currentPct: currentPct.toFixed(1),
      color: CATEGORY_COLORS[cat] || '#818cf8',
    };
  }).filter((d) => d.plannedCost > 0 || d.benchmarkCost > 0);

  // Month-over-month cash flow & disbursement milestone data
  const cashflowTrendData = (() => {
    const targetDate = new Date(plan.input.eventDate);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const eventMonth = isNaN(targetDate.getMonth()) ? new Date().getMonth() : targetDate.getMonth();
    const eventYear = isNaN(targetDate.getFullYear()) ? new Date().getFullYear() : targetDate.getFullYear();

    const milestones = [
      { offsetMonths: -3, label: 'M-3', phase: 'Venue & Photo Retainers', pct: 0.30 },
      { offsetMonths: -2, label: 'M-2', phase: 'Catering Deposit & Invites', pct: 0.25 },
      { offsetMonths: -1, label: 'M-1', phase: 'Decor, Music & Rentals', pct: 0.20 },
      { offsetMonths: 0, label: 'Event Month', phase: 'Final Balances & Tip Fund', pct: 0.25 },
    ];

    let runningCumulative = 0;
    return milestones.map((m) => {
      const d = new Date(eventYear, eventMonth + m.offsetMonths, 1);
      const periodLabel = isNaN(d.getTime()) ? m.label : `${monthNames[d.getMonth()]} (${m.label})`;
      const periodOutflow = Math.round(totalEstimated * m.pct);
      runningCumulative += periodOutflow;

      return {
        period: periodLabel,
        phase: m.phase,
        monthlyOutflow: periodOutflow,
        cumulativeSpend: Math.min(runningCumulative, totalEstimated),
        budgetLimit: totalBudget,
      };
    });
  })();

  // Start editing
  const handleStartEdit = (item: BudgetItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditCost(item.estimatedCost);
    setEditActual(item.actualCost !== undefined ? String(item.actualCost) : '');
    setEditNotes(item.notes || '');
    setEditCategory(item.category);
    setEditEssential(item.isEssential);
  };

  // Save edit
  const handleSaveEdit = (itemId: string) => {
    const updatedItems = plan.budgetPlan.items.map((it) => {
      if (it.id === itemId) {
        return {
          ...it,
          name: editName.trim() || it.name,
          estimatedCost: Number(editCost) || 0,
          actualCost: editActual.trim() !== '' ? Number(editActual) : undefined,
          notes: editNotes.trim(),
          category: editCategory,
          isEssential: editEssential,
        };
      }
      return it;
    });

    onUpdatePlan({
      ...plan,
      budgetPlan: {
        ...plan.budgetPlan,
        items: updatedItems,
      },
    });
    setEditingId(null);
  };

  // Delete item
  const handleDeleteItem = (itemId: string) => {
    const updatedItems = plan.budgetPlan.items.filter((it) => it.id !== itemId);
    onUpdatePlan({
      ...plan,
      budgetPlan: {
        ...plan.budgetPlan,
        items: updatedItems,
      },
    });
  };

  // Add new item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newItem: BudgetItem = {
      id: `custom-b-${Date.now()}`,
      category: newCategory,
      name: newName.trim(),
      estimatedCost: Number(newCost) || 0,
      notes: newNotes.trim(),
      isEssential: newEssential,
    };

    onUpdatePlan({
      ...plan,
      budgetPlan: {
        ...plan.budgetPlan,
        items: [...plan.budgetPlan.items, newItem],
      },
    });

    setNewName('');
    setNewCost(100);
    setNewNotes('');
    setIsAddingItem(false);
  };

  // AI Budget Re-allocation State & Handlers
  const [isReallocateModalOpen, setIsReallocateModalOpen] = useState(false);
  const [isReallocating, setIsReallocating] = useState(false);
  const [reallocateResult, setReallocateResult] = useState<{
    strategySummary: string;
    adjustedItems: {
      id: string;
      name: string;
      originalCost: number;
      newEstimatedCost: number;
      adjustmentReason: string;
    }[];
    savingsTotal: number;
    newTotal: number;
  } | null>(null);
  const [reallocateError, setReallocateError] = useState<string | null>(null);

  const handleOpenReallocate = async () => {
    setIsReallocateModalOpen(true);
    setIsReallocating(true);
    setReallocateError(null);

    try {
      const res = await fetch('/api/plan/reallocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: plan.budgetPlan.items,
          totalBudget: plan.budgetPlan.totalBudget,
          currency,
          eventDetails: {
            title: plan.concept.title,
            eventType: plan.input.eventType,
            guestCount: plan.input.guestCount,
            city: plan.input.city,
            themeStyle: plan.input.themeStyle,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to generate budget re-allocation');
      const data = await res.json();
      setReallocateResult(data);
    } catch (err: any) {
      console.error('Re-allocation error:', err);
      setReallocateError('Unable to generate AI recommendations right now. Please try again.');
    } finally {
      setIsReallocating(false);
    }
  };

  const handleApplyReallocation = () => {
    if (!reallocateResult || !reallocateResult.adjustedItems) return;

    const costMap = new Map<string, { newCost: number; reason: string }>();
    reallocateResult.adjustedItems.forEach((adj) => {
      costMap.set(adj.id, { newCost: adj.newEstimatedCost, reason: adj.adjustmentReason });
    });

    const updatedItems = plan.budgetPlan.items.map((it) => {
      const match = costMap.get(it.id);
      if (match) {
        return {
          ...it,
          estimatedCost: match.newCost,
          notes: it.notes ? `${it.notes} (AI Adjustment: ${match.reason})` : `AI Adjustment: ${match.reason}`,
        };
      }
      return it;
    });

    onUpdatePlan({
      ...plan,
      budgetPlan: {
        ...plan.budgetPlan,
        items: updatedItems,
      },
    });

    setIsReallocateModalOpen(false);
    setReallocateResult(null);
  };

  // Convert and set the active view currency as the plan's new base currency
  const handleSetAsBaseCurrency = () => {
    if (!isConverted) return;
    const updatedItems = plan.budgetPlan.items.map((it) => ({
      ...it,
      estimatedCost: Math.round(Number(it.estimatedCost) * fxMultiplier),
      actualCost: it.actualCost !== undefined ? Math.round(Number(it.actualCost) * fxMultiplier) : undefined,
    }));

    onUpdatePlan({
      ...plan,
      budgetPlan: {
        ...plan.budgetPlan,
        currency: viewCurrency,
        totalBudget: Math.round(plan.budgetPlan.totalBudget * fxMultiplier),
        items: updatedItems,
      },
    });
  };

  // Filtered list
  const filteredItems = plan.budgetPlan.items.filter((item) => {
    if (categoryFilter === 'all') return true;
    return item.category === categoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Warning Banner if Over Budget */}
      {isOverBudget && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 text-rose-900 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 border border-rose-200 text-rose-600 mt-0.5">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-rose-950">
                    Budget Warning: Estimated Costs Exceed Target by {currency}{' '}
                    {Math.abs(remaining).toLocaleString()}
                  </h4>
                  <span className="rounded-md bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-800">
                    +{Math.round((Math.abs(remaining) / (totalBudget || 1)) * 100)}% OVERRUN
                  </span>
                </div>
                <p className="mt-1 text-xs text-rose-800/90 leading-relaxed max-w-2xl">
                  Your current item allocations ({currency} {totalEstimated.toLocaleString()}) exceed your planned target limit ({currency} {totalBudget.toLocaleString()}). Non-essential/optional lines account for {currency} {plan.budgetPlan.items.filter(i => !i.isEssential).reduce((s, i) => s + convertCost(i.estimatedCost), 0).toLocaleString()}. Use the AI Assistant to automatically balance your budget while protecting essential priorities.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenReallocate}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 active:scale-98 transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-amber-200" />
                <span>AI Quick Re-Allocate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Currency Converter Toolbar */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Indicator & Live Mock Rate */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
              <Globe className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">Global Currency View</h4>
                <span className="rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-mono text-indigo-700 font-semibold">
                  Real-time FX
                </span>
                {isConverted && (
                  <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    Converted View
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Convert all budget items, charts, and variances dynamically.
                {isConverted ? (
                  <span className="text-amber-800 ml-1.5 font-medium">
                    (1 {baseCurrency} = {(targetRate / baseRate).toFixed(4)} {viewCurrency})
                  </span>
                ) : (
                  <span className="text-slate-500 ml-1.5">
                    Plan Base: {baseCurrency} (1.0000)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right: Quick Selector, Dropdown & Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Currency Tabs */}
            <div className="hidden sm:inline-flex items-center rounded-xl border border-stone-200 bg-stone-50 p-1 text-xs gap-0.5">
              {['USD', 'EUR', 'GBP', 'INR', 'CAD', 'JPY'].map((code) => {
                const info = EXCHANGE_RATES[code];
                const isSelected = viewCurrency === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setViewCurrency(code)}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-indigo-700 shadow-2xs border border-stone-200/80 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100'
                    }`}
                    title={info ? `${info.name} (${info.symbol})` : code}
                  >
                    <span>{info?.flag}</span>
                    <span className="font-mono">{code}</span>
                  </button>
                );
              })}
            </div>

            {/* Dropdown for All 10 Currencies */}
            <select
              value={viewCurrency}
              aria-label="Select currency"
              onChange={(e) => setViewCurrency(e.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none shadow-2xs cursor-pointer"
            >
              {Object.values(EXCHANGE_RATES).map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.flag} {curr.code} ({curr.symbol}) — {curr.name}
                </option>
              ))}
            </select>

            {/* Reset to Base Currency Button */}
            {isConverted && (
              <button
                type="button"
                onClick={() => setViewCurrency(baseCurrency)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-stone-100 transition-colors shadow-2xs cursor-pointer"
                title={`Reset view to original ${baseCurrency}`}
              >
                <ArrowRightLeft className="h-3.5 w-3.5 text-slate-500" />
                <span>Reset ({baseCurrency})</span>
              </button>
            )}

            {/* Commit / Save as Base Currency Button */}
            {isConverted && (
              <button
                type="button"
                onClick={handleSetAsBaseCurrency}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer"
                title={`Permanently set event base currency to ${viewCurrency} and scale all numbers`}
              >
                <Save className="h-3.5 w-3.5" />
                <span>Set as Base</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Target Budget</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {currency} {totalBudget.toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            For {plan.input.guestCount} guests (~{currency} {plan.input.guestCount > 0 ? (totalBudget / plan.input.guestCount).toFixed(0) : 0}/person)
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Estimated Cost</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {currency} {totalEstimated.toLocaleString()}
            </span>
            <span
              className={`text-xs font-semibold ${
                isOverBudget ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {Math.round((totalEstimated / (totalBudget || 1)) * 100)}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Across {plan.budgetPlan.items.length} itemized categories
          </p>
        </div>

        <div
          className={`rounded-2xl border p-5 shadow-xs ${
            isOverBudget
              ? 'border-rose-200 bg-rose-50/40'
              : 'border-stone-200/90 bg-white'
          }`}
        >
          <span className="text-xs font-medium text-slate-500">
            {isOverBudget ? 'Budget Overrun' : 'Remaining Cushion'}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight ${
                isOverBudget ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {isOverBudget ? '-' : '+'}
              {currency} {Math.abs(remaining).toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {isOverBudget
              ? 'Adjust costs or defer optional lines'
              : 'Safe buffer for incidentals'}
          </p>
        </div>
      </div>

      {/* Visual Budget Progress Bar */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-700 mb-2">
          <span className="font-semibold text-slate-800">Budget Allocation Progress</span>
          <span className="font-mono text-slate-500">
            {currency} {totalEstimated.toLocaleString()} / {currency} {totalBudget.toLocaleString()}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-stone-100 border border-stone-200/60">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isOverBudget
                ? 'bg-rose-500'
                : percentUsed > 90
                ? 'bg-amber-500'
                : 'bg-indigo-600'
            }`}
            style={{ width: `${Math.min((totalEstimated / (totalBudget || 1)) * 100, 100)}%` }}
          />
        </div>

        {/* Recharts Visual Distribution & Realism Analysis Section */}
        <div className="mt-6 pt-5 border-t border-stone-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Visual Budget Intelligence & Allocation Realism
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Analyze category shares, benchmark realism variances, and month-over-month deposit milestones.
              </p>
            </div>

            {/* Segmented Controls for 4 Chart Views */}
            <div className="inline-flex flex-wrap items-center rounded-xl border border-stone-200 bg-stone-100/70 p-1 gap-1">
              <button
                type="button"
                onClick={() => setChartMode('donut')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  chartMode === 'donut'
                    ? 'bg-white text-indigo-700 font-bold shadow-2xs border border-stone-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <PieChart className="h-3.5 w-3.5" />
                <span>Donut Share</span>
              </button>

              <button
                type="button"
                onClick={() => setChartMode('bar')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  chartMode === 'bar'
                    ? 'bg-white text-indigo-700 font-bold shadow-2xs border border-stone-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Ranked Bar</span>
              </button>

              <button
                type="button"
                onClick={() => setChartMode('variance')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  chartMode === 'variance'
                    ? 'bg-white text-indigo-700 font-bold shadow-2xs border border-stone-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Scale className="h-3.5 w-3.5" />
                <span>Market Variance</span>
              </button>

              <button
                type="button"
                onClick={() => setChartMode('cashflow')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  chartMode === 'cashflow'
                    ? 'bg-white text-indigo-700 font-bold shadow-2xs border border-stone-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <CalendarRange className="h-3.5 w-3.5" />
                <span>Month-over-Month Trend</span>
              </button>
            </div>
          </div>

          {chartData.length > 0 ? (
            <div>
              {/* Mode 1: Donut Share */}
              {chartMode === 'donut' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-7 h-[280px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="rounded-xl border border-stone-200 bg-white/95 p-3 shadow-xl backdrop-blur-md text-xs z-30 text-slate-900">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: data.color }}
                                    />
                                    <span className="font-bold text-slate-900">{data.name}</span>
                                  </div>
                                  <div className="mt-1 font-mono text-indigo-700 font-bold text-sm">
                                    {currency} {Number(data.value).toLocaleString()}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    {data.percentage}% of estimated allocation
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={3}
                          stroke={isDark ? '#0f172a' : '#ffffff'}
                          strokeWidth={2}
                        >
                          {chartData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[11px] font-medium text-slate-500">Total Estimated</span>
                      <span className="text-base font-bold font-mono text-slate-900 mt-0.5">
                        {currency} {totalEstimated.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-indigo-600 font-mono mt-0.5 font-semibold">
                        {chartData.length} Categories
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 grid grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {chartData.map((item) => (
                      <div
                        key={item.name}
                        className="rounded-xl border border-stone-200/90 bg-stone-50/60 p-2.5 transition-all hover:border-indigo-300 hover:bg-white shadow-2xs"
                      >
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-slate-700 font-semibold truncate">{item.name}</span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between">
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            {currency} {item.value.toLocaleString()}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-indigo-700">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode 2: Ranked Bar */}
              {chartMode === 'bar' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-7 h-[280px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 8, right: 24, left: 10, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} horizontal={false} />
                        <XAxis
                          type="number"
                          tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                          tickFormatter={(val) =>
                            val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`
                          }
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={120}
                          tick={{ fill: isDark ? '#cbd5e1' : '#334155', fontSize: 11 }}
                          tickLine={false}
                        />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="rounded-xl border border-stone-200 bg-white/95 p-3 shadow-xl backdrop-blur-md text-xs z-30 text-slate-900">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: data.color }}
                                    />
                                    <span className="font-bold text-slate-900">{data.name}</span>
                                  </div>
                                  <div className="mt-1 font-mono text-indigo-700 font-bold text-sm">
                                    {currency} {Number(data.value).toLocaleString()}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    {data.percentage}% of estimated allocation
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                          {chartData.map((entry) => (
                            <Cell key={`bar-${entry.name}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="lg:col-span-5 grid grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {chartData.map((item) => (
                      <div
                        key={item.name}
                        className="rounded-xl border border-stone-200/90 bg-stone-50/60 p-2.5 transition-all hover:border-indigo-300 hover:bg-white shadow-2xs"
                      >
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-slate-700 font-semibold truncate">{item.name}</span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between">
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            {currency} {item.value.toLocaleString()}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-indigo-700">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode 3: Market Variance & Realism Benchmark Analysis */}
              {chartMode === 'variance' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-7 h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={varianceData}
                        margin={{ top: 12, right: 20, left: 0, bottom: 24 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                        <XAxis
                          dataKey="category"
                          tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          height={45}
                        />
                        <YAxis
                          tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                          tickFormatter={(val) =>
                            val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`
                          }
                        />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const diff = data.plannedCost - data.benchmarkCost;
                              return (
                                <div className="rounded-xl border border-stone-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md text-xs z-30 text-slate-900">
                                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full"
                                      style={{ backgroundColor: data.color }}
                                    />
                                    <span>{data.category}</span>
                                  </div>
                                  <div className="space-y-1.5 text-[11px]">
                                    <div className="flex justify-between gap-4">
                                      <span className="text-slate-500">Your Plan:</span>
                                      <span className="font-mono font-bold text-slate-900">
                                        {currency} {data.plannedCost.toLocaleString()} ({data.currentPct}%)
                                      </span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-slate-500">Realistic Market Rate:</span>
                                      <span className="font-mono text-indigo-700 font-semibold">
                                        {currency} {data.benchmarkCost.toLocaleString()} ({data.targetPct}%)
                                      </span>
                                    </div>
                                    <div className="flex justify-between gap-4 border-t border-stone-100 pt-1">
                                      <span className="text-slate-500">Variance:</span>
                                      <span
                                        className={`font-mono font-bold ${
                                          diff > 0
                                            ? 'text-amber-600'
                                            : diff < 0
                                            ? 'text-indigo-600'
                                            : 'text-emerald-700'
                                        }`}
                                      >
                                        {diff > 0
                                          ? `+${currency} ${diff.toLocaleString()} (Over typical)`
                                          : diff < 0
                                          ? `-${currency} ${Math.abs(diff).toLocaleString()} (Leaner)`
                                          : 'Exact Match'}
                                      </span>
                                    </div>
                                    <div className="pt-1 flex items-center justify-between text-[10px]">
                                      <span className="text-slate-500">Realism Index:</span>
                                      <span
                                        className={`font-semibold ${
                                          data.status === 'Balanced'
                                            ? 'text-emerald-700'
                                            : data.status === 'High Spend'
                                            ? 'text-amber-600'
                                            : 'text-rose-600'
                                        }`}
                                      >
                                        {data.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="plannedCost"
                          name="Your Plan"
                          fill="#4f46e5"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="benchmarkCost"
                          name="Market Benchmark"
                          fill="#0284c7"
                          opacity={0.4}
                          radius={[4, 4, 0, 0]}
                        />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Realism Breakdown List */}
                  <div className="lg:col-span-5 space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    <div className="text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Category Realism Index</span>
                      <span className="text-slate-400 font-mono text-[10px]">Benchmarked for {plan.input.city}</span>
                    </div>
                    {varianceData.map((item) => (
                      <div
                        key={item.category}
                        className="rounded-xl border border-stone-200/90 bg-stone-50/60 p-2.5 text-xs flex items-center justify-between shadow-2xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-semibold text-slate-800 truncate">{item.category}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {currency} {item.plannedCost.toLocaleString()} ({item.currentPct}%) vs {currency} {item.benchmarkCost.toLocaleString()} ({item.targetPct}% rec)
                          </div>
                        </div>

                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold shrink-0 border ${
                            item.status === 'Balanced'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : item.status === 'High Spend'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode 4: Month-over-Month Cashflow Disbursement Trend */}
              {chartMode === 'cashflow' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-7 h-[290px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={cashflowTrendData}
                        margin={{ top: 16, right: 24, left: 10, bottom: 8 }}
                      >
                        <defs>
                          <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                        <XAxis
                          dataKey="period"
                          tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                          tickFormatter={(val) =>
                            val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`
                          }
                        />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="rounded-xl border border-stone-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md text-xs z-30 text-slate-900">
                                  <div className="font-bold text-slate-900 text-xs">{data.period}</div>
                                  <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                                    Milestone: {data.phase}
                                  </div>
                                  <div className="mt-2 space-y-1.5 text-[11px]">
                                    <div className="flex justify-between gap-4">
                                      <span className="text-slate-500">Payment Outflow:</span>
                                      <span className="font-mono font-bold text-indigo-700">
                                        {currency} {data.monthlyOutflow.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                      <span className="text-slate-500">Cumulative Committed:</span>
                                      <span className="font-mono font-bold text-slate-800">
                                        {currency} {data.cumulativeSpend.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between gap-4 border-t border-stone-100 pt-1 text-[10px]">
                                      <span className="text-slate-500">Total Budget Limit:</span>
                                      <span className="font-mono text-slate-700">
                                        {currency} {data.budgetLimit.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="cumulativeSpend"
                          name="Cumulative Spent"
                          stroke="#4f46e5"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorCumulative)"
                        />
                        <Area
                          type="monotone"
                          dataKey="monthlyOutflow"
                          name="Milestone Outflow"
                          stroke="#0284c7"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorOutflow)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Cash Flow Milestone Guidance */}
                  <div className="lg:col-span-5 space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
                    <div className="text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Payment Milestone Schedule</span>
                      <span className="text-emerald-700 font-mono text-[10px] font-semibold">Safe Cashflow</span>
                    </div>

                    {cashflowTrendData.map((m, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-stone-200/90 bg-stone-50/60 p-3 text-xs shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{m.period}</span>
                          <span className="font-mono font-bold text-indigo-700">
                            {currency} {m.monthlyOutflow.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{m.phase}</p>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Cumulative: {currency} {m.cumulativeSpend.toLocaleString()}</span>
                          <span>{Math.round((m.cumulativeSpend / (totalEstimated || 1)) * 100)}% of total</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No estimated budget data available to visualize yet.
            </div>
          )}
        </div>
      </div>

      {/* Itemized Table Controls & Add Item */}
      <div className="rounded-2xl border border-stone-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Itemized Budget Breakdown</h3>
            <p className="text-xs text-slate-500">
              Prices are planning estimates. Edit any row or add custom items to reflect vendor quotes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleOpenReallocate}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>AI Re-Allocate</span>
            </button>

            <button
              onClick={() => setIsAddingItem(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Line Item</span>
            </button>
          </div>
        </div>

        {/* Add Item Modal / Inline Drawer */}
        {isAddingItem && (
          <form
            onSubmit={handleAddItem}
            className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900">New Budget Line Item</span>
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cocktail Tables Rental, Cake Topper"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as BudgetItem['category'])}
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700">Estimated Cost ({currency})</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newCost}
                  onChange={(e) => setNewCost(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2">
              <input
                type="text"
                placeholder="Optional notes or supplier details..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full sm:flex-1 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
              />

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEssential}
                    onChange={(e) => setNewEssential(e.target.checked)}
                    className="rounded border-stone-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Essential Item</span>
                </label>

                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-2xs cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-slate-500 font-semibold">
                <th className="pb-3 pl-1">Category & Item</th>
                <th className="pb-3 text-right">Estimated</th>
                <th className="pb-3 text-right">Actual Cost</th>
                <th className="pb-3 pl-4">Notes & Specifications</th>
                <th className="pb-3 text-right pr-1">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredItems.map((item) => {
                const isEditing = editingId === item.id;

                if (isEditing) {
                  return (
                    <tr key={item.id} className="bg-indigo-50/50">
                      <td className="py-3 pl-1">
                        <select
                          value={editCategory}
                          onChange={(e) =>
                            setEditCategory(e.target.value as BudgetItem['category'])
                          }
                          className="mb-1 rounded-lg border border-stone-300 bg-white px-2 py-1 text-[11px] text-slate-800"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs text-slate-900"
                        />
                      </td>

                      <td className="py-3 text-right">
                        <input
                          type="number"
                          value={editCost}
                          onChange={(e) => setEditCost(Number(e.target.value))}
                          className="w-24 rounded-lg border border-stone-300 bg-white px-2 py-1 text-right text-xs text-slate-900 font-mono"
                        />
                      </td>

                      <td className="py-3 text-right">
                        <input
                          type="number"
                          placeholder="Optional"
                          value={editActual}
                          onChange={(e) => setEditActual(e.target.value)}
                          className="w-24 rounded-lg border border-stone-300 bg-white px-2 py-1 text-right text-xs text-slate-900 font-mono"
                        />
                      </td>

                      <td className="py-3 pl-4">
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="w-full rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs text-slate-700"
                        />
                      </td>

                      <td className="py-3 pr-1 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="p-1 text-emerald-600 hover:text-emerald-700 mr-2 cursor-pointer"
                          title="Save"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 pl-1">
                      <div className="text-[11px] font-semibold text-indigo-700">
                        {item.category}
                      </div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                        <span>{item.name}</span>
                        {!item.isEssential && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            (Optional)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 text-right font-mono font-semibold text-slate-900">
                      <div>{currency} {convertCost(item.estimatedCost).toLocaleString()}</div>
                      {isConverted && (
                        <div className="text-[10px] text-slate-400 font-sans font-normal">
                          ({baseCurrency} {Number(item.estimatedCost).toLocaleString()})
                        </div>
                      )}
                    </td>

                    <td className="py-3 text-right font-mono text-slate-500">
                      {item.actualCost !== undefined ? (
                        <div>
                          <span className="text-indigo-700 font-semibold">
                            {currency} {convertCost(item.actualCost).toLocaleString()}
                          </span>
                          {isConverted && (
                            <div className="text-[10px] text-slate-400 font-sans font-normal">
                              ({baseCurrency} {Number(item.actualCost).toLocaleString()})
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    <td className="py-3 pl-4 text-slate-600 text-xs">
                      {item.notes || <span className="text-slate-400 italic">No notes</span>}
                    </td>

                    <td className="py-3 pr-1 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1 text-slate-400 hover:text-slate-700 mr-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                        title="Edit Item"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-stone-200 font-bold text-slate-900">
                <td className="pt-4 pl-1 text-sm">Total Sum</td>
                <td className="pt-4 text-right font-mono text-sm text-indigo-700">
                  <div>{currency} {totalEstimated.toLocaleString()}</div>
                  {isConverted && (
                    <div className="text-[10px] font-sans text-slate-400 font-normal">
                      ({baseCurrency} {rawTotalEstimated.toLocaleString()})
                    </div>
                  )}
                </td>
                <td className="pt-4 text-right font-mono text-sm text-slate-800">
                  {totalActual > 0 ? (
                    <div>
                      <span>{currency} {totalActual.toLocaleString()}</span>
                      {isConverted && (
                        <div className="text-[10px] font-sans text-slate-400 font-normal">
                          ({baseCurrency} {rawTotalActual.toLocaleString()})
                        </div>
                      )}
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                <td colSpan={2} className="pt-4 pl-4 text-[11px] text-slate-500 italic">
                  {isConverted ? (
                    <span className="text-amber-800 font-medium">
                      Converted at mock FX rate (1 {baseCurrency} = {(targetRate / baseRate).toFixed(4)} {viewCurrency})
                    </span>
                  ) : (
                    <span>Estimates benchmarked for {plan.input.city}</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* AI Budget Tips Section */}
      {plan.budgetPlan.budgetTips && plan.budgetPlan.budgetTips.length > 0 && (
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-4 w-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900">Smart Budget Optimization Tips</h4>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {plan.budgetPlan.budgetTips.map((tip, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5 text-xs text-slate-600 leading-relaxed shadow-2xs"
              >
                <div className="font-bold text-indigo-700 mb-1">Tip #{idx + 1}</div>
                {tip}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety & Realism Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-xl border border-stone-200/80 bg-stone-50/70 p-4 text-xs text-slate-500">
        <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-700 font-semibold">Planner Notice:</strong> Line item numbers are planning estimates based on typical market conditions for {plan.input.city}. They do not constitute formal vendor quotes, contracts, or holds. Always confirm pricing and cancellation policies directly with licensed service providers.
        </p>
      </div>

      {/* AI Budget Re-Allocation Tool Modal */}
      {isReallocateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-stone-200 bg-white shadow-2xl overflow-hidden text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 bg-stone-50/70">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">AI Budget Re-Allocation Assistant</h3>
                  <p className="text-xs text-slate-500">
                    Smart adjustment to balance your budget for {plan.concept.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsReallocateModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isReallocating ? (
                <div className="py-16 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse">
                    <RefreshCw className="h-7 w-7 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Analyzing Budget Structure & Discretionary Spends...
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                      Gemini is reviewing {plan.budgetPlan.items.length} items to protect core essentials (venue, main food service) while finding high-impact savings on optional lines to reach your {currency} {totalBudget.toLocaleString()} limit.
                    </p>
                  </div>
                </div>
              ) : reallocateError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-950">Re-allocation Issue</p>
                    <p className="mt-0.5">{reallocateError}</p>
                    <button
                      type="button"
                      onClick={handleOpenReallocate}
                      className="mt-2 text-xs font-semibold underline text-rose-900 hover:text-rose-950 cursor-pointer"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : reallocateResult ? (
                <div className="space-y-6">
                  {/* Strategy Summary Card */}
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs">
                    <div className="flex items-center gap-2 font-bold text-indigo-900 mb-1">
                      <Wand2 className="h-4 w-4 text-indigo-700" />
                      <span>Proposed Optimization Strategy:</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {reallocateResult.strategySummary}
                    </p>
                  </div>

                  {/* Impact Metrics Bar */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5">
                      <span className="text-[11px] text-slate-500 block font-medium">Current Total</span>
                      <span className="mt-1 font-mono text-base font-bold text-rose-600">
                        {currency} {totalEstimated.toLocaleString()}
                      </span>
                    </div>
                    <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5">
                      <span className="text-[11px] text-slate-500 block font-medium">Proposed Total</span>
                      <span className="mt-1 font-mono text-base font-bold text-emerald-700">
                        {currency} {reallocateResult.newTotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5">
                      <span className="text-[11px] text-slate-500 block font-medium">Net Savings</span>
                      <span className="mt-1 font-mono text-base font-bold text-indigo-700">
                        +{currency} {reallocateResult.savingsTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Proposed Adjustments Table */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Proposed Line Item Changes
                    </h5>
                    <div className="rounded-xl border border-stone-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-stone-200 bg-stone-50 text-slate-600 font-semibold">
                            <th className="py-2.5 px-3">Item Name</th>
                            <th className="py-2.5 px-2 text-right">Current</th>
                            <th className="py-2.5 px-2 text-right">New Estimate</th>
                            <th className="py-2.5 px-3">AI Rationale & Cost-Cutting Mechanism</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 bg-white">
                          {reallocateResult.adjustedItems.map((adj) => {
                            const diff = adj.newEstimatedCost - adj.originalCost;
                            const isReduced = diff < 0;
                            return (
                              <tr key={adj.id} className="hover:bg-stone-50/60">
                                <td className="py-2.5 px-3 font-semibold text-slate-900">
                                  {adj.name}
                                </td>
                                <td className="py-2.5 px-2 text-right font-mono text-slate-500 whitespace-nowrap">
                                  {currency} {adj.originalCost.toLocaleString()}
                                </td>
                                <td className="py-2.5 px-2 text-right font-mono font-bold whitespace-nowrap">
                                  <span className={isReduced ? 'text-emerald-700' : 'text-slate-800'}>
                                    {currency} {adj.newEstimatedCost.toLocaleString()}
                                  </span>
                                  {isReduced && (
                                    <span className="ml-1 text-[10px] text-emerald-700 font-medium">
                                      (-{currency} {Math.abs(diff).toLocaleString()})
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 text-[11px] leading-relaxed">
                                  {adj.adjustmentReason}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-100 px-6 py-4 bg-stone-50/70">
              <span className="text-[11px] text-slate-500">
                You can review or modify individual estimates anytime in the budget table.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsReallocateModalOpen(false)}
                  className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-50 transition-colors cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
                {reallocateResult && (
                  <button
                    type="button"
                    onClick={handleApplyReallocation}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Apply Recommended Re-Allocation</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
