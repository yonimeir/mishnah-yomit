const BASE_URL = 'https://www.sefaria.org/api/v3/texts';

export interface SefariaTextResponse {
  versions: {
    text: string[] | string;
    versionTitle: string;
    language: string;
  }[];
  heRef: string;
  sectionRef: string;
}

export interface MishnahText {
  hebrew: string[];
  heRef: string;
}

// Cache for fetched texts
const textCache = new Map<string, MishnahText>();

function sefariaRefToUrl(ref: string): string {
  // "Mishnah Berakhot 1:1" -> "Mishnah_Berakhot.1.1"
  return ref
    .replace(/ (\d)/g, '.$1')
    .replace(/:/g, '.')
    .replace(/ /g, '_');
}

async function fetchSefariaText(sefariaRef: string): Promise<MishnahText> {
  const cached = textCache.get(sefariaRef);
  if (cached) return cached;

  const urlRef = sefariaRefToUrl(sefariaRef);
  const response = await fetch(`${BASE_URL}/${urlRef}?version=hebrew|all`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${sefariaRef}: ${response.statusText}`);
  }

  const data: SefariaTextResponse = await response.json();

  const hebrewVersion = data.versions.find(v => v.language === 'he');
  const textArray = hebrewVersion
    ? (Array.isArray(hebrewVersion.text) ? hebrewVersion.text : [hebrewVersion.text])
    : [];

  const result: MishnahText = {
    hebrew: textArray,
    heRef: data.heRef || sefariaRef,
  };

  textCache.set(sefariaRef, result);
  return result;
}

/** Fetch a single mishnah or an entire chapter */
export const fetchMishnahText = fetchSefariaText;
export const fetchChapter = fetchSefariaText;

/** Fetch commentary for a mishnah */
export async function fetchCommentary(
  sefariaRef: string,
  commentator: string = 'Bartenura'
): Promise<MishnahText> {
  // Commentary ref: "Bartenura on Mishnah Berakhot 1:1"
  const commentaryRef = `${commentator} on ${sefariaRef}`;
  const cached = textCache.get(commentaryRef);
  if (cached) return cached;

  const urlRef = sefariaRefToUrl(commentaryRef);
  const response = await fetch(`${BASE_URL}/${urlRef}?version=hebrew|all`);

  if (!response.ok) {
    // Commentary might not exist for every mishnah
    return { hebrew: [], heRef: commentaryRef };
  }

  const data: SefariaTextResponse = await response.json();

  const hebrewVersion = data.versions.find(v => v.language === 'he');
  const textArray = hebrewVersion
    ? (Array.isArray(hebrewVersion.text) ? hebrewVersion.text : [hebrewVersion.text])
    : [];

  const result: MishnahText = {
    hebrew: textArray,
    heRef: data.heRef || commentaryRef,
  };

  textCache.set(commentaryRef, result);
  return result;
}

import type { ContentType } from '../data/mishnah-structure';

export const MISHNAH_COMMENTATORS = [
  { id: 'bartenura', name: 'ברטנורא', sefariaName: 'Bartenura' },
  { id: 'tosafot_yom_tov', name: 'תוספות יום טוב', sefariaName: 'Tosafot Yom Tov' },
  { id: 'rambam', name: 'רמב"ם', sefariaName: 'Rambam' },
] as const;

export const GEMARA_COMMENTATORS = [
  { id: 'rashi', name: 'רש"י', sefariaName: 'Rashi' },
  { id: 'tosafot', name: 'תוספות', sefariaName: 'Tosafot' },
] as const;

export const RAMBAM_COMMENTATORS = [
  { id: 'kessef_mishneh', name: 'כסף משנה', sefariaName: 'Kessef Mishneh' },
] as const;

export const COMMENTATORS = MISHNAH_COMMENTATORS;

export function getCommentatorsForType(type: ContentType) {
  switch (type) {
    case 'mishnah': return MISHNAH_COMMENTATORS;
    case 'gemara': return GEMARA_COMMENTATORS;
    case 'rambam': return RAMBAM_COMMENTATORS;
  }
}

/** Pre-fetch next lessons for offline use */
export async function prefetchLessons(refs: string[]): Promise<void> {
  const promises = refs.map(ref =>
    fetchChapter(ref).catch(() => null) // Silently fail for prefetch
  );
  await Promise.allSettled(promises);
}
