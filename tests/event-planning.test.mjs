import test from 'node:test';
import assert from 'node:assert/strict';

test('Event Planning & Budget Domain Logic Tests', async (t) => {
  // Test 1: Budget Sums, Overrun Calculations, and Contingencies
  await t.test('1. Budget summation, overrun detection, and contingency math', () => {
    const totalBudget = 5000;
    const items = [
      { id: '1', category: 'Venue & Space', estimatedCost: 1800, isEssential: true },
      { id: '2', category: 'Food & Beverages', estimatedCost: 2000, isEssential: true },
      { id: '3', category: 'Decor & Styling', estimatedCost: 600, isEssential: false },
      { id: '4', category: 'Photography & Video', estimatedCost: 800, isEssential: false },
      { id: '5', category: 'Contingency Fund', estimatedCost: 350, isEssential: true },
    ];

    const currentTotal = items.reduce((sum, item) => sum + item.estimatedCost, 0);
    assert.equal(currentTotal, 5550, 'Total items should sum accurately to 5550');

    const overrun = currentTotal - totalBudget;
    assert.equal(overrun, 550, 'Overrun should equal 550 when spending exceeds 5000 limit');

    const essentialTotal = items.filter((i) => i.isEssential).reduce((sum, i) => sum + i.estimatedCost, 0);
    const nonEssentialTotal = items.filter((i) => !i.isEssential).reduce((sum, i) => sum + i.estimatedCost, 0);

    assert.equal(essentialTotal, 4150, 'Essential expenses total should be 4150');
    assert.equal(nonEssentialTotal, 1400, 'Non-essential expenses total should be 1400');
    assert.ok(nonEssentialTotal >= overrun, 'Non-essential items should have sufficient budget to absorb the overrun');
  });

  // Test 2: Budget Reallocation Algorithm Simulation
  await t.test('2. Budget reallocation algorithm trims optional items to restore target limit', () => {
    const totalBudget = 3000;
    const items = [
      { id: 'b1', name: 'Banquet Hall Rental', category: 'Venue & Space', estimatedCost: 1200, isEssential: true },
      { id: 'b2', name: 'Buffet Catering', category: 'Food & Beverages', estimatedCost: 1200, isEssential: true },
      { id: 'b3', name: 'Custom Ice Sculpture', category: 'Decor & Styling', estimatedCost: 500, isEssential: false },
      { id: 'b4', name: 'Extra Photo Booth', category: 'Photography & Video', estimatedCost: 600, isEssential: false },
    ];

    const currentTotal = items.reduce((sum, it) => sum + it.estimatedCost, 0); // 3500
    const overrun = currentTotal - totalBudget; // 500
    assert.equal(overrun, 500, 'Initial overrun must be 500');

    const nonEssentials = items.filter((it) => !it.isEssential);
    const nonEssentialTotal = nonEssentials.reduce((sum, it) => sum + it.estimatedCost, 0); // 1100

    assert.ok(nonEssentialTotal >= overrun, 'Optional decor can absorb overrun without hurting essential catering/venue');

    const cutRatio = overrun / nonEssentialTotal;
    const adjustedItems = items.map((it) => {
      if (!it.isEssential) {
        const reduction = Math.round(it.estimatedCost * cutRatio);
        return {
          ...it,
          newEstimatedCost: it.estimatedCost - reduction,
        };
      }
      return {
        ...it,
        newEstimatedCost: it.estimatedCost,
      };
    });

    const newTotal = adjustedItems.reduce((sum, it) => sum + it.newEstimatedCost, 0);
    assert.ok(newTotal <= totalBudget, `New total ${newTotal} must be <= budget limit ${totalBudget}`);

    // Verify essentials remained untouched
    const adjustedVenue = adjustedItems.find((i) => i.id === 'b1');
    const adjustedCatering = adjustedItems.find((i) => i.id === 'b2');
    assert.equal(adjustedVenue.newEstimatedCost, 1200, 'Essential venue cost must be preserved');
    assert.equal(adjustedCatering.newEstimatedCost, 1200, 'Essential catering cost must be preserved');

    // Verify optional items absorbed the reduction
    const adjustedIce = adjustedItems.find((i) => i.id === 'b3');
    assert.ok(adjustedIce.newEstimatedCost < 500, 'Optional ice sculpture was reduced');
  });

  // Test 3: Currency Exchange Rates, Safety & Unsupported Protection
  await t.test('3. Currency conversion math, zero-division protection & unsupported currency safety', () => {
    const EXCHANGE_RATES = {
      USD: { code: 'USD', name: 'US Dollar', symbol: '$', rateToUSD: 1.0 },
      EUR: { code: 'EUR', name: 'Euro', symbol: '€', rateToUSD: 0.92 },
      GBP: { code: 'GBP', name: 'British Pound', symbol: '£', rateToUSD: 0.79 },
      INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', rateToUSD: 83.5 },
      CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rateToUSD: 1.36 },
      AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rateToUSD: 1.52 },
      JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rateToUSD: 154.2 },
    };

    function evaluateConversion(val, baseCurrency, viewCurrency) {
      if (val === undefined || val === null || val === '') {
        return { cost: 0, canConvert: false, isConverted: false, fxMultiplier: 1.0 };
      }
      const isBaseSupported = Boolean(EXCHANGE_RATES[baseCurrency] && EXCHANGE_RATES[baseCurrency].rateToUSD > 0);
      const isViewSupported = Boolean(EXCHANGE_RATES[viewCurrency] && EXCHANGE_RATES[viewCurrency].rateToUSD > 0);
      const canConvert = isBaseSupported && isViewSupported;
      const isConverted = viewCurrency !== baseCurrency && canConvert;

      if (!canConvert) {
        // Never silently assume 1:1 USD exchange rate; preserve original amount
        return {
          cost: Math.round(Number(val)),
          canConvert: false,
          isConverted: false,
          fxMultiplier: 1.0,
          warning: `Live conversion disabled for unlisted currency ${baseCurrency}`,
        };
      }

      const baseRate = EXCHANGE_RATES[baseCurrency].rateToUSD;
      const targetRate = EXCHANGE_RATES[viewCurrency].rateToUSD;
      const fxMultiplier = targetRate / baseRate;
      return {
        cost: Math.round(Number(val) * fxMultiplier),
        canConvert: true,
        isConverted,
        fxMultiplier,
      };
    }

    // 100 USD to INR
    const inr = evaluateConversion(100, 'USD', 'INR');
    assert.equal(inr.cost, 8350, '100 USD should convert to 8350 INR');
    assert.equal(inr.canConvert, true);

    // 8350 INR back to USD
    const usd = evaluateConversion(8350, 'INR', 'USD');
    assert.equal(usd.cost, 100, '8350 INR should convert back to 100 USD');
    assert.equal(usd.canConvert, true);

    // 100 USD to EUR
    const eur = evaluateConversion(100, 'USD', 'EUR');
    assert.equal(eur.cost, 92, '100 USD should convert to 92 EUR');
    assert.equal(eur.canConvert, true);

    // Zero, null, undefined inputs
    assert.equal(evaluateConversion(0, 'USD', 'EUR').cost, 0, 'Zero cost should return 0');
    assert.equal(evaluateConversion(null, 'USD', 'EUR').cost, 0, 'Null cost should return 0');
    assert.equal(evaluateConversion(undefined, 'USD', 'EUR').cost, 0, 'Undefined cost should return 0');

    // Unsupported / unlisted currency safety: MUST NOT approximate as 1:1 USD
    const unsupported = evaluateConversion(500000, 'THB', 'USD');
    assert.equal(unsupported.canConvert, false, 'Unlisted currency must be flagged as non-convertible');
    assert.equal(unsupported.cost, 500000, 'Original budget figure must be strictly preserved without conversion');
    assert.ok(unsupported.warning.includes('Live conversion disabled'), 'Warning must be raised for unsupported currency');

    // "Set as Base" protection: blocked when canConvert is false
    function safeSetAsBase(planBudget, viewCurrency) {
      const conv = evaluateConversion(planBudget.totalBudget, planBudget.currency, viewCurrency);
      if (!conv.isConverted || !conv.canConvert) {
        return null; // Blocked: cannot overwrite original budget
      }
      return {
        currency: viewCurrency,
        totalBudget: conv.cost,
      };
    }

    const blockedResult = safeSetAsBase({ totalBudget: 500000, currency: 'THB' }, 'USD');
    assert.equal(blockedResult, null, 'Set as Base must reject writing inaccurate converted figures for unsupported currency');

    const validResult = safeSetAsBase({ totalBudget: 1000, currency: 'USD' }, 'EUR');
    assert.deepEqual(validResult, { currency: 'EUR', totalBudget: 920 }, 'Set as Base succeeds for valid supported currencies');
  });

  // Test 4: Seating Layout Calculation for Multiple Headcounts
  await t.test('4. Venue 3D layout generator allocates correct tables and capacities', () => {
    function generateLayout(guestCount = 50) {
      const tableCapacity = 8;
      const numRoundTables = Math.max(Math.ceil(guestCount / tableCapacity), 4);
      const tables = [];

      // Stage, dance floor, bar, lounge
      tables.push({ id: 'stage-main', shape: 'stage', capacity: 0 });
      tables.push({ id: 'dance-floor-main', shape: 'dance_floor', capacity: 0 });
      tables.push({ id: 'bar-main', shape: 'bar', capacity: 0 });
      tables.push({ id: 'lounge-main', shape: 'lounge', capacity: 6 });

      let remaining = guestCount;
      for (let i = 0; i < numRoundTables; i++) {
        const assigned = Math.min(tableCapacity, remaining);
        remaining = Math.max(0, remaining - assigned);
        tables.push({
          id: `table-round-${i + 1}`,
          shape: 'round',
          capacity: tableCapacity,
          seatedGuests: assigned,
        });
      }

      // Cocktail tables
      tables.push({ id: 'cocktail-1', shape: 'cocktail', capacity: 3, seatedGuests: 2 });
      tables.push({ id: 'cocktail-2', shape: 'cocktail', capacity: 3, seatedGuests: 2 });

      return { tables, numRoundTables };
    }

    // 50 guests: 50 / 8 = 6.25 -> 7 round tables
    const layout50 = generateLayout(50);
    assert.equal(layout50.numRoundTables, 7, '50 guests should require 7 round tables');
    const totalSeatedRound50 = layout50.tables
      .filter((t) => t.shape === 'round')
      .reduce((sum, t) => sum + t.seatedGuests, 0);
    assert.equal(totalSeatedRound50, 50, 'All 50 guests should be seated across round tables');

    // 10 guests: 10 / 8 = 1.25, but min round tables is 4
    const layout10 = generateLayout(10);
    assert.equal(layout10.numRoundTables, 4, '10 guests should enforce minimum 4 round tables for spatial balance');
    const totalSeatedRound10 = layout10.tables
      .filter((t) => t.shape === 'round')
      .reduce((sum, t) => sum + t.seatedGuests, 0);
    assert.equal(totalSeatedRound10, 10, 'All 10 guests should be seated');

    // Stage, Dance Floor, Bar, Lounge presence
    const stage = layout50.tables.find((t) => t.id === 'stage-main');
    const danceFloor = layout50.tables.find((t) => t.id === 'dance-floor-main');
    const bar = layout50.tables.find((t) => t.id === 'bar-main');
    const lounge = layout50.tables.find((t) => t.id === 'lounge-main');

    assert.ok(stage, 'Stage fixture must exist in layout');
    assert.ok(danceFloor, 'Dance floor fixture must exist in layout');
    assert.ok(bar, 'Bar station fixture must exist in layout');
    assert.ok(lounge, 'VIP Lounge fixture must exist in layout');
  });

  // Test 5: Task Phase Progression & Due Dates
  await t.test('5. Task phase sequencing and chronological offsets', () => {
    function getPhaseOffsetDays(phase) {
      switch (phase) {
        case '8+ Weeks Before': return -56;
        case '4-6 Weeks Before': return -35;
        case '2-3 Weeks Before': return -18;
        case '1 Week Before': return -7;
        case 'Day Before': return -1;
        case 'Event Day': return 0;
        case 'Post Event': return 1;
        default: return -7;
      }
    }

    assert.equal(getPhaseOffsetDays('8+ Weeks Before'), -56);
    assert.equal(getPhaseOffsetDays('4-6 Weeks Before'), -35);
    assert.equal(getPhaseOffsetDays('2-3 Weeks Before'), -18);
    assert.equal(getPhaseOffsetDays('1 Week Before'), -7);
    assert.equal(getPhaseOffsetDays('Day Before'), -1);
    assert.equal(getPhaseOffsetDays('Event Day'), 0);
    assert.equal(getPhaseOffsetDays('Post Event'), 1);

    // Verify chronological order
    const phases = [
      '8+ Weeks Before',
      '4-6 Weeks Before',
      '2-3 Weeks Before',
      '1 Week Before',
      'Day Before',
      'Event Day',
      'Post Event',
    ];
    for (let i = 0; i < phases.length - 1; i++) {
      assert.ok(
        getPhaseOffsetDays(phases[i]) < getPhaseOffsetDays(phases[i + 1]),
        `Phase ${phases[i]} must precede ${phases[i + 1]}`
      );
    }
  });

  // Test 6: Modal Accessibility, Focus Trapping & Restoration Contracts
  await t.test('6. Accessible modal focus trapping, Escape handling, and focus restoration contracts', () => {
    class ModalTrapManager {
      constructor(focusableElements) {
        this.elements = focusableElements;
        this.isOpen = false;
        this.previousActiveElement = null;
        this.currentFocusIndex = 0;
        this.closed = false;
      }

      open(triggerElement) {
        this.isOpen = true;
        this.previousActiveElement = triggerElement;
        this.currentFocusIndex = 0;
      }

      close() {
        this.isOpen = false;
        this.closed = true;
        if (this.previousActiveElement) {
          this.previousActiveElement.focusCalled = true;
        }
      }

      handleKeyDown(e) {
        if (!this.isOpen) return;
        if (e.key === 'Escape') {
          this.close();
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault = true;
          if (e.shiftKey) {
            this.currentFocusIndex = (this.currentFocusIndex - 1 + this.elements.length) % this.elements.length;
          } else {
            this.currentFocusIndex = (this.currentFocusIndex + 1) % this.elements.length;
          }
        }
      }
    }

    const mockElements = ['close-button', 'tab-1', 'tab-2', 'save-button'];
    const mockTrigger = { id: 'open-modal-trigger', focusCalled: false };
    const trap = new ModalTrapManager(mockElements);

    // 1. Open modal and save trigger focus
    trap.open(mockTrigger);
    assert.equal(trap.isOpen, true);
    assert.equal(trap.currentFocusIndex, 0, 'First element must be initially focused');

    // 2. Tab forward through all elements and wrap around
    const forwardTab = { key: 'Tab', shiftKey: false, preventDefault: false };
    trap.handleKeyDown(forwardTab);
    assert.equal(trap.currentFocusIndex, 1);
    trap.handleKeyDown(forwardTab);
    assert.equal(trap.currentFocusIndex, 2);
    trap.handleKeyDown(forwardTab);
    assert.equal(trap.currentFocusIndex, 3);
    trap.handleKeyDown(forwardTab);
    assert.equal(trap.currentFocusIndex, 0, 'Tab from last element must wrap around to first element');

    // 3. Shift+Tab backward and wrap around
    const backwardTab = { key: 'Tab', shiftKey: true, preventDefault: false };
    trap.handleKeyDown(backwardTab);
    assert.equal(trap.currentFocusIndex, 3, 'Shift+Tab from first element must wrap around to last element');

    // 4. Escape key closes modal and restores focus
    trap.handleKeyDown({ key: 'Escape' });
    assert.equal(trap.isOpen, false);
    assert.equal(mockTrigger.focusCalled, true, 'Trigger element focus must be restored upon closing modal');
  });

  // Test 7: Radio-Card Roving Tabindex & Arrow Key Navigation Contracts
  await t.test('7. Accessible radio-card roving tabindex and circular arrow key navigation contracts', () => {
    const EVENT_TYPES = [
      'birthday',
      'wedding',
      'college',
      'community',
      'anniversary',
      'baby_shower',
      'corporate',
      'other',
    ];

    function computeRovingTabIndex(selectedType, index) {
      const isSelected = selectedType === EVENT_TYPES[index];
      const isCurrentOrFirst = isSelected || (!EVENT_TYPES.includes(selectedType) && index === 0);
      return isCurrentOrFirst ? 0 : -1;
    }

    // When 'birthday' (index 0) is selected: index 0 has tabIndex 0, all others have -1
    assert.equal(computeRovingTabIndex('birthday', 0), 0);
    assert.equal(computeRovingTabIndex('birthday', 1), -1);
    assert.equal(computeRovingTabIndex('birthday', 7), -1);

    // When 'corporate' (index 6) is selected: only index 6 has tabIndex 0
    assert.equal(computeRovingTabIndex('corporate', 0), -1);
    assert.equal(computeRovingTabIndex('corporate', 6), 0);

    // Circular arrow key navigation helper
    function getNextArrowIndex(currentIndex, key, length) {
      if (key === 'ArrowRight' || key === 'ArrowDown') {
        return (currentIndex + 1) % length;
      }
      if (key === 'ArrowLeft' || key === 'ArrowUp') {
        return (currentIndex - 1 + length) % length;
      }
      return currentIndex;
    }

    // Step forward and wrap around at end of array
    assert.equal(getNextArrowIndex(0, 'ArrowRight', EVENT_TYPES.length), 1);
    assert.equal(getNextArrowIndex(0, 'ArrowDown', EVENT_TYPES.length), 1);
    assert.equal(getNextArrowIndex(7, 'ArrowRight', EVENT_TYPES.length), 0, 'Last item + ArrowRight wraps to 0');
    assert.equal(getNextArrowIndex(7, 'ArrowDown', EVENT_TYPES.length), 0, 'Last item + ArrowDown wraps to 0');

    // Step backward and wrap around at beginning of array
    assert.equal(getNextArrowIndex(1, 'ArrowLeft', EVENT_TYPES.length), 0);
    assert.equal(getNextArrowIndex(1, 'ArrowUp', EVENT_TYPES.length), 0);
    assert.equal(getNextArrowIndex(0, 'ArrowLeft', EVENT_TYPES.length), 7, 'First item + ArrowLeft wraps to 7');
    assert.equal(getNextArrowIndex(0, 'ArrowUp', EVENT_TYPES.length), 7, 'First item + ArrowUp wraps to 7');
  });

  // Test 8: Event Form Boundary Input Validation & Sanitization
  await t.test('8. Event form boundary validation rejects invalid, empty, or boundary-violating inputs', () => {
    function validateEventInput(raw) {
      const errors = {};
      const title = (raw.title || '').trim();
      const city = (raw.city || '').trim();
      const date = (raw.eventDate || '').trim();
      const guests = Number(raw.guestCount);
      const budget = Number(raw.totalBudget);

      if (!title) {
        errors.title = 'Event title is required';
      } else if (title.length < 3) {
        errors.title = 'Event title must be at least 3 characters';
      }

      if (!city) {
        errors.city = 'City or location is required';
      }

      if (!date) {
        errors.eventDate = 'Event date is required';
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        errors.eventDate = 'Invalid date format (must be YYYY-MM-DD)';
      }

      if (isNaN(guests) || guests < 1) {
        errors.guestCount = 'At least 1 guest is required';
      } else if (guests > 500) {
        errors.guestCount = 'Guest count exceeds maximum capacity of 500';
      }

      if (isNaN(budget) || budget < 50) {
        errors.totalBudget = 'Minimum budget is $50';
      }

      const eventType = raw.eventType === 'other'
        ? (raw.customEventType || '').trim() || 'Custom Celebration'
        : raw.eventType || 'celebration';

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
        sanitizedInput: {
          title,
          city,
          eventDate: date,
          guestCount: guests,
          totalBudget: budget,
          eventType,
        },
      };
    }

    // Valid complete input
    const valid = validateEventInput({
      title: 'Alumni Dinner Gala',
      city: 'Boston, MA',
      eventDate: '2026-11-20',
      guestCount: 80,
      totalBudget: 6000,
      eventType: 'corporate',
    });
    assert.equal(valid.isValid, true);
    assert.equal(Object.keys(valid.errors).length, 0);

    // Short title < 3 chars
    const shortTitle = validateEventInput({
      title: 'AI',
      city: 'Austin',
      eventDate: '2026-12-01',
      guestCount: 20,
      totalBudget: 1000,
    });
    assert.equal(shortTitle.isValid, false);
    assert.equal(shortTitle.errors.title, 'Event title must be at least 3 characters');

    // Missing city and invalid date
    const badCityDate = validateEventInput({
      title: 'Tech Fest',
      city: '   ',
      eventDate: 'invalid-date',
      guestCount: 50,
      totalBudget: 2000,
    });
    assert.equal(badCityDate.isValid, false);
    assert.equal(badCityDate.errors.city, 'City or location is required');
    assert.match(badCityDate.errors.eventDate, /Invalid date format/);

    // Negative guest count and zero budget
    const badNumeric = validateEventInput({
      title: 'Birthday Bash',
      city: 'London',
      eventDate: '2026-05-15',
      guestCount: -5,
      totalBudget: 0,
    });
    assert.equal(badNumeric.isValid, false);
    assert.equal(badNumeric.errors.guestCount, 'At least 1 guest is required');
    assert.equal(badNumeric.errors.totalBudget, 'Minimum budget is $50');

    // Custom event type fallback
    const customType = validateEventInput({
      title: 'Hackathon Demo Day',
      city: 'San Francisco',
      eventDate: '2026-08-20',
      guestCount: 150,
      totalBudget: 5000,
      eventType: 'other',
      customEventType: 'AI Builder Hackathon',
    });
    assert.equal(customType.isValid, true);
    assert.equal(customType.sanitizedInput.eventType, 'AI Builder Hackathon');
  });

  // Test 9: Task Checklist Lifecycle, Progress Tracking & Phase Grouping
  await t.test('9. Timeline checklist handles task completion, progress percentages, and phase filtering', () => {
    let tasks = [
      { id: 't1', title: 'Confirm venue booking', duePhase: '8+ Weeks Before', priority: 'high', isCompleted: false },
      { id: 't2', title: 'Hire photographer', duePhase: '4-6 Weeks Before', priority: 'medium', isCompleted: false },
      { id: 't3', title: 'Send invitation cards', duePhase: '4-6 Weeks Before', priority: 'high', isCompleted: false },
      { id: 't4', title: 'Finalize dinner menu', duePhase: '2-3 Weeks Before', priority: 'high', isCompleted: false },
    ];

    function calculateProgress(taskList) {
      if (!taskList || taskList.length === 0) return 0;
      const completed = taskList.filter((t) => t.isCompleted).length;
      return Math.round((completed / taskList.length) * 100);
    }

    // Initial progress
    assert.equal(calculateProgress(tasks), 0, 'Initial progress should be 0%');

    // Complete task 1
    tasks = tasks.map((t) => (t.id === 't1' ? { ...t, isCompleted: true } : t));
    assert.equal(calculateProgress(tasks), 25, '1 of 4 completed should be 25%');

    // Complete task 2
    tasks = tasks.map((t) => (t.id === 't2' ? { ...t, isCompleted: true } : t));
    assert.equal(calculateProgress(tasks), 50, '2 of 4 completed should be 50%');

    // Filter by priority
    const highPriorityTasks = tasks.filter((t) => t.priority === 'high');
    assert.equal(highPriorityTasks.length, 3, 'There should be 3 high-priority tasks');

    // Group by phase
    const phases = {};
    tasks.forEach((t) => {
      phases[t.duePhase] = phases[t.duePhase] || [];
      phases[t.duePhase].push(t);
    });

    assert.equal(phases['8+ Weeks Before'].length, 1);
    assert.equal(phases['4-6 Weeks Before'].length, 2);
    assert.equal(phases['2-3 Weeks Before'].length, 1);

    // Complete all tasks
    const allCompleted = tasks.map((t) => ({ ...t, isCompleted: true }));
    assert.equal(calculateProgress(allCompleted), 100, 'All completed should be 100%');
  });
});
