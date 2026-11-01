import test from 'node:test';
import assert from 'node:assert/strict';

test('Comprehensive Budget Management & Financial Domain Tests', async (t) => {
  const CATEGORIES = [
    'Venue & Space',
    'Food & Beverages',
    'Decor & Styling',
    'Photography & Video',
    'Entertainment & Audio',
    'Stationery & Favors',
    'Staff & Operations',
    'Contingency Fund',
  ];

  const BENCHMARKS = {
    'Venue & Space': { min: 25, max: 35, target: 30 },
    'Food & Beverages': { min: 28, max: 40, target: 34 },
    'Decor & Styling': { min: 6, max: 14, target: 10 },
    'Photography & Video': { min: 8, max: 15, target: 11 },
    'Entertainment & Audio': { min: 5, max: 12, target: 8 },
    'Stationery & Favors': { min: 2, max: 6, target: 3 },
    'Staff & Operations': { min: 2, max: 6, target: 4 },
    'Contingency Fund': { min: 5, max: 10, target: 7 },
  };

  const EXCHANGE_RATES = {
    USD: { code: 'USD', name: 'US Dollar', symbol: '$', rateToUSD: 1.0 },
    EUR: { code: 'EUR', name: 'Euro', symbol: '€', rateToUSD: 0.92 },
    GBP: { code: 'GBP', name: 'British Pound', symbol: '£', rateToUSD: 0.79 },
    INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', rateToUSD: 83.5 },
    CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rateToUSD: 1.36 },
    AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rateToUSD: 1.52 },
    JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rateToUSD: 154.2 },
    SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rateToUSD: 1.35 },
    CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', rateToUSD: 0.91 },
    AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rateToUSD: 3.67 },
  };

  // Test 1: Line Item CRUD Operations
  await t.test('1. Add, edit, toggle, and delete budget line items with array integrity', () => {
    let items = [
      { id: 'item-1', name: 'Grand Ballroom', category: 'Venue & Space', estimatedCost: 1500, isEssential: true },
      { id: 'item-2', name: 'Buffet Catering', category: 'Food & Beverages', estimatedCost: 1200, isEssential: true },
    ];

    // Create / Add item
    const newItem = {
      id: 'item-3',
      name: 'Jazz Quartet',
      category: 'Entertainment & Audio',
      estimatedCost: 600,
      isEssential: false,
      notes: 'Live acoustic set during dinner',
    };
    items = [...items, newItem];
    assert.equal(items.length, 3, 'Item count should increase to 3');
    assert.equal(items[2].id, 'item-3');

    // Edit item (update estimated cost, add actual cost, toggle essential)
    items = items.map((it) => {
      if (it.id === 'item-3') {
        return {
          ...it,
          estimatedCost: 650,
          actualCost: 620,
          isEssential: true,
        };
      }
      return it;
    });

    const updated = items.find((i) => i.id === 'item-3');
    assert.equal(updated.estimatedCost, 650, 'Estimated cost should update to 650');
    assert.equal(updated.actualCost, 620, 'Actual cost should be 620');
    assert.equal(updated.isEssential, true, 'isEssential should toggle to true');

    // Delete item
    items = items.filter((it) => it.id !== 'item-1');
    assert.equal(items.length, 2, 'Item count should decrease to 2 after deletion');
    assert.equal(items.some((i) => i.id === 'item-1'), false, 'Deleted item must no longer exist');
    assert.equal(items[0].id, 'item-2', 'Remaining items must be preserved');
  });

  // Test 2: Budget Variance, Actuals Tracking & Overrun Calculation
  await t.test('2. Total calculation, actual spend tracking, and overrun state detection', () => {
    const totalBudget = 5000;
    const items = [
      { id: '1', category: 'Venue & Space', estimatedCost: 2000, actualCost: 1950 },
      { id: '2', category: 'Food & Beverages', estimatedCost: 1800, actualCost: 1900 },
      { id: '3', category: 'Photography & Video', estimatedCost: 800, actualCost: 800 },
      { id: '4', category: 'Decor & Styling', estimatedCost: 700 }, // No actual spend yet
    ];

    const totalEstimated = items.reduce((sum, i) => sum + (Number(i.estimatedCost) || 0), 0);
    const totalActual = items.reduce((sum, i) => sum + (Number(i.actualCost) || 0), 0);

    assert.equal(totalEstimated, 5300, 'Total estimated must sum to 5300');
    assert.equal(totalActual, 4650, 'Total actual must sum to 4650');

    const isOverBudget = totalEstimated > totalBudget;
    const overrunAmount = isOverBudget ? totalEstimated - totalBudget : 0;
    const spendPercentage = Math.round((totalEstimated / totalBudget) * 100);

    assert.equal(isOverBudget, true, 'Event must be flagged as over budget');
    assert.equal(overrunAmount, 300, 'Overrun amount must be 300');
    assert.equal(spendPercentage, 106, 'Spend percentage should be 106%');

    // Contingency fund calculation (7%)
    const contingencyTarget = Math.round(totalBudget * 0.07);
    assert.equal(contingencyTarget, 350, 'Contingency fund target should be 350');
  });

  // Test 3: Category Allocation Benchmarks & Realism Classifier
  await t.test('3. Category spend benchmarking accurately classifies spend status', () => {
    const totalBudget = 10000;
    const categoryTotals = {
      'Venue & Space': 3200,      // 32% (target 30%, range 25-35% -> Balanced)
      'Food & Beverages': 4500,  // 45% (target 34%, range 28-40% -> High Spend)
      'Decor & Styling': 300,    // 3%  (target 10%, range 6-14% -> Lean / Low)
      'Stationery & Favors': 0,  // 0%  (Lean / Low)
    };

    function evaluateRealism(category, cost, total) {
      const benchmark = BENCHMARKS[category] || { min: 5, max: 15, target: 10 };
      const benchmarkCost = Math.round((total * benchmark.target) / 100);
      const pct = total > 0 ? (cost / total) * 100 : 0;

      let status;
      if (cost === 0) {
        status = 'Lean / Low';
      } else if (pct > benchmark.max) {
        status = 'High Spend';
      } else if (pct < benchmark.min) {
        status = 'Lean / Low';
      } else {
        status = 'Balanced';
      }

      return { status, benchmarkCost, pct: Number(pct.toFixed(1)) };
    }

    const venueEval = evaluateRealism('Venue & Space', categoryTotals['Venue & Space'], totalBudget);
    assert.equal(venueEval.status, 'Balanced', 'Venue within 25-35% should be Balanced');
    assert.equal(venueEval.benchmarkCost, 3000);

    const cateringEval = evaluateRealism('Food & Beverages', categoryTotals['Food & Beverages'], totalBudget);
    assert.equal(cateringEval.status, 'High Spend', 'Food > 40% should be High Spend');

    const decorEval = evaluateRealism('Decor & Styling', categoryTotals['Decor & Styling'], totalBudget);
    assert.equal(decorEval.status, 'Lean / Low', 'Decor < 6% should be Lean / Low');

    const zeroEval = evaluateRealism('Stationery & Favors', 0, totalBudget);
    assert.equal(zeroEval.status, 'Lean / Low', 'Zero spend should be Lean / Low');
  });

  // Test 4: Cash Flow & Milestone Disbursement Schedule
  await t.test('4. Cashflow milestone generator accurately projects disbursement timeline', () => {
    const totalBudget = 8000;
    const targetDate = new Date('2026-10-15');

    const milestoneRules = [
      { offsetMonths: -3, label: 'M-3', phase: 'Venue & Photo Retainers', pct: 0.30 },
      { offsetMonths: -2, label: 'M-2', phase: 'Catering Deposit & Invites', pct: 0.25 },
      { offsetMonths: -1, label: 'M-1', phase: 'Decor, Music & Rentals', pct: 0.20 },
      { offsetMonths: 0, label: 'Event Month', phase: 'Final Balances & Tip Fund', pct: 0.25 },
    ];

    let runningCumulative = 0;
    const schedule = milestoneRules.map((m) => {
      const amount = Math.round(totalBudget * m.pct);
      runningCumulative += amount;
      return {
        label: m.label,
        phase: m.phase,
        amount,
        cumulative: runningCumulative,
        percentage: Math.round(m.pct * 100),
      };
    });

    assert.equal(schedule.length, 4);
    assert.equal(schedule[0].amount, 2400, 'M-3 amount should be 30% = 2400');
    assert.equal(schedule[1].amount, 2000, 'M-2 amount should be 25% = 2000');
    assert.equal(schedule[2].amount, 1600, 'M-1 amount should be 20% = 1600');
    assert.equal(schedule[3].amount, 2000, 'Event Month amount should be 25% = 2000');
    assert.equal(schedule[3].cumulative, totalBudget, 'Cumulative disbursement must sum to total budget');
  });

  // Test 5: Currency Conversion Isolation & Data Immutability
  await t.test('5. Currency conversion operates in isolation without mutating original plan items', () => {
    const originalPlan = {
      budgetPlan: {
        currency: 'USD',
        totalBudget: 4000,
        items: [
          { id: '1', name: 'DJ Sound', category: 'Entertainment & Audio', estimatedCost: 500 },
          { id: '2', name: 'Hall Booking', category: 'Venue & Space', estimatedCost: 1500 },
        ],
      },
    };

    // Deep freeze original plan to enforce immutability check
    const planClone = JSON.parse(JSON.stringify(originalPlan));

    function convertPlanView(plan, viewCurrency) {
      const baseCurrency = plan.budgetPlan.currency;
      const isBaseSupported = Boolean(EXCHANGE_RATES[baseCurrency] && EXCHANGE_RATES[baseCurrency].rateToUSD > 0);
      const isViewSupported = Boolean(EXCHANGE_RATES[viewCurrency] && EXCHANGE_RATES[viewCurrency].rateToUSD > 0);
      const canConvert = isBaseSupported && isViewSupported;

      if (!canConvert) {
        return {
          viewCurrency: baseCurrency,
          totalBudget: plan.budgetPlan.totalBudget,
          items: plan.budgetPlan.items.map((i) => ({ ...i })),
          canConvert: false,
        };
      }

      const fxMultiplier = EXCHANGE_RATES[viewCurrency].rateToUSD / EXCHANGE_RATES[baseCurrency].rateToUSD;
      return {
        viewCurrency,
        totalBudget: Math.round(plan.budgetPlan.totalBudget * fxMultiplier),
        items: plan.budgetPlan.items.map((it) => ({
          ...it,
          estimatedCost: Math.round(it.estimatedCost * fxMultiplier),
        })),
        canConvert: true,
      };
    }

    // Convert view to EUR (0.92)
    const eurView = convertPlanView(originalPlan, 'EUR');
    assert.equal(eurView.viewCurrency, 'EUR');
    assert.equal(eurView.totalBudget, 3680);
    assert.equal(eurView.items[0].estimatedCost, 460);
    assert.equal(eurView.items[1].estimatedCost, 1380);

    // Verify original plan items were completely untouched
    assert.deepEqual(originalPlan, planClone, 'Original plan object must never be mutated by view conversion');

    // Convert view to unsupported currency
    const unsupportedView = convertPlanView(originalPlan, 'UNKNOWN_CURR');
    assert.equal(unsupportedView.canConvert, false);
    assert.equal(unsupportedView.totalBudget, 4000, 'Unsupported currency must preserve original total');
    assert.equal(unsupportedView.items[0].estimatedCost, 500, 'Unsupported currency must preserve original item costs');
  });
});
