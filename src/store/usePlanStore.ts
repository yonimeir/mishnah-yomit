import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScheduleFrequency, DistributionInfo } from '../services/scheduler';
import type { LearningUnit, ContentType } from '../data/mishnah-structure';
import { scheduleReminders } from '../services/notifications';

export interface SkippedChapter {
  masechetId: string;
  chapter: number; // 1-based
}

export interface SubProgram {
  id: string;
  name?: string;

  // What to learn
  contentType: ContentType;
  masechetIds: string[];
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

  // Reminder
  reminderTime?: string; // e.g. "08:30"

  // Progress
  currentPosition: number;
  completedDates: string[];
  lastLearningDate?: string;
  isCompleted: boolean;

  // Holes - chapters BEHIND currentPosition that weren't learned
  skippedChapters: SkippedChapter[];

  // Pre-learned - chapters AHEAD of currentPosition that were already learned
  preLearnedChapters: SkippedChapter[];
}

export interface LearningPlan {
  id: string;
  createdAt: string;
  planName: string;
  subPrograms: SubProgram[];
}

interface PlanStore {
  plans: LearningPlan[];
  activePlanId: string | null;

  addPlan: (plan: LearningPlan) => void;
  removePlan: (planId: string) => void;
  setActivePlan: (planId: string | null) => void;

  markDayComplete: (planId: string, subProgramId: string, date: string, unitsCompleted: number) => void;
  updatePosition: (planId: string, subProgramId: string, newPosition: number) => void;
  jumpPosition: (planId: string, subProgramId: string, newPosition: number, newAmountPerDay?: number, newSkippedChapters?: SkippedChapter[]) => void;
  toggleSkippedChapter: (planId: string, subProgramId: string, masechetId: string, chapter: number) => void;
  markChapterLearned: (planId: string, subProgramId: string, masechetId: string, chapter: number) => void;
  addPreLearnedChapters: (planId: string, subProgramId: string, chapters: SkippedChapter[]) => void;
  removePreLearnedChapter: (planId: string, subProgramId: string, masechetId: string, chapter: number) => void;
  updatePace: (planId: string, subProgramId: string, newAmount: number, newDistribution?: DistributionInfo & { strategy: 'even' | 'tapered' }) => void;
  addMasechtot: (planId: string, subProgramId: string, newMasechetIds: string[], insertAtIndex?: number) => void;
  reorderMasechtot: (planId: string, subProgramId: string, newOrder: string[]) => void;
  updatePlanName: (planId: string, name: string) => void;
  updateReminderTime: (planId: string, subProgramId: string, time?: string) => void;
  resetPlan: (planId: string) => void;

  // SubProgram exclusive actions
  addSubProgramToPlan: (planId: string, subProgram: SubProgram) => void;
  removeSubProgram: (planId: string, subProgramId: string) => void;
  extractMasechetToSubProgram: (planId: string, sourceSubProgramId: string, masechetId: string, newSubProgramDetails: Partial<SubProgram>) => void;
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set) => ({
      plans: [],
      activePlanId: null,

      addPlan: (plan) =>
        set((state) => {
          const nextPlans = [...state.plans, plan];
          scheduleRemindersForPlans(nextPlans);
          return {
            plans: nextPlans,
            activePlanId: plan.id,
          };
        }),

      removePlan: (planId) =>
        set((state) => {
          const nextPlans = state.plans.filter((p) => p.id !== planId);
          scheduleRemindersForPlans(nextPlans);
          return {
            plans: nextPlans,
            activePlanId: state.activePlanId === planId ? null : state.activePlanId,
          };
        }),

      setActivePlan: (planId) =>
        set({ activePlanId: planId }),

      markDayComplete: (planId, subProgramId, date, unitsCompleted) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            return {
              ...p,
              subPrograms: p.subPrograms.map((sp) => {
                if (sp.id !== subProgramId) return sp;
                let newPosition = sp.currentPosition + unitsCompleted;

                const preLearnedChapters = sp.preLearnedChapters || [];

                // Auto-skip past any pre-learned chapters at the new position
                const { pos, consumed } = skipPreLearnedFromPosition(
                  sp.masechetIds, sp.unit, newPosition, preLearnedChapters
                );
                newPosition = pos;

                // Remove consumed pre-learned chapters
                const remainingPreLearned = preLearnedChapters.filter(
                  pl => !consumed.some(c => c.masechetId === pl.masechetId && c.chapter === pl.chapter)
                );

                const isCompleted = newPosition >= sp.totalUnits;
                return {
                  ...sp,
                  currentPosition: Math.min(newPosition, sp.totalUnits),
                  completedDates: [...sp.completedDates, date],
                  lastLearningDate: date,
                  isCompleted,
                  preLearnedChapters: remainingPreLearned,
                };
              })
            };
          }),
        })),

      updatePosition: (planId, subProgramId, newPosition) =>
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === planId
              ? {
                ...p,
                subPrograms: p.subPrograms.map((sp) =>
                  sp.id === subProgramId
                    ? { ...sp, currentPosition: newPosition, isCompleted: newPosition >= sp.totalUnits }
                    : sp
                )
              }
              : p
          ),
        })),

      jumpPosition: (planId, subProgramId, newPosition, newAmountPerDay, newSkippedChapters) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            return {
              ...p,
              subPrograms: p.subPrograms.map((sp) => {
                if (sp.id !== subProgramId) return sp;
                return {
                  ...sp,
                  currentPosition: Math.min(newPosition, sp.totalUnits),
                  isCompleted: newPosition >= sp.totalUnits,
                  ...(newAmountPerDay !== undefined ? { calculatedAmountPerDay: newAmountPerDay } : {}),
                  ...(newSkippedChapters !== undefined ? { skippedChapters: newSkippedChapters } : {}),
                };
              })
            };
          }),
        })),

      toggleSkippedChapter: (planId, subProgramId, masechetId, chapter) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            return {
              ...p,
              subPrograms: p.subPrograms.map((sp) => {
                if (sp.id !== subProgramId) return sp;
                const exists = sp.skippedChapters.some(
                  (s) => s.masechetId === masechetId && s.chapter === chapter
                );
                return {
                  ...sp,
                  skippedChapters: exists
                    ? sp.skippedChapters.filter(
                      (s) => !(s.masechetId === masechetId && s.chapter === chapter)
                    )
                    : [...sp.skippedChapters, { masechetId, chapter }],
                };
              })
            };
          }),
        })),

      markChapterLearned: (planId, subProgramId, masechetId, chapter) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            return {
              ...p,
              subPrograms: p.subPrograms.map((sp) => {
                if (sp.id !== subProgramId) return sp;
                return {
                  ...sp,
                  skippedChapters: sp.skippedChapters.filter(
                    (s) => !(s.masechetId === masechetId && s.chapter === chapter)
                  ),
                };
              })
            };
          }),
        })),

      addPreLearnedChapters: (planId, subProgramId, chapters) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            return {
              ...p,
              subPrograms: p.subPrograms.map((sp) => {
                if (sp.id !== subProgramId) return sp;
                const preLearnedChapters = sp.preLearnedChapters || [];
                const existing = new Set(preLearnedChapters.map(c => `${c.masechetId}:${c.chapter}`));
                const toAdd = chapters.filter(c => !existing.has(`${c.masechetId}:${c.chapter}`));
                return {
                  ...sp,
                  preLearnedChapters: [...preLearnedChapters, ...toAdd],
                };
              })
            };
          }),
        })),

      removePreLearnedChapter: (planId, subProgramId, masechetId, chapter) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            return {
              ...p,
              subPrograms: p.subPrograms.map((sp) => {
                if (sp.id !== subProgramId) return sp;
                return {
                  ...sp,
                  preLearnedChapters: (sp.preLearnedChapters || []).filter(
                    c => !(c.masechetId === masechetId && c.chapter === chapter)
                  ),
                };
              })
            };
          }),
        })),

      updatePace: (planId, subProgramId, newAmount, newDistribution) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            return {
              ...p,
              subPrograms: p.subPrograms.map((sp) => {
                if (sp.id !== subProgramId) return sp;
                return {
                  ...sp,
                  calculatedAmountPerDay: newAmount,
                  distribution: newDistribution,
                };
              })
            };
          }),
        })),

      addMasechtot: (planId, subProgramId, newMasechetIds, insertAtIndex) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            return {
              ...p,
              subPrograms: p.subPrograms.map((sp) => {
                if (sp.id !== subProgramId) return sp;
                const toAdd = newMasechetIds.filter(id => !sp.masechetIds.includes(id));
                if (toAdd.length === 0) return sp;

                let updatedIds: string[];
                if (insertAtIndex !== undefined) {
                  updatedIds = [...sp.masechetIds];
                  updatedIds.splice(insertAtIndex, 0, ...toAdd);
                } else {
                  updatedIds = [...sp.masechetIds, ...toAdd];
                }

                const newTotalUnits = getMultiMasechetTotalUnits(updatedIds, sp.unit);
                return {
                  ...sp,
                  masechetIds: updatedIds,
                  totalUnits: newTotalUnits,
                  isCompleted: false,
                };
              })
            };
          }),
        })),

      reorderMasechtot: (planId, subProgramId, newOrder) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;
            return {
              ...p,
              subPrograms: p.subPrograms.map((sp) =>
                sp.id === subProgramId ? { ...sp, masechetIds: newOrder } : sp
              )
            };
          }),
        })),

      updatePlanName: (planId, name) =>
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === planId ? { ...p, planName: name } : p
          ),
        })),

      updateReminderTime: (planId, subProgramId, time) =>
        set((state) => {
          const nextPlans = state.plans.map((p) => {
            if (p.id !== planId) return p;
            return {
              ...p,
              subPrograms: p.subPrograms.map((sp) =>
                sp.id === subProgramId ? { ...sp, reminderTime: time } : sp
              )
            };
          });
          scheduleRemindersForPlans(nextPlans);
          return { plans: nextPlans };
        }),

      resetPlan: (planId) =>
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === planId
              ? {
                ...p,
                subPrograms: p.subPrograms.map((sp) => ({
                  ...sp,
                  currentPosition: 0,
                  completedDates: [],
                  lastLearningDate: undefined,
                  isCompleted: false,
                  skippedChapters: [],
                  preLearnedChapters: [],
                }))
              }
              : p
          ),
        })),

      addSubProgramToPlan: (planId, subProgram) =>
        set((state) => {
          const nextPlans = state.plans.map((p) =>
            p.id === planId
              ? { ...p, subPrograms: [...p.subPrograms, subProgram] }
              : p
          );
          scheduleRemindersForPlans(nextPlans);
          return { plans: nextPlans };
        }),

      removeSubProgram: (planId, subProgramId) =>
        set((state) => {
          const nextPlans = state.plans.map((p) => {
            if (p.id !== planId) return p;
            return {
              ...p,
              subPrograms: p.subPrograms.filter((sp) => sp.id !== subProgramId)
            };
          });
          scheduleRemindersForPlans(nextPlans);
          return { plans: nextPlans };
        }),

      extractMasechetToSubProgram: (planId, sourceSubProgramId, masechetId, newSubProgramDetails) =>
        set((state) => ({
          plans: state.plans.map((p) => {
            if (p.id !== planId) return p;

            const sourceSp = p.subPrograms.find(sp => sp.id === sourceSubProgramId);
            if (!sourceSp || !sourceSp.masechetIds.includes(masechetId)) return p;

            // Remove masechet from source
            const newSourceMasechetIds = sourceSp.masechetIds.filter(id => id !== masechetId);
            // Calculate what units to keep skipped/prelearned for source vs target ? That's complex
            // We'll keep it simple: filter skips
            const sourceSkipped = sourceSp.skippedChapters.filter(s => s.masechetId !== masechetId);
            const targetSkipped = sourceSp.skippedChapters.filter(s => s.masechetId === masechetId);
            const sourcePreLearned = sourceSp.preLearnedChapters.filter(s => s.masechetId !== masechetId);
            const targetPreLearned = sourceSp.preLearnedChapters.filter(s => s.masechetId === masechetId);

            const newTotalUnitsSource = getMultiMasechetTotalUnits(newSourceMasechetIds, sourceSp.unit);

            // Re-calculate simple progress (this might be slightly inaccurate if order was different, 
            // but for simplicity we assume target gets started at 0 and source gets adjusted)
            // A perfect migration of position is tricky, assuming user sets it if needed.

            const updatedSourceSp: SubProgram = {
              ...sourceSp,
              masechetIds: newSourceMasechetIds,
              totalUnits: newTotalUnitsSource,
              skippedChapters: sourceSkipped,
              preLearnedChapters: sourcePreLearned,
            };

            const extractedSp: SubProgram = {
              id: generateId(),
              name: getMasechet(masechetId)?.name || 'מסכת מפוצלת',
              contentType: sourceSp.contentType,
              masechetIds: [masechetId],
              mode: newSubProgramDetails.mode || sourceSp.mode,
              unit: newSubProgramDetails.unit || sourceSp.unit,
              frequency: newSubProgramDetails.frequency || sourceSp.frequency,
              targetDate: newSubProgramDetails.targetDate,
              amountPerDay: newSubProgramDetails.amountPerDay,
              calculatedAmountPerDay: newSubProgramDetails.calculatedAmountPerDay || sourceSp.calculatedAmountPerDay,
              totalUnits: getMultiMasechetTotalUnits([masechetId], newSubProgramDetails.unit || sourceSp.unit),
              currentPosition: 0, // Reset position for extracted
              completedDates: [],
              isCompleted: false,
              skippedChapters: targetSkipped,
              preLearnedChapters: targetPreLearned,
              reminderTime: newSubProgramDetails.reminderTime || sourceSp.reminderTime
            };

            return {
              ...p,
              subPrograms: p.subPrograms.map(sp => sp.id === sourceSubProgramId ? updatedSourceSp : sp).concat(extractedSp)
            };
          })
        })),

    }),
    {
      name: 'mishnah-yomit-plans',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as any;
        return {
          ...currentState,
          ...persisted,
          plans: (persisted?.plans || []).map((p: any) => {
            if (!p.subPrograms) {
              const sp: SubProgram = {
                id: generateId(),
                name: p.masechetIds && p.masechetIds.length > 1 ? 'חלק עיקרי' : undefined,
                contentType: p.contentType || 'mishnah',
                masechetIds: p.masechetIds || [],
                mode: p.mode || 'by_pace',
                unit: p.unit || 'mishnah',
                frequency: p.frequency || { type: 'daily' },
                targetDate: p.targetDate,
                amountPerDay: p.amountPerDay,
                calculatedAmountPerDay: p.calculatedAmountPerDay || 1,
                totalUnits: p.totalUnits || 1,
                estimatedEndDate: p.estimatedEndDate,
                distribution: p.distribution,
                reminderTime: p.reminderTime,
                currentPosition: p.currentPosition || 0,
                completedDates: p.completedDates || [],
                lastLearningDate: p.lastLearningDate,
                isCompleted: p.isCompleted || false,
                skippedChapters: p.skippedChapters || [],
                preLearnedChapters: p.preLearnedChapters || [],
              };
              return {
                id: p.id,
                createdAt: p.createdAt || new Date().toISOString(),
                planName: p.planName || 'תוכנית ללא שם',
                subPrograms: [sp],
              };
            }
            return {
              ...p,
              subPrograms: p.subPrograms.map((sp: any) => ({
                ...sp,
                contentType: sp.contentType || 'mishnah',
                skippedChapters: sp.skippedChapters || [],
                preLearnedChapters: sp.preLearnedChapters || [],
              })),
            };
          }),
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

function scheduleRemindersForPlans(plans: LearningPlan[]) {
  // Pass plans to notifications; notifications service should probably be updated too
  // to grab reminders from subPrograms instead of plan.reminderTime
  scheduleReminders(plans as any);
}

// ── Skip pre-learned logic ──

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
    const loc = getChapterAtGlobalPosition(masechetIds, unit, pos);
    if (!loc) break;

    const isPL = preLearnedChapters.some(
      pl => pl.masechetId === loc.masechetId && pl.chapter === loc.chapter
    );

    if (isPL && loc.isAtChapterStart) {
      consumed.push({ masechetId: loc.masechetId, chapter: loc.chapter });
      pos += loc.chapterUnits;
      changed = true;
    }
  }

  return { pos, consumed };
}

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
      const localPos = position - globalOffset;

      if (unit === 'perek') {
        return {
          masechetId: mid,
          chapter: localPos + 1,
          isAtChapterStart: true,
          chapterUnits: 1,
        };
      } else {
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

export function isChapterSkipped(sp: SubProgram, masechetId: string, chapter: number): boolean {
  return sp.skippedChapters.some(s => s.masechetId === masechetId && s.chapter === chapter);
}

export function isChapterPreLearned(sp: SubProgram, masechetId: string, chapter: number): boolean {
  return (sp.preLearnedChapters || []).some(s => s.masechetId === masechetId && s.chapter === chapter);
}

export function getSkippedUnitsCount(sp: SubProgram): number {
  if (sp.unit === 'perek') {
    return sp.skippedChapters.length;
  }
  return sp.skippedChapters.reduce((sum, s) => {
    const m = getMasechet(s.masechetId);
    if (!m || s.chapter < 1 || s.chapter > m.chapters.length) return sum;
    return sum + m.chapters[s.chapter - 1];
  }, 0);
}

export function getPreLearnedUnitsCount(sp: SubProgram): number {
  const preLearned = sp.preLearnedChapters || [];
  if (sp.unit === 'perek') {
    return preLearned.length;
  }
  return preLearned.reduce((sum, s) => {
    const m = getMasechet(s.masechetId);
    if (!m || s.chapter < 1 || s.chapter > m.chapters.length) return sum;
    return sum + m.chapters[s.chapter - 1];
  }, 0);
}

export function getSkippedInMasechet(sp: SubProgram, masechetId: string): number {
  return sp.skippedChapters.filter(s => s.masechetId === masechetId).length;
}

export function getPreLearnedInMasechet(sp: SubProgram, masechetId: string): number {
  return (sp.preLearnedChapters || []).filter(s => s.masechetId === masechetId).length;
}
