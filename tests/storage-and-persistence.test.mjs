import test from 'node:test';
import assert from 'node:assert/strict';

test('Storage, Persistence & Plan Serialization Tests', async (t) => {
  // In-memory mock localStorage implementation
  class MockLocalStorage {
    constructor() {
      this.store = {};
    }
    getItem(key) {
      return this.store[key] || null;
    }
    setItem(key, value) {
      this.store[key] = String(value);
    }
    removeItem(key) {
      delete this.store[key];
    }
    clear() {
      this.store = {};
    }
  }

  // Test 1: Plan Storage, Upsert, and Retrieval
  await t.test('1. Plan storage helper creates, updates, and persists plans', () => {
    const storage = new MockLocalStorage();
    const STORAGE_KEY = 'veyora_saved_plans_v1';
    const CURRENT_ACTIVE_KEY = 'veyora_active_plan_id';

    const samplePlan1 = {
      id: 'plan-101',
      concept: { title: 'Tech Conference Gala' },
      budgetPlan: { totalBudget: 5000, items: [] },
      timeline: [],
    };

    const samplePlan2 = {
      id: 'plan-102',
      concept: { title: 'Garden Anniversary' },
      budgetPlan: { totalBudget: 2500, items: [] },
      timeline: [],
    };

    function savePlan(plan) {
      const raw = storage.getItem(STORAGE_KEY);
      const plans = raw ? JSON.parse(raw) : [];
      const idx = plans.findIndex((p) => p.id === plan.id);
      const updated = { ...plan, lastEditedAt: new Date().toISOString() };
      if (idx >= 0) {
        plans[idx] = updated;
      } else {
        plans.unshift(updated);
      }
      storage.setItem(STORAGE_KEY, JSON.stringify(plans));
      storage.setItem(CURRENT_ACTIVE_KEY, plan.id);
    }

    function getSavedPlans() {
      const raw = storage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }

    // Save plan 1
    savePlan(samplePlan1);
    let saved = getSavedPlans();
    assert.equal(saved.length, 1);
    assert.equal(saved[0].id, 'plan-101');
    assert.equal(storage.getItem(CURRENT_ACTIVE_KEY), 'plan-101');

    // Save plan 2
    savePlan(samplePlan2);
    saved = getSavedPlans();
    assert.equal(saved.length, 2);
    assert.equal(saved[0].id, 'plan-102', 'Latest saved plan should be at the front of list');

    // Update plan 1
    savePlan({ ...samplePlan1, concept: { title: 'Updated Tech Gala' } });
    saved = getSavedPlans();
    assert.equal(saved.length, 2, 'Upsert must not duplicate existing plan ID');
    const updated = saved.find((p) => p.id === 'plan-101');
    assert.equal(updated.concept.title, 'Updated Tech Gala');
  });

  // Test 2: Plan Deletion & Active ID Management
  await t.test('2. Plan deletion cleans up active ID reference properly', () => {
    const storage = new MockLocalStorage();
    const STORAGE_KEY = 'veyora_saved_plans_v1';
    const CURRENT_ACTIVE_KEY = 'veyora_active_plan_id';

    const plans = [
      { id: 'p1', concept: { title: 'Plan 1' } },
      { id: 'p2', concept: { title: 'Plan 2' } },
    ];
    storage.setItem(STORAGE_KEY, JSON.stringify(plans));
    storage.setItem(CURRENT_ACTIVE_KEY, 'p1');

    function deletePlan(id) {
      let current = JSON.parse(storage.getItem(STORAGE_KEY));
      current = current.filter((p) => p.id !== id);
      storage.setItem(STORAGE_KEY, JSON.stringify(current));

      if (storage.getItem(CURRENT_ACTIVE_KEY) === id) {
        if (current.length > 0) {
          storage.setItem(CURRENT_ACTIVE_KEY, current[0].id);
        } else {
          storage.removeItem(CURRENT_ACTIVE_KEY);
        }
      }
      return current;
    }

    // Delete p1 (currently active)
    const remaining = deletePlan('p1');
    assert.equal(remaining.length, 1);
    assert.equal(storage.getItem(CURRENT_ACTIVE_KEY), 'p2', 'Active plan should switch to remaining plan');

    // Delete p2 (last plan)
    const empty = deletePlan('p2');
    assert.equal(empty.length, 0);
    assert.equal(storage.getItem(CURRENT_ACTIVE_KEY), null, 'Active plan ID should be removed when no plans remain');
  });

  // Test 3: Legacy Key Fallback Migration
  await t.test('3. Migration fallback reads legacy storage keys when primary is absent', () => {
    const storage = new MockLocalStorage();
    const STORAGE_KEY = 'veyora_saved_plans_v1';
    const LEGACY_STORAGE_KEY = 'eventpilot_saved_plans_v1';

    const legacyData = [{ id: 'legacy-1', concept: { title: 'Legacy Event' } }];
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacyData));

    const raw = storage.getItem(STORAGE_KEY) || storage.getItem(LEGACY_STORAGE_KEY);
    assert.ok(raw);
    const parsed = JSON.parse(raw);
    assert.equal(parsed[0].id, 'legacy-1');
  });

  // Test 4: JSON Import Schema Validation
  await t.test('4. JSON plan importer validates schema structure and rejects corrupted payloads', () => {
    function importPlanFromJson(jsonString) {
      const parsed = JSON.parse(jsonString);
      if (!parsed.id || !parsed.concept || !parsed.budgetPlan || !parsed.timeline) {
        throw new Error('Invalid Veyora plan file structure.');
      }
      return {
        ...parsed,
        id: `imported-${Date.now()}`,
        lastEditedAt: new Date().toISOString(),
      };
    }

    // Valid plan JSON
    const validPlan = JSON.stringify({
      id: 'source-1',
      concept: { title: 'Valid Gala' },
      budgetPlan: { totalBudget: 4000, items: [] },
      timeline: [],
    });
    const imported = importPlanFromJson(validPlan);
    assert.ok(imported.id.startsWith('imported-'), 'Imported plan should receive new imported ID');
    assert.equal(imported.concept.title, 'Valid Gala');

    // Invalid missing timeline
    const invalidPlanMissingTimeline = JSON.stringify({
      id: 'source-2',
      concept: { title: 'Incomplete Plan' },
      budgetPlan: { totalBudget: 1000 },
    });
    assert.throws(
      () => importPlanFromJson(invalidPlanMissingTimeline),
      /Invalid Veyora plan file structure/,
      'Should throw validation error for missing timeline'
    );

    // Completely broken JSON
    assert.throws(
      () => importPlanFromJson('{ broken json ... '),
      SyntaxError,
      'Should reject invalid JSON syntax'
    );
  });

  // Test 5: Firebase Config Validation
  await t.test('5. Firebase configuration validation requires apiKey and projectId', () => {
    function isValidFirebaseConfig(cfg) {
      return Boolean(cfg && typeof cfg.apiKey === 'string' && cfg.apiKey.trim() && typeof cfg.projectId === 'string' && cfg.projectId.trim());
    }

    assert.ok(isValidFirebaseConfig({ apiKey: 'AIzaSyExampleKey', projectId: 'veyora-app' }));
    assert.equal(isValidFirebaseConfig({ apiKey: '', projectId: 'veyora-app' }), false);
    assert.equal(isValidFirebaseConfig({ apiKey: 'key' }), false);
    assert.equal(isValidFirebaseConfig(null), false);
    assert.equal(isValidFirebaseConfig({}), false);
  });
});
