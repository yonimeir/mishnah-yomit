const fs = require('fs');

const genArray = (count) => new Array(count).fill(1);

const TANAKH_STRUCTURE = [
  {
    id: 'torah',
    name: 'תורה',
    masechtot: [
      { id: 't_genesis', name: 'בראשית', sefariaName: 'Genesis', chapters: genArray(50) },
      { id: 't_exodus', name: 'שמות', sefariaName: 'Exodus', chapters: genArray(40) },
      { id: 't_leviticus', name: 'ויקרא', sefariaName: 'Leviticus', chapters: genArray(27) },
      { id: 't_numbers', name: 'במדבר', sefariaName: 'Numbers', chapters: genArray(36) },
      { id: 't_deuteronomy', name: 'דברים', sefariaName: 'Deuteronomy', chapters: genArray(34) },
    ]
  },
  {
    id: 'neviim',
    name: 'נביאים',
    masechtot: [
      { id: 't_joshua', name: 'יהושע', sefariaName: 'Joshua', chapters: genArray(24) },
      { id: 't_judges', name: 'שופטים', sefariaName: 'Judges', chapters: genArray(21) },
      { id: 't_1samuel', name: 'שמואל א', sefariaName: 'I Samuel', chapters: genArray(31) },
      { id: 't_2samuel', name: 'שמואל ב', sefariaName: 'II Samuel', chapters: genArray(24) },
      { id: 't_1kings', name: 'מלכים א', sefariaName: 'I Kings', chapters: genArray(22) },
      { id: 't_2kings', name: 'מלכים ב', sefariaName: 'II Kings', chapters: genArray(25) },
      { id: 't_isaiah', name: 'ישעיהו', sefariaName: 'Isaiah', chapters: genArray(66) },
      { id: 't_jeremiah', name: 'ירמיהו', sefariaName: 'Jeremiah', chapters: genArray(52) },
      { id: 't_ezekiel', name: 'יחזקאל', sefariaName: 'Ezekiel', chapters: genArray(48) },
      { id: 't_hosea', name: 'הושע', sefariaName: 'Hosea', chapters: genArray(14) },
      { id: 't_joel', name: 'יואל', sefariaName: 'Joel', chapters: genArray(4) },
      { id: 't_amos', name: 'עמוס', sefariaName: 'Amos', chapters: genArray(9) },
      { id: 't_obadiah', name: 'עובדיה', sefariaName: 'Obadiah', chapters: genArray(1) },
      { id: 't_jonah', name: 'יונה', sefariaName: 'Jonah', chapters: genArray(4) },
      { id: 't_micah', name: 'מיכה', sefariaName: 'Micah', chapters: genArray(7) },
      { id: 't_nahum', name: 'נחום', sefariaName: 'Nahum', chapters: genArray(3) },
      { id: 't_habakkuk', name: 'חבקוק', sefariaName: 'Habakkuk', chapters: genArray(3) },
      { id: 't_zephaniah', name: 'צפניה', sefariaName: 'Zephaniah', chapters: genArray(3) },
      { id: 't_haggai', name: 'חגי', sefariaName: 'Haggai', chapters: genArray(2) },
      { id: 't_zechariah', name: 'זכריה', sefariaName: 'Zechariah', chapters: genArray(14) },
      { id: 't_malachi', name: 'מלאכי', sefariaName: 'Malachi', chapters: genArray(3) },
    ]
  },
  {
    id: 'ketuvim',
    name: 'כתובים',
    masechtot: [
      { id: 't_psalms', name: 'תהילים', sefariaName: 'Psalms', chapters: genArray(150) },
      { id: 't_proverbs', name: 'משלי', sefariaName: 'Proverbs', chapters: genArray(31) },
      { id: 't_job', name: 'איוב', sefariaName: 'Job', chapters: genArray(42) },
      { id: 't_songofsongs', name: 'שיר השירים', sefariaName: 'Song of Songs', chapters: genArray(8) },
      { id: 't_ruth', name: 'רות', sefariaName: 'Ruth', chapters: genArray(4) },
      { id: 't_lamentations', name: 'איכה', sefariaName: 'Lamentations', chapters: genArray(5) },
      { id: 't_ecclesiastes', name: 'קהלת', sefariaName: 'Ecclesiastes', chapters: genArray(12) },
      { id: 't_esther', name: 'אסתר', sefariaName: 'Esther', chapters: genArray(10) },
      { id: 't_daniel', name: 'דניאל', sefariaName: 'Daniel', chapters: genArray(12) },
      { id: 't_ezra', name: 'עזרא', sefariaName: 'Ezra', chapters: genArray(10) },
      { id: 't_nehemiah', name: 'נחמיה', sefariaName: 'Nehemiah', chapters: genArray(13) },
      { id: 't_1chronicles', name: 'דברי הימים א', sefariaName: 'I Chronicles', chapters: genArray(29) },
      { id: 't_2chronicles', name: 'דברי הימים ב', sefariaName: 'II Chronicles', chapters: genArray(36) },
    ]
  }
];

const PARASHOT_STRUCTURE = [
  {
    id: 'parashot_genesis',
    name: 'ספר בראשית (לפי פרשות)',
    masechtot: [
      { id: 'p_bereshit', name: 'בראשית', sefariaName: 'Parashat Bereshit', chapters: genArray(7) },
      { id: 'p_noach', name: 'נח', sefariaName: 'Parashat Noach', chapters: genArray(7) },
      { id: 'p_lekh_lekha', name: 'לך לך', sefariaName: 'Parashat Lekh Lekha', chapters: genArray(7) },
      { id: 'p_vayera', name: 'וירא', sefariaName: 'Parashat Vayera', chapters: genArray(7) },
      { id: 'p_chayei_sara', name: 'חיי שרה', sefariaName: 'Parashat Chayei Sara', chapters: genArray(7) },
      { id: 'p_toldot', name: 'תולדות', sefariaName: 'Parashat Toldot', chapters: genArray(7) },
      { id: 'p_vayetzei', name: 'ויצא', sefariaName: 'Parashat Vayetzei', chapters: genArray(7) },
      { id: 'p_vayishlach', name: 'וישלח', sefariaName: 'Parashat Vayishlach', chapters: genArray(7) },
      { id: 'p_vayeshev', name: 'וישב', sefariaName: 'Parashat Vayeshev', chapters: genArray(7) },
      { id: 'p_miketz', name: 'מקץ', sefariaName: 'Parashat Miketz', chapters: genArray(7) },
      { id: 'p_vayigash', name: 'ויגש', sefariaName: 'Parashat Vayigash', chapters: genArray(7) },
      { id: 'p_vayechi', name: 'ויחי', sefariaName: 'Parashat Vayechi', chapters: genArray(7) },
    ]
  },
  {
    id: 'parashot_exodus',
    name: 'ספר שמות (לפי פרשות)',
    masechtot: [
      { id: 'p_shemot', name: 'שמות', sefariaName: 'Parashat Shemot', chapters: genArray(7) },
      { id: 'p_vaera', name: 'וארא', sefariaName: 'Parashat Vaera', chapters: genArray(7) },
      { id: 'p_bo', name: 'בא', sefariaName: 'Parashat Bo', chapters: genArray(7) },
      { id: 'p_beshalach', name: 'בשלח', sefariaName: 'Parashat Beshalach', chapters: genArray(7) },
      { id: 'p_yitro', name: 'יתרו', sefariaName: 'Parashat Yitro', chapters: genArray(7) },
      { id: 'p_mishpatim', name: 'משפטים', sefariaName: 'Parashat Mishpatim', chapters: genArray(7) },
      { id: 'p_terumah', name: 'תרומה', sefariaName: 'Parashat Terumah', chapters: genArray(7) },
      { id: 'p_tetzaveh', name: 'תצוה', sefariaName: 'Parashat Tetzaveh', chapters: genArray(7) },
      { id: 'p_ki_tisa', name: 'כי תשא', sefariaName: 'Parashat Ki Tisa', chapters: genArray(7) },
      { id: 'p_vayakhel', name: 'ויקהל', sefariaName: 'Parashat Vayakhel', chapters: genArray(7) },
      { id: 'p_pekudei', name: 'פקודי', sefariaName: 'Parashat Pekudei', chapters: genArray(7) },
    ]
  },
  {
    id: 'parashot_leviticus',
    name: 'ספר ויקרא (לפי פרשות)',
    masechtot: [
      { id: 'p_vayikra', name: 'ויקרא', sefariaName: 'Parashat Vayikra', chapters: genArray(7) },
      { id: 'p_tzav', name: 'צו', sefariaName: 'Parashat Tzav', chapters: genArray(7) },
      { id: 'p_shmini', name: 'שמיני', sefariaName: 'Parashat Shmini', chapters: genArray(7) },
      { id: 'p_tazria', name: 'תזריע', sefariaName: 'Parashat Tazria', chapters: genArray(7) },
      { id: 'p_metzora', name: 'מצורע', sefariaName: 'Parashat Metzora', chapters: genArray(7) },
      { id: 'p_acharei_mot', name: 'אחרי מות', sefariaName: 'Parashat Acharei Mot', chapters: genArray(7) },
      { id: 'p_kedoshim', name: 'קדושים', sefariaName: 'Parashat Kedoshim', chapters: genArray(7) },
      { id: 'p_emor', name: 'אמור', sefariaName: 'Parashat Emor', chapters: genArray(7) },
      { id: 'p_behar', name: 'בהר', sefariaName: 'Parashat Behar', chapters: genArray(7) },
      { id: 'p_bechukotai', name: 'בחוקותי', sefariaName: 'Parashat Bechukotai', chapters: genArray(7) },
    ]
  },
  {
    id: 'parashot_numbers',
    name: 'ספר במדבר (לפי פרשות)',
    masechtot: [
      { id: 'p_bamidbar', name: 'במדבר', sefariaName: 'Parashat Bamidbar', chapters: genArray(7) },
      { id: 'p_nasso', name: 'נשא', sefariaName: 'Parashat Nasso', chapters: genArray(7) },
      { id: 'p_behaalotekha', name: 'בהעלותך', sefariaName: 'Parashat Behaalotekha', chapters: genArray(7) },
      { id: 'p_shlach', name: 'שלח', sefariaName: 'Parashat Shlach', chapters: genArray(7) },
      { id: 'p_korach', name: 'קרח', sefariaName: 'Parashat Korach', chapters: genArray(7) },
      { id: 'p_chukat', name: 'חקת', sefariaName: 'Parashat Chukat', chapters: genArray(7) },
      { id: 'p_balak', name: 'בלק', sefariaName: 'Parashat Balak', chapters: genArray(7) },
      { id: 'p_pinchas', name: 'פנחס', sefariaName: 'Parashat Pinchas', chapters: genArray(7) },
      { id: 'p_matot', name: 'מטות', sefariaName: 'Parashat Matot', chapters: genArray(7) },
      { id: 'p_masei', name: 'מסעי', sefariaName: 'Parashat Masei', chapters: genArray(7) },
    ]
  },
  {
    id: 'parashot_deuteronomy',
    name: 'ספר דברים (לפי פרשות)',
    masechtot: [
      { id: 'p_devarim', name: 'דברים', sefariaName: 'Parashat Devarim', chapters: genArray(7) },
      { id: 'p_vaetchanan', name: 'ואתחנן', sefariaName: 'Parashat Vaetchanan', chapters: genArray(7) },
      { id: 'p_ekev', name: 'עקב', sefariaName: 'Parashat Ekev', chapters: genArray(7) },
      { id: 'p_reeh', name: 'ראה', sefariaName: 'Parashat Reeh', chapters: genArray(7) },
      { id: 'p_shoftim', name: 'שופטים', sefariaName: 'Parashat Shoftim', chapters: genArray(7) },
      { id: 'p_ki_tetze', name: 'כי תצא', sefariaName: 'Parashat Ki Tetze', chapters: genArray(7) },
      { id: 'p_ki_tavo', name: 'כי תבוא', sefariaName: 'Parashat Ki Tavo', chapters: genArray(7) },
      { id: 'p_nitzavim', name: 'נצבים', sefariaName: 'Parashat Nitzavim', chapters: genArray(7) },
      { id: 'p_vayelekh', name: 'וילך', sefariaName: 'Parashat Vayelekh', chapters: genArray(7) },
      { id: 'p_haazinu', name: 'האזינו', sefariaName: 'Parashat Haazinu', chapters: genArray(7) },
      { id: 'p_vezot_haberakhah', name: 'וזאת הברכה', sefariaName: 'Parashat Vezot Haberakhah', chapters: genArray(7) },
    ]
  }
];

let output = `import { Seder } from './mishnah-structure';

export const TANAKH_STRUCTURE: Seder[] = ${JSON.stringify(TANAKH_STRUCTURE, null, 2)};

export const PARASHOT_STRUCTURE: Seder[] = ${JSON.stringify(PARASHOT_STRUCTURE, null, 2)};
`;

fs.writeFileSync('src/data/tanakh-structure.ts', output);
