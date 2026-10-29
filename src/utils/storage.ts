import { EventPlan } from '../types/event';
import { SAMPLE_PLANS } from './sampleData';

const STORAGE_KEY = 'veyora_saved_plans_v1';
const LEGACY_STORAGE_KEY = 'eventpilot_saved_plans_v1';
const CURRENT_ACTIVE_KEY = 'veyora_active_plan_id';
const LEGACY_ACTIVE_KEY = 'eventpilot_active_plan_id';

export const storageHelper = {
  getSavedPlans(): EventPlan[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) {
        // Seed with sample plans initially
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_PLANS));
        return SAMPLE_PLANS;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return SAMPLE_PLANS;
    } catch (e) {
      console.error('Failed reading saved plans from localStorage', e);
      return SAMPLE_PLANS;
    }
  },

  savePlan(plan: EventPlan): void {
    try {
      const plans = this.getSavedPlans();
      const existingIdx = plans.findIndex((p) => p.id === plan.id);
      const updatedPlan = {
        ...plan,
        lastEditedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        plans[existingIdx] = updatedPlan;
      } else {
        plans.unshift(updatedPlan);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
      localStorage.setItem(CURRENT_ACTIVE_KEY, plan.id);
    } catch (e) {
      console.error('Failed saving plan to localStorage', e);
    }
  },

  deletePlan(planId: string): EventPlan[] {
    try {
      const plans = this.getSavedPlans().filter((p) => p.id !== planId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
      if (localStorage.getItem(CURRENT_ACTIVE_KEY) === planId) {
        if (plans.length > 0) {
          localStorage.setItem(CURRENT_ACTIVE_KEY, plans[0].id);
        } else {
          localStorage.removeItem(CURRENT_ACTIVE_KEY);
        }
      }
      return plans;
    } catch (e) {
      console.error('Failed deleting plan', e);
      return [];
    }
  },

  getActivePlanId(): string | null {
    try {
      return localStorage.getItem(CURRENT_ACTIVE_KEY) || localStorage.getItem(LEGACY_ACTIVE_KEY) || null;
    } catch {
      return null;
    }
  },

  setActivePlanId(id: string): void {
    try {
      localStorage.setItem(CURRENT_ACTIVE_KEY, id);
    } catch (e) {
      console.error('Failed setting active plan id', e);
    }
  },

  exportPlanToJson(plan: EventPlan): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const filename = `${plan.concept.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_VeyoraPlan.json`;
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  importPlanFromJson(jsonString: string): EventPlan {
    const parsed = JSON.parse(jsonString);
    if (!parsed.id || !parsed.concept || !parsed.budgetPlan || !parsed.timeline) {
      throw new Error('Invalid Veyora plan file structure.');
    }
    const newId = `imported-${Date.now()}`;
    const importedPlan: EventPlan = {
      ...parsed,
      id: newId,
      lastEditedAt: new Date().toISOString(),
    };
    this.savePlan(importedPlan);
    return importedPlan;
  },
};
