import type { Seder } from './mishnah-structure';

function dafim(n: number): number[] {
  return Array(n).fill(2);
}

export const GEMARA_STRUCTURE: Seder[] = [
  {
    id: 'g_zeraim',
    name: 'זרעים',
    masechtot: [
      { id: 'g_berakhot', name: 'ברכות', sefariaName: 'Berakhot', chapters: dafim(63) },
    ],
  },
  {
    id: 'g_moed',
    name: 'מועד',
    masechtot: [
      { id: 'g_shabbat', name: 'שבת', sefariaName: 'Shabbat', chapters: dafim(156) },
      { id: 'g_eruvin', name: 'עירובין', sefariaName: 'Eruvin', chapters: dafim(104) },
      { id: 'g_pesachim', name: 'פסחים', sefariaName: 'Pesachim', chapters: dafim(120) },
      { id: 'g_yoma', name: 'יומא', sefariaName: 'Yoma', chapters: dafim(87) },
      { id: 'g_sukkah', name: 'סוכה', sefariaName: 'Sukkah', chapters: dafim(55) },
      { id: 'g_beitzah', name: 'ביצה', sefariaName: 'Beitzah', chapters: dafim(39) },
      { id: 'g_rosh_hashanah', name: 'ראש השנה', sefariaName: 'Rosh Hashanah', chapters: dafim(34) },
      { id: 'g_taanit', name: 'תענית', sefariaName: 'Taanit', chapters: dafim(30) },
      { id: 'g_megillah', name: 'מגילה', sefariaName: 'Megillah', chapters: dafim(31) },
      { id: 'g_moed_katan', name: 'מועד קטן', sefariaName: 'Moed Katan', chapters: dafim(28) },
      { id: 'g_chagigah', name: 'חגיגה', sefariaName: 'Chagigah', chapters: dafim(26) },
    ],
  },
  {
    id: 'g_nashim',
    name: 'נשים',
    masechtot: [
      { id: 'g_yevamot', name: 'יבמות', sefariaName: 'Yevamot', chapters: dafim(121) },
      { id: 'g_ketubot', name: 'כתובות', sefariaName: 'Ketubot', chapters: dafim(111) },
      { id: 'g_nedarim', name: 'נדרים', sefariaName: 'Nedarim', chapters: dafim(90) },
      { id: 'g_nazir', name: 'נזיר', sefariaName: 'Nazir', chapters: dafim(65) },
      { id: 'g_sotah', name: 'סוטה', sefariaName: 'Sotah', chapters: dafim(48) },
      { id: 'g_gittin', name: 'גיטין', sefariaName: 'Gittin', chapters: dafim(89) },
      { id: 'g_kiddushin', name: 'קידושין', sefariaName: 'Kiddushin', chapters: dafim(81) },
    ],
  },
  {
    id: 'g_nezikin',
    name: 'נזיקין',
    masechtot: [
      { id: 'g_bava_kamma', name: 'בבא קמא', sefariaName: 'Bava Kamma', chapters: dafim(118) },
      { id: 'g_bava_metzia', name: 'בבא מציעא', sefariaName: 'Bava Metzia', chapters: dafim(118) },
      { id: 'g_bava_batra', name: 'בבא בתרא', sefariaName: 'Bava Batra', chapters: dafim(175) },
      { id: 'g_sanhedrin', name: 'סנהדרין', sefariaName: 'Sanhedrin', chapters: dafim(112) },
      { id: 'g_makkot', name: 'מכות', sefariaName: 'Makkot', chapters: dafim(23) },
      { id: 'g_shevuot', name: 'שבועות', sefariaName: 'Shevuot', chapters: dafim(48) },
      { id: 'g_avodah_zarah', name: 'עבודה זרה', sefariaName: 'Avodah Zarah', chapters: dafim(75) },
      { id: 'g_horayot', name: 'הוריות', sefariaName: 'Horayot', chapters: dafim(13) },
    ],
  },
  {
    id: 'g_kodashim',
    name: 'קדשים',
    masechtot: [
      { id: 'g_zevachim', name: 'זבחים', sefariaName: 'Zevachim', chapters: dafim(119) },
      { id: 'g_menachot', name: 'מנחות', sefariaName: 'Menachot', chapters: dafim(109) },
      { id: 'g_chullin', name: 'חולין', sefariaName: 'Chullin', chapters: dafim(141) },
      { id: 'g_bekhorot', name: 'בכורות', sefariaName: 'Bekhorot', chapters: dafim(60) },
      { id: 'g_arakhin', name: 'ערכין', sefariaName: 'Arakhin', chapters: dafim(33) },
      { id: 'g_temurah', name: 'תמורה', sefariaName: 'Temurah', chapters: dafim(33) },
      { id: 'g_keritot', name: 'כריתות', sefariaName: 'Keritot', chapters: dafim(27) },
      { id: 'g_meilah', name: 'מעילה', sefariaName: 'Meilah', chapters: dafim(21) },
      // Tamid starts at daf 25b (non-standard pagination)
      { id: 'g_tamid', name: 'תמיד', sefariaName: 'Tamid', chapters: [1, ...dafim(8)], startDaf: 25 },
    ],
  },
  {
    id: 'g_taharot',
    name: 'טהרות',
    masechtot: [
      { id: 'g_niddah', name: 'נידה', sefariaName: 'Niddah', chapters: dafim(72) },
    ],
  },
];
