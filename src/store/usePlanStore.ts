import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FrequencyType, ScheduleFrequency, DistributionInfo } from '../services/scheduler';
import type { LearningUnit } from '../data/mishnah-structure';

export interface SkippedChapter {
  masechetId: string;
  chapter: number; // 1-based
}

export interface LearningPlan {
  id: string;
  createdAt: string;

  // What to learn
  masechetIds: string[];
  planName: string;
  mode: 'by_book' | 'by_pace';
  unit: LearningUnit;
  frequency: ScheduleFrequency;

  // by_book specific
  targetDate?: string;

  // by_pace specific
  amountPerDay?: number;

  // Calculated
  calculatedAmountPerDay: number;
  totalUnits: number;
  estimatedEndDate?: string;

  // Distribution strategy (for by_book mode when units don't divide evenly)
  distribution?: DistributionInfo & { strategy: 'even' | 'tapered' };

  // Progress
  currentPosition: number;
  completedDates: string[];
  lastLearningDate?: string;
  isCompleted: boolean;

  // Holes - chapters BEHIND currentPosition that weren't learned
  skippedChapters: SkippedChapter[];

  // Pre-learned - chapters AHEAD of currentPosition that were already learned
  // When currentPosition reaches them, they'll be auto-skipped
  preLearnedChapters: SkippedChapter[];
}

interface PlanStore {
  plans: LearningPlan[];
  activePlanId: string | null;

  addPlan: (plan: LearningPlan) => void;
  removePlan: (planId: string) => void;
  setActivePlan: (planId: string | null) => void;

  markDayComplete: (planId: string, date: string, unitsCompleted: number) => void;
  updatePosition: (planId: string, newPosition: number) => void;
  jumpPosition: (planId: string, newPosition: number, newAmountPerDay?: number, newSkippedChapters?: SkippedChapter[]) => void;
  toggleSkippedChapter: (planId: string, masechetId: string, chapter: number) => void;
  markChapterLearned: (planId: string, masechetId: string, chapter: number) => void;
  /** Add chapters that were learned out of order (ahead of currentPosition) */
  addPreLearnedChapters: (planId: string, chapters: SkippedChapter[]) => void;
  /** Remove a pre-learned chapter (user changed their mind) */
  removePreLearnedChapter: (planId: string, masechetId: string, chapter: number) => void;
  /** Update daily amount and optionally distribution */
  updatePace: (planId: string, newAmount: number, newDistribution?: DistributionInfo & { strategy: 'even' | 'tapered' }) => void;
  /** Add masechtot to an existing plan */
  addMasechtot: (planId: string, newMasechetIds: string[], insertAtIndex?: number) => void;
  /** Reorder masechtot in a plan */
  reorderMasechtot: (planId: string, newOrder: string[]) => void;
  /** Update plan name */
  updatePlanName: (planId: string, name: string) => void;
  resetPlan: (planId: string) => void;
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set) => ({
      plans: [],
      activePlanId: null,

      addPlan: (plan) =>
        set((state) => ({
          plans: [...state.plans, plan],
          activePlanId: plan.id,
        })),

      removePlan: (planId) =>
        set((state) => ({
          plans: state.plans.filter((p) => p.id !== planId),
          activePlanId: state.activePlanId === planId ? null : state.activePlanId,
        })),

      setActivePlan: (planId) =>
        set({ activePlanId: planId }),

      markDayComplete: (planId, date, unitsCompleted) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            let newPosition = p.currentPosition + unitsCompleted;

            const preLearnedChapters = p.preLearnedChapters || [];

            // Auto-skip past any pre-learned chapters at the new position
            const { pos, consumed } = skipPreLearnedFromPosition(
              p.masechetIds, p.unit, newPosition, preLearnedChapters
            );
            newPosition = pos;

            // Remove consumed pre-learned chapters (now behind currentPosition)
            const remainingPreLearned = preLearnedChapters.filter(
              pl => !consumed.some(c => c.masechetId === pl.masechetId && c.chapter === pl.chapter)
            );

            const isCompleted = newPosition >= p.totalUnits;
            return {
              ...p,
              currentPosition: Math.min(newPosition, p.totalUnits),
              completedDates: [...p.completedDates, date],
              lastLearningDate: date,
              isCompleted,
              preLearnedChapters: remainingPreLearned,
            };
          }),
        })),

      updatePosition: (planId, newPosition) =>
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === planId
              ? { ...p, currentPosition: newPosition, isCompleted: newPosition >= p.totalUnits }
              : p
          ),
        })),

      jumpPosition: (planId, newPosition, newAmountPerDay, newSkippedChapters) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            return {
              ...p,
              currentPosition: Math.min(newPosition, p.totalUnits),
              isCompleted: newPosition >= p.totalUnits,
              ...(newAmountPerDay !== undefined ? { calculatedAmountPerDay: newAmountPerDay } : {}),
              ...(newSkippedChapters !== undefined ? { skippedChapters: newSkippedChapters } : {}),
            };
          }),
        })),

      toggleSkippedChapter: (planId, masechetId, chapter) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            const exists = p.skippedChapters.some(
              (s) => s.masechetId === masechetId && s.chapter === chapter
            );
            return {
              ...p,
              skippedChapters: exists
                ? p.skippedChapters.filter(
                    (s) => !(s.masechetId === masechetId && s.chapter === chapter)
                  )
                : [...p.skippedChapters, { masechetId, chapter }],
            };
          }),
        })),

      markChapterLearned: (planId, masechetId, chapter) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            return {
              ...p,
              skippedChapters: p.skippedChapters.filter(
                (s) => !(s.masechetId === masechetId && s.chapter === chapter)
              ),
            };
          }),
        })),

      addPreLearnedChapters: (planId, chapters) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            // Avoid duplicates
            const preLearnedChapters = p.preLearnedChapters || [];
            const existing = new Set(preLearnedChapters.map(c => `${c.masechetId}:${c.chapter}`));
            const toAdd = chapters.filter(c => !existing.has(`${c.masechetId}:${c.chapter}`));
            return {
              ...p,
              preLearnedChapters: [...preLearnedChapters, ...toAdd],
            };
          }),
        })),

      removePreLearnedChapter: (planId, masechetId, chapter) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            return {
              ...p,
              preLearnedChapters: (p.preLearnedChapters || []).filter(
                c => !(c.masechetId === masechetId && c.chapter === chapter)
              ),
            };
          }),
        })),

      updatePace: (planId, newAmount, newDistribution) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            return {
              ...p,
              calculatedAmountPerDay: newAmount,
              distribution: newDistribution,
            };
          }),
        })),

      addMasechtot: (planId, newMasechetIds, insertAtIndex) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            const toAdd = newMasechetIds.filter(id => !p.masechetIds.includes(id));
            if (toAdd.length === 0) return p;

            let updatedIds: string[];
            if (insertAtIndex !== undefined) {
              updatedIds = [...p.masechetIds];
              updatedIds.splice(insertAtIndex, 0, ...toAdd);
            } else {
              updatedIds = [...p.masechetIds, ...toAdd];
            }

            const newTotalUnits = getMultiMasechetTotalUnits(updatedIds, p.unit);
            const newPlanName = getPlanDisplayName(updatedIds);

            return {
              ...p,
              masechetIds: updatedIds,
              totalUnits: newTotalUnits,
              planName: newPlanName,
              isCompleted: false,
            };
          }),
        })),

      reorderMasechtot: (planId, newOrder) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            return { ...p, masechetIds: newOrder };
          }),
        })),

      updatePlanName: (planId, name) =>
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === planId ? { ...p, planName: name } : p
          ),
        })),

      resetPlan: (planId) =>
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === planId
              ? {
                  ...p,
                  currentPosition: 0,
                  completedDates: [],
                  lastLearningDate: undefined,
                  isCompleted: false,
                  skippedChapters: [],
                  preLearnedChapters: [],
                }
              : p
          ),
        })),
    }),
    {
      name: 'mishnah-yomit-plans',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PlanStore> | undefined;
        return {
          ...currentState,
          ...persisted,
          plans: (persisted?.plans || []).map(p => ({
            ...p,
            skippedChapters: p.skippedChapters || [],
            preLearnedChapters: p.preLearnedChapters || [],
          })),
        };
      },
    }
  )
);

/** Generate a unique ID */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Imports for helpers ──

import { getMasechet, getMasechetUnits, getMultiMasechetTotalUnits, getPlanDisplayName } from '../data/mishnah-structure';

// ── Skip pre-learned logic ──

/**
 * Starting from `position`, skip past any consecutive pre-learned chapters.
 * Returns the new position and which pre-learned entries were consumed.
 */
function skipPreLearnedFromPosition(
  masechetIds: string[],
  unit: LearningUnit,
  position: number,
  preLearnedChapters: SkippedChapter[],
): { pos: number; consumed: SkippedChapter[] } {
  if (preLearnedChapters.length === 0) return { pos: position, consumed: [] };

  const consumed: SkippedChapter[] = [];
  let pos = position;
  let changed = true;

  while (changed) {
    changed = false;
    // Find which masechet and chapter we're at
    const loc = getChapterAtGlobalPosition(masechetIds, unit, pos);
    if (!loc) break;

    // Check if this chapter is pre-learned
    const isPL = preLearnedChapters.some(
      pl => pl.masechetId === loc.masechetId && pl.chapter === loc.chapter
    );

    if (isPL && loc.isAtChapterStart) {
      // Skip this entire chapter
      consumed.push({ masechetId: loc.masechetId, chapter: loc.chapter });
      pos += loc.chapterUnits;
      changed = true;
    }
  }

  return { pos, consumed };
}

/**
 * Determine which chapter a global position falls in, and whether it's at the start.
 */
function getChapterAtGlobalPosition(
  masechetIds: string[],
  unit: LearningUnit,
  position: number,
): { masechetId: string; chapter: number; isAtChapterStart: boolean; chapterUnits: number } | null {
  let globalOffset = 0;

  for (const mid of masechetIds) {
    const m = getMasechet(mid);
    if (!m) continue;
    const masechetUnits = getMasechetUnits(m, unit);

    if (position < globalOffset + masechetUnits) {
      // Position is in this masechet
      const localPos = position - globalOffset;

      if (unit === 'perek') {
        // In perek mode, localPos IS the chapter index (0-based)
        return {
          masechetId: mid,
          chapter: localPos + 1,
          isAtChapterStart: true, // Always at chapter start in perek mode
          chapterUnits: 1,
        };
      } else {
        // In mishnah mode, find which chapter and if at start
        let cumulative = 0;
        for (let ch = 0; ch < m.chapters.length; ch++) {
          const chapterSize = m.chapters[ch];
          if (localPos < cumulative + chapterSize) {
            return {
              masechetId: mid,
              chapter: ch + 1,
              isAtChapterStart: localPos === cumulative,
              chapterUnits: chapterSize,
            };
          }
          cumulative += chapterSize;
        }
      }
    }
    globalOffset += masechetUnits;
  }
  return null;
}

// ── Helpers for skipped/pre-learned chapters ──

/** Check if a chapter is skipped (hole) */
export function isChapterSkipped(plan: LearningPlan, masechetId: string, chapter: number): boolean {
  return plan.skippedChapters.some(s => s.masechetId === masechetId && s.chapter === chapter);
}

/** Check if a chapter is pre-learned (ahead of position, already done) */
export function isChapterPreLearned(plan: LearningPlan, masechetId: string, chapter: number): boolean {
  return (plan.preLearnedChapters || []).some(s => s.masechetId === masechetId && s.chapter === chapter);
}

/** Count total skipped units (holes) */
export function getSkippedUnitsCount(plan: LearningPlan): number {
  if (plan.unit === 'perek') {
    return plan.skippedChapters.length;
  }
  return plan.skippedChapters.reduce((sum, s) => {
    const m = getMasechet(s.masechetId);
    if (!m || s.chapter < 1 || s.chapter > m.chapters.length) return sum;
    return sum + m.chapters[s.chapter - 1];
  }, 0);
}

/** Count total pre-learned units (ahead of position) */
export function getPreLearnedUnitsCount(plan: LearningPlan): number {
  const preLearned = plan.preLearnedChapters || [];
  if (plan.unit === 'perek') {
    return preLearned.length;
  }
  return preLearned.reduce((sum, s) => {
    const m = getMasechet(s.masechetId);
    if (!m || s.chapter < 1 || s.chapter > m.chapters.length) return sum;
    return sum + m.chapters[s.chapter - 1];
  }, 0);
}

/** Get count of skipped chapters in a specific masechet */
export function getSkippedInMasechet(plan: LearningPlan, masechetId: string): number {
  return plan.skippedChapters.filter(s => s.masechetId === masechetId).length;
}

/** Get count of pre-learned chapters in a specific masechet */
export function getPreLearnedInMasechet(plan: LearningPlan, masechetId: string): number {
  return (plan.preLearnedChapters || []).filter(s => s.masechetId === masechetId).length;
}
