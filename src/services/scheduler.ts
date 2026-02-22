import {
  type Masechet,
  type LearningUnit,
  getMasechet,
  getMasechetUnits,
  getMultiMasechetTotalUnits,
  globalToLocal,
  indexToRef,
} from '../data/mishnah-structure';

export type { LearningUnit };
export type FrequencyType = 'days_per_week' | 'days_per_month' | 'specific_days';

export interface ScheduleFrequency {
  type: FrequencyType;
  value: number | number[];
  reviewEvery?: number;
}

export interface LearningItem {
  masechetId: string;
  masechetName: string;
  sefariaName: string;
  chapter: number;
  fromMishnah: number;
  toMishnah: number;
  sefariaRef: string;
}

/** Check if a given date is a learning day based on frequency */
function isLearningDay(date: Date, freq: ScheduleFrequency, _dayCount: number): boolean {
  const dayOfWeek = date.getDay();

  if (freq.type === 'specific_days') {
    const days = freq.value as number[];
    return days.includes(dayOfWeek);
  }

  if (freq.type === 'days_per_week') {
    const daysPerWeek = freq.value as number;
    const spreadDays = getSpreadDays(7, daysPerWeek);
    return spreadDays.includes(dayOfWeek);
  }

  if (freq.type === 'days_per_month') {
    const daysPerMonth = freq.value as number;
    const dayOfMonth = date.getDate();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const spreadDays = getSpreadDays(daysInMonth, daysPerMonth);
    return spreadDays.includes(dayOfMonth - 1);
  }

  return true;
}

function getSpreadDays(total: number, count: number): number[] {
  if (count >= total) return Array.from({ length: total }, (_, i) => i);
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    result.push(Math.round((i * total) / count));
  }
  return result;
}

function countLearningDays(startDate: Date, endDate: Date, freq: ScheduleFrequency): number {
  let count = 0;
  const current = new Date(startDate);
  let dayCount = 0;
  while (current <= endDate) {
    if (isLearningDay(current, freq, dayCount)) count++;
    current.setDate(current.getDate() + 1);
    dayCount++;
  }
  return count;
}

// ── Distribution info ──

export interface DistributionInfo {
  /** Whether the division is exact (no remainder) */
  isExact: boolean;
  /** The higher daily amount (ceil) */
  highAmount: number;
  /** The lower daily amount (floor) */
  lowAmount: number;
  /** How many learning days get the higher amount (first days) */
  highDays: number;
  /** How many learning days get the lower amount (last days) */
  lowDays: number;
  /** Global position at which to switch from high to low amount */
  cutoffPosition: number;
  /** How many days early you'd finish with even (ceil) distribution */
  earlyFinishDays: number;
}

/** Calculate smart distribution for a total across learning days */
export function calculateDistribution(totalUnits: number, learningDays: number): DistributionInfo {
  const days = Math.max(learningDays, 1);
  const lowAmount = Math.floor(totalUnits / days);
  const highAmount = Math.ceil(totalUnits / days);
  const remainder = totalUnits % days;
  const isExact = remainder === 0;
  const highDays = isExact ? 0 : remainder;
  const lowDays = isExact ? days : days - remainder;
  const cutoffPosition = highDays * highAmount;

  // How many days early would you finish with even (ceil) distribution?
  const evenTotal = highAmount * days;
  const surplus = evenTotal - totalUnits;
  const earlyFinishDays = highAmount > 0 ? Math.floor(surplus / highAmount) : 0;

  return { isExact, highAmount, lowAmount, highDays, lowDays, cutoffPosition, earlyFinishDays };
}

/** Get the daily amount based on current position and distribution strategy */
export function getAmountForPosition(
  currentPosition: number,
  calculatedAmountPerDay: number,
  distribution?: DistributionInfo & { strategy: 'even' | 'tapered' },
): number {
  if (!distribution || distribution.strategy === 'even' || distribution.isExact) {
    return calculatedAmountPerDay;
  }
  // Tapered: first N days get highAmount, rest get lowAmount
  return currentPosition < distribution.cutoffPosition
    ? distribution.highAmount
    : distribution.lowAmount;
}

// ── Schedule calculators (multi-masechet) ──

export function calculateByBookScheduleMulti(
  masechetIds: string[],
  unit: LearningUnit,
  targetDate: string,
  frequency: ScheduleFrequency,
  startDate: Date = new Date()
): { amountPerDay: number; totalUnits: number; learningDays: number; distribution: DistributionInfo } {
  const endDate = new Date(targetDate);
  const learningDays = countLearningDays(startDate, endDate, frequency);
  const reviewDays = frequency.reviewEvery
    ? Math.floor(learningDays / (frequency.reviewEvery + 1))
    : 0;
  const actualLearningDays = learningDays - reviewDays;
  const totalUnits = getMultiMasechetTotalUnits(masechetIds, unit);
  const distribution = calculateDistribution(totalUnits, actualLearningDays);
  const amountPerDay = distribution.highAmount; // ceil - same as before for 'even' strategy
  return { amountPerDay, totalUnits, learningDays, distribution };
}

export function calculateByPaceScheduleMulti(
  masechetIds: string[],
  unit: LearningUnit,
  amountPerDay: number,
  frequency: ScheduleFrequency,
  startDate: Date = new Date()
): { estimatedEndDate: Date; totalUnits: number; totalDays: number } {
  const totalUnits = getMultiMasechetTotalUnits(masechetIds, unit);
  const learningDaysNeeded = Math.ceil(totalUnits / amountPerDay);

  let learningDaysCounted = 0;
  let totalCalendarDays = 0;
  const current = new Date(startDate);

  while (learningDaysCounted < learningDaysNeeded) {
    if (isLearningDay(current, frequency, totalCalendarDays)) learningDaysCounted++;
    current.setDate(current.getDate() + 1);
    totalCalendarDays++;
  }

  return {
    estimatedEndDate: new Date(current.getTime() - 86400000),
    totalUnits,
    totalDays: totalCalendarDays,
  };
}

// ── Pre-learned chapter type (matches store) ──

export interface PreLearnedChapter {
  masechetId: string;
  chapter: number; // 1-based
}

// ── Learning items (multi-masechet aware, skips pre-learned) ──

export function getLearningItemsForDay(
  masechetIds: string[],
  unit: LearningUnit,
  globalPosition: number,
  amountPerDay: number,
  preLearnedChapters?: PreLearnedChapter[],
): LearningItem[] {
  const items: LearningItem[] = [];
  const totalUnits = getMultiMasechetTotalUnits(masechetIds, unit);

  if (globalPosition >= totalUnits) return items;

  const isPreLearned = (masechetId: string, chapter: number) =>
    preLearnedChapters?.some(pl => pl.masechetId === masechetId && pl.chapter === chapter) ?? false;

  let remaining = amountPerDay;
  let pos = globalPosition;

  while (remaining > 0 && pos < totalUnits) {
    const loc = globalToLocal(masechetIds, pos, unit);
    if (!loc) break;

    const { masechet, positionInMasechet } = loc;
    const masechetTotalUnits = getMasechetUnits(masechet, unit);

    if (unit === 'perek') {
      const chapterIndex = positionInMasechet;
      if (chapterIndex >= masechet.chapters.length) break;
      const chapter = chapterIndex + 1;

      // Skip pre-learned chapters (advance position without consuming remaining)
      if (isPreLearned(masechet.id, chapter)) {
        pos++;
        continue;
      }

      items.push({
        masechetId: masechet.id,
        masechetName: masechet.name,
        sefariaName: masechet.sefariaName,
        chapter,
        fromMishnah: 1,
        toMishnah: masechet.chapters[chapterIndex],
        sefariaRef: `${masechet.sefariaName} ${chapter}`,
      });
      remaining--;
      pos++;
    } else {
      // Mishnah mode - determine which chapter we're in
      const ref = indexToRef(masechet, positionInMasechet);

      // Skip pre-learned chapter (skip entire chapter)
      if (isPreLearned(masechet.id, ref.chapter)) {
        const chapterSize = masechet.chapters[ref.chapter - 1];
        // Calculate how many mishnayot remain in this chapter
        const remainingInChapter = chapterSize - ref.mishnah + 1;
        pos += remainingInChapter;
        continue;
      }

      // Generate items for this chapter (up to remaining or end of chapter)
      const endOfChapter = masechet.chapters[ref.chapter - 1];
      const availableInChapter = endOfChapter - ref.mishnah + 1;
      const toTake = Math.min(remaining, availableInChapter);
      const toMishnah = ref.mishnah + toTake - 1;

      items.push({
        masechetId: masechet.id,
        masechetName: masechet.name,
        sefariaName: masechet.sefariaName,
        chapter: ref.chapter,
        fromMishnah: ref.mishnah,
        toMishnah,
        sefariaRef: ref.mishnah === toMishnah
          ? `${masechet.sefariaName} ${ref.chapter}:${ref.mishnah}`
          : `${masechet.sefariaName} ${ref.chapter}:${ref.mishnah}-${toMishnah}`,
      });
      remaining -= toTake;
      pos += toTake;
    }
  }

  return items;
}

// ── Recalculation after skip ──

/** Recalculate daily amount for remaining content (spread mode) */
export function recalculateSpread(
  masechetIds: string[],
  unit: LearningUnit,
  newPosition: number,
  targetDate: string,
  frequency: ScheduleFrequency,
): number {
  const totalUnits = getMultiMasechetTotalUnits(masechetIds, unit);
  const remaining = totalUnits - newPosition;
  if (remaining <= 0) return 1;

  const today = new Date();
  const endDate = new Date(targetDate);
  const learningDays = countLearningDays(today, endDate, frequency);
  const reviewDays = frequency.reviewEvery
    ? Math.floor(learningDays / (frequency.reviewEvery + 1))
    : 0;
  const actual = learningDays - reviewDays;

  return Math.ceil(remaining / Math.max(actual, 1));
}

/** Convert number to Hebrew gematria letters */
export function gematriya(num: number): string {
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];

  if (num <= 0) return '';
  if (num === 15) return 'ט"ו';
  if (num === 16) return 'ט"ז';

  let result = '';
  let n = num;
  if (n >= 100) {
    const hundreds = Math.floor(n / 100);
    const hundredLetters = ['', 'ק', 'ר', 'ש', 'ת'];
    result += hundredLetters[hundreds] || 'ת';
    n %= 100;
  }

  const ten = Math.floor(n / 10);
  const one = n % 10;
  result += tens[ten] + ones[one];

  if (result.length > 1) {
    result = result.slice(0, -1) + '"' + result.slice(-1);
  } else if (result.length === 1) {
    result += "'";
  }

  return result;
}
