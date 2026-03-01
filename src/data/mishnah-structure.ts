import { GEMARA_STRUCTURE } from './gemara-structure';
import { RAMBAM_STRUCTURE } from './rambam-structure';
import { gematriya } from '../services/scheduler';

export interface Masechet {
  id: string;
  name: string;
  sefariaName: string;
  chapters: number[];
  startDaf?: number;
}

export interface Seder {
  id: string;
  name: string;
  masechtot: Masechet[];
}

export type ContentType = 'mishnah' | 'gemara' | 'rambam';

function getAllStructures(): Seder[][] {
  return [MISHNAH_STRUCTURE, GEMARA_STRUCTURE, RAMBAM_STRUCTURE];
}

export function getContentType(masechetId: string): ContentType {
  if (masechetId.startsWith('g_')) return 'gemara';
  if (masechetId.startsWith('r_')) return 'rambam';
  return 'mishnah';
}

export function getStructureForType(type: ContentType): Seder[] {
  switch (type) {
    case 'mishnah': return MISHNAH_STRUCTURE;
    case 'gemara': return GEMARA_STRUCTURE;
    case 'rambam': return RAMBAM_STRUCTURE;
  }
}

export function getContentTypeLabels(type: ContentType) {
  switch (type) {
    case 'mishnah': return {
      name: 'משנה',
      unitSingular: 'משנה', unitPlural: 'משניות',
      chapterSingular: 'פרק', chapterPlural: 'פרקים',
      bookSingular: 'מסכת', bookPlural: 'מסכתות',
      orderSingular: 'סדר', orderPlural: 'סדרים',
      allName: 'ש"ס משנה',
    };
    case 'gemara': return {
      name: 'גמרא',
      unitSingular: 'עמוד', unitPlural: 'עמודים',
      chapterSingular: 'דף', chapterPlural: 'דפים',
      bookSingular: 'מסכת', bookPlural: 'מסכתות',
      orderSingular: 'סדר', orderPlural: 'סדרים',
      allName: 'ש"ס',
    };
    case 'rambam': return {
      name: 'רמב"ם',
      unitSingular: 'הלכה', unitPlural: 'הלכות',
      chapterSingular: 'פרק', chapterPlural: 'פרקים',
      bookSingular: 'הלכות', bookPlural: 'חלקים',
      orderSingular: 'ספר', orderPlural: 'ספרים',
      allName: 'משנה תורה',
    };
  }
}

/** Get the display label for a unit type based on content type */
export function getUnitLabel(type: ContentType, unit: LearningUnit, plural = true): string {
  const labels = getContentTypeLabels(type);
  if (unit === 'mishnah') return plural ? labels.unitPlural : labels.unitSingular;
  return plural ? labels.chapterPlural : labels.chapterSingular;
}

/** Generate Sefaria reference for Gemara daf */
export function getGemaraDafRef(masechet: Masechet, chapterIndex: number): string {
  const startDaf = masechet.startDaf ?? 2;
  const dafNumber = startDaf + chapterIndex;
  return `${masechet.sefariaName} ${dafNumber}`;
}

/** Generate Sefaria reference for Gemara amud */
export function getGemaraAmudRef(masechet: Masechet, chapterIndex: number, amudIndex: number): string {
  const startDaf = masechet.startDaf ?? 2;
  const dafNumber = startDaf + chapterIndex;
  if (masechet.chapters[chapterIndex] === 1) {
    return `${masechet.sefariaName} ${dafNumber}b`;
  }
  const amud = amudIndex === 0 ? 'a' : 'b';
  return `${masechet.sefariaName} ${dafNumber}${amud}`;
}

/** Convert daf number to Hebrew display (e.g., "ב" for daf 2) */
export function dafToDisplay(masechet: Masechet, chapterIndex: number): string {
  const startDaf = masechet.startDaf ?? 2;
  return gematriya(startDaf + chapterIndex);
}

/** Format a single global position point for a Gemara plan into "דף ב." */
export function formatGemaraPoint(masechet: Masechet, amudIndex: number): string {
  const ref = indexToRef(masechet, amudIndex);
  const daf = dafToDisplay(masechet, ref.chapter - 1);
  const amudSymbol = ref.mishnah === 1 ? '.' : ':';
  return `דף ${daf}${amudSymbol}`;
}

/** Format a daily learning item for a Gemara plan into "דף ב." or "דף ב" (full page) */
export function formatGemaraItem(masechet: Masechet | undefined, chapter: number, fromAmud: number, toAmud: number): string {
  if (!masechet) return `דף ${gematriya(chapter + 1)}`; // fallback
  const daf = dafToDisplay(masechet, chapter - 1);

  if (fromAmud === 1 && toAmud === 1) {
    return `דף ${daf}.`;
  } else if (fromAmud === 2 && toAmud === 2) {
    return `דף ${daf}:`;
  } else if (fromAmud === 1 && toAmud === 2) {
    return `דף ${daf}`; // complete daf
  } else {
    // Spans multiple dafim (less common for a single item, but just in case)
    return `דף ${daf}`;
  }
}

export const MISHNAH_STRUCTURE: Seder[] = [
  {
    id: 'zeraim',
    name: 'זרעים',
    masechtot: [
      { id: 'berakhot', name: 'ברכות', sefariaName: 'Mishnah Berakhot', chapters: [5, 8, 6, 7, 5, 8, 5, 8, 5] },
      { id: 'peah', name: 'פאה', sefariaName: 'Mishnah Peah', chapters: [6, 8, 8, 11, 8, 11, 8, 9] },
      { id: 'demai', name: 'דמאי', sefariaName: 'Mishnah Demai', chapters: [4, 5, 6, 7, 11, 12, 8] },
      { id: 'kilayim', name: 'כלאים', sefariaName: 'Mishnah Kilayim', chapters: [9, 11, 7, 9, 8, 9, 8, 6, 10] },
      { id: 'sheviit', name: 'שביעית', sefariaName: 'Mishnah Sheviit', chapters: [8, 10, 10, 10, 9, 6, 7, 11, 9, 9] },
      { id: 'terumot', name: 'תרומות', sefariaName: 'Mishnah Terumot', chapters: [10, 6, 9, 13, 9, 6, 7, 12, 7, 12, 10] },
      { id: 'maaserot', name: 'מעשרות', sefariaName: 'Mishnah Maaserot', chapters: [8, 8, 10, 6, 8] },
      { id: 'maaser_sheni', name: 'מעשר שני', sefariaName: 'Mishnah Maaser Sheni', chapters: [7, 10, 13, 12, 15] },
      { id: 'challah', name: 'חלה', sefariaName: 'Mishnah Challah', chapters: [9, 8, 10, 11] },
      { id: 'orlah', name: 'ערלה', sefariaName: 'Mishnah Orlah', chapters: [9, 17, 9] },
      { id: 'bikkurim', name: 'ביכורים', sefariaName: 'Mishnah Bikkurim', chapters: [11, 11, 12, 5] },
    ],
  },
  {
    id: 'moed',
    name: 'מועד',
    masechtot: [
      { id: 'shabbat', name: 'שבת', sefariaName: 'Mishnah Shabbat', chapters: [11, 7, 6, 2, 4, 10, 4, 7, 7, 6, 6, 6, 7, 4, 3, 8, 8, 3, 6, 5, 3, 6, 5, 5] },
      { id: 'eruvin', name: 'עירובין', sefariaName: 'Mishnah Eruvin', chapters: [10, 6, 9, 11, 9, 10, 11, 11, 4, 15] },
      { id: 'pesachim', name: 'פסחים', sefariaName: 'Mishnah Pesachim', chapters: [7, 8, 8, 9, 10, 6, 13, 8, 11, 9] },
      { id: 'shekalim', name: 'שקלים', sefariaName: 'Mishnah Shekalim', chapters: [7, 5, 4, 9, 6, 6, 7, 8] },
      { id: 'yoma', name: 'יומא', sefariaName: 'Mishnah Yoma', chapters: [8, 7, 11, 6, 7, 8, 5, 9] },
      { id: 'sukkah', name: 'סוכה', sefariaName: 'Mishnah Sukkah', chapters: [11, 9, 15, 10, 8] },
      { id: 'beitzah', name: 'ביצה', sefariaName: 'Mishnah Beitzah', chapters: [10, 10, 8, 7, 7] },
      { id: 'rosh_hashanah', name: 'ראש השנה', sefariaName: 'Mishnah Rosh Hashanah', chapters: [9, 9, 8, 9] },
      { id: 'taanit', name: 'תענית', sefariaName: 'Mishnah Taanit', chapters: [7, 10, 9, 8] },
      { id: 'megillah', name: 'מגילה', sefariaName: 'Mishnah Megillah', chapters: [11, 6, 6, 10] },
      { id: 'moed_katan', name: 'מועד קטן', sefariaName: 'Mishnah Moed Katan', chapters: [10, 5, 9] },
      { id: 'chagigah', name: 'חגיגה', sefariaName: 'Mishnah Chagigah', chapters: [8, 7, 8] },
    ],
  },
  {
    id: 'nashim',
    name: 'נשים',
    masechtot: [
      { id: 'yevamot', name: 'יבמות', sefariaName: 'Mishnah Yevamot', chapters: [4, 10, 10, 13, 6, 6, 6, 6, 6, 9, 7, 6, 13, 9, 10, 7] },
      { id: 'ketubot', name: 'כתובות', sefariaName: 'Mishnah Ketubot', chapters: [10, 10, 9, 12, 9, 7, 10, 8, 9, 6, 6, 4, 11] },
      { id: 'nedarim', name: 'נדרים', sefariaName: 'Mishnah Nedarim', chapters: [4, 5, 11, 8, 6, 10, 9, 7, 10, 8, 12] },
      { id: 'nazir', name: 'נזיר', sefariaName: 'Mishnah Nazir', chapters: [7, 10, 7, 7, 7, 11, 4, 2, 5] },
      { id: 'sotah', name: 'סוטה', sefariaName: 'Mishnah Sotah', chapters: [9, 6, 8, 5, 5, 4, 8, 7, 15] },
      { id: 'gittin', name: 'גיטין', sefariaName: 'Mishnah Gittin', chapters: [6, 7, 8, 9, 9, 7, 9, 10, 10] },
      { id: 'kiddushin', name: 'קידושין', sefariaName: 'Mishnah Kiddushin', chapters: [10, 10, 13, 14] },
    ],
  },
  {
    id: 'nezikin',
    name: 'נזיקין',
    masechtot: [
      { id: 'bava_kamma', name: 'בבא קמא', sefariaName: 'Mishnah Bava Kamma', chapters: [4, 6, 11, 9, 7, 6, 7, 7, 12, 10] },
      { id: 'bava_metzia', name: 'בבא מציעא', sefariaName: 'Mishnah Bava Metzia', chapters: [8, 11, 12, 12, 11, 8, 11, 9, 13, 6] },
      { id: 'bava_batra', name: 'בבא בתרא', sefariaName: 'Mishnah Bava Batra', chapters: [6, 14, 8, 9, 11, 8, 4, 8, 10, 8] },
      { id: 'sanhedrin', name: 'סנהדרין', sefariaName: 'Mishnah Sanhedrin', chapters: [6, 5, 8, 5, 5, 6, 11, 7, 6, 6, 6] },
      { id: 'makkot', name: 'מכות', sefariaName: 'Mishnah Makkot', chapters: [10, 8, 16] },
      { id: 'shevuot', name: 'שבועות', sefariaName: 'Mishnah Shevuot', chapters: [7, 5, 11, 13, 5, 7, 8, 6] },
      { id: 'eduyot', name: 'עדויות', sefariaName: 'Mishnah Eduyot', chapters: [14, 10, 12, 12, 7, 3, 9, 7] },
      { id: 'avodah_zarah', name: 'עבודה זרה', sefariaName: 'Mishnah Avodah Zarah', chapters: [9, 7, 10, 12, 12] },
      { id: 'avot', name: 'אבות', sefariaName: 'Pirkei Avot', chapters: [18, 16, 18, 22, 23, 11] },
      { id: 'horayot', name: 'הוריות', sefariaName: 'Mishnah Horayot', chapters: [5, 7, 8] },
    ],
  },
  {
    id: 'kodashim',
    name: 'קדשים',
    masechtot: [
      { id: 'zevachim', name: 'זבחים', sefariaName: 'Mishnah Zevachim', chapters: [4, 5, 6, 6, 8, 7, 6, 12, 7, 8, 8, 6, 8, 10] },
      { id: 'menachot', name: 'מנחות', sefariaName: 'Mishnah Menachot', chapters: [4, 5, 7, 5, 9, 7, 6, 7, 9, 9, 9, 5, 11] },
      { id: 'chullin', name: 'חולין', sefariaName: 'Mishnah Chullin', chapters: [7, 10, 7, 7, 5, 7, 6, 6, 8, 4, 2, 5] },
      { id: 'bekhorot', name: 'בכורות', sefariaName: 'Mishnah Bekhorot', chapters: [7, 9, 4, 10, 6, 12, 7, 10, 8] },
      { id: 'arakhin', name: 'ערכין', sefariaName: 'Mishnah Arakhin', chapters: [4, 6, 5, 4, 6, 5, 5, 7, 8] },
      { id: 'temurah', name: 'תמורה', sefariaName: 'Mishnah Temurah', chapters: [6, 3, 5, 4, 6, 5, 6] },
      { id: 'keritot', name: 'כריתות', sefariaName: 'Mishnah Keritot', chapters: [7, 6, 10, 3, 8, 9] },
      { id: 'meilah', name: 'מעילה', sefariaName: 'Mishnah Meilah', chapters: [4, 9, 8, 6, 5, 6] },
      { id: 'tamid', name: 'תמיד', sefariaName: 'Mishnah Tamid', chapters: [4, 5, 9, 3, 6, 3, 4] },
      { id: 'middot', name: 'מידות', sefariaName: 'Mishnah Middot', chapters: [9, 6, 8, 7, 4] },
      { id: 'kinnim', name: 'קינים', sefariaName: 'Mishnah Kinnim', chapters: [4, 5, 6] },
    ],
  },
  {
    id: 'tahorot',
    name: 'טהרות',
    masechtot: [
      { id: 'kelim', name: 'כלים', sefariaName: 'Mishnah Kelim', chapters: [9, 8, 8, 4, 11, 4, 6, 11, 8, 8, 9, 8, 8, 8, 6, 8, 17, 9, 10, 7, 3, 10, 5, 17, 9, 9, 12, 10, 8, 4] },
      { id: 'oholot', name: 'אהלות', sefariaName: 'Mishnah Oholot', chapters: [8, 7, 7, 3, 7, 7, 6, 6, 16, 7, 9, 8, 6, 7, 10, 5, 5, 10] },
      { id: 'negaim', name: 'נגעים', sefariaName: 'Mishnah Negaim', chapters: [6, 5, 8, 11, 5, 8, 5, 10, 3, 10, 12, 7, 12, 13] },
      { id: 'parah', name: 'פרה', sefariaName: 'Mishnah Parah', chapters: [4, 5, 11, 4, 9, 5, 12, 11, 9, 6, 9, 11] },
      { id: 'tahorot_m', name: 'טהרות', sefariaName: 'Mishnah Tahorot', chapters: [9, 8, 8, 13, 9, 10, 9, 9, 9, 8] },
      { id: 'mikvaot', name: 'מקוואות', sefariaName: 'Mishnah Mikvaot', chapters: [8, 10, 4, 5, 6, 11, 7, 5, 7, 8] },
      { id: 'niddah', name: 'נידה', sefariaName: 'Mishnah Niddah', chapters: [7, 7, 7, 7, 9, 14, 5, 4, 11, 8] },
      { id: 'makhshirin', name: 'מכשירין', sefariaName: 'Mishnah Makhshirin', chapters: [6, 11, 8, 10, 11, 8] },
      { id: 'zavim', name: 'זבים', sefariaName: 'Mishnah Zavim', chapters: [6, 4, 3, 7, 12] },
      { id: 'tevul_yom', name: 'טבול יום', sefariaName: 'Mishnah Tevul Yom', chapters: [5, 8, 6, 7] },
      { id: 'yadayim', name: 'ידיים', sefariaName: 'Mishnah Yadayim', chapters: [5, 4, 5, 8] },
      { id: 'uktzin', name: 'עוקצין', sefariaName: 'Mishnah Oktzin', chapters: [6, 10, 12] },
    ],
  },
];

// Helper functions

export function getMasechet(masechetId: string): Masechet | undefined {
  for (const structure of getAllStructures()) {
    for (const seder of structure) {
      const m = seder.masechtot.find(m => m.id === masechetId);
      if (m) return m;
    }
  }
  return undefined;
}

export function getSederForMasechet(masechetId: string): Seder | undefined {
  for (const structure of getAllStructures()) {
    const seder = structure.find(s => s.masechtot.some(m => m.id === masechetId));
    if (seder) return seder;
  }
  return undefined;
}

export function getTotalMishnayot(masechet: Masechet): number {
  return masechet.chapters.reduce((sum, count) => sum + count, 0);
}

export function getTotalChapters(masechet: Masechet): number {
  return masechet.chapters.length;
}

export function getAllMasechtot(type?: ContentType): Masechet[] {
  if (type) return getStructureForType(type).flatMap(s => s.masechtot);
  return getAllStructures().flatMap(structures => structures.flatMap(s => s.masechtot));
}

/** Convert a flat mishnah index (0-based) to chapter:mishnah (1-based) */
export function indexToRef(masechet: Masechet, flatIndex: number): { chapter: number; mishnah: number } {
  let remaining = flatIndex;
  for (let ch = 0; ch < masechet.chapters.length; ch++) {
    if (remaining < masechet.chapters[ch]) {
      return { chapter: ch + 1, mishnah: remaining + 1 };
    }
    remaining -= masechet.chapters[ch];
  }
  // Past the end - return last mishnah
  const lastCh = masechet.chapters.length;
  return { chapter: lastCh, mishnah: masechet.chapters[lastCh - 1] };
}

/** Convert chapter:mishnah (1-based) to flat index (0-based) */
export function refToIndex(masechet: Masechet, chapter: number, mishnah: number): number {
  let index = 0;
  for (let ch = 0; ch < chapter - 1; ch++) {
    index += masechet.chapters[ch];
  }
  return index + mishnah - 1;
}

/** Get Sefaria API reference string for a specific mishnah */
export function getSefariaRef(masechet: Masechet, chapter: number, mishnah: number): string {
  return `${masechet.sefariaName} ${chapter}:${mishnah}`;
}

/** Get Sefaria API reference for an entire chapter */
export function getSefariaChapterRef(masechet: Masechet, chapter: number): string {
  return `${masechet.sefariaName} ${chapter}`;
}

// ── Multi-masechet helpers ──

export type LearningUnit = 'mishnah' | 'perek';

/** Get total units (mishnayot or chapters) for a single masechet */
export function getMasechetUnits(masechet: Masechet, unit: LearningUnit): number {
  return unit === 'mishnah' ? getTotalMishnayot(masechet) : getTotalChapters(masechet);
}

/** Get total units across multiple masechtot */
export function getMultiMasechetTotalUnits(masechetIds: string[], unit: LearningUnit): number {
  return masechetIds.reduce((sum, id) => {
    const m = getMasechet(id);
    return sum + (m ? getMasechetUnits(m, unit) : 0);
  }, 0);
}

/** Convert a global flat position to { masechetIdx, masechet, positionInMasechet } */
export function globalToLocal(
  masechetIds: string[],
  globalPosition: number,
  unit: LearningUnit
): { masechetIdx: number; masechet: Masechet; positionInMasechet: number } | null {
  let remaining = globalPosition;
  for (let i = 0; i < masechetIds.length; i++) {
    const m = getMasechet(masechetIds[i]);
    if (!m) continue;
    const units = getMasechetUnits(m, unit);
    if (remaining < units) {
      return { masechetIdx: i, masechet: m, positionInMasechet: remaining };
    }
    remaining -= units;
  }
  // Past the end → last masechet, at the end
  const lastId = masechetIds[masechetIds.length - 1];
  const lastM = getMasechet(lastId);
  if (!lastM) return null;
  return {
    masechetIdx: masechetIds.length - 1,
    masechet: lastM,
    positionInMasechet: getMasechetUnits(lastM, unit),
  };
}

/** Convert local position to global */
export function localToGlobal(
  masechetIds: string[],
  masechetIdx: number,
  positionInMasechet: number,
  unit: LearningUnit
): number {
  let global = 0;
  for (let i = 0; i < masechetIdx; i++) {
    const m = getMasechet(masechetIds[i]);
    if (m) global += getMasechetUnits(m, unit);
  }
  return global + positionInMasechet;
}

/** Get a display name for a set of masechet IDs */
export function getPlanDisplayName(masechetIds: string[]): string {
  if (masechetIds.length === 0) return '';

  const contentType = getContentType(masechetIds[0]);
  const labels = getContentTypeLabels(contentType);
  const structure = getStructureForType(contentType);

  const allIds = structure.flatMap(s => s.masechtot.map(m => m.id));
  if (masechetIds.length === allIds.length && masechetIds.every(id => allIds.includes(id))) {
    return labels.allName;
  }

  for (const seder of structure) {
    const sederIds = seder.masechtot.map(m => m.id);
    if (masechetIds.length === sederIds.length && sederIds.every(id => masechetIds.includes(id))) {
      return `${labels.orderSingular} ${seder.name}`;
    }
  }

  if (masechetIds.length === 1) {
    const m = getMasechet(masechetIds[0]);
    if (!m) return '';
    if (contentType === 'rambam') return `הלכות ${m.name}`;
    return `${labels.bookSingular} ${m.name}`;
  }

  const names = masechetIds.slice(0, 3).map(id => getMasechet(id)?.name).filter(Boolean);
  const suffix = masechetIds.length > 3 ? ` (+${masechetIds.length - 3})` : '';
  return names.join(', ') + suffix;
}

/** Get all masechet IDs for a seder */
export function getSederMasechetIds(sederId: string): string[] {
  for (const structure of getAllStructures()) {
    const seder = structure.find(s => s.id === sederId);
    if (seder) return seder.masechtot.map(m => m.id);
  }
  return [];
}

/** Get all masechet IDs for a content type (defaults to mishnah) */
export function getAllMasechetIds(type: ContentType = 'mishnah'): string[] {
  return getAllMasechtot(type).map(m => m.id);
}
